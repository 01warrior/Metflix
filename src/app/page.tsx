"use client";

import { useEffect, useCallback, useRef, useState, useMemo } from "react";
import {
  useAppStore,
  type ContentItem,
  type ContentType,
  type ContentDetail,
  type EmbedSource,
  type EmbedGroup,
  type HostConfig,
} from "@/store/app-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Icon } from "@/lib/icons";
import { motion, AnimatePresence } from "framer-motion";

// ==================== CONSTANTS ====================

const TYPE_CONFIG: Record<
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
const HOST_COLORS: Record<string, string> = {
  vidsrc: "#e50914",
  vidsrc_pm: "#e50914",
  vidsrc_in: "#ff6b35",
  vidsrc_pro: "#f59e0b",
  embed_su: "#4ecdc4",
  autoembed: "#06b6d4",
  twoembed: "#22c55e",
  superembed: "#ec4899",
};

const GENRES = [
  "Action",
  "Comédie",
  "Drame",
  "Sci-Fi",
  "Horreur",
  "Thriller",
  "Romance",
  "Aventure",
  "Animation",
  "Crime",
  "Fantaisie",
  "Mystère",
  "Famille",
  "Documentaire",
];

const YEARS = Array.from({ length: 20 }, (_, i) => 2025 - i);

// ==================== HELPERS ====================

const PLACEHOLDER_POSTER = "https://placehold.co/300x450/1a1a2e/555555?text=No+Image";
const PLACEHOLDER_BACKDROP = "https://placehold.co/1280x720/1a1a2e/555555?text=Stream";

function getDisplayTitle(item: ContentItem | ContentDetail): string {
  return item.titleFr || item.title;
}

function handleImgError(e: React.SyntheticEvent<HTMLImageElement>, isPoster = true) {
  e.currentTarget.src = isPoster ? PLACEHOLDER_POSTER : PLACEHOLDER_BACKDROP;
  e.currentTarget.onerror = null;
}

function getTypeBadge(type: string) {
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

// ==================== SKELETON CARD ====================

function SkeletonCard() {
  return (
    <div className="flex-shrink-0 w-[150px] sm:w-[170px]">
      <Skeleton className="w-full aspect-[2/3] rounded-lg" />
      <Skeleton className="h-4 w-3/4 mt-2" />
      <Skeleton className="h-3 w-1/2 mt-1.5" />
    </div>
  );
}

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
      {Array.from({ length: 12 }).map((_, i) => (
        <div key={i}>
          <Skeleton className="w-full aspect-[2/3] rounded-lg" />
          <Skeleton className="h-4 w-3/4 mt-2" />
          <Skeleton className="h-3 w-1/2 mt-1.5" />
        </div>
      ))}
    </div>
  );
}

// ==================== CONTENT CARD ====================

