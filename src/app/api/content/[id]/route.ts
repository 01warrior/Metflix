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

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const content = await db.content.findUnique({
      where: { id },
      include: {
        embeds: {
          where: { isActive: true },
          orderBy: [{ season: "asc" }, { episode: "asc" }, { lang: "asc" }],
        },
        categories: {
          include: {
            category: {
              select: { id: true, name: true, slug: true },
            },
          },
        },
      },
    });

    if (!content) {
      return NextResponse.json({ error: "Content not found" }, { status: 404 });
    }

    // Get related content
    const contentGenres = content.genres
      ? content.genres.split(",").map((g) => g.trim())
      : [];

    let related = [];
    if (contentGenres.length > 0) {
      const relatedRaw = await db.content.findMany({
        where: {
          id: { not: content.id },
          type: content.type,
          status: "published",
          OR: contentGenres.map((genre) => ({
            genres: { contains: genre },
          })),
        },
        orderBy: { rating: "desc" },
        take: 6,
      });

      related = relatedRaw.map((item) => ({
        id: item.id,
        tmdbId: item.tmdbId,
        title: item.title,
        titleFr: item.titleFr,
        overview: item.overview,
        overviewFr: item.overviewFr,
        posterUrl: posterUrl(item.posterPath),
        backdropUrl: backdropUrl(item.backdropPath),
        rating: item.rating,
        voteCount: item.voteCount,
        type: item.type,
        year: item.year,
        genres: item.genres,
        runtime: item.runtime,
        seasons: item.seasons,
        featured: item.featured,
      }));
    }

    const result = {
      id: content.id,
      tmdbId: content.tmdbId,
      title: content.title,
      titleFr: content.titleFr,
      overview: content.overview,
      overviewFr: content.overviewFr,
      posterUrl: posterUrl(content.posterPath),
      backdropUrl: backdropUrl(content.backdropPath),
      releaseDate: content.releaseDate,
      rating: content.rating,
      voteCount: content.voteCount,
      type: content.type,
      year: content.year,
      genres: content.genres,
      runtime: content.runtime,
      seasons: content.seasons,
      featured: content.featured,
      categories: content.categories.map((cc) => cc.category),
      embeds: content.embeds,
      related,
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error("[API /content/:id] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch content" },
      { status: 500 }
    );
  }
}