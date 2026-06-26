"use client";

import { useEffect, useCallback, useRef, useState } from "react";
import { useAppStore, type ContentItem, type ContentType, type ContentDetail } from "@/store/app-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Search,
  Play,
  Star,
  Clock,
  Film,
  Tv,
  Sparkles,
  BookOpen,
  Heart,
  ChevronLeft,
  ChevronRight,
  X,
  Home,
  TrendingUp,
  Server,
  Eye,
  Calendar,
  ArrowUp,
  Coffee,
  Info,
  Layers,
  Grid3X3,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// ==================== TYPES & HELPERS ====================

const TYPE_CONFIG: Record<string, { label: string; icon: React.ReactNode; color: string; badgeClass: string }> = {
  movie: { label: "Film", icon: <Film className="h-4 w-4" />, color: "text-red-400", badgeClass: "badge-movie" },
  series: { label: "Série", icon: <Tv className="h-4 w-4" />, color: "text-emerald-400", badgeClass: "badge-series" },
  anime: { label: "Anime", icon: <Sparkles className="h-4 w-4" />, color: "text-purple-400", badgeClass: "badge-anime" },
  manga: { label: "Manga", icon: <BookOpen className="h-4 w-4" />, color: "text-amber-400", badgeClass: "badge-manga" },
};

function getTypeLabel(type: string) {
  return TYPE_CONFIG[type]?.label || type;
}

function getTypeBadgeClass(type: string) {
  return TYPE_CONFIG[type]?.badgeClass || "bg-secondary text-secondary-foreground";
}

// ==================== AD BANNER COMPONENT ====================

function AdBanner({ slot = "top", className = "" }: { slot?: string; className?: string }) {
  return (
    <div className={`ad-banner flex items-center justify-center ${className}`}>
      <div className="flex flex-col items-center gap-1 py-4 px-6 text-center">
        <p className="text-xs text-muted-foreground">Publicité</p>
        <p className="text-sm text-muted-foreground/70">Espace publicitaire disponible — <span className="text-muted-foreground">Contactez-nous</span></p>
        <p className="text-[10px] text-muted-foreground/40">728 × 90</p>
      </div>
    </div>
  );
}

// ==================== SKELETON LOADING ====================

function ContentSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="aspect-[2/3] w-full rounded-lg" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      ))}
    </div>
  );
}

// ==================== CONTENT CARD ====================

