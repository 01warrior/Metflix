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
import {
  Search,
  Play,
  Star,
  Film,
  Tv,
  BookOpen,
  Heart,
  ChevronLeft,
  ChevronRight,
  X,
  Home,
  Server,
  Calendar,
  Menu,
  RotateCcw,
  Clock,
  Loader2,
  Sparkles,
  Monitor,
  ArrowDownUp,
  Layers,
  Settings,
  RefreshCw,
  Database,
  Zap,
  TrendingUp,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// ==================== CONSTANTS ====================

const TYPE_CONFIG: Record<
  string,
  { label: string; icon: React.ReactNode; badgeClass: string }
> = {
  movie: {
    label: "Film",
    icon: <Film className="h-3.5 w-3.5" />,
    badgeClass: "badge-movie",
  },
  series: {
    label: "Série",
    icon: <Tv className="h-3.5 w-3.5" />,
    badgeClass: "badge-series",
  },
  anime: {
    label: "Anime",
    icon: <Sparkles className="h-3.5 w-3.5" />,
    badgeClass: "badge-anime",
  },
  manga: {
    label: "Manga",
    icon: <BookOpen className="h-3.5 w-3.5" />,
    badgeClass: "badge-manga",
  },
};

const HOST_COLORS: Record<string, string> = {
  vidsrc: "#e50914",
  vidsrc_pro: "#ff6b35",
  embed_su: "#4ecdc4",
  autoembed: "#a855f7",
  twoembed: "#3b82f6",
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
          <Heart
            className={`h-4 w-4 transition-all ${isFav ? "fill-red-500 text-red-500" : "text-white/80"}`}
          />
        </button>
        {/* Play icon overlay on hover */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <div className="w-12 h-12 rounded-full bg-red-600/90 flex items-center justify-center shadow-lg">
            <Play className="h-5 w-5 text-white ml-0.5" fill="white" />
          </div>
        </div>
        {/* Quality badge */}
        <span className="absolute bottom-2 left-2 px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-600/90 text-white backdrop-blur-sm">
          1080p
        </span>
      </div>
      {/* Info */}
      <div className="p-2.5">
        <h3 className="text-sm font-medium text-foreground truncate">
          {getDisplayTitle(item)}
        </h3>
        <div className="flex items-center gap-2 mt-1">
          <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
            <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
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
          <ChevronLeft className="h-6 w-6 text-foreground" />
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
          <ChevronRight className="h-6 w-6 text-foreground" />
        </button>
      </div>
    </section>
  );
}

// ==================== HEADER ====================

function Header() {
  const { setView, setShowSearch, favorites, currentView, setSelectedType } =
    useAppStore();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);

  const navItems = [
    { label: "Accueil", view: "home" as const, icon: <Home className="h-4 w-4" /> },
    { label: "Films", type: "movie" as ContentType, icon: <Film className="h-4 w-4" /> },
    { label: "Séries", type: "series" as ContentType, icon: <Tv className="h-4 w-4" /> },
    { label: "Anime", type: "anime" as ContentType, icon: <Sparkles className="h-4 w-4" /> },
    { label: "Manga", type: "manga" as ContentType, icon: <BookOpen className="h-4 w-4" /> },
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
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto flex items-center justify-between h-14 px-4">
        {/* Logo */}
        <button
          onClick={() => setView("home")}
          className="text-xl font-extrabold tracking-tight"
        >
          <span className="text-red-500">Stream</span>
          <span className="text-foreground">Vibe</span>
        </button>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          {navItems.map((item) => (
            <button
              key={item.label}
              onClick={() => handleNav(item)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                (item.view && currentView === item.view) ||
                (item.type && currentView === "browse")
                  ? "text-red-400 bg-red-400/10"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
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
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            <Heart className="h-3.5 w-3.5" />
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
            className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-muted transition-colors"
            aria-label="Administration"
          >
            <Settings className="h-4.5 w-4.5 text-muted-foreground" />
          </button>
          <button
            onClick={() => setShowSearch(true)}
            className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-muted transition-colors"
            aria-label="Rechercher"
          >
            <Search className="h-4.5 w-4.5 text-muted-foreground" />
          </button>
          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen(true)}
            className="md:hidden w-9 h-9 flex items-center justify-center rounded-full hover:bg-muted transition-colors"
            aria-label="Menu"
          >
            <Menu className="h-5 w-5 text-muted-foreground" />
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
                  (item.type && currentView === "browse")
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
              <Heart className="h-4 w-4" />
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
  const { currentView, setView, setSelectedType } = useAppStore();

  if (currentView === "detail") return null;

  const tabs = [
    { label: "Accueil", view: "home" as const, icon: Home },
    { label: "Films", type: "movie" as ContentType, icon: Film },
    { label: "Séries", type: "series" as ContentType, icon: Tv },
    { label: "Anime", type: "anime" as ContentType, icon: Sparkles },
    { label: "Manga", type: "manga" as ContentType, icon: BookOpen },
  ];

  return (
    <nav className="md:hidden mobile-bottom-nav fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around h-14">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive =
          (tab.view && currentView === tab.view) ||
          (tab.type && currentView === "browse");
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
          <X className="h-5 w-5" />
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
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
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
  const { featured, setView, setSelectedContentId } = useAppStore();
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
            src={current.backdropUrl}
            alt=""
            className="w-full h-full object-cover"
            onError={(e) => handleImgError(e, false)}
          />
        </motion.div>
      </AnimatePresence>
      {/* Gradients */}
      <div className="hero-gradient absolute inset-0" />
      <div className="hero-gradient-bottom absolute inset-0" />

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
                <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
                {current.rating?.toFixed(1)}
              </span>
              {current.year && (
                <span className="flex items-center gap-1 text-sm text-white/80">
                  <Calendar className="h-4 w-4" />
                  {current.year}
                </span>
              )}
              {current.runtime && (
                <span className="flex items-center gap-1 text-sm text-white/80">
                  <Clock className="h-4 w-4" />
                  {current.runtime} min
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setSelectedContentId(current.id);
                  setView("detail");
                }}
                className="btn-glow inline-flex items-center gap-2 px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors"
              >
                <Play className="h-5 w-5" fill="white" />
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
            <RotateCcw className="h-4 w-4 text-red-400" />
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
    { value: "manga", label: "Manga" },
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
            <ArrowDownUp className="h-3.5 w-3.5 text-muted-foreground" />
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
            <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
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
            {browseTotal} résultat{browseTotal !== 1 ? "s" : ""}
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
        {browseLoading && <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />}
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
        <ChevronLeft className="h-4 w-4" />
        Retour
      </button>

      {/* Player area */}
      <div className="player-container mb-6">
        {currentEmbed && !isManga ? (
          <>
            {playerLoading && (
              <div className="absolute inset-0 flex items-center justify-center z-10 bg-black/60">
                <Loader2 className="h-8 w-8 animate-spin text-red-500" />
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
        ) : isManga ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">Sélectionnez un chapitre ci-dessous</p>
            </div>
          </div>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <Monitor className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">Sélectionnez un serveur ci-dessous</p>
            </div>
          </div>
        )}
      </div>

      {/* Server buttons + Episode selector */}
      <div className="space-y-4 mb-8">
        {/* For movies: show server buttons directly */}
        {!isSeriesOrAnime && contentDetail.embedGroups.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
              <Server className="h-4 w-4" />
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
              <Tv className="h-4 w-4" />
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
      </div>

      {/* Content info */}
      <div className="grid md:grid-cols-[220px_1fr] gap-6 mb-8">
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
              <Heart
                className={`h-5 w-5 transition-all ${isFav ? "fill-red-500 text-red-500" : "text-muted-foreground"}`}
              />
            </button>
          </div>

          {/* Meta */}
          <div className="flex flex-wrap items-center gap-3 mb-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
              <span className="text-foreground font-semibold">
                {contentDetail.rating?.toFixed(1)}
              </span>
            </span>
            {contentDetail.year && (
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                {contentDetail.year}
              </span>
            )}
            {contentDetail.runtime && (
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {contentDetail.runtime} min
              </span>
            )}
            {contentDetail.seasons && (
              <span className="flex items-center gap-1">
                <Layers className="h-3.5 w-3.5" />
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
      </div>

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
        <Heart className="h-6 w-6 text-red-500" fill="currentColor" />
        <h1 className="text-2xl font-extrabold text-foreground">Mes Favoris</h1>
        <span className="text-sm text-muted-foreground">
          ({favorites.length})
        </span>
      </div>

      {loading ? (
        <SkeletonGrid />
      ) : favorites.length === 0 ? (
        <div className="text-center py-20">
          <Heart className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
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
  "Action",
  "Adventure",
  "Comedy",
  "Drama",
  "Fantasy",
  "Romance",
  "Sci-Fi",
  "Horror",
  "Thriller",
  "Sports",
  "Supernatural",
  "Mystery",
  "Slice of Life",
];

interface AnimeStatsData {
  totalContent: number;
  anime: { total: number; withEmbeds: number; totalEmbeds: number };
  movies: { total: number };
  series: { total: number };
  manga: { total: number };
  recentAnime: {
    id: string;
    title: string;
    anilistId: number | null;
    rating: number;
    year: number | null;
    posterPath: string | null;
  }[];
}

interface SyncResultData {
  fetched: number;
  created: number;
  updated: number;
  skipped: number;
  withEmbeds: number;
  tmdbResolved: number;
  totalAnime: number;
  totalAnimeEmbeds: number;
  elapsed: string;
}

function AdminPanel({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { toast } = useToast();
  const [trendingPages, setTrendingPages] = useState(2);
  const [popularPages, setPopularPages] = useState(2);
  const [topRatedPages, setTopRatedPages] = useState(2);
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [maxSeasons, setMaxSeasons] = useState(5);
  const [maxEpsPerSeason, setMaxEpsPerSeason] = useState(3);
  const [perPage, setPerPage] = useState(50);
  const [syncLoading, setSyncLoading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(false);
  const [stats, setStats] = useState<AnimeStatsData | null>(null);
  const [syncResult, setSyncResult] = useState<SyncResultData | null>(null);

  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const res = await fetch("/api/anime/stats");
      const data = await res.json();
      setStats(data);
    } catch {
      toast({
        title: "Erreur",
        description: "Impossible de charger les statistiques",
        variant: "destructive",
      });
    } finally {
      setStatsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (open) fetchStats();
  }, [open, fetchStats]);

  const estimatedCount =
    (trendingPages + popularPages + topRatedPages + selectedGenres.length) * perPage;

  const toggleGenre = (genre: string) => {
    setSelectedGenres((prev) =>
      prev.includes(genre) ? prev.filter((g) => g !== genre) : [...prev, genre]
    );
  };

  const handleSync = async () => {
    setSyncLoading(true);
    setSyncResult(null);
    try {
      const params = new URLSearchParams({
        trendingPages: String(trendingPages),
        popularPages: String(popularPages),
        topRatedPages: String(topRatedPages),
        maxSeasons: String(maxSeasons),
        maxEpsPerSeason: String(maxEpsPerSeason),
        perplexity: String(perPage),
      });
      if (selectedGenres.length > 0) {
        params.set("genres", selectedGenres.join(","));
      }

      const res = await fetch(`/api/anime/sync?${params.toString()}`);
      const data = await res.json();

      if (data.success) {
        setSyncResult(data.stats);
        toast({
          title: "Sync réussi !",
          description: `${data.stats.created} anime ajoutés, ${data.stats.updated} mis à jour`,
        });
        fetchStats();
      } else {
        toast({
          title: "Erreur de sync",
          description: data.error || "Échec inconnu",
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Erreur réseau",
        description: "Impossible de contacter le serveur",
        variant: "destructive",
      });
    } finally {
      setSyncLoading(false);
    }
  };

  const handleReset = () => {
    if (
      window.confirm(
        "⚠️ Supprimer TOUS les anime de la base de données ? Cette action est irréversible."
      )
    ) {
      toast({
        title: "Info",
        description: "La réinitialisation n'est pas encore implémentée via l'API.",
      });
    }
  };

  const tmdbRate =
    stats && stats.anime.total > 0
      ? Math.round((stats.anime.withEmbeds / stats.anime.total) * 100)
      : 0;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:w-[440px] bg-background border-border overflow-y-auto"
      >
        <SheetHeader className="px-4 pt-6 pb-2">
          <SheetTitle className="flex items-center gap-2 text-lg">
            <Settings className="h-5 w-5" />
            Administration AniList
          </SheetTitle>
          <SheetDescription>
            Synchronisation et statistiques anime
          </SheetDescription>
        </SheetHeader>

        <div className="px-4 pb-6 space-y-6 mt-2">
          {/* ===== Stats Section ===== */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                <Database className="h-4 w-4 text-muted-foreground" />
                Statistiques
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={fetchStats}
                disabled={statsLoading}
                className="h-7 text-xs"
              >
                <RefreshCw
                  className={`h-3 w-3 mr-1 ${statsLoading ? "animate-spin" : ""}`}
                />
                Actualiser
              </Button>
            </div>
            {stats ? (
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-lg border border-border bg-card p-3">
                  <p className="text-xs text-muted-foreground">Total Anime</p>
                  <p className="text-2xl font-bold text-foreground">
                    {stats.anime.total}
                  </p>
                </div>
                <div className="rounded-lg border border-border bg-card p-3">
                  <p className="text-xs text-muted-foreground">Avec Embeds</p>
                  <p className="text-2xl font-bold text-green-400">
                    {stats.anime.withEmbeds}
                  </p>
                </div>
                <div className="rounded-lg border border-border bg-card p-3">
                  <p className="text-xs text-muted-foreground">Total Embeds</p>
                  <p className="text-2xl font-bold text-foreground">
                    {stats.anime.totalEmbeds}
                  </p>
                </div>
                <div className="rounded-lg border border-border bg-card p-3">
                  <p className="text-xs text-muted-foreground">TMDB Match</p>
                  <p className="text-2xl font-bold text-red-400">{tmdbRate}%</p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 rounded-lg" />
                ))}
              </div>
            )}
          </section>

          <Separator />

          {/* ===== Sync Controls ===== */}
          <section>
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5 mb-3">
              <Zap className="h-4 w-4 text-muted-foreground" />
              Contrôles de Sync
            </h3>

            <div className="space-y-3">
              {/* Pages inputs */}
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">
                    <TrendingUp className="h-3 w-3 inline mr-1" />
                    Trending
                  </label>
                  <Input
                    type="number"
                    min={1}
                    max={20}
                    value={trendingPages}
                    onChange={(e) =>
                      setTrendingPages(
                        Math.max(1, Math.min(20, Number(e.target.value) || 1))
                      )
                    }
                    className="h-8 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">
                    <ArrowDownUp className="h-3 w-3 inline mr-1" />
                    Populaire
                  </label>
                  <Input
                    type="number"
                    min={1}
                    max={20}
                    value={popularPages}
                    onChange={(e) =>
                      setPopularPages(
                        Math.max(1, Math.min(20, Number(e.target.value) || 1))
                      )
                    }
                    className="h-8 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">
                    <Star className="h-3 w-3 inline mr-1" />
                    Top Notes
                  </label>
                  <Input
                    type="number"
                    min={1}
                    max={20}
                    value={topRatedPages}
                    onChange={(e) =>
                      setTopRatedPages(
                        Math.max(1, Math.min(20, Number(e.target.value) || 1))
                      )
                    }
                    className="h-8 text-sm"
                  />
                </div>
              </div>

              {/* Genres */}
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">
                  Genres
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {ADMIN_GENRES.map((genre) => (
                    <Badge
                      key={genre}
                      variant={
                        selectedGenres.includes(genre) ? "default" : "outline"
                      }
                      className={`cursor-pointer text-xs transition-colors ${
                        selectedGenres.includes(genre)
                          ? "bg-red-600 text-white hover:bg-red-700 border-red-600"
                          : "border-border text-muted-foreground hover:border-red-400 hover:text-red-400"
                      }`}
                      onClick={() => toggleGenre(genre)}
                    >
                      {genre}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Embed generation settings */}
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">
                    Max Saisons
                  </label>
                  <Input
                    type="number"
                    min={1}
                    max={20}
                    value={maxSeasons}
                    onChange={(e) =>
                      setMaxSeasons(
                        Math.max(1, Math.min(20, Number(e.target.value) || 1))
                      )
                    }
                    className="h-8 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">
                    Max Eps/Saison
                  </label>
                  <Input
                    type="number"
                    min={1}
                    max={50}
                    value={maxEpsPerSeason}
                    onChange={(e) =>
                      setMaxEpsPerSeason(
                        Math.max(1, Math.min(50, Number(e.target.value) || 1))
                      )
                    }
                    className="h-8 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">
                    Items/page
                  </label>
                  <Select
                    value={String(perPage)}
                    onValueChange={(v) => setPerPage(Number(v))}
                  >
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="25">25</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </section>

          {/* ===== Estimated Count ===== */}
          <div className="rounded-lg border border-dashed border-border bg-card/50 p-3 text-center">
            <p className="text-xs text-muted-foreground mb-1">Estimation</p>
            <p className="text-sm sm:text-base font-bold text-foreground">
              ({trendingPages} + {popularPages} + {topRatedPages}
              {selectedGenres.length > 0 && ` + ${selectedGenres.length}`}) ×{" "}
              {perPage}
              <span className="mx-1.5 text-muted-foreground">≈</span>
              <span className="text-red-400 text-lg">{estimatedCount}</span>
              <span className="text-sm text-muted-foreground ml-1">anime</span>
            </p>
          </div>

          <Separator />

          {/* ===== Action Buttons ===== */}
          <section className="space-y-2">
            <Button
              onClick={handleSync}
              disabled={syncLoading}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold h-11"
            >
              {syncLoading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Play className="h-4 w-4 mr-2" />
              )}
              {syncLoading ? "Synchronisation..." : "▶ Lancer le Sync"}
            </Button>

            {syncResult && (
              <div className="rounded-lg border border-green-500/30 bg-green-500/10 p-3 text-sm space-y-1">
                <p className="font-medium text-green-400">
                  ✓ Sync terminé en {syncResult.elapsed}
                </p>
                <p className="text-muted-foreground">
                  Récupérés:{" "}
                  <span className="text-foreground font-medium">
                    {syncResult.fetched}
                  </span>{" "}
                  · Créés:{" "}
                  <span className="text-green-400 font-medium">
                    {syncResult.created}
                  </span>{" "}
                  · Mis à jour:{" "}
                  <span className="text-yellow-400 font-medium">
                    {syncResult.updated}
                  </span>{" "}
                  · Embeds:{" "}
                  <span className="text-blue-400 font-medium">
                    {syncResult.withEmbeds}
                  </span>
                </p>
                <p className="text-muted-foreground">
                  TMDB résolus:{" "}
                  <span className="text-red-400 font-medium">
                    {syncResult.tmdbResolved}
                  </span>{" "}
                  · Ignorés:{" "}
                  <span className="text-muted-foreground font-medium">
                    {syncResult.skipped}
                  </span>
                </p>
              </div>
            )}

            <Button
              variant="outline"
              onClick={handleReset}
              className="w-full border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300 h-9 text-sm"
            >
              🗑 Réinitialiser les Anime
            </Button>
          </section>

          <Separator />

          {/* ===== Info ===== */}
          <p className="text-[11px] text-muted-foreground/70 leading-relaxed">
            <strong className="text-muted-foreground">AniList API</strong> : 100%
            gratuit, illimité. Chaque page = ~{perPage} anime. Sur un vrai
            serveur, vous pouvez monter à 5000+ anime.
          </p>
        </div>
      </SheetContent>
    </Sheet>
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
    </div>
  );
}