"use client";

import { Skeleton } from "@/components/ui/skeleton";

// ==================== SKELETON CARD ====================

export function SkeletonCard() {
  return (
    <div className="flex-shrink-0 w-[150px] sm:w-[170px]">
      <Skeleton className="w-full aspect-[2/3] rounded-lg" />
      <Skeleton className="h-4 w-3/4 mt-2" />
      <Skeleton className="h-3 w-1/2 mt-1.5" />
    </div>
  );
}

export function SkeletonGrid() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
      {Array.from({ length: 12 }).map((_, i) => (
        <div key={i}>
          <Skeleton className="w-full aspect-[2/3] rounded-lg" />
          <Skeleton className="h-4 w-3/4 mt-2" />
          <Skeleton className="h-3 w-1/2 mt-1.5" />
        </div>
      ))}
    </div>
  );
}