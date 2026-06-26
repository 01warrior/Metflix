import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import type { Prisma } from "@prisma/client";

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

export async function GET(request: Request) {
  try {
    const { searchParams } = request.nextUrl;
    const q = searchParams.get("q")?.trim();

    if (!q || q.length < 2) {
      return NextResponse.json({ data: [], query: "", count: 0 });
    }

    const where: Prisma.ContentWhereInput = {
      status: "published",
      OR: [
        { title: { contains: q } },
        { titleFr: { contains: q } },
        { genres: { contains: q } },
      ],
    };

    const results = await db.content.findMany({
      where,
      orderBy: [{ rating: "desc" }, { voteCount: "desc" }],
      take: 20,
      select: {
        id: true,
        tmdbId: true,
        title: true,
        titleFr: true,
        posterPath: true,
        backdropPath: true,
        rating: true,
        type: true,
        year: true,
        genres: true,
        releaseDate: true,
      },
    });

    const data = results.map((item) => ({
      ...item,
      posterUrl: posterUrl(item.posterPath),
      backdropUrl: backdropUrl(item.backdropPath),
      voteCount: 0,
      featured: false,
      posterPath: undefined,
      backdropPath: undefined,
    }));

    return NextResponse.json({ data, query: q, count: data.length });
  } catch (error) {
    console.error("[API /search] Error:", error);
    return NextResponse.json(
      { error: "Failed to search content" },
      { status: 500 }
    );
  }
}