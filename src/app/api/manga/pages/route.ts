import { NextRequest, NextResponse } from "next/server";

const MANGADEX_BASE = "https://api.mangadex.org";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const chapterId = searchParams.get("chapterId");

    if (!chapterId) {
      return NextResponse.json(
        { error: "Parameter 'chapterId' is required" },
        { status: 400 }
      );
    }

    const res = await fetch(`${MANGADEX_BASE}/at-home/server/${chapterId}`, {
      headers: {
        "User-Agent": "StreamVibe/1.0",
      },
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `MangaDex API error: ${res.status}` },
        { status: res.status }
      );
    }

    const data = await res.json();

    const baseUrl = data.baseUrl as string;
    const hash = data.chapter.hash as string;
    const pages = (data.chapter.dataSaver || []) as string[];
    const pagesHd = (data.chapter.data || []) as string[];

    return NextResponse.json({
      baseUrl,
      hash,
      pages,
      pagesHd,
    });
  } catch (error) {
    console.error("MangaDex pages error:", error);
    return NextResponse.json(
      { error: "Failed to fetch chapter pages" },
      { status: 500 }
    );
  }
}