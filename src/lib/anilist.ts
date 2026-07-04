// AniList GraphQL API Client - 100% Free, No API Key Required
// Docs: https://anilist.co/graphiql

const ANILIST_ENDPOINT = "https://graphql.anilist.co";

interface AniListMedia {
  id: number;
  idMal: number | null;
  title: {
    romaji: string | null;
    english: string | null;
    native: string | null;
  };
  description: string | null;
  coverImage: {
    extraLarge: string | null;
    large: string | null;
    medium: string | null;
    color: string | null;
  };
  bannerImage: string | null;
  startDate: { year: number | null; month: number | null; day: number | null } | null;
  endDate: { year: number | null; month: number | null; day: number | null } | null;
  episodes: number | null;
  duration: number | null;
  genres: string[];
  averageScore: number | null;
  popularity: number | null;
  status: string | null; // FINISHED, RELEASING, NOT_YET_RELEASED, CANCELLED, HIATUS
  format: string | null; // TV, TV_SHORT, MOVIE, SPECIAL, OVA, ONA, MUSIC
  season: string | null;
  seasonYear: number | null;
  studios: { nodes: { name: string; isAnimationStudio: boolean }[] };
  nextAiringEpisode: { episode: number; airingAt: number } | null;
  externalLinks: { url: string; site: string; icon: string | null }[];
}

interface AniListResponse<T> {
  data: T;
}

// Genre mapping from AniList to our French genres
const GENRE_MAP: Record<string, string> = {
  Action: "Action",
  Adventure: "Aventure",
  Comedy: "Comédie",
  Drama: "Drame",
  Fantasy: "Fantasy",
  Horror: "Horreur",
  Mystery: "Mystère",
  Romance: "Romance",
  "Sci-Fi": "Sci-Fi",
  "Slice of Life": "Slice of Life",
  Sports: "Sport",
  Supernatural: "Surnaturel",
  Thriller: "Thriller",
  "Psychological": "Psychologique",
  "Mecha": "Mecha",
  "Music": "Musique",
  "Military": "Militaire",
  "School": "École",
  "Shounen": "Shounen",
  "Seinen": "Seinen",
  "Shoujo": "Shoujo",
};

// Map AniList status to our status
function mapStatus(status: string | null): string {
  switch (status) {
    case "FINISHED":
    case "RELEASING":
      return "published";
    default:
      return "published"; // Show everything
  }
}

// Get title - prefer English, fallback to Romaji
function getTitle(media: AniListMedia): string {
  return media.title.english || media.title.romaji || media.title.native || "Unknown";
}

// Clean HTML tags from AniList description
function cleanDescription(html: string | null): string {
  if (!html) return "";
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]*>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

// Map AniList genres to our genre system
function mapGenres(genres: string[]): string {
  return genres
    .map((g) => GENRE_MAP[g] || g)
    .filter(Boolean)
    .join(",");
}

async function fetchAniList<T>(query: string, variables: Record<string, unknown> = {}): Promise<T> {
  const response = await fetch(ANILIST_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ query, variables }),
    // 10 second timeout
    signal: AbortSignal.timeout(15000),
  });

  if (!response.ok) {
    throw new Error(`AniList API error: ${response.status} ${response.statusText}`);
  }

  const json = (await response.json()) as AniListResponse<T>;
  return json.data;
}

export interface SyncedAnime {
  anilistId: number;
  malId: number | null;
  title: string;
  overview: string;
  posterUrl: string;      // Full AniList URL
  bannerUrl: string | null; // Full AniList URL
  rating: number;          // 0-100 from AniList, converted to 0-10
  year: number | null;
  genres: string;
  episodes: number | null;
  seasons: number;
  status: string;
  format: string | null;
  popularity: number | null;
  studio: string;
  nextEpisode: number | null;
}

