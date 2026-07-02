/**
 * TMDB API v3 + v4 Full Client
 * 
 * Complete TMDB integration with:
 * - Trending / Popular / Top Rated (movies, series)
 * - Discover by genre with filters
 * - Search (multi, movie, tv)
 * - Details (full metadata, credits, similar)
 * - Image URL helpers
 * - Genre list
 * - Bearer token auth (v4 read access token)
 * 
 * Rate limits: Free tier = ~50 req/sec (no issues)
 */

const TMDB_BASE = "https://api.themoviedb.org/3";
const TMDB_IMG_BASE = "https://image.tmdb.org/t/p";

function getApiKey(): string {
  return process.env.TMDB_API_KEY || "";
}

function getHeaders(): HeadersInit {
  const token = process.env.TMDB_READ_ACCESS_TOKEN;
  if (token) {
    return {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };
  }
  const key = getApiKey();
  return { "Content-Type": "application/json" };
}

function tmdbUrl(endpoint: string, params: Record<string, string> = {}): string {
  const url = new URL(`${TMDB_BASE}${endpoint}`);
  // If no bearer token, use api_key param
  if (!process.env.TMDB_READ_ACCESS_TOKEN) {
    url.searchParams.set("api_key", getApiKey());
  }
  url.searchParams.set("language", "fr-FR");
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }
  return url.toString();
}

// ==================== TYPES ====================

export interface TmdbMedia {
  id: number;
  title?: string;
  name?: string;
  original_title?: string;
  original_name?: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date?: string;
  first_air_date?: string;
  vote_average: number;
  vote_count: number;
  popularity: number;
  genre_ids: number[];
  media_type?: "movie" | "tv";
  adult?: boolean;
  origin_country?: string[];
  genre_names?: string[];
}

export interface TmdbDetails extends TmdbMedia {
  title: string;
  name?: string;
  tagline?: string;
  runtime?: number;
  number_of_seasons?: number;
  number_of_episodes?: number;
  seasons?: TmdbSeason[];
  genres: { id: number; name: string }[];
  production_companies?: { id: number; name: string; logo_path: string | null }[];
  status?: string;
  videos?: { results: TmdbVideo[] };
  credits?: { cast: TmdbCast[]; crew: TmdbCrew[] };
  similar?: { results: TmdbMedia[] };
  images?: {
    backdrops: { file_path: string; iso_639_1?: string; vote_average: number }[];
    posters: { file_path: string; iso_639_1?: string; vote_average: number }[];
  };
}

export interface TmdbSeason {
  id: number;
  season_number: number;
  name: string;
  episode_count: number;
  air_date: string | null;
  poster_path: string | null;
  overview: string;
}

export interface TmdbVideo {
  id: string;
  key: string;
  name: string;
  site: string;
  type: string;
  official: boolean;
}

export interface TmdbCast {
  id: number;
  name: string;
  character: string;
  profile_path: string | null;
  order: number;
}

export interface TmdbCrew {
  id: number;
  name: string;
  job: string;
  department: string;
  profile_path: string | null;
}

export interface TmdbPaginatedResponse<T> {
  page: number;
  results: T[];
  total_pages: number;
  total_results: number;
}

export interface TmdbGenre {
  id: number;
  name: string;
}

export interface TmdbSearchResult {
  id: number;
  title?: string;
  name?: string;
  original_title?: string;
  original_name?: string;
  media_type?: "movie" | "tv" | "person";
  poster_path: string | null;
  backdrop_path: string | null;
  overview: string;
  release_date?: string;
  first_air_date?: string;
  vote_average: number;
  genre_ids: number[];
  adult?: boolean;
  popularity: number;
}

// ==================== GENERIC FETCH ====================

async function tmdbFetch<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url, {
      headers: getHeaders(),
      next: { revalidate: 3600 }, // Cache 1 hour
    });
    if (!res.ok) {
      console.error(`[TMDB] ${res.status} ${url}`);
      return null;
    }
    return await res.json();
  } catch (err) {
    console.error(`[TMDB] Fetch error:`, err);
    return null;
  }
}

