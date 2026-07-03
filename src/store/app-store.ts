import { create } from "zustand";

export type ContentType = "all" | "movie" | "series" | "anime" | "manga";

export interface ContentItem {
  id: string;
  tmdbId: number | null;
  anilistId: number | null;
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

export interface HostConfig {
  label: string;
  color: string;
  icon: string;
  langs?: string[];
}

export interface EmbedSource {
  id: string;
  serverName: string;
  serverType: string;
  hostProvider: string;
  url: string;
  lang: string;
  quality: string | null;
  isActive: boolean;
  episode: number | null;
  season: number | null;
  hostConfig?: HostConfig;
}

export interface EmbedGroup {
  label: string;
  season: number | null;
  episode: number | null;
  embeds: EmbedSource[];
}

export interface ContentDetail extends ContentItem {
  embeds: EmbedSource[];
  embedGroups: EmbedGroup[];
  hostProviders: HostConfig[];
  categories: { name: string; slug: string }[];
  related: ContentItem[];
}

// Load favorites from localStorage
function loadFavorites(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem("metflix-favorites");
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveFavorites(favorites: string[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem("metflix-favorites", JSON.stringify(favorites));
  } catch {
    // ignore
  }
}

interface AppState {
  currentView: "home" | "browse" | "detail" | "favorites";
  selectedType: ContentType;
  selectedCategory: string | null;
  selectedSort: string;
  selectedGenre: string | null;
  selectedYearFrom: number | null;
  selectedYearTo: number | null;
  selectedLang: string | null; // "vostfr", "vf", or null (all)
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
  browseLoading: boolean;
  categories: { id: string; name: string; slug: string; type: string; contentCount: number }[];
  categoriesByType: Record<string, { id: string; name: string; slug: string; type: string; contentCount: number }[]>;
  contentDetail: ContentDetail | null;
  searchResults: ContentItem[];
  currentEmbed: EmbedSource | null;
  favorites: string[];
  mangaReaderOpen: boolean;
  mangaReaderPages: string[];
  mangaReaderCurrentPage: number;
  mangaReaderChapterTitle: string;
  mangaReaderChapters: { id: string; chapter: string | null; title: string | null; volume: string | null; pages: number; publishAt: string | null; readableAt: string | null }[];
  previewItem: ContentItem | null;
  showPreview: boolean;

  // Actions
  setView: (view: "home" | "browse" | "detail" | "favorites") => void;
  setSelectedType: (type: ContentType) => void;
  setSelectedCategory: (category: string | null) => void;
  setSelectedSort: (sort: string) => void;
  setSelectedGenre: (genre: string | null) => void;
  setSelectedYearFrom: (year: number | null) => void;
  setSelectedYearTo: (year: number | null) => void;
  setSelectedLang: (lang: string | null) => void;
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
  setBrowseLoading: (loading: boolean) => void;
  setCategories: (cats: any[]) => void;
  setContentDetail: (detail: ContentDetail | null) => void;
  setSearchResults: (results: ContentItem[]) => void;
  setCurrentEmbed: (embed: EmbedSource | null) => void;
  resetBrowse: () => void;
  toggleFavorite: (id: string) => void;
  isFavorite: (id: string) => boolean;
  initFavorites: () => void;
  openMangaReader: (pages: string[], title: string, chapters: { id: string; chapter: string | null; title: string | null; volume: string | null; pages: number; publishAt: string | null; readableAt: string | null }[]) => void;
  closeMangaReader: () => void;
  setMangaReaderPage: (page: number) => void;
  openPreview: (item: ContentItem) => void;
  closePreview: () => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  currentView: "home",
  selectedType: "all",
  selectedCategory: null,
  selectedSort: "rating",
  selectedGenre: null,
  selectedYearFrom: null,
  selectedYearTo: null,
  selectedLang: null,
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
  browseLoading: false,
  categories: [],
  categoriesByType: {},
  contentDetail: null,
  searchResults: [],
  currentEmbed: null,
  favorites: [],
  mangaReaderOpen: false,
  mangaReaderPages: [],
  mangaReaderCurrentPage: 0,
  mangaReaderChapterTitle: "",
  mangaReaderChapters: [],
  previewItem: null,
  showPreview: false,

  setView: (view) => set({ currentView: view }),
  setSelectedType: (type) => set({ selectedType: type, browsePage: 1, selectedCategory: null, browseContent: [] }),
  setSelectedCategory: (category) => set({ selectedCategory: category, browsePage: 1, browseContent: [] }),
  setSelectedSort: (sort) => set({ selectedSort: sort, browsePage: 1, browseContent: [] }),
  setSelectedGenre: (genre) => set({ selectedGenre: genre, browsePage: 1, browseContent: [] }),
  setSelectedYearFrom: (year) => set({ selectedYearFrom: year, browsePage: 1, browseContent: [] }),
  setSelectedYearTo: (year) => set({ selectedYearTo: year, browsePage: 1, browseContent: [] }),
  setSelectedLang: (lang) => set({ selectedLang: lang, browsePage: 1, browseContent: [] }),
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
  setBrowseLoading: (loading) => set({ browseLoading: loading }),
  setCategories: (cats) => {
    const byType: Record<string, any[]> = {};
    for (const c of cats) {
      const t = c.type || "all";
      if (!byType[t]) byType[t] = [];
      byType[t].push(c);
    }
    set({ categories: cats, categoriesByType: byType });
  },
  setContentDetail: (detail) => set({ contentDetail: detail, currentEmbed: null }),
  setSearchResults: (results) => set({ searchResults: results }),
  setCurrentEmbed: (embed) => set({ currentEmbed: embed }),
  resetBrowse: () => set({ browseContent: [], browseTotal: 0, browsePage: 1 }),

  initFavorites: () => set({ favorites: loadFavorites() }),
  toggleFavorite: (id) => {
    const current = get().favorites;
    const next = current.includes(id) ? current.filter((fid) => fid !== id) : [...current, id];
    set({ favorites: next });
    saveFavorites(next);
  },
  isFavorite: (id) => get().favorites.includes(id),
  openMangaReader: (pages, title, chapters) => set({ mangaReaderOpen: true, mangaReaderPages: pages, mangaReaderCurrentPage: 0, mangaReaderChapterTitle: title, mangaReaderChapters: chapters || [] }),
  closeMangaReader: () => set({ mangaReaderOpen: false, mangaReaderPages: [], mangaReaderCurrentPage: 0, mangaReaderChapterTitle: "" }),
  setMangaReaderPage: (page) => set({ mangaReaderCurrentPage: page }),
  openPreview: (item) => set({ previewItem: item, showPreview: true }),
  closePreview: () => set({ previewItem: null, showPreview: false }),
}));