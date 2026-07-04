import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  fetchTrendingManga,
  fetchPopularManga,
  fetchTopRatedManga,
  fetchMangaByGenre,
  fetchRecentlyUpdatedManga,
  type SyncedManga,
} from "@/lib/anilist";

function clamp(val: string | null, min: number, max: number, fallback: number): number {
  const n = Number(val);
  if (isNaN(n)) return fallback;
  return Math.max(min, Math.min(max, Math.round(n)));
}

/**
 * GET/POST /api/manga/sync
 * 
 * Sync manga from AniList to local DB.
 * No API key needed (AniList is free).
 * 
 * Query params:
 *   trendingPages: pages of trending manga (1-10, default 2)
 *   popularPages: pages of popular manga (1-10, default 2)
 *   topRatedPages: pages of top-rated manga (1-10, default 2)
 *   genres: comma-separated genre names
 *   perPage: items per page (1-50, default 25)
 *   dryRun: "true" to preview without writing
 */
export async function GET(request: NextRequest) {
  return handleMangaSync(request);
}

export async function POST(request: NextRequest) {
  return handleMangaSync(request);
}

async function handleMangaSync(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const trendingPages = clamp(searchParams.get("trendingPages"), 1, 10, 2);
    const popularPages = clamp(searchParams.get("popularPages"), 1, 10, 2);
    const topRatedPages = clamp(searchParams.get("topRatedPages"), 1, 10, 2);
    const perPage = clamp(searchParams.get("perPage"), 1, 50, 25);
    const dryRun = searchParams.get("dryRun") === "true";
    const genresStr = searchParams.get("genres") || "";
    const genres = genresStr.split(",").map((g) => g.trim()).filter(Boolean);

    // 1. Fetch from AniList
    const fetchPromises: Promise<SyncedManga[]>[] = [];

    for (let p = 1; p <= trendingPages; p++) {
      fetchPromises.push(fetchTrendingManga(p, perPage).catch(() => []));
    }
    for (let p = 1; p <= popularPages; p++) {
      fetchPromises.push(fetchPopularManga(p, perPage).catch(() => []));
    }
    for (let p = 1; p <= topRatedPages; p++) {
      fetchPromises.push(fetchTopRatedManga(p, perPage).catch(() => []));
    }
    // Always fetch recently updated
    fetchPromises.push(fetchRecentlyUpdatedManga(1, perPage).catch(() => []));
    for (const genre of genres) {
      fetchPromises.push(fetchMangaByGenre(genre, 1, perPage).catch(() => []));
    }

    const results = await Promise.allSettled(fetchPromises);
    const allFetched: SyncedManga[] = [];
    for (const result of results) {
      if (result.status === "fulfilled" && Array.isArray(result.value)) {
        allFetched.push(...result.value);
      }
    }

    // 2. Deduplicate by anilistId
    const seen = new Map<number, SyncedManga>();
    for (const manga of allFetched) {
      if (!seen.has(manga.anilistId)) {
        seen.set(manga.anilistId, manga);
      }
    }
    const uniqueManga = Array.from(seen.values());

    if (uniqueManga.length === 0) {
      return NextResponse.json({ error: "Aucun manga trouvé sur AniList" }, { status: 502 });
    }

    if (dryRun) {
      return NextResponse.json({
        success: true,
        dryRun: true,
        stats: {
          fetched: uniqueManga.length,
          sources: { trendingPages, popularPages, topRatedPages, genres, perPage },
        },
        sample: uniqueManga.slice(0, 5).map((m) => ({
          anilistId: m.anilistId,
          title: m.title,
          chapters: m.chapters,
          volumes: m.volumes,
          rating: m.rating,
        })),
      });
    }

    // 3. Get existing AniList IDs
    const existingByAnilistId = new Map<number, string>();
    const existingRows = await db.content.findMany({
      where: { anilistId: { not: null } },
      select: { id: true, anilistId: true },
    });
    for (const row of existingRows) {
      if (row.anilistId) existingByAnilistId.set(row.anilistId, row.id);
    }

    // 4. Process each manga
    let created = 0;
    let updated = 0;
    let skipped = 0;

    for (const manga of uniqueManga) {
      try {
        if (!manga.posterUrl) {
          skipped++;
          continue;
        }

        const existingId = existingByAnilistId.get(manga.anilistId);

        if (existingId) {
          // Update existing
          await db.content.update({
            where: { id: existingId },
            data: {
              overview: manga.overview?.substring(0, 2000) || null,
              genres: manga.genres,
              rating: manga.rating,
              year: manga.year,
              seasons: manga.chapters,
            },
          });
          updated++;
        } else {
          // Check by title to avoid duplicates
          const existingByTitle = await db.content.findFirst({
            where: { title: manga.title, type: "manga" },
            select: { id: true },
          });

          if (existingByTitle) {
            await db.content.update({
              where: { id: existingByTitle.id },
              data: {
                anilistId: manga.anilistId,
                overview: manga.overview?.substring(0, 2000) || null,
                posterPath: manga.posterUrl,
                backdropPath: manga.bannerUrl,
                genres: manga.genres,
                rating: manga.rating,
                year: manga.year,
                seasons: manga.chapters,
              },
            });
            existingByAnilistId.set(manga.anilistId, existingByTitle.id);
            updated++;
          } else {
            const newContent = await db.content.create({
              data: {
                title: manga.title,
                overview: manga.overview?.substring(0, 2000) || null,
                posterPath: manga.posterUrl,
                backdropPath: manga.bannerUrl,
                type: "manga",
                rating: manga.rating,
                year: manga.year,
                genres: manga.genres,
                anilistId: manga.anilistId,
                status: "published",
                seasons: manga.chapters,
              },
            });
            existingByAnilistId.set(manga.anilistId, newContent.id);
            created++;
          }
        }
      } catch (err) {
        console.error(`[Manga Sync] Error processing ${manga.anilistId}:`, err);
        skipped++;
      }
    }

    const totalManga = await db.content.count({ where: { type: "manga" } });

    return NextResponse.json({
      success: true,
      dryRun: false,
      stats: {
        type: "manga",
        fetched: uniqueManga.length,
        created,
        updated,
        skipped,
        totalManga,
      },
    });
  } catch (error) {
    console.error("[Manga Sync] Error:", error);
    return NextResponse.json({ error: "Sync manga échoué" }, { status: 500 });
  }
}