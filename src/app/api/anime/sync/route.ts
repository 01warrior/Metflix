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

// Embed host configurations
const EMBED_HOSTS = [
  { hostProvider: "vidsrc", serverName: "VidSrc", quality: "1080p" },
  { hostProvider: "vidsrc_pro", serverName: "VidSrc Pro", quality: "1080p" },
  { hostProvider: "embed_su", serverName: "Embed.su", quality: "1080p" },
  { hostProvider: "autoembed", serverName: "AutoEmbed", quality: "1080p" },
  { hostProvider: "twoembed", serverName: "2Embed", quality: "1080p" },
];

function buildEmbedUrl(hostProvider: string, tmdbId: number, season: number, episode: number): string {
  switch (hostProvider) {
    case "vidsrc":
      return `https://vidsrc.xyz/embed/tv/${tmdbId}/${season}/${episode}`;
    case "vidsrc_pro":
      return `https://vidsrc.pro/embed/tv/${tmdbId}/${season}/${episode}`;
    case "embed_su":
      return `https://embed.su/embed/tv/${tmdbId}/${season}/${episode}`;
    case "autoembed":
      return `https://autoembed.cc/embed/tv/${tmdbId}/${season}/${episode}`;
    case "twoembed":
      return `https://2embed.cc/embed/${tmdbId}&s=${season}&e=${episode}`;
    default:
      return `https://vidsrc.xyz/embed/tv/${tmdbId}/${season}/${episode}`;
  }
}

function generateEmbedUrls(
  tmdbId: number,
  episodes: number,
  seasons: number,
  maxSeasons: number,
  maxEpsPerSeason: number
) {
  const embeds: {
    serverName: string;
    serverType: string;
    hostProvider: string;
    url: string;
    lang: string;
    quality: string;
    episode?: number;
    season?: number;
  }[] = [];

  const effectiveSeasons = Math.min(seasons, maxSeasons);

  for (const host of EMBED_HOSTS) {
    if (episodes <= 1) {
      embeds.push({
        serverName: host.serverName,
        serverType: "embed",
        hostProvider: host.hostProvider,
        url: buildEmbedUrl(host.hostProvider, tmdbId, 1, 1),
        lang: "vostfr",
        quality: host.quality,
        season: 1,
        episode: 1,
      });
    } else {
      for (let s = 1; s <= effectiveSeasons; s++) {
        const epsInSeason = s === 1 ? Math.min(episodes, maxEpsPerSeason) : maxEpsPerSeason;
        for (let e = 1; e <= epsInSeason; e++) {
          embeds.push({
            serverName: host.serverName,
            serverType: "embed",
            hostProvider: host.hostProvider,
            url: buildEmbedUrl(host.hostProvider, tmdbId, s, e),
            lang: "vostfr",
            quality: host.quality,
            season: s,
            episode: e,
          });
        }
      }
    }
  }

  return embeds;
}

function clamp(val: number, min: number, max: number, fallback: number): number {
  const n = Number(val);
  if (isNaN(n)) return fallback;
  return Math.max(min, Math.min(max, Math.round(n)));
}

export async function GET(request: NextRequest) {
  try {
    const startTime = Date.now();
    const { searchParams } = request.nextUrl;

    // Parse and validate query parameters
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

    // 4. OPTIMIZATION: Fetch all existing anilistIds in ONE query
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

    // 5. OPTIMIZATION: Fetch which contentIds already have embeds in ONE groupBy query
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
        // Skip anime without a poster
        if (!anime.posterUrl) {
          skipped++;
          continue;
        }

        // Resolve TMDB ID
        const tmdbId = resolveTmdbId(anime.title, anime.malId);
        if (tmdbId) tmdbResolved++;

        // Check if exists by anilistId
        const existingId = anime.anilistId ? existingByAnilistId.get(anime.anilistId) : null;

        if (existingId) {
          // Update existing content
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

          // Add embeds if we have TMDB ID and no existing embeds
          if (tmdbId && !contentIdsWithEmbeds.has(existingId) && anime.episodes && anime.episodes > 0) {
            const embeds = generateEmbedUrls(tmdbId, anime.episodes, anime.seasons, maxSeasons, maxEpsPerSeason);
            if (embeds.length > 0) {
              await db.embedSource.createMany({ data: embeds.map((e) => ({ ...e, contentId: existingId })) });
              contentIdsWithEmbeds.add(existingId);
              withEmbeds++;
            }
          }
        } else {
          // Check by title to avoid duplicates
          const existingByTitle = await db.content.findFirst({
            where: { title: { equals: anime.title }, type: "anime" },
            select: { id: true },
          });

          if (existingByTitle) {
            // Update with anilistId
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

            if (tmdbId && !contentIdsWithEmbeds.has(existingByTitle.id) && anime.episodes && anime.episodes > 0) {
              const embeds = generateEmbedUrls(tmdbId, anime.episodes, anime.seasons, maxSeasons, maxEpsPerSeason);
              if (embeds.length > 0) {
                await db.embedSource.createMany({ data: embeds.map((e) => ({ ...e, contentId: existingByTitle.id })) });
                contentIdsWithEmbeds.add(existingByTitle.id);
                withEmbeds++;
              }
            }
          } else {
            // Create new content entry
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

            // Create embed sources if we have a TMDB ID
            if (tmdbId && anime.episodes && anime.episodes > 0) {
              const embeds = generateEmbedUrls(tmdbId, anime.episodes, anime.seasons, maxSeasons, maxEpsPerSeason);
              if (embeds.length > 0) {
                await db.embedSource.createMany({ data: embeds.map((e) => ({ ...e, contentId: newContent.id })) });
                contentIdsWithEmbeds.add(newContent.id);
                withEmbeds++;
              }
            }
          }
        }
      } catch (err) {
        const msg = `Error processing "${anime.title}": ${err instanceof Error ? err.message : String(err)}`;
        console.error(`[Anime Sync] ${msg}`);
        errors.push(msg);
      }
    }

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

    // Get total anime count after sync
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