// ==================== GENRE MAPPING ====================

// TMDB genre IDs → French names (for movies and TV)
const MOVIE_GENRES: Record<number, string> = {
  28: "Action", 12: "Aventure", 16: "Animation", 35: "Comédie",
  80: "Crime", 99: "Documentaire", 18: "Drame", 10751: "Familial",
  14: "Fantastique", 36: "Histoire", 27: "Horreur", 10402: "Musique",
  9648: "Mystère", 10749: "Romance", 878: "Science-Fiction",
  10770: "Téléfilm", 53: "Thriller", 10752: "Guerre", 37: "Western",
};

const TV_GENRES: Record<number, string> = {
  10759: "Action & Aventure", 16: "Animation", 35: "Comédie",
  80: "Crime", 99: "Documentaire", 18: "Drame", 10751: "Familial",
  10762: "Enfants", 9648: "Mystère", 10763: "Actualités",
  10764: "Téléréalité", 10765: "Science-Fiction & Fantastique",
  10766: "Soap", 10767: "Talk-Show", 10768: "Guerre & Politique", 37: "Western",
};

function genreIdsToNames(ids: number[], mediaType: "movie" | "tv"): string {
  const map = mediaType === "tv" ? TV_GENRES : MOVIE_GENRES;
  return ids
    .map((id) => map[id] || MOVIE_GENRES[id] || "")
    .filter(Boolean)
    .slice(0, 5)
    .join(", ");
}

// ==================== TRENDING ====================

/**
 * Fetch trending movies, TV shows, or all from TMDB
 * timeWindow: "day" or "week"
 */
export async function fetchTrending(
  mediaType: "all" | "movie" | "tv" = "all",
  timeWindow: "day" | "week" = "week",
  page = 1
): Promise<TmdbMedia[]> {
  const data = await tmdbFetch<TmdbPaginatedResponse<TmdbMedia>>(
    tmdbUrl(`/trending/${mediaType}/${timeWindow}`, { page: String(page) })
  );
  return data?.results || [];
}

// ==================== POPULAR ====================

export async function fetchPopularMovies(page = 1): Promise<TmdbMedia[]> {
  const data = await tmdbFetch<TmdbPaginatedResponse<TmdbMedia>>(
    tmdbUrl("/movie/popular", { page: String(page) })
  );
  return data?.results || [];
}

export async function fetchPopularSeries(page = 1): Promise<TmdbMedia[]> {
  const data = await tmdbFetch<TmdbPaginatedResponse<TmdbMedia>>(
    tmdbUrl("/tv/popular", { page: String(page) })
  );
  return data?.results || [];
}

// ==================== TOP RATED ====================

export async function fetchTopRatedMovies(page = 1): Promise<TmdbMedia[]> {
  const data = await tmdbFetch<TmdbPaginatedResponse<TmdbMedia>>(
    tmdbUrl("/movie/top_rated", { page: String(page) })
  );
  return data?.results || [];
}

export async function fetchTopRatedSeries(page = 1): Promise<TmdbMedia[]> {
  const data = await tmdbFetch<TmdbPaginatedResponse<TmdbMedia>>(
    tmdbUrl("/tv/top_rated", { page: String(page) })
  );
  return data?.results || [];
}

// ==================== NOW PLAYING / AIRING ====================

export async function fetchNowPlayingMovies(page = 1): Promise<TmdbMedia[]> {
  const data = await tmdbFetch<TmdbPaginatedResponse<TmdbMedia>>(
    tmdbUrl("/movie/now_playing", { page: String(page) })
  );
  return data?.results || [];
}

export async function fetchAiringTodaySeries(page = 1): Promise<TmdbMedia[]> {
  const data = await tmdbFetch<TmdbPaginatedResponse<TmdbMedia>>(
    tmdbUrl("/tv/airing_today", { page: String(page) })
  );
  return data?.results || [];
}

