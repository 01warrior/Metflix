"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useAppStore, type ContentItem } from "@/store/app-store";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Icon } from "@/lib/icons";
import { AnimatePresence, motion } from "framer-motion";
import { getDisplayTitle, handleImgError } from "@/lib/content-helpers";
import { ContentCard } from "./content-card";

// ==================== RECENT SEARCHES (localStorage) ====================

const RECENT_KEY = "metflix-recent-searches";
const MAX_RECENT = 8;

function loadRecentSearches(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(RECENT_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveRecentSearches(searches: string[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify(searches));
  } catch {
    // ignore
  }
}

function addRecentSearch(query: string) {
  const current = loadRecentSearches();
  const filtered = current.filter((s) => s.toLowerCase() !== query.toLowerCase());
  const updated = [query, ...filtered].slice(0, MAX_RECENT);
  saveRecentSearches(updated);
  return updated;
}

function removeRecentSearch(query: string) {
  const current = loadRecentSearches();
  const updated = current.filter((s) => s !== query);
  saveRecentSearches(updated);
  return updated;
}

function clearRecentSearches() {
  saveRecentSearches([]);
  return [];
}

// ==================== TYPE BADGE LABEL ====================

const TYPE_LABELS: Record<string, string> = {
  movie: "Film",
  series: "Série",
  anime: "Anime",
  manga: "Manga",
};

// ==================== SUGGESTION ITEM ====================

function SuggestionItem({ item, onSelect }: { item: ContentItem; onSelect: (item: ContentItem) => void }) {
  const [imgLoaded, setImgLoaded] = useState(false);

  return (
    <motion.button
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -8 }}
      transition={{ duration: 0.15 }}
      onClick={() => onSelect(item)}
      className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg hover:bg-muted/60 transition-colors text-left group"
    >
      {/* Thumbnail */}
      <div className="relative w-10 h-14 rounded overflow-hidden flex-shrink-0 bg-muted">
        {!imgLoaded && <Skeleton className="absolute inset-0" />}
        <img
          src={item.posterUrl}
          alt={getDisplayTitle(item)}
          className={`w-full h-full object-cover transition-opacity duration-200 ${imgLoaded ? "opacity-100" : "opacity-0"}`}
          onLoad={() => setImgLoaded(true)}
          onError={(e) => { handleImgError(e); setImgLoaded(true); }}
          loading="lazy"
        />
      </div>
      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
          {getDisplayTitle(item)}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          {item.year && (
            <span className="text-xs text-muted-foreground">{item.year}</span>
          )}
          <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider bg-primary/10 text-primary">
            {TYPE_LABELS[item.type] || item.type}
          </span>
          {item.rating != null && item.rating > 0 && (
            <span className="flex items-center gap-0.5 text-xs text-amber-500">
              <Icon name="star" className="h-3 w-3 fill-amber-500 text-amber-500" />
              {item.rating.toFixed(1)}
            </span>
          )}
        </div>
      </div>
    </motion.button>
  );
}

// ==================== SEARCH OVERLAY ====================

