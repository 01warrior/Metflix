"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Hls from "hls.js";
import { useAppStore, type Channel } from "@/store/app-store";
import { Icon } from "@/lib/icons";

// Channel logo fallback → colored initial badge
const CATEGORY_COLORS: Record<string, string> = {
  Infos: "bg-red-600",
  International: "bg-blue-600",
  Culture: "bg-purple-600",
  Sport: "bg-emerald-600",
  Kid: "bg-amber-500",
  Autres: "bg-zinc-600",
};

function categoryColor(cat: string) {
  return CATEGORY_COLORS[cat] || CATEGORY_COLORS.Autres;
}

function LivePlayer({ channel }: { channel: Channel }) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [status, setStatus] = useState<"loading" | "playing" | "error">("loading");

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    setStatus("loading");

    let hls: Hls | null = null;
    let destroyed = false;

    const onPlaying = () => {
      if (!destroyed) setStatus("playing");
    };

    const onError = () => {
      if (!destroyed) setStatus((s) => (s === "playing" ? s : "error"));
    };

    if (Hls.isSupported()) {
      hls = new Hls({ liveDurationInfinity: true });
      hls.loadSource(channel.url);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        if (!destroyed) video.play().catch(onError);
      });
      hls.on(Hls.Events.ERROR, (_evt, data) => {
        if (!data.fatal) return;
        if (data.type === Hls.ErrorTypes.NETWORK_ERROR) hls?.startLoad();
        else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) hls?.recoverMediaError();
        else onError();
      });
      video.addEventListener("playing", onPlaying);
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      // Safari native HLS
      video.src = channel.url;
      video.play().catch(onError);
      video.addEventListener("playing", onPlaying);
    } else {
      setStatus("error");
    }

    const handleLoadedData = () => video.play().catch(() => {});

    video.addEventListener("loadeddata", handleLoadedData);

    return () => {
      destroyed = true;
      if (hls) hls.destroy();
      video.removeEventListener("playing", onPlaying);
      video.removeEventListener("loadeddata", handleLoadedData);
      video.removeAttribute("src");
      video.load();
    };
  }, [channel.url]);

  return (
    <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden ring-1 ring-white/10 shadow-lg shadow-black/50">
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full"
        controls
        autoPlay
        playsInline
      />
      {status !== "playing" && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {status === "loading" ? (
            <div className="flex flex-col items-center gap-3">
              <Icon name="loader" className="h-8 w-8 animate-spin text-white/80" />
              <span className="text-xs text-white/50">Connexion au flux en direct...</span>
            </div>
          ) : (
            <div className="text-center px-4">
              <Icon name="alert-01" className="h-10 w-10 text-red-400/80 mx-auto mb-3" />
              <p className="text-white/80 text-sm font-medium mb-1">
                Flux indisponible
              </p>
              <p className="text-white/50 text-xs max-w-xs">
                Ce flux en direct ne répond plus (géo-blocage ou changement d&apos;URL).
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function TvView() {
  const { channels, setChannels, activeChannel, setActiveChannel, setView } = useAppStore();
  const [selectedCategory, setSelectedCategory] = useState("Toutes");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (channels.length > 0) return;
    const fetchChannels = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/channels");
        const data = await res.json();
        setChannels(data.data || []);
      } catch {
        setChannels([]);
      } finally {
        setLoading(false);
      }
    };
    fetchChannels();
  }, [channels.length, setChannels]);

  const categories = ["Toutes", ...Array.from(new Set(channels.map((c) => c.category)))];
  const visible = selectedCategory === "Toutes" ? channels : channels.filter((c) => c.category === selectedCategory);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="page-content max-w-7xl mx-auto px-4 md:px-8 py-6"
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="w-9 h-9 rounded-lg bg-red-600/20 flex items-center justify-center">
          <Icon name="tv" className="h-5 w-5 text-red-500" />
        </div>
        <div>
          <h1 className="text-xl md:text-2xl font-bold">Chaînes TV</h1>
          <p className="text-xs text-muted-foreground">Flux en direct gratuits (HLS)</p>
        </div>
      </div>

      {/* Live player */}
      {activeChannel && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className="relative flex h-2.5 w-2.5 flex-shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-600" />
              </span>
              <h2 className="font-semibold text-sm truncate">{activeChannel.name}</h2>
            </div>
            <button
              onClick={() => setActiveChannel(null)}
              className="flex-shrink-0 px-2.5 py-1 rounded-md bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground text-xs font-medium transition-colors flex items-center gap-1"
            >
              <Icon name="x" className="h-3 w-3" />
              Fermer
            </button>
          </div>
          <LivePlayer channel={activeChannel} />
        </div>
      )}

      {/* Category chips */}
      <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1 mb-4">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              selectedCategory === cat
                ? "bg-red-600 text-white"
                : "bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Channel grid */}
      {loading && channels.length === 0 ? (
        <div className="flex items-center justify-center py-20">
          <Icon name="loader" className="h-8 w-8 animate-spin text-muted-foreground/50" />
        </div>
      ) : visible.length === 0 ? (
        <div className="text-center py-20">
          <Icon name="tv" className="h-12 w-12 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-muted-foreground">Aucune chaîne disponible.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {visible.map((channel) => {
            const isActive = activeChannel?.id === channel.id;
            return (
              <button
                key={channel.id}
                onClick={() => setActiveChannel(isActive ? null : channel)}
                className={`group relative rounded-xl overflow-hidden ring-1 transition-all hover:scale-[1.02] active:scale-[0.98] ${
                  isActive
                    ? "ring-red-600 bg-red-600/10 shadow-lg shadow-red-900/30"
                    : "ring-white/10 bg-muted hover:bg-muted/70 hover:ring-white/25"
                }`}
              >
                <div className="aspect-video flex items-center justify-center">
                  {channel.logo ? (
                    <img
                      src={channel.logo}
                      alt={channel.name}
                      loading="lazy"
                      onError={(e) => ((e.currentTarget as HTMLImageElement).style.display = "none")}
                      className="max-h-14 max-w-[80%] object-contain"
                    />
                  ) : (
                    <div
                      className={`w-14 h-14 rounded-2xl ${categoryColor(channel.category)} flex items-center justify-center text-white font-bold text-xl shadow-lg`}
                    >
                      {channel.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/80 via-black/20 to-transparent p-2.5">
                  <div className="flex items-center gap-1.5 min-w-0">
                    {isActive && (
                      <span className="relative flex h-1.5 w-1.5 flex-shrink-0">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-600" />
                      </span>
                    )}
                    <span className="text-xs font-semibold text-white truncate">{channel.name}</span>
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveChannel(isActive ? null : channel);
                  }}
                  className={`absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center text-white transition-all ${
                    isActive
                      ? "bg-red-600 text-white"
                      : "bg-black/50 opacity-0 group-hover:opacity-100 hover:bg-red-600"
                  }`}
                  aria-label={`Regarder ${channel.name}`}
                >
                  <Icon name={isActive ? "x" : "play-circle"} className="h-4 w-4" />
                </button>
              </button>
            );
          })}
        </div>
      )}

      <AnimatePresence>
        {channels.length === 0 && !loading && (
          <div className="mt-8 p-4 rounded-lg bg-muted/60 text-center">
            <p className="text-sm text-muted-foreground">
              Aucune chaîne enregistrée. Lancez <code className="text-red-400">npm run db:seed-channels</code> pour importer les flux gratuits.
            </p>
          </div>
        )}
      </AnimatePresence>

      <p className="text-center text-[11px] text-muted-foreground/60 mt-8">
        Flux publics fournis par les diffuseurs. Ils peuvent cesser d&apos;être disponibles à tout moment.
      </p>

      <button
        onClick={() => setView("home")}
        className="mt-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <Icon name="chevron-left" className="h-4 w-4" />
        Retour à l&apos;accueil
      </button>
    </motion.div>
  );
}