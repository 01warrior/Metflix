import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { findBestTmdbMatch, validateTmdbApiKey } from "@/lib/tmdb";
import { generateAllEmbeds } from "@/lib/embed-providers";

/**
 * POST /api/anime/match-tmdb
 * 
 * Bulk-matches anime without TMDB IDs by searching TMDB API.
 * 
 * Headers:
 *   X-TMDB-Key: Your TMDB API key (free from themoviedb.org/settings/api)
 * 
 * Query params:
 *   limit: Max items to process (default: 50, max: 200)
 *   dryRun: "true" to preview without writing
 *   type: "anime" | "manga" | "all" (default: "anime")
 */
export async function POST(request: NextRequest) {
  try {
    const apiKey = request.headers.get("X-TMDB-Key");
    if (!apiKey) {
      return NextResponse.json(
        { error: "Missing X-TMDB-Key header. Get a free key at https://www.themoviedb.org/settings/api" },
        { status: 400 }
      );
    }

    // Validate API key
    const isValid = await validateTmdbApiKey(apiKey);
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

    // Build where clause
    const where: Record<string, unknown> = {
      status: "published",
      tmdbId: null,
    };
    if (type !== "all") where.type = type;

    // Get anime without TMDB IDs
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
    const results: { title: string; tmdbId: number | null; status: string }[] = [];

    for (const item of items) {
      try {
        // Search with English title first, fall back to any title
        const match = await findBestTmdbMatch(item.title, apiKey, item.year);
        
        if (match) {
          results.push({ title: item.title, tmdbId: match.tmdbId, status: "matched" });
          
          if (!dryRun) {
            // Update the content with TMDB ID
            await db.content.update({
              where: { id: item.id },
              data: { tmdbId: match.tmdbId },
            });

            // Generate embeds for this content
            const contentType = item.type as "movie" | "series" | "anime";
            const embeds = generateAllEmbeds(
              match.tmdbId,
              contentType,
              item.seasons || 1,
              5,
              3,
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

        // Rate limit: TMDB free tier allows ~40 req/sec, we do 2 per item (tv+movie)
        // Be safe with 300ms delay
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
        remainingUnmatched: remaining,
      },
      message: dryRun
        ? `Preview: would match ${matched}/${items.length} items`
        : `Matched ${matched}/${items.length} items. ${remaining} still unmatched.`,
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
    const animeMatched = animeTotal - animeUnmatched;

    const mangaUnmatched = await db.content.count({
      where: { type: "manga", tmdbId: null, status: "published" },
    });
    const mangaTotal = await db.content.count({
      where: { type: "manga", status: "published" },
    });

    return NextResponse.json({
      anime: { total: animeTotal, matched: animeMatched, unmatched: animeUnmatched },
      manga: { total: mangaTotal, matched: mangaTotal - mangaUnmatched, unmatched: mangaUnmatched },
      hasTmdbKey: !!process.env.TMDB_API_KEY,
    });
  } catch (error) {
    console.error("[API /anime/match-tmdb] Stats error:", error);
    return NextResponse.json({ error: "Failed to get stats" }, { status: 500 });
  }
}