// ==================== UPCOMING ====================

export async function fetchUpcomingMovies(page = 1): Promise<TmdbMedia[]> {
  const data = await tmdbFetch<TmdbPaginatedResponse<TmdbMedia>>(
    tmdbUrl("/movie/upcoming", { page: String(page), region: "FR" })
  );
  return data?.results || [];
}

// ==================== DISCOVER ====================

export interface DiscoverParams {
  page?: number;
  genreIds?: number[];
  yearFrom?: number;
  yearTo?: number;
  sortBy?: string;
  voteAverageMin?: number;
  withOriginalLanguage?: string;
  withoutGenres?: number[];
  region?: string;
}

export async function discoverMovies(params: DiscoverParams = {}): Promise<TmdbMedia[]> {
  const sp: Record<string, string> = { page: String(params.page || 1) };
  if (params.genreIds?.length) sp.with_genres = params.genreIds.join(",");
  if (params.yearFrom) sp["primary_release_date.gte"] = `${params.yearFrom}-01-01`;
  if (params.yearTo) sp["primary_release_date.lte"] = `${params.yearTo}-12-31`;
  if (params.sortBy) sp.sort_by = params.sortBy;
  if (params.voteAverageMin) sp["vote_average.gte"] = String(params.voteAverageMin);
  if (params.withOriginalLanguage) sp.with_original_language = params.withOriginalLanguage;
  if (params.withoutGenres?.length) sp.without_genres = params.withoutGenres.join(",");
  if (params.region) sp.region = params.region;

  const data = await tmdbFetch<TmdbPaginatedResponse<TmdbMedia>>(
    tmdbUrl("/discover/movie", sp)
  );
  return data?.results || [];
}

export async function discoverSeries(params: DiscoverParams = {}): Promise<TmdbMedia[]> {
  const sp: Record<string, string> = { page: String(params.page || 1) };
  if (params.genreIds?.length) sp.with_genres = params.genreIds.join(",");
  if (params.yearFrom) sp["first_air_date.gte"] = `${params.yearFrom}-01-01`;
  if (params.yearTo) sp["first_air_date.lte"] = `${params.yearTo}-12-31`;
  if (params.sortBy) sp.sort_by = params.sortBy;
  if (params.voteAverageMin) sp["vote_average.gte"] = String(params.voteAverageMin);
  if (params.withOriginalLanguage) sp.with_original_language = params.withOriginalLanguage;
  if (params.withoutGenres?.length) sp.without_genres = params.withoutGenres.join(",");

  const data = await tmdbFetch<TmdbPaginatedResponse<TmdbMedia>>(
    tmdbUrl("/discover/tv", sp)
  );
  return data?.results || [];
}

// ==================== SEARCH ====================

export async function searchMulti(query: string, page = 1): Promise<TmdbSearchResult[]> {
  const data = await tmdbFetch<TmdbPaginatedResponse<TmdbSearchResult>>(
    tmdbUrl("/search/multi", { query, page: String(page), include_adult: "false" })
  );
  return (data?.results || []).filter((r) => r.media_type !== "person");
}

export async function searchMovies(query: string, page = 1): Promise<TmdbMedia[]> {
  const data = await tmdbFetch<TmdbPaginatedResponse<TmdbMedia>>(
    tmdbUrl("/search/movie", { query, page: String(page), include_adult: "false" })
  );
  return data?.results || [];
}

export async function searchTv(query: string, page = 1): Promise<TmdbMedia[]> {
  const data = await tmdbFetch<TmdbPaginatedResponse<TmdbMedia>>(
    tmdbUrl("/search/tv", { query, page: String(page) })
  );
  return data?.results || [];
}

// ==================== DETAILS ====================

