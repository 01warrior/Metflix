import { create } from "zustand";

export type ContentType = "all" | "movie" | "series" | "anime" | "manga";

export interface ContentItem {
  id: string;
  tmdbId: number | null;
  title: string;
  titleFr: string | null;
  overview: string | null;
  overviewFr: string | null;
  posterUrl: string;
  backdropUrl: string;
  releaseDate: string | null;
  rating: number;
  voteCount: number;
  type: string;
  year: number | null;
  genres: string | null;
  runtime: number | null;
  seasons: number | null;
  featured: boolean;
}

export interface EmbedSource {
  id: string;
  serverName: string;
  serverType: string;
  url: string;
  lang: string;
  quality: string | null;
  isActive: boolean;
  episode: number | null;
  season: number | null;
}

export interface ContentDetail extends ContentItem {
  embeds: EmbedSource[];
  categories: { name: string; slug: string }[];
  related: ContentItem[];
  embedGroups: { label: string; season: number | null; episode: number | null; embeds: EmbedSource[] }[];
}

// Load favorites from localStorage
function loadFavorites(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem("streamvibe-favorites");
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

// Save favorites to localStorage
function saveFavorites(favorites: string[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem("streamvibe-favorites", JSON.stringify(favorites));
  } catch {
    // ignore
  }
}

interface AppState {
  currentView: "home" | "browse" | "detail";
  selectedType: ContentType;
  selectedCategory: string | null;
  selectedSort: string;
  searchQuery: string;
  selectedContentId: string | null;
  showSearch: boolean;
  featured: ContentItem[];
  trendingMovies: ContentItem[];
  trendingSeries: ContentItem[];
  trendingAnime: ContentItem[];
  trendingManga: ContentItem[];
  latestContent: ContentItem[];
  browseContent: ContentItem[];
  browseTotal: number;
  browsePage: number;
  categories: { id: string; name: string; slug: string; type: string; contentCount: number }[];
  categoriesByType: Record<string, { id: string; name: string; slug: string; type: string; contentCount: number }[]>;
  contentDetail: ContentDetail | null;
  searchResults: ContentItem[];
  currentEmbed: EmbedSource | null;
  favorites: string[];

  setView: (view: "home" | "browse" | "detail") => void;
  setSelectedType: (type: ContentType) => void;
  setSelectedCategory: (category: string | null) => void;
  setSelectedSort: (sort: string) => void;
  setSearchQuery: (query: string) => void;
  setSelectedContentId: (id: string | null) => void;
  setShowSearch: (show: boolean) => void;
  setFeatured: (items: ContentItem[]) => void;
  setTrendingMovies: (items: ContentItem[]) => void;
  setTrendingSeries: (items: ContentItem[]) => void;
  setTrendingAnime: (items: ContentItem[]) => void;
  setTrendingManga: (items: ContentItem[]) => void;
  setLatestContent: (items: ContentItem[]) => void;
  setBrowseContent: (items: ContentItem[]) => void;
  setBrowseTotal: (total: number) => void;
  setBrowsePage: (page: number) => void;
  setCategories: (cats: any[]) => void;
  setContentDetail: (detail: ContentDetail | null) => void;
  setSearchResults: (results: ContentItem[]) => void;
  setCurrentEmbed: (embed: EmbedSource | null) => void;
  resetBrowse: () => void;
  toggleFavorite: (id: string) => void;
  isFavorite: (id: string) => boolean;
  initFavorites: () => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  currentView: "home",
  selectedType: "all",
  selectedCategory: null,
  selectedSort: "rating",
  searchQuery: "",
  selectedContentId: null,
  showSearch: false,
  featured: [],
  trendingMovies: [],
  trendingSeries: [],
  trendingAnime: [],
  trendingManga: [],
  latestContent: [],
  browseContent: [],
  browseTotal: 0,
  browsePage: 1,
  categories: [],
  categoriesByType: {},
  contentDetail: null,
  searchResults: [],
  currentEmbed: null,
  favorites: [],

  setView: (view) => set({ currentView: view }),
  setSelectedType: (type) => set({ selectedType: type, browsePage: 1, selectedCategory: null }),
  setSelectedCategory: (category) => set({ selectedCategory: category, browsePage: 1 }),
  setSelectedSort: (sort) => set({ selectedSort: sort, browsePage: 1 }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setSelectedContentId: (id) => set({ selectedContentId: id }),
  setShowSearch: (show) => set({ showSearch: show }),
  setFeatured: (items) => set({ featured: items }),
  setTrendingMovies: (items) => set({ trendingMovies: items }),
  setTrendingSeries: (items) => set({ trendingSeries: items }),
  setTrendingAnime: (items) => set({ trendingAnime: items }),
  setTrendingManga: (items) => set({ trendingManga: items }),
  setLatestContent: (items) => set({ latestContent: items }),
  setBrowseContent: (items) => set({ browseContent: items }),
  setBrowseTotal: (total) => set({ browseTotal: total }),
  setBrowsePage: (page) => set({ browsePage: page }),
  setCategories: (cats) => {
    const byType: Record<string, any[]> = {};
    for (const c of cats) {
      const t = c.type || "all";
      if (!byType[t]) byType[t] = [];
      byType[t].push(c);
    }
    set({ categories: cats, categoriesByType: byType });
  },
  setContentDetail: (detail) => set({ contentDetail: detail }),
  setSearchResults: (results) => set({ searchResults: results }),
  setCurrentEmbed: (embed) => set({ currentEmbed: embed }),
  resetBrowse: () => set({ browseContent: [], browseTotal: 0, browsePage: 1 }),

  initFavorites: () => {
    set({ favorites: loadFavorites() });
  },

  toggleFavorite: (id) => {
    const current = get().favorites;
    const next = current.includes(id)
      ? current.filter((fid) => fid !== id)
      : [...current, id];
    set({ favorites: next });
    saveFavorites(next);
  },

  isFavorite: (id) => {
    return get().favorites.includes(id);
  },
}));