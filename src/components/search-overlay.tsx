"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useAppStore, type ContentItem } from "@/store/app-store";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Icon } from "@/lib/icons";
import { AnimatePresence, motion } from "framer-motion";
import { getDisplayTitle } from "@/lib/content-helpers";
import { ContentCard } from "./content-card";

export function SearchOverlay() {
  const { showSearch, setShowSearch, setSearchResults, searchResults, openPreview } =
    useAppStore();
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (showSearch) {
      setQuery("");
      setSearchResults([]);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [showSearch, setSearchResults]);

  const doSearch = useCallback(
    async (q: string) => {
      if (q.length < 2) {
        setSearchResults([]);
        return;
      }
      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
        const data = await res.json();
        setSearchResults(data.data || []);
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
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(value), 300);
  };

  const handleSelect = (item: ContentItem) => {
    setShowSearch(false);
    openPreview(item);
  };

  if (!showSearch) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] bg-background/95 backdrop-blur-xl flex flex-col"
    >
      <div className="flex items-center gap-3 px-4 h-16 border-b border-border/50">
        <button
          onClick={() => setShowSearch(false)}
          className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-muted"
          aria-label="Fermer"
        >
          <Icon name="x" className="h-5 w-5" />
        </button>
        <Input
          ref={inputRef}
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          placeholder="Rechercher un film, série, anime..."
          className="flex-1 bg-transparent border-0 text-lg focus-visible:ring-0 placeholder:text-muted-foreground/50"
        />
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Icon name="loader" className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}
        {!loading && query.length >= 2 && searchResults.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            Aucun résultat pour &quot;{query}&quot;
          </div>
        )}
        {!loading && query.length < 2 && (
          <div className="text-center py-12 text-muted-foreground text-sm">
            Tapez au moins 2 caractères pour rechercher
          </div>
        )}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {searchResults.map((item) => (
            <div
              key={item.id}
              onClick={() => handleSelect(item)}
              className="cursor-pointer"
            >
              <ContentCard item={item} />
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}