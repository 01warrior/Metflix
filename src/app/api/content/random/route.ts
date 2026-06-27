import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const type = request.nextUrl.searchParams.get("type");

    const where: Record<string, unknown> = { status: "published" };
    if (type && type !== "all") {
      where.type = type;
    }

    const totalCount = await db.content.count({ where });
    if (totalCount === 0) {
      return NextResponse.json({ error: "No content found" }, { status: 404 });
    }

    // Get a random offset
    const randomOffset = Math.floor(Math.random() * totalCount);

    const item = await db.content.findFirst({
      where,
      skip: randomOffset,
      select: {
        id: true,
        tmdbId: true,
        anilistId: true,
        title: true,
        titleFr: true,
        overview: true,
        posterPath: true,
        backdropPath: true,
        rating: true,
        year: true,
        type: true,
        genres: true,
        runtime: true,
        seasons: true,
        status: true,
        createdAt: true,
      },
    });

    if (!item) {
      return NextResponse.json({ error: "Random content not found" }, { status: 404 });
    }

    let posterUrl = "/placeholder-poster.jpg";
    let backdropUrl = "/placeholder-backdrop.jpg";

    if (item.posterPath) {
      posterUrl = item.posterPath.startsWith("http")
        ? item.posterPath
        : `https://image.tmdb.org/t/p/w500${item.posterPath}`;
    }
    if (item.backdropPath) {
      backdropUrl = item.backdropPath.startsWith("http")
        ? item.backdropPath
        : `https://image.tmdb.org/t/p/w780${item.backdropPath}`;
    }

    return NextResponse.json({ data: { ...item, posterUrl, backdropUrl } });
  } catch (error) {
    console.error("[API /content/random] Error:", error);
    return NextResponse.json({ error: "Failed to get random content" }, { status: 500 });
  }
}