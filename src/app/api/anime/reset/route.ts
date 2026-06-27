import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function DELETE() {
  try {
    // Delete all embed sources for anime content
    const animeIds = await db.content.findMany({
      where: { type: "anime" },
      select: { id: true },
    });

    if (animeIds.length === 0) {
      return NextResponse.json({
        success: true,
        deleted: { content: 0, embeds: 0 },
      });
    }

    const animeIdList = animeIds.map((c) => c.id);

    const embedResult = await db.embedSource.deleteMany({
      where: { contentId: { in: animeIdList } },
    });

    const contentResult = await db.content.deleteMany({
      where: { type: "anime" },
    });

    return NextResponse.json({
      success: true,
      deleted: {
        content: contentResult.count,
        embeds: embedResult.count,
      },
    });
  } catch (error) {
    console.error("[API /anime/reset] Error:", error);
    return NextResponse.json({ error: "Reset failed" }, { status: 500 });
  }
}