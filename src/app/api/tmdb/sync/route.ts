import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  fetchTrending,
  fetchPopularMovies,
  fetchTopRatedMovies,
  fetchNowPlayingMovies,
  fetchUpcomingMovies,
  discoverMovies,
  tmdbToContentData,
  type TmdbMedia,
  validateTmdbApiKey,
} from "@/lib/tmdb";
import { generateAllEmbeds } from "@/lib/embed-providers";

function clamp(val: string | null, min: number, max: number, fallback: number): number {
  const n = Number(val);
  if (isNaN(n)) return fallback;
  return Math.max(min, Math.min(max, Math.round(n)));
}

/**
 * GET /api/tmdb/sync?type=movies
 * POST /api/tmdb/sync?type=movies
 * 
 * Sync movies from TMDB to local DB.
 * 
 * Query params:
 *   type: "movies" or "series" (required)
 *   source: "trending" | "popular" | "top_rated" | "now_playing" | "upcoming" | "discover" | "all"
 *   pages: number of pages per source (1-20, default 3)
 *   genreId: TMDB genre ID for discover mode
 *   yearFrom/yearTo: year range for discover
 *   limit: max items to process (default 200, max 500)
 *   dryRun: "true" to preview
 *   fixImages: "true" to also update posters/backdrops for existing items
 */
export async function GET(request: NextRequest) {
  return handleSync(request);
}

export async function POST(request: NextRequest) {
  return handleSync(request);
}