function ContentCard({ item }: { item: ContentItem }) {
  const {
    setView,
    setSelectedContentId,
    toggleFavorite,
    favorites,
    contentDetail,
    setCurrentEmbed,
  } = useAppStore();
  const { toast } = useToast();
  const [imgLoaded, setImgLoaded] = useState(false);
  const isFav = favorites.includes(item.id);

  const handleClick = () => {
    setView("detail");
    setSelectedContentId(item.id);
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
          src={item.posterUrl}
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

// ==================== CONTENT ROW ====================

function ContentRow({
  title,
  items,
  seeAllType,
}: {
  title: string;
  items: ContentItem[];
  seeAllType?: ContentType;
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
        <h2 className="text-lg md:text-xl font-bold text-foreground">{title}</h2>
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
          {items.map((item) => (
            <div key={item.id} className="flex-shrink-0 w-[150px] sm:w-[170px]">
              <ContentCard item={item} />
            </div>
          ))}
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

// ==================== HEADER ====================

function Header() {
  const { setView, setShowSearch, favorites, currentView, setSelectedType, selectedType } =
    useAppStore();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [headerHovered, setHeaderHovered] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navItems = [
    { label: "Accueil", view: "home" as const, icon: <Icon name="home" className="h-4 w-4" /> },
    { label: "Films", type: "movie" as ContentType, icon: <Icon name="film" className="h-4 w-4" /> },
    { label: "Séries", type: "series" as ContentType, icon: <Icon name="tv" className="h-4 w-4" /> },
    { label: "Anime", type: "anime" as ContentType, icon: <Icon name="sparkles" className="h-4 w-4" /> },
    { label: "Manga", type: "manga" as ContentType, icon: <Icon name="book-open" className="h-4 w-4" /> },
  ];

  const handleNav = (item: (typeof navItems)[number]) => {
    if (item.view) {
      setView(item.view);
    } else if (item.type) {
      setSelectedType(item.type);
      setView("browse");
    }
    setMobileOpen(false);
  };

  return (
    <header
      className={`sticky top-0 z-50 w-full border-b border-white/0 transition-all duration-300 ${
        headerHovered
          ? "bg-black/95 backdrop-blur-sm border-white/10"
          : scrolled
            ? "bg-gradient-to-b from-black/80 via-black/40 to-transparent"
            : "bg-transparent"
      }`}
      onMouseEnter={() => setHeaderHovered(true)}
      onMouseLeave={() => setHeaderHovered(false)}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between h-14 px-4">
        {/* Logo */}
        <button
          onClick={() => setView("home")}
          className="text-xl font-extrabold tracking-tight"
        >
          <span className="text-red-500">Stream</span>
          <span className="text-white">Vibe</span>
        </button>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          {navItems.map((item) => (
            <button
              key={item.label}
              onClick={() => handleNav(item)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                (item.view && currentView === item.view) ||
                (item.type && currentView === "browse" && selectedType === item.type)
                  ? "text-red-400 bg-red-400/10"
                  : "text-white/70 hover:text-white hover:bg-white/10"
              }`}
            >
              {item.label}
            </button>
          ))}
          <button
            onClick={() => {
              setView("favorites");
              setMobileOpen(false);
            }}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5 ${
              currentView === "favorites"
                ? "text-red-400 bg-red-400/10"
                : "text-white/70 hover:text-white hover:bg-white/10"
            }`}
          >
            <Icon name="heart" className="h-3.5 w-3.5" />
            Favoris
            {favorites.length > 0 && (
              <span className="ml-0.5 text-[10px] bg-red-500 text-white rounded-full px-1.5 py-0.5 leading-none font-bold">
                {favorites.length}
              </span>
            )}
          </button>
        </nav>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setAdminOpen(true)}
            className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors"
            aria-label="Administration"
          >
            <Icon name="settings" className="h-4.5 w-4.5 text-white/70" />
          </button>
          <button
            onClick={() => setShowSearch(true)}
            className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors"
            aria-label="Rechercher"
          >
            <Icon name="search" className="h-4.5 w-4.5 text-white/70" />
          </button>
          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen(true)}
            className="md:hidden w-9 h-9 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors"
            aria-label="Menu"
          >
            <Icon name="menu" className="h-5 w-5 text-white/70" />
          </button>
        </div>
      </div>

      {/* Mobile menu sheet */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-72 bg-background border-border p-0">
          <SheetHeader className="px-4 pt-6 pb-4">
            <SheetTitle className="flex items-center gap-2">
              <span className="text-xl font-extrabold">
                <span className="text-red-500">Stream</span>
                <span>Vibe</span>
              </span>
            </SheetTitle>
            <SheetDescription>Streaming en streaming gratuit</SheetDescription>
          </SheetHeader>
          <Separator />
          <nav className="flex flex-col p-2 gap-0.5">
            {navItems.map((item) => (
              <button
                key={item.label}
                onClick={() => handleNav(item)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  (item.view && currentView === item.view) ||
                  (item.type && currentView === "browse" && selectedType === item.type)
                    ? "text-red-400 bg-red-400/10"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                {item.icon}
                {item.label}
              </button>
            ))}
            <Separator className="my-2" />
            <button
              onClick={() => {
                setView("favorites");
                setMobileOpen(false);
              }}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                currentView === "favorites"
                  ? "text-red-400 bg-red-400/10"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              <Icon name="heart" className="h-4 w-4" />
              Mes Favoris
              {favorites.length > 0 && (
                <span className="ml-auto text-xs bg-red-500 text-white rounded-full px-2 py-0.5 font-bold">
                  {favorites.length}
                </span>
              )}
            </button>
          </nav>
        </SheetContent>
      </Sheet>
      <AdminPanel open={adminOpen} onOpenChange={setAdminOpen} />
    </header>
  );
}

// ==================== MOBILE BOTTOM NAV ====================

function MobileBottomNav() {
  const { currentView, setView, setSelectedType, selectedType } = useAppStore();

  if (currentView === "detail") return null;

  const tabs = [
    { label: "Accueil", view: "home" as const, icon: "home" as const },
    { label: "Films", type: "movie" as ContentType, icon: "film" as const },
    { label: "Séries", type: "series" as ContentType, icon: "tv" as const },
    { label: "Anime", type: "anime" as ContentType, icon: "sparkles" as const },
    { label: "Manga", type: "manga" as ContentType, icon: "book-open" as const },
  ];

  return (
    <nav className="md:hidden mobile-bottom-nav fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around h-14">
      {tabs.map((tab) => {
        const isActive =
          (tab.view && currentView === tab.view) ||
          (tab.type && currentView === "browse" && selectedType === tab.type);
        return (
          <button
            key={tab.label}
            onClick={() => {
              if (tab.view) setView(tab.view);
              else if (tab.type) {
                setSelectedType(tab.type);
                setView("browse");
              }
            }}
            className="nav-item flex flex-col items-center gap-0.5 py-1 px-2 relative"
          >
            <Icon
              name={tab.icon}
              className={`h-5 w-5 transition-colors ${isActive ? "text-red-500" : "text-muted-foreground"}`}
            />
            <span
              className={`text-[10px] font-medium transition-colors ${isActive ? "text-red-500" : "text-muted-foreground"}`}
            >
              {tab.label}
            </span>
            {isActive && (
              <span className="nav-dot absolute -top-0 left-1/2 -translate-x-1/2 w-5 h-0.5 rounded-full bg-red-500 opacity-1 scale-x-100 transition-all" />
            )}
          </button>
        );
      })}
    </nav>
  );
}

// ==================== SEARCH OVERLAY ====================

function SearchOverlay() {
  const { showSearch, setShowSearch, setSearchResults, searchResults, setView, setSelectedContentId } =
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
    setSelectedContentId(item.id);
    setView("detail");
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

// ==================== HERO SECTION ====================

function HeroSection() {
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
      <div className="relative w-full h-[50vh] md:h-[65vh] shimmer" />
    );
  }

  return (
    <div className="relative w-full h-[50vh] md:h-[65vh] overflow-hidden">
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
      <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/50 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent" />

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

// ==================== HOME VIEW ====================

function HomeView() {
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

// ==================== BROWSE VIEW ====================

function BrowseView() {
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
  }, [selectedType, selectedGenre, selectedSort, selectedYearFrom, selectedYearTo]);

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
  }, [selectedType, selectedGenre, selectedSort, selectedYearFrom, selectedYearTo, browseContent, setBrowseContent, setBrowseTotal, setBrowsePage, setBrowseLoading]);

  // Fetch when filters change
  useEffect(() => {
    fetchContent(1, false);
  }, [selectedType, selectedGenre, selectedSort, selectedYearFrom, selectedYearTo]);

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
                <SelectValue placeholder="De" />
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

// ==================== DETAIL VIEW ====================

function DetailView() {
  const {
    contentDetail,
    setContentDetail,
    selectedContentId,
    setView,
    currentEmbed,
    setCurrentEmbed,
    toggleFavorite,
    favorites,
    toast,
  } = useAppStore();
  const [loading, setLoading] = useState(true);
  const [playerLoading, setPlayerLoading] = useState(false);
  const [selectedEpisode, setSelectedEpisode] = useState<string | null>(null);
  const [iframeKey, setIframeKey] = useState(0);
  // MangaDex state
  const [mangadexId, setMangadexId] = useState<string | null>(null);
  const [mangadexChapters, setMangadexChapters] = useState<MangaDexChapter[]>([]);
  const [mangadexLoading, setMangadexLoading] = useState(false);
  const [mangadexError, setMangadexError] = useState<string | null>(null);

  // Fetch detail on mount or ID change
  const fetchDetail = useCallback(async (id: string) => {
    setSelectedEpisode(null);
    setCurrentEmbed(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/content/${id}`);
      const data = await res.json();
      setContentDetail(data);
      // Auto-select first embed
      if (data.embedGroups?.length > 0 && data.embedGroups[0].embeds?.length > 0) {
        const firstEmbed = data.embedGroups[0].embeds[0];
        setCurrentEmbed(firstEmbed);
        if (data.type !== "movie" && data.type !== "manga") {
          const firstGroup = data.embedGroups[0];
          setSelectedEpisode(
            firstGroup.season != null && firstGroup.episode != null
              ? `S${firstGroup.season}E${firstGroup.episode}`
              : null
          );
        }
      }
    } catch {
      setContentDetail(null);
      toast({ title: "Erreur", description: "Impossible de charger le contenu" });
    } finally {
      setLoading(false);
    }
  }, [setContentDetail, setCurrentEmbed, setSelectedEpisode, toast]);

  // Search MangaDex when manga detail loads
  const fetchMangaDexChapters = useCallback(async (mangaTitle: string) => {
    setMangadexLoading(true);
    setMangadexError(null);
    setMangadexChapters([]);
    setMangadexId(null);
    try {
      // Search for the manga on MangaDex
      const searchRes = await fetch(`/api/manga/search?q=${encodeURIComponent(mangaTitle)}`);
      const searchData = await searchRes.json();

      if (!searchData.data || searchData.data.length === 0) {
        setMangadexError("Non disponible sur MangaDex");
        return;
      }

      const mdId = searchData.data[0].id;
      setMangadexId(mdId);

      // Fetch chapters in French
      const chaptersRes = await fetch(`/api/manga/chapters?mangadexId=${mdId}&lang=fr`);
      const chaptersData = await chaptersRes.json();

      if (!chaptersData.data || chaptersData.data.length === 0) {
        // Try English as fallback
        const chaptersResEn = await fetch(`/api/manga/chapters?mangadexId=${mdId}&lang=en`);
        const chaptersDataEn = await chaptersResEn.json();
        if (!chaptersDataEn.data || chaptersDataEn.data.length === 0) {
          setMangadexError("Aucun chapitre disponible");
          return;
        }
        setMangadexChapters(chaptersDataEn.data);
      } else {
        setMangadexChapters(chaptersData.data);
      }
    } catch {
      setMangadexError("Erreur de connexion a MangaDex");
    } finally {
      setMangadexLoading(false);
    }
  }, []);

  // Trigger MangaDex search when manga content loads
  useEffect(() => {
    if (contentDetail?.type === "manga" && contentDetail.title) {
      fetchMangaDexChapters(contentDetail.title);
    }
  }, [contentDetail?.type, contentDetail?.title, fetchMangaDexChapters]);

  // Handle opening a chapter in the reader
  const handleOpenChapter = useCallback(async (chapter: MangaDexChapter) => {
    if (!chapter.id) return;
    const label = `Ch. ${chapter.chapter || "?"}${chapter.title ? ` - ${chapter.title}` : ""}`;
    const { openMangaReader } = useAppStore.getState();
    setMangadexLoading(true);
    try {
      const res = await fetch(`/api/manga/pages?chapterId=${chapter.id}`);
      const data = await res.json();
      if (data.baseUrl && data.hash && data.pages?.length > 0) {
        const pageUrls = data.pages.map(
          (filename: string) => `/api/manga/proxy?url=${encodeURIComponent(`${data.baseUrl}/data-saver/${data.hash}/${filename}`)}`
        );
        openMangaReader(pageUrls, label, mangadexChapters);
      } else {
        toast({ title: "Erreur", description: "Impossible de charger les pages" });
      }
    } catch {
      toast({ title: "Erreur", description: "Echec du chargement du chapitre" });
    } finally {
      setMangadexLoading(false);
    }
  }, [toast, mangadexChapters]);

  useEffect(() => {
    if (!selectedContentId) return;
    fetchDetail(selectedContentId);
  }, [selectedContentId, fetchDetail]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-6">
        <Skeleton className="w-full aspect-video rounded-lg mb-6" />
        <div className="flex gap-4">
          <Skeleton className="w-32 aspect-[2/3] rounded-lg hidden md:block" />
          <div className="flex-1 space-y-3">
            <Skeleton className="h-8 w-1/2" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </div>
      </div>
    );
  }

  if (!contentDetail) return null;

  const isFav = favorites.includes(contentDetail.id);
  const isSeriesOrAnime = contentDetail.type === "series" || contentDetail.type === "anime";
  const isManga = contentDetail.type === "manga";

  const handleEmbedClick = (embed: EmbedSource, episodeKey?: string) => {
    setCurrentEmbed(embed);
    setPlayerLoading(true);
    setIframeKey((k) => k + 1);
    if (episodeKey) setSelectedEpisode(episodeKey);
  };

  const handleFav = () => {
    toggleFavorite(contentDetail.id);
    toast({
      title: isFav ? "Retiré des favoris" : "Ajouté aux favoris",
      description: getDisplayTitle(contentDetail),
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="page-content max-w-7xl mx-auto px-4 md:px-8 py-6"
    >
      {/* Back button */}
      <button
        onClick={() => {
          setView("home");
          setContentDetail(null);
        }}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
      >
        <Icon name="chevron-left" className="h-4 w-4" />
        Retour
      </button>

      {/* Manga reading info or Player area */}
      {isManga ? (
        <div className="mb-8 rounded-xl overflow-hidden border border-border bg-card">
          <div className="grid md:grid-cols-[280px_1fr] gap-0">
            {/* Manga cover */}
            <div className="relative">
              <img
                src={contentDetail.posterUrl}
                alt={getDisplayTitle(contentDetail)}
                className="w-full aspect-[2/3] md:aspect-auto md:h-full object-cover"
                onError={(e) => handleImgError(e)}
              />
              <div className="absolute inset-0 bg-gradient-to-r from-transparent to-card/50 hidden md:block" />
            </div>
            {/* Manga info */}
            <div className="p-6 flex flex-col">
              <div className="flex items-center gap-2 mb-3">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-purple-600/90 text-white">
                  Livre
                </span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-600/20 text-purple-400">
                  Manga
                </span>
                <button
                  onClick={handleFav}
                  className="ml-auto w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-full bg-muted hover:bg-muted/80 transition-colors"
                  aria-label={isFav ? "Retirer des favoris" : "Ajouter aux favoris"}
                >
                  <Icon
                    name="heart"
                    className={`h-5 w-5 transition-all ${isFav ? "fill-red-500 text-red-500" : "text-muted-foreground"}`}
                  />
                </button>
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-foreground leading-tight mb-3">
                {getDisplayTitle(contentDetail)}
              </h1>
              {/* Rating */}
              <div className="flex items-center gap-3 mb-4 text-sm">
                <span className="flex items-center gap-1">
                  <Icon name="star" className="h-4 w-4 fill-amber-500 text-amber-500" />
                  <span className="text-foreground font-semibold">{contentDetail.rating?.toFixed(1)}</span>
                </span>
                {contentDetail.year && (
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <Icon name="calendar" className="h-3.5 w-3.5" />
                    {contentDetail.year}
                  </span>
                )}
              </div>
              {/* Info cards */}
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="rounded-lg bg-muted/50 p-3 text-center">
                  <Icon name="book-marked" className="h-5 w-5 text-purple-400 mx-auto mb-1" />
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">Auteur</p>
                  <p className="text-xs font-semibold text-foreground truncate">{contentDetail.genres?.split(",")[0]?.trim() || "Inconnu"}</p>
                </div>
                <div className="rounded-lg bg-muted/50 p-3 text-center">
                  <Icon name="books" className="h-5 w-5 text-emerald-400 mx-auto mb-1" />
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">Statut</p>
                  <p className="text-xs font-semibold text-foreground">{contentDetail.seasons && contentDetail.seasons > 100 ? "En cours" : "Terminé"}</p>
                </div>
                <div className="rounded-lg bg-muted/50 p-3 text-center">
                  <Icon name="book-open" className="h-5 w-5 text-blue-400 mx-auto mb-1" />
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">Chapitres</p>
                  <p className="text-xs font-semibold text-foreground">{contentDetail.seasons || "?"}</p>
                </div>
              </div>
              {/* Description */}
              {contentDetail.overviewFr && (
                <p className="text-sm text-muted-foreground leading-relaxed mb-4 line-clamp-4">
                  {contentDetail.overviewFr}
                </p>
              )}
              {/* MangaDex chapter section */}
              <div className="mt-2">
                {/* Loading state */}
                {mangadexLoading && (
                  <div className="flex items-center gap-2 py-3">
                    <Icon name="loader" className="h-4 w-4 animate-spin text-purple-400" />
                    <span className="text-sm text-muted-foreground">Recherche sur MangaDex...</span>
                  </div>
                )}
                {/* Error / not found state */}
                {mangadexError && !mangadexLoading && (
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                      <Icon name="alert-02" className="h-4 w-4 text-amber-400" />
                      {mangadexError}
                    </p>
                    {/* Fallback to AniList */}
                    {contentDetail.anilistId && (
                      <a
                        href={`https://anilist.co/manga/${contentDetail.anilistId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground text-sm font-medium rounded-lg transition-colors"
                      >
                        <Icon name="globe" className="h-3.5 w-3.5" />
                        Voir sur AniList
                      </a>
                    )}
                  </div>
                )}
                {/* Chapter list from MangaDex */}
                {!mangadexLoading && !mangadexError && mangadexChapters.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                      <Icon name="book-open" className="h-4 w-4 text-purple-400" />
                      Chapitres disponibles
                      <span className="text-xs font-normal text-muted-foreground/70">
                        ({mangadexChapters.length} chapitres)
                      </span>
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-96 overflow-y-auto pr-1">
                      {mangadexChapters.map((ch) => (
                        <button
                          key={ch.id}
                          onClick={() => handleOpenChapter(ch)}
                          disabled={mangadexLoading}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-left bg-muted/50 hover:bg-purple-600/10 hover:text-purple-400 transition-colors group disabled:opacity-50"
                        >
                          <span className="text-xs font-bold text-purple-400 group-hover:text-purple-300 min-w-[3rem]">
                            Ch. {ch.chapter || "?"}
                          </span>
                          <div className="flex-1 min-w-0">
                            {ch.title && (
                              <p className="text-xs font-medium text-foreground truncate group-hover:text-purple-300">
                                {ch.title}
                              </p>
                            )}
                          </div>
                          {ch.pages > 0 && (
                            <div className="flex items-center gap-1 text-muted-foreground flex-shrink-0">
                              <Icon name="book-open" className="h-3 w-3" />
                              <span className="text-[10px]">{ch.pages}p</span>
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="player-container mb-6">
          {currentEmbed ? (
          <>
            {playerLoading && (
              <div className="absolute inset-0 flex items-center justify-center z-10 bg-black/60">
                <Icon name="loader" className="h-8 w-8 animate-spin text-red-500" />
              </div>
            )}
            <iframe
              key={iframeKey}
              src={currentEmbed.url}
              className="absolute inset-0 w-full h-full border-0"
              allowFullScreen
              allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
              onLoad={() => setPlayerLoading(false)}
              title="Player"
            />
          </>
        ) : contentDetail.embedGroups.length === 0 ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center px-4">
              <Icon name="server" className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
              <p className="text-muted-foreground font-medium mb-1">Aucun serveur disponible</p>
              <p className="text-muted-foreground/70 text-sm">
                {contentDetail.type === "anime"
                  ? "Cet anime n'a pas encore été matché avec TMDB. Utilisez l'Administration → Auto-Match TMDB pour ajouter des liens."
                  : "Ce contenu n'a pas de liens streaming disponibles."}
              </p>
            </div>
          </div>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <Icon name="monitor" className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">Sélectionnez un serveur ci-dessous</p>
            </div>
          </div>
        )}
      </div>
      )}

      {/* Server buttons + Episode selector (not for manga) */}
      {!isManga && <div className="space-y-4 mb-8">
        {/* For movies: show server buttons directly */}
        {!isSeriesOrAnime && contentDetail.embedGroups.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
              <Icon name="server" className="h-4 w-4" />
              Serveurs disponibles
            </h3>
            <div className="flex flex-wrap gap-2">
              {contentDetail.embedGroups[0].embeds.map((embed) => (
                <ServerButton
                  key={embed.id}
                  embed={embed}
                  isActive={currentEmbed?.id === embed.id}
                  onClick={() => handleEmbedClick(embed)}
                />
              ))}
            </div>
          </div>
        )}

        {/* For series/anime: episode selector + server buttons per episode */}
        {isSeriesOrAnime && (
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
              <Icon name="tv" className="h-4 w-4" />
              Épisodes
            </h3>

            {/* Episode grid */}
            <div className="flex flex-wrap gap-2 mb-4">
              {contentDetail.embedGroups.map((group) => {
                const epKey =
                  group.season != null && group.episode != null
                    ? `S${group.season}E${group.episode}`
                    : "all";
                return (
                  <button
                    key={epKey}
                    onClick={() => {
                      setSelectedEpisode(epKey);
                      // Auto-select first embed for this episode
                      if (group.embeds.length > 0) {
                        handleEmbedClick(group.embeds[0], epKey);
                      }
                    }}
                    className={`px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                      selectedEpisode === epKey
                        ? "bg-red-600 text-white shadow-lg shadow-red-600/20"
                        : "bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80"
                    }`}
                  >
                    {group.label.replace("Saison ", "S").replace(" - Épisode ", "E")}
                  </button>
                );
              })}
            </div>

            {/* Server buttons for selected episode */}
            {selectedEpisode && (
              <div>
                <h4 className="text-xs font-medium text-muted-foreground/70 mb-2 ml-1">
                  Serveurs pour{" "}
                  {contentDetail.embedGroups.find(
                    (g) => {
                      const k =
                        g.season != null && g.episode != null
                          ? `S${g.season}E${g.episode}`
                          : "all";
                      return k === selectedEpisode;
                    }
                  )?.label || selectedEpisode}
                </h4>
                <div className="flex flex-wrap gap-2">
                  {contentDetail.embedGroups
                    .find(
                      (g) => {
                        const k =
                          g.season != null && g.episode != null
                            ? `S${g.season}E${g.episode}`
                            : "all";
                        return k === selectedEpisode;
                      }
                    )
                    ?.embeds.map((embed) => (
                      <ServerButton
                        key={embed.id}
                        embed={embed}
                        isActive={currentEmbed?.id === embed.id}
                        onClick={() => handleEmbedClick(embed, selectedEpisode)}
                      />
                    ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>}

      {/* Content info (not for manga - already shown in reading section) */}
      {!isManga && <div className="grid md:grid-cols-[220px_1fr] gap-6 mb-8">
        {/* Poster */}
        <div className="hidden md:block">
          <img
            src={contentDetail.posterUrl}
            alt={getDisplayTitle(contentDetail)}
            className="w-full aspect-[2/3] rounded-lg object-cover shadow-xl"
            onError={(e) => handleImgError(e)}
          />
        </div>

        <div>
          <div className="flex items-start justify-between gap-4 mb-3">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span
                  className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${TYPE_CONFIG[contentDetail.type]?.badgeClass || ""}`}
                >
                  {TYPE_CONFIG[contentDetail.type]?.label || contentDetail.type}
                </span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-600/90 text-white">
                  1080p
                </span>
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-foreground leading-tight">
                {getDisplayTitle(contentDetail)}
              </h1>
            </div>
            <button
              onClick={handleFav}
              className="w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-full bg-muted hover:bg-muted/80 transition-colors"
              aria-label={isFav ? "Retirer des favoris" : "Ajouter aux favoris"}
            >
              <Icon
                name="heart"
                className={`h-5 w-5 transition-all ${isFav ? "fill-red-500 text-red-500" : "text-muted-foreground"}`}
              />
            </button>
          </div>

          {/* Meta */}
          <div className="flex flex-wrap items-center gap-3 mb-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Icon name="star" className="h-4 w-4 fill-amber-500 text-amber-500" />
              <span className="text-foreground font-semibold">
                {contentDetail.rating?.toFixed(1)}
              </span>
            </span>
            {contentDetail.year && (
              <span className="flex items-center gap-1">
                <Icon name="calendar" className="h-3.5 w-3.5" />
                {contentDetail.year}
              </span>
            )}
            {contentDetail.runtime && (
              <span className="flex items-center gap-1">
                <Icon name="clock" className="h-3.5 w-3.5" />
                {contentDetail.runtime} min
              </span>
            )}
            {contentDetail.seasons && (
              <span className="flex items-center gap-1">
                <Icon name="layers" className="h-3.5 w-3.5" />
                {contentDetail.seasons} saison{contentDetail.seasons > 1 ? "s" : ""}
              </span>
            )}
          </div>

          {/* Genres */}
          {contentDetail.genres && (
            <div className="flex flex-wrap gap-2 mb-4">
              {contentDetail.genres.split(",").map((g) => g.trim()).filter(Boolean).map((genre) => (
                <Badge
                  key={genre}
                  variant="secondary"
                  className="text-xs bg-muted text-muted-foreground"
                >
                  {genre}
                </Badge>
              ))}
            </div>
          )}

          {/* Overview */}
          {contentDetail.overviewFr && (
            <p className="text-sm text-muted-foreground leading-relaxed">
              {contentDetail.overviewFr}
            </p>
          )}
        </div>
      </div>}

      {/* Ad banner */}
      <div className="ad-banner flex items-center justify-center py-2.5 px-4 mb-8">
        <span className="text-[10px] text-muted-foreground/50 uppercase tracking-widest">
          Pub
        </span>
      </div>

      {/* Related content */}
      {contentDetail.related && contentDetail.related.length > 0 && (
        <section>
          <h2 className="text-lg font-bold text-foreground mb-4">
            Contenu similaire
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {contentDetail.related.map((item) => (
              <ContentCard key={item.id} item={item} />
            ))}
          </div>
        </section>
      )}
    </motion.div>
  );
}

// ==================== SERVER BUTTON ====================

function ServerButton({
  embed,
  isActive,
  onClick,
}: {
  embed: EmbedSource;
  isActive: boolean;
  onClick: () => void;
}) {
  const hostColor = HOST_COLORS[embed.hostProvider] || "#666";
  const hostLabel = embed.hostConfig?.label || embed.serverName || embed.hostProvider;
  const quality = embed.quality || "1080p";

  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all border-2"
      style={{
        borderColor: isActive ? hostColor : "transparent",
        backgroundColor: isActive ? `${hostColor}15` : "oklch(0.18 0 0)",
        color: isActive ? hostColor : "oklch(0.7 0 0)",
        boxShadow: isActive ? `0 0 12px ${hostColor}30` : "none",
      }}
    >
      <span
        className="w-2 h-2 rounded-full flex-shrink-0"
        style={{ backgroundColor: hostColor }}
      />
      <span>{hostLabel}</span>
      <span
        className="px-1.5 py-0.5 rounded text-[9px] font-bold"
        style={{
          backgroundColor: `${hostColor}25`,
          color: hostColor,
        }}
      >
        {quality}
      </span>
    </button>
  );
}

// ==================== FAVORITES VIEW ====================

function FavoritesView() {
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

// ==================== FOOTER ====================

function Footer() {
  return (
    <footer className="mt-auto border-t border-border/50 pb-20 md:pb-0">
      {/* Donation section */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
        <div className="rounded-xl bg-gradient-to-r from-red-950/30 via-red-900/10 to-red-950/30 border border-red-900/20 p-6 text-center">
          <h3 className="text-lg font-bold text-foreground mb-2">
            Soutenir le site
          </h3>
          <p className="text-sm text-muted-foreground mb-4 max-w-md mx-auto">
            StreamVibe est gratuit et le restera. Aidez-nous à maintenir les
            serveurs en faisant un don.
          </p>
          <Button className="bg-red-600 hover:bg-red-700 text-white font-semibold btn-glow">
            Faire un don
          </Button>
        </div>
      </div>

      {/* Ad banner */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 mb-6">
        <div className="ad-banner flex items-center justify-center py-2.5 px-4">
          <span className="text-[10px] text-muted-foreground/50 uppercase tracking-widest">
            Pub
          </span>
        </div>
      </div>

      {/* Footer links */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xl font-extrabold">
            <span className="text-red-500">Stream</span>
            <span>Vibe</span>
          </div>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span>Contact</span>
            <span>DMCA</span>
            <span>Conditions d&apos;utilisation</span>
          </div>
          <p className="text-xs text-muted-foreground/50">
            &copy; {new Date().getFullYear()} StreamVibe. Tous droits réservés.
          </p>
        </div>
      </div>
    </footer>
  );
}

// ==================== ADMIN PANEL ====================

const ADMIN_GENRES = [
  "Action", "Adventure", "Comedy", "Drama", "Fantasy",
  "Romance", "Sci-Fi", "Horror", "Thriller", "Sports",
  "Supernatural", "Mystery", "Slice of Life",
];

interface AdminStats {
  totalContent: number;
  anime: { total: number; withEmbeds: number; totalEmbeds: number };
  movies: { total: number };
  series: { total: number };
  manga: { total: number };
}

interface MatchStats {
  anime: { total: number; matched: number; unmatched: number };
  movies: { total: number; matched: number; unmatched: number };
  series: { total: number; matched: number; unmatched: number };
  manga: { total: number };
  total: { content: number; embeds: number };
  hasTmdbKey: boolean;
  tmdbKeyValid: boolean;
}

interface ImageFixStats {
  total: number;
  withTmdbId: number;
  brokenPosters: number;
  noPosters: number;
  needsFix: number;
  tmdbKeyValid: boolean;
}

function StatCard({ label, value, sub, color = "text-foreground" }: {
  label: string; value: number | string; sub?: string; color?: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className={`text-xl font-bold ${color}`}>{value}</p>
      {sub && <p className="text-[10px] text-muted-foreground">{sub}</p>}
    </div>
  );
}

function AdminPanel({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { toast } = useToast();

  // AniList sync state
  const [trendingPages, setTrendingPages] = useState(2);
  const [popularPages, setPopularPages] = useState(2);
  const [topRatedPages, setTopRatedPages] = useState(2);
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [maxSeasons, setMaxSeasons] = useState(5);
  const [maxEpsPerSeason, setMaxEpsPerSeason] = useState(3);
  const [perPage, setPerPage] = useState(50);
  const [syncLoading, setSyncLoading] = useState(false);
  const [syncResult, setSyncResult] = useState<any>(null);

  // TMDB sync state
  const [tmdbSyncLoading, setTmdbSyncLoading] = useState(false);
  const [tmdbSyncResult, setTmdbSyncResult] = useState<any>(null);
  const [tmdbPages, setTmdbPages] = useState(3);
  const [tmdbSource, setTmdbSource] = useState("all");

  // Match state
  const [matchLoading, setMatchLoading] = useState(false);
  const [matchResult, setMatchResult] = useState<any>(null);

  // Image fix state
  const [fixLoading, setFixLoading] = useState(false);
  const [fixResult, setFixResult] = useState<any>(null);

  // Stats
  const [statsLoading, setStatsLoading] = useState(false);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [matchStats, setMatchStats] = useState<MatchStats | null>(null);
  const [imageFixStats, setImageFixStats] = useState<ImageFixStats | null>(null);

  // Admin tab
  const [adminTab, setAdminTab] = useState<"overview" | "anime" | "tmdb" | "images">("overview");

  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const [statsRes, matchRes, fixRes] = await Promise.all([
        fetch("/api/anime/stats").then((r) => r.json()).catch(() => null),
        fetch("/api/anime/match-tmdb").then((r) => r.json()).catch(() => null),
        fetch("/api/tmdb/fix-images").then((r) => r.json()).catch(() => null),
      ]);
      if (statsRes) setStats(statsRes);
      if (matchRes && matchRes.anime) setMatchStats(matchRes);
      if (fixRes && fixRes.total !== undefined) setImageFixStats(fixRes);
    } catch {
      toast({ title: "Erreur", description: "Impossible de charger les stats", variant: "destructive" });
    } finally {
      setStatsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (open) fetchStats();
  }, [open, fetchStats]);

  const estimatedCount = (trendingPages + popularPages + topRatedPages + selectedGenres.length) * perPage;
  const toggleGenre = (genre: string) => {
    setSelectedGenres((prev) => prev.includes(genre) ? prev.filter((g) => g !== genre) : [...prev, genre]);
  };

  const handleSync = async () => {
    setSyncLoading(true);
    setSyncResult(null);
    try {
      const params = new URLSearchParams({
        trendingPages: String(trendingPages), popularPages: String(popularPages),
        topRatedPages: String(topRatedPages), maxSeasons: String(maxSeasons),
        maxEpsPerSeason: String(maxEpsPerSeason), perplexity: String(perPage),
      });
      if (selectedGenres.length > 0) params.set("genres", selectedGenres.join(","));
      const res = await fetch(`/api/anime/sync?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setSyncResult(data.stats);
        toast({ title: "Sync AniList réussi !", description: `${data.stats.created} créés, ${data.stats.updated} mis à jour` });
        fetchStats();
      } else {
        toast({ title: "Erreur", description: data.error || "Échec", variant: "destructive" });
      }
    } catch { toast({ title: "Erreur réseau", variant: "destructive" }); }
    finally { setSyncLoading(false); }
  };

  const handleTmdbSync = async (type: "movies" | "series") => {
    setTmdbSyncLoading(true);
    setTmdbSyncResult(null);
    try {
      const params = new URLSearchParams({ type, source: tmdbSource, pages: String(tmdbPages), limit: "500" });
      const res = await fetch(`/api/tmdb/sync?${params.toString()}`, { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setTmdbSyncResult(data.stats);
        toast({ title: `TMDB ${type === "movies" ? "Films" : "Séries"} réussi !`, description: `${data.stats.created} créés, ${data.stats.updated} mis à jour` });
        fetchStats();
      } else {
        toast({ title: "Erreur TMDB", description: data.error || "Échec", variant: "destructive" });
      }
    } catch { toast({ title: "Erreur réseau", variant: "destructive" }); }
    finally { setTmdbSyncLoading(false); }
  };

  const handleMatchTmdb = async () => {
    if (!matchStats?.tmdbKeyValid) {
      toast({ title: "TMDB non configuré", description: "Clé TMDB non valide", variant: "destructive" });
      return;
    }
    setMatchLoading(true);
    setMatchResult(null);
    try {
      const res = await fetch("/api/anime/match-tmdb?limit=100", { method: "POST" });
      const data = await res.json();
      if (data.error) {
        toast({ title: "Erreur", description: data.error, variant: "destructive" });
      } else {
        setMatchResult(data.stats);
        toast({ title: "Matching terminé !", description: `${data.stats.matched}/${data.stats.processed} matchés. ${data.stats.remainingUnmatched} restants.` });
        fetchStats();
      }
    } catch { toast({ title: "Erreur réseau", variant: "destructive" }); }
    finally { setMatchLoading(false); }
  };

  const handleFixImages = async () => {
    setFixLoading(true);
    setFixResult(null);
    try {
      const res = await fetch("/api/tmdb/fix-images?limit=200", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setFixResult(data.stats);
        toast({ title: "Images corrigées !", description: `${data.stats.fixed} images mises à jour` });
        fetchStats();
      } else {
        toast({ title: "Erreur", description: data.error || "Échec", variant: "destructive" });
      }
    } catch { toast({ title: "Erreur réseau", variant: "destructive" }); }
    finally { setFixLoading(false); }
  };

  const handleReset = async () => {
    if (!window.confirm("Supprimer TOUS les anime ? Irréversible.")) return;
    try {
      const res = await fetch("/api/anime/reset", { method: "DELETE" });
      const data = await res.json();
      if (data.success) { toast({ title: "Réinitialisé", description: `${data.deleted} anime supprimés` }); fetchStats(); }
    } catch { toast({ title: "Erreur réseau", variant: "destructive" }); }
  };

  const tmdbRate = stats && stats.anime.total > 0
    ? Math.round(((stats.anime.total - (matchStats?.anime.unmatched || 0)) / stats.anime.total) * 100) : 0;

  const TABS = [
    { id: "overview" as const, label: "Vue d'ensemble", icon: <Icon name="database" className="h-3.5 w-3.5" /> },
    { id: "anime" as const, label: "Anime", icon: <Icon name="sparkles" className="h-3.5 w-3.5" /> },
    { id: "tmdb" as const, label: "Films & Séries", icon: <Icon name="film" className="h-3.5 w-3.5" /> },
    { id: "images" as const, label: "Images", icon: <Icon name="monitor" className="h-3.5 w-3.5" /> },
  ];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-full sm:w-[460px] overflow-y-auto">
        <SheetHeader className="mb-4">
          <SheetTitle className="flex items-center gap-2 text-lg">
            <Icon name="settings" className="h-5 w-5 text-red-500" /> Administration
          </SheetTitle>
          <SheetDescription>Gérer le contenu, les syncs et les paramètres</SheetDescription>
        </SheetHeader>

        <div className="flex gap-1 mb-5 bg-muted/50 rounded-lg p-1">
          {TABS.map((tab) => (
            <button key={tab.id} onClick={() => setAdminTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-2 rounded-md text-xs font-medium transition-all ${
                adminTab === tab.id ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}>
              {tab.icon}<span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        <div className="space-y-4 pb-6">
          {adminTab === "overview" && (
            <>
              <div className={`rounded-lg border p-3 ${matchStats?.tmdbKeyValid ? "border-green-500/30 bg-green-500/5" : "border-red-500/30 bg-red-500/5"}`}>
                <p className="text-xs font-medium flex items-center gap-1.5 mb-2">
                  <span className={`w-2 h-2 rounded-full ${matchStats?.tmdbKeyValid ? "bg-green-400" : "bg-red-400"} animate-pulse`} />
                  TMDB API
                </p>
                <p className="text-sm font-semibold flex items-center gap-1.5">
                  {matchStats?.tmdbKeyValid ? (
                    <><Icon name="badge-check" className="h-3.5 w-3.5 text-green-400" /> Clé TMDB configurée et valide</>
                  ) : (
                    <><Icon name="alert-02" className="h-3.5 w-3.5 text-red-400" /> Clé TMDB non configurée</>
                  )}
                </p>
              </div>

              {stats ? (
                <div className="grid grid-cols-2 gap-2">
                  <StatCard label="Films" value={stats.movies.total} />
                  <StatCard label="Séries" value={stats.series.total} />
                  <StatCard label="Anime" value={stats.anime.total} sub={`${stats.anime.withEmbeds} avec streams`} />
                  <StatCard label="Manga" value={stats.manga.total} />
                  <StatCard label="Total Embeds" value={matchStats?.total.embeds || 0} color="text-blue-400" />
                  <StatCard label="TMDB Match" value={`${tmdbRate}%`} color={tmdbRate > 80 ? "text-green-400" : tmdbRate > 40 ? "text-yellow-400" : "text-red-400"} />
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-lg" />)}
                </div>
              )}

              {imageFixStats && imageFixStats.needsFix > 0 && (
                <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/5 p-3">
                  <p className="text-xs text-yellow-400 font-medium mb-1 flex items-center gap-1"><Icon name="warning" className="h-3.5 w-3.5" /> {imageFixStats.needsFix} images cassées</p>
                  <p className="text-[11px] text-muted-foreground">Onglet &quot;Images&quot; pour corriger</p>
                </div>
              )}

              {matchStats && matchStats.anime.unmatched > 0 && (
                <div className="rounded-lg border border-orange-500/30 bg-orange-500/5 p-3">
                  <p className="text-xs text-orange-400 font-medium mb-1 flex items-center gap-1"><Icon name="zap" className="h-3.5 w-3.5" /> {matchStats.anime.unmatched} anime sans TMDB ID</p>
                  <p className="text-[11px] text-muted-foreground">Onglet &quot;Anime&quot; → Matcher</p>
                </div>
              )}

              <Separator />
              <section className="space-y-2">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Actions rapides</h3>
                <Button onClick={() => setAdminTab("tmdb")} variant="outline" className="w-full h-9 text-sm border-blue-500/20 text-blue-400 hover:bg-blue-500/10">
                  <Icon name="film" className="h-4 w-4 mr-2" /> Ajouter des Films via TMDB
                </Button>
                <Button onClick={() => setAdminTab("anime")} variant="outline" className="w-full h-9 text-sm border-orange-500/20 text-orange-400 hover:bg-orange-500/10">
                  <Icon name="sparkles" className="h-4 w-4 mr-2" /> Synchroniser les Anime (AniList)
                </Button>
                <Button onClick={() => setAdminTab("images")} variant="outline" className="w-full h-9 text-sm border-purple-500/20 text-purple-400 hover:bg-purple-500/10">
                  <Icon name="monitor" className="h-4 w-4 mr-2" /> Corriger les images cassées
                </Button>
              </section>
            </>
          )}

          {adminTab === "anime" && (
            <>
              {matchStats && (
                <div className="grid grid-cols-2 gap-2">
                  <StatCard label="Total Anime" value={matchStats.anime.total} />
                  <StatCard label="Avec TMDB" value={matchStats.anime.matched} color="text-green-400" />
                  <StatCard label="Sans streams" value={matchStats.anime.unmatched} color="text-red-400" />
                  <StatCard label="Embeds anime" value={stats?.anime.totalEmbeds || 0} color="text-blue-400" />
                </div>
              )}

              <Separator />

              <section>
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5 mb-3">
                  <Icon name="zap" className="h-4 w-4 text-muted-foreground" /> Sync AniList
                </h3>
                <div className="space-y-3">
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block"><Icon name="trending-up" className="h-3 w-3 inline mr-1" />Trending</label>
                      <Input type="number" min={1} max={20} value={trendingPages}
                        onChange={(e) => setTrendingPages(Math.max(1, Math.min(20, Number(e.target.value) || 1)))} className="h-8 text-sm" />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block"><Icon name="arrow-down-up" className="h-3 w-3 inline mr-1" />Populaire</label>
                      <Input type="number" min={1} max={20} value={popularPages}
                        onChange={(e) => setPopularPages(Math.max(1, Math.min(20, Number(e.target.value) || 1)))} className="h-8 text-sm" />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block"><Icon name="star" className="h-3 w-3 inline mr-1" />Top Notes</label>
                      <Input type="number" min={1} max={20} value={topRatedPages}
                        onChange={(e) => setTopRatedPages(Math.max(1, Math.min(20, Number(e.target.value) || 1)))} className="h-8 text-sm" />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1.5 block">Genres</label>
                    <div className="flex flex-wrap gap-1.5">
                      {ADMIN_GENRES.map((genre) => (
                        <Badge key={genre} variant={selectedGenres.includes(genre) ? "default" : "outline"}
                          className={`cursor-pointer text-xs transition-colors ${selectedGenres.includes(genre) ? "bg-red-600 text-white hover:bg-red-700 border-red-600" : "border-border text-muted-foreground hover:border-red-400 hover:text-red-400"}`}
                          onClick={() => toggleGenre(genre)}>{genre}</Badge>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Max Saisons</label>
                      <Input type="number" min={1} max={20} value={maxSeasons}
                        onChange={(e) => setMaxSeasons(Math.max(1, Math.min(20, Number(e.target.value) || 1)))} className="h-8 text-sm" />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Max Eps/Saison</label>
                      <Input type="number" min={1} max={50} value={maxEpsPerSeason}
                        onChange={(e) => setMaxEpsPerSeason(Math.max(1, Math.min(50, Number(e.target.value) || 1)))} className="h-8 text-sm" />
                    </div>
                  </div>
                </div>
              </section>

              <div className="rounded-lg border border-dashed border-border bg-card/50 p-3 text-center">
                <p className="text-xs text-muted-foreground mb-1">Estimation</p>
                <p className="text-sm font-bold">≈ <span className="text-red-400 text-lg">{estimatedCount}</span> <span className="text-sm text-muted-foreground">anime</span></p>
              </div>

              <Button onClick={handleSync} disabled={syncLoading} className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold h-11">
                {syncLoading ? <Icon name="loader" className="h-4 w-4 mr-2 animate-spin" /> : <Icon name="play" className="h-4 w-4 mr-2" />}
                {syncLoading ? "Synchronisation..." : "Sync AniList"}
              </Button>

              {syncResult && (
                <div className="rounded-lg border border-green-500/30 bg-green-500/10 p-3 text-sm space-y-1">
                  <p className="font-medium text-green-400 flex items-center gap-1"><Icon name="check" className="h-3.5 w-3.5" /> Sync terminé en {syncResult.elapsed}</p>
                  <p className="text-muted-foreground">Créés: <span className="text-green-400">{syncResult.created}</span> · MAJ: <span className="text-yellow-400">{syncResult.updated}</span> · Embeds: <span className="text-blue-400">{syncResult.withEmbeds}</span></p>
                </div>
              )}

              <Separator />

              <section>
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5 mb-3">
                  <Icon name="search" className="h-4 w-4 text-muted-foreground" /> Auto-Match TMDB
                  {matchStats?.tmdbKeyValid && <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-green-500/20 text-green-400 uppercase ml-1">AUTO</span>}
                </h3>
                <Button onClick={handleMatchTmdb} disabled={matchLoading || !matchStats?.tmdbKeyValid}
                  variant="outline" className="w-full border-orange-500/30 text-orange-400 hover:bg-orange-500/10 h-10 font-semibold">
                  {matchLoading ? <Icon name="loader" className="h-4 w-4 mr-2 animate-spin" /> : <Icon name="zap" className="h-4 w-4 mr-2" />}
                  {matchLoading ? "Matching..." : `Matcher 100 anime (${matchStats?.anime.unmatched || "?"} restants)`}
                </Button>
                {matchResult && (
                  <div className="rounded-lg border border-green-500/30 bg-green-500/10 p-3 text-sm space-y-1 mt-2">
                    <p className="font-medium text-green-400 flex items-center gap-1"><Icon name="check" className="h-3.5 w-3.5" /> {matchResult.matched}/{matchResult.processed} matchés</p>
                    {matchResult.remainingUnmatched > 0 && <p className="text-muted-foreground text-xs">Encore {matchResult.remainingUnmatched} restants. Relancez !</p>}
                  </div>
                )}
              </section>

              <Separator />
              <Button variant="outline" onClick={handleReset}
                className="w-full border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300 h-9 text-sm">
                <Icon name="delete" className="h-3.5 w-3.5 mr-1" /> Réinitialiser les Anime
              </Button>
            </>
          )}

          {adminTab === "tmdb" && (
            <>
              {!matchStats?.tmdbKeyValid ? (
                <div className="rounded-lg border border-red-500/30 bg-red-500/5 p-4 text-center">
                  <p className="text-red-400 font-medium mb-1 flex items-center gap-1"><Icon name="alert-02" className="h-3.5 w-3.5" /> TMDB non configuré</p>
                  <p className="text-xs text-muted-foreground">Ajoutez TMDB_API_KEY dans le fichier .env</p>
                </div>
              ) : (
                <>
                  <div className="rounded-lg border border-green-500/30 bg-green-500/5 p-3 mb-3">
                    <p className="text-xs text-green-400 font-medium flex items-center gap-1"><Icon name="badge-check" className="h-3.5 w-3.5" /> TMDB connecté — Prêt à importer</p>
                  </div>

                  <div className="space-y-3 mb-4">
                    <div>
                      <label className="text-xs text-muted-foreground mb-1.5 block">Source</label>
                      <div className="grid grid-cols-3 gap-1.5">
                        {[
                          { id: "all", label: "Tout" }, { id: "trending", label: "Trending" },
                          { id: "popular", label: "Populaire" }, { id: "top_rated", label: "Top Notes" },
                          { id: "now_playing", label: "Au cinéma" }, { id: "upcoming", label: "À venir" },
                        ].map((s) => (
                          <button key={s.id} onClick={() => setTmdbSource(s.id)}
                            className={`px-2 py-1.5 rounded-md text-xs font-medium transition-all ${tmdbSource === s.id ? "bg-red-600 text-white shadow-sm" : "bg-muted text-muted-foreground hover:text-foreground"}`}>
                            {s.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">Pages</label>
                        <Input type="number" min={1} max={20} value={tmdbPages}
                          onChange={(e) => setTmdbPages(Math.max(1, Math.min(20, Number(e.target.value) || 1)))} className="h-8 text-sm" />
                      </div>
                      <div className="flex items-end">
                        <div className="rounded-lg border border-dashed border-border bg-card/50 p-2 text-center w-full">
                          <p className="text-[10px] text-muted-foreground">Estimation</p>
                          <p className="text-sm font-bold text-red-400">≈ {tmdbPages * 20}+ items</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <section className="space-y-2">
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                      <Icon name="film" className="h-3.5 w-3.5" /> Films
                    </h3>
                    <Button onClick={() => handleTmdbSync("movies")} disabled={tmdbSyncLoading}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold h-10">
                      {tmdbSyncLoading ? <Icon name="loader" className="h-4 w-4 mr-2 animate-spin" /> : <Icon name="film" className="h-4 w-4 mr-2" />}
                      {tmdbSyncLoading ? "Import..." : "Importer des Films"}
                    </Button>
                  </section>

                  <Separator />

                  <section className="space-y-2">
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                      <Icon name="tv" className="h-3.5 w-3.5" /> Séries
                    </h3>
                    <Button onClick={() => handleTmdbSync("series")} disabled={tmdbSyncLoading}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold h-10">
                      {tmdbSyncLoading ? <Icon name="loader" className="h-4 w-4 mr-2 animate-spin" /> : <Icon name="tv" className="h-4 w-4 mr-2" />}
                      {tmdbSyncLoading ? "Import..." : "Importer des Séries"}
                    </Button>
                  </section>

                  {tmdbSyncResult && (
                    <div className="rounded-lg border border-green-500/30 bg-green-500/10 p-3 text-sm space-y-1">
                      <p className="font-medium text-green-400 flex items-center gap-1"><Icon name="check" className="h-3.5 w-3.5" /> {tmdbSyncResult.type === "movie" ? "Films" : "Séries"} terminé</p>
                      <p className="text-muted-foreground">
                        Créés: <span className="text-green-400">{tmdbSyncResult.created}</span> ·
                        MAJ: <span className="text-yellow-400">{tmdbSyncResult.updated}</span> ·
                        Embeds: <span className="text-blue-400">{tmdbSyncResult.withEmbeds}</span> ·
                        Images: <span className="text-purple-400">{tmdbSyncResult.imagesFixed || 0}</span>
                      </p>
                    </div>
                  )}
                </>
              )}
            </>
          )}

          {adminTab === "images" && (
            <>
              {imageFixStats ? (
                <div className="grid grid-cols-2 gap-2 mb-4">
                  <StatCard label="Total contenus" value={imageFixStats.total} />
                  <StatCard label="Avec TMDB ID" value={imageFixStats.withTmdbId} color="text-green-400" />
                  <StatCard label="Posters cassés" value={imageFixStats.brokenPosters} color="text-red-400" />
                  <StatCard label="Sans poster" value={imageFixStats.noPosters} color="text-orange-400" />
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2 mb-4">
                  {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-lg" />)}
                </div>
              )}

              {imageFixStats && imageFixStats.needsFix > 0 && (
                <>
                  <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/5 p-3 mb-3">
                    <p className="text-xs text-yellow-400 font-medium mb-1 flex items-center gap-1"><Icon name="warning" className="h-3.5 w-3.5" /> {imageFixStats.needsFix} images à corriger</p>
                    <p className="text-[11px] text-muted-foreground">Télécharge les vrais posters/backdrops depuis TMDB.</p>
                  </div>
                  <Button onClick={handleFixImages} disabled={fixLoading}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold h-10">
                    {fixLoading ? <Icon name="loader" className="h-4 w-4 mr-2 animate-spin" /> : <Icon name="monitor" className="h-4 w-4 mr-2" />}
                    {fixLoading ? "Correction..." : "Corriger les images"}
                  </Button>
                </>
              )}

              {fixResult && (
                <div className="rounded-lg border border-green-500/30 bg-green-500/10 p-3 text-sm space-y-1 mt-2">
                  <p className="font-medium text-green-400 flex items-center gap-1"><Icon name="check" className="h-3.5 w-3.5" /> Images corrigées</p>
                  <p className="text-muted-foreground">Fixées: <span className="text-green-400">{fixResult.fixed}</span> · OK: <span>{fixResult.alreadyGood}</span> · NF: <span className="text-red-400">{fixResult.notFound}</span></p>
                </div>
              )}

              {imageFixStats && imageFixStats.needsFix === 0 && (
                <div className="rounded-lg border border-green-500/30 bg-green-500/5 p-4 text-center">
                  <p className="text-green-400 font-medium flex items-center gap-1 justify-center"><Icon name="badge-check" className="h-3.5 w-3.5" /> Toutes les images sont OK !</p>
                </div>
              )}
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ==================== MANGA READER ====================

interface MangaDexChapter {
  id: string;
  chapter: string | null;
  title: string | null;
  volume: string | null;
  pages: number;
  publishAt: string | null;
  readableAt: string | null;
}

function MangaReader() {
  const {
    mangaReaderOpen,
    mangaReaderPages,
    mangaReaderCurrentPage,
    mangaReaderChapterTitle,
    mangaReaderChapters,
    closeMangaReader,
    setMangaReaderPage,
    openMangaReader,
    toast,
  } = useAppStore();
  const [loading, setLoading] = useState(false);
  const [imgError, setImgError] = useState<Record<number, boolean>>({});

  const totalPages = mangaReaderPages.length;
  const currentPage = mangaReaderCurrentPage;

  // Keyboard navigation
  useEffect(() => {
    if (!mangaReaderOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" && currentPage > 0) {
        setMangaReaderPage(currentPage - 1);
      } else if (e.key === "ArrowRight" && currentPage < totalPages - 1) {
        setMangaReaderPage(currentPage + 1);
      } else if (e.key === "Escape") {
        closeMangaReader();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [mangaReaderOpen, currentPage, totalPages, setMangaReaderPage, closeMangaReader]);

  // Lock body scroll when reader is open
  useEffect(() => {
    if (mangaReaderOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mangaReaderOpen]);

  const openChapter = useCallback(
    async (chapterId: string, title: string) => {
      setLoading(true);
      setImgError({});
      try {
        const res = await fetch(`/api/manga/pages?chapterId=${chapterId}`);
        const data = await res.json();
        if (data.baseUrl && data.hash && data.pages?.length > 0) {
          const pageUrls = data.pages.map(
            (filename: string) => `/api/manga/proxy?url=${encodeURIComponent(`${data.baseUrl}/data-saver/${data.hash}/${filename}`)}`
          );
          openMangaReader(pageUrls, title, mangaReaderChapters);
        } else {
          toast({ title: "Erreur", description: "Impossible de charger les pages de ce chapitre" });
        }
      } catch {
        toast({ title: "Erreur", description: "Echec du chargement du chapitre" });
      } finally {
        setLoading(false);
      }
    },
    [openMangaReader, mangaReaderChapters]
  );

  const currentChapterIndex = mangaReaderChapters.findIndex(
    (ch) => `Ch. ${ch.chapter}${ch.title ? ` - ${ch.title}` : ""}` === mangaReaderChapterTitle
  );

  const goToChapter = useCallback(
    (direction: "prev" | "next") => {
      if (currentChapterIndex < 0) return;
      const newIdx = direction === "prev" ? currentChapterIndex - 1 : currentChapterIndex + 1;
      if (newIdx >= 0 && newIdx < mangaReaderChapters.length) {
        const ch = mangaReaderChapters[newIdx];
        const label = `Ch. ${ch.chapter}${ch.title ? ` - ${ch.title}` : ""}`;
        openChapter(ch.id, label);
      }
    },
    [mangaReaderChapters, currentChapterIndex, openChapter]
  );

  if (!mangaReaderOpen) return null;

  const currentImgSrc = mangaReaderPages[currentPage] || "";
  const hasPrevPage = currentPage > 0;
  const hasNextPage = currentPage < totalPages - 1;
  const hasPrevChapter = currentChapterIndex > 0;
  const hasNextChapter = currentChapterIndex < mangaReaderChapters.length - 1;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-black flex flex-col"
      >
        {/* Top bar */}
        <div className="flex items-center justify-between px-4 py-3 bg-black/90 border-b border-white/10 flex-shrink-0">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate">
              {mangaReaderChapterTitle}
            </p>
            <p className="text-xs text-white/60">
              Page {currentPage + 1} / {totalPages}
            </p>
          </div>
          <button
            onClick={closeMangaReader}
            className="ml-3 w-9 h-9 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors flex-shrink-0"
            aria-label="Fermer le lecteur"
          >
            <Icon name="x" className="h-5 w-5 text-white" />
          </button>
        </div>

        {/* Main area */}
        <div className="flex-1 relative flex items-center justify-center overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center">
              <Icon name="loader" className="h-8 w-8 animate-spin text-white" />
            </div>
          ) : (
            <>
              {/* Left arrow */}
              {hasPrevPage && (
                <button
                  onClick={() => setMangaReaderPage(currentPage - 1)}
                  className="absolute left-2 md:left-6 top-1/2 -translate-y-1/2 w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-full bg-black/60 hover:bg-black/80 transition-colors z-10"
                  aria-label="Page precedente"
                >
                  <Icon name="chevron-left" className="h-6 w-6 text-white" />
                </button>
              )}

              {/* Page image */}
              <div className="max-w-[800px] w-full h-full flex items-center justify-center p-4">
                {imgError[currentPage] ? (
                  <div className="flex flex-col items-center justify-center text-center p-8">
                    <Icon name="image" className="h-12 w-12 text-white/30 mb-3" />
                    <p className="text-white/50 text-sm">Image non disponible</p>
                  </div>
                ) : (
                  <img
                    src={currentImgSrc}
                    alt={`Page ${currentPage + 1}`}
                    className="max-w-full max-h-full object-contain"
                    onError={() => setImgError((prev) => ({ ...prev, [currentPage]: true }))}
                  />
                )}
              </div>

              {/* Right arrow */}
              {hasNextPage && (
                <button
                  onClick={() => setMangaReaderPage(currentPage + 1)}
                  className="absolute right-2 md:right-6 top-1/2 -translate-y-1/2 w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-full bg-black/60 hover:bg-black/80 transition-colors z-10"
                  aria-label="Page suivante"
                >
                  <Icon name="chevron-right" className="h-6 w-6 text-white" />
                </button>
              )}
            </>
          )}
        </div>

        {/* Bottom bar */}
        <div className="flex items-center justify-between px-4 py-3 bg-black/90 border-t border-white/10 flex-shrink-0">
          <button
            onClick={() => goToChapter("prev")}
            disabled={!hasPrevChapter || loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <Icon name="chevron-left" className="h-3.5 w-3.5" />
            Chapitre precedent
          </button>

          {/* Page slider / indicator */}
          <div className="flex items-center gap-2 mx-4 flex-1 max-w-xs">
            <input
              type="range"
              min={0}
              max={Math.max(0, totalPages - 1)}
              value={currentPage}
              onChange={(e) => setMangaReaderPage(Number(e.target.value))}
              className="w-full h-1 bg-white/20 rounded-full appearance-none cursor-pointer accent-purple-500"
            />
          </div>

          <button
            onClick={() => goToChapter("next")}
            disabled={!hasNextChapter || loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Chapitre suivant
            <Icon name="chevron-right" className="h-3.5 w-3.5" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

// ==================== MAIN PAGE ====================

export default function Page() {
  const {
    currentView,
    setView,
    featured,
    setFeatured,
    trendingMovies,
    setTrendingMovies,
    trendingSeries,
    setTrendingSeries,
    trendingAnime,
    setTrendingAnime,
    trendingManga,
    setTrendingManga,
    latestContent,
    setLatestContent,
    initFavorites,
  } = useAppStore();

  // Init favorites from localStorage
  useEffect(() => {
    initFavorites();
  }, [initFavorites]);

  // Fetch home data
  useEffect(() => {
    const fetchHome = async () => {
      try {
        const [featuredRes, moviesRes, seriesRes, animeRes, mangaRes, latestRes] =
          await Promise.all([
            fetch("/api/featured"),
            fetch("/api/content?type=movie&sort=rating&limit=15"),
            fetch("/api/content?type=series&sort=rating&limit=15"),
            fetch("/api/content?type=anime&sort=rating&limit=15"),
            fetch("/api/content?type=manga&sort=rating&limit=15"),
            fetch("/api/content?sort=created&limit=10"),
          ]);

        const [featuredData, moviesData, seriesData, animeData, mangaData, latestData] =
          await Promise.all([
            featuredRes.json(),
            moviesRes.json(),
            seriesRes.json(),
            animeRes.json(),
            mangaRes.json(),
            latestRes.json(),
          ]);

        setFeatured(featuredData.data || []);
        setTrendingMovies(moviesData.data || []);
        setTrendingSeries(seriesData.data || []);
        setTrendingAnime(animeData.data || []);
        setTrendingManga(mangaData.data || []);
        setLatestContent(latestData.data || []);
      } catch (err) {
        console.error("Failed to fetch home data:", err);
      }
    };

    fetchHome();
  }, [setFeatured, setTrendingMovies, setTrendingSeries, setTrendingAnime, setTrendingManga, setLatestContent]);

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Header />

      <main className="flex-1">
        <AnimatePresence mode="wait">
          {currentView === "home" && <HomeView key="home" />}
          {currentView === "browse" && <BrowseView key="browse" />}
          {currentView === "detail" && <DetailView key="detail" />}
          {currentView === "favorites" && <FavoritesView key="favorites" />}
        </AnimatePresence>
      </main>

      <Footer />
      <MobileBottomNav />
      <SearchOverlay />
      <MangaReader />
    </div>
  );
}