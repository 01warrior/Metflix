import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import {
  searchMovies,
  searchTv,
  discoverMovies,
  discoverSeries,
  tmdbPosterUrl,
  tmdbBackdropUrl,
  validateTmdbApiKey,
  type TmdbMedia,
} from "@/lib/tmdb";
import { getActiveProviders, buildEmbedUrl } from "@/lib/embed-providers";

// ==================== GENRE MAP (Movie + TV) ====================

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

// Reverse map: genre name → TMDB genre ID(s)
function genreNameToIds(name: string): number[] {
  const ids: number[] = [];
  const normalized = name.trim().toLowerCase();
  for (const [idStr, gName] of Object.entries(GENRE_MAP)) {
    if (gName.toLowerCase() === normalized) {
      ids.push(parseInt(idStr));
    }
  }
  return ids;
}

// ==================== HELPERS ====================

function mapGenres(genreIds: number[]): string {
  return genreIds
    .map((id) => GENRE_MAP[id] || "")
    .filter(Boolean)
    .slice(0, 5)
    .join(", ");
}

interface ContentItemLike {
  id: string;
  tmdbId: number;
  anilistId: null;
  title: string;
  titleFr: string;
  overview: string;
  overviewFr: null;
  posterUrl: string;
  backdropUrl: string;
  releaseDate: string;
  rating: number;
  voteCount: number;
  type: string;
  year: number | null;
  genres: string;
  runtime: number | null;
  seasons: number | null;
  status: string;
  featured: boolean;
  createdAt: string;
  updatedAt: string;
  source: string;
}

function tmdbToContentItem(item: TmdbMedia, type: "movie" | "series"): ContentItemLike {
  const title = type === "movie" ? (item.title || "Sans titre") : (item.name || "Sans titre");
  const dateStr = type === "movie" ? (item.release_date || "") : (item.first_air_date || "");
  const year = dateStr ? parseInt(dateStr.substring(0, 4)) || null : null;

  // For TV shows, generate embeds for season 1 only, 3 episodes max
  const providers = getActiveProviders();
  const embedUrls: string[] = [];
  if (type === "movie") {
    for (const p of providers) {
      embedUrls.push(buildEmbedUrl(p, item.id));
    }
  } else {
    const epsCount = 3;
    for (const p of providers) {
      for (let e = 1; e <= epsCount; e++) {
        embedUrls.push(buildEmbedUrl(p, item.id, 1, e));
      }
    }
  }

  return {
    id: `tmdb-${item.id}`,
    tmdbId: item.id,
    anilistId: null,
    title,
    titleFr: title, // TMDB already returns French titles when using fr-FR
    overview: item.overview || "",
    overviewFr: null,
    posterUrl: tmdbPosterUrl(item.poster_path) || "",
    backdropUrl: tmdbBackdropUrl(item.backdrop_path) || "",
    releaseDate: dateStr,
    rating: Math.round((item.vote_average || 0) * 10) / 10,
    voteCount: item.vote_count || 0,
    type,
    year,
    genres: mapGenres(item.genre_ids || []),
    runtime: null,
    seasons: type === "series" ? (item.number_of_seasons || null) : null,
    status: "published",
    featured: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    source: "tmdb",
  };
}

// ==================== MAIN HANDLER ====================

/**
 * GET /api/tmdb/search
 *
 * Query params:
 *   query:    search term (triggers /search/movie + /search/tv)
 *   type:     movie | tv | series | all (default: all)
 *   genre:    genre name (for discover)
 *   yearFrom: start year (for discover)
 *   yearTo:   end year (for discover)
 *   page:     page number (default 1)
 *
 * Returns ContentItem-compatible format (same shape as /api/content)
 */
export async function GET(request: NextRequest) {
  try {
    const sp = request.nextUrl.searchParams;
    const query = sp.get("query")?.trim();
    const typeParam = sp.get("type") || "all";
    const genre = sp.get("genre")?.trim();
    const yearFrom = sp.get("yearFrom") ? parseInt(sp.get("yearFrom")!) : undefined;
    const yearTo = sp.get("yearTo") ? parseInt(sp.get("yearTo")!) : undefined;
    const page = Math.max(1, parseInt(sp.get("page") || "1"));

    const isValid = await validateTmdbApiKey();
    if (!isValid) {
      return NextResponse.json({ error: "TMDB not configured" }, { status: 503 });
    }

    // Determine which media types to fetch
    const wantMovies = typeParam === "all" || typeParam === "movie";
    const wantTv = typeParam === "all" || typeParam === "tv" || typeParam === "series";

    let allItems: ContentItemLike[] = [];
    let totalPages = 1;

    if (query && query.length >= 2) {
      // ---- SEARCH MODE ----
      const [movieResults, tvResults] = await Promise.all([
        wantMovies ? searchMovies(query, page) : Promise.resolve([]),
        wantTv ? searchTv(query, page) : Promise.resolve([]),
      ]);

      // Combine and interleave by popularity
      const movieItems = movieResults.map((m) => tmdbToContentItem(m, "movie"));
      const tvItems = tvResults.map((t) => tmdbToContentItem(t, "series"));
      allItems = [...movieItems, ...tvItems];

      // Sort by vote count (popularity proxy)
      allItems.sort((a, b) => (b.voteCount || 0) - (a.voteCount || 0));

      // Max pages from TMDB is typically 500, use a reasonable cap
      totalPages = 500;
    } else if (genre || yearFrom || yearTo) {
      // ---- DISCOVER MODE ----
      const genreIds = genre ? genreNameToIds(genre) : undefined;
      const discoverParams = {
        page,
        genreIds,
        yearFrom,
        yearTo,
      };

      const [movieResults, tvResults] = await Promise.all([
        wantMovies ? discoverMovies(discoverParams) : Promise.resolve([]),
        wantTv ? discoverSeries(discoverParams) : Promise.resolve([]),
      ]);

      const movieItems = movieResults.map((m) => tmdbToContentItem(m, "movie"));
      const tvItems = tvResults.map((t) => tmdbToContentItem(t, "series"));
      allItems = [...movieItems, ...tvItems];
      allItems.sort((a, b) => (b.voteCount || 0) - (a.voteCount || 0));
      totalPages = 500;
    } else {
      return NextResponse.json({
        data: [],
        total: 0,
        page: 1,
        totalPages: 0,
      });
    }

    const total = allItems.length > 0 ? 10000 : 0; // Approximate for TMDB

    return NextResponse.json({
      data: allItems,
      total,
      page,
      totalPages,
    });
  } catch (error) {
    console.error("[API /tmdb/search] Error:", error);
    return NextResponse.json({ error: "TMDB search failed" }, { status: 500 });
  }
}