function ContentCard({ item, onClick }: { item: ContentItem; onClick: () => void }) {
  const config = TYPE_CONFIG[item.type] || TYPE_CONFIG.movie;
  return (
    <motion.div
      className="content-card cursor-pointer group"
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
    >
      <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-muted mb-2">
        {item.posterUrl ? (
          <img
            src={item.posterUrl}
            alt={item.titleFr || item.title}
            className="w-full h-full object-cover transition-opacity group-hover:opacity-80"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Film className="h-8 w-8 text-muted-foreground/30" />
          </div>
        )}
        {/* Overlay on hover */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="bg-red-600 rounded-full p-3 shadow-lg">
              <Play className="h-5 w-5 text-white fill-white" />
            </div>
          </div>
        </div>
        {/* Rating badge */}
        <div className="absolute top-2 left-2 flex items-center gap-1 bg-black/70 backdrop-blur-sm rounded-md px-2 py-0.5">
          <Star className="h-3 w-3 text-amber-400 fill-amber-400" />
          <span className="text-xs font-semibold text-white">{item.rating?.toFixed(1)}</span>
        </div>
        {/* Type badge */}
        <div className="absolute top-2 right-2">
          <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${getTypeBadgeClass(item.type)}`}>
            {getTypeLabel(item.type)}
          </span>
        </div>
        {/* Year */}
        {item.year && (
          <div className="absolute bottom-2 right-2 bg-black/70 backdrop-blur-sm rounded-md px-1.5 py-0.5">
            <span className="text-[10px] text-white/80">{item.year}</span>
          </div>
        )}
      </div>
      <h3 className="text-sm font-medium leading-tight line-clamp-2 px-0.5">
        {item.titleFr || item.title}
      </h3>
      <div className="flex items-center gap-2 mt-1 px-0.5">
        <span className={`text-xs ${config.color}`}>{config.label}</span>
        {item.genres && (
          <span className="text-xs text-muted-foreground truncate">
            {item.genres.split(",")[0]}
          </span>
        )}
      </div>
    </motion.div>
  );
}

// ==================== CONTENT ROW (Horizontal Scroll) ====================

function ContentRow({ title, items, onContentClick, icon, viewAllType }: {
  title: string;
  items: ContentItem[];
  onContentClick: (id: string) => void;
  icon?: React.ReactNode;
  viewAllType?: ContentType;
}) {
  const { setSelectedType, setView } = useAppStore();
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: "left" | "right") => {
    if (scrollRef.current) {
      const amount = scrollRef.current.clientWidth * 0.75;
      scrollRef.current.scrollBy({ left: dir === "left" ? -amount : amount, behavior: "smooth" });
    }
  };

  if (items.length === 0) return null;

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between px-4 md:px-0">
        <div className="flex items-center gap-2">
          {icon}
          <h2 className="text-lg md:text-xl font-bold">{title}</h2>
        </div>
        {viewAllType && (
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-foreground text-sm"
            onClick={() => {
              setSelectedType(viewAllType);
              setView("browse");
            }}
          >
            Voir tout
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        )}
      </div>
      <div className="relative group/row">
        <button
          onClick={() => scroll("left")}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-black/60 hover:bg-black/80 rounded-full p-1.5 opacity-0 group-hover/row:opacity-100 transition-opacity hidden md:block"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div ref={scrollRef} className="flex gap-3 overflow-x-auto hide-scrollbar px-4 md:px-0 pb-2">
          {items.map((item) => (
            <div key={item.id} className="flex-shrink-0 w-[140px] sm:w-[160px] md:w-[170px]">
              <ContentCard item={item} onClick={() => onContentClick(item.id)} />
            </div>
          ))}
        </div>
        <button
          onClick={() => scroll("right")}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-black/60 hover:bg-black/80 rounded-full p-1.5 opacity-0 group-hover/row:opacity-100 transition-opacity hidden md:block"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
    </section>
  );
}

// ==================== HERO SECTION ====================

function HeroSection({ items, onContentClick }: { items: ContentItem[]; onContentClick: (id: string) => void }) {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (items.length === 0) return;
    const timer = setInterval(() => {
      setCurrent((c) => (c + 1) % items.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [items.length]);

  if (items.length === 0) return <Skeleton className="h-[50vh] md:h-[70vh] w-full rounded-none" />;

  const item = items[current];
  const config = TYPE_CONFIG[item.type] || TYPE_CONFIG.movie;

  return (
    <div className="relative h-[50vh] md:h-[70vh] w-full overflow-hidden">
      {/* Backdrop image */}
      {item.backdropUrl && (
        <AnimatePresence mode="wait">
          <motion.img
            key={item.id}
            src={item.backdropUrl}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
          />
        </AnimatePresence>
      )}
      {/* Gradients */}
      <div className="hero-gradient absolute inset-0" />
      <div className="hero-gradient-bottom absolute inset-0" />

      {/* Content */}
      <div className="relative z-10 flex flex-col justify-end h-full px-4 md:px-12 pb-12 md:pb-16 max-w-3xl">
        <AnimatePresence mode="wait">
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
          >
            <span className={`inline-flex items-center gap-1.5 text-xs font-bold uppercase px-2.5 py-1 rounded mb-3 ${getTypeBadgeClass(item.type)}`}>
              {config.icon}
              {config.label}
            </span>
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-extrabold leading-tight mb-3 drop-shadow-lg">
              {item.titleFr || item.title}
            </h1>
            <div className="flex flex-wrap items-center gap-3 mb-3 text-sm text-white/80">
              <span className="flex items-center gap-1">
                <Star className="h-4 w-4 text-amber-400 fill-amber-400" />
                <span className="font-semibold text-white">{item.rating?.toFixed(1)}</span>
              </span>
              {item.year && (
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  {item.year}
                </span>
              )}
              {item.runtime && (
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  {Math.floor(item.runtime / 60)}h{item.runtime % 60}min
                </span>
              )}
              {item.seasons && (
                <span className="flex items-center gap-1">
                  <Layers className="h-3.5 w-3.5" />
                  {item.seasons} saison{item.seasons > 1 ? "s" : ""}
                </span>
              )}
            </div>
            {item.genres && (
              <div className="flex flex-wrap gap-1.5 mb-4">
                {item.genres.split(",").slice(0, 4).map((g) => (
                  <Badge key={g} variant="secondary" className="text-xs bg-white/10 text-white/80 border-0 backdrop-blur-sm">
                    {g.trim()}
                  </Badge>
                ))}
              </div>
            )}
            <p className="text-sm md:text-base text-white/70 line-clamp-3 mb-5 max-w-2xl leading-relaxed">
              {item.overviewFr || item.overview}
            </p>
            <div className="flex gap-3">
              <Button
                size="lg"
                className="bg-red-600 hover:bg-red-700 text-white font-bold px-8 shadow-lg shadow-red-900/30"
                onClick={() => onContentClick(item.id)}
              >
                <Play className="h-5 w-5 mr-2 fill-white" />
                Regarder
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-white/20 bg-white/5 hover:bg-white/10 text-white backdrop-blur-sm"
                onClick={() => onContentClick(item.id)}
              >
                <Info className="h-5 w-5 mr-2" />
                Plus d&apos;infos
              </Button>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Dots */}
      {items.length > 1 && (
        <div className="absolute bottom-4 right-4 md:bottom-8 md:right-12 z-10 flex gap-1.5">
          {items.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`rounded-full transition-all ${i === current ? "w-8 h-2 bg-red-500" : "w-2 h-2 bg-white/40 hover:bg-white/60"}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ==================== CONTENT DETAIL VIEW ====================

function ContentDetailView({ onBack }: { onBack: () => void }) {
  const { contentDetail, currentEmbed, setCurrentEmbed, setContentDetail } = useAppStore();
  const [loadingEmbed, setLoadingEmbed] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  if (!contentDetail) return null;

  const config = TYPE_CONFIG[contentDetail.type] || TYPE_CONFIG.movie;
  const isManga = contentDetail.type === "manga";
  const hasEpisodes = contentDetail.embeds.some((e) => e.episode !== null);

  const handleSelectEmbed = (embed: typeof contentDetail.embeds[0]) => {
    setLoadingEmbed(true);
    setCurrentEmbed(embed);
    setTimeout(() => setLoadingEmbed(false), 500);
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  // Group embeds for series/anime
  const episodeMap = new Map<string, typeof contentDetail.embeds>();
  for (const embed of contentDetail.embeds) {
    const key = embed.episode ? `S${embed.season || 1}E${embed.episode}` : "Film";
    if (!episodeMap.has(key)) episodeMap.set(key, []);
    episodeMap.get(key)!.push(embed);
  }
  const episodeKeys = Array.from(episodeMap.keys());

  return (
    <div ref={scrollRef} className="min-h-screen">
      {/* Backdrop + Info */}
      <div className="relative">
        {contentDetail.backdropUrl && (
          <div className="absolute inset-0 h-80 md:h-96">
            <img src={contentDetail.backdropUrl} alt="" className="w-full h-full object-cover" />
            <div className="hero-gradient absolute inset-0" />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
          </div>
        )}
        <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-12 pt-24 md:pt-32">
          <Button variant="ghost" size="sm" className="text-white/70 hover:text-white mb-4 -ml-2" onClick={onBack}>
            <ChevronLeft className="h-4 w-4 mr-1" />
            Retour
          </Button>
          <div className="flex flex-col md:flex-row gap-6 md:gap-8">
            {/* Poster */}
            <div className="flex-shrink-0 mx-auto md:mx-0">
              <div className="w-48 md:w-56 aspect-[2/3] rounded-lg overflow-hidden shadow-2xl shadow-black/50">
                {contentDetail.posterUrl ? (
                  <img src={contentDetail.posterUrl} alt={contentDetail.titleFr || contentDetail.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-muted flex items-center justify-center">
                    <Film className="h-12 w-12 text-muted-foreground/30" />
                  </div>
                )}
              </div>
            </div>
            {/* Info */}
            <div className="flex-1 text-white">
              <div className="flex items-center gap-2 mb-2">
                <span className={`inline-flex items-center gap-1 text-xs font-bold uppercase px-2 py-0.5 rounded ${getTypeBadgeClass(contentDetail.type)}`}>
                  {config.icon}
                  {config.label}
                </span>
                {contentDetail.year && (
                  <span className="text-sm text-white/60">{contentDetail.year}</span>
                )}
              </div>
              <h1 className="text-2xl md:text-4xl font-extrabold mb-2">{contentDetail.titleFr || contentDetail.title}</h1>
              <p className="text-sm text-white/40 mb-3 italic">{contentDetail.titleFr !== contentDetail.title ? contentDetail.title : ""}</p>

              <div className="flex flex-wrap items-center gap-3 mb-4 text-sm">
                <span className="flex items-center gap-1 text-amber-400">
                  <Star className="h-4 w-4 fill-amber-400" />
                  <span className="font-bold">{contentDetail.rating?.toFixed(1)}</span>
                  <span className="text-white/50">({contentDetail.voteCount?.toLocaleString()} votes)</span>
                </span>
                {contentDetail.runtime && (
                  <span className="flex items-center gap-1 text-white/60">
                    <Clock className="h-3.5 w-3.5" />
                    {Math.floor(contentDetail.runtime / 60)}h{contentDetail.runtime % 60}min
                  </span>
                )}
                {contentDetail.seasons && (
                  <span className="flex items-center gap-1 text-white/60">
                    <Layers className="h-3.5 w-3.5" />
                    {contentDetail.seasons} saison{contentDetail.seasons > 1 ? "s" : ""}
                  </span>
                )}
              </div>

              {contentDetail.genres && (
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {contentDetail.genres.split(",").map((g) => (
                    <Badge key={g} variant="secondary" className="bg-white/10 text-white/80 border-0 text-xs">{g.trim()}</Badge>
                  ))}
                </div>
              )}

              <p className="text-sm md:text-base text-white/60 leading-relaxed max-w-2xl mb-4">
                {contentDetail.overviewFr || contentDetail.overview || "Aucune description disponible."}
              </p>

              {contentDetail.categories?.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {contentDetail.categories.map((c) => (
                    <Badge key={c.slug} variant="outline" className="border-white/20 text-white/60 text-xs">{c.name}</Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Player Area */}
      <div className="max-w-7xl mx-auto px-4 md:px-12 mt-8">
        <div className="relative bg-black rounded-lg overflow-hidden shadow-2xl shadow-black/50">
          {currentEmbed ? (
            loadingEmbed ? (
              <div className="aspect-video flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
                  <p className="text-sm text-white/60">Chargement du lecteur...</p>
                </div>
              </div>
            ) : isManga ? (
              <div className="aspect-video flex items-center justify-center bg-zinc-900">
                <div className="text-center space-y-3 p-8">
                  <BookOpen className="h-12 w-12 text-amber-400 mx-auto" />
                  <h3 className="text-xl font-bold text-white">Lecteur Manga</h3>
                  <p className="text-white/60 text-sm">
                    Serveur: <span className="text-white font-medium">{currentEmbed.serverName}</span>
                  </p>
                  <p className="text-white/40 text-xs">
                    URL: {currentEmbed.url}
                  </p>
                  <p className="text-amber-400/80 text-xs mt-4">
                    (En production, le lecteur manga s&apos;affichera ici)
                  </p>
                </div>
              </div>
            ) : (
              <div className="aspect-video flex items-center justify-center bg-zinc-900">
                <div className="text-center space-y-3 p-8">
                  <div className="bg-red-600 rounded-full p-4 w-16 h-16 flex items-center justify-center mx-auto">
                    <Play className="h-8 w-8 text-white fill-white" />
                  </div>
                  <h3 className="text-lg font-bold text-white">Lecteur vidéo</h3>
                  <p className="text-white/60 text-sm">
                    Serveur: <span className="text-white font-medium">{currentEmbed.serverName}</span>
                    {currentEmbed.quality && (
                      <span className="ml-2 text-amber-400">{currentEmbed.quality}</span>
                    )}
                    {currentEmbed.lang && (
                      <span className="ml-2 uppercase text-xs px-1.5 py-0.5 bg-white/10 rounded">{currentEmbed.lang}</span>
                    )}
                  </p>
                  <p className="text-white/40 text-xs mt-2">
                    (En production, l&apos;embed vidéo s&apos;affichera ici)
                  </p>
                </div>
              </div>
            )
          ) : (
            <div className="aspect-video flex items-center justify-center">
              <div className="text-center space-y-3">
                <Eye className="h-10 w-10 text-muted-foreground mx-auto" />
                <p className="text-muted-foreground text-sm">Sélectionnez un serveur ci-dessous pour commencer</p>
              </div>
            </div>
          )}
        </div>

        {/* Server Selection / Episode List */}
        <div className="mt-6 space-y-4">
          {/* Server Tabs for movies/manga (no episodes) */}
          {!hasEpisodes ? (
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                <Server className="h-4 w-4" />
                Serveurs disponibles
              </h3>
              <div className="flex flex-wrap gap-2">
                {contentDetail.embeds.map((embed) => (
                  <Button
                    key={embed.id}
                    variant={currentEmbed?.id === embed.id ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleSelectEmbed(embed)}
                    className={currentEmbed?.id === embed.id
                      ? "bg-red-600 hover:bg-red-700 text-white border-red-600"
                      : "border-white/20 text-white/70 hover:text-white hover:bg-white/5"
                    }
                  >
                    <Server className="h-3.5 w-3.5 mr-1.5" />
                    {embed.serverName}
                    {embed.quality && <span className="ml-1.5 text-xs opacity-70">{embed.quality}</span>}
                    {embed.lang && <span className="ml-1.5 text-xs uppercase opacity-50">{embed.lang}</span>}
                  </Button>
                ))}
              </div>
            </div>
          ) : (
            /* Episode selector for series/anime */
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                <Layers className="h-4 w-4" />
                Épisodes
              </h3>
              <div className="flex gap-2 flex-wrap mb-4">
                {contentDetail.embeds.filter(e => !e.episode).map((embed) => (
                  <Button
                    key={embed.id}
                    variant={currentEmbed?.id === embed.id ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleSelectEmbed(embed)}
                    className={currentEmbed?.id === embed.id
                      ? "bg-red-600 hover:bg-red-700 text-white border-red-600"
                      : "border-white/20 text-white/70 hover:text-white hover:bg-white/5"
                    }
                  >
                    <Server className="h-3.5 w-3.5 mr-1.5" />
                    {embed.serverName}
                  </Button>
                ))}
              </div>
              <ScrollArea className="max-h-64">
                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2 pb-4">
                  {episodeKeys.map((key) => (
                    <Button
                      key={key}
                      variant={currentEmbed && episodeMap.get(key)?.some(e => e.id === currentEmbed.id) ? "default" : "outline"}
                      size="sm"
                      className={currentEmbed && episodeMap.get(key)?.some(e => e.id === currentEmbed.id)
                        ? "bg-red-600 hover:bg-red-700 text-white border-red-600 text-xs font-bold"
                        : "border-white/20 text-white/70 hover:text-white hover:bg-white/5 text-xs"
                      }
                      onClick={() => {
                        const embeds = episodeMap.get(key);
                        if (embeds && embeds.length > 0) {
                          handleSelectEmbed(embeds[0]);
                        }
                      }}
                    >
                      {key}
                    </Button>
                  ))}
                </div>
                <ScrollBar orientation="horizontal" />
              </ScrollArea>
              {/* Server tabs for current episode */}
              {currentEmbed?.episode && (
                <div className="mt-3">
                  <p className="text-xs text-muted-foreground mb-2">
                    Serveurs pour {currentEmbed.season ? `S${currentEmbed.season}` : ""}E{currentEmbed.episode} :
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {episodeMap.get(`S${currentEmbed.season || 1}E${currentEmbed.episode}`)?.map((embed) => (
                      <Button
                        key={embed.id}
                        variant={currentEmbed?.id === embed.id ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleSelectEmbed(embed)}
                        className={currentEmbed?.id === embed.id
                          ? "bg-red-600 hover:bg-red-700 text-white border-red-600"
                          : "border-white/20 text-white/70 hover:text-white hover:bg-white/5"
                        }
                      >
                        {embed.serverName}
                        {embed.quality && <span className="ml-1 text-xs opacity-70">{embed.quality}</span>}
                        <span className="ml-1 text-xs uppercase opacity-50">{embed.lang}</span>
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Ad between content and related */}
        <div className="my-8">
          <AdBanner slot="detail-mid" />
        </div>

        {/* Related Content */}
        {contentDetail.related && contentDetail.related.length > 0 && (
          <section className="mt-8">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-red-400" />
              Contenu similaire
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {contentDetail.related.map((item) => (
                <ContentCard
                  key={item.id}
                  item={item}
                  onClick={() => {
                    setCurrentEmbed(null);
                    // reload detail
                    fetchContentDetail(item.id);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

// ==================== BROWSE VIEW ====================

function BrowseView() {
  const {
    selectedType, selectedCategory, browseContent, browseTotal, browsePage,
    categories, categoriesByType, setBrowseContent, setBrowseTotal,
    setBrowsePage, setSelectedCategory, setContentDetail,
    setView, setCurrentEmbed,
  } = useAppStore();

  const [loading, setLoading] = useState(false);
  const limit = 20;

  const fetchContent = useCallback(async (page: number) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) });
      if (selectedType !== "all") params.set("type", selectedType);
      if (selectedCategory) params.set("category", selectedCategory);
      params.set("sort", "rating");

      const res = await fetch(`/api/content?${params}`);
      const data = await res.json();
      setBrowseContent(data.data || []);
      setBrowseTotal(data.total || 0);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [selectedType, selectedCategory, limit]);

  const fetchContentDetail = async (id: string) => {
    try {
      const res = await fetch(`/api/content/${id}`);
      const data = await res.json();
      setContentDetail(data);
      setView("detail");
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchContent(browsePage);
  }, [fetchContent, browsePage]);

  const totalPages = Math.ceil(browseTotal / limit);

  const typeButtons: { key: ContentType; label: string; icon: React.ReactNode }[] = [
    { key: "all", label: "Tout", icon: <Grid3X3 className="h-4 w-4" /> },
    { key: "movie", label: "Films", icon: <Film className="h-4 w-4" /> },
    { key: "series", label: "Séries", icon: <Tv className="h-4 w-4" /> },
    { key: "anime", label: "Anime", icon: <Sparkles className="h-4 w-4" /> },
    { key: "manga", label: "Manga", icon: <BookOpen className="h-4 w-4" /> },
  ];

  const relevantCategories = selectedType === "all"
    ? categories.filter((c) => c.type === "all")
    : categories.filter((c) => c.type === "all" || c.type === selectedType);

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-12 py-6 page-content">
      {/* Type Filter */}
      <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-2 mb-4">
        {typeButtons.map((btn) => (
          <Button
            key={btn.key}
            variant={selectedType === btn.key ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory(null) || setSelectedType(btn.key)}
            className={
              selectedType === btn.key
                ? "bg-red-600 hover:bg-red-700 text-white border-red-600 flex-shrink-0"
                : "border-white/20 text-white/70 hover:text-white hover:bg-white/5 flex-shrink-0"
            }
          >
            {btn.icon}
            <span className="ml-1.5">{btn.label}</span>
          </Button>
        ))}
      </div>

      {/* Category Filter */}
      {relevantCategories.length > 0 && (
        <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-3 mb-6">
          <Button
            variant={!selectedCategory ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory(null)}
            className={
              !selectedCategory
                ? "bg-white/10 hover:bg-white/15 text-white border-white/20 flex-shrink-0"
                : "border-white/10 text-white/50 hover:text-white/80 hover:bg-white/5 flex-shrink-0"
            }
          >
            Toutes catégories
          </Button>
          {relevantCategories.map((cat) => (
            <Button
              key={cat.slug}
              variant={selectedCategory === cat.slug ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(cat.slug)}
              className={
                selectedCategory === cat.slug
                  ? "bg-white/10 hover:bg-white/15 text-white border-white/20 flex-shrink-0"
                  : "border-white/10 text-white/50 hover:text-white/80 hover:bg-white/5 flex-shrink-0"
              }
            >
              {cat.name}
              <span className="ml-1.5 text-xs opacity-50">{cat.contentCount}</span>
            </Button>
          ))}
        </div>
      )}

      {/* Ad Banner */}
      <AdBanner slot="browse-top" className="mb-6" />

      {/* Results Count */}
      <p className="text-sm text-muted-foreground mb-4">
        {browseTotal} résultat{browseTotal !== 1 ? "s" : ""}
        {selectedType !== "all" && (
          <span> — {TYPE_CONFIG[selectedType]?.label}</span>
        )}
      </p>

      {/* Content Grid */}
      {loading ? (
        <ContentSkeleton count={12} />
      ) : browseContent.length === 0 ? (
        <div className="text-center py-20">
          <Search className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground">Aucun résultat trouvé</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {browseContent.map((item) => (
            <ContentCard
              key={item.id}
              item={item}
              onClick={() => fetchContentDetail(item.id)}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8">
          <Button
            variant="outline"
            size="sm"
            disabled={browsePage <= 1}
            onClick={() => setBrowsePage(browsePage - 1)}
            className="border-white/20 text-white/70 hover:text-white"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Précédent
          </Button>
          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
              let page: number;
              if (totalPages <= 7) {
                page = i + 1;
              } else if (browsePage <= 4) {
                page = i + 1;
              } else if (browsePage >= totalPages - 3) {
                page = totalPages - 6 + i;
              } else {
                page = browsePage - 3 + i;
              }
              return (
                <Button
                  key={page}
                  variant={browsePage === page ? "default" : "outline"}
                  size="sm"
                  onClick={() => setBrowsePage(page)}
                  className={
                    browsePage === page
                      ? "bg-red-600 hover:bg-red-700 text-white border-red-600 w-9"
                      : "border-white/20 text-white/70 hover:text-white w-9"
                  }
                >
                  {page}
                </Button>
              );
            })}
          </div>
          <Button
            variant="outline"
            size="sm"
            disabled={browsePage >= totalPages}
            onClick={() => setBrowsePage(browsePage + 1)}
            className="border-white/20 text-white/70 hover:text-white"
          >
            Suivant
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      )}
    </div>
  );
}

// ==================== SEARCH OVERLAY ====================

function SearchOverlay({ onClose }: { onClose: () => void }) {
  const { searchQuery, setSearchQuery, searchResults, setSearchResults, setContentDetail, setView, setShowSearch, setCurrentEmbed } = useAppStore();
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchQuery.length < 2) {
        setSearchResults([]);
        return;
      }
      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`);
        const data = await res.json();
        setSearchResults(data.data || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, setSearchResults]);

  const handleSelect = async (id: string) => {
    setShowSearch(false);
    setSearchQuery("");
    setSearchResults([]);
    setCurrentEmbed(null);
    try {
      const res = await fetch(`/api/content/${id}`);
      const data = await res.json();
      setContentDetail(data);
      setView("detail");
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-background/95 backdrop-blur-md"
    >
      <div className="max-w-3xl mx-auto pt-20 px-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            ref={inputRef}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher un film, série, anime, manga..."
            className="h-14 pl-12 pr-12 text-lg bg-secondary border-0 rounded-xl focus-visible:ring-1 focus-visible:ring-red-500/50"
            onKeyDown={(e) => {
              if (e.key === "Escape") onClose();
            }}
          />
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Results */}
        <div className="mt-4 max-h-[60vh] overflow-y-auto">
          {loading && searchQuery.length >= 2 ? (
            <div className="space-y-3 py-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex gap-3">
                  <Skeleton className="w-12 h-18 rounded" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-2/3" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : searchResults.length > 0 ? (
            <div className="space-y-1">
              {searchResults.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleSelect(item.id)}
                  className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-secondary/80 transition-colors text-left"
                >
                  <div className="w-12 h-18 rounded overflow-hidden flex-shrink-0 bg-muted">
                    {item.posterUrl ? (
                      <img src={item.posterUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Film className="h-5 w-5 text-muted-foreground/30" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{item.titleFr || item.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`text-xs ${TYPE_CONFIG[item.type]?.color || ""}`}>
                        {getTypeLabel(item.type)}
                      </span>
                      {item.year && <span className="text-xs text-muted-foreground">{item.year}</span>}
                      {item.rating > 0 && (
                        <span className="text-xs text-muted-foreground flex items-center gap-0.5">
                          <Star className="h-3 w-3 text-amber-400 fill-amber-400" />
                          {item.rating.toFixed(1)}
                        </span>
                      )}
                    </div>
                  </div>
                  <Play className="h-5 w-5 text-muted-foreground/40 flex-shrink-0" />
                </button>
              ))}
            </div>
          ) : searchQuery.length >= 2 ? (
            <div className="text-center py-12">
              <Search className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-muted-foreground text-sm">Aucun résultat pour &quot;{searchQuery}&quot;</p>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-sm">Tapez au moins 2 caractères pour rechercher</p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ==================== DONATION MODAL ====================

function DonationSection() {
  return (
    <section className="max-w-4xl mx-auto px-4 md:px-12 py-12">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-red-950/40 via-card to-card border border-red-900/20 p-6 md:p-10">
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-red-600/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-amber-600/5 rounded-full blur-3xl" />

        <div className="relative z-10 text-center space-y-4">
          <div className="inline-flex items-center gap-2 bg-red-600/10 rounded-full px-4 py-1.5">
            <Heart className="h-4 w-4 text-red-400" />
            <span className="text-sm text-red-400 font-medium">Soutenir le projet</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-bold">
            Vous aimez <span className="text-red-400">StreamVibe</span> ?
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto leading-relaxed">
            StreamVibe est un service gratuit et sans publicité intrusive. Si vous appréciez notre plateforme,
            un petit don nous aide à couvrir les frais d&apos;hébergement et à améliorer le service.
          </p>
          <div className="flex flex-wrap gap-3 justify-center pt-2">
            <Button size="lg" className="bg-red-600 hover:bg-red-700 text-white font-semibold px-8 shadow-lg shadow-red-900/20">
              <Coffee className="h-5 w-5 mr-2" />
              Faire un don
            </Button>
            <Button size="lg" variant="outline" className="border-white/10 text-white/70 hover:text-white hover:bg-white/5">
              En savoir plus
            </Button>
          </div>
          <p className="text-xs text-muted-foreground/50 pt-2">
            Chaque don, même petit, fait une grande différence ❤️
          </p>
        </div>
      </div>
    </section>
  );
}

// ==================== MAIN PAGE ====================

export default function HomePage() {
  const {
    currentView, showSearch, featured, trendingMovies, trendingSeries,
    trendingAnime, trendingManga,
    setFeatured, setTrendingMovies, setTrendingSeries, setTrendingAnime, setTrendingManga,
    setCategories, setView, setShowSearch, setContentDetail, setCurrentEmbed,
  } = useAppStore();

  const [homeLoading, setHomeLoading] = useState(true);
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Fetch initial data
  useEffect(() => {
    async function fetchData() {
      try {
        const [featuredRes, moviesRes, seriesRes, animeRes, mangaRes, catsRes] = await Promise.all([
          fetch("/api/featured"),
          fetch("/api/content?type=movie&sort=rating&limit=10"),
          fetch("/api/content?type=series&sort=rating&limit=10"),
          fetch("/api/content?type=anime&sort=rating&limit=10"),
          fetch("/api/content?type=manga&sort=rating&limit=10"),
          fetch("/api/categories"),
        ]);

        const [featuredData, moviesData, seriesData, animeData, mangaData, catsData] = await Promise.all([
          featuredRes.json(),
          moviesRes.json(),
          seriesRes.json(),
          animeRes.json(),
          mangaRes.json(),
          catsRes.json(),
        ]);

        setFeatured(featuredData.data || []);
        setTrendingMovies(moviesData.data || []);
        setTrendingSeries(seriesData.data || []);
        setTrendingAnime(animeData.data || []);
        setTrendingManga(mangaData.data || []);
        setCategories(catsData.data || []);
      } catch (e) {
        console.error(e);
      } finally {
        setHomeLoading(false);
      }
    }
    fetchData();
  }, [setFeatured, setTrendingMovies, setTrendingSeries, setTrendingAnime, setTrendingManga, setCategories]);

  // Scroll to top handler
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 500);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const fetchContentDetail = async (id: string) => {
    setCurrentEmbed(null);
    try {
      const res = await fetch(`/api/content/${id}`);
      const data = await res.json();
      setContentDetail(data);
      setView("detail");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e) {
      console.error(e);
    }
  };

  const handleBackHome = () => {
    setView("home");
    setContentDetail(null);
    setCurrentEmbed(null);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-background/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 md:px-12 h-16 flex items-center justify-between">
          {/* Logo */}
          <button onClick={handleBackHome} className="flex items-center gap-2 group">
            <div className="bg-red-600 rounded-lg p-1.5 group-hover:bg-red-500 transition-colors">
              <Play className="h-4 w-4 text-white fill-white" />
            </div>
            <span className="text-xl font-extrabold tracking-tight">
              Stream<span className="text-red-500">Vibe</span>
            </span>
          </button>

          {/* Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {(["all", "movie", "series", "anime", "manga"] as const).map((type) => (
              <Button
                key={type}
                variant="ghost"
                size="sm"
                onClick={() => {
                  setView("browse");
                  useAppStore.getState().setSelectedType(type);
                }}
                className={`text-sm ${currentView === "browse" && useAppStore.getState().selectedType === type
                  ? "text-white font-semibold"
                  : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {type === "all" ? <Home className="h-4 w-4 mr-1.5" /> : TYPE_CONFIG[type]?.icon}
                {type === "all" ? "Accueil" : TYPE_CONFIG[type]?.label}
              </Button>
            ))}
          </nav>

          {/* Search + Actions */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowSearch(true)}
              className="text-muted-foreground hover:text-foreground"
            >
              <Search className="h-5 w-5" />
            </Button>
            <Button
              size="sm"
              className="bg-red-600 hover:bg-red-700 text-white font-semibold hidden sm:flex"
              onClick={() => document.getElementById("donation-section")?.scrollIntoView({ behavior: "smooth" })}
            >
              <Heart className="h-3.5 w-3.5 mr-1.5" />
              Soutenir
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 pt-16">
        {currentView === "home" && (
          <div className="page-content">
            {homeLoading ? (
              <div className="space-y-8 py-8">
                <Skeleton className="h-[50vh] md:h-[70vh] w-full" />
                <div className="max-w-7xl mx-auto px-4 md:px-12 space-y-8">
                  <ContentSkeleton count={6} />
                  <ContentSkeleton count={6} />
                  <ContentSkeleton count={6} />
                </div>
              </div>
            ) : (
              <>
                {/* Hero */}
                <HeroSection items={featured} onContentClick={fetchContentDetail} />

                <div className="max-w-7xl mx-auto px-4 md:px-12 py-8 space-y-10">
                  {/* Ad Banner */}
                  <AdBanner slot="home-top" />

                  {/* Trending Movies */}
                  <ContentRow
                    title="Films Tendances"
                    items={trendingMovies}
                    onContentClick={fetchContentDetail}
                    icon={<Film className="h-5 w-5 text-red-400" />}
                    viewAllType="movie"
                  />

                  {/* Trending Series */}
                  <ContentRow
                    title="Séries Populaires"
                    items={trendingSeries}
                    onContentClick={fetchContentDetail}
                    icon={<Tv className="h-5 w-5 text-emerald-400" />}
                    viewAllType="series"
                  />

                  {/* Mid-page ad */}
                  <AdBanner slot="home-mid" />

                  {/* Trending Anime */}
                  <ContentRow
                    title="Anime à la Une"
                    items={trendingAnime}
                    onContentClick={fetchContentDetail}
                    icon={<Sparkles className="h-5 w-5 text-purple-400" />}
                    viewAllType="anime"
                  />

                  {/* Manga */}
                  <ContentRow
                    title="Manga Populaires"
                    items={trendingManga}
                    onContentClick={fetchContentDetail}
                    icon={<BookOpen className="h-5 w-5 text-amber-400" />}
                    viewAllType="manga"
                  />

                  {/* Donation Section */}
                  <div id="donation-section">
                    <DonationSection />
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {currentView === "browse" && <BrowseView />}

        {currentView === "detail" && (
          <ContentDetailView onBack={handleBackHome} />
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-white/5 bg-background/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 md:px-12 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-3">
                <div className="bg-red-600 rounded-lg p-1">
                  <Play className="h-3 w-3 text-white fill-white" />
                </div>
                <span className="text-lg font-extrabold">
                  Stream<span className="text-red-500">Vibe</span>
                </span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Votre plateforme de streaming gratuite pour films, séries, anime et manga.
                Service de qualité sans publicité intrusive.
              </p>
            </div>
            <div>
              <h4 className="text-sm font-semibold mb-3">Navigation</h4>
              <ul className="space-y-2">
                {(["movie", "series", "anime", "manga"] as const).map((type) => (
                  <li key={type}>
                    <button
                      onClick={() => { setView("browse"); useAppStore.getState().setSelectedType(type); }}
                      className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {TYPE_CONFIG[type]?.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold mb-3">Catégories</h4>
              <ul className="space-y-2">
                {["Action", "Comédie", "Drame", "Science-Fiction", "Horreur", "Animation"].map((name) => (
                  <li key={name}>
                    <span className="text-xs text-muted-foreground">{name}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold mb-3">Informations</h4>
              <ul className="space-y-2">
                <li><span className="text-xs text-muted-foreground">Conditions d&apos;utilisation</span></li>
                <li><span className="text-xs text-muted-foreground">Politique de confidentialité</span></li>
                <li><span className="text-xs text-muted-foreground">Contact</span></li>
                <li><span className="text-xs text-muted-foreground">DMCA</span></li>
              </ul>
            </div>
          </div>
          <Separator className="my-6 bg-white/5" />
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground/60">
              © 2024 StreamVibe. Tous droits réservés. Ce site ne stocke aucun fichier sur ses serveurs.
            </p>
            <div className="flex items-center gap-1">
              <Heart className="h-3 w-3 text-red-500" />
              <span className="text-xs text-muted-foreground/60">Fait avec passion</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Search Overlay */}
      <AnimatePresence>
        {showSearch && <SearchOverlay onClose={() => { setShowSearch(false); }} />}
      </AnimatePresence>

      {/* Scroll to Top */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="fixed bottom-20 right-6 z-30 bg-red-600 hover:bg-red-700 text-white rounded-full p-3 shadow-lg shadow-red-900/30 transition-colors"
          >
            <ArrowUp className="h-5 w-5" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}