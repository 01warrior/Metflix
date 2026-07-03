import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { posterUrl, backdropUrl } from "@/lib/content-utils";
import type { Prisma } from "@prisma/client";

export async function GET(request: Request) {
  try {
    const { searchParams } = request.nextUrl;
    const q = searchParams.get("q")?.trim();
    const limit = Math.min(Math.max(parseInt(searchParams.get("limit") || "20", 10) || 20, 1), 50);

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
      take: limit,
      select: {
        id: true,
        tmdbId: true,
        anilistId: true,
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