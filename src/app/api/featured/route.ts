import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { posterUrl, backdropUrl } from "@/lib/content-utils";

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
        anilistId: true,
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