async function handleSync(request: NextRequest) {
  try {
    // Validate TMDB key
    const isValid = await validateTmdbApiKey();
    if (!isValid) {
      return NextResponse.json(
        { error: "TMDB API key not configured or invalid. Add TMDB_API_KEY to .env" },
        { status: 401 }
      );
    }

    const { searchParams } = request.nextUrl;
    const type = searchParams.get("type") || "movies";
    const source = searchParams.get("source") || "all";
    const pages = clamp(searchParams.get("pages"), 1, 20, 3);
    const limit = Math.min(Number(searchParams.get("limit") || 200), 500);
    const dryRun = searchParams.get("dryRun") === "true";
    const fixImages = searchParams.get("fixImages") === "true";
    const genreId = searchParams.get("genreId");
    const yearFrom = searchParams.get("yearFrom") ? parseInt(searchParams.get("yearFrom")!) : undefined;
    const yearTo = searchParams.get("yearTo") ? parseInt(searchParams.get("yearTo")!) : undefined;

    const contentType = type === "series" ? "series" : "movie";
    const mediaType = type === "series" ? "tv" : "movie";

    // 1. Fetch from TMDB
    const allMedia: TmdbMedia[] = [];
    const fetchPromises: Promise<TmdbMedia[]>[] = [];

    if (source === "all" || source === "trending") {
      for (let p = 1; p <= pages; p++) {
        fetchPromises.push(fetchTrending(mediaType, "week", p).catch(() => []));
      }
    }
    if (type === "movies" && (source === "all" || source === "popular")) {
      for (let p = 1; p <= pages; p++) {
        fetchPromises.push(fetchPopularMovies(p).catch(() => []));
      }
    }
    if (type === "series" && (source === "all" || source === "popular")) {
      for (let p = 1; p <= pages; p++) {
        const { fetchPopularSeries } = await import("@/lib/tmdb");
        fetchPromises.push(fetchPopularSeries(p).catch(() => []));
      }
    }
    if (type === "movies" && (source === "all" || source === "top_rated")) {
      for (let p = 1; p <= pages; p++) {
        fetchPromises.push(fetchTopRatedMovies(p).catch(() => []));
      }
    }
    if (type === "series" && (source === "all" || source === "top_rated")) {
      for (let p = 1; p <= pages; p++) {
        const { fetchTopRatedSeries } = await import("@/lib/tmdb");
        fetchPromises.push(fetchTopRatedSeries(p).catch(() => []));
      }
    }
    if (type === "movies" && (source === "all" || source === "now_playing")) {
      for (let p = 1; p <= Math.min(pages, 5); p++) {
        fetchPromises.push(fetchNowPlayingMovies(p).catch(() => []));
      }
    }
    if (type === "movies" && (source === "all" || source === "upcoming")) {
      for (let p = 1; p <= Math.min(pages, 3); p++) {
        fetchPromises.push(fetchUpcomingMovies(p).catch(() => []));
      }
    }
    if (source === "discover") {
      for (let p = 1; p <= pages; p++) {
        const discoverFn = type === "series"
          ? (await import("@/lib/tmdb")).discoverSeries
          : discoverMovies;
        fetchPromises.push(
          discoverFn({
            page: p,
            genreIds: genreId ? [parseInt(genreId)] : undefined,
            yearFrom,
            yearTo,
            sortBy: "popularity.desc",
            voteAverageMin: 5,
          }).catch(() => [])
        );
      }
    }

    const results = await Promise.allSettled(fetchPromises);
    for (const result of results) {
      if (result.status === "fulfilled" && Array.isArray(result.value)) {
        allMedia.push(...result.value);
      }
    }

    // 2. Deduplicate by TMDB ID
    const seen = new Map<number, TmdbMedia>();
    for (const item of allMedia) {
      if (!seen.has(item.id)) {
        seen.set(item.id, item);
      }
    }
    const uniqueMedia = Array.from(seen.values()).slice(0, limit);

    if (uniqueMedia.length === 0) {
      return NextResponse.json({ error: "No results from TMDB" }, { status: 502 });
    }

    if (dryRun) {
      return NextResponse.json({
        success: true,
        dryRun: true,
        stats: {
          fetched: uniqueMedia.length,
          wouldCreate: uniqueMedia.length,
          source,
          pages,
          type: contentType,
        },
        sample: uniqueMedia.slice(0, 5).map((m) => ({
          tmdbId: m.id,
          title: m.title || m.name,
          year: (m.release_date || m.first_air_date || "").substring(0, 4),
          poster: !!m.poster_path,
          backdrop: !!m.backdrop_path,
        })),
      });
    }

    // 3. Get existing TMDB IDs
    const existingByTmdbId = new Map<number, string>();
    const existingRows = await db.content.findMany({
      where: { tmdbId: { not: null } },
      select: { id: true, tmdbId: true },
    });
    for (const row of existingRows) {
      if (row.tmdbId) existingByTmdbId.set(row.tmdbId, row.id);
    }

    // 4. Get content IDs that already have embeds
    const existingEmbeds = await db.embedSource.groupBy({ by: ["contentId"] });
    const contentIdsWithEmbeds = new Set(existingEmbeds.map((e) => e.contentId));

    // 5. Process
    let created = 0;
    let updated = 0;
    let skipped = 0;
    let withEmbeds = 0;
    let imagesFixed = 0;

    for (const item of uniqueMedia) {
      try {
        if (!item.poster_path && !item.backdrop_path) {
          skipped++;
          continue;
        }

        const contentData = tmdbToContentData(item, contentType as "movie" | "series");
        const existingId = existingByTmdbId.get(item.id);

        if (existingId) {
          // Update existing
          const updateData: Record<string, any> = {
            overview: contentData.overview,
            genres: contentData.genres,
            rating: contentData.rating,
            voteCount: contentData.voteCount,
            year: contentData.year,
            releaseDate: contentData.releaseDate,
          };
          if (fixImages || !contentIdsWithEmbeds.has(existingId)) {
            updateData.posterPath = contentData.posterPath;
            updateData.backdropPath = contentData.backdropPath;
            imagesFixed++;
          }
          await db.content.update({ where: { id: existingId }, data: updateData });
          updated++;
        } else {
          // Check by title to avoid exact duplicates
          const existingByTitle = await db.content.findFirst({
            where: { title: contentData.title, type: contentType },
            select: { id: true },
          });
          if (existingByTitle) {
            await db.content.update({
              where: { id: existingByTitle.id },
              data: {
                tmdbId: item.id,
                overview: contentData.overview,
                posterPath: contentData.posterPath,
                backdropPath: contentData.backdropPath,
                genres: contentData.genres,
                rating: contentData.rating,
                voteCount: contentData.voteCount,
                year: contentData.year,
                releaseDate: contentData.releaseDate,
              },
            });
            existingByTmdbId.set(item.id, existingByTitle.id);
            updated++;
            imagesFixed++;
          } else {
            const newContent = await db.content.create({ data: contentData });
            existingByTmdbId.set(item.id, newContent.id);
            created++;
          }
        }

        // Generate embeds
        const contentId = existingId || existingByTmdbId.get(item.id);
        if (contentId && !contentIdsWithEmbeds.has(contentId)) {
          const embeds = generateAllEmbeds(item.id, contentType as "movie" | "series");
          if (embeds.length > 0) {
            for (let i = 0; i < embeds.length; i += 500) {
              await db.embedSource.createMany({
                data: embeds.slice(i, i + 500).map((e) => ({ ...e, contentId })),
              });
            }
            contentIdsWithEmbeds.add(contentId);
            withEmbeds++;
          }
        }
      } catch (err) {
        console.error(`[TMDB Sync] Error processing ${item.id}:`, err);
        skipped++;
      }
    }

    const totalContent = await db.content.count({ where: { type: contentType } });
    const totalEmbeds = await db.embedSource.count({
      where: { content: { type: contentType } },
    });

    return NextResponse.json({
      success: true,
      dryRun: false,
      stats: {
        type: contentType,
        source,
        fetched: uniqueMedia.length,
        created,
        updated,
        skipped,
        withEmbeds,
        imagesFixed,
        totalContent,
        totalEmbeds,
      },
    });
  } catch (error) {
    console.error("[TMDB Sync] Error:", error);
    return NextResponse.json({ error: "Sync failed" }, { status: 500 });
  }
}