import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { getDetails, tmdbProfileUrl } from "@/lib/tmdb";

export async function GET(request: Request) {
  try {
    const { searchParams } = request.nextUrl;
    const tmdbId = parseInt(searchParams.get("tmdbId") || "0", 10);
    const type = searchParams.get("type") || "movie";

    if (!tmdbId) {
      return NextResponse.json({ error: "tmdbId is required" }, { status: 400 });
    }

    const mediaType = type === "anime" ? "tv" : type === "series" ? "tv" : "movie";
    const details = await getDetails(tmdbId, mediaType as "movie" | "tv");

    if (!details?.credits) {
      return NextResponse.json({ cast: [], crew: [] });
    }

    const cast = details.credits.cast.slice(0, 20).map((person) => ({
      id: person.id,
      name: person.name,
      character: person.character,
      profileUrl: tmdbProfileUrl(person.profile_path) || "",
      order: person.order,
    }));

    const crewMap = new Map<string, (typeof details.credits.crew)[0]>();
    for (const person of details.credits.crew) {
      if (["Director", "Writer", "Producer", "Screenplay", "Creator"].includes(person.job)) {
        const key = `${person.id}-${person.job}`;
        if (!crewMap.has(key)) {
          crewMap.set(key, person);
        }
      }
    }

    const crew = [...crewMap.values()].slice(0, 10).map((person) => ({
      id: person.id,
      name: person.name,
      job: person.job,
      department: person.department,
      profileUrl: tmdbProfileUrl(person.profile_path) || "",
    }));

    return NextResponse.json({ cast, crew });
  } catch (error) {
    console.error("[API /tmdb/cast] Error:", error);
    return NextResponse.json({ error: "Failed to fetch cast" }, { status: 500 });
  }
}