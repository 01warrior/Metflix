"use client";

import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";
import {
  Search01Icon,
  PlayIcon,
  StarIcon,
  Film01Icon,
  Tv01Icon,
  BookOpen01Icon,
  HeartIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  Cancel01Icon,
  Home01Icon,
  ServerStack01Icon,
  Calendar01Icon,
  Menu01Icon,
  ArrowReloadHorizontalIcon,
  Clock01Icon,
  Loading02Icon,
  SparklesIcon,
  MonitorDotIcon,
  TrendingUpDownIcon,
  LayerIcon,
  Settings02Icon,
  RefreshIcon,
  DatabaseIcon,
  ZapIcon,
  Analytics01Icon,
  BookMarkedIcon,
  Books01Icon,
  Alert01Icon,
  Alert02Icon,
  BadgeCheckIcon,
  BadgeInfoIcon,
  Delete02Icon,
  Image01Icon,
  Loading01Icon,
  PlayCircleIcon,
  CheckIcon,
  Pulse01Icon,
  ArrowDown01Icon,
  ArrowUp01Icon,
  FilterIcon,
  Globe02Icon,
  Grid02Icon,
  Bookmark01Icon,
  Download01Icon,
  Share01Icon,
  Copy01Icon,
  Link01Icon,
  EyeIcon,
  Video01Icon,
  Camera01Icon,
  Activity01Icon,
  Notification01Icon,
  Shield01Icon,
  User02Icon,
  BellIcon,
} from "@hugeicons/core-free-icons";

// Icon name → icon data mapping
export const ICON_MAP: Record<string, IconSvgElement> = {
  search: Search01Icon,
  play: PlayIcon,
  "play-circle": PlayCircleIcon,
  star: StarIcon,
  film: Film01Icon,
  tv: Tv01Icon,
  "book-open": BookOpen01Icon,
  heart: HeartIcon,
  "chevron-left": ChevronLeftIcon,
  "chevron-right": ChevronRightIcon,
  x: Cancel01Icon,
  close: Cancel01Icon,
  home: Home01Icon,
  server: ServerStack01Icon,
  calendar: Calendar01Icon,
  menu: Menu01Icon,
  "rotate-ccw": ArrowReloadHorizontalIcon,
  clock: Clock01Icon,
  loader: Loading02Icon,
  sparkles: SparklesIcon,
  monitor: MonitorDotIcon,
  "arrow-down-up": TrendingUpDownIcon,
  layers: LayerIcon,
  settings: Settings02Icon,
  "refresh-cw": RefreshIcon,
  database: DatabaseIcon,
  zap: ZapIcon,
  "trending-up": Analytics01Icon,
  "book-marked": BookMarkedIcon,
  books: Books01Icon,
  "alert-01": Alert01Icon,
  "alert-02": Alert02Icon,
  warning: Alert01Icon,
  "badge-check": BadgeCheckIcon,
  "badge-info": BadgeInfoIcon,
  delete: Delete02Icon,
  trash: Delete02Icon,
  image: Image01Icon,
  check: CheckIcon,
  pulse: Pulse01Icon,
  "arrow-down": ArrowDown01Icon,
  "arrow-up": ArrowUp01Icon,
  filter: FilterIcon,
  globe: Globe02Icon,
  grid: Grid02Icon,
  bookmark: Bookmark01Icon,
  download: Download01Icon,
  share: Share01Icon,
  copy: Copy01Icon,
  link: Link01Icon,
  eye: EyeIcon,
  video: Video01Icon,
  camera: Camera01Icon,
  activity: Activity01Icon,
  notification: Notification01Icon,
  shield: Shield01Icon,
  user: User02Icon,
  bell: BellIcon,
};

// Simple Icon component that mimics Lucide's API
// Usage: <Icon name="search" className="h-5 w-5" />
// Also supports: <Icon name="star" fill="currentColor" />
interface IconProps {
  name: string;
  size?: number | string;
  className?: string;
  fill?: string;
  strokeWidth?: number;
  "aria-label"?: string;
}

export function Icon({ name, size, className, fill, strokeWidth, ...rest }: IconProps) {
  const iconData = ICON_MAP[name];
  if (!iconData) {
    return null;
  }
  return (
    <HugeiconsIcon
      icon={iconData}
      size={size}
      className={className}
      fill={fill}
      strokeWidth={strokeWidth}
      {...rest}
    />
  );
}

export default Icon;