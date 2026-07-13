import { useCallback, useEffect, useRef, useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  RotateCcw,
  RotateCw,
  Settings,
  Loader2,
} from "lucide-react";

/**
 * Player de vídeo 100% personalizado.
 * Usa YouTube IFrame API apenas como fonte, mas oculta TODA a interface do YouTube
 * (logo, "assistir no YouTube", sugestões, cards, playlist, menu de contexto).
 * Todos os controles são renderizados pela UI custom — preto + vermelho.
 */

// ---------- helpers ----------
function extractId(url: string): string | null {
  if (!url) return null;
  const m =
    url.match(
      /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([A-Za-z0-9_-]{6,})/,
    ) ||
    url.match(/[?&]v=([A-Za-z0-9_-]{6,})/) ||
    url.match(/^([A-Za-z0-9_-]{6,})$/);
  return m ? m[1] : null;
}

function fmt(s: number): string {
  if (!isFinite(s) || s < 0) s = 0;
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = Math.floor(s % 60);
  const pad = (n: number) => n.toString().padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(sec)}` : `${m}:${pad(sec)}`;
}

// ---------- YT API singleton loader ----------
let ytApiPromise: Promise<any> | null = null;
function loadYTApi(): Promise<any> {
  if (typeof window === "undefined") return Promise.reject("ssr");
  const w = window as any;
  if (w.YT && w.YT.Player) return Promise.resolve(w.YT);
  if (ytApiPromise) return ytApiPromise;
  ytApiPromise = new Promise((resolve) => {
    const prev = w.onYouTubeIframeAPIReady;
    w.onYouTubeIframeAPIReady = () => {
      prev?.();
      resolve(w.YT);
    };
    if (!document.querySelector('script[data-yt-api]')) {
      const s = document.createElement("script");
      s.src = "https://www.youtube.com/iframe_api";
      s.async = true;
      s.dataset.ytApi = "1";
      document.head.appendChild(s);
    }
  });
  return ytApiPromise;
}

type Props = {
  open: boolean;
  onClose: () => void;
  videoUrl: string;
  title: string;
};

const SPEEDS = [0.5, 1, 1.5, 2] as const;
const QUALITIES = [
  { v: "auto", label: "Auto" },
  { v: "hd1080", label: "1080p" },
  { v: "hd720", label: "720p" },
  { v: "large", label: "480p" },
  { v: "medium", label: "360p" },
  { v: "small", label: "240p" },
] as const;

export function VideoPlayer({ open, onClose, videoUrl, title }: Props) {
  const videoId = extractId(videoUrl);
  const containerRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const hideTimer = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);

  const [ready, setReady] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [current, setCurrent] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [volume, setVolume] = useState(50);
  const [muted, setMuted] = useState(false);
  const [speed, setSpeed] = useState<number>(1);
  const [quality, setQuality] = useState<string>("auto");
  const [isFs, setIsFs] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [settingsTab, setSettingsTab] = useState<"speed" | "quality" | null>(null);

  // ---------- mount / destroy YT player ----------
  useEffect(() => {
    if (!open || !videoId) return;
    let destroyed = false;

    loadYTApi().then((YT) => {
      if (destroyed || !containerRef.current) return;
      playerRef.current = new YT.Player(containerRef.current, {
        videoId,
        playerVars: {
          autoplay: 1,
          controls: 0,
          modestbranding: 1,
          rel: 0,
          showinfo: 0,
          iv_load_policy: 3,
          disablekb: 1,
          fs: 0,
          playsinline: 1,
          cc_load_policy: 0,
          enablejsapi: 1,
          origin: window.location.origin,
        },
        host: "https://www.youtube-nocookie.com",
        events: {
          onReady: (e: any) => {
            setReady(true);
            setDuration(e.target.getDuration() || 0);
            try {
              e.target.setVolume(50);
              e.target.unMute();
            } catch {}
            setVolume(50);
            setMuted(false);
            try {
              e.target.playVideo();
            } catch {}
          },
          onStateChange: (e: any) => {
            // 1 playing, 2 paused, 0 ended, 3 buffering
            if (e.data === 1) setPlaying(true);
            else if (e.data === 2 || e.data === 0) setPlaying(false);
            if (e.data === 1) setDuration(e.target.getDuration() || 0);
          },
          onPlaybackRateChange: (e: any) => setSpeed(e.data ?? 1),
          onPlaybackQualityChange: (e: any) => {
            // YT pode forçar qualidade — só refletimos
            if (e.data) setQuality(e.data);
          },
        },
      });
    });

    return () => {
      destroyed = true;
      try {
        playerRef.current?.destroy?.();
      } catch {}
      playerRef.current = null;
      setReady(false);
      setPlaying(false);
      setCurrent(0);
      setDuration(0);
      setShowSettings(false);
      setSettingsTab(null);
    };
  }, [open, videoId]);

  // ---------- tick (currentTime / buffered) ----------
  useEffect(() => {
    if (!ready) return;
    const tick = () => {
      const p = playerRef.current;
      if (p) {
        try {
          setCurrent(p.getCurrentTime() || 0);
          const dur = p.getDuration() || 0;
          if (dur && dur !== duration) setDuration(dur);
          const frac = p.getVideoLoadedFraction?.() ?? 0;
          setBuffered(frac * (dur || 0));
        } catch {}
      }
      rafRef.current = window.setTimeout(tick, 250) as unknown as number;
    };
    tick();
    return () => {
      if (rafRef.current) window.clearTimeout(rafRef.current);
    };
  }, [ready, duration]);

  // ---------- fullscreen listener ----------
  useEffect(() => {
    const onFs = () => setIsFs(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFs);
    return () => document.removeEventListener("fullscreenchange", onFs);
  }, []);

  // ---------- auto-hide controls ----------
  const bumpControls = useCallback(() => {
    setShowControls(true);
    if (hideTimer.current) window.clearTimeout(hideTimer.current);
    hideTimer.current = window.setTimeout(() => {
      if (playerRef.current && !showSettings) setShowControls(false);
    }, 2800) as unknown as number;
  }, [showSettings]);

  useEffect(() => {
    if (!open) return;
    bumpControls();
    return () => {
      if (hideTimer.current) window.clearTimeout(hideTimer.current);
    };
  }, [open, bumpControls]);

  // ---------- actions ----------
  const togglePlay = useCallback(() => {
    const p = playerRef.current;
    if (!p) return;
    if (playing) p.pauseVideo();
    else p.playVideo();
    bumpControls();
  }, [playing, bumpControls]);

  const seek = useCallback((to: number) => {
    const p = playerRef.current;
    if (!p) return;
    const clamped = Math.max(0, Math.min(to, duration || to));
    p.seekTo(clamped, true);
    setCurrent(clamped);
  }, [duration]);

  const skip = useCallback(
    (delta: number) => {
      seek((playerRef.current?.getCurrentTime?.() ?? current) + delta);
      bumpControls();
    },
    [seek, current, bumpControls],
  );

  const onProgressClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement> | React.PointerEvent<HTMLDivElement>) => {
      const el = e.currentTarget;
      const rect = el.getBoundingClientRect();
      const x = (e as any).clientX - rect.left;
      const ratio = Math.max(0, Math.min(1, x / rect.width));
      seek(ratio * (duration || 0));
    },
    [seek, duration],
  );

  const setVol = useCallback((v: number) => {
    const p = playerRef.current;
    if (!p) return;
    const clamped = Math.max(0, Math.min(100, Math.round(v)));
    p.setVolume(clamped);
    setVolume(clamped);
    if (clamped === 0) {
      p.mute();
      setMuted(true);
    } else if (muted) {
      p.unMute();
      setMuted(false);
    }
  }, [muted]);

  const toggleMute = useCallback(() => {
    const p = playerRef.current;
    if (!p) return;
    if (muted) {
      p.unMute();
      setMuted(false);
      if (volume === 0) {
        p.setVolume(50);
        setVolume(50);
      }
    } else {
      p.mute();
      setMuted(true);
    }
  }, [muted, volume]);

  const setRate = useCallback((r: number) => {
    playerRef.current?.setPlaybackRate?.(r);
    setSpeed(r);
  }, []);

  const setQual = useCallback((q: string) => {
    try {
      if (q !== "auto") playerRef.current?.setPlaybackQuality?.(q);
    } catch {}
    setQuality(q);
  }, []);

  const toggleFs = useCallback(async () => {
    const el = wrapperRef.current;
    if (!el) return;
    try {
      if (document.fullscreenElement) {
        try { (screen.orientation as any)?.unlock?.(); } catch {}
        await document.exitFullscreen();
      } else {
        await el.requestFullscreen();
        try {
          const isMobile = typeof window !== "undefined" && window.matchMedia("(max-width: 900px)").matches;
          if (isMobile) await (screen.orientation as any)?.lock?.("landscape");
        } catch {}
      }
    } catch {}
    bumpControls();
  }, [bumpControls]);

  // ---------- keyboard ----------
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (!ready) return;
      switch (e.key) {
        case " ":
        case "k":
          e.preventDefault();
          togglePlay();
          break;
        case "ArrowRight":
          e.preventDefault();
          skip(10);
          break;
        case "ArrowLeft":
          e.preventDefault();
          skip(-10);
          break;
        case "ArrowUp":
          e.preventDefault();
          setVol(volume + 5);
          break;
        case "ArrowDown":
          e.preventDefault();
          setVol(volume - 5);
          break;
        case "m":
          toggleMute();
          break;
        case "f":
          toggleFs();
          break;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, ready, togglePlay, skip, setVol, toggleMute, toggleFs, volume]);

  if (!videoId) return null;

  const pct = duration > 0 ? (current / duration) * 100 : 0;
  const bufPct = duration > 0 ? (buffered / duration) * 100 : 0;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="overflow-hidden border-red-600/40 bg-black p-0 sm:max-w-5xl [&>button]:hidden">
        <DialogTitle className="sr-only">{title}</DialogTitle>
        <div
          ref={wrapperRef}
          className="group relative aspect-video w-full select-none overflow-hidden bg-black"
          onMouseMove={bumpControls}
          onMouseLeave={() => !showSettings && setShowControls(false)}
          onContextMenu={(e) => e.preventDefault()}
        >
          {/* iframe slot — preenchido pelo YT.Player */}
          <div className="absolute inset-0 h-full w-full">
            <div ref={containerRef} className="h-full w-full" />
          </div>

          {/* Capa de cliques: bloqueia menu/links do YT e captura play/pause */}
          <div
            className="absolute inset-0 z-10"
            onClick={togglePlay}
            onDoubleClick={toggleFs}
            onContextMenu={(e) => e.preventDefault()}
            style={{ cursor: showControls ? "default" : "none" }}
          />

          {/* Loading */}
          {!ready && (
            <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center">
              <Loader2 className="h-10 w-10 animate-spin text-red-600" />
            </div>
          )}

          {/* Big play indicator on pause */}
          {ready && !playing && (
            <button
              type="button"
              onClick={togglePlay}
              className="absolute left-1/2 top-1/2 z-20 flex h-20 w-20 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-red-600/90 text-white shadow-2xl transition-all hover:scale-110 hover:bg-red-500"
              aria-label="Reproduzir"
            >
              <Play className="ml-1 h-9 w-9 fill-white" />
            </button>
          )}

          {/* Gradiente inferior */}
          <div
            className={`pointer-events-none absolute inset-x-0 bottom-0 z-20 h-32 bg-gradient-to-t from-black/90 via-black/40 to-transparent transition-opacity duration-300 ${
              showControls ? "opacity-100" : "opacity-0"
            }`}
          />

          {/* CONTROLES CUSTOM */}
          <div
            className={`absolute inset-x-0 bottom-0 z-30 px-4 pb-3 pt-2 transition-all duration-300 ${
              showControls ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0 pointer-events-none"
            }`}
          >
            {/* Settings popover */}
            {showSettings && (
              <div className="mb-2 ml-auto w-56 rounded-lg border border-red-600/30 bg-black/95 p-1 text-sm text-white shadow-xl backdrop-blur">
                {settingsTab === null && (
                  <>
                    <button
                      className="flex w-full items-center justify-between rounded px-3 py-2 text-left hover:bg-red-600/20"
                      onClick={() => setSettingsTab("speed")}
                    >
                      <span>Velocidade</span>
                      <span className="text-white/60">{speed}x</span>
                    </button>
                    <button
                      className="flex w-full items-center justify-between rounded px-3 py-2 text-left hover:bg-red-600/20"
                      onClick={() => setSettingsTab("quality")}
                    >
                      <span>Qualidade</span>
                      <span className="text-white/60">
                        {QUALITIES.find((q) => q.v === quality)?.label ?? "Auto"}
                      </span>
                    </button>
                  </>
                )}
                {settingsTab === "speed" && (
                  <>
                    <button
                      className="w-full rounded px-3 py-2 text-left text-white/70 hover:bg-red-600/20"
                      onClick={() => setSettingsTab(null)}
                    >
                      ← Velocidade
                    </button>
                    {SPEEDS.map((s) => (
                      <button
                        key={s}
                        className={`flex w-full items-center justify-between rounded px-3 py-2 text-left hover:bg-red-600/20 ${
                          speed === s ? "text-red-500" : ""
                        }`}
                        onClick={() => {
                          setRate(s);
                          setShowSettings(false);
                          setSettingsTab(null);
                        }}
                      >
                        <span>{s}x</span>
                        {speed === s && <span>●</span>}
                      </button>
                    ))}
                  </>
                )}
                {settingsTab === "quality" && (
                  <>
                    <button
                      className="w-full rounded px-3 py-2 text-left text-white/70 hover:bg-red-600/20"
                      onClick={() => setSettingsTab(null)}
                    >
                      ← Qualidade
                    </button>
                    {QUALITIES.map((q) => (
                      <button
                        key={q.v}
                        className={`flex w-full items-center justify-between rounded px-3 py-2 text-left hover:bg-red-600/20 ${
                          quality === q.v ? "text-red-500" : ""
                        }`}
                        onClick={() => {
                          setQual(q.v);
                          setShowSettings(false);
                          setSettingsTab(null);
                        }}
                      >
                        <span>{q.label}</span>
                        {quality === q.v && <span>●</span>}
                      </button>
                    ))}
                  </>
                )}
              </div>
            )}

            {/* Barra de progresso */}
            <div
              className="group/bar relative h-2 cursor-pointer rounded-full bg-white/20"
              onClick={onProgressClick}
            >
              <div
                className="absolute inset-y-0 left-0 rounded-full bg-white/30"
                style={{ width: `${bufPct}%` }}
              />
              <div
                className="absolute inset-y-0 left-0 rounded-full bg-red-600"
                style={{ width: `${pct}%` }}
              />
              <div
                className="absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 scale-0 rounded-full bg-red-500 shadow-lg transition-transform group-hover/bar:scale-100"
                style={{ left: `${pct}%` }}
              />
            </div>

            {/* Linha de controles */}
            <div className="mt-2 flex items-center gap-1 text-white">
              <IconBtn onClick={togglePlay} label={playing ? "Pausar" : "Reproduzir"}>
                {playing ? <Pause className="h-5 w-5 fill-white" /> : <Play className="h-5 w-5 fill-white" />}
              </IconBtn>
              <IconBtn onClick={() => skip(-10)} label="Voltar 10s">
                <RotateCcw className="h-5 w-5" />
              </IconBtn>
              <IconBtn onClick={() => skip(10)} label="Avançar 10s">
                <RotateCw className="h-5 w-5" />
              </IconBtn>

              {/* Volume */}
              <div className="ml-1 flex items-center gap-1 group/vol">
                <IconBtn onClick={toggleMute} label={muted ? "Reativar som" : "Mudo"}>
                  {muted || volume === 0 ? (
                    <VolumeX className="h-5 w-5" />
                  ) : (
                    <Volume2 className="h-5 w-5" />
                  )}
                </IconBtn>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={muted ? 0 : volume}
                  onChange={(e) => setVol(Number(e.target.value))}
                  className="h-1 w-0 cursor-pointer appearance-none rounded-full bg-white/30 opacity-0 transition-all group-hover/vol:w-20 group-hover/vol:opacity-100 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-red-600"
                  style={{
                    background: `linear-gradient(to right, rgb(220 38 38) 0%, rgb(220 38 38) ${
                      muted ? 0 : volume
                    }%, rgba(255,255,255,.3) ${muted ? 0 : volume}%, rgba(255,255,255,.3) 100%)`,
                  }}
                />
              </div>

              {/* Tempo */}
              <div className="ml-2 select-none font-mono text-xs tabular-nums text-white/90">
                {fmt(current)} <span className="text-white/50">/ {fmt(duration)}</span>
              </div>

              <div className="ml-auto flex items-center gap-1">
                <button
                  onClick={() => {
                    setShowSettings((v) => !v);
                    setSettingsTab(null);
                  }}
                  className={`flex h-9 items-center gap-1 rounded px-2 text-xs font-semibold transition-colors hover:bg-red-600/30 ${
                    showSettings ? "bg-red-600/30 text-red-400" : "text-white"
                  }`}
                  aria-label="Configurações"
                >
                  <Settings className="h-4 w-4" />
                  <span className="hidden sm:inline">{speed}x</span>
                </button>
                <IconBtn onClick={toggleFs} label={isFs ? "Sair tela cheia" : "Tela cheia"}>
                  {isFs ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
                </IconBtn>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function IconBtn({
  children,
  onClick,
  label,
}: {
  children: React.ReactNode;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="flex h-9 w-9 items-center justify-center rounded text-white transition-all hover:bg-red-600/30 hover:text-red-400 active:scale-90"
    >
      {children}
    </button>
  );
}
