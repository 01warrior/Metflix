"use client";

import { useRef } from "react";
import { motion } from "framer-motion";
import { useAppStore, type ContentItem, type ContentType } from "@/store/app-store";
import { Icon } from "@/lib/icons";
import { ContentCard } from "./content-card";

// ==================== RANKING NUMBER ====================

function RankingNumber({ rank }: { rank: number }) {
  const label = String(rank).padStart(2, "0");

  return (
    <motion.span
      initial={{ opacity: 0, x: -20, scale: 0.8 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      transition={{ duration: 0.4, delay: rank * 0.05, ease: "easeOut" }}
      className="flex-shrink-0 select-none pointer-events-none self-end pb-4"
      aria-hidden="true"
    >
      <span
        className="block font-black leading-[0.85] tracking-tighter text-5xl sm:text-6xl md:text-7xl"
        style={{
          WebkitTextStroke: "2px rgba(220, 38, 38, 0.4)",
          color: "transparent",
          textShadow:
            "0 0 40px rgba(220, 38, 38, 0.15), 0 2px 4px rgba(0,0,0,0.3)",
          background: "linear-gradient(180deg, #ef4444 0%, #991b1b 100%)",
          WebkitBackgroundClip: "text",
          backgroundClip: "text",
        }}
      >
        {label}
      </span>
    </motion.span>
  );
}

// ==================== CONTENT ROW ====================

export function ContentRow({
  title,
  items,
  seeAllType,
  showRanking = false,
}: {
  title: string;
  items: ContentItem[];
  seeAllType?: ContentType;
  showRanking?: boolean;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const { setView, setSelectedType } = useAppStore();

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
    <section className="mb-8">
      <div className="flex items-center justify-between mb-4 px-4 md:px-0">
        <div className="flex items-center gap-3">
          <h2 className="text-lg md:text-xl font-bold text-foreground">{title}</h2>
          {showRanking && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-red-600/90 text-white">
              Top 10
            </span>
          )}
        </div>
        {seeAllType && (
          <button
            onClick={() => {
              setSelectedType(seeAllType);
              setView("browse");
            }}
            className="text-sm text-red-400 hover:text-red-300 transition-colors"
          >
            Voir tout &rarr;
          </button>
        )}
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
          className="flex gap-3 overflow-x-auto hide-scrollbar px-4 md:px-0 pb-2"
        >
          {items.map((item, index) => {
            const rank = index + 1;
            const showRank = showRanking && rank <= 10;

            return (
              <div
                key={item.id}
                className="flex-shrink-0 flex items-stretch"
              >
                {showRank && <RankingNumber rank={rank} />}
                <div
                  className={`w-[150px] sm:w-[170px] ${showRank ? "-ml-3 sm:-ml-4 md:-ml-5 relative z-10" : ""}`}
                >
                  <ContentCard item={item} />
                </div>
              </div>
            );
          })}
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