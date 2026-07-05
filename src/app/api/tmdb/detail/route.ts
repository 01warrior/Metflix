import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import {
  getMovieDetails,
  getTvDetails,
  tmdbPosterUrl,
  tmdbBackdropUrl,
  validateTmdbApiKey,
  type TmdbDetails,
  type TmdbSeason,
  type TmdbMedia,
} from "@/lib/tmdb";
import { getActiveProviders, buildEmbedUrl, type EmbedProvider } from "@/lib/embed-providers";

// ==================== GENRE MAP ====================

const GENRE_MAP: Record<number, string> = {
  28: "Action",
  12: "Aventure",
  16: "Animation",
  35: "Comédie",
  80: "Crime",
  99: "Documentaire",
  18: "Drame",
  10751: "Famille",
  14: "Fantastique",
  36: "Histoire",
  27: "Horreur",
  10402: "Musique",
  9648: "Mystère",
  10749: "Romance",
  878: "Science-Fiction",
  10770: "Téléfilm",
  53: "Thriller",
  10752: "Guerre",
  37: "Western",
  10759: "Action & Adventure",
  10762: "Kids",
  10763: "News",
  10764: "Reality",
  10765: "Sci-Fi & Fantasy",
  10766: "Soap",
  10767: "Talk",
  10768: "War & Politics",
};

// ==================== HOST CONFIG BUILDER ====================

function buildHostConfig(provider: EmbedProvider) {
  return {
    label: provider.name,
    color: provider.color,
    icon: "🔗",
    langs: provider.langs,
  };
}

// ==================== EMBED GROUP GENERATORS ====================

function generateMovieEmbedGroups(
  tmdbId: number,
  providers: EmbedProvider[]
) {
  const embeds = providers.map((p) => ({
    id: `tmdb-${tmdbId}-embed-${p.id}`,
    serverName: p.name,
    serverType: "embed" as const,
    hostProvider: p.id,
    url: buildEmbedUrl(p, tmdbId),
    lang: "vostfr",
    quality: p.quality,
    season: null as number | null,
    episode: null as number | null,
    isActive: true,
    hostConfig: buildHostConfig(p),
  }));

  return [
    {
      label: "Film Complet",
      season: null as number | null,
      episode: null as number | null,
      embeds,
    },
  ];
}

function generateTvEmbedGroups(
  tmdbId: number,
  providers: EmbedProvider[],
  seasons: TmdbSeason[],
  maxSeasons: number = 5,
  maxEpsPerSeason: number = 5
) {
  const embedGroups: {
    label: string;
    season: number | null;
    episode: number | null;
    embeds: {
      id: string;
      serverName: string;
      serverType: string;
      hostProvider: string;
      url: string;
      lang: string;
      quality: string;
      season: number | null;
      episode: number | null;
      isActive: boolean;
      hostConfig: { label: string; color: string; icon: string; langs: string[] };
    }[];
  }[] = [];

  // Sort seasons by season_number, filter out season 0 (specials), cap at maxSeasons
  const validSeasons = seasons
    .filter((s) => s.season_number > 0)
    .sort((a, b) => a.season_number - b.season_number)
    .slice(0, maxSeasons);

  for (const season of validSeasons) {
    const epCount = Math.min(season.episode_count || maxEpsPerSeason, maxEpsPerSeason);

    for (let e = 1; e <= epCount; e++) {
      const embeds = providers.map((p) => ({
        id: `tmdb-${tmdbId}-s${season.season_number}e${e}-${p.id}`,
        serverName: p.name,
        serverType: "embed" as const,
        hostProvider: p.id,
        url: buildEmbedUrl(p, tmdbId, season.season_number, e),
        lang: "vostfr",
        quality: p.quality,
        season: season.season_number,
        episode: e,
        isActive: true,
        hostConfig: buildHostConfig(p),
      }));

      embedGroups.push({
        label: `Saison ${season.season_number} - Épisode ${e}`,
        season: season.season_number,
        episode: e,
        embeds,
      });
    }
  }

  return embedGroups;
}

// ==================== RELATED ITEMS ====================

