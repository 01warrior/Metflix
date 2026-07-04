import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { findBestTmdbMatch, tmdbPosterUrl, tmdbBackdropUrl, validateTmdbApiKey, getTvDetails } from "@/lib/tmdb";
import { generateAllEmbeds } from "@/lib/embed-providers";

/**
 * POST /api/anime/match-tmdb
 * 
 * Bulk-matches anime without TMDB IDs by searching TMDB API.
 * Also updates poster/backdrop images with TMDB versions.
 * 
 * Query params:
 *   limit: Max items to process (default 50, max 200)
 *   dryRun: "true" to preview without writing
 *   type: "anime" | "manga" | "all" (default: "anime")
 *   updateImages: "true" to also update poster/backdrop for already-matched anime
 */
export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.TMDB_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "TMDB_API_KEY not set in .env. Add it to your environment." },
        { status: 400 }
      );
    }

    const isValid = await validateTmdbApiKey();
    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid TMDB API key" },
        { status: 401 }
      );
    }

    const { searchParams } = request.nextUrl;
    const limit = Math.min(Number(searchParams.get("limit") || 50), 200);
    const dryRun = searchParams.get("dryRun") === "true";
    const type = searchParams.get("type") || "anime";
    const updateImages = searchParams.get("updateImages") === "true";
    const maxEpsParam = Number(searchParams.get("maxEpsPerSeason")) || 0;
    const maxEpsPerSeason = maxEpsParam > 0 ? Math.min(maxEpsParam, 50) : 40;

    // Build where clause
    const where: Record<string, unknown> = {
      status: "published",
      tmdbId: null,
    };
    if (type !== "all") where.type = type;

    // Get items without TMDB IDs
    const items = await db.content.findMany({
      where,
      select: { id: true, title: true, titleFr: true, type: true, seasons: true, year: true },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    if (items.length === 0) {
      return NextResponse.json({
        success: true,
        message: "All content already has TMDB IDs!",
        stats: { processed: 0, matched: 0, errors: 0 },
      });
    }

    let matched = 0;
    let errors = 0;
    let imagesUpdated = 0;
    const results: { title: string; tmdbId: number | null; status: string }[] = [];

    for (const item of items) {
      try {
        const match = await findBestTmdbMatch(item.title, apiKey, item.year);

        if (match) {
          results.push({ title: item.title, tmdbId: match.tmdbId, status: "matched" });

          if (!dryRun) {
            // Update content with TMDB ID + poster/backdrop from TMDB
            const updateData: Record<string, any> = { tmdbId: match.tmdbId };
            if (match.overview) updateData.overview = match.overview;
            if (match.genres) updateData.genres = match.genres;
            if (match.rating) updateData.rating = match.rating;
            if (match.year) updateData.year = match.year;

            // Use TMDB poster if available (higher quality than AniList)
            if (match.posterPath) {
              updateData.posterPath = tmdbPosterUrl(match.posterPath);
              imagesUpdated++;
            }
            if (match.backdropPath) {
              updateData.backdropPath = tmdbBackdropUrl(match.backdropPath);
            }

            await db.content.update({
              where: { id: item.id },
              data: updateData,
            });

            // Generate embeds
            const contentType = item.type as "movie" | "series" | "anime";
            const mediaType = contentType === "movie" ? "movie" : "tv";

            // For series/anime: fetch TV details to get real episode count per season
            let seasonEpisodeCounts: Record<number, number> | undefined;
            if (contentType !== "movie") {
              try {
                const tvDetails = await getTvDetails(match.tmdbId);
                if (tvDetails?.seasons) {
                  seasonEpisodeCounts = {};
                  for (const season of tvDetails.seasons) {
                    if (season.season_number > 0 && season.episode_count > 0) {
                      seasonEpisodeCounts[season.season_number] = season.episode_count;
                    }
                  }
                }
              } catch {
                // Fall back to maxEpsPerSeason
              }
            }

            const embeds = generateAllEmbeds(
              match.tmdbId,
              contentType,
              item.seasons || 1,
              50,
              maxEpsPerSeason,
              undefined,
              seasonEpisodeCounts,
            );

            if (embeds.length > 0) {
              await db.embedSource.deleteMany({ where: { contentId: item.id } });
              await db.embedSource.createMany({
                data: embeds.map((e) => ({ ...e, contentId: item.id })),
              });
            }
          }
          matched++;
        } else {
          results.push({ title: item.title, tmdbId: null, status: "not_found" });
        }

        // Rate limit: 300ms between items (TMDB allows 50/sec but be safe)
        await new Promise((r) => setTimeout(r, 300));
      } catch (err) {
        errors++;
        results.push({ title: item.title, tmdbId: null, status: "error" });
      }
    }

    const remaining = await db.content.count({
      where: { status: "published", tmdbId: null, ...(type !== "all" ? { type } : {}) },
    });

    return NextResponse.json({
      success: true,
      dryRun,
      apiKeyValid: true,
      stats: {
        processed: items.length,
        matched,
        notFound: items.length - matched - errors,
        errors,
        imagesUpdated: dryRun ? 0 : imagesUpdated,
        remainingUnmatched: remaining,
      },
      message: dryRun
        ? `Preview: would match ${matched}/${items.length} items`
        : `Matched ${matched}/${items.length} items (${imagesUpdated} images updated). ${remaining} still unmatched.`,
      results,
    });
  } catch (error) {
    console.error("[API /anime/match-tmdb] Error:", error);
    return NextResponse.json({ error: "Matching failed" }, { status: 500 });
  }
}

/**
 * GET /api/anime/match-tmdb
 * Returns stats about unmatched content (no API key needed)
 */
export async function GET() {
  try {
    const animeUnmatched = await db.content.count({
      where: { type: "anime", tmdbId: null, status: "published" },
    });
    const animeTotal = await db.content.count({
      where: { type: "anime", status: "published" },
    });

    const movieUnmatched = await db.content.count({
      where: { type: "movie", tmdbId: null, status: "published" },
    });
    const movieTotal = await db.content.count({
      where: { type: "movie", status: "published" },
    });

    const seriesUnmatched = await db.content.count({
      where: { type: "series", tmdbId: null, status: "published" },
    });
    const seriesTotal = await db.content.count({
      where: { type: "series", status: "published" },
    });

    const mangaTotal = await db.content.count({
      where: { type: "manga", status: "published" },
    });

    const totalEmbeds = await db.embedSource.count();
    const totalContent = await db.content.count({ where: { status: "published" } });

    return NextResponse.json({
      anime: { total: animeTotal, matched: animeTotal - animeUnmatched, unmatched: animeUnmatched },
      movies: { total: movieTotal, matched: movieTotal - movieUnmatched, unmatched: movieUnmatched },
      series: { total: seriesTotal, matched: seriesTotal - seriesUnmatched, unmatched: seriesUnmatched },
      manga: { total: mangaTotal },
      total: { content: totalContent, embeds: totalEmbeds },
      hasTmdbKey: !!process.env.TMDB_API_KEY,
      tmdbKeyValid: await validateTmdbApiKey().catch(() => false),
    });
  } catch (error) {
    console.error("[API /anime/match-tmdb] Stats error:", error);
    return NextResponse.json({ error: "Failed to get stats" }, { status: 500 });
  }
}