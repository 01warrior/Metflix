import { NextRequest, NextResponse } from "next/server";
import { getMovieDetails, getTvDetails } from "@/lib/tmdb";

/**
 * GET /api/tmdb/videos?tmdbId=123&type=movie
 *
 * Fetch YouTube trailer key for a TMDB movie or TV show.
 */
export async function GET(request: NextRequest) {
  try {
    const tmdbId = request.nextUrl.searchParams.get("tmdbId");
    const type = request.nextUrl.searchParams.get("type"); // "movie" | "series" | "anime"

    if (!tmdbId) {
      return NextResponse.json({ error: "tmdbId is required" }, { status: 400 });
    }

    const id = parseInt(tmdbId);
    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid tmdbId" }, { status: 400 });
    }

    const isMovie = type === "movie";
    const details = isMovie
      ? await getMovieDetails(id)
      : await getTvDetails(id);

    const videos = details.videos?.results || [];

    // Prefer: official trailer > trailer > any YouTube video > teaser
    const trailer =
      videos.find((v) => v.type === "Trailer" && v.site === "YouTube" && v.official) ||
      videos.find((v) => v.type === "Trailer" && v.site === "YouTube") ||
      videos.find((v) => v.site === "YouTube" && v.type === "Teaser") ||
      videos.find((v) => v.site === "YouTube");

    if (!trailer) {
      return NextResponse.json({ trailer: null, allVideos: [] });
    }

    return NextResponse.json({
      trailer: {
        key: trailer.key,
        name: trailer.name,
        type: trailer.type,
        site: trailer.site,
        official: trailer.official,
      },
      allVideos: videos
        .filter((v) => v.site === "YouTube")
        .slice(0, 5)
        .map((v) => ({ key: v.key, name: v.name, type: v.type })),
    });
  } catch (error) {
    console.error("[TMDB Videos] Error:", error);
    return NextResponse.json({ trailer: null, allVideos: [] }, { status: 500 });
  }
}