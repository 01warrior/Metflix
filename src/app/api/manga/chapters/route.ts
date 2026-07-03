import { NextRequest, NextResponse } from "next/server";

const MANGADEX_BASE = "https://api.mangadex.org";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const mangadexId = searchParams.get("mangadexId");
    const lang = searchParams.get("lang") || "fr";

    if (!mangadexId) {
      return NextResponse.json(
        { error: "Parameter 'mangadexId' is required" },
        { status: 400 }
      );
    }

    const res = await fetch(
      `${MANGADEX_BASE}/manga/${mangadexId}/feed?translatedLanguage[]=${lang}&limit=100&order[chapter]=asc`,
      {
        headers: {
          "User-Agent": "METFLIX/1.0",
        },
        next: { revalidate: 60 },
      }
    );

    if (!res.ok) {
      return NextResponse.json(
        { error: `MangaDex API error: ${res.status}` },
        { status: res.status }
      );
    }

    const data = await res.json();

    const chapters = (data.data || [])
      .filter((chapter: Record<string, unknown>) => {
        const attrs = chapter.attributes as Record<string, unknown>;
        // Filter out chapters with external URLs (not readable on MangaDex)
        if (attrs.externalUrl) return false;
        // Filter out chapters with 0 pages
        if ((attrs.pages as number) === 0) return false;
        return true;
      })
      .map((chapter: Record<string, unknown>) => {
        const attrs = chapter.attributes as Record<string, unknown>;
        return {
          id: chapter.id as string,
          chapter: attrs.chapter as string | null,
          title: attrs.title as string | null,
          volume: attrs.volume as string | null,
          pages: (attrs.pages as number) || 0,
          publishAt: attrs.publishAt as string | null,
          readableAt: attrs.readableAt as string | null,
        };
      });

    return NextResponse.json({ data: chapters });
  } catch (error) {
    console.error("MangaDex chapters error:", error);
    return NextResponse.json(
      { error: "Failed to fetch chapters" },
      { status: 500 }
    );
  }
}