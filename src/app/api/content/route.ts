import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import type { Prisma } from "@prisma/client";

const TMDB_POSTER_BASE = "https://image.tmdb.org/t/p/w500";
const TMDB_BACKDROP_BASE = "https://image.tmdb.org/t/p/w1280";

function posterUrl(path: string | null, width = 300, height = 450): string {
  if (!path) return `https://placehold.co/${width}x${height}/1a1a2e/ffffff?text=No+Image`;
  return `${TMDB_POSTER_BASE}${path}`;
}

function backdropUrl(path: string | null): string {
  if (!path) return `https://placehold.co/1280x720/1a1a2e/ffffff?text=No+Backdrop`;
  return `${TMDB_BACKDROP_BASE}${path}`;
}

interface ContentRow {
  id: string;
  tmdbId: number | null;
  title: string;
  titleFr: string | null;
  overview: string | null;
  overviewFr: string | null;
  posterPath: string | null;
  backdropPath: string | null;
  releaseDate: string | null;
  rating: number;
  voteCount: number;
  type: string;
  year: number | null;
  genres: string | null;
  runtime: number | null;
  seasons: number | null;
  status: string;
  featured: boolean;
  featuredOrder: number | null;
  createdAt: Date;
  updatedAt: Date;
}

function formatContent(item: ContentRow) {
  return {
    ...item,
    posterUrl: posterUrl(item.posterPath),
    backdropUrl: backdropUrl(item.backdropPath),
    posterPath: undefined,
    backdropPath: undefined,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  };
}

export async function GET(request: Request) {
  try {
    const { searchParams } = request.nextUrl;

    const type = searchParams.get("type");
    const categorySlug = searchParams.get("category");
    const search = searchParams.get("search");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
    const sort = searchParams.get("sort") || "recent";

    // Build where clause
    const where: Prisma.ContentWhereInput = { status: "published" };

    if (type) {
      where.type = type;
    }

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { titleFr: { contains: search } },
      ];
    }

    if (categorySlug) {
      where.categories = {
        some: {
          category: {
            slug: categorySlug,
          },
        },
      };
    }

    // Build orderBy
    let orderBy: Prisma.ContentOrderByWithRelationInput;
    switch (sort) {
      case "rating":
        orderBy = { rating: "desc" };
        break;
      case "created":
        orderBy = { createdAt: "desc" };
        break;
      case "title_asc":
        orderBy = { title: "asc" };
        break;
      case "title_desc":
        orderBy = { title: "desc" };
        break;
      case "recent":
      default:
        orderBy = { createdAt: "desc" };
        break;
    }

    const [content, total] = await Promise.all([
      db.content.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.content.count({ where }),
    ]);

    const formattedData = content.map(formatContent);

    return NextResponse.json({
      data: formattedData,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("[API /content] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch content" },
      { status: 500 }
    );
  }
}