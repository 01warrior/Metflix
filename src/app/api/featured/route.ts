import { NextResponse } from "next/server";
import { db } from "@/lib/db";

const TMDB_POSTER_BASE = "https://image.tmdb.org/t/p/w500";
const TMDB_BACKDROP_BASE = "https://image.tmdb.org/t/p/w1280";

function posterUrl(path: string | null): string | null {
  if (!path) return `https://placehold.co/300x450/1a1a2e/ffffff?text=No+Image`;
  return `${TMDB_POSTER_BASE}${path}`;
}

function backdropUrl(path: string | null): string | null {
  if (!path) return `https://placehold.co/1280x720/1a1a2e/ffffff?text=Stream`;
  return `${TMDB_BACKDROP_BASE}${path}`;
}

export async function GET() {
  try {
    const featured = await db.content.findMany({
      where: {
        featured: true,
        status: "published",
      },
      orderBy: [{ featuredOrder: "asc" }, { createdAt: "desc" }],
      take: 10,
      select: {
        id: true,
        tmdbId: true,
        title: true,
        titleFr: true,
        overview: true,
        overviewFr: true,
        posterPath: true,
        backdropPath: true,
        releaseDate: true,
        rating: true,
        voteCount: true,
        type: true,
        year: true,
        genres: true,
        runtime: true,
        seasons: true,
        status: true,
        featured: true,
        featuredOrder: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    const data = featured.map((item) => ({
      ...item,
      posterUrl: posterUrl(item.posterPath),
      backdropUrl: backdropUrl(item.backdropPath),
      posterPath: undefined,
      backdropPath: undefined,
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
    }));

    return NextResponse.json({ data });
  } catch (error) {
    console.error("[API /featured] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch featured content" },
      { status: 500 }
    );
  }
}