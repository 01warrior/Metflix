"use client";

import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { useAppStore, type ContentType } from "@/store/app-store";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Icon } from "@/lib/icons";
import { ContentCard } from "./content-card";
import { SkeletonGrid, SkeletonCard } from "./skeleton-cards";
import { GENRES, YEARS } from "@/lib/content-helpers";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion, AnimatePresence } from "framer-motion";

export function BrowseView() {
  const {
    selectedType,
    setSelectedType,
    selectedGenre,
    setSelectedGenre,
    selectedSort,
    setSelectedSort,
    selectedYearFrom,
    setSelectedYearFrom,
    selectedYearTo,
    setSelectedYearTo,
    selectedLang,
    setSelectedLang,
    browseContent,
    browseTotal,
    browseLoading,
    browsePage,
    setBrowseContent,
    setBrowseTotal,
    setBrowsePage,
    setBrowseLoading,
    resetBrowse,
  } = useAppStore();

  const loaderRef = useRef<HTMLDivElement>(null);
  const initialFetchDone = useRef(false);

  // Reset when filters change
  useEffect(() => {
    initialFetchDone.current = false;
  }, [selectedType, selectedGenre, selectedSort, selectedYearFrom, selectedYearTo, selectedLang]);

  const fetchContent = useCallback(async (page: number, append: boolean) => {
    setBrowseLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedType !== "all") params.set("type", selectedType);
      if (selectedGenre) params.set("genre", selectedGenre);
      if (selectedSort) params.set("sort", selectedSort);
      if (selectedYearFrom) params.set("yearFrom", String(selectedYearFrom));
      if (selectedYearTo) params.set("yearTo", String(selectedYearTo));
      params.set("page", String(page));
      params.set("limit", "20");

      const res = await fetch(`/api/content?${params.toString()}`);
      const data = await res.json();

      if (append) {
        setBrowseContent([...browseContent, ...(data.data || [])]);
      } else {
        setBrowseContent(data.data || []);
      }
      setBrowseTotal(data.total || 0);
      setBrowsePage(page);
    } catch {
      setBrowseContent([]);
    } finally {
      setBrowseLoading(false);
      initialFetchDone.current = true;
    }
  }, [selectedType, selectedGenre, selectedSort, selectedYearFrom, selectedYearTo, selectedLang, browseContent, setBrowseContent, setBrowseTotal, setBrowsePage, setBrowseLoading]);

  // Fetch when filters change
  useEffect(() => {
    fetchContent(1, false);
  }, [selectedType, selectedGenre, selectedSort, selectedYearFrom, selectedYearTo, selectedLang]);

  // Infinite scroll
  useEffect(() => {
    const el = loaderRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (
          entries[0].isIntersecting &&
          !browseLoading &&
          browseContent.length < browseTotal
        ) {
          fetchContent(browsePage + 1, true);
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [browseLoading, browseContent.length, browseTotal, browsePage, fetchContent]);

  const typeTabs: { value: ContentType; label: string }[] = [
    { value: "all", label: "Tous" },
    { value: "movie", label: "Films" },
    { value: "series", label: "Séries" },
    { value: "anime", label: "Anime" },
    { value: "manga", label: "Livres" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="page-content max-w-7xl mx-auto px-4 md:px-8 py-6"
    >
      {/* Filter bar */}
      <div className="space-y-4 mb-6">
        {/* Type tabs */}
        <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
          {typeTabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setSelectedType(tab.value)}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                selectedType === tab.value
                  ? "bg-red-600 text-white"
                  : "bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Genre pills */}
        <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
          <button
            onClick={() => setSelectedGenre(null)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              !selectedGenre
                ? "bg-red-600/20 text-red-400 border border-red-600/40"
                : "bg-muted text-muted-foreground hover:text-foreground border border-transparent"
            }`}
          >
            Tous les genres
          </button>
          {GENRES.map((genre) => (
            <button
              key={genre}
              onClick={() => setSelectedGenre(genre === selectedGenre ? null : genre)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                selectedGenre === genre
                  ? "bg-red-600/20 text-red-400 border border-red-600/40"
                  : "bg-muted text-muted-foreground hover:text-foreground border border-transparent"
              }`}
            >
              {genre}
            </button>
          ))}
        </div>

        {/* Language filter */}
        <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
          <button
            onClick={() => setSelectedLang(null)}
            className={!selectedLang
              ? "flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors flex items-center gap-1.5 bg-red-600/20 text-red-400 border border-red-600/40"
              : "flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors flex items-center gap-1.5 bg-muted text-muted-foreground hover:text-foreground border border-transparent"
            }
          >
            <Icon name="languages" className="h-3.5 w-3.5" />
            Toutes langues
          </button>
          <button
            onClick={() => setSelectedLang(selectedLang === "vostfr" ? null : "vostfr")}
            className={selectedLang === "vostfr"
              ? "flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold tracking-wider transition-colors bg-amber-600/20 text-amber-400 border border-amber-600/40"
              : "flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold tracking-wider transition-colors bg-muted text-muted-foreground hover:text-foreground border border-transparent"
            }
          >
            VOSTFR
          </button>
          <button
            onClick={() => setSelectedLang(selectedLang === "vf" ? null : "vf")}
            className={selectedLang === "vf"
              ? "flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold tracking-wider transition-colors bg-emerald-600/20 text-emerald-400 border border-emerald-600/40"
              : "flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold tracking-wider transition-colors bg-muted text-muted-foreground hover:text-foreground border border-transparent"
            }
          >
            VF
          </button>
        </div>

        {/* Sort + Year */}
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex items-center gap-2">
            <Icon name="arrow-down-up" className="h-3.5 w-3.5 text-muted-foreground" />
            <Select value={selectedSort} onValueChange={setSelectedSort}>
              <SelectTrigger className="w-[180px] bg-muted border-0 h-9 text-sm">
                <SelectValue placeholder="Trier par" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="rating">Meilleures notes</SelectItem>
                <SelectItem value="created">Plus récents</SelectItem>
                <SelectItem value="title_asc">Titre A-Z</SelectItem>
                <SelectItem value="title_desc">Titre Z-A</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Icon name="calendar" className="h-3.5 w-3.5 text-muted-foreground" />
            <Select
              value={selectedYearFrom?.toString() || "all"}
              onValueChange={(v) => setSelectedYearFrom(v === "all" ? null : Number(v))}
            >
              <SelectTrigger className="w-[120px] bg-muted border-0 h-9 text-sm">
                <SelectValue placeholder="Jusqu&apos;à" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes</SelectItem>
                {YEARS.map((y) => (
                  <SelectItem key={y} value={y.toString()}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="text-xs text-muted-foreground">à</span>
            <Select
              value={selectedYearTo?.toString() || "all"}
              onValueChange={(v) => setSelectedYearTo(v === "all" ? null : Number(v))}
            >
              <SelectTrigger className="w-[120px] bg-muted border-0 h-9 text-sm">
                <SelectValue placeholder="Jusqu&apos;à" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes</SelectItem>
                {YEARS.map((y) => (
                  <SelectItem key={y} value={y.toString()}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <span className="text-xs text-muted-foreground ml-auto">
            {selectedType === "manga"
              ? `${browseTotal} livre${browseTotal !== 1 ? "s" : ""}`
              : `${browseTotal} résultat${browseTotal !== 1 ? "s" : ""}`}
          </span>
        </div>
      </div>

      {/* Content grid */}
      {!initialFetchDone.current && browseContent.length === 0 ? (
        <SkeletonGrid />
      ) : browseContent.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          Aucun contenu trouvé
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {browseContent.map((item) => (
            <ContentCard key={item.id} item={item} />
          ))}
        </div>
      )}

      {/* Infinite scroll loader */}
      <div ref={loaderRef} className="flex justify-center py-8">
        {browseLoading && <Icon name="loader" className="h-6 w-6 animate-spin text-muted-foreground" />}
      </div>
    </motion.div>
  );
}