"use client";

import { useState, useEffect } from "react";
import { useAppStore, type ContentItem } from "@/store/app-store";
import { Icon } from "@/lib/icons";
import { motion } from "framer-motion";
import { ContentCard } from "./content-card";
import { SkeletonGrid } from "./skeleton-cards";

// ==================== FAVORITES VIEW ====================

export function FavoritesView() {
  const { favorites, browseContent, setBrowseContent, setBrowseLoading, setBrowseTotal } =
    useAppStore();
  const [favItems, setFavItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch favorited items
  useEffect(() => {
    if (favorites.length === 0) {
      setFavItems([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    const fetchFavorites = async () => {
      try {
        const ids = favorites.join(",");
        const res = await fetch(`/api/content?limit=100`);
        const data = await res.json();
        if (!cancelled) {
          const items = (data.data || []).filter((item: ContentItem) =>
            favorites.includes(item.id)
          );
          setFavItems(items);
        }
      } catch {
        if (!cancelled) setFavItems([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchFavorites();
    return () => {
      cancelled = true;
    };
  }, [favorites]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="page-content max-w-7xl mx-auto px-4 md:px-8 py-6"
    >
      <div className="flex items-center gap-3 mb-6">
        <Icon name="heart" className="h-6 w-6 text-red-500" fill="currentColor" />
        <h1 className="text-2xl font-extrabold text-foreground">Mes Favoris</h1>
        <span className="text-sm text-muted-foreground">
          ({favorites.length})
        </span>
      </div>

      {loading ? (
        <SkeletonGrid />
      ) : favorites.length === 0 ? (
        <div className="text-center py-20">
          <Icon name="heart" className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-muted-foreground mb-2">Aucun favori pour le moment</p>
          <p className="text-sm text-muted-foreground/60">
            Cliquez sur le cœur d&apos;un contenu pour l&apos;ajouter
          </p>
        </div>
      ) : favItems.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          Chargement des favoris...
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {favItems.map((item) => (
            <ContentCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </motion.div>
  );
}