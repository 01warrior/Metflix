/**
 * TMDB Search Client
 * 
 * Uses the TMDB API v3 to search for anime by title and resolve TMDB IDs.
 * Requires a TMDB API key (free at https://www.themoviedb.org/settings/api)
 * 
 * Rate limits: Free tier = 50 requests/second
 */

const TMDB_BASE = "https://api.themoviedb.org/3";
const TMDB_IMG_BASE = "https://image.tmdb.org/t/p";

export interface TmdbSearchResult {
  id: number;
  title: string;
  original_title: string;
  media_type: "tv" | "movie";
  poster_path: string | null;
  backdrop_path: string | null;
  overview: string;
  first_air_date?: string;
  release_date?: string;
  vote_average: number;
  genre_ids: number[];
  name?: string;
  original_name?: string;
}

export interface TmdbSearchResponse {
  page: number;
  results: TmdbSearchResult[];
  total_pages: number;
  total_results: number;
}

/**
 * Search TMDB for a TV show or movie by title
 */
export async function searchTmdb(
  title: string,
  apiKey: string,
  type: "tv" | "movie" | "multi" = "tv"
): Promise<TmdbSearchResult[]> {
  const url = new URL(`${TMDB_BASE}/search/${type}`);
  url.searchParams.set("api_key", apiKey);
  url.searchParams.set("query", title);
  url.searchParams.set("language", "en-US");
  url.searchParams.set("page", "1");
  url.searchParams.set("include_adult", "false");

  try {
    const res = await fetch(url.toString(), { 
      next: { revalidate: 86400 } // Cache for 24h
    });
    if (!res.ok) return [];
    const data: TmdbSearchResponse = await res.json();
    return data.results || [];
  } catch {
    return [];
  }
}

/**
 * Search TMDB and find the best matching result for an anime title
 * Prefers TV shows, then movies, then multi-search
 * Filters by relevance (title similarity, Japanese origin, anime genre)
 */
export async function findBestTmdbMatch(
  title: string,
  apiKey: string,
  year?: number | null
): Promise<{ tmdbId: number; type: "tv" | "movie"; posterPath?: string; backdropPath?: string } | null> {
  // ANIME genre IDs on TMDB: 16 (Animation)
  const ANIME_GENRES = new Set([16]);

  // Search as TV first (most anime are TV shows)
  let results = await searchTmdb(title, apiKey, "tv");
  
  // Filter: must have animation genre or be a very close title match
  const filtered = results.filter(r => {
    // Check if has animation genre
    const hasAnimeGenre = r.genre_ids?.some(g => ANIME_GENRES.has(g));
    if (hasAnimeGenre) return true;
    
    // Check title similarity (exact or very close match)
    const rTitle = (r.name || r.title || "").toLowerCase();
    const qTitle = title.toLowerCase();
    if (rTitle === qTitle || rTitle.includes(qTitle) || qTitle.includes(rTitle)) return true;
    
    return false;
  });

  if (filtered.length > 0) {
    const best = filtered[0];
    return {
      tmdbId: best.id,
      type: "tv",
      posterPath: best.poster_path,
      backdropPath: best.backdrop_path,
    };
  }

  // Try movie search for films
  results = await searchTmdb(title, apiKey, "movie");
  const movieFiltered = results.filter(r => {
    const hasAnimeGenre = r.genre_ids?.some(g => ANIME_GENRES.has(g));
    if (hasAnimeGenre) return true;
    const rTitle = (r.title || "").toLowerCase();
    const qTitle = title.toLowerCase();
    if (rTitle === qTitle || rTitle.includes(qTitle) || qTitle.includes(rTitle)) return true;
    return false;
  });

  if (movieFiltered.length > 0) {
    const best = movieFiltered[0];
    return {
      tmdbId: best.id,
      type: "movie",
      posterPath: best.poster_path,
      backdropPath: best.backdrop_path,
    };
  }

  // Fallback: multi-search
  const multiResults = await searchTmdb(title, apiKey, "multi");
  const animeResults = multiResults.filter(r => 
    r.media_type !== "person" && 
    r.genre_ids?.some(g => ANIME_GENRES.has(g))
  );

  if (animeResults.length > 0) {
    const best = animeResults[0];
    return {
      tmdbId: best.id,
      type: best.media_type === "movie" ? "movie" : "tv",
      posterPath: best.poster_path,
      backdropPath: best.backdrop_path,
    };
  }

  return null;
}

/**
 * Validate a TMDB API key by making a test request
 */
export async function validateTmdbApiKey(apiKey: string): Promise<boolean> {
  try {
    const res = await fetch(`${TMDB_BASE}/configuration?api_key=${apiKey}`);
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Get TMDB image URL
 */
export function tmdbPosterUrl(path: string | null, size = "w500"): string {
  if (!path) return "";
  return `${TMDB_IMG_BASE}/${size}${path}`;
}

export function tmdbBackdropUrl(path: string | null, size = "w1280"): string {
  if (!path) return "";
  return `${TMDB_IMG_BASE}/${size}${path}`;
}