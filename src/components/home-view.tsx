"use client";

import { useRef, useState } from "react";
import { useAppStore, type WatchHistoryItem } from "@/store/app-store";
import { Icon } from "@/lib/icons";
import { motion, AnimatePresence } from "framer-motion";
import { HeroSection } from "./hero-section";
import { ContentRow } from "./content-row";
import { ContentCard } from "./content-card";
import { SkeletonGrid } from "./skeleton-cards";
import { handleImgError } from "@/lib/content-helpers";
import { Skeleton } from "@/components/ui/skeleton";

// ==================== WATCH HISTORY CARD ====================

function WatchHistoryCard({ item, onClick, onRemove }: { item: WatchHistoryItem; onClick: () => void; onRemove: () => void }) {
  const [imgLoaded, setImgLoaded] = useState(false);

  return (
    <div
      className="content-card group cursor-pointer relative rounded-lg overflow-hidden bg-card"
      onClick={onClick}
    >
      <div className="relative aspect-[2/3]">
        {!imgLoaded && <Skeleton className="absolute inset-0 rounded-lg" />}
        <img
          src={item.posterUrl}
          alt={item.title}
          className={`w-full h-full object-cover transition-opacity duration-300 ${imgLoaded ? "opacity-100" : "opacity-0"}`}
          onLoad={() => setImgLoaded(true)}
          onError={(e) => { handleImgError(e); setImgLoaded(true); }}
          loading="lazy"
        />
        {/* Dark overlay for contrast */}
        <div className="absolute inset-0 bg-black/20 pointer-events-none" />
        {/* Gradient overlay at bottom */}
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/90 to-transparent pointer-events-none" />
        {/* Type badge */}
        <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded text-[10px] font-bold bg-white/20 backdrop-blur-sm text-white">
          {item.type === "movie" ? "Film" : item.type === "series" ? "Série" : item.type === "anime" ? "Anime" : "Manga"}
        </span>
        {/* Remove button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="absolute top-2 right-2 z-20 w-6 h-6 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-red-500/80 hover:scale-110"
          aria-label="Supprimer de Continuer à regarder"
        >
          <Icon name="x" className="h-3 w-3 text-white" />
        </button>
        {/* Reprendre button overlay */}
        <div className="absolute inset-0 flex flex-col items-center justify-end pb-8 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <div className="w-10 h-10 rounded-full flex items-center justify-center shadow-lg bg-white/90 mb-2 group-hover:scale-110 transition-transform">
            <Icon name="play" className="h-4 w-4 text-black ml-0.5" fill="black" />
          </div>
          <span className="text-xs font-semibold text-white drop-shadow-lg">Reprendre</span>
        </div>
        {/* Always visible Reprendre badge at bottom */}
        <div className="absolute bottom-2 left-2 right-2 z-10">
          <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-white/20 backdrop-blur-sm">
            <Icon name="play" className="h-3 w-3 text-white flex-shrink-0" fill="white" />
            <span className="text-[10px] font-semibold text-white truncate">Reprendre</span>
          </div>
        </div>
      </div>
      {/* Info */}
      <div className="p-2.5">
        <h3 className="text-sm font-medium text-foreground truncate">
          {item.title}
        </h3>
        <span className="text-xs text-muted-foreground">
          {new Date(item.timestamp).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
        </span>
      </div>
    </div>
  );
}

// ==================== WATCH HISTORY ROW ====================

function WatchHistoryRow({ items }: { items: WatchHistoryItem[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const { setSelectedContentId, setView, removeFromWatchHistory } = useAppStore();

  const scroll = (dir: "left" | "right") => {
    if (!scrollRef.current) return;
    const amount = 600;
    scrollRef.current.scrollBy({
      left: dir === "left" ? -amount : amount,
      behavior: "smooth",
    });
  };

  if (!items.length) return null;

  return (
    <section className="mb-8 px-4 md:px-0">
      <div className="flex items-center gap-2 mb-4">
        <Icon name="clock" className="h-4 w-4 text-amber-400" />
        <h2 className="text-lg md:text-xl font-bold text-foreground">
          Continuer à regarder
        </h2>
      </div>
      <div className="relative group/row">
        <button
          onClick={() => scroll("left")}
          className="absolute left-0 top-0 bottom-0 z-10 w-10 flex items-center justify-center bg-gradient-to-r from-background to-transparent opacity-0 group-hover/row:opacity-100 transition-opacity"
          aria-label="Précédent"
        >
          <Icon name="chevron-left" className="h-6 w-6 text-foreground" />
        </button>
        <div
          ref={scrollRef}
          className="flex gap-3 overflow-x-auto hide-scrollbar pb-2"
        >
          {items.map((item) => (
            <div
              key={item.contentId}
              className="flex-shrink-0 w-[150px] sm:w-[170px]"
            >
              <WatchHistoryCard
                item={item}
                onClick={() => {
                  setSelectedContentId(item.contentId);
                  setView("detail");
                }}
                onRemove={() => removeFromWatchHistory(item.contentId)}
              />
            </div>
          ))}
        </div>
        <button
          onClick={() => scroll("right")}
          className="absolute right-0 top-0 bottom-0 z-10 w-10 flex items-center justify-center bg-gradient-to-l from-background to-transparent opacity-0 group-hover/row:opacity-100 transition-opacity"
          aria-label="Suivant"
        >
          <Icon name="chevron-right" className="h-6 w-6 text-foreground" />
        </button>
      </div>
    </section>
  );
}

// ==================== HOME VIEW ====================

export function HomeView() {
  const {
    featured,
    trendingMovies,
    trendingSeries,
    trendingAnime,
    trendingManga,
    latestContent,
    watchHistory,
    setSelectedContentId,
    setView,
  } = useAppStore();
  const [surpriseLoading, setSurpriseLoading] = useState(false);

  const handleSurpriseMe = async () => {
    if (surpriseLoading) return;
    setSurpriseLoading(true);
    try {
      const res = await fetch("/api/content/random");
      if (!res.ok) return;
      const json = await res.json();
      if (json.data?.id) {
        setSelectedContentId(json.data.id);
        setView("detail");
      }
    } catch {
      // silently fail
    } finally {
      setSurpriseLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="page-content"
    >
      {/* Hero */}
      <HeroSection />

      {/* Continue Watching */}
      <WatchHistoryRow items={watchHistory} />

      {/* Derniers Ajouts + Surprise Me */}
      {latestContent.length > 0 && (
        <section className="mb-8 px-4 md:px-0">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Icon name="rotate-ccw" className="h-4 w-4 text-red-400" />
              <h2 className="text-lg md:text-xl font-bold text-foreground">
                Derniers Ajouts
              </h2>
              <span className="new-badge-shimmer px-2 py-0.5 rounded-full text-[10px] font-bold text-white uppercase tracking-wider">
                NEW
              </span>
            </div>
            <motion.button
              onClick={handleSurpriseMe}
              disabled={surpriseLoading}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="
                flex items-center gap-1.5
                px-3 py-1.5 md:px-4 md:py-2
                rounded-full text-xs md:text-sm font-semibold text-white
                bg-gradient-to-r from-purple-600 to-fuchsia-600
                hover:from-purple-500 hover:to-fuchsia-500
                disabled:opacity-70 disabled:cursor-not-allowed
                transition-shadow duration-200 hover:shadow-lg hover:shadow-purple-500/25
                select-none
              "
              aria-label="Découverte Aléatoire"
            >
              <motion.span
                animate={surpriseLoading ? { rotate: 360 } : { rotate: 0 }}
                transition={surpriseLoading ? { duration: 0.6, repeat: Infinity, ease: "linear" } : { duration: 0 }}
              >
                <Icon name="sparkles" className="h-3.5 w-3.5 md:h-4 md:w-4" />
              </motion.span>
              <AnimatePresence mode="wait">
                {surpriseLoading ? (
                  <motion.span
                    key="loading"
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    className="whitespace-nowrap"
                  >
                    Chargement...
                  </motion.span>
                ) : (
                  <motion.span
                    key="idle"
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    className="whitespace-nowrap"
                  >
                    Surprise Me
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          </div>
          <div className="flex gap-3 overflow-x-auto hide-scrollbar pb-2">
            {latestContent.map((item) => (
              <div
                key={item.id}
                className="flex-shrink-0 w-[150px] sm:w-[170px]"
              >
                <ContentCard item={item} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Ad banner */}
      <div className="max-w-7xl mx-auto px-4 md:px-0 mb-8">
        <div className="ad-banner flex items-center justify-center py-2.5 px-4">
          <span className="text-[10px] text-muted-foreground/50 uppercase tracking-widest">
            Pub
          </span>
        </div>
      </div>

      {/* Trending rows */}
      <div className="max-w-7xl mx-auto">
        <ContentRow
          title="Films Tendances"
          items={trendingMovies}
          seeAllType="movie"
          showRanking
        />
        <ContentRow
          title="Séries Populaires"
          items={trendingSeries}
          seeAllType="series"
        />
        <ContentRow
          title="Anime Populaires"
          items={trendingAnime}
          seeAllType="anime"
        />
        <ContentRow
          title="Manga"
          items={trendingManga}
          seeAllType="manga"
        />
      </div>
    </motion.div>
  );
}