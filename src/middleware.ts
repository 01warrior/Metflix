import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // Prevent the page from being opened in an iframe by other sites
  response.headers.set("X-Frame-Options", "SAMEORIGIN");

  // Content Security Policy - block external navigation from our page
  response.headers.set(
    "Content-Security-Policy",
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src * data: blob:",
      "font-src 'self' data:",
      "connect-src *",
      "media-src * blob:",
      "frame-src *",           // Allow embedding any source (needed for video players)
      "child-src *",            // Allow iframes from any source
      "object-src 'none'",      // Block plugins
      "base-uri 'self'",        // Prevent <base> tag injection
      "form-action 'self'",     // Only allow form submissions to self
    ].join("; ")
  );

  // Prevent MIME type sniffing
  response.headers.set("X-Content-Type-Options", "nosniff");

  // XSS Protection (legacy but doesn't hurt)
  response.headers.set("X-XSS-Protection", "1; mode=block");

  // Prevent Referrer leak
  response.headers.set("Referrer-Policy", "no-referrer-when-downgrade");

  return response;
}

export const config = {
  matcher: [
    // Apply to all routes except api routes and static files
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};