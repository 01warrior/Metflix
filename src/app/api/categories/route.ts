import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const categories = await db.category.findMany({
      orderBy: { order: "asc" },
      include: {
        _count: {
          select: { contents: true },
        },
      },
    });

    // Group by type
    const grouped: Record<string, typeof categories> = {};
    for (const cat of categories) {
      const type = cat.type || "all";
      if (!grouped[type]) {
        grouped[type] = [];
      }
      grouped[type].push({
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        icon: cat.icon,
        type: cat.type,
        order: cat.order,
        createdAt: cat.createdAt.toISOString(),
        contentCount: cat._count.contents,
      });
    }

    // Also include a flat list for convenience
    const flat = categories.map((cat) => ({
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
      icon: cat.icon,
      type: cat.type,
      order: cat.order,
      createdAt: cat.createdAt.toISOString(),
      contentCount: cat._count.contents,
    }));

    return NextResponse.json({ data: flat, grouped });
  } catch (error) {
    console.error("[API /categories] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch categories" },
      { status: 500 }
    );
  }
}