export function SearchOverlay() {
  const { showSearch, setShowSearch, setSearchResults, searchResults, openPreview } =
    useAppStore();
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<ContentItem[]>([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const suggestionsDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load recent searches when overlay opens
  useEffect(() => {
    if (showSearch) {
      setQuery("");
      setSearchResults([]);
      setSuggestions([]);
      setRecentSearches(loadRecentSearches());
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [showSearch, setSearchResults]);

  // Fetch suggestions (debounced 300ms)
  const doSuggestions = useCallback(
    async (q: string) => {
      if (q.length < 2) {
        setSuggestions([]);
        return;
      }
      setSuggestionsLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}&limit=5`);
        const data = await res.json();
        setSuggestions(data.data || []);
      } catch {
        setSuggestions([]);
      } finally {
        setSuggestionsLoading(false);
      }
    },
    []
  );

  // Full search (on Enter / submit)
  const doSearch = useCallback(
    async (q: string) => {
      if (q.length < 2) {
        setSearchResults([]);
        return;
      }
      setLoading(true);
      setSuggestions([]);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
        const data = await res.json();
        setSearchResults(data.data || []);
        // Save to recent
        const updated = addRecentSearch(q);
        setRecentSearches(updated);
      } catch {
        setSearchResults([]);
      } finally {
        setLoading(false);
      }
    },
    [setSearchResults]
  );

  const handleChange = (value: string) => {
    setQuery(value);
    setSearchResults([]);
    // Debounced suggestions
    if (suggestionsDebounceRef.current) clearTimeout(suggestionsDebounceRef.current);
    suggestionsDebounceRef.current = setTimeout(() => doSuggestions(value), 300);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (query.trim().length >= 2) {
        if (suggestionsDebounceRef.current) clearTimeout(suggestionsDebounceRef.current);
        doSearch(query.trim());
      }
    }
  };

  const handleSelect = (item: ContentItem) => {
    // Save query to recent if we have a query
    if (query.trim().length >= 2) {
      const updated = addRecentSearch(query.trim());
      setRecentSearches(updated);
    }
    setShowSearch(false);
    openPreview(item);
  };

  const handleRecentClick = (term: string) => {
    setQuery(term);
    doSearch(term);
  };

  const handleRemoveRecent = (term: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = removeRecentSearch(term);
    setRecentSearches(updated);
  };

  const handleClearAllRecent = () => {
    const updated = clearRecentSearches();
    setRecentSearches(updated);
  };

  // Determine which section to show
  const hasQuery = query.trim().length >= 2;
  const showRecent = !hasQuery && !loading && recentSearches.length > 0;
  const showSuggestions = hasQuery && suggestionsLoading;
  const showSuggestionsResults = hasQuery && !suggestionsLoading && suggestions.length > 0 && searchResults.length === 0 && !loading;
  const showNoResults = hasQuery && !loading && !suggestionsLoading && suggestions.length === 0 && searchResults.length === 0;
  const showFullResults = searchResults.length > 0;

  if (!showSearch) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-[60] bg-background/95 backdrop-blur-xl flex flex-col"
    >
      {/* Search Header */}
      <div className="flex items-center gap-3 px-4 h-16 border-b border-border/50">
        <button
          onClick={() => setShowSearch(false)}
          className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-muted transition-colors"
          aria-label="Fermer"
        >
          <Icon name="x" className="h-5 w-5" />
        </button>
        <div className="relative flex-1">
          <Icon
            name="search"
            className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60 pointer-events-none"
          />
          <Input
            ref={inputRef}
            value={query}
            onChange={(e) => handleChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Rechercher un film, série, anime..."
            className="pl-10 h-11 bg-muted/40 border-0 text-base rounded-xl focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:bg-muted/70 placeholder:text-muted-foreground/50 transition-all"
          />
        </div>
      </div>

      {/* Search Body */}
      <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          {/* === RECENT SEARCHES === */}
          {showRecent && (
            <motion.div
              key="recent"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="p-4 max-w-2xl mx-auto"
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Icon name="clock" className="h-4 w-4 text-muted-foreground" />
                  Recherches récentes
                </h3>
                <button
                  onClick={handleClearAllRecent}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                >
                  <Icon name="delete" className="h-3.5 w-3.5" />
                  Tout effacer
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {recentSearches.map((term) => (
                  <motion.button
                    key={term}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.12 }}
                    onClick={() => handleRecentClick(term)}
                    className="group flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted/70 hover:bg-muted text-sm text-foreground/90 hover:text-foreground transition-colors border border-border/40"
                  >
                    <Icon name="clock" className="h-3.5 w-3.5 text-muted-foreground/60 flex-shrink-0" />
                    <span className="max-w-[180px] truncate">{term}</span>
                    <span
                      onClick={(e) => handleRemoveRecent(term, e)}
                      className="ml-0.5 w-4 h-4 flex items-center justify-center rounded-full opacity-0 group-hover:opacity-100 hover:bg-foreground/10 transition-all flex-shrink-0"
                      role="button"
                      aria-label={`Supprimer "${term}"`}
                    >
                      <Icon name="x" className="h-3 w-3" />
                    </span>
                  </motion.button>
                ))}
              </div>

              {/* Keyboard hint */}
              <p className="mt-6 text-xs text-muted-foreground/60 text-center flex items-center justify-center gap-1.5">
                <kbd className="px-1.5 py-0.5 rounded bg-muted border border-border/50 text-[10px] font-mono">
                  Entrée
                </kbd>
                pour rechercher
              </p>
            </motion.div>
          )}

          {/* === LOADING SUGGESTIONS === */}
          {showSuggestions && (
            <motion.div
              key="suggestions-loading"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
              className="p-4 max-w-2xl mx-auto"
            >
              <div className="space-y-1">
                <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                  <Icon name="search" className="h-4 w-4 text-muted-foreground" />
                  Suggestions
                </h3>
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 px-3 py-2.5">
                    <Skeleton className="w-10 h-14 rounded" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* === SUGGESTION RESULTS === */}
          {showSuggestionsResults && (
            <motion.div
              key="suggestions-results"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="p-4 max-w-2xl mx-auto"
            >
              <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                <Icon name="search" className="h-4 w-4 text-muted-foreground" />
                Résultats pour &ldquo;{query}&rdquo;
              </h3>
              <div className="space-y-0.5 rounded-xl border border-border/40 overflow-hidden">
                <AnimatePresence initial={false}>
                  {suggestions.map((item) => (
                    <SuggestionItem
                      key={item.id}
                      item={item}
                      onSelect={handleSelect}
                    />
                  ))}
                </AnimatePresence>
              </div>
              {/* Keyboard hint */}
              <p className="mt-4 text-xs text-muted-foreground/60 text-center flex items-center justify-center gap-1.5">
                <kbd className="px-1.5 py-0.5 rounded bg-muted border border-border/50 text-[10px] font-mono">
                  Entrée
                </kbd>
                pour voir tous les résultats
              </p>
            </motion.div>
          )}

          {/* === NO RESULTS === */}
          {showNoResults && (
            <motion.div
              key="no-results"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col items-center justify-center py-20 px-4"
            >
              <div className="w-16 h-16 rounded-full bg-muted/80 flex items-center justify-center mb-4">
                <Icon name="search" className="h-7 w-7 text-muted-foreground/50" />
              </div>
              <p className="text-muted-foreground text-base font-medium">
                Aucun résultat
              </p>
              <p className="text-muted-foreground/60 text-sm mt-1">
                pour &ldquo;{query}&rdquo;
              </p>
              <p className="text-muted-foreground/40 text-xs mt-4">
                Essayez avec d&apos;autres mots-clés
              </p>
            </motion.div>
          )}

          {/* === FULL SEARCH RESULTS === */}
          {loading && !showSuggestions && (
            <motion.div
              key="full-loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-4"
            >
              <div className="flex items-center justify-center py-12">
                <Icon name="loader" className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            </motion.div>
          )}

          {showFullResults && (
            <motion.div
              key="full-results"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="p-4"
            >
              {/* Separator */}
              <div className="max-w-2xl mx-auto mb-4">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Icon name="search" className="h-4 w-4 text-muted-foreground" />
                  Résultats pour &ldquo;{query}&rdquo;
                  <span className="text-xs font-normal text-muted-foreground">
                    ({searchResults.length})
                  </span>
                </h3>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {searchResults.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleSelect(item)}
                    className="cursor-pointer"
                  >
                    <SuggestionItemCard item={item} />
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Empty state when no query and no recent */}
        {!hasQuery && !loading && recentSearches.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-20 px-4"
          >
            <div className="w-16 h-16 rounded-full bg-muted/80 flex items-center justify-center mb-4">
              <Icon name="search" className="h-7 w-7 text-muted-foreground/50" />
            </div>
            <p className="text-muted-foreground/70 text-sm text-center">
              Recherchez vos films, séries, anime et manga préférés
            </p>
            <p className="mt-4 text-xs text-muted-foreground/50 flex items-center justify-center gap-1.5">
              <kbd className="px-1.5 py-0.5 rounded bg-muted border border-border/50 text-[10px] font-mono">
                Entrée
              </kbd>
              pour rechercher
            </p>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

// ==================== MINI CONTENT CARD FOR FULL RESULTS ====================

function SuggestionItemCard({ item }: { item: ContentItem }) {
  return <ContentCard item={item} />;
}