export async function getMovieDetails(tmdbId: number): Promise<TmdbDetails | null> {
  const data = await tmdbFetch<TmdbDetails>(
    tmdbUrl(`/movie/${tmdbId}`, { append_to_response: "credits,similar,videos,images" })
  );
  return data;
}

export async function getTvDetails(tmdbId: number): Promise<TmdbDetails | null> {
  const data = await tmdbFetch<TmdbDetails>(
    tmdbUrl(`/tv/${tmdbId}`, { append_to_response: "credits,similar,videos,images" })
  );
  return data;
}

/**
 * Get details for either movie or TV by media type
 */
export async function getDetails(tmdbId: number, mediaType: "movie" | "tv"): Promise<TmdbDetails | null> {
  return mediaType === "movie" ? getMovieDetails(tmdbId) : getTvDetails(tmdbId);
}

// ==================== GENRE LISTS ====================

export async function getMovieGenres(): Promise<TmdbGenre[]> {
  const data = await tmdbFetch<{ genres: TmdbGenre[] }>(tmdbUrl("/genre/movie/list"));
  return data?.genres || [];
}

export async function getTvGenres(): Promise<TmdbGenre[]> {
  const data = await tmdbFetch<{ genres: TmdbGenre[] }>(tmdbUrl("/genre/tv/list"));
  return data?.genres || [];
}

// ==================== IMAGE URLS ====================

export function tmdbPosterUrl(path: string | null, size = "w500"): string {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  return `${TMDB_IMG_BASE}/${size}${path}`;
}

export function tmdbBackdropUrl(path: string | null, size = "w1280"): string {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  return `${TMDB_IMG_BASE}/${size}${path}`;
}

export function tmdbProfileUrl(path: string | null, size = "w185"): string {
  if (!path) return "";
  return `${TMDB_IMG_BASE}/${size}${path}`;
}

// ==================== ANIME MATCHING ====================

/**
 * Search TMDB for the best match for an anime title.
 * Prefers TV shows with Animation genre, then exact title matches.
 */
export async function findBestTmdbMatch(
  title: string,
  apiKey?: string,
  year?: number | null
): Promise<{
  tmdbId: number;
  type: "tv" | "movie";
  posterPath?: string;
  backdropPath?: string;
  overview?: string;
  genres?: string;
  rating?: number;
  year?: number;
  seasons?: number;
} | null> {
  const ANIME_GENRES = new Set([16]); // Animation

  // Build search URL using provided key or env
  function searchUrl(type: string, query: string): string {
    const params: Record<string, string> = {
      query,
      page: "1",
      include_adult: "false",
      language: "en-US",
    };
    if (apiKey) {
      return `${TMDB_BASE}/search/${type}?api_key=${apiKey}&${new URLSearchParams(params)}`;
    }
    return tmdbUrl(`/search/${type}`, params);
  }

  function fetchSearch(url: string): Promise<{ results: any[] } | null> {
    return tmdbFetch(url);
  }

  // Search TV first (most anime are TV)
  let res = await fetchSearch(searchUrl("tv", title));
  let results = res?.results || [];

  const filtered = results.filter((r: any) => {
    const hasAnimeGenre = r.genre_ids?.some((g: number) => ANIME_GENRES.has(g));
    if (hasAnimeGenre) return true;
    const rTitle = (r.name || r.title || "").toLowerCase();
    const qTitle = title.toLowerCase();
    if (rTitle === qTitle || rTitle.includes(qTitle) || qTitle.includes(rTitle)) return true;
    return false;
  });

  if (filtered.length > 0) {
    const best = filtered[0];
    const mediaType: "tv" | "movie" = "tv";
    return {
      tmdbId: best.id,
      type: mediaType,
      posterPath: best.poster_path || undefined,
      backdropPath: best.backdrop_path || undefined,
      overview: best.overview || undefined,
      genres: genreIdsToNames(best.genre_ids || [], mediaType),
      rating: best.vote_average || undefined,
      year: best.first_air_date?.substring(0, 4) ? parseInt(best.first_air_date.substring(0, 4)) : undefined,
    };
  }

  // Try movie search
  res = await fetchSearch(searchUrl("movie", title));
  results = res?.results || [];
  const movieFiltered = results.filter((r: any) => {
    const hasAnimeGenre = r.genre_ids?.some((g: number) => ANIME_GENRES.has(g));
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
      posterPath: best.poster_path || undefined,
      backdropPath: best.backdrop_path || undefined,
      overview: best.overview || undefined,
      genres: genreIdsToNames(best.genre_ids || [], "movie"),
      rating: best.vote_average || undefined,
      year: best.release_date?.substring(0, 4) ? parseInt(best.release_date.substring(0, 4)) : undefined,
    };
  }

  // Fallback: multi-search
  const multiUrl = apiKey
    ? `${TMDB_BASE}/search/multi?api_key=${apiKey}&query=${encodeURIComponent(title)}&language=en-US`
    : tmdbUrl("/search/multi", { query: title });
  res = await fetchSearch(multiUrl);
  const multiResults = (res?.results || []).filter(
    (r: any) => r.media_type !== "person" && r.genre_ids?.some((g: number) => ANIME_GENRES.has(g))
  );

  if (multiResults.length > 0) {
    const best = multiResults[0];
    const mt = best.media_type === "movie" ? "movie" : "tv";
    return {
      tmdbId: best.id,
      type: mt,
      posterPath: best.poster_path || undefined,
      backdropPath: best.backdrop_path || undefined,
      overview: best.overview || undefined,
      genres: genreIdsToNames(best.genre_ids || [], mt),
      rating: best.vote_average || undefined,
    };
  }

  return null;
}