// Convert AniList media to our format
function toSyncedAnime(media: AniListMedia): SyncedAnime {
  const totalEpisodes = media.episodes || 0;
  // Estimate seasons from episode count (typically 12-13 eps per season for anime)
  const estimatedSeasons = totalEpisodes > 0 ? Math.max(1, Math.ceil(totalEpisodes / 12)) : 1;

  return {
    anilistId: media.id,
    malId: media.idMal,
    title: getTitle(media),
    overview: cleanDescription(media.description),
    posterUrl: media.coverImage.extraLarge || media.coverImage.large || media.coverImage.medium || "",
    bannerUrl: media.bannerImage,
    rating: media.averageScore ? media.averageScore / 10 : 0, // Convert 0-100 to 0-10
    year: media.startDate?.year || media.seasonYear || null,
    genres: mapGenres(media.genres),
    episodes: totalEpisodes,
    seasons: estimatedSeasons,
    status: mapStatus(media.status),
    format: media.format,
    popularity: media.popularity,
    studio: media.studios.nodes.find((s) => s.isAnimationStudio)?.name || media.studios.nodes[0]?.name || "",
    nextEpisode: media.nextAiringEpisode?.episode || null,
  };
}

// ==================== PUBLIC API ====================

/**
 * Fetch trending anime (most popular right now)
 */
export async function fetchTrendingAnime(page = 1, perPage = 25): Promise<SyncedAnime[]> {
  const query = `
    query ($page: Int, $perPage: Int) {
      Page(page: $page, perPage: $perPage) {
        pageInfo { total hasNextPage }
        media(
          type: ANIME
          sort: TRENDING_DESC
          isAdult: false
        ) {
          ...MediaFields
        }
      }
    }
    ${MEDIA_FRAGMENT}
  `;

  const data = await fetchAniList<{ Page: { media: AniListMedia[] } }>(query, { page, perPage });
  return data.Page.media.map(toSyncedAnime);
}

/**
 * Fetch popular anime (all time most popular)
 */
export async function fetchPopularAnime(page = 1, perPage = 25): Promise<SyncedAnime[]> {
  const query = `
    query ($page: Int, $perPage: Int) {
      Page(page: $page, perPage: $perPage) {
        pageInfo { total hasNextPage }
        media(
          type: ANIME
          sort: POPULARITY_DESC
          isAdult: false
        ) {
          ...MediaFields
        }
      }
    }
    ${MEDIA_FRAGMENT}
  `;

  const data = await fetchAniList<{ Page: { media: AniListMedia[] } }>(query, { page, perPage });
  return data.Page.media.map(toSyncedAnime);
}

/**
 * Fetch top-rated anime
 */
export async function fetchTopRatedAnime(page = 1, perPage = 25): Promise<SyncedAnime[]> {
  const query = `
    query ($page: Int, $perPage: Int) {
      Page(page: $page, perPage: $perPage) {
        pageInfo { total hasNextPage }
        media(
          type: ANIME
          sort: SCORE_DESC
          isAdult: false
        )
        {
          ...MediaFields
        }
      }
    }
    ${MEDIA_FRAGMENT}
  `;

  const data = await fetchAniList<{ Page: { media: AniListMedia[] } }>(query, { page, perPage });
  return data.Page.media.map(toSyncedAnime);
}

/**
 * Fetch anime by genre
 */
export async function fetchAnimeByGenre(genre: string, page = 1, perPage = 25): Promise<SyncedAnime[]> {
  const query = `
    query ($genre: String, $page: Int, $perPage: Int) {
      Page(page: $page, perPage: $perPage) {
        pageInfo { total hasNextPage }
        media(
          type: ANIME
          genre: $genre
          sort: POPULARITY_DESC
          isAdult: false
        ) {
          ...MediaFields
        }
      }
    }
    ${MEDIA_FRAGMENT}
  `;

  const data = await fetchAniList<{ Page: { media: AniListMedia[] } }>(query, { genre, page, perPage });
  return data.Page.media.map(toSyncedAnime);
}

/**
 * Fetch recently updated/fresh anime (currently airing or just finished)
 */
export async function fetchCurrentSeasonAnime(page = 1, perPage = 25): Promise<SyncedAnime[]> {
  const query = `
    query ($page: Int, $perPage: Int) {
      Page(page: $page, perPage: $perPage) {
        pageInfo { total hasNextPage }
        media(
          type: ANIME
          sort: UPDATED_AT_DESC
          isAdult: false
        ) {
          ...MediaFields
        }
      }
    }
    ${MEDIA_FRAGMENT}
  `;

  const data = await fetchAniList<{ Page: { media: AniListMedia[] } }>(query, { page, perPage });
  return data.Page.media.map(toSyncedAnime);
}

/**
 * Search anime by title
 */
