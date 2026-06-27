import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const ids = request.nextUrl.searchParams.get("ids");
    if (!ids) {
      return NextResponse.json({ data: [], total: 0 });
    }

    const idList = ids.split(",").filter(Boolean);
    if (idList.length === 0) {
      return NextResponse.json({ data: [], total: 0 });
    }

    const items = await db.content.findMany({
      where: { id: { in: idList } },
      orderBy: { createdAt: "desc" },
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

    // Use content-utils for poster URLs
    const data = items.map((item) => {
      let posterUrl = "/placeholder-poster.jpg";
      let backdropUrl = "/placeholder-backdrop.jpg";

      if (item.posterPath) {
        if (item.posterPath.startsWith("http")) {
          posterUrl = item.posterPath;
        } else {
          posterUrl = `https://image.tmdb.org/t/p/w500${item.posterPath}`;
        }
      }

      if (item.backdropPath) {
        if (item.backdropPath.startsWith("http")) {
          backdropUrl = item.backdropPath;
        } else {
          backdropUrl = `https://image.tmdb.org/t/p/w780${item.backdropPath}`;
        }
      }

      return {
        ...item,
        posterUrl,
        backdropUrl,
      };
    });

    return NextResponse.json({ data, total: data.length });
  } catch (error) {
    console.error("[API /content/favorites] Error:", error);
    return NextResponse.json({ data: [], total: 0 }, { status: 500 });
  }
}