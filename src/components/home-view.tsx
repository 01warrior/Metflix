"use client";

import { useAppStore } from "@/store/app-store";
import { Icon } from "@/lib/icons";
import { motion } from "framer-motion";
import { HeroSection } from "./hero-section";
import { ContentRow } from "./content-row";
import { ContentCard } from "./content-card";
import { SkeletonGrid } from "./skeleton-cards";

// ==================== HOME VIEW ====================

export function HomeView() {
  const {
    featured,
    trendingMovies,
    trendingSeries,
    trendingAnime,
    trendingManga,
    latestContent,
  } = useAppStore();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="page-content"
    >
      {/* Hero */}
      <HeroSection />

      {/* Derniers Ajouts */}
      {latestContent.length > 0 && (
        <section className="mb-8 px-4 md:px-0">
          <div className="flex items-center gap-2 mb-4">
            <Icon name="rotate-ccw" className="h-4 w-4 text-red-400" />
            <h2 className="text-lg md:text-xl font-bold text-foreground">
              Derniers Ajouts
            </h2>
            <span className="new-badge-shimmer px-2 py-0.5 rounded-full text-[10px] font-bold text-white uppercase tracking-wider">
              NEW
            </span>
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