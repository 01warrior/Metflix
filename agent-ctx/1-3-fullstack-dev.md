---
Task ID: 1-3
Agent: Full-stack Developer
Task: Build MangaDex integration with in-site manga reader

Work Log:
- Created 3 API routes for MangaDex integration:
  - `/api/manga/search` - searches MangaDex by title, returns top 5 with cover, status, year, languages
  - `/api/manga/chapters` - fetches chapter list filtered by language, excludes external URLs and 0-page chapters
  - `/api/manga/pages` - gets page URLs from at-home server API, returns both low-res and HD arrays
- Updated Zustand store with manga reader state:
  - `mangaReaderOpen`, `mangaReaderPages`, `mangaReaderCurrentPage`, `mangaReaderChapterTitle`, `mangaReaderChapters`
  - Actions: `openMangaReader`, `closeMangaReader`, `setMangaReaderPage`
- Added MangaReader component (full-screen overlay):
  - Top bar: chapter title, page counter, close button
  - Left/right navigation arrows for page-by-page reading
  - Centered manga page image (max 800px, auto height)
  - Bottom bar: prev/next chapter buttons, page slider
  - Keyboard support: ArrowLeft/ArrowRight for pages, Escape to close
  - Body scroll lock when reader is open
  - Image error handling with placeholder
  - Loading spinner during chapter transitions
- Modified DetailView for manga type:
  - Added MangaDex state: `mangadexId`, `mangadexChapters`, `mangadexLoading`, `mangadexError`
  - Auto-searches MangaDex when manga detail loads (tries French first, falls back to English)
  - Replaced "Lire en ligne" AniList link with dynamic MangaDex chapter list
  - Shows loading spinner during MangaDex search
  - Falls back to AniList link when manga not found on MangaDex
  - Each chapter button shows: chapter number, title, page count with book icon
  - Chapter list in scrollable grid (max-h-96)
- Added MangaReader to main Page component render
- Verified all 3 API routes return correct data (Berserk test: 100 FR chapters, 28 pages per chapter)
- Lint passes clean (0 errors, 0 warnings)
- Dev server compiles without errors

Stage Summary:
- Complete MangaDex integration with in-site reader
- 3 new API routes proxying MangaDex from server
- Full-screen manga reader with keyboard navigation, page slider, chapter navigation
- Automatic MangaDex search when viewing any manga detail page
- French chapters preferred, English fallback
- AniList link preserved as fallback when MangaDex has no results
- All existing film/series/anime functionality untouched
