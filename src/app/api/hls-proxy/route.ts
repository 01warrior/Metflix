import { NextRequest, NextResponse } from "next/server";

// Streaming proxy that relays HLS (m3u8/TS) segments from remote CDNs
// (france24/akamai, dw, …) that do NOT send CORS headers to browsers.
// Same-origin requests => no CORS check. Range requests are forwarded so
// segment seeking/buffering still works.
export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");
  if (!url) return new NextResponse("Missing url", { status: 400 });

  let target: URL;
  try {
    target = new URL(url);
  } catch {
    return new NextResponse("Bad url", { status: 400 });
  }
  if (!["http:", "https:"].includes(target.protocol)) {
    return new NextResponse("Bad protocol", { status: 400 });
  }

  const headers = new Headers({
    "User-Agent":
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
    Accept: "*/*",
  });
  const range = req.headers.get("range");
  if (range) headers.set("Range", range);

  try {
    const upstream = await fetch(target, {
      headers,
      cache: "no-store",
      redirect: "follow",
    });

    if (!upstream.ok) {
      return new NextResponse(`Upstream error ${upstream.status}`, {
        status: upstream.status,
      });
    }

    const resHeaders = new Headers();
    const ct = upstream.headers.get("content-type");
    if (ct) resHeaders.set("Content-Type", ct);
    for (const h of ["accept-ranges", "content-range", "content-length", "cache-control"]) {
      const v = upstream.headers.get(h);
      if (v) resHeaders.set(h, v);
    }

    return new Response(upstream.body, {
      status: upstream.status,
      headers: resHeaders,
    });
  } catch (e) {
    return new NextResponse("Proxy error", { status: 502 });
  }
}