export async function searchAnime(query: string, page = 1, perPage = 10): Promise<SyncedAnime[]> {
  const gql = `
    query ($search: String, $page: Int, $perPage: Int) {
      Page(page: $page, perPage: $perPage) {
        pageInfo { total hasNextPage }
        media(
          type: ANIME
          search: $search
          isAdult: false
        ) {
          ...MediaFields
        }
      }
    }
    ${MEDIA_FRAGMENT}
  `;

  const data = await fetchAniList<{ Page: { media: AniListMedia[] } }>(gql, { search: query, page, perPage });
  return data.Page.media.map(toSyncedAnime);
}

/**
 * Fetch a single anime by AniList ID
 */
export async function fetchAnimeById(anilistId: number): Promise<SyncedAnime | null> {
  const query = `
    query ($id: Int) {
      Media(id: $id, type: ANIME) {
        ...MediaFields
      }
    }
    ${MEDIA_FRAGMENT}
  `;

  try {
    const data = await fetchAniList<{ Media: AniListMedia | null }>(query, { id: anilistId });
    return data.Media ? toSyncedAnime(data.Media) : null;
  } catch {
    return null;
  }
}

// GraphQL fragment for media fields
const MEDIA_FRAGMENT = `
  fragment MediaFields on Media {
    id
    idMal
    title { romaji english native }
    description(asHtml: false)
    coverImage { extraLarge large medium color }
    bannerImage
    startDate { year month day }
    endDate { year month day }
    episodes
    duration
    genres
    averageScore
    popularity
    status
    format
    season
    seasonYear
    studios { nodes { name isAnimationStudio } }
    nextAiringEpisode { episode airingAt }
  }
`;

/**
 * Fetch multiple pages and deduplicate
 */
export async function fetchMultiplePages(
  fetcher: (page: number) => Promise<SyncedAnime[]>,
  maxPages = 4,
  perPage = 25
): Promise<SyncedAnime[]> {
  const seen = new Set<number>();
  const results: SyncedAnime[] = [];

  for (let page = 1; page <= maxPages; page++) {
    try {
      const anime = await fetcher(page);
      for (const a of anime) {
        if (!seen.has(a.anilistId)) {
          seen.add(a.anilistId);
          results.push(a);
        }
      }
      // If we got less than perPage, we've reached the end
      if (anime.length < perPage) break;
    } catch (err) {
      console.error(`[AniList] Error fetching page ${page}:`, err);
      break;
    }
  }

  return results;
}

// ==================== MANGA TYPES & FUNCTIONS ====================

interface AniListManga {
  id: number;
  idMal: number | null;
  title: {
    romaji: string | null;
    english: string | null;
    native: string | null;
  };
  description: string | null;
  coverImage: {
    extraLarge: string | null;
    large: string | null;
    medium: string | null;
    color: string | null;
  };
  bannerImage: string | null;
  startDate: { year: number | null; month: number | null; day: number | null } | null;
  endDate: { year: number | null; month: number | null; day: number | null } | null;
  chapters: number | null;
  volumes: number | null;
  genres: string[];
  averageScore: number | null;
  popularity: number | null;
  status: string | null; // FINISHED, RELEASING, NOT_YET_RELEASED, CANCELLED, HIATUS
  format: string | null; // MANGA, MANHWA, MANHUA, NOVEL, ONE_SHOT
  countryOfOrigin: string | null;
  externalLinks: { url: string; site: string; icon: string | null }[];
}

export interface SyncedManga {
  anilistId: number;
  malId: number | null;
  title: string;
  overview: string;
  posterUrl: string;
  bannerUrl: string | null;
  rating: number;
  year: number | null;
  genres: string;
  chapters: number | null;
  volumes: number | null;
  status: string;
  format: string | null;
  popularity: number | null;
  countryOfOrigin: string | null;
}

const MANGA_FRAGMENT = `
  fragment MangaFields on Media {
    id
    idMal
    title { romaji english native }
    description(asHtml: false)
    coverImage { extraLarge large medium color }
    bannerImage
    startDate { year month day }
    endDate { year month day }
    chapters
    volumes
    genres
    averageScore
    popularity
    status
    format
    countryOfOrigin
    externalLinks { url site icon }
  }
`;

