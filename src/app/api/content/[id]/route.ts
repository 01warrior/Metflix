import { NextResponse } from "next/server";
import { db } from "@/lib/db";

const TMDB_POSTER_BASE = "https://image.tmdb.org/t/p/w500";
const TMDB_BACKDROP_BASE = "https://image.tmdb.org/t/p/w1280";

function posterUrl(path: string | null): string {
  if (!path) return `https://placehold.co/300x450/1a1a2e/ffffff?text=No+Image`;
  return `${TMDB_POSTER_BASE}${path}`;
}

function backdropUrl(path: string | null): string {
  if (!path) return `https://placehold.co/1280x720/1a1a2e/ffffff?text=Stream`;
  return `${TMDB_BACKDROP_BASE}${path}`;
}

// Host provider display config
const HOST_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
  vidsrc: { label: "VidSrc", color: "#e50914", icon: "🔴" },
  vidsrc_pro: { label: "VidSrc Pro", color: "#ff6b35", icon: "🟠" },
  embed_su: { label: "Embed.su", color: "#4ecdc4", icon: "🟢" },
  autoembed: { label: "AutoEmbed", color: "#a855f7", icon: "🟣" },
  twoembed: { label: "2Embed", color: "#3b82f6", icon: "🔵" },
  doodstream: { label: "Doodstream", color: "#f59e0b", icon: "🟡" },
  uqload: { label: "UQLOAD", color: "#22c55e", icon: "💚" },
  voe: { label: "VOE", color: "#06b6d4", icon: "💎" },
  vidzy: { label: "VIDZY", color: "#ec4899", icon: "🩷" },
  manga: { label: "Lecteur", color: "#8b5cf6", icon: "📚" },
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const content = await db.content.findUnique({
      where: { id },
      include: {
        embeds: {
          where: { isActive: true },
          orderBy: [{ season: "asc" }, { episode: "asc" }, { lang: "asc" }],
        },
        categories: {
          include: { category: { select: { id: true, name: true, slug: true } } },
        },
      },
    });

    if (!content) {
      return NextResponse.json({ error: "Content not found" }, { status: 404 });
    }

    // Get related content
    const contentGenres = content.genres ? content.genres.split(",").map((g) => g.trim()) : [];

    let related = [];
    if (contentGenres.length > 0) {
      const relatedRaw = await db.content.findMany({
        where: {
          id: { not: content.id },
          type: content.type,
          status: "published",
          OR: contentGenres.map((genre) => ({ genres: { contains: genre } })),
        },
        orderBy: { rating: "desc" },
        take: 6,
      });
      related = relatedRaw.map((item) => ({
        id: item.id,
        tmdbId: item.tmdbId,
        title: item.title,
        titleFr: item.titleFr,
        overview: item.overview,
        overviewFr: item.overviewFr,
        posterUrl: posterUrl(item.posterPath),
        backdropUrl: backdropUrl(item.backdropPath),
        rating: item.rating,
        voteCount: item.voteCount,
        type: item.type,
        year: item.year,
        genres: item.genres,
        runtime: item.runtime,
        seasons: item.seasons,
        featured: item.featured,
      }));
    }

    // Group embeds by episode/season, and include host provider info
    const embedGroups: { label: string; season: number | null; episode: number | null; embeds: any[] }[] = [];

    if (content.type === "manga") {
      embedGroups.push({
        label: "Chapitres",
        season: null,
        episode: null,
        embeds: content.embeds.map((e) => ({
          id: e.id,
          serverName: e.serverName,
          serverType: e.serverType,
          hostProvider: e.hostProvider,
          url: e.url,
          lang: e.lang,
          quality: e.quality,
          hostConfig: HOST_CONFIG[e.hostProvider] || { label: e.serverName, color: "#666", icon: "🔗" },
        })),
      });
    } else if (content.type === "movie") {
      embedGroups.push({
        label: "Film Complet",
        season: null,
        episode: null,
        embeds: content.embeds.map((e) => ({
          id: e.id,
          serverName: e.serverName,
          serverType: e.serverType,
          hostProvider: e.hostProvider,
          url: e.url,
          lang: e.lang,
          quality: e.quality,
          hostConfig: HOST_CONFIG[e.hostProvider] || { label: e.serverName, color: "#666", icon: "🔗" },
        })),
      });
    } else {
      // Series/Anime - group by season + episode
      const episodeMap = new Map<string, any[]>();
      for (const e of content.embeds) {
        const key = `S${e.season || 1}E${e.episode || 1}`;
        if (!episodeMap.has(key)) episodeMap.set(key, []);
        episodeMap.get(key)!.push({
          id: e.id,
          serverName: e.serverName,
          serverType: e.serverType,
          hostProvider: e.hostProvider,
          url: e.url,
          lang: e.lang,
          quality: e.quality,
          season: e.season,
          episode: e.episode,
          hostConfig: HOST_CONFIG[e.hostProvider] || { label: e.serverName, color: "#666", icon: "🔗" },
        });
      }

      const sortedKeys = [...episodeMap.keys()].sort();
      for (const key of sortedKeys) {
        const embeds = episodeMap.get(key)!;
        const ep = embeds[0].episode || 1;
        const s = embeds[0].season || 1;
        embedGroups.push({
          label: `Saison ${s} - Épisode ${ep}`,
          season: s,
          episode: ep,
          embeds,
        });
      }
    }

    const result = {
      id: content.id,
      tmdbId: content.tmdbId,
      title: content.title,
      titleFr: content.titleFr,
      overview: content.overview,
      overviewFr: content.overviewFr,
      posterUrl: posterUrl(content.posterPath),
      backdropUrl: backdropUrl(content.backdropPath),
      releaseDate: content.releaseDate,
      rating: content.rating,
      voteCount: content.voteCount,
      type: content.type,
      year: content.year,
      genres: content.genres,
      runtime: content.runtime,
      seasons: content.seasons,
      featured: content.featured,
      categories: content.categories.map((cc) => cc.category),
      embeds: content.embeds,
      embedGroups,
      hostProviders: [...new Set(content.embeds.map((e) => e.hostProvider))].map(
        (p) => HOST_CONFIG[p] || { label: p, color: "#666", icon: "🔗" }
      ),
      related,
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error("[API /content/:id] Error:", error);
    return NextResponse.json({ error: "Failed to fetch content" }, { status: 500 });
  }
}