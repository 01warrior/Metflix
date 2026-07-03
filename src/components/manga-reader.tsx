"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useAppStore } from "@/store/app-store";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Icon } from "@/lib/icons";
import { motion, AnimatePresence } from "framer-motion";
import { getDisplayTitle } from "@/lib/content-helpers";

export function MangaReader() {
  const {
    mangaReaderOpen,
    mangaReaderPages,
    mangaReaderCurrentPage,
    mangaReaderChapterTitle,
    mangaReaderChapters,
    closeMangaReader,
    setMangaReaderPage,
    openMangaReader,
    toast,
  } = useAppStore();
  const [loading, setLoading] = useState(false);
  const [imgError, setImgError] = useState<Record<number, boolean>>({});

  const totalPages = mangaReaderPages.length;
  const currentPage = mangaReaderCurrentPage;

  // Keyboard navigation
  useEffect(() => {
    if (!mangaReaderOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" && currentPage > 0) {
        setMangaReaderPage(currentPage - 1);
      } else if (e.key === "ArrowRight" && currentPage < totalPages - 1) {
        setMangaReaderPage(currentPage + 1);
      } else if (e.key === "Escape") {
        closeMangaReader();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [mangaReaderOpen, currentPage, totalPages, setMangaReaderPage, closeMangaReader]);

  // Lock body scroll when reader is open
  useEffect(() => {
    if (mangaReaderOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mangaReaderOpen]);

  const openChapter = useCallback(
    async (chapterId: string, title: string) => {
      setLoading(true);
      setImgError({});
      try {
        const res = await fetch(`/api/manga/pages?chapterId=${chapterId}`);
        const data = await res.json();
        if (data.baseUrl && data.hash && data.pages?.length > 0) {
          const pageUrls = data.pages.map(
            (filename: string) => `/api/manga/proxy?url=${encodeURIComponent(`${data.baseUrl}/data-saver/${data.hash}/${filename}`)}`
          );
          openMangaReader(pageUrls, title, mangaReaderChapters);
        } else {
          toast({ title: "Erreur", description: "Impossible de charger les pages de ce chapitre" });
        }
      } catch {
        toast({ title: "Erreur", description: "Echec du chargement du chapitre" });
      } finally {
        setLoading(false);
      }
    },
    [openMangaReader, mangaReaderChapters]
  );

  const currentChapterIndex = mangaReaderChapters.findIndex(
    (ch) => `Ch. ${ch.chapter}${ch.title ? ` - ${ch.title}` : ""}` === mangaReaderChapterTitle
  );

  const goToChapter = useCallback(
    (direction: "prev" | "next") => {
      if (currentChapterIndex < 0) return;
      const newIdx = direction === "prev" ? currentChapterIndex - 1 : currentChapterIndex + 1;
      if (newIdx >= 0 && newIdx < mangaReaderChapters.length) {
        const ch = mangaReaderChapters[newIdx];
        const label = `Ch. ${ch.chapter}${ch.title ? ` - ${ch.title}` : ""}`;
        openChapter(ch.id, label);
      }
    },
    [mangaReaderChapters, currentChapterIndex, openChapter]
  );

  if (!mangaReaderOpen) return null;

  const currentImgSrc = mangaReaderPages[currentPage] || "";
  const hasPrevPage = currentPage > 0;
  const hasNextPage = currentPage < totalPages - 1;
  const hasPrevChapter = currentChapterIndex > 0;
  const hasNextChapter = currentChapterIndex < mangaReaderChapters.length - 1;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-black flex flex-col"
      >
        {/* Top bar */}
        <div className="flex items-center justify-between px-4 py-3 bg-black/90 border-b border-white/10 flex-shrink-0">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate">
              {mangaReaderChapterTitle}
            </p>
            <p className="text-xs text-white/60">
              Page {currentPage + 1} / {totalPages}
            </p>
          </div>
          <button
            onClick={closeMangaReader}
            className="ml-3 w-9 h-9 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors flex-shrink-0"
            aria-label="Fermer le lecteur"
          >
            <Icon name="x" className="h-5 w-5 text-white" />
          </button>
        </div>

        {/* Main area */}
        <div className="flex-1 relative flex items-center justify-center overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center">
              <Icon name="loader" className="h-8 w-8 animate-spin text-white" />
            </div>
          ) : (
            <>
              {/* Left arrow */}
              {hasPrevPage && (
                <button
                  onClick={() => setMangaReaderPage(currentPage - 1)}
                  className="absolute left-2 md:left-6 top-1/2 -translate-y-1/2 w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-full bg-black/60 hover:bg-black/80 transition-colors z-10"
                  aria-label="Page precedente"
                >
                  <Icon name="chevron-left" className="h-6 w-6 text-white" />
                </button>
              )}

              {/* Page image */}
              <div className="max-w-[800px] w-full h-full flex items-center justify-center p-4">
                {imgError[currentPage] ? (
                  <div className="flex flex-col items-center justify-center text-center p-8">
                    <Icon name="image" className="h-12 w-12 text-white/30 mb-3" />
                    <p className="text-white/50 text-sm">Image non disponible</p>
                  </div>
                ) : (
                  <img
                    src={currentImgSrc}
                    alt={`Page ${currentPage + 1}`}
                    className="max-w-full max-h-full object-contain"
                    onError={() => setImgError((prev) => ({ ...prev, [currentPage]: true }))}
                  />
                )}
              </div>

              {/* Right arrow */}
              {hasNextPage && (
                <button
                  onClick={() => setMangaReaderPage(currentPage + 1)}
                  className="absolute right-2 md:right-6 top-1/2 -translate-y-1/2 w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-full bg-black/60 hover:bg-black/80 transition-colors z-10"
                  aria-label="Page suivante"
                >
                  <Icon name="chevron-right" className="h-6 w-6 text-white" />
                </button>
              )}
            </>
          )}
        </div>

        {/* Bottom bar */}
        <div className="flex items-center justify-between px-4 py-3 bg-black/90 border-t border-white/10 flex-shrink-0">
          <button
            onClick={() => goToChapter("prev")}
            disabled={!hasPrevChapter || loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <Icon name="chevron-left" className="h-3.5 w-3.5" />
            Chapitre precedent
          </button>

          {/* Page slider / indicator */}
          <div className="flex items-center gap-2 mx-4 flex-1 max-w-xs">
            <input
              type="range"
              min={0}
              max={Math.max(0, totalPages - 1)}
              value={currentPage}
              onChange={(e) => setMangaReaderPage(Number(e.target.value))}
              className="w-full h-1 bg-white/20 rounded-full appearance-none cursor-pointer accent-purple-500"
            />
          </div>

          <button
            onClick={() => goToChapter("next")}
            disabled={!hasNextChapter || loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Chapitre suivant
            <Icon name="chevron-right" className="h-3.5 w-3.5" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}