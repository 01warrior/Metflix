import { NextRequest, NextResponse } from "next/server";

const MANGADEX_BASE = "https://api.mangadex.org";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q");

    if (!q || q.trim().length === 0) {
      return NextResponse.json({ error: "Query parameter 'q' is required" }, { status: 400 });
    }

    const res = await fetch(
      `${MANGADEX_BASE}/manga?title=${encodeURIComponent(q.trim())}&limit=5&includes[]=cover_art`,
      {
        headers: {
          "User-Agent": "StreamVibe/1.0",
        },
        next: { revalidate: 300 },
      }
    );

    if (!res.ok) {
      return NextResponse.json(
        { error: `MangaDex API error: ${res.status}` },
        { status: res.status }
      );
    }

    const data = await res.json();

    const results = (data.data || []).map((manga: Record<string, unknown>) => {
      const attrs = manga.attributes as Record<string, unknown>;
      const relationships = manga.relationships as Array<Record<string, unknown>>;

      // Get title - prefer English, then first alt title
      const titles = attrs.title as Record<string, string> | undefined;
      const altTitles = (attrs.altTitles || []) as Array<Record<string, string>>;
      let title =
        titles?.en ||
        titles?.["ja-ro"] ||
        titles?.ja ||
        Object.values(titles || {})[0] ||
        "Sans titre";

      // If English title is empty, try alt titles
      if (!title || title === "") {
        for (const alt of altTitles) {
          const altEn = alt.en || alt["ja-ro"];
          if (altEn) {
            title = altEn;
            break;
          }
        }
        if (!title) {
          title = Object.values(altTitles[0] || {})[0] || "Sans titre";
        }
      }

      // Get cover filename from relationships
      const coverRel = relationships.find(
        (r) => r.type === "cover_art"
      );
      const coverFileName =
        (coverRel?.attributes as Record<string, unknown>)?.fileName as string | undefined;

      const mangaId = manga.id as string;

      return {
        id: mangaId,
        title,
        coverUrl: coverFileName
          ? `https://uploads.mangadex.org/covers/${mangaId}/${coverFileName}`
          : null,
        status: (attrs.status as string) || null,
        year: (attrs.year as number) || null,
        availableTranslatedLanguages: (attrs.availableTranslatedLanguages as string[]) || [],
      };
    });

    return NextResponse.json({ data: results });
  } catch (error) {
    console.error("MangaDex search error:", error);
    return NextResponse.json(
      { error: "Failed to search MangaDex" },
      { status: 500 }
    );
  }
}