function toSyncedManga(media: AniListManga): SyncedManga {
  return {
    anilistId: media.id,
    malId: media.idMal,
    title: getTitle(media as unknown as AniListMedia),
    overview: cleanDescription(media.description),
    posterUrl: media.coverImage.extraLarge || media.coverImage.large || media.coverImage.medium || "",
    bannerUrl: media.bannerImage,
    rating: media.averageScore ? media.averageScore / 10 : 0,
    year: media.startDate?.year || null,
    genres: mapGenres(media.genres),
    chapters: media.chapters,
    volumes: media.volumes,
    status: mapStatus(media.status),
    format: media.format,
    popularity: media.popularity,
    countryOfOrigin: media.countryOfOrigin,
  };
}

async function fetchAniListManga<T>(query: string, variables: Record<string, unknown> = {}): Promise<T> {
  const response = await fetch(ANILIST_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ query, variables }),
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) throw new Error(`AniList API error: ${response.status}`);
  const json = (await response.json()) as AniListResponse<T>;
  return json.data;
}

/**
 * Fetch trending manga
 */
export async function fetchTrendingManga(page = 1, perPage = 25): Promise<SyncedManga[]> {
  const query = `
    query ($page: Int, $perPage: Int) {
      Page(page: $page, perPage: $perPage) {
        pageInfo { total hasNextPage }
        media(type: MANGA sort: TRENDING_DESC isAdult: false) {
          ...MangaFields
        }
      }
    }
    ${MANGA_FRAGMENT}
  `;
  const data = await fetchAniListManga<{ Page: { media: AniListManga[] } }>(query, { page, perPage });
  return data.Page.media.map(toSyncedManga);
}

/**
 * Fetch popular manga (all time)
 */
export async function fetchPopularManga(page = 1, perPage = 25): Promise<SyncedManga[]> {
  const query = `
    query ($page: Int, $perPage: Int) {
      Page(page: $page, perPage: $perPage) {
        pageInfo { total hasNextPage }
        media(type: MANGA sort: POPULARITY_DESC isAdult: false) {
          ...MangaFields
        }
      }
    }
    ${MANGA_FRAGMENT}
  `;
  const data = await fetchAniListManga<{ Page: { media: AniListManga[] } }>(query, { page, perPage });
  return data.Page.media.map(toSyncedManga);
}

/**
 * Fetch top-rated manga
 */
export async function fetchTopRatedManga(page = 1, perPage = 25): Promise<SyncedManga[]> {
  const query = `
    query ($page: Int, $perPage: Int) {
      Page(page: $page, perPage: $perPage) {
        pageInfo { total hasNextPage }
        media(type: MANGA sort: SCORE_DESC isAdult: false) {
          ...MangaFields
        }
      }
    }
    ${MANGA_FRAGMENT}
  `;
  const data = await fetchAniListManga<{ Page: { media: AniListManga[] } }>(query, { page, perPage });
  return data.Page.media.map(toSyncedManga);
}

/**
 * Fetch manga by genre
 */
export async function fetchMangaByGenre(genre: string, page = 1, perPage = 25): Promise<SyncedManga[]> {
  const query = `
    query ($genre: String, $page: Int, $perPage: Int) {
      Page(page: $page, perPage: $perPage) {
        pageInfo { total hasNextPage }
        media(type: MANGA genre: $genre sort: POPULARITY_DESC isAdult: false) {
          ...MangaFields
        }
      }
    }
    ${MANGA_FRAGMENT}
  `;
  const data = await fetchAniListManga<{ Page: { media: AniListManga[] } }>(query, { genre, page, perPage });
  return data.Page.media.map(toSyncedManga);
}

/**
 * Fetch recently updated manga
 */
export async function fetchRecentlyUpdatedManga(page = 1, perPage = 25): Promise<SyncedManga[]> {
  const query = `
    query ($page: Int, $perPage: Int) {
      Page(page: $page, perPage: $perPage) {
        pageInfo { total hasNextPage }
        media(type: MANGA sort: UPDATED_AT_DESC isAdult: false) {
          ...MangaFields
        }
      }
    }
    ${MANGA_FRAGMENT}
  `;
  const data = await fetchAniListManga<{ Page: { media: AniListManga[] } }>(query, { page, perPage });
  return data.Page.media.map(toSyncedManga);
}

// ==================== MANGA GENRE LIST ====================

export const MANGA_GENRES = [
  "Action", "Adventure", "Comedy", "Drama", "Fantasy", "Horror",
  "Mystery", "Romance", "Sci-Fi", "Slice of Life", "Sports",
  "Supernatural", "Thriller", "Psychological", "Mecha", "Music",
  "Martial Arts", "School", "Shounen", "Seinen", "Shoujo",
];