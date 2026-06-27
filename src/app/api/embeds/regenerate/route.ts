import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { generateAllEmbeds } from "@/lib/embed-providers";

/**
 * POST /api/embeds/regenerate
 * 
 * Regenerates embed URLs for existing content using the CURRENT active providers.
 * This is the key endpoint for staying up-to-date:
 * 1. Edit src/lib/embed-providers.ts (add/remove providers, set active: true/false)
 * 2. Call this endpoint to regenerate all embeds
 * 
 * Query params:
 *   type: "anime" | "movie" | "series" | "all" (default: "all")
 *   dryRun: "true" to preview without writing (default: false)
 */
export async function POST(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const type = searchParams.get("type") || "all";
    const dryRun = searchParams.get("dryRun") === "true";

    const where: Record<string, unknown> = {
      status: "published",
      tmdbId: { not: null },
    };
    if (type !== "all") where.type = type;

    const items = await db.content.findMany({
      where,
      select: {
        id: true,
        title: true,
        type: true,
        tmdbId: true,
        seasons: true,
      },
    });

    if (items.length === 0) {
      return NextResponse.json({ success: true, message: "No content with TMDB IDs found", stats: { processed: 0 } });
    }

    let processed = 0;
    let totalEmbeds = 0;
    let errors = 0;

    for (const item of items) {
      try {
        const contentType = item.type as "movie" | "series" | "anime";
        const embeds = generateAllEmbeds(
          item.tmdbId!,
          contentType,
          item.seasons || 1,
          5,  // maxSeasons
          3,  // maxEpsPerSeason
        );

        if (embeds.length > 0) {
          if (!dryRun) {
            // Delete old embeds for this content
            await db.embedSource.deleteMany({ where: { contentId: item.id } });
            // Insert new embeds in chunks
            for (let i = 0; i < embeds.length; i += 500) {
              await db.embedSource.createMany({
                data: embeds.slice(i, i + 500).map((e) => ({ ...e, contentId: item.id })),
              });
            }
          }
          totalEmbeds += embeds.length;
        }
        processed++;
      } catch {
        errors++;
      }
    }

    const totalInDb = await db.embedSource.count();

    return NextResponse.json({
      success: true,
      dryRun,
      stats: {
        processed,
        errors,
        totalEmbedsGenerated: totalEmbeds,
        totalEmbedsInDb: totalInDb,
      },
      message: dryRun
        ? `Preview: would regenerate ${totalEmbeds} embeds for ${processed} items`
        : `Regenerated ${totalEmbeds} embeds for ${processed} items. ${errors} errors.`,
    });
  } catch (error) {
    console.error("[API /embeds/regenerate] Error:", error);
    return NextResponse.json({ error: "Regeneration failed" }, { status: 500 });
  }
}