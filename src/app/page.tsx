'use client';

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Heart, Play, Star, ChevronLeft, ChevronRight, Film, Tv,
  Sparkles, RotateCcw, X, Menu, Home, TrendingUp, BookmarkPlus,
  Clock, Calendar, Layers, Info, AlertTriangle, ArrowLeft, Filter, Grid3X3
} from 'lucide-react';
import { useAppStore, type ContentItem, type ContentDetail, type EmbedSource, type EmbedGroup } from '@/store/app-store';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { toast } from 'sonner';

// ==================== CONSTANTS ====================
const ALL_GENRES = [
  'Action', 'Aventure', 'Animation', 'Comédie', 'Crime', 'Documentaire',
  'Drame', 'Familial', 'Fantastique', 'Horreur', 'Musical', 'Mystère',
  'Romance', 'Sci-Fi', 'Thriller'
];
const YEARS = Array.from({ length: 20 }, (_, i) => 2025 - i);
const TYPE_LABELS: Record<string, string> = { all: 'Tous', movie: 'Films', series: 'Séries', anime: 'Anime', manga: 'Manga' };
const TYPE_ICONS: Record<string, React.ReactNode> = {
  all: <Grid3X3 className="w-4 h-4" />,
  movie: <Film className="w-4 h-4" />,
  series: <Tv className="w-4 h-4" />,
  anime: <Sparkles className="w-4 h-4" />,
  manga: <Layers className="w-4 h-4" />,
};

// ==================== HOOKS ====================
function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

function useInView(ref: React.RefObject<HTMLElement | null>) {
  const [inView, setInView] = useState(false);
  useEffect(() => {
    if (!ref.current) return;
    const el = ref.current;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setInView(true); obs.unobserve(el); } },
      { rootMargin: '400px' }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [ref]);
  return inView;
}

// ==================== COMPONENTS ====================

