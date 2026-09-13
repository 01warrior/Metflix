"use client";

import { useAppStore, type ContentType } from "@/store/app-store";
import { Icon } from "@/lib/icons";

// ==================== MOBILE BOTTOM NAV ====================

export function MobileBottomNav() {
  const { currentView, setView, setSelectedType, selectedType } = useAppStore();

  if (currentView === "detail") return null;

  const tabs = [
    { label: "Accueil", view: "home" as const, icon: "home" as const },
    { label: "Films", type: "movie" as ContentType, icon: "film" as const },
    { label: "Séries", type: "series" as ContentType, icon: "tv" as const },
    { label: "Anime", type: "anime" as ContentType, icon: "sparkles" as const },
    { label: "Manga", type: "manga" as ContentType, icon: "book-open" as const },
  ];

  return (
    <nav className="md:hidden mobile-bottom-nav fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around h-14">
      {tabs.map((tab) => {
        const isActive =
          (tab.view && currentView === tab.view) ||
          (tab.type && currentView === "browse" && selectedType === tab.type);
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
              name={tab.icon}
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