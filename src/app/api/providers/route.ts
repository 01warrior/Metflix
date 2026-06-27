import { NextResponse } from "next/server";
import { EMBED_PROVIDERS, getActiveProviders } from "@/lib/embed-providers";

/**
 * GET /api/providers
 * Returns the list of all providers with their status.
 * Called by the admin panel to display provider health.
 */
export async function GET() {
  // Quick check: test each active provider with a known TMDB ID (550 = Fight Club)
  const TEST_MOVIE_ID = 550;
  const TEST_TV_ID = 1396; // Breaking Bad

  const results = await Promise.allSettled(
    EMBED_PROVIDERS.filter((p) => p.active).map(async (provider) => {
      const movieUrl = provider.movieUrl.replace("{tmdbId}", String(TEST_MOVIE_ID));
      const tvUrl = provider.tvUrl
        .replace("{tmdbId}", String(TEST_TV_ID))
        .replace("{season}", "1")
        .replace("{episode}", "1");

      let movieStatus = 0;
      let tvStatus = 0;

      try {
        const r = await fetch(movieUrl, {
          method: "HEAD",
          signal: AbortSignal.timeout(8000),
          headers: { Referer: "http://localhost:3000" },
        });
        // 200, 301, 302 are all acceptable (browser follows redirects)
        movieStatus = [200, 201, 301, 302, 307, 308].includes(r.status) ? 200 : r.status;
      } catch {
        movieStatus = 0;
      }

      try {
        const r = await fetch(tvUrl, {
          method: "HEAD",
          signal: AbortSignal.timeout(8000),
          headers: { Referer: "http://localhost:3000" },
        });
        tvStatus = [200, 201, 301, 302, 307, 308].includes(r.status) ? 200 : r.status;
      } catch {
        tvStatus = 0;
      }

      return {
        id: provider.id,
        name: provider.name,
        color: provider.color,
        quality: provider.quality,
        active: provider.active,
        movieStatus,
        tvStatus,
        working: movieStatus === 200 || tvStatus === 200,
        note: provider.note,
      };
    })
  );

  const providers = results
    .filter((r): r is PromiseFulfilledResult<ReturnType<typeof results[0]> & { status: "fulfilled" }> => r.status === "fulfilled")
    .map((r) => r.value);

  return NextResponse.json({
    total: EMBED_PROVIDERS.length,
    active: getActiveProviders().length,
    providers,
  });
}