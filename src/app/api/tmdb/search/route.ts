import { NextRequest, NextResponse } from "next/server";
import { searchMulti, tmdbPosterUrl, tmdbBackdropUrl, validateTmdbApiKey } from "@/lib/tmdb";

/**
 * GET /api/tmdb/search?q=query
 * 
 * Search TMDB for movies, series, anime. Returns formatted results
 * that can be displayed alongside local content.
 * 
 * Query params:
 *   q: search query (required)
 *   page: page number (default 1)
 */
export async function GET(request: NextRequest) {
  try {
    const query = request.nextUrl.searchParams.get("q");
    if (!query || query.trim().length < 2) {
      return NextResponse.json({ error: "Query too short (min 2 chars)" }, { status: 400 });
    }

    const isValid = await validateTmdbApiKey();
    if (!isValid) {
      return NextResponse.json({ error: "TMDB not configured" }, { status: 503 });
    }

    const page = Math.max(1, parseInt(request.nextUrl.searchParams.get("page") || "1"));
    const results = await searchMulti(query.trim(), page);

    const formatted = results.map((r) => ({
      tmdbId: r.id,
      title: r.title || r.name || "Sans titre",
      originalTitle: r.original_title || r.original_name || "",
      overview: r.overview || "",
      posterUrl: tmdbPosterUrl(r.poster_path),
      backdropUrl: tmdbBackdropUrl(r.backdrop_path),
      type: r.media_type === "movie" ? "movie" : r.media_type === "tv" ? "series" : "unknown",
      year: (r.release_date || r.first_air_date || "").substring(0, 4) || null,
      rating: r.vote_average || 0,
      popularity: r.popularity || 0,
    }));

    return NextResponse.json({
      query,
      page,
      results: formatted,
      total: formatted.length,
    });
  } catch (error) {
    console.error("[TMDB Search] Error:", error);
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}