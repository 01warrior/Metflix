import { NextRequest, NextResponse } from "next/server";

const MANGADEX_BASE = "https://api.mangadex.org";

/**
 * GET /api/manga/resolve
 * Finds MangaDex chapters for a manga title.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const title = searchParams.get("title")?.trim();

    if (!title) {
      return NextResponse.json({ error: "title required" }, { status: 400 });
    }

    const languages = ["fr", "en", "es", "pt-br"];
    const limit = 100;

    // 1. Search MangaDex
    const searchData = await safeFetch(
      `${MANGADEX_BASE}/manga?title=${encodeURIComponent(title)}&limit=5&contentRating[]=safe&contentRating[]=suggestive&order[followedCount]=desc`
    );
    if (!searchData || !searchData.data || searchData.data.length === 0) {
      return NextResponse.json({ success: false, error: "Non disponible sur MangaDex", searchedTitle: title });
    }

    // 2. Extract and score results
    const results = searchData.data.map((manga: any) => {
      const attrs = manga.attributes || {};
      const titles = attrs.title || {};
      const mangaTitle = titles.en || titles["ja-ro"] || titles.ja || Object.values(titles)[0] || "Sans titre";
      return {
        id: manga.id,
        title: mangaTitle,
        langs: attrs.availableTranslatedLanguages || [],
        score: titleScore(title, mangaTitle),
      };
    });

    results.sort((a: any, b: any) => b.score - a.score);

    // 3. Try to find chapters (scanlated first, then external)
    for (const result of results.slice(0, 3)) {
      // Phase 1: scanlated chapters
      for (const lang of languages) {
        const chapters = await fetchChaptersSimple(result.id, lang, limit, false);
        if (chapters.length > 0) {
          return NextResponse.json({
            success: true,
            mangadexId: result.id,
            mangadexTitle: result.title,
            searchedTitle: title,
            chapters: chapters.map((ch: any) => ({ ...ch, lang })),
            totalReturned: chapters.length,
            language: lang,
            languagesAvailable: result.langs,
          });
        }
      }
      // Phase 2: external-only chapters for this result
      for (const lang of languages) {
        const chapters = await fetchChaptersSimple(result.id, lang, limit, true);
        if (chapters.length > 0) {
          return NextResponse.json({
            success: true,
            mangadexId: result.id,
            mangadexTitle: result.title,
            searchedTitle: title,
            chapters: chapters.map((ch: any) => ({ ...ch, lang })),
            totalReturned: chapters.length,
            language: lang,
            languagesAvailable: result.langs,
            externalOnly: true,
          });
        }
      }
    }

    return NextResponse.json({
      success: false,
      error: "Aucun chapitre disponible sur MangaDex",
      searchedTitle: title,
    });
  } catch (error) {
    console.error("[Manga Resolve] Error:", error);
    return NextResponse.json({ error: "Erreur MangaDex" }, { status: 500 });
  }
}

function titleScore(search: string, candidate: string): number {
  const a = search.toLowerCase().trim();
  const b = candidate.toLowerCase().trim();
  if (a === b) return 100;
  if (b.startsWith(a) || a.startsWith(b)) {
    const ratio = Math.min(a.length, b.length) / Math.max(a.length, b.length);
    return ratio > 0.8 ? 90 : ratio > 0.5 ? 70 : 50;
  }
  if (b.includes(a) || a.includes(b)) return 40;
  return 0;
}

async function safeFetch(url: string): Promise<any> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "METFLIX/1.0" },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

async function fetchChaptersSimple(
  mangadexId: string,
  lang: string,
  limit: number,
  externalOnly: boolean
): Promise<any[]> {
  try {
    const url = `${MANGADEX_BASE}/manga/${mangadexId}/feed?translatedLanguage[]=${lang}&limit=${limit}&order[chapter]=asc`;
    const data = await safeFetch(url);
    if (!data || !data.data) return [];

    return data.data
      .filter((ch: any) => {
        const attrs = ch.attributes || {};
        if (externalOnly) return !!attrs.externalUrl;
        return !attrs.externalUrl && attrs.pages > 0;
      })
      .map((ch: any) => {
        const attrs = ch.attributes || {};
        return {
          id: ch.id,
          chapter: attrs.chapter || null,
          title: attrs.title || null,
          volume: attrs.volume || null,
          pages: attrs.pages || 0,
          publishAt: attrs.publishAt || null,
          readableAt: attrs.readableAt || null,
          groupName: null,
          externalUrl: attrs.externalUrl || null,
        };
      });
  } catch {
    return [];
  }
}