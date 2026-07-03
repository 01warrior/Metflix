"use client";

import { useEffect, useState, useRef } from "react";
import { useAppStore } from "@/store/app-store";
import { Icon } from "@/lib/icons";
import { AnimatePresence, motion } from "framer-motion";
import { getDisplayTitle, handleImgError, getTypeBadge, TYPE_CONFIG } from "@/lib/content-helpers";

export function HeroSection() {
  const { featured, setView, setSelectedContentId, toggleFavorite, favorites } = useAppStore();
  const [activeIdx, setActiveIdx] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const items = featured.slice(0, 8);
  const current = items[activeIdx];

  const startTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setActiveIdx((prev) => (prev + 1) % items.length);
    }, 6000);
  };

  useEffect(() => {
    if (items.length > 1) startTimer();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [items.length]);

  if (!current) {
    return (
      <div className="relative w-full h-[60vh] md:h-[85vh] shimmer -mt-16" />
    );
  }

  return (
    <div className="relative w-full h-[60vh] md:h-[85vh] overflow-hidden -mt-16">
      {/* Backdrop image */}
      <AnimatePresence mode="wait">
        <motion.div
          key={current.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6 }}
          className="absolute inset-0"
        >
          <img
            src={current.backdropUrl?.replace("/w1280/", "/original/")}
            alt=""
            className="w-full h-full object-cover"
            loading="eager"
            onError={(e) => handleImgError(e, false)}
          />
        </motion.div>
      </AnimatePresence>
      {/* Gradients */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent" />
      <div className="absolute inset-x-0 top-0 h-1/3 bg-gradient-to-b from-black/60 via-black/30 to-transparent pointer-events-none" />

      {/* Content */}
      <div className="relative z-10 flex flex-col justify-end h-full max-w-7xl mx-auto px-4 md:px-8 pb-12 md:pb-16">
        <AnimatePresence mode="wait">
          <motion.div
            key={current.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.4 }}
          >
            {getTypeBadge(current.type) && (
              <div className="mb-3">
                <span
                  className={`inline-block px-2.5 py-1 rounded text-xs font-bold uppercase tracking-wider ${TYPE_CONFIG[current.type]?.badgeClass || ""}`}
                >
                  {TYPE_CONFIG[current.type]?.label || current.type}
                </span>
              </div>
            )}
            <h1 className="text-3xl md:text-5xl font-extrabold text-white mb-3 leading-tight max-w-2xl">
              {getDisplayTitle(current)}
            </h1>
            <p className="text-sm md:text-base text-white/70 mb-5 max-w-xl line-clamp-3">
              {current.overviewFr || current.overview}
            </p>
            <div className="flex items-center gap-3 mb-5">
              <span className="flex items-center gap-1 text-sm text-white/80">
                <Icon name="star" className="h-4 w-4 fill-amber-500 text-amber-500" />
                {current.rating?.toFixed(1)}
              </span>
              {current.year && (
                <span className="flex items-center gap-1 text-sm text-white/80">
                  <Icon name="calendar" className="h-4 w-4" />
                  {current.year}
                </span>
              )}
              {current.runtime && (
                <span className="flex items-center gap-1 text-sm text-white/80">
                  <Icon name="clock" className="h-4 w-4" />
                  {current.runtime} min
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => toggleFavorite(current.id)}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-white/10 border border-white/20 hover:bg-white/20 text-white font-semibold rounded-lg transition-colors"
              >
                <Icon
                  name={favorites.includes(current.id) ? "check" : "bookmark"}
                  className="h-5 w-5"
                />
                Ma Liste
              </button>
              <button
                onClick={() => {
                  setSelectedContentId(current.id);
                  setView("detail");
                }}
                className="btn-glow inline-flex items-center gap-2 px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors"
              >
                <Icon name="play" className="h-5 w-5" fill="white" />
                Regarder
              </button>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Indicators */}
      {items.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1.5">
          {items.map((item, idx) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveIdx(idx);
                startTimer();
              }}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                idx === activeIdx
                  ? "w-8 bg-red-500"
                  : "w-1.5 bg-white/30 hover:bg-white/50"
              }`}
              aria-label={`Slide ${idx + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}