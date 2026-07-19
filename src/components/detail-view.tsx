"use client";

import { useEffect, useState, useRef, useMemo, useCallback } from "react";
import {
  useAppStore,
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
import { useToast } from "@/hooks/use-toast";
import { Icon } from "@/lib/icons";
import { motion, AnimatePresence } from "framer-motion";
import {
  getDisplayTitle,
  handleImgError,
  getTypeBadge,
  TYPE_CONFIG,
  HOST_COLORS,
  PLACEHOLDER_POSTER,
} from "@/lib/content-helpers";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ContentCard } from "./content-card";

interface MangaDexChapter {
  id: string;
  chapter: string | null;
  title: string | null;
  volume: string | null;
  pages: number;
  publishAt: string | null;
  readableAt: string | null;
  lang?: string;
  groupName?: string | null;
  externalUrl?: string | null;
}

export function DetailView() {
  const {
    contentDetail,
    setContentDetail,
    selectedContentId,
    selectedTmdbType,
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
  const [selectedSeason, setSelectedSeason] = useState<number>(1);
  const [iframeKey, setIframeKey] = useState(0);
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  // MangaDex state
  const [mangadexId, setMangadexId] = useState<string | null>(null);
  const [mangadexTitle, setMangadexTitle] = useState<string | null>(null);
  const [mangadexChapters, setMangadexChapters] = useState<MangaDexChapter[]>([]);
  const [mangadexLoading, setMangadexLoading] = useState(false);
  const [mangadexError, setMangadexError] = useState<string | null>(null);
  const [mangadexChapterLang, setMangadexChapterLang] = useState<string | null>(null);
  const [mangadexHasMore, setMangadexHasMore] = useState(false);
  const [mangadexLoadingMore, setMangadexLoadingMore] = useState(false);
  const [mangadexExternalOnly, setMangadexExternalOnly] = useState(false);
  // Language filter in detail view
  const [detailLangFilter, setDetailLangFilter] = useState<string | null>(null);
  // Cast state
  const [cast, setCast] = useState<{ id: number; name: string; character: string; profileUrl: string; order: number }[]>([]);
  const [crew, setCrew] = useState<{ id: number; name: string; job: string; department: string; profileUrl: string }[]>([]);
  const [castLoading, setCastLoading] = useState(false);
  const [showMirageHint, setShowMirageHint] = useState(true);

  // Server sidebar panel — collapsed by default on mobile, open on desktop
  const [serverPanelOpen, setServerPanelOpen] = useState(() => {
    if (typeof window !== "undefined") {
      return window.matchMedia("(min-width: 768px)").matches;
    }
    return true;
  });

  // Group episodes by season (before any early returns to satisfy rules-of-hooks)
  const seasonMap = useMemo(() => {
    if (!contentDetail?.embedGroups) return new Map<number, EmbedGroup[]>();
    const map = new Map<number, typeof contentDetail.embedGroups>();
    contentDetail.embedGroups.forEach((group) => {
      const s = group.season ?? 1;
      if (!map.has(s)) map.set(s, []);
      map.get(s)!.push(group);
    });
    map.forEach((groups) => {
      groups.sort((a, b) => (a.episode ?? 0) - (b.episode ?? 0));
    });
    return map;
  }, [contentDetail?.embedGroups]);

  const availableSeasons = useMemo(
    () => Array.from(seasonMap.keys()).sort((a, b) => a - b),
    [seasonMap]
  );

  const currentSeasonEpisodes = useMemo(
    () => seasonMap.get(selectedSeason) || [],
    [seasonMap, selectedSeason]
  );

  // Fetch detail on mount or ID change
  const fetchDetail = useCallback(async (id: string) => {
    setSelectedEpisode(null);
    setSelectedSeason(1);
    setCurrentEmbed(null);
    setContentDetail(null); // Clear stale content immediately
    setLoading(true);
    try {
      let data: any;

      if (id.startsWith("tmdb-")) {
        // TMDB live source: extract tmdbId, call TMDB detail endpoint
        const tmdbIdStr = id.replace("tmdb-", "");
        const tmdbIdNum = parseInt(tmdbIdStr);
        if (isNaN(tmdbIdNum)) throw new Error("Invalid TMDB ID");

        // Try movie first — the /api/tmdb/detail endpoint has auto-detection
        // (if not found as movie, it tries tv automatically)
        const typeParam = selectedTmdbType || "movie";
        const res = await fetch(`/api/tmdb/detail?tmdbId=${tmdbIdNum}&type=${typeParam}`);
        if (!res.ok) throw new Error(`TMDB API error: ${res.status}`);
        data = await res.json();
        // API may return { error: "..." } with 200 status — treat as error
        if (data.error) throw new Error(data.error);
        // Verify the loaded content matches the requested ID
        if (data.id !== id) {
          throw new Error(`ID mismatch: expected ${id}, got ${data.id}`);
        }
      } else {
        // Local DB source
        const res = await fetch(`/api/content/${id}`);
        if (!res.ok) throw new Error(`Content API error: ${res.status}`);
        data = await res.json();
        if (data.error) throw new Error(data.error);
      }

      setContentDetail(data);
      // Reset language filter
      setDetailLangFilter(null);
      // Fetch cast from TMDB (skip for TMDB-sourced items since cast is already relevant,
      // but the local /api/tmdb/cast endpoint works fine for both)
      if (data.tmdbId && data.type !== "manga") {
        setCastLoading(true);
        const castType = data.type === "anime" ? "tv" : data.type;
        fetch(`/api/tmdb/cast?tmdbId=${data.tmdbId}&type=${castType}`)
          .then((r) => r.json())
          .then((castData) => {
            setCast(castData.cast || []);
            setCrew(castData.crew || []);
          })
          .catch(() => { setCast([]); setCrew([]); })
          .finally(() => setCastLoading(false));
      } else {
        setCast([]);
        setCrew([]);
      }
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
  }, [setContentDetail, setCurrentEmbed, setSelectedEpisode, setSelectedSeason, toast, selectedTmdbType]);

  // Custom fullscreen toggle (avoids interacting with embed controls)
  const toggleFullscreen = useCallback(() => {
    if (!playerContainerRef.current) return;
    if (!document.fullscreenElement) {
      playerContainerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  }, []);

  // Listen for fullscreen changes (e.g. user presses Escape)
  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  // Search MangaDex when manga detail loads (uses smart resolve endpoint)
  const fetchMangaDexChapters = useCallback(async (mangaTitle: string, append = false) => {
    if (!append) {
      setMangadexLoading(true);
      setMangadexError(null);
      setMangadexChapters([]);
      setMangadexId(null);
      setMangadexTitle(null);
      setMangadexHasMore(false);
      setMangadexChapterLang(null);
      setMangadexExternalOnly(false);
    } else {
      setMangadexLoadingMore(true);
    }
    try {
      const currentCount = append ? mangadexChapters.length : 0;
      const resolveUrl = `/api/manga/resolve?title=${encodeURIComponent(mangaTitle)}&limit=200&offset=${currentCount}`;
      const res = await fetch(resolveUrl);
      const data = await res.json();

      if (!data.success) {
        if (!append) setMangadexError(data.error || "Aucun chapitre disponible");
        return;
      }

      setMangadexId(data.mangadexId);
      setMangadexTitle(data.mangadexTitle);
      setMangadexChapterLang(data.chapters?.[0]?.lang || null);
      setMangadexExternalOnly(!!data.externalOnly);

      const newChapters = (data.chapters || []) as MangaDexChapter[];
      if (append) {
        setMangadexChapters((prev) => [...prev, ...newChapters]);
      } else {
        setMangadexChapters(newChapters);
      }

      // If we got the max, there might be more
      setMangadexHasMore(newChapters.length >= 200);
    } catch {
      if (!append) setMangadexError("Erreur de connexion a MangaDex");
    } finally {
      setMangadexLoading(false);
      setMangadexLoadingMore(false);
    }
  }, [mangadexChapters.length]);

  // Load more chapters
  const handleLoadMoreChapters = useCallback(() => {
    if (contentDetail?.title && mangadexId) {
      // For pagination, we need to fetch more from the same mangadexId
      const lang = mangadexChapterLang || "fr";
      setMangadexLoadingMore(true);
      fetch(`/api/manga/chapters?mangadexId=${mangadexId}&lang=${lang}&limit=200&offset=${mangadexChapters.length}`)
        .then((r) => r.json())
        .then((data) => {
          if (data.data && data.data.length > 0) {
            const newChapters = data.data.map((ch: Record<string, unknown>) => ({
              ...ch,
              lang,
            })) as MangaDexChapter[];
            setMangadexChapters((prev) => [...prev, ...newChapters]);
          }
        })
        .catch(() => {})
        .finally(() => setMangadexLoadingMore(false));
    }
  }, [contentDetail?.title, mangadexId, mangadexChapterLang, mangadexChapters.length]);

  // Trigger MangaDex search when manga content loads
  useEffect(() => {
    if (contentDetail?.type === "manga" && contentDetail.title) {
      fetchMangaDexChapters(contentDetail.title);
    }
  }, [contentDetail?.type, contentDetail?.title, fetchMangaDexChapters]);

  // Handle opening a chapter in the reader
  const handleOpenChapter = useCallback(async (chapter: MangaDexChapter) => {
    // External chapter — open in new tab
    if (chapter.externalUrl) {
      window.open(chapter.externalUrl, "_blank", "noopener,noreferrer");
      return;
    }

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

  // Show loading state if: actively loading, no content yet, or stale content from a different item
  const isStaleContent = contentDetail && contentDetail.id !== selectedContentId;
  if (loading || !contentDetail || isStaleContent) {
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

  // Auto-select first episode of season when season changes
  const handleSeasonChange = (season: number) => {
    setSelectedSeason(season);
    const eps = seasonMap.get(season);
    if (eps?.length) {
      const firstEp = eps[0];
      const epKey = `S${firstEp.season}E${firstEp.episode}`;
      setSelectedEpisode(epKey);
      if (firstEp.embeds.length > 0) {
        handleEmbedClick(firstEp.embeds[0], epKey);
      }
    }
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
                src={contentDetail.posterUrl || PLACEHOLDER_POSTER}
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
                    <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2 flex-wrap">
                      <Icon name="book-open" className="h-4 w-4 text-purple-400" />
                      Chapitres disponibles
                      <span className="text-xs font-normal text-muted-foreground/70">
                        ({mangadexChapters.length} chapitres)
                      </span>
                      {mangadexChapterLang && (
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${mangadexChapterLang === "fr" ? "bg-blue-500/20 text-blue-400" : "bg-amber-500/20 text-amber-400"}`}>
                          {mangadexChapterLang === "fr" ? "VF" : "VO"}
                        </span>
                      )}
                      {mangadexExternalOnly && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase bg-orange-500/20 text-orange-400 flex items-center gap-1">
                          <Icon name="link" className="h-2.5 w-2.5" />
                          Lecture externe
                        </span>
                      )}
                      {mangadexTitle && mangadexTitle !== contentDetail.title && (
                        <span className="text-[10px] text-muted-foreground/40">
                          via {mangadexTitle}
                        </span>
                      )}
                    </h3>
                    {mangadexExternalOnly && (
                      <p className="text-[11px] text-orange-400/80 mb-2.5 flex items-center gap-1.5">
                        <Icon name="info" className="h-3 w-3 flex-shrink-0" />
                        Ce manga est officiellement licencié. Les chapitres s'ouvrent sur la source officielle.
                      </p>
                    )}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-96 overflow-y-auto pr-1">
                      {mangadexChapters.map((ch) => (
                        <button
                          key={ch.id}
                          onClick={() => handleOpenChapter(ch)}
                          disabled={mangadexLoading}
                          className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-colors group disabled:opacity-50 ${
                            ch.externalUrl
                              ? "bg-orange-500/5 hover:bg-orange-500/15 hover:text-orange-400"
                              : "bg-muted/50 hover:bg-purple-600/10 hover:text-purple-400"
                          }`}
                        >
                          <span className={`text-xs font-bold min-w-[3rem] ${ch.externalUrl ? "text-orange-400 group-hover:text-orange-300" : "text-purple-400 group-hover:text-purple-300"}`}>
                            Ch. {ch.chapter || "?"}
                          </span>
                          <div className="flex-1 min-w-0">
                            {ch.title && (
                              <p className={`text-xs font-medium truncate ${ch.externalUrl ? "group-hover:text-orange-300" : "group-hover:text-purple-300"}`}>
                                {ch.title}
                              </p>
                            )}
                            {ch.groupName && (
                              <p className="text-[10px] text-muted-foreground/40 truncate">
                                {ch.groupName}
                              </p>
                            )}
                          </div>
                          {ch.externalUrl ? (
                            <div className="flex items-center gap-1 text-orange-400/60 flex-shrink-0">
                              <Icon name="link" className="h-3 w-3" />
                              <span className="text-[10px]">Externe</span>
                            </div>
                          ) : ch.pages > 0 ? (
                            <div className="flex items-center gap-1 text-muted-foreground flex-shrink-0">
                              <Icon name="book-open" className="h-3 w-3" />
                              <span className="text-[10px]">{ch.pages}p</span>
                            </div>
                          ) : null}
                        </button>
                      ))}
                    </div>
                    {/* Load more button */}
                    {mangadexHasMore && !mangadexExternalOnly && (
                      <button
                        onClick={handleLoadMoreChapters}
                        disabled={mangadexLoadingMore}
                        className="w-full mt-2 py-2.5 rounded-lg text-sm font-medium text-purple-400 hover:bg-purple-600/10 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {mangadexLoadingMore ? (
                          <Icon name="loader" className="h-4 w-4 animate-spin" />
                        ) : (
                          <Icon name="chevron-down" className="h-4 w-4" />
                        )}
                        {mangadexLoadingMore ? "Chargement..." : `Charger plus de chapitres`}
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
      <>
      {/* "Pas encore disponible" banner for future releases */}
      {contentDetail.releaseDate && new Date(contentDetail.releaseDate) > new Date() && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 mb-6 flex items-start gap-3">
          <Icon name="calendar" className="h-5 w-5 text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-amber-400 font-semibold text-sm">Pas encore disponible</p>
            <p className="text-sm text-amber-400/70 mt-0.5">
              Ce contenu sortira le {new Date(contentDetail.releaseDate).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}. Les serveurs peuvent ne pas fonctionner tant que le contenu n'est pas officiellement sorti.
            </p>
          </div>
        </div>
      )}
      <div className="relative mb-6">
        <div className="flex gap-0 aspect-video">
          {/* Player area */}
          <div className={`flex-1 min-w-0 relative overflow-hidden bg-black transition-[border-radius] duration-200 ${serverPanelOpen ? 'rounded-l-xl' : 'rounded-xl'} ring-1 ring-white/10 shadow-lg shadow-black/50`} ref={playerContainerRef} data-player-container>
            {currentEmbed ? (
              <>
                {playerLoading && (
                  <div className="absolute inset-0 flex items-center justify-center z-10">
                    {contentDetail.backdropUrl ? (
                      <div className="absolute inset-0">
                        <img
                          src={contentDetail.backdropUrl}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" />
                      </div>
                    ) : (
                      <div className="absolute inset-0 bg-black/60" />
                    )}
                    <div className="relative z-10 flex flex-col items-center gap-3">
                      <Icon name="loader" className="h-8 w-8 animate-spin text-white/80" />
                      <span className="text-xs text-white/50">Chargement du lecteur...</span>
                    </div>
                  </div>
                )}
                {showMirageHint && currentEmbed?.hostProvider === "vidsrc_me" && (
                  <div className="absolute top-2 left-1/2 -translate-x-1/2 z-30 max-w-[95%] px-4 py-2 rounded-md bg-black/80 backdrop-blur-sm border border-yellow-500/30 flex items-center gap-3">
                    <p className="text-xs text-yellow-200/90 text-center leading-relaxed flex-1">
                      Le serveur Mirage redirige vers des sites externes, cela ne dépend pas de nous. Nous n&apos;avons pas de pub sur ce site. Choisissez le serveur avec lequel vous êtes à l&apos;aise et installez un bloqueur de pub.
                    </p>
                    <button
                      onClick={() => setShowMirageHint(false)}
                      className="flex-shrink-0 w-5 h-5 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white/50 hover:text-white transition-colors"
                      aria-label="Fermer"
                    >
                      <Icon name="x" className="h-3 w-3" />
                    </button>
                  </div>
                )}
                {showMirageHint && currentEmbed?.hostProvider === "vidsrc_pm" && (
                  <div className="absolute top-2 left-1/2 -translate-x-1/2 z-30 max-w-[95%] px-4 py-2 rounded-md bg-black/80 backdrop-blur-sm border border-white/10 flex items-center gap-3">
                    <p className="text-xs text-white/70 text-center leading-relaxed flex-1">
                      Le serveur Rafale redirige vers des sites externes, cela ne dépend pas de nous. Nous n&apos;avons pas de pub sur ce site. Choisissez le serveur avec lequel vous êtes à l&apos;aise et installez un bloqueur de pub.
                    </p>
                    <button
                      onClick={() => setShowMirageHint(false)}
                      className="flex-shrink-0 w-5 h-5 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white/50 hover:text-white transition-colors"
                      aria-label="Fermer"
                    >
                      <Icon name="x" className="h-3 w-3" />
                    </button>
                  </div>
                )}
                <iframe
                  key={iframeKey}
                  src={currentEmbed.url}
                  className="absolute inset-0 w-full h-full border-0"
                  referrerPolicy="no-referrer"
                  allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
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
                  <p className="text-muted-foreground">Sélectionnez un serveur</p>
                  {!serverPanelOpen && (
                    <button
                      onClick={() => setServerPanelOpen(true)}
                      className="mt-3 inline-flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 transition-colors"
                    >
                      Ouvrir le panneau
                      <Icon name="chevron-left" className="h-3 w-3" />
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Server Sidebar (collapsible) */}
          {contentDetail.embedGroups.length > 0 && (
            <AnimatePresence initial={false}>
              {serverPanelOpen && (
                <motion.div
                  key="server-sidebar"
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: 200, opacity: 1 }}
                  exit={{ width: 0, opacity: 0 }}
                  transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                  className="h-full flex-shrink-0 overflow-hidden"
                >
                  <div className="w-[200px] h-full rounded-r-xl border-l border-border/40 bg-card/95 backdrop-blur-sm flex flex-col">
                    {/* Header */}
                    <div className="flex items-center justify-between px-3 pt-3 pb-2">
                      <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                        <Icon name="server" className="h-4 w-4 text-red-400" />
                        Serveurs
                      </h3>
                      <button
                        onClick={() => setServerPanelOpen(false)}
                        className="w-6 h-6 flex items-center justify-center rounded hover:bg-muted transition-colors"
                        aria-label="Fermer"
                      >
                        <Icon name="chevron-right" className="h-4 w-4 text-muted-foreground" />
                      </button>
                    </div>

                    {/* Language filter */}
                    <div className="flex gap-1 px-3 pb-2">
                      <button onClick={() => setDetailLangFilter(null)} className={`px-2 py-0.5 rounded-full text-[10px] font-medium transition-colors ${!detailLangFilter ? "bg-red-600/20 text-red-400" : "bg-muted text-muted-foreground"}`}>
                        Tous
                      </button>
                      <button onClick={() => setDetailLangFilter(detailLangFilter === "vostfr" ? null : "vostfr")} className={`px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider transition-colors ${detailLangFilter === "vostfr" ? "bg-amber-600/20 text-amber-400" : "bg-muted text-muted-foreground"}`}>
                        VOSTFR
                      </button>
                      <button onClick={() => setDetailLangFilter(detailLangFilter === "vf" ? null : "vf")} className={`px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider transition-colors ${detailLangFilter === "vf" ? "bg-emerald-600/20 text-emerald-400" : "bg-muted text-muted-foreground"}`}>
                        VF
                      </button>
                    </div>
                    <div className="mx-3 h-px bg-border/40" />

                    {/* Server list */}
                    <div className="flex-1 overflow-y-auto p-2 space-y-1.5 custom-scrollbar">
                      {/* Movies: all servers */}
                      {!isSeriesOrAnime && contentDetail.embedGroups[0].embeds
                        .filter((embed) => !detailLangFilter || (embed.hostConfig?.langs || ["vostfr"]).includes(detailLangFilter))
                        .map((embed) => (
                          <ServerButton key={embed.id} embed={embed} isActive={currentEmbed?.id === embed.id} onClick={() => handleEmbedClick(embed)} />
                        ))
                      }
                      {/* Series/Anime: servers for selected episode */}
                      {isSeriesOrAnime && selectedEpisode && contentDetail.embedGroups
                        .find((g) => {
                          const k = g.season != null && g.episode != null ? `S${g.season}E${g.episode}` : "all";
                          return k === selectedEpisode;
                        })
                        ?.embeds
                        .filter((embed) => !detailLangFilter || (embed.hostConfig?.langs || ["vostfr"]).includes(detailLangFilter))
                        .map((embed) => (
                          <ServerButton key={embed.id} embed={embed} isActive={currentEmbed?.id === embed.id} onClick={() => handleEmbedClick(embed, selectedEpisode)} />
                        ))
                      }
                      {/* No episode selected */}
                      {isSeriesOrAnime && !selectedEpisode && (
                        <div className="flex flex-col items-center justify-center py-8 text-center">
                          <Icon name="layers" className="h-8 w-8 text-muted-foreground/40 mb-2" />
                          <p className="text-xs text-muted-foreground">Sélectionnez un épisode</p>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </div>

        {/* Toggle tab - visible when sidebar is closed */}
        {!serverPanelOpen && contentDetail.embedGroups.length > 0 && (
          <button
            onClick={() => setServerPanelOpen(true)}
            className="absolute right-2 top-1/2 -translate-y-1/2 z-20 flex items-center rounded-l-lg bg-card/90 backdrop-blur-sm border border-r-0 border-border/50 shadow-xl hover:bg-muted transition-all duration-200 py-5 pl-1.5 pr-1"
            aria-label="Afficher les serveurs"
          >
            <Icon name="chevron-left" className="h-4 w-4 text-muted-foreground" />
          </button>
        )}
      </div>
      </>
      )}

      {/* ========== SERIES/ANIME: Netflix-style two-column layout ========== */}
      {isSeriesOrAnime && (
        <div className="grid lg:grid-cols-[1fr_380px] gap-6 mb-8">
          {/* Left column: Info + Servers */}
          <div>
            <div className="grid md:grid-cols-[180px_1fr] gap-5 mb-6">
              {/* Poster */}
              <div className="hidden md:block">
                <img
                  src={contentDetail.posterUrl || PLACEHOLDER_POSTER}
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
                  <p className="text-sm text-muted-foreground leading-relaxed line-clamp-4">
                    {contentDetail.overviewFr}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Right column: Season dropdown + Episode list */}
          <div className="rounded-xl border border-border/60 bg-card/50 overflow-hidden">
            {/* Season dropdown */}
            <div className="p-4 border-b border-border/50">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-foreground">Épisodes</h3>
                {availableSeasons.length > 0 && (
                    <Select
                      value={String(selectedSeason)}
                      onValueChange={(val) => handleSeasonChange(Number(val))}
                    >
                      <SelectTrigger className="w-[140px] h-9 text-xs bg-muted/50 border-border/50">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {availableSeasons.map((s) => (
                          <SelectItem key={s} value={String(s)} className="text-xs">
                            Saison {s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                )}
              </div>
            </div>

            {/* Episode list */}
            <div className="max-h-[500px] overflow-y-auto custom-scrollbar">
              {currentSeasonEpisodes.length === 0 ? (
                <div className="p-6 text-center text-sm text-muted-foreground">
                  Aucun épisode disponible pour cette saison
                </div>
              ) : (
                currentSeasonEpisodes.map((group) => {
                  const epKey = group.season != null && group.episode != null ? `S${group.season}E${group.episode}` : "all";
                  const isActive = selectedEpisode === epKey;
                  const epNum = group.episode ?? 0;
                  return (
                    <button
                      key={epKey}
                      onClick={() => {
                        setSelectedEpisode(epKey);
                        if (group.embeds.length > 0) {
                          handleEmbedClick(group.embeds[0], epKey);
                        }
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-all border-b border-border/30 last:border-b-0 group ${
                        isActive
                          ? "bg-red-600/10 border-l-[3px] border-l-red-500"
                          : "hover:bg-muted/50 border-l-[3px] border-l-transparent"
                      }`}
                    >
                      {/* Episode number */}
                      <span className={`text-lg font-bold min-w-[2rem] text-center transition-colors ${
                        isActive ? "text-red-500" : "text-muted-foreground/40 group-hover:text-muted-foreground/70"
                      }`}>
                        {epNum}
                      </span>

                      {/* Episode info */}
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium truncate transition-colors ${
                          isActive ? "text-foreground" : "text-muted-foreground group-hover:text-foreground"
                        }`}>
                          Épisode {epNum}
                        </p>
                        <p className="text-xs text-muted-foreground/60 mt-0.5">
                          {group.embeds.length} serveur{group.embeds.length > 1 ? "s" : ""} disponible{group.embeds.length > 1 ? "s" : ""}
                        </p>
                      </div>

                      {/* Play icon */}
                      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                        isActive
                          ? "bg-red-600 text-white shadow-lg shadow-red-600/20"
                          : "bg-muted/80 text-muted-foreground opacity-0 group-hover:opacity-100"
                      }`}>
                        <Icon name={isActive ? "pause" : "play"} className="h-3.5 w-3.5" />
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========== MOVIES: Info section (existing layout) ========== */}
      {!isManga && !isSeriesOrAnime && <div className="grid md:grid-cols-[220px_1fr] gap-6 mb-8">
        {/* Poster */}
        <div className="hidden md:block">
          <img
            src={contentDetail.posterUrl || PLACEHOLDER_POSTER}
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

      {/* Cast & Crew */}
      {!isManga && contentDetail.tmdbId && (
        <section className="mb-8">
          <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
            <Icon name="camera" className="h-5 w-5 text-red-400" />
            Casting & Équipe
          </h2>

          {castLoading ? (
            <div className="flex gap-4 overflow-x-auto hide-scrollbar pb-2">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="flex-shrink-0 w-[110px]">
                  <Skeleton className="w-[110px] h-[110px] rounded-full mb-2" />
                  <Skeleton className="h-4 w-20 mx-auto" />
                  <Skeleton className="h-3 w-16 mx-auto mt-1" />
                </div>
              ))}
            </div>
          ) : (
            <>
              {/* Cast horizontal scroll */}
              {cast.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-muted-foreground mb-3">Acteurs</h3>
                  <div className="flex gap-4 overflow-x-auto hide-scrollbar pb-2">
                    {cast.map((person) => (
                      <div key={person.id} className="flex-shrink-0 w-[110px] text-center group">
                        <div className="w-[110px] h-[110px] rounded-full overflow-hidden mx-auto mb-2 border-2 border-transparent group-hover:border-red-500/40 transition-colors">
                          {person.profileUrl ? (
                            <img
                              src={person.profileUrl}
                              alt={person.name}
                              className="w-full h-full object-cover"
                              loading="lazy"
                              onError={(e) => { (e.target as HTMLImageElement).src = PLACEHOLDER_POSTER; }}
                            />
                          ) : (
                            <div className="w-full h-full bg-muted flex items-center justify-center">
                              <Icon name="user" className="h-8 w-8 text-muted-foreground/40" />
                            </div>
                          )}
                        </div>
                        <p className="text-xs font-medium text-foreground truncate">{person.name}</p>
                        <p className="text-[10px] text-muted-foreground truncate">{person.character}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Crew */}
              {crew.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground mb-3">Équipe technique</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {crew.map((person) => (
                      <div key={`${person.id}-${person.job}`} className="flex items-center gap-3 px-3 py-2 rounded-lg bg-muted/30">
                        <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 bg-muted">
                          {person.profileUrl ? (
                            <img src={person.profileUrl} alt={person.name} className="w-full h-full object-cover" loading="lazy" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Icon name="user" className="h-4 w-4 text-muted-foreground/40" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-foreground truncate">{person.name}</p>
                          <p className="text-[10px] text-muted-foreground">{person.job}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </section>
      )}

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
            Vous pourriez aussi aimer
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

export function ServerButton({
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
  const providerLangs = embed.hostConfig?.langs || ["vostfr"];
  const hasVF = providerLangs.includes("vf");

  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg text-[13px] font-bold transition-all border-2 w-full"
      style={{
        borderColor: isActive ? hostColor : "transparent",
        backgroundColor: isActive ? `${hostColor}15` : "oklch(0.18 0 0)",
        color: isActive ? hostColor : "oklch(0.7 0 0)",
        boxShadow: isActive ? `0 0 12px ${hostColor}30` : "none",
      }}
    >
      <span
        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
        style={{ backgroundColor: hostColor }}
      />
      <span className="truncate min-w-0">{hostLabel}</span>
      {hasVF && (
        <span className="px-1.5 py-0.5 rounded text-[7px] font-bold bg-emerald-500/20 text-emerald-400">
          VF
        </span>
      )}
      <span
        className="px-1.5 py-0.5 rounded text-[8px] font-bold"
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