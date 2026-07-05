"use client";

import { useEffect } from "react";
import { useAppStore } from "@/store/app-store";
import { AnimatePresence } from "framer-motion";
import { Header } from "@/components/header";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";
import { SearchOverlay } from "@/components/search-overlay";
import { HomeView } from "@/components/home-view";
import { BrowseView } from "@/components/browse-view";
import { DetailView } from "@/components/detail-view";
import { FavoritesView } from "@/components/favorites-view";
import { Footer } from "@/components/footer";
import { PreviewModal } from "@/components/preview-modal";
import { MangaReader } from "@/components/manga-reader";
import { RedirectBlocker } from "@/components/redirect-blocker";

export default function Page() {
  const {
    currentView,
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
    initWatchHistory,
    selectedContentId,
    contentDetail,
    addToWatchHistory,
  } = useAppStore();

  // Init favorites from localStorage
  useEffect(() => {
    initFavorites();
    initWatchHistory();
  }, [initFavorites, initWatchHistory]);

  // Scroll to top on view change (like Netflix/YouTube)
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [currentView, selectedContentId]);

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

  // Track watch history when content detail is loaded
  useEffect(() => {
    if (selectedContentId && contentDetail) {
      addToWatchHistory({
        id: contentDetail.id,
        title: contentDetail.title,
        posterUrl: contentDetail.posterUrl,
        type: contentDetail.type,
      });
    }
  }, [selectedContentId, contentDetail, addToWatchHistory]);

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <RedirectBlocker />
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
      <PreviewModal />
      <MangaReader />
    </div>
  );
}