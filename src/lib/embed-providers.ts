/**
 * Embed Provider Registry
 * 
 * CENTRALIZED CONFIG - All embed providers in ONE file.
 * To add/remove/modify a provider, edit ONLY this file.
 * 
 * VERIFIED: Tested on 2025-07-09 (v4)
 * 
 * HOW TO UPDATE:
 * 1. Test the domain: curl -sI "https://DOMAIN/embed/movie/550" | head -1
 *    (550 = Fight Club, always works for testing)
 * 2. If 200 → set active: true
 *    If 301/302 → check where it redirects, update urlTemplate
 *    If 403/000 → set active: false
 * 3. Run: bun run lint
 */

export interface EmbedProvider {
  id: string;              // unique identifier
  name: string;            // display name shown to users
  color: string;           // hex color for UI button
  quality: string;         // quality label ("1080p", "4K", "720p")
  active: boolean;         // whether to generate embeds for this provider
  langs: string[];         // supported languages: ["vostfr", "vf"]
  
  // URL templates - {tmdbId}, {season}, {episode} are replaced
  movieUrl: string;        // URL template for movies
  tvUrl: string;           // URL template for TV shows / anime
  note?: string;           // internal note about this provider
}

/**
 * PROVIDERS LIST - Edit this array to add/remove/modify providers.
 * 
 * URL Template Variables:
 *   {tmdbId}   → TMDB ID (e.g., 550 for Fight Club)
 *   {season}   → Season number (1, 2, 3...)
 *   {episode}  → Episode number (1, 2, 3...)
 * 
 * To add a new provider:
 *   { id: "new_provider", name: "New Provider", color: "#ff0000", 
 *     quality: "1080p", active: true,
 *     movieUrl: "https://example.com/embed/movie/{tmdbId}",
 *     tvUrl: "https://example.com/embed/tv/{tmdbId}/{season}/{episode}" }
 */
