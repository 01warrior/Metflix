/**
 * Embed Provider Registry
 * 
 * CENTRALIZED CONFIG - All embed providers in ONE file.
 * To add/remove/modify a provider, edit ONLY this file.
 * 
 * VERIFIED: Tested on 2025-07-02 (v2)
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
    id: "vidsrc_pm",
    name: "VidSrc PM",
    color: "#e50914",
    quality: "1080p",
    active: true,
    movieUrl: "https://vidsrc.pm/embed/movie/{tmdbId}",
    tvUrl: "https://vidsrc.pm/embed/tv/{tmdbId}/{season}/{episode}",
    note: "Working 2025-07-02. Reliable VidSrc fork.",
  },
  {
    id: "vidsrc_in",
    name: "VidSrc IN",
    color: "#ff6b35",
    quality: "1080p",
    active: true,
    movieUrl: "https://vidsrc.in/embed/movie/{tmdbId}",
    tvUrl: "https://vidsrc.in/embed/tv/{tmdbId}/{season}/{episode}",
    note: "Working 2025-07-02. Has Cloudflare ads but works.",
  },
  {
    id: "vidsrc_dev",
    name: "VidSrc Dev",
    color: "#f97316",
    quality: "1080p",
    active: true,
    movieUrl: "https://vidsrc.dev/embed/movie/{tmdbId}",
    tvUrl: "https://vidsrc.dev/embed/tv/{tmdbId}/{season}/{episode}",
    note: "Working 2025-07-02. Clean, fast.",
  },
  {
    id: "vidsrc_io",
    name: "VidSrc IO",
    color: "#ef4444",
    quality: "1080p",
    active: true,
    movieUrl: "https://vidsrc.io/embed/movie/{tmdbId}",
    tvUrl: "https://vidsrc.io/embed/tv/{tmdbId}/{season}/{episode}",
    note: "Working 2025-07-02.",
  },
  {
    id: "embed_su",
    name: "Embed.su",
    color: "#4ecdc4",
    quality: "1080p",
    active: true,
    movieUrl: "https://embed.su/embed/movie/{tmdbId}",
    tvUrl: "https://embed.su/embed/tv/{tmdbId}/{season}/{episode}",
    note: "Working 2025-07-02. TV episodes select in-player.",
  },

  // === TIER 2: Redirects (still usable, browser follows redirect) ===
  {
    id: "vidsrc_pro",
    name: "VidSrc Pro",
    color: "#f59e0b",
    quality: "1080p",
    active: true,
    movieUrl: "https://vidsrc.pro/embed/movie/{tmdbId}",
    tvUrl: "https://vidsrc.pro/embed/tv/{tmdbId}/{season}/{episode}",
    note: "Working 2025-07-02. 301 → embed.su.",
  },
  {
    id: "vidsrc_me",
    name: "VidSrc ME",
    color: "#a855f7",
    quality: "1080p",
    active: true,
    movieUrl: "https://vidsrcme.ru/embed/movie/{tmdbId}",
    tvUrl: "https://vidsrcme.ru/embed/tv/{tmdbId}/{season}/{episode}",
    note: "Working 2025-07-02. Redirects to vidsrcme.ru.",
  },

  // === TIER 3: Currently Down (keep as reference, re-enable when back) ===
  {
    id: "vidsrc_xyz",
    name: "VidSrc XYZ",
    color: "#6366f1",
    quality: "1080p",
    active: false,
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
 */
export function generateAllEmbeds(
  tmdbId: number,
  type: "movie" | "series" | "anime",
  seasons: number = 1,
  maxSeasons: number = 5,
  maxEpsPerSeason: number = 3,
  totalEpisodes?: number
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
  const effectiveSeasons = Math.min(seasons, maxSeasons);

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
      const epsInSeason1 = totalEpisodes
        ? Math.min(totalEpisodes, maxEpsPerSeason)
        : maxEpsPerSeason;

      for (let s = 1; s <= effectiveSeasons; s++) {
        const eps = s === 1 ? epsInSeason1 : maxEpsPerSeason;
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