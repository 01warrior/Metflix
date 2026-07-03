"use client";

import { useEffect } from "react";

export function HideDevTools() {
  useEffect(() => {
    function removeDevTools() {
      // Remove Next.js dev tools button from DOM
      const buttons = document.querySelectorAll("button");
      buttons.forEach((btn) => {
        if (
          btn.getAttribute("aria-label")?.includes("Dev Tools") ||
          btn.textContent?.includes("Dev Tools")
        ) {
          btn.remove();
        }
      });
    }

    // Run immediately
    removeDevTools();

    // Watch for mutations (HMR re-injects the button)
    const observer = new MutationObserver(() => {
      removeDevTools();
    });

    observer.observe(document.body, { childList: true, subtree: true });

    return () => observer.disconnect();
  }, []);

  return null;
}