export const EMBED_PROVIDERS: EmbedProvider[] = [
  // === TIER 1: Verified Working (2025-07-02) ===
  {
    id: "vidsrc_me",
    name: "Mirage",
    color: "#a855f7",
    quality: "1080p",
    active: true,
    langs: ["vostfr"],
    movieUrl: "https://vidsrcme.ru/embed/movie/{tmdbId}",
    tvUrl: "https://vidsrcme.ru/embed/tv/{tmdbId}/{season}/{episode}",
    note: "Working 2025-07-02. Redirects to vidsrcme.ru.",
  },

  {
    id: "vidsrc_pm",
    name: "Rafale",
    color: "#e50914",
    quality: "1080p",
    active: true,
    langs: ["vostfr", "vf"],
    movieUrl: "https://vidsrc.pm/embed/movie/{tmdbId}",
    tvUrl: "https://vidsrc.pm/embed/tv/{tmdbId}/{season}/{episode}",
    note: "Working 2025-07-02. Reliable VidSrc fork. VF via player.",
  },

  {
    id: "anyembed",
    name: "Mustang",
    color: "#14b8a6",
    quality: "1080p",
    active: true,
    langs: ["vostfr"],
    movieUrl: "https://anyembed.xyz/embed/tmdb-movie-{tmdbId}",
    tvUrl: "https://anyembed.xyz/embed/tmdb-tv-{tmdbId}-{season}-{episode}",
    note: "Working 2025-07-03. SmashyStream backend, direct access.",
  },

  {
    id: "ezvidapi",
    name: "Furtif",
    color: "#06b6d4",
    quality: "1080p",
    active: true,
    langs: ["vostfr", "vf"],
    movieUrl: "https://ezvidapi.com/embed/movie/{tmdbId}",
    tvUrl: "https://ezvidapi.com/embed/tv/{tmdbId}/{season}/{episode}",
    note: "Ad-free, multi-provider failover. Sandbox-friendly. Added 2026-07-19.",
  },

  {
    id: "vidsrc_pro",
    name: "VidSrc Pro",
    color: "#f59e0b",
    quality: "1080p",
    active: false,
    langs: ["vostfr", "vf"],
    movieUrl: "https://vidsrc.pro/embed/movie/{tmdbId}",
    tvUrl: "https://vidsrc.pro/embed/tv/{tmdbId}/{season}/{episode}",
    note: "DEAD 2025-07-04. 301 → embed.su (dead domain).",
  },
  {
    id: "primesrc",
    name: "Lancaster",
    color: "#f97316",
    quality: "1080p",
    active: false,
    langs: ["vostfr", "vf"],
    movieUrl: "https://primesrc.me/embed/movie?tmdb={tmdbId}",
    tvUrl: "https://primesrc.me/embed/tv?tmdb={tmdbId}&season={season}&episode={episode}",
    note: "Working 2025-07-05. 75k+ movies, 240k+ episodes. Multi-host backend (PrimeVid,Voe,Dood).",
  },

  // === TIER 3: Currently Down (keep as reference, re-enable when back) ===
  {
    id: "vidsrc_xyz",
    name: "VidSrc XYZ",
    color: "#6366f1",
    quality: "1080p",
    active: false,
    langs: ["vostfr"],
    movieUrl: "https://vidsrc.xyz/embed/movie/{tmdbId}",
    tvUrl: "https://vidsrc.xyz/embed/tv/{tmdbId}/{season}/{episode}",
    note: "DEAD 2025-07-02. Domain offline.",
  },
  {
    id: "vidsrc_cc",
    name: "VidSrc CC",
    color: "#3b82f6",
    quality: "1080p",
    active: false,
    langs: ["vostfr"],
    movieUrl: "https://vidsrc.cc/embed/movie/{tmdbId}",
    tvUrl: "https://vidsrc.cc/embed/tv/{tmdbId}/{season}/{episode}",
    note: "BLOCKED 2025-07-02. Returns 403.",
  },
  {
    id: "vidsrc_to",
    name: "VidSrc TO",
    color: "#8b5cf6",
    quality: "1080p",
    active: false,
    langs: ["vostfr"],
    movieUrl: "https://vidsrc.to/embed/movie/{tmdbId}",
    tvUrl: "https://vidsrc.to/embed/tv/{tmdbId}/{season}/{episode}",
    note: "BLOCKED 2025-07-02. Returns 403.",
  },
  {
    id: "autoembed",
    name: "AutoEmbed",
    color: "#06b6d4",
    quality: "720p",
    active: false,
    langs: ["vostfr"],
    movieUrl: "https://autoembed.cc/embed/movie/{tmdbId}",
    tvUrl: "https://autoembed.cc/embed/tv/{tmdbId}/{season}/{episode}",
    note: "DEAD 2025-07-02. Domain offline.",
  },
  {
    id: "twoembed",
    name: "2Embed",
    color: "#22c55e",
    quality: "1080p",
    active: false,
    langs: ["vostfr"],
    movieUrl: "https://2embed.cc/embed/{tmdbId}",
    tvUrl: "https://2embed.cc/embed/{tmdbId}?s={season}&e={episode}",
    note: "DEAD 2025-07-02. Domain offline.",
  },
  {
    id: "superembed",
    name: "SuperEmbed",
    color: "#ec4899",
    quality: "4K",
    active: false,
    langs: ["vostfr"],
    movieUrl: "https://superembed.stream/movie/{tmdbId}",
    tvUrl: "https://superembed.stream/tv/{tmdbId}/{season}/{episode}",
    note: "DEAD 2025-07-02. Returns 404.",
  },
];

/**
 * Get only active providers
 */
export function getActiveProviders(): EmbedProvider[] {
  return EMBED_PROVIDERS.filter((p) => p.active);
}

/**
 * Build an embed URL from a provider and params
 */