function tmdbToContentItem(item: TmdbMedia, forceType?: "movie" | "series") {
  const type = forceType || (item.title ? "movie" : "series");
  const title = type === "movie" ? (item.title || "Sans titre") : (item.name || "Sans titre");
  const dateStr = type === "movie" ? (item.release_date || "") : (item.first_air_date || "");
  const year = dateStr ? parseInt(dateStr.substring(0, 4)) || null : null;

  return {
    id: `tmdb-${item.id}`,
    tmdbId: item.id,
    anilistId: null,
    title,
    titleFr: title,
    overview: item.overview || "",
    overviewFr: null,
    posterUrl: tmdbPosterUrl(item.poster_path) || "",
    backdropUrl: tmdbBackdropUrl(item.backdrop_path) || "",
    releaseDate: dateStr,
    rating: Math.round((item.vote_average || 0) * 10) / 10,
    voteCount: item.vote_count || 0,
    type,
    year,
    genres: (item.genre_ids || [])
      .map((id) => GENRE_MAP[id] || "")
      .filter(Boolean)
      .slice(0, 5)
      .join(", "),
    runtime: null,
    seasons: type === "series" ? (item.number_of_seasons || null) : null,
    featured: false,
    source: "tmdb" as const,
  };
}

// ==================== MAIN HANDLER ====================

/**
 * GET /api/tmdb/detail
 *
 * Query params:
 *   tmdbId: TMDB ID (required)
 *   type:   movie or tv (required)
 *
 * Returns ContentDetail-compatible format (same shape as /api/content/[id])
 */
export async function GET(request: NextRequest) {
  try {
    const sp = request.nextUrl.searchParams;
    const tmdbIdStr = sp.get("tmdbId");
    let type = sp.get("type");

    if (!tmdbIdStr || !type) {
      return NextResponse.json(
        { error: "Missing required params: tmdbId, type" },
        { status: 400 }
      );
    }

    const tmdbId = parseInt(tmdbIdStr);
    if (isNaN(tmdbId)) {
      return NextResponse.json({ error: "Invalid tmdbId" }, { status: 400 });
    }

    if (type !== "movie" && type !== "tv") {
      return NextResponse.json({ error: "type must be 'movie' or 'tv'" }, { status: 400 });
    }

    const isValid = await validateTmdbApiKey();
    if (!isValid) {
      return NextResponse.json({ error: "TMDB not configured" }, { status: 503 });
    }

    // Fetch full details from TMDB — auto-detect if first attempt fails
    let details: TmdbDetails | null =
      type === "movie" ? await getMovieDetails(tmdbId) : await getTvDetails(tmdbId);

    // If not found, try the other media type (auto-detect)
    if (!details) {
      const fallbackType = type === "movie" ? "tv" : "movie";
      details = fallbackType === "movie" ? await getMovieDetails(tmdbId) : await getTvDetails(tmdbId);
      if (details) {
        type = fallbackType; // use the correct type for the rest of the function
      }
    }

    if (!details) {
      return NextResponse.json({ error: "Content not found on TMDB" }, { status: 404 });
    }

    const isMovie = type === "movie";
    const title = isMovie ? (details.title || "Sans titre") : (details.name || "Sans titre");
    const dateStr = isMovie
      ? (details.release_date || "")
      : (details.first_air_date || "");
    const year = dateStr ? parseInt(dateStr.substring(0, 4)) || null : null;

    // Genres from the detail response (full genre objects)
    const genreStr = (details.genres || [])
      .map((g) => g.name)
      .filter(Boolean)
      .slice(0, 5)
      .join(", ");

    // Generate embed groups
    const providers = getActiveProviders();
    let embedGroups: ReturnType<
      typeof generateMovieEmbedGroups | typeof generateTvEmbedGroups
    >;

    if (isMovie) {
      embedGroups = generateMovieEmbedGroups(tmdbId, providers);
    } else {
      embedGroups = generateTvEmbedGroups(
        tmdbId,
        providers,
        details.seasons || []
      );
    }

    // Host providers
    const hostProviders = providers.map((p) => buildHostConfig(p));

    // Related content from TMDB similar
    const related = (details.similar?.results || [])
      .slice(0, 6)
      .map((item) => tmdbToContentItem(item, isMovie ? "movie" : "series"));

    const result = {
      id: `tmdb-${tmdbId}`,
      tmdbId,
      anilistId: null,
      title,
      titleFr: title,
      overview: details.overview || "",
      overviewFr: null,
      posterUrl: tmdbPosterUrl(details.poster_path) || "",
      backdropUrl: tmdbBackdropUrl(details.backdrop_path) || "",
      releaseDate: dateStr,
      rating: Math.round((details.vote_average || 0) * 10) / 10,
      voteCount: details.vote_count || 0,
      type: isMovie ? "movie" : "series",
      year,
      genres: genreStr,
      runtime: details.runtime || null,
      seasons: isMovie ? null : (details.number_of_seasons || null),
      featured: false,
      embedGroups,
      hostProviders,
      related,
      categories: [],
      source: "tmdb",
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error("[API /tmdb/detail] Error:", error);
    return NextResponse.json({ error: "Failed to fetch TMDB detail" }, { status: 500 });
  }
}