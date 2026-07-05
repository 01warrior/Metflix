"use client";

import { useState } from "react";
import { useAppStore, type ContentItem } from "@/store/app-store";
import { useToast } from "@/hooks/use-toast";
import { Icon } from "@/lib/icons";
import { Skeleton } from "@/components/ui/skeleton";
import { getDisplayTitle, handleImgError, getTypeBadge, PLACEHOLDER_POSTER } from "@/lib/content-helpers";

// ==================== CONTENT CARD ====================

export function ContentCard({ item }: { item: ContentItem }) {
  const {
    openPreview,
    toggleFavorite,
    favorites,
  } = useAppStore();
  const { toast } = useToast();
  const [imgLoaded, setImgLoaded] = useState(false);
  const isFav = favorites.includes(item.id);

  const handleClick = () => {
    openPreview(item);
  };

  const handleFavClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleFavorite(item.id);
    toast({
      title: isFav ? "Retiré des favoris" : "Ajouté aux favoris",
      description: isFav ? getDisplayTitle(item) + " retiré" : getDisplayTitle(item) + " ajouté",
    });
  };

  return (
    <div
      className="content-card group cursor-pointer relative rounded-lg overflow-hidden bg-card"
      onClick={handleClick}
    >
      <div className="relative aspect-[2/3]">
        {!imgLoaded && <Skeleton className="absolute inset-0 rounded-lg" />}
        <img
          src={item.posterUrl || PLACEHOLDER_POSTER}
          alt={getDisplayTitle(item)}
          className={`w-full h-full object-cover transition-opacity duration-300 ${imgLoaded ? "opacity-100" : "opacity-0"}`}
          onLoad={() => setImgLoaded(true)}
          onError={(e) => { handleImgError(e); setImgLoaded(true); }}
          loading="lazy"
        />
        {/* Gradient overlay at bottom */}
        <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/80 to-transparent pointer-events-none" />
        {/* Type badge */}
        {getTypeBadge(item.type)}
        {/* "À venir" badge for future releases */}
        {item.releaseDate && new Date(item.releaseDate) > new Date() && (
          <span className="absolute top-8 left-2 z-10 flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/90 text-white backdrop-blur-sm">
            <Icon name="calendar" className="h-2.5 w-2.5" />
            À venir
          </span>
        )}
        {/* Favorite button */}
        <button
          onClick={handleFavClick}
          className="absolute top-2 right-2 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-black/40 backdrop-blur-sm transition-all hover:scale-110"
          aria-label={isFav ? "Retirer des favoris" : "Ajouter aux favoris"}
        >
          <Icon
            name="heart"
            className={`h-4 w-4 transition-all ${isFav ? "fill-red-500 text-red-500" : "text-white/80"}`}
          />
        </button>
        {/* Play/Book icon overlay on hover */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg ${item.type === "manga" ? "bg-purple-600/90" : "bg-red-600/90"}`}>
            <Icon name={item.type === "manga" ? "book-open" : "play"} className={`h-5 w-5 text-white${item.type !== "manga" ? " ml-0.5" : ""}`} {...(item.type !== "manga" ? { fill: "white" } : {})} />
          </div>
        </div>
        {/* Quality badge / Chapter count for manga */}
        {item.type === "manga" && item.seasons ? (
          <span className="absolute bottom-2 left-2 px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-600/90 text-white backdrop-blur-sm">
            {item.seasons} chap.</span>
        ) : (
          <span className="absolute bottom-2 left-2 px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-600/90 text-white backdrop-blur-sm">
            1080p
          </span>
        )}
      </div>
      {/* Info */}
      <div className="p-2.5">
        <h3 className="text-sm font-medium text-foreground truncate">
          {getDisplayTitle(item)}
        </h3>
        <div className="flex items-center gap-2 mt-1">
          <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
            <Icon name="star" className="h-3 w-3 fill-amber-500 text-amber-500" />
            <span>{item.rating?.toFixed(1) || "N/A"}</span>
          </span>
          {item.year && (
            <span className="text-xs text-muted-foreground">{item.year}</span>
          )}
        </div>
      </div>
    </div>
  );
}