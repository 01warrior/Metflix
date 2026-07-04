"use client";

import { useEffect, useState, useRef } from "react";
import { useAppStore } from "@/store/app-store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Icon } from "@/lib/icons";
import { motion, AnimatePresence } from "framer-motion";
import {
  getDisplayTitle,
  handleImgError,
  getTypeBadge,
  TYPE_CONFIG,
  PLACEHOLDER_BACKDROP,
} from "@/lib/content-helpers";

export function PreviewModal() {
  const { showPreview, previewItem, closePreview, setView, setSelectedContentId, toggleFavorite, favorites } =
    useAppStore();
  const [trailerKey, setTrailerKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [muted, setMuted] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const isFav = previewItem ? favorites.includes(previewItem.id) : false;

  // Fetch trailer when preview opens
  useEffect(() => {
    if (!showPreview || !previewItem?.tmdbId || previewItem.type === "manga") return;
    
    let cancelled = false;
    const fetchTrailer = async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/tmdb/videos?tmdbId=${previewItem.tmdbId}&type=${previewItem.type === "anime" ? "series" : previewItem.type}`
        );
        const data = await res.json();
        if (!cancelled) {
          setTrailerKey(data.trailer?.key || null);
        }
      } catch {
        if (!cancelled) setTrailerKey(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchTrailer();
    return () => { cancelled = true; };
  }, [showPreview, previewItem]);

  // Lock body scroll + ESC to close
  useEffect(() => {
    if (!showPreview) return;
    document.body.style.overflow = "hidden";
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closePreview();
    };
    window.addEventListener("keydown", handleKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKey);
    };
  }, [showPreview, closePreview]);

  const handleWatch = () => {
    if (!previewItem) return;
    closePreview();
    setSelectedContentId(previewItem.id);
    setView("detail");
  };

  const handleFav = () => {
    if (!previewItem) return;
    toggleFavorite(previewItem.id);
  };

  if (!showPreview || !previewItem) return null;

  const hasTrailer = !!trailerKey;
  const isManga = previewItem.type === "manga";

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center"
        onClick={closePreview}
      >
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 40 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full sm:max-w-[640px] md:max-w-[750px] bg-zinc-900 rounded-t-2xl sm:rounded-2xl overflow-hidden shadow-2xl max-h-[92vh] flex flex-col z-10"
        >
          {/* Video / Backdrop area */}
          <div className="relative w-full aspect-video bg-black">
            {/* Close button */}
            <button
              onClick={closePreview}
              className="absolute top-3 right-3 z-20 w-9 h-9 flex items-center justify-center rounded-full bg-black/60 backdrop-blur-sm text-white hover:bg-black/80 transition-colors"
              aria-label="Fermer"
            >
              <Icon name="x" className="h-5 w-5" />
            </button>

            {/* Trailer iframe or backdrop image */}
            {hasTrailer ? (
              <div className="absolute inset-0 overflow-hidden">
                <iframe
                  ref={iframeRef}
                  src={`https://www.youtube-nocookie.com/embed/${trailerKey}?autoplay=1&mute=${muted ? 1 : 0}&controls=0&showinfo=0&rel=0&modestbranding=1&loop=1&playlist=${trailerKey}&iv_load_policy=3&disablekb=1&fs=0&playsinline=1`}
                  className="absolute w-[calc(100%+120px)] h-[calc(100%+100px)] -left-[60px] -top-[50px]"
                  style={{ pointerEvents: 'none' }}
                  allow="autoplay; encrypted-media"
                  allowFullScreen
                  title="Bande-annonce"
                />
              </div>
            ) : (
              <>
                <img
                  src={previewItem.backdropUrl || PLACEHOLDER_BACKDROP}
                  alt={getDisplayTitle(previewItem)}
                  className="w-full h-full object-cover"
                  onError={(e) => handleImgError(e, false)}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-transparent to-transparent" />
              </>
            )}

            {/* Bottom gradient for video */}
            {hasTrailer && (
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-transparent to-transparent pointer-events-none" />
            )}

            {/* Mute toggle for trailer */}
            {hasTrailer && (
              <button
                onClick={(e) => { e.stopPropagation(); setMuted(!muted); }}
                className="absolute bottom-3 left-3 z-20 w-9 h-9 flex items-center justify-center rounded-full bg-black/60 backdrop-blur-sm text-white hover:bg-black/80 transition-colors"
                aria-label={muted ? "Activer le son" : "Couper le son"}
              >
                <Icon name={muted ? "volume-x" : "volume-2"} className="h-4 w-4" />
              </button>
            )}

            {/* Loading spinner */}
            {loading && !trailerKey && !isManga && (
              <div className="absolute inset-0 flex items-center justify-center">
                <Icon name="loader" className="h-8 w-8 animate-spin text-white/60" />
              </div>
            )}
          </div>

          {/* Info section */}
          <div className="p-5 flex flex-col gap-4">
            {/* Title */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <h2 className="text-xl sm:text-2xl font-bold text-white leading-tight">
                  {getDisplayTitle(previewItem)}
                </h2>
                <div className="flex items-center gap-3 mt-2 flex-wrap">
                  {previewItem.rating > 0 && (
                    <span className="flex items-center gap-1 text-sm text-green-400 font-medium">
                      <Icon name="star" className="h-3.5 w-3.5 fill-green-400 text-green-400" />
                      {previewItem.rating.toFixed(1)}
                    </span>
                  )}
                  {previewItem.year && (
                    <span className="text-sm text-zinc-400">{previewItem.year}</span>
                  )}
                  {previewItem.runtime && (
                    <span className="text-sm text-zinc-400">{previewItem.runtime} min</span>
                  )}
                  {previewItem.seasons && previewItem.type !== "manga" && (
                    <span className="text-sm text-zinc-400">{previewItem.seasons} saison{previewItem.seasons > 1 ? "s" : ""}</span>
                  )}
                  {previewItem.genres && (
                    <span className="text-sm text-zinc-500 hidden sm:inline">
                      {previewItem.genres.split(",").slice(0, 3).join(" • ")}
                    </span>
                  )}
                </div>
              </div>
              {/* Type badge */}
              <div className="flex-shrink-0">
                {getTypeBadge(previewItem.type) && (
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-zinc-800">
                    <span className="text-zinc-400">
                      {previewItem.type === "manga" ? (
                        <Icon name="book-open" className="h-5 w-5" />
                      ) : previewItem.type === "anime" ? (
                        <Icon name="sparkles" className="h-5 w-5" />
                      ) : previewItem.type === "series" ? (
                        <Icon name="tv" className="h-5 w-5" />
                      ) : (
                        <Icon name="film" className="h-5 w-5" />
                      )}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Overview */}
            {previewItem.overviewFr && (
              <p className="text-sm text-zinc-300 leading-relaxed line-clamp-3">
                {previewItem.overviewFr}
              </p>
            )}
            {!previewItem.overviewFr && previewItem.overview && (
              <p className="text-sm text-zinc-300 leading-relaxed line-clamp-3">
                {previewItem.overview}
              </p>
            )}

            {/* Action buttons */}
            <div className="flex items-center gap-3 mt-1">
              <Button
                onClick={handleWatch}
                className={`flex-1 h-11 text-sm font-semibold rounded-lg ${
                  isManga
                    ? "bg-purple-600 hover:bg-purple-700 text-white"
                    : "bg-white hover:bg-zinc-200 text-black"
                }`}
              >
                <Icon name={isManga ? "book-open" : "play"} className={`h-4 w-4 mr-2${!isManga ? " ml-0.5" : ""}`} />
                {isManga ? "Lire" : "Regarder"}
              </Button>
              <Button
                variant="outline"
                size="icon"
                className={`h-11 w-11 rounded-lg border-zinc-700 ${isFav ? "bg-red-600/20 border-red-600/50 text-red-400" : "text-zinc-400 hover:text-white hover:border-zinc-500"}`}
                onClick={handleFav}
                aria-label={isFav ? "Retirer des favoris" : "Ajouter aux favoris"}
              >
                <Icon name="heart" className={`h-4 w-4 ${isFav ? "fill-red-400" : ""}`} />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-11 w-11 rounded-lg border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-500"
                onClick={handleWatch}
                aria-label="Plus d'infos"
              >
                <Icon name="info" className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}