export function buildEmbedUrl(
  provider: EmbedProvider,
  tmdbId: number,
  season?: number,
  episode?: number
): string {
  if (season !== undefined && episode !== undefined) {
    return provider.tvUrl
      .replace("{tmdbId}", String(tmdbId))
      .replace("{season}", String(season))
      .replace("{episode}", String(episode));
  }
  return provider.movieUrl.replace("{tmdbId}", String(tmdbId));
}

/**
 * Get provider by ID (for UI display)
 */
export function getProviderById(id: string): EmbedProvider | undefined {
  return EMBED_PROVIDERS.find((p) => p.id === id);
}

/**
 * Generate all embed URLs for a content item
 * 
 * @param seasonEpisodeCounts Optional map of season number → real episode count.
 *   If provided, uses real counts (capped at maxEpsPerSeason) instead of maxEpsPerSeason for all seasons.
 */
export function generateAllEmbeds(
  tmdbId: number,
  type: "movie" | "series" | "anime",
  seasons: number = 1,
  maxSeasons: number = 5,
  maxEpsPerSeason: number = 3,
  totalEpisodes?: number,
  seasonEpisodeCounts?: Record<number, number>
): {
  serverName: string;
  serverType: string;
  hostProvider: string;
  url: string;
  lang: string;
  quality: string;
  episode?: number;
  season?: number;
}[] {
  const active = getActiveProviders();
  const embeds: ReturnType<typeof generateAllEmbeds> = [];

  const isMovie = type === "movie";
  // When real episode counts per season are available, derive season count from them
  // (more reliable than number_of_seasons from the list API which can be missing)
  let effectiveSeasons: number;
  if (seasonEpisodeCounts && Object.keys(seasonEpisodeCounts).length > 0) {
    effectiveSeasons = Math.max(...Object.keys(seasonEpisodeCounts).map(Number));
  } else {
    effectiveSeasons = seasons;
  }
  effectiveSeasons = Math.min(effectiveSeasons, maxSeasons);

  for (const provider of active) {
    if (isMovie) {
      embeds.push({
        serverName: provider.name,
        serverType: "embed",
        hostProvider: provider.id,
        url: buildEmbedUrl(provider, tmdbId),
        lang: "vostfr",
        quality: provider.quality,
      });
    } else {
      // TV/Anime - generate for each episode
      for (let s = 1; s <= effectiveSeasons; s++) {
        // Determine episode count for this season
        let eps: number;
        if (seasonEpisodeCounts && seasonEpisodeCounts[s]) {
          // Use real TMDB episode count, capped at maxEpsPerSeason
          eps = Math.min(seasonEpisodeCounts[s], maxEpsPerSeason);
        } else if (s === 1 && totalEpisodes) {
          // Legacy fallback: totalEpisodes (total across all seasons) for season 1
          eps = Math.min(totalEpisodes, maxEpsPerSeason);
        } else {
          // No data — use maxEpsPerSeason as upper bound
          eps = maxEpsPerSeason;
        }

        // Skip seasons with 0 episodes (specials, empty seasons)
        if (eps <= 0) continue;

        for (let e = 1; e <= eps; e++) {
          embeds.push({
            serverName: provider.name,
            serverType: "embed",
            hostProvider: provider.id,
            url: buildEmbedUrl(provider, tmdbId, s, e),
            lang: "vostfr",
            quality: provider.quality,
            season: s,
            episode: e,
          });
        }
      }
    }
  }

  return embeds;
}

/**
 * Provider color map for UI (id → color)
 */
export function getProviderColorMap(): Record<string, string> {
  const map: Record<string, string> = {};
  for (const p of EMBED_PROVIDERS) {
    map[p.id] = p.color;
  }
  return map;
}

/**
 * Provider langs map for UI (id → langs array)
 */
export function getProviderLangsMap(): Record<string, string[]> {
  const map: Record<string, string[]> = {};
  for (const p of EMBED_PROVIDERS) {
    map[p.id] = p.langs;
  }
  return map;
}