/**
 * Validate a TMDB API key by making a test request
 */
export async function validateTmdbApiKey(apiKey?: string): Promise<boolean> {
  try {
    const key = apiKey || getApiKey();
    if (!key) return false;
    const url = process.env.TMDB_READ_ACCESS_TOKEN
      ? `${TMDB_BASE}/configuration`
      : `${TMDB_BASE}/configuration?api_key=${key}`;
    const headers = getHeaders();
    const res = await fetch(url, { headers });
    return res.ok;
  } catch {
    return false;
  }
}

// ==================== BATCH OPERATIONS ====================

/**
 * Convert a TMDB media item to a Content-compatible object for DB insertion.
 * Handles both movies and TV shows.
 */
export function tmdbToContentData(
  item: TmdbMedia,
  type: "movie" | "series",
  extra?: Partial<{
    overview: string;
    genres: string;
    seasons: number;
    year: number;
  }>
): {
  tmdbId: number;
  title: string;
  titleFr: string;
  overview: string;
  posterPath: string;
  backdropPath: string | null;
  releaseDate: string | null;
  rating: number;
  voteCount: number;
  type: string;
  year: number | null;
  genres: string;
  runtime: number | null;
  seasons: number | null;
  status: string;
  featured: boolean;
} {
  const title = (type === "movie" ? item.title : item.name) || "";
  const dateStr = type === "movie" ? item.release_date : item.first_air_date;
  const year = dateStr ? parseInt(dateStr.substring(0, 4)) : null;
  const genreNames = genreIdsToNames(item.genre_ids || [], type === "movie" ? "movie" : "tv");

  return {
    tmdbId: item.id,
    title,
    titleFr: title,
    overview: item.overview || "",
    posterPath: tmdbPosterUrl(item.poster_path),
    backdropPath: tmdbBackdropUrl(item.backdrop_path),
    releaseDate: dateStr || null,
    rating: Math.round((item.vote_average || 0) * 10) / 10,
    voteCount: item.vote_count || 0,
    type,
    year,
    genres: genreNames,
    runtime: null,
    seasons: type === "series" ? (extra?.seasons || 1) : null,
    status: "published",
    featured: false,
  };
}