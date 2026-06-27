import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const [
      totalContent,
      animeTotal,
      animeWithEmbeds,
      totalAnimeEmbeds,
      moviesTotal,
      seriesTotal,
      mangaTotal,
    ] = await Promise.all([
      db.content.count(),
      db.content.count({ where: { type: "anime" } }),
      db.content.count({
        where: {
          type: "anime",
          embeds: { some: {} },
        },
      }),
      db.embedSource.count({
        where: { content: { type: "anime" } },
      }),
      db.content.count({ where: { type: "movie" } }),
      db.content.count({ where: { type: "series" } }),
      db.content.count({ where: { type: "manga" } }),
    ]);

    // Get last 5 anime added
    const recentAnime = await db.content.findMany({
      where: { type: "anime" },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        title: true,
        anilistId: true,
        rating: true,
        year: true,
        posterPath: true,
      },
    });

    return NextResponse.json({
      totalContent,
      anime: {
        total: animeTotal,
        withEmbeds: animeWithEmbeds,
        totalEmbeds: totalAnimeEmbeds,
      },
      movies: { total: moviesTotal },
      series: { total: seriesTotal },
      manga: { total: mangaTotal },
      recentAnime,
    });
  } catch (error) {
    console.error("[API /anime/stats] Error:", error);
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}