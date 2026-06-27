import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { fetchAnimeForSync, type SyncedAnime } from "@/lib/anilist";
import { resolveTmdbId } from "@/lib/anime-tmdb-mapping";

// Embed host configurations
const EMBED_HOSTS = [
  { hostProvider: "vidsrc", serverName: "VidSrc", quality: "1080p" },
  { hostProvider: "vidsrc_pro", serverName: "VidSrc Pro", quality: "1080p" },
  { hostProvider: "embed_su", serverName: "Embed.su", quality: "1080p" },
  { hostProvider: "autoembed", serverName: "AutoEmbed", quality: "1080p" },
  { hostProvider: "twoembed", serverName: "2Embed", quality: "1080p" },
];

function generateEmbedUrls(tmdbId: number, episodes: number, seasons: number) {
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

  // Limit episodes to first 3 episodes per season to avoid DB bloat
  // (users can always access later episodes via the embed URL pattern)
  const maxEpisodesPerSeason = 3;
  const maxSeasons = Math.min(seasons, 5); // Cap at 5 seasons

  for (const host of EMBED_HOSTS) {
    if (episodes <= 1) {
      // Single episode / movie-like anime
      const url =
        host.hostProvider === "vidsrc"
          ? `https://vidsrc.xyz/embed/tv/${tmdbId}/1/1`
          : host.hostProvider === "vidsrc_pro"
          ? `https://vidsrc.pro/embed/tv/${tmdbId}/1/1`
          : host.hostProvider === "embed_su"
          ? `https://embed.su/embed/tv/${tmdbId}/1/1`
          : host.hostProvider === "autoembed"
          ? `https://autoembed.cc/embed/tv/${tmdbId}/1/1`
          : `https://2embed.cc/embed/${tmdbId}&s=1&e=1`;

      embeds.push({
        serverName: host.serverName,
        serverType: "embed",
        hostProvider: host.hostProvider,
        url,
        lang: "vostfr",
        quality: host.quality,
        season: 1,
        episode: 1,
      });
    } else {
      // Multi-episode anime
      for (let s = 1; s <= maxSeasons; s++) {
        const epsInSeason = s === 1 ? Math.min(episodes, maxEpisodesPerSeason) : maxEpisodesPerSeason;
        for (let e = 1; e <= epsInSeason; e++) {
          const url =
            host.hostProvider === "vidsrc"
              ? `https://vidsrc.xyz/embed/tv/${tmdbId}/${s}/${e}`
              : host.hostProvider === "vidsrc_pro"
              ? `https://vidsrc.pro/embed/tv/${tmdbId}/${s}/${e}`
              : host.hostProvider === "embed_su"
              ? `https://embed.su/embed/tv/${tmdbId}/${s}/${e}`
              : host.hostProvider === "autoembed"
              ? `https://autoembed.cc/embed/tv/${tmdbId}/${s}/${e}`
              : `https://2embed.cc/embed/${tmdbId}&s=${s}&e=${e}`;

          embeds.push({
            serverName: host.serverName,
            serverType: "embed",
            hostProvider: host.hostProvider,
            url,
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

export async function GET() {
  try {
    const startTime = Date.now();

    // 1. Fetch anime from AniList
    let animeList: SyncedAnime[];
    try {
      animeList = await fetchAnimeForSync();
    } catch (err) {
      console.error("[Anime Sync] AniList fetch failed:", err);
      return NextResponse.json(
        { error: "Failed to fetch from AniList", details: String(err) },
        { status: 502 }
      );
    }

    if (animeList.length === 0) {
      return NextResponse.json({ error: "No anime returned from AniList" }, { status: 502 });
    }

    // 2. Process and save to DB
    let created = 0;
    let updated = 0;
    let skipped = 0;
    let withEmbeds = 0;
    const errors: string[] = [];

    // Process in batches of 10
    const BATCH_SIZE = 10;
    for (let i = 0; i < animeList.length; i += BATCH_SIZE) {
      const batch = animeList.slice(i, i + BATCH_SIZE);

      for (const anime of batch) {
        try {
          // Skip anime without a poster (low quality entries)
          if (!anime.posterUrl) {
            skipped++;
            continue;
          }

          // Resolve TMDB ID for embed generation
          const tmdbId = resolveTmdbId(anime.title, anime.malId);

          // Check if this anime already exists (by anilistId or tmdbId+title match)
          const existing = anime.anilistId
            ? await db.content.findUnique({ where: { anilistId: anime.anilistId } })
            : null;

          // Also check by title to avoid duplicates
          const existingByTitle = !existing
            ? await db.content.findFirst({
                where: {
                  title: { equals: anime.title },
                  type: "anime",
                },
              })
            : null;

          const content = existing || existingByTitle;

          if (content) {
            // Update existing content with AniList data
            await db.content.update({
              where: { id: content.id },
              data: {
                anilistId: anime.anilistId,
                tmdbId: tmdbId || content.tmdbId,
                title: anime.title,
                overview: anime.overview || content.overview,
                posterPath: anime.posterUrl, // Full AniList URL
                backdropPath: anime.bannerUrl || content.backdropPath,
                rating: anime.rating || content.rating,
                year: anime.year || content.year,
                genres: anime.genres || content.genres,
                seasons: anime.seasons || content.seasons,
              },
            });
            updated++;

            // If we now have a TMDB ID but no embeds, add them
            if (tmdbId && content.type === "anime") {
              const existingEmbeds = await db.embedSource.count({
                where: { contentId: content.id },
              });
              if (existingEmbeds === 0 && anime.episodes && anime.episodes > 0) {
                const embeds = generateEmbedUrls(tmdbId, anime.episodes, anime.seasons);
                if (embeds.length > 0) {
                  await db.embedSource.createMany({ data: embeds.map((e) => ({ ...e, contentId: content.id })) });
                  withEmbeds++;
                }
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
                posterPath: anime.posterUrl, // Full AniList URL
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
            created++;

            // Create embed sources if we have a TMDB ID
            if (tmdbId && anime.episodes && anime.episodes > 0) {
              const embeds = generateEmbedUrls(tmdbId, anime.episodes, anime.seasons);
              if (embeds.length > 0) {
                await db.embedSource.createMany({ data: embeds.map((e) => ({ ...e, contentId: newContent.id })) });
                withEmbeds++;
              }
            }
          }
        } catch (err) {
          const msg = `Error processing "${anime.title}": ${err instanceof Error ? err.message : String(err)}`;
          console.error(`[Anime Sync] ${msg}`);
          errors.push(msg);
        }
      }

      // Small delay between batches to avoid overwhelming AniList/DB
      if (i + BATCH_SIZE < animeList.length) {
        await new Promise((r) => setTimeout(r, 100));
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
        errors: errors.length,
        totalAnime,
        totalAnimeEmbeds: totalEmbeds,
        elapsed: `${elapsed}s`,
      },
      errors: errors.slice(0, 20), // Limit error output
    });
  } catch (error) {
    console.error("[API /anime/sync] Error:", error);
    return NextResponse.json({ error: "Sync failed" }, { status: 500 });
  }
}