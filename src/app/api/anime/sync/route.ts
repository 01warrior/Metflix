import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  fetchTrendingAnime,
  fetchPopularAnime,
  fetchTopRatedAnime,
  fetchAnimeByGenre,
  type SyncedAnime,
} from "@/lib/anilist";
import { resolveTmdbId } from "@/lib/anime-tmdb-mapping";
import { generateAllEmbeds } from "@/lib/embed-providers";

function clamp(val: number | null, min: number, max: number, fallback: number): number {
  const n = Number(val);
  if (isNaN(n)) return fallback;
  return Math.max(min, Math.min(max, Math.round(n)));
}

export async function GET(request: NextRequest) {
  try {
    const startTime = Date.now();
    const { searchParams } = request.nextUrl;

    const trendingPages = clamp(searchParams.get("trendingPages"), 1, 20, 2);
    const popularPages = clamp(searchParams.get("popularPages"), 1, 20, 2);
    const topRatedPages = clamp(searchParams.get("topRatedPages"), 1, 20, 2);
    const maxSeasons = clamp(searchParams.get("maxSeasons"), 1, 20, 5);
    const maxEpsPerSeason = clamp(searchParams.get("maxEpsPerSeason"), 1, 50, 3);
    const perPage = clamp(searchParams.get("perplexity"), 1, 50, 50);
    const genresStr = searchParams.get("genres") || "";
    const genres = genresStr
      .split(",")
      .map((g) => g.trim())
      .filter(Boolean);

    // 1. Build fetch promises dynamically
    const fetchPromises: Promise<SyncedAnime[]>[] = [];

    for (let p = 1; p <= trendingPages; p++) {
      fetchPromises.push(fetchTrendingAnime(p, perPage).catch(() => []));
    }
    for (let p = 1; p <= popularPages; p++) {
      fetchPromises.push(fetchPopularAnime(p, perPage).catch(() => []));
    }
    for (let p = 1; p <= topRatedPages; p++) {
      fetchPromises.push(fetchTopRatedAnime(p, perPage).catch(() => []));
    }
    for (const genre of genres) {
      fetchPromises.push(fetchAnimeByGenre(genre, 1, perPage).catch(() => []));
    }

    // 2. Fetch all in parallel
    const results = await Promise.allSettled(fetchPromises);
    const allFetched: SyncedAnime[] = [];

    for (const result of results) {
      if (result.status === "fulfilled" && Array.isArray(result.value)) {
        allFetched.push(...result.value);
      }
    }

    // 3. Deduplicate by AniList ID
    const seen = new Map<number, SyncedAnime>();
    for (const anime of allFetched) {
      if (!seen.has(anime.anilistId)) {
        seen.set(anime.anilistId, anime);
      }
    }
    const animeList = Array.from(seen.values());

    if (animeList.length === 0) {
      return NextResponse.json({ error: "No anime returned from AniList" }, { status: 502 });
    }

    // 4. Fetch existing anilistIds in ONE query
    const existingByAnilistId = new Map<number, string>();
    const existingRows = await db.content.findMany({
      where: { type: "anime", anilistId: { not: null } },
      select: { id: true, anilistId: true },
    });
    for (const row of existingRows) {
      if (row.anilistId) {
        existingByAnilistId.set(row.anilistId, row.id);
      }
    }

    // 5. Fetch which contentIds already have embeds
    const existingEmbeds = await db.embedSource.groupBy({
      by: ["contentId"],
    });
    const contentIdsWithEmbeds = new Set(existingEmbeds.map((e) => e.contentId));

    // 6. Process anime
    let created = 0;
    let updated = 0;
    let skipped = 0;
    let withEmbeds = 0;
    let tmdbResolved = 0;
    const errors: string[] = [];

    for (const anime of animeList) {
      try {
        if (!anime.posterUrl) {
          skipped++;
          continue;
        }

        const tmdbId = resolveTmdbId(anime.title, anime.malId);
        if (tmdbId) tmdbResolved++;

        const existingId = anime.anilistId ? existingByAnilistId.get(anime.anilistId) : null;

        const upsertContent = async (contentId: string) => {
          // Add embeds if we have TMDB ID and no existing embeds
          if (tmdbId && !contentIdsWithEmbeds.has(contentId) && anime.episodes && anime.episodes > 0) {
            const embeds = generateAllEmbeds(
              tmdbId,
              "anime",
              anime.seasons || 1,
              maxSeasons,
              maxEpsPerSeason,
              anime.episodes
            );
            if (embeds.length > 0) {
              // Batch insert in chunks of 500
              for (let i = 0; i < embeds.length; i += 500) {
                await db.embedSource.createMany({
                  data: embeds.slice(i, i + 500).map((e) => ({ ...e, contentId })),
                });
              }
              contentIdsWithEmbeds.add(contentId);
              withEmbeds++;
            }
          }
        };

        if (existingId) {
          await db.content.update({
            where: { id: existingId },
            data: {
              anilistId: anime.anilistId,
              tmdbId: tmdbId ?? undefined,
              title: anime.title,
              overview: anime.overview || undefined,
              posterPath: anime.posterUrl,
              backdropPath: anime.bannerUrl || undefined,
              rating: anime.rating,
              year: anime.year || undefined,
              genres: anime.genres || undefined,
              seasons: anime.seasons || undefined,
            },
          });
          updated++;
          await upsertContent(existingId);
        } else {
          const existingByTitle = await db.content.findFirst({
            where: { title: { equals: anime.title }, type: "anime" },
            select: { id: true },
          });

          if (existingByTitle) {
            await db.content.update({
              where: { id: existingByTitle.id },
              data: {
                anilistId: anime.anilistId,
                tmdbId: tmdbId ?? undefined,
                title: anime.title,
                overview: anime.overview || undefined,
                posterPath: anime.posterUrl,
                backdropPath: anime.bannerUrl || undefined,
                rating: anime.rating,
                year: anime.year || undefined,
                genres: anime.genres || undefined,
                seasons: anime.seasons || undefined,
              },
            });
            existingByAnilistId.set(anime.anilistId, existingByTitle.id);
            updated++;
            await upsertContent(existingByTitle.id);
          } else {
            const newContent = await db.content.create({
              data: {
                anilistId: anime.anilistId,
                tmdbId: tmdbId,
                title: anime.title,
                overview: anime.overview,
                posterPath: anime.posterUrl,
                backdropPath: anime.bannerUrl,
                rating: anime.rating,
                voteCount: anime.popularity || 100,
                type: "anime",
                year: anime.year,
                genres: anime.genres,
                runtime: null,
                seasons: anime.seasons,
                status: "published",
                featured: false,
              },
            });
            existingByAnilistId.set(anime.anilistId, newContent.id);
            created++;
            await upsertContent(newContent.id);
          }
        }
      } catch (err) {
        const msg = `Error processing "${anime.title}": ${err instanceof Error ? err.message : String(err)}`;
        console.error(`[Anime Sync] ${msg}`);
        errors.push(msg);
      }
    }

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

    const totalAnime = await db.content.count({ where: { type: "anime" } });
    const totalEmbeds = await db.embedSource.count({
      where: { content: { type: "anime" } },
    });

    return NextResponse.json({
      success: true,
      stats: {
        fetched: animeList.length,
        created,
        updated,
        skipped,
        withEmbeds,
        tmdbResolved,
        totalAnime,
        totalAnimeEmbeds: totalEmbeds,
        elapsed: `${elapsed}s`,
      },
      errors: errors.slice(0, 20),
    });
  } catch (error) {
    console.error("[API /anime/sync] Error:", error);
    return NextResponse.json({ error: "Sync failed" }, { status: 500 });
  }
}