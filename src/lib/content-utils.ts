// Shared URL utilities for content poster/backdrop handling
// Supports both TMDB relative paths ("/abc.jpg") and full URLs (AniList)

const TMDB_POSTER_BASE = "https://image.tmdb.org/t/p/w500";
const TMDB_BACKDROP_BASE = "https://image.tmdb.org/t/p/w1280";

/**
 * Check if a path is already a full URL
 */
function isFullUrl(path: string): boolean {
  return path.startsWith("http://") || path.startsWith("https://");
}

/**
 * Convert a poster path to a displayable URL
 * - Full URLs (AniList): returned as-is
 * - Relative paths (TMDB): prepended with TMDB image base
 * - Null/empty: returns a placeholder
 */
export function posterUrl(
  path: string | null,
  width = 300,
  height = 450
): string {
  if (!path) {
    return `https://placehold.co/${width}x${height}/1a1a2e/ffffff?text=No+Image`;
  }
  if (isFullUrl(path)) return path;
  return `${TMDB_POSTER_BASE}${path}`;
}

/**
 * Convert a backdrop path to a displayable URL
 * - Full URLs (AniList): returned as-is
 * - Relative paths (TMDB): prepended with TMDB image base
 * - Null/empty: returns a placeholder
 */
export function backdropUrl(path: string | null): string {
  if (!path) {
    return `https://placehold.co/1280x720/1a1a2e/ffffff?text=Stream`;
  }
  if (isFullUrl(path)) return path;
  return `${TMDB_BACKDROP_BASE}${path}`;
}