"use client";

import { useEffect, useState } from "react";
import { useAppStore, type ContentType } from "@/store/app-store";
import { useTheme } from "next-themes";
import { Icon } from "@/lib/icons";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { AdminPanel } from "./admin-panel";

export function Header() {
  const { setView, setShowSearch, favorites, currentView, setSelectedType, selectedType } =
    useAppStore();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => { setMounted(true); }, []);

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
      className={`sticky top-0 z-50 w-full transition-all duration-300 ${
        scrolled
          ? "bg-background/95 backdrop-blur-md shadow-[0_1px_0_var(--border)]"
          : ""
      }`}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between h-16 px-4 header-text">
        {/* Logo */}
        <button
          onClick={() => setView("home")}
          className="flex items-center"
        >
          <div className="h-10 w-28 overflow-hidden rounded-lg flex items-center">
            <img src="/logo.png" alt="METFLIX" className="w-full h-full object-cover object-center" />
          </div>
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
                  ? "text-red-500 bg-red-500/10"
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
                ? "text-red-500 bg-red-500/10"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
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
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-muted transition-colors"
            aria-label={mounted ? (theme === "dark" ? "Thème clair" : "Thème sombre") : "Changer le thème"}
          >
            {mounted ? (
              <Icon name={theme === "dark" ? "sun" : "moon"} className="h-5 w-5 text-muted-foreground" />
            ) : (
              <span className="h-5 w-5 block" />
            )}
          </button>
          <button
            onClick={() => setAdminOpen(true)}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-muted transition-colors"
            aria-label="Administration"
          >
            <Icon name="settings" className="h-5 w-5 text-muted-foreground" />
          </button>
          <button
            onClick={() => setShowSearch(true)}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-muted transition-colors"
            aria-label="Rechercher"
          >
            <Icon name="search" className="h-5 w-5 text-muted-foreground" />
          </button>
          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen(true)}
            className="md:hidden w-10 h-10 flex items-center justify-center rounded-full hover:bg-muted transition-colors"
            aria-label="Menu"
          >
            <Icon name="menu" className="h-5.5 w-5.5 text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* Mobile menu sheet */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-72 bg-background border-border p-0">
          <SheetHeader className="px-4 pt-6 pb-4">
            <SheetTitle className="flex items-center gap-2">
              <span className="text-xl font-extrabold">
                <span className="text-foreground">MET</span>
                <span className="text-red-500">FLIX</span>
              </span>
            </SheetTitle>
            <SheetDescription>Streaming Libre</SheetDescription>
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