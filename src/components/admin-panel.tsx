"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useAppStore } from "@/store/app-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { getDisplayTitle, handleImgError, PLACEHOLDER_POSTER } from "@/lib/content-helpers";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";

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

export function StatCard({ label, value, sub, color = "text-foreground" }: {
  label: string; value: number | string; sub?: string; color?: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <p className="text-base text-muted-foreground">{label}</p>
      <p className={`text-3xl font-bold ${color}`}>{value}</p>
      {sub && <p className="text-sm text-muted-foreground">{sub}</p>}
    </div>
  );
}

export function AdminPanel({
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
  const [seriesMaxSeasons, setSeriesMaxSeasons] = useState(50);
  const [seriesMaxEps, setSeriesMaxEps] = useState(10);
  const [regenerateEmbeds, setRegenerateEmbeds] = useState(false);

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
  const [adminTab, setAdminTab] = useState<"overview" | "featured" | "anime" | "tmdb" | "images">("overview");

  // Featured management state
  const [featuredItems, setFeaturedItems] = useState<any[]>([]);
  const [featuredLoading, setFeaturedLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const searchTimerRef = useRef<NodeJS.Timeout | null>(null);

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
      const params = new URLSearchParams({
        type, source: tmdbSource, pages: String(tmdbPages), limit: "500",
        maxSeasons: String(seriesMaxSeasons),
        maxEpsPerSeason: String(seriesMaxEps),
      });
      if (regenerateEmbeds) params.set("regenerateEmbeds", "true");
      const res = await fetch(`/api/tmdb/sync?${params.toString()}`, { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setTmdbSyncResult(data.stats);
        const desc = [`Créés: ${data.stats.created}`, `MAJ: ${data.stats.updated}`];
        if (data.stats.embedsDeleted) desc.push(`Embeds regénérés: ${data.stats.embedsDeleted}`);
        toast({ title: `TMDB ${type === "movies" ? "Films" : "Séries"} réussi !`, description: desc.join(" · ") });
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
    { id: "overview" as const, label: "Vue d'ensemble", icon: <Icon name="database" className="h-4 w-4" /> },
    { id: "featured" as const, label: "Mis en avant", icon: <Icon name="star" className="h-4 w-4" /> },
    { id: "anime" as const, label: "Anime", icon: <Icon name="sparkles" className="h-4 w-4" /> },
    { id: "tmdb" as const, label: "Films & Séries", icon: <Icon name="film" className="h-4 w-4" /> },
    { id: "images" as const, label: "Images", icon: <Icon name="monitor" className="h-4 w-4" /> },
  ];

  // Featured management functions
  const fetchFeatured = useCallback(async () => {
    setFeaturedLoading(true);
    try {
      const res = await fetch("/api/featured");
      const data = await res.json();
      setFeaturedItems(data.data || []);
    } catch { toast({ title: "Erreur", description: "Impossible de charger les mis en avant", variant: "destructive" }); }
    finally { setFeaturedLoading(false); }
  }, [toast]);

  const searchContent = useCallback(async (q: string) => {
    if (q.length < 2) { setSearchResults([]); return; }
    setSearchLoading(true);
    try {
      const res = await fetch(`/api/content?search=${encodeURIComponent(q)}&limit=10`);
      const data = await res.json();
      setSearchResults((data.data || []).filter((item: any) => !featuredItems.some(f => f.id === item.id)));
    } catch { setSearchResults([]); }
    finally { setSearchLoading(false); }
  }, [featuredItems]);

  const addToFeatured = async (id: string) => {
    try {
      const res = await fetch("/api/featured", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
      const data = await res.json();
      if (data.data?.[0]?.success) {
        toast({ title: "Ajouté !", description: "Contenu ajouté aux mis en avant" });
        fetchFeatured();
        setSearchResults(prev => prev.filter(r => r.id !== id));
      } else { toast({ title: "Erreur", description: "Impossible d'ajouter", variant: "destructive" }); }
    } catch { toast({ title: "Erreur réseau", variant: "destructive" }); }
  };

  const removeFromFeatured = async (id: string) => {
    try {
      await fetch("/api/featured", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
      toast({ title: "Retiré", description: "Contenu retiré des mis en avant" });
      fetchFeatured();
    } catch { toast({ title: "Erreur réseau", variant: "destructive" }); }
  };

  const moveFeatured = async (id: string, direction: "up" | "down") => {
    const idx = featuredItems.findIndex(f => f.id === id);
    if (idx < 0) return;
    const newIdx = direction === "up" ? idx - 1 : idx + 1;
    if (newIdx < 0 || newIdx >= featuredItems.length) return;
    const newItems = [...featuredItems];
    [newItems[idx], newItems[newIdx]] = [newItems[newIdx], newItems[idx]];
    setFeaturedItems(newItems);
    try {
      await fetch("/api/featured", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: newItems.map((item, i) => ({ id: item.id, order: i })) }),
      });
    } catch { fetchFeatured(); }
  };

  useEffect(() => {
    if (open && adminTab === "featured") fetchFeatured();
  }, [open, adminTab, fetchFeatured]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-full sm:w-1/2 overflow-y-auto">
        <SheetHeader className="mb-6 px-6">
          <SheetTitle className="flex items-center gap-3 text-2xl">
            <Icon name="settings" className="h-7 w-7 text-red-500" /> Administration
          </SheetTitle>
          <SheetDescription className="text-base">Gérer le contenu, les syncs et les paramètres</SheetDescription>
        </SheetHeader>

        <div className="flex gap-0.5 mb-6 bg-muted/50 rounded-xl p-1 mx-4">
          {TABS.map((tab) => (
            <button key={tab.id} onClick={() => setAdminTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 px-1 py-2 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                adminTab === tab.id ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}>
              {tab.icon}<span className="truncate">{tab.label}</span>
            </button>
          ))}
        </div>

        <div className="space-y-5 pb-8 px-5">
          {adminTab === "overview" && (
            <>
              <div className={`rounded-xl border p-5 ${matchStats?.tmdbKeyValid ? "border-green-500/30 bg-green-500/5" : "border-red-500/30 bg-red-500/5"}`}>
                <p className="text-base font-medium flex items-center gap-2 mb-2">
                  <span className={`w-3 h-3 rounded-full ${matchStats?.tmdbKeyValid ? "bg-green-400" : "bg-red-400"} animate-pulse`} />
                  TMDB API
                </p>
                <p className="text-lg font-semibold flex items-center gap-2">
                  {matchStats?.tmdbKeyValid ? (
                    <><Icon name="badge-check" className="h-5 w-5 text-green-400" /> Clé TMDB configurée et valide</>
                  ) : (
                    <><Icon name="alert-02" className="h-5 w-5 text-red-400" /> Clé TMDB non configurée</>
                  )}
                </p>
              </div>

              {stats ? (
                <div className="grid grid-cols-2 gap-3">
                  <StatCard label="Films" value={stats.movies.total} />
                  <StatCard label="Séries" value={stats.series.total} />
                  <StatCard label="Anime" value={stats.anime.total} sub={`${stats.anime.withEmbeds} avec streams`} />
                  <StatCard label="Manga" value={stats.manga.total} />
                  <StatCard label="Total Embeds" value={matchStats?.total.embeds || 0} color="text-blue-400" />
                  <StatCard label="TMDB Match" value={`${tmdbRate}%`} color={tmdbRate > 80 ? "text-green-400" : tmdbRate > 40 ? "text-yellow-400" : "text-red-400"} />
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
                </div>
              )}

              {imageFixStats && imageFixStats.needsFix > 0 && (
                <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/5 p-5">
                  <p className="text-base text-yellow-400 font-medium mb-1.5 flex items-center gap-2"><Icon name="warning" className="h-5 w-5" /> {imageFixStats.needsFix} images cassées</p>
                  <p className="text-sm text-muted-foreground">Onglet &quot;Images&quot; pour corriger</p>
                </div>
              )}

              {matchStats && matchStats.anime.unmatched > 0 && (
                <div className="rounded-xl border border-orange-500/30 bg-orange-500/5 p-5">
                  <p className="text-base text-orange-400 font-medium mb-1.5 flex items-center gap-2"><Icon name="zap" className="h-5 w-5" /> {matchStats.anime.unmatched} anime sans TMDB ID</p>
                  <p className="text-sm text-muted-foreground">Onglet &quot;Anime&quot; → Matcher</p>
                </div>
              )}

              <Separator />
              <section className="space-y-3">
                <h3 className="text-base font-semibold text-muted-foreground uppercase tracking-wider">Actions rapides</h3>
                <Button onClick={() => setAdminTab("tmdb")} variant="outline" className="w-full h-12 text-base border-blue-500/20 text-blue-400 hover:bg-blue-500/10">
                  <Icon name="film" className="h-5 w-5 mr-2" /> Ajouter des Films via TMDB
                </Button>
                <Button onClick={() => setAdminTab("anime")} variant="outline" className="w-full h-12 text-base border-orange-500/20 text-orange-400 hover:bg-orange-500/10">
                  <Icon name="sparkles" className="h-5 w-5 mr-2" /> Synchroniser les Anime (AniList)
                </Button>
                <Button onClick={() => setAdminTab("images")} variant="outline" className="w-full h-12 text-base border-purple-500/20 text-purple-400 hover:bg-purple-500/10">
                  <Icon name="monitor" className="h-5 w-5 mr-2" /> Corriger les images cassées
                </Button>
                <Button onClick={() => setAdminTab("featured")} variant="outline" className="w-full h-12 text-base border-amber-500/20 text-amber-400 hover:bg-amber-500/10">
                  <Icon name="star" className="h-5 w-5 mr-2" /> Gérer les mis en avant (Hero)
                </Button>
              </section>
            </>
          )}

          {adminTab === "featured" && (
            <>
              {/* Search to add */}
              <div className="relative">
                <Icon name="search" className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); if (searchTimerRef.current) clearTimeout(searchTimerRef.current); searchTimerRef.current = setTimeout(() => searchContent(e.target.value), 300); }}
                  placeholder="Rechercher un contenu à ajouter..."
                  className="pl-12 h-12 text-base bg-background"
                />
                {searchLoading && <Icon name="loader" className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 animate-spin text-muted-foreground" />}
              </div>

              {/* Search results */}
              {searchResults.length > 0 && (
                <div className="border rounded-xl overflow-hidden divide-y divide-border">
                  {searchResults.map((item: any) => (
                    <div key={item.id} className="flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors">
                      <img src={item.posterUrl} alt="" className="w-12 h-[72px] object-cover rounded-lg" onError={(e) => handleImgError(e)} />
                      <div className="flex-1 min-w-0">
                        <p className="text-base font-medium truncate">{item.titleFr || item.title}</p>
                        <p className="text-sm text-muted-foreground">{item.year} · {item.type} · {(item.rating || 0).toFixed(1)}</p>
                      </div>
                      <button
                        onClick={() => addToFeatured(item.id)}
                        className="w-11 h-11 flex items-center justify-center rounded-full bg-green-600/20 text-green-400 hover:bg-green-600/30 transition-colors flex-shrink-0"
                        aria-label="Ajouter aux mis en avant"
                      >
                        <Icon name="check" className="h-5 w-5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Current featured list */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-semibold text-muted-foreground uppercase tracking-wider">
                    Contenus mis en avant ({featuredItems.length}/10)
                  </h3>
                  {featuredItems.length > 0 && (
                    <span className="text-sm text-muted-foreground">Hero carousel</span>
                  )}
                </div>

                {featuredLoading && (
                  <div className="flex items-center justify-center py-8">
                    <Icon name="loader" className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                )}

                {!featuredLoading && featuredItems.length === 0 && (
                  <div className="text-center py-10 border border-dashed rounded-xl">
                    <Icon name="star" className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-base text-muted-foreground">Aucun contenu mis en avant</p>
                    <p className="text-sm text-muted-foreground mt-1">Recherchez ci-dessus pour ajouter</p>
                  </div>
                )}

                <div className="space-y-3">
                  {featuredItems.map((item: any, idx: number) => (
                    <motion.div
                      key={item.id}
                      layout
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-4 p-4 rounded-xl bg-muted/30 border border-border/50 group hover:bg-muted/60 transition-colors"
                    >
                      {/* Order badge */}
                      <span className="w-9 h-9 flex items-center justify-center rounded-lg bg-red-600/20 text-red-400 text-base font-bold flex-shrink-0">
                        {idx + 1}
                      </span>

                      {/* Poster */}
                      <img src={item.posterUrl} alt="" className="w-12 h-[72px] object-cover rounded-lg flex-shrink-0" onError={(e) => handleImgError(e)} />

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-base font-medium truncate">{item.titleFr || item.title}</p>
                        <p className="text-sm text-muted-foreground">{item.year || "—"} · {item.type} · {(item.rating || 0).toFixed(1)}</p>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                        <button
                          onClick={() => moveFeatured(item.id, "up")}
                          disabled={idx === 0}
                          className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-muted disabled:opacity-30"
                          aria-label="Monter"
                        >
                          <Icon name="chevron-up" className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => moveFeatured(item.id, "down")}
                          disabled={idx === featuredItems.length - 1}
                          className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-muted disabled:opacity-30"
                          aria-label="Descendre"
                        >
                          <Icon name="chevron-down" className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => removeFromFeatured(item.id)}
                          className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-red-500/20 text-red-400"
                          aria-label="Retirer"
                        >
                          <Icon name="x" className="h-5 w-5" />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {featuredItems.length > 0 && (
                <p className="text-sm text-muted-foreground text-center">
                  ℹ️ Les {Math.min(featuredItems.length, 8)} premiers apparaissent dans le hero. Survolez un élément pour réordonner.
                </p>
              )}
            </>
          )}

          {adminTab === "anime" && (
            <>
              {matchStats && (
                <div className="grid grid-cols-2 gap-3">
                  <StatCard label="Total Anime" value={matchStats.anime.total} />
                  <StatCard label="Avec TMDB" value={matchStats.anime.matched} color="text-green-400" />
                  <StatCard label="Sans streams" value={matchStats.anime.unmatched} color="text-red-400" />
                  <StatCard label="Embeds anime" value={stats?.anime.totalEmbeds || 0} color="text-blue-400" />
                </div>
              )}

              <Separator />

              <section>
                <h3 className="text-base font-semibold text-foreground flex items-center gap-2 mb-4">
                  <Icon name="zap" className="h-5 w-5 text-muted-foreground" /> Sync AniList
                </h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="text-sm text-muted-foreground mb-1.5 block"><Icon name="trending-up" className="h-4 w-4 inline mr-1" />Trending</label>
                      <Input type="number" min={1} max={20} value={trendingPages}
                        onChange={(e) => setTrendingPages(Math.max(1, Math.min(20, Number(e.target.value) || 1)))} className="h-11 text-base" />
                    </div>
                    <div>
                      <label className="text-sm text-muted-foreground mb-1.5 block"><Icon name="arrow-down-up" className="h-4 w-4 inline mr-1" />Populaire</label>
                      <Input type="number" min={1} max={20} value={popularPages}
                        onChange={(e) => setPopularPages(Math.max(1, Math.min(20, Number(e.target.value) || 1)))} className="h-11 text-base" />
                    </div>
                    <div>
                      <label className="text-sm text-muted-foreground mb-1.5 block"><Icon name="star" className="h-4 w-4 inline mr-1" />Top Notes</label>
                      <Input type="number" min={1} max={20} value={topRatedPages}
                        onChange={(e) => setTopRatedPages(Math.max(1, Math.min(20, Number(e.target.value) || 1)))} className="h-11 text-base" />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground mb-2 block">Genres</label>
                    <div className="flex flex-wrap gap-2">
                      {ADMIN_GENRES.map((genre) => (
                        <Badge key={genre} variant={selectedGenres.includes(genre) ? "default" : "outline"}
                          className={`cursor-pointer text-sm px-3 py-1 transition-colors ${selectedGenres.includes(genre) ? "bg-red-600 text-white hover:bg-red-700 border-red-600" : "border-border text-muted-foreground hover:border-red-400 hover:text-red-400"}`}
                          onClick={() => toggleGenre(genre)}>{genre}</Badge>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm text-muted-foreground mb-1.5 block">Max Saisons</label>
                      <Input type="number" min={1} max={20} value={maxSeasons}
                        onChange={(e) => setMaxSeasons(Math.max(1, Math.min(20, Number(e.target.value) || 1)))} className="h-11 text-base" />
                    </div>
                    <div>
                      <label className="text-sm text-muted-foreground mb-1.5 block">Max Eps/Saison</label>
                      <Input type="number" min={1} max={50} value={maxEpsPerSeason}
                        onChange={(e) => setMaxEpsPerSeason(Math.max(1, Math.min(50, Number(e.target.value) || 1)))} className="h-11 text-base" />
                    </div>
                  </div>
                </div>
              </section>

              <div className="rounded-xl border border-dashed border-border bg-card/50 p-4 text-center">
                <p className="text-sm text-muted-foreground mb-1">Estimation</p>
                <p className="text-lg font-bold">≈ <span className="text-red-400 text-xl">{estimatedCount}</span> <span className="text-base text-muted-foreground">anime</span></p>
              </div>

              <Button onClick={handleSync} disabled={syncLoading} className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold h-12 text-base">
                {syncLoading ? <Icon name="loader" className="h-5 w-5 mr-2 animate-spin" /> : <Icon name="play" className="h-5 w-5 mr-2" />}
                {syncLoading ? "Synchronisation..." : "Sync AniList"}
              </Button>

              {syncResult && (
                <div className="rounded-xl border border-green-500/30 bg-green-500/10 p-4 text-base space-y-1.5">
                  <p className="font-medium text-green-400 flex items-center gap-1.5"><Icon name="check" className="h-4 w-4" /> Sync terminé en {syncResult.elapsed}</p>
                  <p className="text-muted-foreground">Créés: <span className="text-green-400">{syncResult.created}</span> · MAJ: <span className="text-yellow-400">{syncResult.updated}</span> · Embeds: <span className="text-blue-400">{syncResult.withEmbeds}</span></p>
                </div>
              )}

              <Separator />

              <section>
                <h3 className="text-base font-semibold text-foreground flex items-center gap-2 mb-4">
                  <Icon name="search" className="h-5 w-5 text-muted-foreground" /> Auto-Match TMDB
                  {matchStats?.tmdbKeyValid && <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-green-500/20 text-green-400 uppercase ml-1">AUTO</span>}
                </h3>
                <Button onClick={handleMatchTmdb} disabled={matchLoading || !matchStats?.tmdbKeyValid}
                  variant="outline" className="w-full border-orange-500/30 text-orange-400 hover:bg-orange-500/10 h-12 font-semibold text-base">
                  {matchLoading ? <Icon name="loader" className="h-5 w-5 mr-2 animate-spin" /> : <Icon name="zap" className="h-5 w-5 mr-2" />}
                  {matchLoading ? "Matching..." : `Matcher 100 anime (${matchStats?.anime.unmatched || "?"} restants)`}
                </Button>
                {matchResult && (
                  <div className="rounded-xl border border-green-500/30 bg-green-500/10 p-4 text-base space-y-1.5 mt-3">
                    <p className="font-medium text-green-400 flex items-center gap-1.5"><Icon name="check" className="h-4 w-4" /> {matchResult.matched}/{matchResult.processed} matchés</p>
                    {matchResult.remainingUnmatched > 0 && <p className="text-muted-foreground text-sm">Encore {matchResult.remainingUnmatched} restants. Relancez !</p>}
                  </div>
                )}
              </section>

              <Separator />
              <Button variant="outline" onClick={handleReset}
                className="w-full border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300 h-11 text-base">
                <Icon name="delete" className="h-5 w-5 mr-2" /> Réinitialiser les Anime
              </Button>
            </>
          )}

          {adminTab === "tmdb" && (
            <>
              {!matchStats?.tmdbKeyValid ? (
                <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-5 text-center">
                  <p className="text-red-400 font-medium mb-1.5 flex items-center gap-2"><Icon name="alert-02" className="h-5 w-5" /> TMDB non configuré</p>
                  <p className="text-sm text-muted-foreground">Ajoutez TMDB_API_KEY dans le fichier .env</p>
                </div>
              ) : (
                <>
                  <div className="rounded-xl border border-green-500/30 bg-green-500/5 p-4 mb-4">
                    <p className="text-sm text-green-400 font-medium flex items-center gap-1.5"><Icon name="badge-check" className="h-4 w-4" /> TMDB connecté — Prêt à importer</p>
                  </div>

                  <div className="space-y-4 mb-5">
                    <div>
                      <label className="text-sm text-muted-foreground mb-2 block">Source</label>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { id: "all", label: "Tout" }, { id: "trending", label: "Trending" },
                          { id: "popular", label: "Populaire" }, { id: "top_rated", label: "Top Notes" },
                          { id: "now_playing", label: "Au cinéma" }, { id: "upcoming", label: "À venir" },
                        ].map((s) => (
                          <button key={s.id} onClick={() => setTmdbSource(s.id)}
                            className={`px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${tmdbSource === s.id ? "bg-red-600 text-white shadow-sm" : "bg-muted text-muted-foreground hover:text-foreground"}`}>
                            {s.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-sm text-muted-foreground mb-1.5 block">Pages</label>
                        <Input type="number" min={1} max={20} value={tmdbPages}
                          onChange={(e) => setTmdbPages(Math.max(1, Math.min(20, Number(e.target.value) || 1)))} className="h-11 text-base" />
                      </div>
                      <div className="flex items-end">
                        <div className="rounded-xl border border-dashed border-border bg-card/50 p-3 text-center w-full">
                          <p className="text-xs text-muted-foreground">Estimation</p>
                          <p className="text-base font-bold text-red-400">≈ {tmdbPages * 20}+ items</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <section className="space-y-3">
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                      <Icon name="film" className="h-4 w-4" /> Films
                    </h3>
                    <Button onClick={() => handleTmdbSync("movies")} disabled={tmdbSyncLoading}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold h-12 text-base">
                      {tmdbSyncLoading ? <Icon name="loader" className="h-5 w-5 mr-2 animate-spin" /> : <Icon name="film" className="h-5 w-5 mr-2" />}
                      {tmdbSyncLoading ? "Import..." : "Importer des Films"}
                    </Button>
                  </section>

                  <Separator />

                  <section className="space-y-3">
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                      <Icon name="tv" className="h-4 w-4" /> Séries
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-sm text-muted-foreground mb-1.5 block">Max Saisons</label>
                        <Input type="number" min={1} max={50} value={seriesMaxSeasons}
                          onChange={(e) => setSeriesMaxSeasons(Math.max(1, Math.min(50, Number(e.target.value) || 1)))} className="h-11 text-base" />
                      </div>
                      <div>
                        <label className="text-sm text-muted-foreground mb-1.5 block">Max Eps/Saison</label>
                        <Input type="number" min={1} max={50} value={seriesMaxEps}
                          onChange={(e) => setSeriesMaxEps(Math.max(1, Math.min(50, Number(e.target.value) || 1)))} className="h-11 text-base" />
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                      <input type="checkbox" id="regen-embeds" checked={regenerateEmbeds}
                        onChange={(e) => setRegenerateEmbeds(e.target.checked)}
                        className="h-4 w-4 rounded border-border accent-red-600" />
                      <label htmlFor="regen-embeds" className="text-sm text-muted-foreground cursor-pointer">
                        Régénérer les embeds (supprime et recrée tous les liens streaming)
                      </label>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      💡 Le vrai nombre de saisons est récupéré depuis TMDB. Cochez la case si vos séries n'ont que S1E1-E3.
                    </p>
                    <Button onClick={() => handleTmdbSync("series")} disabled={tmdbSyncLoading}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold h-12 text-base">
                      {tmdbSyncLoading ? <Icon name="loader" className="h-5 w-5 mr-2 animate-spin" /> : <Icon name="tv" className="h-5 w-5 mr-2" />}
                      {tmdbSyncLoading ? "Import..." : "Importer des Séries"}
                    </Button>
                  </section>

                  {tmdbSyncResult && (
                    <div className="rounded-xl border border-green-500/30 bg-green-500/10 p-4 text-base space-y-1.5">
                      <p className="font-medium text-green-400 flex items-center gap-1.5"><Icon name="check" className="h-4 w-4" /> {tmdbSyncResult.type === "movie" ? "Films" : "Séries"} terminé</p>
                      <p className="text-muted-foreground">
                        Créés: <span className="text-green-400">{tmdbSyncResult.created}</span> ·
                        MAJ: <span className="text-yellow-400">{tmdbSyncResult.updated}</span> ·
                        Embeds: <span className="text-blue-400">{tmdbSyncResult.withEmbeds}</span>
                      </p>
                      {tmdbSyncResult.embedsDeleted > 0 && (
                        <p className="text-muted-foreground">
                          Embeds supprimés: <span className="text-orange-400">{tmdbSyncResult.embedsDeleted}</span> (régénérés)
                        </p>
                      )}
                    </div>
                  )}
                </>
              )}
            </>
          )}

          {adminTab === "images" && (
            <>
              {imageFixStats ? (
                <div className="grid grid-cols-2 gap-3 mb-5">
                  <StatCard label="Total contenus" value={imageFixStats.total} />
                  <StatCard label="Avec TMDB ID" value={imageFixStats.withTmdbId} color="text-green-400" />
                  <StatCard label="Posters cassés" value={imageFixStats.brokenPosters} color="text-red-400" />
                  <StatCard label="Sans poster" value={imageFixStats.noPosters} color="text-orange-400" />
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3 mb-5">
                  {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
                </div>
              )}

              {imageFixStats && imageFixStats.needsFix > 0 && (
                <>
                  <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/5 p-4 mb-4">
                    <p className="text-sm text-yellow-400 font-medium mb-1.5 flex items-center gap-1.5"><Icon name="warning" className="h-4 w-4" /> {imageFixStats.needsFix} images à corriger</p>
                    <p className="text-sm text-muted-foreground">Télécharge les vrais posters/backdrops depuis TMDB.</p>
                  </div>
                  <Button onClick={handleFixImages} disabled={fixLoading}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold h-12 text-base">
                    {fixLoading ? <Icon name="loader" className="h-5 w-5 mr-2 animate-spin" /> : <Icon name="monitor" className="h-5 w-5 mr-2" />}
                    {fixLoading ? "Correction..." : "Corriger les images"}
                  </Button>
                </>
              )}

              {fixResult && (
                <div className="rounded-xl border border-green-500/30 bg-green-500/10 p-4 text-base space-y-1.5 mt-3">
                  <p className="font-medium text-green-400 flex items-center gap-1.5"><Icon name="check" className="h-4 w-4" /> Images corrigées</p>
                  <p className="text-muted-foreground">Fixées: <span className="text-green-400">{fixResult.fixed}</span> · OK: <span>{fixResult.alreadyGood}</span> · NF: <span className="text-red-400">{fixResult.notFound}</span></p>
                </div>
              )}

              {imageFixStats && imageFixStats.needsFix === 0 && (
                <div className="rounded-xl border border-green-500/30 bg-green-500/5 p-5 text-center">
                  <p className="text-green-400 font-medium flex items-center gap-2 justify-center text-base"><Icon name="badge-check" className="h-5 w-5" /> Toutes les images sont OK !</p>
                </div>
              )}
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}