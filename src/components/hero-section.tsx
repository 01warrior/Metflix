"use client";

import { useEffect, useState, useRef } from "react";
import { useAppStore } from "@/store/app-store";
import { Icon } from "@/lib/icons";
import { AnimatePresence, motion } from "framer-motion";
import { getDisplayTitle, handleImgError, getTypeBadge, TYPE_CONFIG } from "@/lib/content-helpers";

const SLIDE_DURATION = 6000;
const PROGRESS_INTERVAL = 50;

export function HeroSection() {
  const { featured, setView, setSelectedContentId, toggleFavorite, favorites } = useAppStore();
  const [activeIdx, setActiveIdx] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const items = featured.slice(0, 8);
  const current = items[activeIdx];

  const clearTimers = () => {
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const startTimer = () => {
    clearTimers();
    timerRef.current = setInterval(() => {
      setActiveIdx((prev) => (prev + 1) % items.length);
    }, SLIDE_DURATION);
  };

  const goTo = (idx: number) => {
    setActiveIdx(idx);
    startTimer();
  };

  const goPrev = () => {
    setActiveIdx((prev) => (prev - 1 + items.length) % items.length);
    startTimer();
  };

  const goNext = () => {
    setActiveIdx((prev) => (prev + 1) % items.length);
    startTimer();
  };

  useEffect(() => {
    if (items.length > 1) {
      startTimer();
    }
    return clearTimers;
  }, [items.length]);

  if (!current) {
    return (
      <div className="relative w-full h-[60vh] md:h-[85vh] shimmer -mt-16" />
    );
  }

  return (
    <div
      className="relative w-full h-[60vh] md:h-[85vh] overflow-hidden -mt-16 group/hero"
    >
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

      {/* Left arrow - Glass */}
      {items.length > 1 && (
        <button
          onClick={goPrev}
          className="hidden md:flex absolute left-4 md:left-8 top-1/2 -translate-y-1/2 z-20 w-14 h-14 md:w-16 md:h-16 items-center justify-center rounded-full bg-white/[0.08] backdrop-blur-xl border border-white/[0.15] text-white/50 hover:text-white hover:bg-white/[0.18] hover:border-white/[0.3] transition-all duration-300 opacity-40 group-hover/hero:opacity-100 hover:scale-110 active:scale-95 shadow-[0_8px_32px_rgba(0,0,0,0.4)]"
          aria-label="Précédent"
        >
          <Icon name="chevron-left" className="h-7 w-7 md:h-8 md:w-8" />
        </button>
      )}

      {/* Right arrow - Glass */}
      {items.length > 1 && (
        <button
          onClick={goNext}
          className="hidden md:flex absolute right-4 md:right-8 top-1/2 -translate-y-1/2 z-20 w-14 h-14 md:w-16 md:h-16 items-center justify-center rounded-full bg-white/[0.08] backdrop-blur-xl border border-white/[0.15] text-white/50 hover:text-white hover:bg-white/[0.18] hover:border-white/[0.3] transition-all duration-300 opacity-40 group-hover/hero:opacity-100 hover:scale-110 active:scale-95 shadow-[0_8px_32px_rgba(0,0,0,0.4)]"
          aria-label="Suivant"
        >
          <Icon name="chevron-right" className="h-7 w-7 md:h-8 md:w-8" />
        </button>
      )}

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

      {/* Bottom controls: glass indicator bar */}
      {items.length > 1 && (
        <div className="hidden md:block absolute md:top-auto md:bottom-6 left-1/2 -translate-x-1/2 z-10">
          <div className="flex items-center gap-2.5 px-4 py-3 rounded-full bg-white/[0.06] backdrop-blur-xl border border-white/[0.1] shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
            {/* Dots */}
            <div className="flex items-center gap-2">
              {items.map((item, idx) => (
                <button
                  key={item.id}
                  onClick={() => goTo(idx)}
                  className={`rounded-full transition-all duration-300 ${
                    idx === activeIdx
                      ? "w-7 h-2.5 bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]"
                      : "w-2.5 h-2.5 bg-white/25 hover:bg-white/50 hover:scale-125"
                  }`}
                  aria-label={`Slide ${idx + 1}`}
                />
              ))}
            </div>
            {/* Divider */}
            <div className="w-px h-3 bg-white/10" />
            {/* Slide counter */}
            <span className="text-sm font-medium text-white/40 tabular-nums min-w-[2.5rem] text-center">
              {activeIdx + 1}/{items.length}
            </span>
          </div>
          {/* Progress bar */}
          <div className="mt-2 w-full h-[2px] bg-white/[0.06] rounded-full overflow-hidden">
            <div
              key={activeIdx}
              className="h-full bg-gradient-to-r from-red-500 to-red-400 rounded-full"
                style={{
                  width: '100%',
                  animation: `heroProgress ${SLIDE_DURATION}ms linear`,
                  transformOrigin: 'left',
                }}
            />
          </div>
        </div>
      )}
    </div>
  );
}