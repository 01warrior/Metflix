import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { posterUrl, backdropUrl } from "@/lib/content-utils";

// GET /api/featured — list featured content (for hero carousel)
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

// POST /api/featured — add content to featured
// Body: { id: string } or { ids: string[] }
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const ids: string[] = body.ids || (body.id ? [body.id] : []);

    if (ids.length === 0) {
      return NextResponse.json({ error: "id or ids is required" }, { status: 400 });
    }

    // Get current max order
    const maxOrder = await db.content.aggregate({
      _max: { featuredOrder: true },
      where: { featured: true },
    });
    let nextOrder = (maxOrder._max.featuredOrder ?? -1) + 1;

    // Update each content
    const results = [];
    for (const id of ids) {
      try {
        const updated = await db.content.update({
          where: { id },
          data: { featured: true, featuredOrder: nextOrder++ },
        });
        results.push({ id: updated.id, success: true });
      } catch {
        results.push({ id, success: false, error: "Not found" });
      }
    }

    return NextResponse.json({ data: results });
  } catch (error) {
    console.error("[API /featured POST] Error:", error);
    return NextResponse.json({ error: "Failed to add featured" }, { status: 500 });
  }
}

// PATCH /api/featured — reorder featured items
// Body: { items: { id: string, order: number }[] }
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const items: { id: string; order: number }[] = body.items || [];

    if (items.length === 0) {
      return NextResponse.json({ error: "items is required" }, { status: 400 });
    }

    // Update orders in a transaction
    await db.$transaction(
      items.map((item) =>
        db.content.update({
          where: { id: item.id },
          data: { featuredOrder: item.order },
        })
      )
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[API /featured PATCH] Error:", error);
    return NextResponse.json({ error: "Failed to reorder" }, { status: 500 });
  }
}

// DELETE /api/featured — remove content from featured
// Body: { id: string } or { ids: string[] }
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const ids: string[] = body.ids || (body.id ? [body.id] : []);

    if (ids.length === 0) {
      return NextResponse.json({ error: "id or ids is required" }, { status: 400 });
    }

    await db.content.updateMany({
      where: { id: { in: ids } },
      data: { featured: false, featuredOrder: 0 },
    });

    // Re-index remaining featured items
    const remaining = await db.content.findMany({
      where: { featured: true, status: "published" },
      orderBy: { featuredOrder: "asc" },
      select: { id: true },
    });

    await db.$transaction(
      remaining.map((item, index) =>
        db.content.update({
          where: { id: item.id },
          data: { featuredOrder: index },
        })
      )
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[API /featured DELETE] Error:", error);
    return NextResponse.json({ error: "Failed to remove featured" }, { status: 500 });
  }
}