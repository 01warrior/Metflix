import { NextRequest, NextResponse } from "next/server";

const MANGADEX_BASE = "https://api.mangadex.org";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const mangadexId = searchParams.get("mangadexId");
    const lang = searchParams.get("lang") || "fr";
    const limit = Math.min(Math.max(Number(searchParams.get("limit")) || 200, 1), 500);
    const offset = Math.max(Number(searchParams.get("offset")) || 0, 0);

    if (!mangadexId) {
      return NextResponse.json(
        { error: "Parameter 'mangadexId' is required" },
        { status: 400 }
      );
    }

    const res = await fetch(
      `${MANGADEX_BASE}/manga/${mangadexId}/feed?translatedLanguage[]=${lang}&limit=${limit}&offset=${offset}&order[chapter]=asc&includes[]=scanlation_group`,
      {
        headers: {
          "User-Agent": "METFLIX/1.0",
        },
        signal: AbortSignal.timeout(15000),
      }
    );

    if (!res.ok) {
      return NextResponse.json(
        { error: `MangaDex API error: ${res.status}` },
        { status: res.status }
      );
    }

    const data = await res.json();
    const total = (data.total as number) || 0;

    const chapters = (data.data || [])
      .filter((chapter: Record<string, unknown>) => {
        const attrs = chapter.attributes as Record<string, unknown>;
        if (attrs.externalUrl) return false;
        if ((attrs.pages as number) === 0) return false;
        return true;
      })
      .map((chapter: Record<string, unknown>) => {
        const attrs = chapter.attributes as Record<string, unknown>;
        const relationships = chapter.relationships as Array<Record<string, unknown>>;
        const groupRel = relationships.find((r) => r.type === "scanlation_group");
        const groupName = (groupRel?.attributes as Record<string, unknown>)?.name as string | undefined;

        return {
          id: chapter.id as string,
          chapter: attrs.chapter as string | null,
          title: attrs.title as string | null,
          volume: attrs.volume as string | null,
          pages: (attrs.pages as number) || 0,
          publishAt: attrs.publishAt as string | null,
          readableAt: attrs.readableAt as string | null,
          groupName: groupName || null,
        };
      });

    return NextResponse.json({
      data: chapters,
      total,
      offset,
      limit,
      hasMore: offset + chapters.length < total,
    });
  } catch (error) {
    console.error("MangaDex chapters error:", error);
    return NextResponse.json(
      { error: "Failed to fetch chapters" },
      { status: 500 }
    );
  }
}