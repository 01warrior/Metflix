import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { posterUrl, backdropUrl } from "@/lib/content-utils";

import { EMBED_PROVIDERS, getProviderById } from "@/lib/embed-providers";

// Build HOST_CONFIG from the provider registry (single source of truth)
const HOST_CONFIG: Record<string, { label: string; color: string; icon: string; langs: string[] }> = {
  manga: { label: "Lecteur", color: "#8b5cf6", icon: "📚", langs: [] },
};
for (const p of EMBED_PROVIDERS) {
  HOST_CONFIG[p.id] = { label: p.name, color: p.color, icon: "🔗", langs: p.langs };
}
// Fallback for legacy DB entries
HOST_CONFIG["vidsrc"] = HOST_CONFIG["vidsrc"] || { label: "VidSrc", color: "#e50914", icon: "🔗", langs: ["vostfr"] };

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
        anilistId: item.anilistId,
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

    // Group embeds by episode/season
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
          hostConfig: HOST_CONFIG[e.hostProvider] || { label: e.serverName, color: "#666", icon: "🔗", langs: ["vostfr"] },
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
          hostConfig: HOST_CONFIG[e.hostProvider] || { label: e.serverName, color: "#666", icon: "🔗", langs: ["vostfr"] },
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
          hostConfig: HOST_CONFIG[e.hostProvider] || { label: e.serverName, color: "#666", icon: "🔗", langs: ["vostfr"] },
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
      anilistId: content.anilistId,
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
        (p) => HOST_CONFIG[p] || { label: p, color: "#666", icon: "🔗", langs: ["vostfr"] }
      ),
      related,
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error("[API /content/:id] Error:", error);
    return NextResponse.json({ error: "Failed to fetch content" }, { status: 500 });
  }
}