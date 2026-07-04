"use client";

import { useEffect } from "react";

/**
 * RedirectBlocker — Defense against malicious redirects from embed servers.
 *
 * Layer 1: Override window.open to block ALL popup spam (we don't need popups)
 * Layer 2: Intercept dynamically injected iframes/links outside our React app
 * Layer 3: Block click events on external links injected by embeds
 * Layer 4: Block injected meta-refresh redirect tags
 *
 * NOTE: The main defense is the `sandbox` attribute on the player iframe.
 * This component provides additional client-side protection as a safety net.
 */

function isExternalUrl(url: string): boolean {
  try {
    if (!url || url === "#" || url.startsWith("javascript:")) return false;
    const parsed = new URL(url, window.location.origin);
    return parsed.origin !== window.location.origin;
  } catch {
    return true;
  }
}

/** Known-safe iframe domains that should NEVER be blocked */
const SAFE_IFRAME_DOMAINS = [
  "youtube.com",
  "youtube-nocookie.com",
  "youtu.be",
  "youtube-nocookie.com",
];

function isSafeIframeSrc(src: string): boolean {
  if (!src) return false;
  try {
    const parsed = new URL(src, window.location.origin);
    // Same origin is always safe
    if (parsed.origin === window.location.origin) return true;
    // Check known-safe domains
    return SAFE_IFRAME_DOMAINS.some((d) => parsed.hostname === d || parsed.hostname.endsWith(`.${d}`));
  } catch {
    return false;
  }
}

export function RedirectBlocker() {
  useEffect(() => {
    // ─── Layer 1: Override window.open ───
    const nativeOpen = window.open;

    window.open = function (url?: string | URL, _target?: string, _features?: string): WindowProxy | null {
      const urlStr = url?.toString() || "";

      // Block ALL popups — our app never needs window.open
      if (isExternalUrl(urlStr) || urlStr.includes("about:blank") || urlStr.startsWith("http")) {
        console.warn("[RedirectBlocker] Blocked window.open:", urlStr);
        return null;
      }

      return null;
    };

    // ─── Layer 2: Block dynamically injected elements ───
    // Only blocks iframes that:
    //   1. Are NOT inside our player container [data-player-container]
    //   2. Are NOT inside the Next.js root (#__next)
    //   3. Have a non-safe source (not YouTube, not same-origin)
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (!(node instanceof HTMLElement)) continue;

          // Check injected iframes
          if (node instanceof HTMLIFrameElement) {
            const insidePlayer = !!node.closest("[data-player-container]");
            const insideReact = !!node.closest("#__next");
            const safeSrc = isSafeIframeSrc(node.src);

            // Block if: outside player container AND (outside React tree OR unsafe source)
            if (!insidePlayer && !safeSrc) {
              console.warn("[RedirectBlocker] Blocked injected iframe:", node.src);
              node.remove();
              continue;
            }
            // If it's inside React tree but unsafe source, still allow it (React rendered it intentionally)
          }

          // Scan children for injected iframes (only outside React tree)
          if (node.querySelectorAll) {
            const iframes = node.querySelectorAll("iframe");
            iframes.forEach((iframe) => {
              const insidePlayer = !!iframe.closest("[data-player-container]");
              const insideReact = !!iframe.closest("#__next");
              const safeSrc = isSafeIframeSrc(iframe.src);

              if (!insidePlayer && !insideReact && !safeSrc) {
                console.warn("[RedirectBlocker] Blocked injected iframe (child):", iframe.src);
                iframe.remove();
              }
            });
          }

          // Neutralize injected links with external URLs (only outside React tree)
          if (node instanceof HTMLAnchorElement) {
            const insideReact = !!node.closest("#__next");
            if (!insideReact) {
              const href = node.getAttribute("href") || "";
              if (isExternalUrl(href)) {
                node.removeAttribute("href");
                node.style.pointerEvents = "none";
                node.style.display = "none";
              }
            }
          }

          // Scan children for injected links (only outside React tree)
          if (node.querySelectorAll) {
            const links = node.querySelectorAll("a[href]");
            links.forEach((link) => {
              const insideReact = !!link.closest("#__next");
              if (!insideReact) {
                const href = link.getAttribute("href") || "";
                if (isExternalUrl(href)) {
                  link.removeAttribute("href");
                  (link as HTMLAnchorElement).style.pointerEvents = "none";
                }
              }
            });
          }
        }
      }
    });

    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
    });

    // ─── Layer 3: Block external link clicks (capture phase, before embeds) ───
    // Only block clicks on elements OUTSIDE the React tree
    const clickHandler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const insideReact = !!target.closest("#__next");
      if (insideReact) return; // Our app handles its own clicks

      const anchor = target.closest("a[href]") as HTMLAnchorElement | null;
      if (anchor) {
        const href = anchor.getAttribute("href") || "";
        if (isExternalUrl(href)) {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
          console.warn("[RedirectBlocker] Blocked external link click:", href);
        }
      }
    };

    document.addEventListener("click", clickHandler, true);

    // ─── Layer 4: Block injected meta-refresh redirect tags ───
    const metaRefreshObserver = new MutationObserver(() => {
      const metas = document.querySelectorAll('meta[http-equiv="refresh" i]');
      metas.forEach((meta) => {
        const content = meta.getAttribute("content") || "";
        if (isExternalUrl(content.split("url=")[1] || "")) {
          console.warn("[RedirectBlocker] Blocked meta refresh:", content);
          meta.remove();
        }
      });
    });

    metaRefreshObserver.observe(document.head, {
      childList: true,
      subtree: true,
    });

    // ─── Cleanup ───
    return () => {
      window.open = nativeOpen;
      observer.disconnect();
      metaRefreshObserver.disconnect();
      document.removeEventListener("click", clickHandler, true);
    };
  }, []);

  return null;
}