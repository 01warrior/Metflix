"use client";

import { useRef } from "react";
import { useAppStore, type ContentItem, type ContentType } from "@/store/app-store";
import { Icon } from "@/lib/icons";
import { ContentCard } from "./content-card";

// ==================== CONTENT ROW ====================

export function ContentRow({
  title,
  items,
  seeAllType,
}: {
  title: string;
  items: ContentItem[];
  seeAllType?: ContentType;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const { setView, setSelectedType } = useAppStore();

  const scroll = (dir: "left" | "right") => {
    if (!scrollRef.current) return;
    const amount = 600;
    scrollRef.current.scrollBy({
      left: dir === "left" ? -amount : amount,
      behavior: "smooth",
    });
  };

  if (!items.length) return null;

  return (
    <section className="mb-8">
      <div className="flex items-center justify-between mb-4 px-4 md:px-0">
        <h2 className="text-lg md:text-xl font-bold text-foreground">{title}</h2>
        {seeAllType && (
          <button
            onClick={() => {
              setSelectedType(seeAllType);
              setView("browse");
            }}
            className="text-sm text-red-400 hover:text-red-300 transition-colors"
          >
            Voir tout &rarr;
          </button>
        )}
      </div>
      <div className="relative group/row">
        <button
          onClick={() => scroll("left")}
          className="absolute left-0 top-0 bottom-0 z-10 w-10 flex items-center justify-center bg-gradient-to-r from-background to-transparent opacity-0 group-hover/row:opacity-100 transition-opacity"
          aria-label="Précédent"
        >
          <Icon name="chevron-left" className="h-6 w-6 text-foreground" />
        </button>
        <div
          ref={scrollRef}
          className="flex gap-3 overflow-x-auto hide-scrollbar px-4 md:px-0 pb-2"
        >
          {items.map((item) => (
            <div key={item.id} className="flex-shrink-0 w-[150px] sm:w-[170px]">
              <ContentCard item={item} />
            </div>
          ))}
        </div>
        <button
          onClick={() => scroll("right")}
          className="absolute right-0 top-0 bottom-0 z-10 w-10 flex items-center justify-center bg-gradient-to-l from-background to-transparent opacity-0 group-hover/row:opacity-100 transition-opacity"
          aria-label="Suivant"
        >
          <Icon name="chevron-right" className="h-6 w-6 text-foreground" />
        </button>
      </div>
    </section>
  );
}