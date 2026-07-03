import type { ContentItem, ContentDetail } from "@/store/app-store";
import { Icon } from "@/lib/icons";

// ==================== CONSTANTS ====================

export const TYPE_CONFIG: Record<
  string,
  { label: string; icon: React.ReactNode; badgeClass: string }
> = {
  movie: {
    label: "Film",
    icon: <Icon name="film" className="h-3.5 w-3.5" />,
    badgeClass: "badge-movie",
  },
  series: {
    label: "Série",
    icon: <Icon name="tv" className="h-3.5 w-3.5" />,
    badgeClass: "badge-series",
  },
  anime: {
    label: "Anime",
    icon: <Icon name="sparkles" className="h-3.5 w-3.5" />,
    badgeClass: "badge-anime",
  },
  manga: {
    label: "Manga",
    icon: <Icon name="book-open" className="h-3.5 w-3.5" />,
    badgeClass: "badge-manga",
  },
};

// Colors from embed-providers are sent via API in hostConfig
// Fallback for legacy data still in DB
export const HOST_COLORS: Record<string, string> = {
  vidsrc: "#e50914",
  vidsrc_pm: "#e50914",
  vidsrc_in: "#ff6b35",
  vidsrc_pro: "#f59e0b",
  embed_su: "#4ecdc4",
  autoembed: "#06b6d4",
  twoembed: "#22c55e",
  superembed: "#ec4899",
};

export const GENRES = [
  "Action",
  "Aventure",
  "Animation",
  "Comédie",
  "Crime",
  "Documentaire",
  "Drame",
  "Famille",
  "Fantaisie",
  "Guerre",
  "Histoire",
  "Horreur",
  "Musique",
  "Mystère",
  "Romance",
  "Sci-Fi",
  "Téléfilm",
  "Thriller",
  "Western",
];

export const YEARS = Array.from({ length: 20 }, (_, i) => 2025 - i);

// ==================== HELPERS ====================

export const PLACEHOLDER_POSTER = "https://placehold.co/300x450/1a1a2e/555555?text=No+Image";
export const PLACEHOLDER_BACKDROP = "https://placehold.co/1280x720/1a1a2e/555555?text=Stream";

export function getDisplayTitle(item: ContentItem | ContentDetail): string {
  return item.titleFr || item.title;
}

export function handleImgError(e: React.SyntheticEvent<HTMLImageElement>, isPoster = true) {
  e.currentTarget.src = isPoster ? PLACEHOLDER_POSTER : PLACEHOLDER_BACKDROP;
  e.currentTarget.onerror = null;
}

export function getTypeBadge(type: string) {
  if (type === "manga") {
    return (
      <span className="absolute top-2 left-2 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-purple-600/90 text-white">
        Livre
      </span>
    );
  }
  const cfg = TYPE_CONFIG[type];
  if (!cfg) return null;
  return (
    <span
      className={`absolute top-2 left-2 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${cfg.badgeClass}`}
    >
      {cfg.label}
    </span>
  );
}