// --- Content Card ---
function ContentCard({ item, onFavorite }: { item: ContentItem; onFavorite?: (e: React.MouseEvent) => void }) {
  const store = useAppStore();
  const isFav = store.isFavorite(item.id);
  const typeColor = item.type === 'movie' ? 'badge-movie' : item.type === 'series' ? 'badge-series' : item.type === 'anime' ? 'badge-anime' : 'badge-manga';
  const typeLabel = item.type === 'movie' ? 'Film' : item.type === 'series' ? 'Série' : item.type === 'anime' ? 'Anime' : 'Manga';

  return (
    <motion.div
      className="content-card relative group cursor-pointer rounded-lg overflow-hidden bg-card"
      whileHover={{ y: -4 }}
      onClick={() => {
        store.setSelectedContentId(item.id);
        store.setView('detail');
        window.scrollTo(0, 0);
      }}
    >
      {/* Poster */}
      <div className="relative aspect-[2/3] overflow-hidden">
        <img
          src={item.posterUrl}
          alt={item.titleFr || item.title}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
        {/* Play icon */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <div className="w-12 h-12 rounded-full bg-red-600/90 flex items-center justify-center backdrop-blur-sm">
            <Play className="w-5 h-5 text-white ml-0.5" fill="white" />
          </div>
        </div>
        {/* Type badge */}
        <div className="absolute top-2 left-2">
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${typeColor}`}>
            {typeLabel}
          </span>
        </div>
        {/* Quality badge */}
        <div className="absolute top-2 right-2">
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-black/70 text-yellow-400 border border-yellow-400/30">
            1080p
          </span>
        </div>
        {/* Favorite button */}
        <button
          onClick={(e) => { e.stopPropagation(); store.toggleFavorite(item.id); toast(isFav ? 'Retiré des favoris' : 'Ajouté aux favoris'); }}
          className="absolute top-2 right-2 mr-8 opacity-0 group-hover:opacity-100 transition-all duration-200"
        >
          <Heart className={`w-5 h-5 drop-shadow-lg ${isFav ? 'fill-red-500 text-red-500' : 'text-white/90'}`} />
        </button>
        {/* Rating */}
        <div className="absolute bottom-2 left-2 flex items-center gap-1">
          <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
          <span className="text-xs font-bold text-white">{item.rating > 0 ? item.rating.toFixed(1) : 'N/A'}</span>
        </div>
        {/* Year */}
        {item.year && (
          <div className="absolute bottom-2 right-2">
            <span className="text-[10px] text-white/70">{item.year}</span>
          </div>
        )}
      </div>
      {/* Title */}
      <div className="p-2.5">
        <h3 className="text-sm font-medium truncate">{item.titleFr || item.title}</h3>
        {item.genres && (
          <p className="text-[11px] text-muted-foreground truncate mt-0.5">{item.genres.split(',').slice(0, 2).join(' · ')}</p>
        )}
      </div>
    </motion.div>
  );
}

// --- Skeleton Card ---
function SkeletonCard() {
  return (
    <div className="rounded-lg overflow-hidden">
      <div className="aspect-[2/3] shimmer rounded-lg" />
      <div className="p-2.5 space-y-1.5">
        <div className="h-3.5 shimmer rounded w-3/4" />
        <div className="h-3 shimmer rounded w-1/2" />
      </div>
    </div>
  );
}

// --- Content Row ---
function ContentRow({ title, items, icon, viewAll, onViewAll }: { title: string; items: ContentItem[]; icon?: React.ReactNode; viewAll?: boolean; onViewAll?: () => void }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 10);
  };

  const scroll = (dir: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const amount = scrollRef.current.clientWidth * 0.75;
    scrollRef.current.scrollBy({ left: dir === 'left' ? -amount : amount, behavior: 'smooth' });
  };

  if (items.length === 0) return null;

  return (
    <section className="mb-8">
      <div className="flex items-center justify-between mb-3 px-4 md:px-8">
        <h2 className="section-title text-lg font-bold flex items-center gap-2">
          {icon}
          {title}
        </h2>
        {viewAll && onViewAll && (
          <button onClick={onViewAll} className="text-sm text-red-400 hover:text-red-300 transition-colors flex items-center gap-1">
            Voir tout <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>
      <div className="relative group/row">
        {canScrollLeft && (
          <button
            onClick={() => scroll('left')}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-20 bg-black/70 hover:bg-black/90 rounded-r-lg flex items-center justify-center opacity-0 group-hover/row:opacity-100 transition-opacity"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        )}
        <div
          ref={scrollRef}
          onScroll={checkScroll}
          className="flex gap-3 overflow-x-auto hide-scrollbar px-4 md:px-8 pb-2"
        >
          {items.map((item) => (
            <div key={item.id} className="flex-shrink-0 w-[140px] sm:w-[155px] md:w-[170px]">
              <ContentCard item={item} />
            </div>
          ))}
        </div>
        {canScrollRight && (
          <button
            onClick={() => scroll('right')}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-20 bg-black/70 hover:bg-black/90 rounded-l-lg flex items-center justify-center opacity-0 group-hover/row:opacity-100 transition-opacity"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        )}
      </div>
    </section>
  );
}

// --- Ad Banner ---
function AdBanner() {
  return (
    <div className="ad-banner mx-4 md:mx-8 p-3 flex items-center justify-center h-16 mb-6">
      <span className="text-[10px] text-muted-foreground/60 uppercase tracking-widest">Pub</span>
    </div>
  );
}

// ==================== VIEWS ====================

// --- Home View ---
function HomeView() {
  const store = useAppStore();
  const [heroIndex, setHeroIndex] = useState(0);
  const [heroLoading, setHeroLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [featRes, latestRes, moviesRes, seriesRes, animeRes, mangaRes] = await Promise.all([
          fetch('/api/featured').then(r => r.json()),
          fetch('/api/content?sort=created&limit=10').then(r => r.json()),
          fetch('/api/content?type=movie&sort=rating&limit=15').then(r => r.json()),
          fetch('/api/content?type=series&sort=rating&limit=15').then(r => r.json()),
          fetch('/api/content?type=anime&sort=rating&limit=15').then(r => r.json()),
          fetch('/api/content?type=manga&sort=rating&limit=15').then(r => r.json()),
        ]);
        store.setFeatured(featRes.data || []);
        store.setLatestContent(latestRes.data || []);
        store.setTrendingMovies(moviesRes.data || []);
        store.setTrendingSeries(seriesRes.data || []);
        store.setTrendingAnime(animeRes.data || []);
        store.setTrendingManga(mangaRes.data || []);
      } catch (e) {
        console.error('Failed to load home data', e);
      } finally {
        setHeroLoading(false);
      }
    };
    load();
  }, [store]);

  // Auto-rotate hero
  useEffect(() => {
    if (store.featured.length === 0) return;
    const timer = setInterval(() => {
      setHeroIndex(prev => (prev + 1) % store.featured.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [store.featured.length]);

  const heroItem = store.featured[heroIndex];

  return (
    <div className="page-content">
      {/* Hero */}
      <div className="relative h-[60vh] min-h-[400px] max-h-[600px] overflow-hidden hero-vignette">
        {heroLoading ? (
          <div className="w-full h-full shimmer" />
        ) : heroItem ? (
          <>
            <AnimatePresence mode="wait">
              <motion.div
                key={heroItem.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.8 }}
                className="absolute inset-0"
              >
                <img
                  src={heroItem.backdropUrl}
                  alt={heroItem.titleFr || heroItem.title}
                  className="w-full h-full object-cover"
                />
              </motion.div>
            </AnimatePresence>
            <div className="hero-gradient absolute inset-0 z-[2]" />
            <div className="hero-gradient-bottom absolute inset-0 z-[2]" />
            <div className="relative z-10 h-full flex items-center px-4 md:px-8">
              <div className="max-w-xl">
                <div className="flex items-center gap-2 mb-3">
                  <Badge className="bg-red-600 hover:bg-red-700 text-white text-xs font-semibold px-2.5 py-0.5">
                    <TrendingUp className="w-3 h-3 mr-1" /> Tendance
                  </Badge>
                  {heroItem.year && <span className="text-sm text-white/60">{heroItem.year}</span>}
                </div>
                <h1 className="text-glow text-3xl md:text-5xl font-extrabold mb-3 leading-tight">
                  {heroItem.titleFr || heroItem.title}
                </h1>
                <p className="text-sm md:text-base text-white/70 mb-1 line-clamp-2">
                  {heroItem.overviewFr || heroItem.overview}
                </p>
                <div className="flex items-center gap-3 mb-5">
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-bold text-yellow-400">{heroItem.rating?.toFixed(1) || 'N/A'}</span>
                  </div>
                  {heroItem.genres && (
                    <span className="text-sm text-white/50">{heroItem.genres.split(',').slice(0, 3).join(' · ')}</span>
                  )}
                  {heroItem.runtime && <span className="text-sm text-white/50">{heroItem.runtime} min</span>}
                </div>
                <div className="flex gap-3">
                  <Button
                    onClick={() => { store.setSelectedContentId(heroItem.id); store.setView('detail'); window.scrollTo(0, 0); }}
                    className="btn-glow bg-red-600 hover:bg-red-700 text-white font-bold px-6 py-5"
                  >
                    <Play className="w-4 h-4 mr-2" fill="white" /> Regarder
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => store.toggleFavorite(heroItem.id)}
                    className="bg-white/10 hover:bg-white/20 text-white border border-white/20 px-4 py-5"
                  >
                    <Heart className={`w-4 h-4 mr-2 ${store.isFavorite(heroItem.id) ? 'fill-red-500 text-red-500' : ''}`} />
                    Favoris
                  </Button>
                </div>
              </div>
            </div>
            {/* Slide indicators */}
            {store.featured.length > 1 && (
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 flex gap-2">
                {store.featured.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setHeroIndex(i)}
                    className={`h-1 rounded-full transition-all duration-300 ${i === heroIndex ? 'w-8 bg-red-500' : 'w-2 bg-white/30 hover:bg-white/50'}`}
                  />
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <p>Aucun contenu mis en avant</p>
          </div>
        )}
      </div>

      {/* Latest */}
      <div className="mt-8">
        <ContentRow
          title="Derniers Ajouts"
          items={store.latestContent}
          icon={<RotateCcw className="w-5 h-5 text-red-400" />}
        />
      </div>

      <AdBanner />

      {/* Movies */}
      <ContentRow
        title="Films Tendances"
        items={store.trendingMovies}
        icon={<Film className="w-5 h-5 text-red-400" />}
        viewAll
        onViewAll={() => { store.setSelectedType('movie'); store.setView('browse'); window.scrollTo(0, 0); }}
      />

      {/* Series */}
      <ContentRow
        title="Séries Populaires"
        items={store.trendingSeries}
        icon={<Tv className="w-5 h-5 text-emerald-400" />}
        viewAll
        onViewAll={() => { store.setSelectedType('series'); store.setView('browse'); window.scrollTo(0, 0); }}
      />

      <AdBanner />

      {/* Anime */}
      <ContentRow
        title="Anime en Vedette"
        items={store.trendingAnime}
        icon={<Sparkles className="w-5 h-5 text-purple-400" />}
        viewAll
        onViewAll={() => { store.setSelectedType('anime'); store.setView('browse'); window.scrollTo(0, 0); }}
      />

      {/* Manga */}
      <ContentRow
        title="Manga Populaires"
        items={store.trendingManga}
        icon={<Layers className="w-5 h-5 text-amber-400" />}
        viewAll
        onViewAll={() => { store.setSelectedType('manga'); store.setView('browse'); window.scrollTo(0, 0); }}
      />
    </div>
  );
}

// --- Browse View ---
function BrowseView() {
  const store = useAppStore();
  const sentinelRef = useRef<HTMLDivElement>(null);
  const inView = useInView(sentinelRef);
  const [loading, setLoading] = useState(true);
  const [initialLoad, setInitialLoad] = useState(true);

  const fetchContent = useCallback(async (page: number, append: boolean) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20', sort: store.selectedSort });
      if (store.selectedType !== 'all') params.set('type', store.selectedType);
      if (store.selectedGenre) params.set('genre', store.selectedGenre);
      if (store.selectedYearFrom) params.set('yearFrom', String(store.selectedYearFrom));
      if (store.selectedYearTo) params.set('yearTo', String(store.selectedYearTo));

      const res = await fetch(`/api/content?${params}`);
      const json = await res.json();
      store.setBrowseContent(append ? [...store.browseContent, ...json.data] : json.data);
      store.setBrowseTotal(json.total);
      store.setBrowsePage(page);
    } catch (e) {
      console.error('Browse fetch error', e);
    } finally {
      setLoading(false);
      setInitialLoad(false);
    }
  }, [store.selectedType, store.selectedSort, store.selectedGenre, store.selectedYearFrom, store.selectedYearTo]);

  // Initial load
  useEffect(() => {
    fetchContent(1, false);
  }, [store.selectedType, store.selectedSort, store.selectedGenre, store.selectedYearFrom, store.selectedYearTo]);

  // Infinite scroll
  useEffect(() => {
    if (inView && !loading && store.browseContent.length < store.browseTotal) {
      fetchContent(store.browsePage + 1, true);
    }
  }, [inView, loading, store.browseContent.length, store.browseTotal, store.browsePage]);

  // Reset page on filter change
  useEffect(() => {
    setInitialLoad(true);
  }, [store.selectedType, store.selectedSort, store.selectedGenre, store.selectedYearFrom, store.selectedYearTo]);

  const allItems = initialLoad ? [] : store.browseContent;

  return (
    <div className="page-content px-4 md:px-8 pt-6">
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <Filter className="w-6 h-6 text-red-400" /> Explorer
      </h1>

      {/* Type tabs */}
      <div className="flex gap-2 mb-4 overflow-x-auto hide-scrollbar pb-1">
        {(Object.entries(TYPE_LABELS) as [string, string][]).map(([type, label]) => (
          <button
            key={type}
            onClick={() => store.setSelectedType(type as any)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
              store.selectedType === type
                ? 'bg-red-600 text-white shadow-lg shadow-red-600/20'
                : 'bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/80'
            }`}
          >
            {TYPE_ICONS[type]} {label}
          </button>
        ))}
      </div>

      {/* Filters row */}
      <div className="flex flex-wrap gap-3 mb-4 items-center">
        {/* Sort */}
        <Select value={store.selectedSort} onValueChange={store.setSelectedSort}>
          <SelectTrigger className="w-[160px] h-9 text-sm bg-secondary border-none">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="rating">Meilleures notes</SelectItem>
            <SelectItem value="created">Plus récents</SelectItem>
            <SelectItem value="title_asc">Titre A-Z</SelectItem>
            <SelectItem value="title_desc">Titre Z-A</SelectItem>
          </SelectContent>
        </Select>

        {/* Year From */}
        <Select
          value={store.selectedYearFrom?.toString() || '_'}
          onValueChange={(v) => store.setSelectedYearFrom(v === '_' ? null : parseInt(v))}
        >
          <SelectTrigger className="w-[120px] h-9 text-sm bg-secondary border-none">
            <SelectValue placeholder="De..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="_">De...</SelectItem>
            {YEARS.map(y => <SelectItem key={y} value={y.toString()}>{y}</SelectItem>)}
          </SelectContent>
        </Select>

        {/* Year To */}
        <Select
          value={store.selectedYearTo?.toString() || '_'}
          onValueChange={(v) => store.setSelectedYearTo(v === '_' ? null : parseInt(v))}
        >
          <SelectTrigger className="w-[120px] h-9 text-sm bg-secondary border-none">
            <SelectValue placeholder="Jusqu'à..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="_">Jusqu'à...</SelectItem>
            {YEARS.map(y => <SelectItem key={y} value={y.toString()}>{y}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Genre pills */}
      <div className="flex gap-2 mb-6 overflow-x-auto hide-scrollbar pb-1">
        <button
          onClick={() => store.setSelectedGenre(null)}
          className={`genre-pill px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap border transition-all ${
            !store.selectedGenre
              ? 'active border-red-500/50 bg-red-500/10 text-red-400'
              : 'border-border text-muted-foreground hover:text-foreground hover:border-foreground/20'
          }`}
        >
          Tous les genres
        </button>
        {ALL_GENRES.map(g => (
          <button
            key={g}
            onClick={() => store.setSelectedGenre(g)}
            className={`genre-pill px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap border transition-all ${
              store.selectedGenre === g
                ? 'active border-red-500/50 bg-red-500/10 text-red-400'
                : 'border-border text-muted-foreground hover:text-foreground hover:border-foreground/20'
            }`}
          >
            {g}
          </button>
        ))}
      </div>

      {/* Count */}
      {!initialLoad && (
        <p className="text-sm text-muted-foreground mb-4">
          {store.browseTotal} résultat{store.browseTotal !== 1 ? 's' : ''}
        </p>
      )}

      {/* Grid */}
      {initialLoad ? (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-3 md:gap-4">
          {Array.from({ length: 14 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : allItems.length > 0 ? (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-3 md:gap-4">
          {allItems.map(item => <ContentCard key={item.id} item={item} />)}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <Film className="w-16 h-16 mb-4 opacity-20 empty-state-icon" />
          <p className="text-lg">Aucun résultat</p>
          <p className="text-sm mt-1">Essayez de modifier vos filtres</p>
        </div>
      )}

      {/* Loading more */}
      {loading && !initialLoad && (
        <div className="flex justify-center py-8">
          <div className="flex gap-1">
            {[0, 1, 2].map(i => (
              <div key={i} className="w-2.5 h-2.5 bg-red-500 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
            ))}
          </div>
        </div>
      )}

      {/* Infinite scroll sentinel */}
      <div ref={sentinelRef} className="h-1" />
    </div>
  );
}

// --- Content Detail View ---
function ContentDetailView() {
  const store = useAppStore();
  const [detail, setDetail] = useState<ContentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedEmbed, setSelectedEmbed] = useState<EmbedSource | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<EmbedGroup | null>(null);
  const [playerLoading, setPlayerLoading] = useState(true);
  const [iframeKey, setIframeKey] = useState(0);

  const fetchDetail = useCallback(async () => {
    if (!store.selectedContentId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/content/${store.selectedContentId}`);
      const json = await res.json();
      setDetail(json);
      // Auto-select first embed
      if (json.embedGroups?.length > 0 && json.embedGroups[0].embeds?.length > 0) {
        setSelectedGroup(json.embedGroups[0]);
        setSelectedEmbed(json.embedGroups[0].embeds[0]);
      }
    } catch (e) {
      console.error('Detail fetch error', e);
    } finally {
      setLoading(false);
    }
  }, [store.selectedContentId]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  useEffect(() => {
    setPlayerLoading(true);
    setIframeKey(prev => prev + 1);
  }, [selectedEmbed?.url]);

  if (loading) {
    return (
      <div className="page-content px-4 md:px-8 pt-6">
        <Skeleton className="h-[40vh] rounded-xl mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-96 rounded-xl" />
          <div className="space-y-3">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-20 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="page-content flex flex-col items-center justify-center py-20 text-muted-foreground">
        <AlertTriangle className="w-16 h-16 mb-4 opacity-20" />
        <p className="text-lg">Contenu introuvable</p>
        <Button variant="outline" onClick={() => store.setView('home')} className="mt-4">
          <ArrowLeft className="w-4 h-4 mr-2" /> Retour
        </Button>
      </div>
    );
  }

  const isSeries = detail.type === 'series' || detail.type === 'anime';
  const isManga = detail.type === 'manga';
  const typeColor = detail.type === 'movie' ? 'badge-movie' : detail.type === 'series' ? 'badge-series' : detail.type === 'anime' ? 'badge-anime' : 'badge-manga';
  const typeLabel = detail.type === 'movie' ? 'Film' : detail.type === 'series' ? 'Série' : detail.type === 'anime' ? 'Anime' : 'Manga';

  return (
    <div className="page-content">
      {/* Back button */}
      <div className="px-4 md:px-8 pt-4">
        <Button
          variant="ghost"
          onClick={() => store.setView('home')}
          className="text-muted-foreground hover:text-foreground -ml-2"
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Retour
        </Button>
      </div>

      {/* Player */}
      {!isManga && selectedEmbed && (
        <div className="px-4 md:px-8 mb-6">
          <div className="player-container">
            {playerLoading && (
              <div className="absolute inset-0 flex items-center justify-center z-10 bg-black/60">
                <div className="flex gap-1">
                  {[0, 1, 2].map(i => (
                    <div key={i} className="w-3 h-3 bg-red-500 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.2}s` }} />
                  ))}
                </div>
              </div>
            )}
            <iframe
              key={iframeKey}
              src={selectedEmbed.url}
              className="absolute inset-0 w-full h-full border-0 rounded-xl"
              allowFullScreen
              allow="autoplay; encrypted-media"
              onLoad={() => setPlayerLoading(false)}
              title={detail.titleFr || detail.title}
            />
          </div>
        </div>
      )}

      {/* Episode selector for series */}
      {isSeries && detail.embedGroups.length > 1 && (
        <div className="px-4 md:px-8 mb-4">
          <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
            <Layers className="w-4 h-4 text-red-400" /> Épisodes
          </h3>
          <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 gap-2 max-h-48 overflow-y-auto pr-2">
            {detail.embedGroups.map((group) => (
              <button
                key={group.label}
                onClick={() => {
                  setSelectedGroup(group);
                  setSelectedEmbed(group.embeds[0]);
                }}
                className={`text-xs font-medium py-2 px-1 rounded-lg text-center transition-all ${
                  selectedGroup?.label === group.label
                    ? 'bg-red-600 text-white shadow-lg shadow-red-600/20'
                    : 'bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/80'
                }`}
              >
                {`E${group.episode || 1}`}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Server buttons */}
      {!isManga && selectedGroup && (
        <div className="px-4 md:px-8 mb-6">
          <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
            <Grid3X3 className="w-4 h-4 text-red-400" />
            Serveurs disponibles
            {selectedGroup.label !== 'Film Complet' && (
              <span className="text-muted-foreground font-normal">— {selectedGroup.label}</span>
            )}
          </h3>
          <div className="flex flex-wrap gap-2">
            {selectedGroup.embeds.map((embed) => (
              <button
                key={embed.id}
                onClick={() => setSelectedEmbed(embed)}
                className="server-btn flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all border"
                style={{
                  borderColor: selectedEmbed?.id === embed.id ? embed.hostConfig?.color : 'transparent',
                  backgroundColor: selectedEmbed?.id === embed.id ? `${embed.hostConfig?.color}15` : 'oklch(0.15 0 0)',
                  boxShadow: selectedEmbed?.id === embed.id ? `0 0 15px ${embed.hostConfig?.color}20` : 'none',
                  color: selectedEmbed?.id === embed.id ? embed.hostConfig?.color : 'oklch(0.7 0 0)',
                }}
              >
                <span
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: embed.hostConfig?.color }}
                />
                <span>{embed.hostConfig?.label || embed.serverName}</span>
                {embed.quality && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-white/60">
                    {embed.quality}
                  </span>
                )}
                <span className="text-[10px] uppercase px-1.5 py-0.5 rounded bg-white/5 text-white/40">
                  {embed.lang}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Content info */}
      <div className="px-4 md:px-8 mb-8">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Poster */}
          <div className="flex-shrink-0 mx-auto md:mx-0">
            <div className="w-[180px] md:w-[200px] rounded-xl overflow-hidden shadow-2xl">
              <img
                src={detail.posterUrl}
                alt={detail.titleFr || detail.title}
                className="w-full aspect-[2/3] object-cover"
              />
            </div>
          </div>

          {/* Info */}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${typeColor}`}>{typeLabel}</span>
              {detail.year && <span className="text-sm text-muted-foreground">{detail.year}</span>}
              {detail.runtime && <span className="text-sm text-muted-foreground">{detail.runtime} min</span>}
              {detail.seasons && <span className="text-sm text-muted-foreground">{detail.seasons} saison{detail.seasons > 1 ? 's' : ''}</span>}
            </div>

            <h1 className="text-2xl md:text-3xl font-extrabold mb-2">{detail.titleFr || detail.title}</h1>
            {detail.titleFr && detail.title !== detail.titleFr && (
              <p className="text-sm text-muted-foreground mb-3 italic">{detail.title}</p>
            )}

            <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center gap-1.5">
                <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                <span className="text-lg font-bold text-yellow-400">{detail.rating > 0 ? detail.rating.toFixed(1) : 'N/A'}</span>
                {detail.voteCount > 0 && <span className="text-xs text-muted-foreground">({detail.voteCount.toLocaleString()})</span>}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  store.toggleFavorite(detail.id);
                  toast(store.isFavorite(detail.id) ? 'Ajouté aux favoris' : 'Retiré des favoris');
                }}
              >
                <Heart className={`w-4 h-4 mr-1.5 ${store.isFavorite(detail.id) ? 'fill-red-500 text-red-500' : ''}`} />
                {store.isFavorite(detail.id) ? 'Favoris' : 'Favoris'}
              </Button>
            </div>

            {detail.genres && (
              <div className="flex flex-wrap gap-1.5 mb-4">
                {detail.genres.split(',').map(g => (
                  <Badge key={g.trim()} variant="secondary" className="text-xs bg-secondary/80">{g.trim()}</Badge>
                ))}
              </div>
            )}

            <p className="text-sm text-muted-foreground leading-relaxed">
              {detail.overviewFr || detail.overview || 'Aucune description disponible.'}
            </p>

            {detail.releaseDate && (
              <p className="text-sm text-muted-foreground mt-3 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                Sortie: {new Date(detail.releaseDate).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            )}
          </div>
        </div>
      </div>

      <AdBanner />

      {/* Related */}
      {detail.related && detail.related.length > 0 && (
        <div className="px-4 md:px-8 mb-8">
          <ContentRow title="Contenu Similaire" items={detail.related} icon={<TrendingUp className="w-5 h-5 text-red-400" />} />
        </div>
      )}
    </div>
  );
}

// --- Favorites View ---
function FavoritesView() {
  const store = useAppStore();
  const [favItems, setFavItems] = useState<ContentItem[]>([]);
  const [fetched, setFetched] = useState(false);

  useEffect(() => {
    store.initFavorites();
  }, []);

  useEffect(() => {
    if (store.favorites.length === 0) {
      const t = setTimeout(() => setFetched(true), 0);
      return () => clearTimeout(t);
    }
    Promise.all(
      store.favorites.map(id => fetch(`/api/content/${id}`).then(r => r.ok ? r.json() : null))
    ).then(results => {
      setFavItems(results.filter(Boolean));
      setFetched(true);
    });
  }, [store.favorites]);

  const loading = !fetched;
  const displayItems = store.favorites.length === 0 ? [] : favItems;

  return (
    <div className="page-content px-4 md:px-8 pt-6">
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <Heart className="w-6 h-6 text-red-400" /> Mes Favoris
        {!loading && (
          <span className="count-badge text-xs font-medium px-2.5 py-0.5 rounded-full">{displayItems.length}</span>
        )}
      </h1>

      {loading ? (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-3 md:gap-4">
          {Array.from({ length: 7 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : displayItems.length > 0 ? (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-3 md:gap-4">
          {displayItems.map(item => <ContentCard key={item.id} item={item} />)}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <Heart className="w-16 h-16 mb-4 opacity-20 empty-state-icon" />
          <p className="text-lg">Aucun favori</p>
          <p className="text-sm mt-1">Cliquez sur le cœur d&apos;un contenu pour l&apos;ajouter</p>
          <Button variant="outline" onClick={() => store.setView('browse')} className="mt-4">
            Explorer le catalogue
          </Button>
        </div>
      )}
    </div>
  );
}

// --- Search Overlay ---
function SearchOverlay() {
  const store = useAppStore();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(false);
  const debouncedQuery = useDebounce(query, 300);
  const inputRef = useRef<HTMLInputElement>(null);
  const hasMinimumChars = debouncedQuery.length >= 2;

  // Focus input on mount
  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 100);
    return () => clearTimeout(t);
  }, []);

  // Fetch search results only when query has 2+ chars
  useEffect(() => {
    if (!hasMinimumChars) return;
    let cancelled = false;
    const t = setTimeout(() => {
      if (cancelled) return;
      setLoading(true);
      fetch(`/api/search?q=${encodeURIComponent(debouncedQuery)}`)
        .then(r => r.json())
        .then(json => { if (!cancelled) setResults(json.data || []); })
        .catch(() => { if (!cancelled) setResults([]); })
        .finally(() => { if (!cancelled) setLoading(false); });
    }, 0);
    return () => { cancelled = true; clearTimeout(t); };
  }, [debouncedQuery, hasMinimumChars]);

  const displayResults = hasMinimumChars ? results : [];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-background/95 backdrop-blur-xl flex flex-col"
    >
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-3">
          <Search className="w-5 h-5 text-muted-foreground" />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Rechercher un film, série, anime..."
            className="flex-1 bg-transparent text-lg outline-none placeholder:text-muted-foreground/50"
          />
          <button onClick={() => store.setShowSearch(false)} className="p-1.5 rounded-lg hover:bg-secondary transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {loading && (
          <div className="flex justify-center py-12">
            <div className="flex gap-1">
              {[0, 1, 2].map(i => (
                <div key={i} className="w-2.5 h-2.5 bg-red-500 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
              ))}
            </div>
          </div>
        )}
        {!loading && displayResults.length > 0 && (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
            {displayResults.map(item => (
              <div key={item.id} className="flex-shrink-0">
                <ContentCard item={item} />
              </div>
            ))}
          </div>
        )}
        {!loading && hasMinimumChars && displayResults.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <Search className="w-12 h-12 mb-3 opacity-20" />
            <p>Aucun résultat pour &quot;{debouncedQuery}&quot;</p>
          </div>
        )}
        {!loading && debouncedQuery.length < 2 && (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <Search className="w-12 h-12 mb-3 opacity-20" />
            <p>Tapez au moins 2 caractères</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ==================== MAIN PAGE ====================
export default function HomePage() {
  const store = useAppStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  useEffect(() => {
    store.initFavorites();
  }, []);

  const showMobileNav = store.currentView !== 'detail' && store.currentView !== 'search';

  return (
    <div className="noise-bg min-h-screen flex flex-col relative">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="flex items-center justify-between h-14 px-4 md:px-8">
          {/* Left - Logo + Mobile Menu */}
          <div className="flex items-center gap-3">
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 bg-background border-border">
                <SheetTitle className="sr-only">Menu de navigation</SheetTitle>
                <div className="flex flex-col h-full">
                  <div className="p-6 border-b border-border">
                    <h2 className="logo-gradient text-xl font-extrabold">StreamVibe</h2>
                    <p className="text-xs text-muted-foreground mt-1">Streaming illimité</p>
                  </div>
                  <nav className="flex-1 p-4 space-y-1">
                    {[
                      { view: 'home' as const, label: 'Accueil', icon: <Home className="w-4 h-4" /> },
                      { view: 'browse' as const, label: 'Films', icon: <Film className="w-4 h-4" />, type: 'movie' },
                      { view: 'browse' as const, label: 'Séries', icon: <Tv className="w-4 h-4" />, type: 'series' },
                      { view: 'browse' as const, label: 'Anime', icon: <Sparkles className="w-4 h-4" />, type: 'anime' },
                      { view: 'browse' as const, label: 'Manga', icon: <Layers className="w-4 h-4" />, type: 'manga' },
                      { view: 'favorites' as const, label: 'Mes Favoris', icon: <Heart className="w-4 h-4" />, badge: store.favorites.length },
                    ].map(item => (
                      <button
                        key={item.label}
                        onClick={() => {
                          store.setView(item.view);
                          if (item.type) store.setSelectedType(item.type);
                          setMobileMenuOpen(false);
                          window.scrollTo(0, 0);
                        }}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                          store.currentView === item.view ? 'bg-red-500/10 text-red-400' : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                        }`}
                      >
                        {item.icon}
                        {item.label}
                        {item.badge > 0 && (
                          <span className="ml-auto count-badge text-[10px] font-bold px-1.5 py-0.5 rounded-full">{item.badge}</span>
                        )}
                      </button>
                    ))}
                  </nav>
                  <div className="p-4 border-t border-border">
                    <button
                      onClick={() => { setMobileMenuOpen(false); document.getElementById('donate-section')?.scrollIntoView({ behavior: 'smooth' }); }}
                      className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-amber-400 hover:bg-amber-500/10 transition-all"
                    >
                      <Heart className="w-4 h-4" /> Soutenir
                    </button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>

            <button onClick={() => { store.setView('home'); window.scrollTo(0, 0); }} className="flex items-center gap-1.5">
              <span className="logo-gradient text-lg font-extrabold">StreamVibe</span>
            </button>
          </div>

          {/* Center - Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {[
              { view: 'home' as const, label: 'Accueil' },
              { view: 'browse' as const, label: 'Films', type: 'movie' },
              { view: 'browse' as const, label: 'Séries', type: 'series' },
              { view: 'browse' as const, label: 'Anime', type: 'anime' },
              { view: 'browse' as const, label: 'Manga', type: 'manga' },
              { view: 'favorites' as const, label: 'Favoris' },
            ].map(item => (
              <button
                key={item.label}
                onClick={() => {
                  store.setView(item.view);
                  if (item.type) store.setSelectedType(item.type);
                  window.scrollTo(0, 0);
                }}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  store.currentView === item.view ? 'text-red-400 bg-red-500/10' : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                }`}
              >
                {item.label}
                {item.view === 'favorites' && store.favorites.length > 0 && (
                  <span className="ml-1 count-badge text-[10px] font-bold px-1.5 py-0.5 rounded-full">{store.favorites.length}</span>
                )}
              </button>
            ))}
          </nav>

          {/* Right - Search + Fav */}
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => store.setShowSearch(true)} className="text-muted-foreground hover:text-foreground">
              <Search className="w-5 h-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => { store.setView('favorites'); window.scrollTo(0, 0); }}
              className="text-muted-foreground hover:text-foreground relative"
            >
              <Heart className={`w-5 h-5 ${store.favorites.length > 0 ? 'fill-red-500 text-red-500' : ''}`} />
              {store.favorites.length > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 rounded-full text-[9px] font-bold flex items-center justify-center text-white">
                  {store.favorites.length > 9 ? '9+' : store.favorites.length}
                </span>
              )}
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <AnimatePresence mode="wait">
          {store.currentView === 'home' && <HomeView key="home" />}
          {store.currentView === 'browse' && <BrowseView key="browse" />}
          {store.currentView === 'detail' && <ContentDetailView key={store.selectedContentId} />}
          {store.currentView === 'favorites' && <FavoritesView key="favorites" />}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-border/50 bg-background/50 pb-20 md:pb-0">
        {/* Donation */}
        <div id="donate-section" className="donate-box mx-4 md:mx-8 my-8 p-6 rounded-xl text-center">
          <h3 className="text-lg font-bold mb-2 flex items-center justify-center gap-2">
            <Heart className="w-5 h-5 text-red-400" /> Soutenir StreamVibe
          </h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto mb-4">
            StreamVibe est gratuit et le restera. Si vous appréciez notre service, un petit don nous aide à maintenir les serveurs et améliorer le site.
          </p>
          <Button className="bg-amber-500 hover:bg-amber-600 text-black font-bold">
            <Heart className="w-4 h-4 mr-2" /> Faire un don
          </Button>
        </div>

        <AdBanner />

        <div className="px-4 md:px-8 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-4">
              <span className="logo-gradient font-bold text-sm">StreamVibe</span>
              <span>© 2025 Tous droits réservés</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="hover:text-foreground cursor-pointer transition-colors">Mentions légales</span>
              <span className="hover:text-foreground cursor-pointer transition-colors">Contact</span>
              <span className="hover:text-foreground cursor-pointer transition-colors">FAQ</span>
            </div>
          </div>
          <p className="text-[10px] text-muted-foreground/50 text-center mt-4">
            StreamVibe ne stocke aucun fichier vidéo. Tous les contenus sont hébergés par des tiers non affiliés.
          </p>
        </div>
      </footer>

      {/* Mobile Bottom Nav */}
      {showMobileNav && (
        <nav className="mobile-bottom-nav fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around h-14 md:hidden">
          {[
            { view: 'home' as const, label: 'Accueil', icon: <Home className="w-5 h-5" /> },
            { view: 'browse' as const, label: 'Films', icon: <Film className="w-5 h-5" />, type: 'movie' },
            { view: 'browse' as const, label: 'Séries', icon: <Tv className="w-5 h-5" />, type: 'series' },
            { view: 'browse' as const, label: 'Anime', icon: <Sparkles className="w-5 h-5" />, type: 'anime' },
            { view: 'browse' as const, label: 'Manga', icon: <Layers className="w-5 h-5" />, type: 'manga' },
          ].map(item => (
            <button
              key={item.label}
              onClick={() => {
                store.setView(item.view);
                if (item.type) store.setSelectedType(item.type);
                window.scrollTo(0, 0);
              }}
              className={`nav-item flex flex-col items-center gap-0.5 relative ${
                store.currentView === item.view ? 'active' : 'text-muted-foreground'
              }`}
            >
              {item.icon}
              <span className="text-[10px] font-medium">{item.label}</span>
              {store.currentView === item.view && (
                <span className="nav-dot absolute -top-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-red-500 rounded-full" />
              )}
            </button>
          ))}
        </nav>
      )}

      {/* Search Overlay */}
      <AnimatePresence>
        {store.showSearch && <SearchOverlay />}
      </AnimatePresence>
    </div>
  );
}