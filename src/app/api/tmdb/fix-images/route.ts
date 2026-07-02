import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getMovieDetails, getTvDetails, tmdbPosterUrl, tmdbBackdropUrl, validateTmdbApiKey } from "@/lib/tmdb";

/**
 * POST /api/tmdb/fix-images
 * 
 * Fixes broken poster/backdrop images for existing content by fetching
 * fresh data from TMDB using their TMDB IDs.
 * 
 * Query params:
 *   type: "movie" | "series" | "anime" | "all" (default: "all")
 *   limit: max items to process (default 100, max 500)
 *   dryRun: "true" to preview
 */
export async function POST(request: NextRequest) {
  try {
    const isValid = await validateTmdbApiKey();
    if (!isValid) {
      return NextResponse.json(
        { error: "TMDB API key not configured or invalid" },
        { status: 401 }
      );
    }

    const { searchParams } = request.nextUrl;
    const type = searchParams.get("type") || "all";
    const limit = Math.min(Number(searchParams.get("limit") || 100), 500);
    const dryRun = searchParams.get("dryRun") === "true";

    // Find content with TMDB IDs that might have broken images
    const where: Record<string, any> = {
      tmdbId: { not: null },
      status: "published",
    };
    if (type !== "all") where.type = type;

    const items = await db.content.findMany({
      where,
      select: { id: true, tmdbId: true, title: true, type: true, posterPath: true, backdropPath: true },
      orderBy: { createdAt: "asc" },
      take: limit,
    });

    if (items.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No content with TMDB IDs found to fix",
        stats: { processed: 0, fixed: 0 },
      });
    }

    // Detect broken images: TMDB relative paths (start with /) need the base URL
    // Full URLs that don't start with https://image.tmdb.org might be from AniList (keep them)
    let fixed = 0;
    let alreadyGood = 0;
    let notFound = 0;
    const details: { title: string; fixed: boolean; hadPoster: boolean; hasPoster: boolean }[] = [];

    for (const item of items) {
      try {
        const tmdbId = item.tmdbId!;
        const isTv = item.type === "series" || item.type === "anime";

        if (dryRun) {
          const needsFix = item.posterPath?.startsWith("/") || !item.posterPath;
          if (needsFix) {
            fixed++;
            details.push({ title: item.title, fixed: true, hadPoster: !!item.posterPath, hasPoster: true });
          } else {
            alreadyGood++;
          }
          continue;
        }

        // Fetch fresh details from TMDB
        const detailsRes = isTv ? await getTvDetails(tmdbId) : await getMovieDetails(tmdbId);

        if (!detailsRes) {
          notFound++;
          continue;
        }

        const newPoster = tmdbPosterUrl(detailsRes.poster_path);
        const newBackdrop = tmdbBackdropUrl(detailsRes.backdrop_path);

        if (!newPoster && !newBackdrop) {
          notFound++;
          continue;
        }

        const updateData: Record<string, any> = {};
        if (newPoster && newPoster !== item.posterPath) updateData.posterPath = newPoster;
        if (newBackdrop && newBackdrop !== item.backdropPath) updateData.backdropPath = newBackdrop;

        // Also update overview and genres if we have better data
        if (detailsRes.overview) updateData.overview = detailsRes.overview;
        if (detailsRes.genres?.length) {
          updateData.genres = detailsRes.genres.map((g) => g.name).slice(0, 5).join(", ");
        }
        if (detailsRes.vote_average) updateData.rating = Math.round(detailsRes.vote_average * 10) / 10;
        if (detailsRes.vote_count) updateData.voteCount = detailsRes.vote_count;
        if (isTv && detailsRes.number_of_seasons) updateData.seasons = detailsRes.number_of_seasons;
        if (detailsRes.runtime && item.type === "movie") updateData.runtime = detailsRes.runtime;

        if (Object.keys(updateData).length > 0) {
          await db.content.update({ where: { id: item.id }, data: updateData });
          fixed++;
          details.push({
            title: item.title,
            fixed: true,
            hadPoster: !!item.posterPath,
            hasPoster: !!newPoster,
          });
        } else {
          alreadyGood++;
        }

        // Small delay to respect rate limits
        await new Promise((r) => setTimeout(r, 100));
      } catch (err) {
        console.error(`[Fix Images] Error for "${item.title}":`, err);
        notFound++;
      }
    }

    return NextResponse.json({
      success: true,
      dryRun,
      stats: {
        processed: items.length,
        fixed,
        alreadyGood,
        notFound,
      },
      details: dryRun ? undefined : details.slice(0, 10),
      message: dryRun
        ? `Preview: ${fixed}/${items.length} need image fixes`
        : `Fixed ${fixed}/${items.length} items. ${notFound} not found on TMDB.`,
    });
  } catch (error) {
    console.error("[Fix Images] Error:", error);
    return NextResponse.json({ error: "Fix failed" }, { status: 500 });
  }
}

/**
 * GET /api/tmdb/fix-images - Stats about content needing image fixes
 */
export async function GET() {
  try {
    // Count items with relative TMDB paths (broken)
    const brokenPosters = await db.content.count({
      where: {
        posterPath: { startsWith: "/" },
        status: "published",
      },
    });

    const noPosters = await db.content.count({
      where: {
        OR: [
          { posterPath: null },
          { posterPath: "" },
        ],
        status: "published",
      },
    });

    const total = await db.content.count({ where: { status: "published" } });
    const withTmdbId = await db.content.count({
      where: { tmdbId: { not: null }, status: "published" },
    });

    const isValid = await validateTmdbApiKey();

    return NextResponse.json({
      total,
      withTmdbId,
      brokenPosters,
      noPosters,
      needsFix: brokenPosters + noPosters,
      tmdbKeyValid: isValid,
    });
  } catch (error) {
    return NextResponse.json({ error: "Stats failed" }, { status: 500 });
  }
}