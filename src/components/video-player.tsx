import { useEffect, useRef, useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Play, Pause, Maximize, Gauge, Settings, X, RotateCcw, RotateCw } from "lucide-react";

/**
 * Reprodutor YouTube com controles customizados.
 * Mantém o aluno na plataforma — esconde controles nativos (controls=0),
 * sem link "Ver no YouTube", sem vídeos relacionados externos.
 * Controles auto-escondem após 5s; clique na tela mostra novamente.
 */

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady?: () => void;
  }
}

function extractId(url: string): string | null {
  if (!url) return null;
  const m =
    url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{6,})/) ||
    url.match(/^([A-Za-z0-9_-]{6,})$/);
  return m ? m[1] : null;
}

function loadAPI(): Promise<void> {
  return new Promise((resolve) => {
    if (window.YT && window.YT.Player) return resolve();
    const existing = document.getElementById("yt-iframe-api");
    if (!existing) {
      const s = document.createElement("script");
      s.id = "yt-iframe-api";
      s.src = "https://www.youtube.com/iframe_api";
      document.head.appendChild(s);
    }
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      prev?.();
      resolve();
    };
  });
}

type Props = {
  open: boolean;
  onClose: () => void;
  videoUrl: string;
  title: string;
};

export function VideoPlayer({ open, onClose, videoUrl, title }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [qualities, setQualities] = useState<string[]>([]);
  const [quality, setQuality] = useState("auto");
  const [showSpeed, setShowSpeed] = useState(false);
  const [showQual, setShowQual] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  const videoId = extractId(videoUrl);

  function scheduleHide() {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => {
      setControlsVisible(false);
      setShowSpeed(false);
      setShowQual(false);
    }, 5000);
  }

  function revealControls() {
    setControlsVisible(true);
    scheduleHide();
  }

  useEffect(() => {
    if (!open || !videoId) return;
    let destroyed = false;
    setControlsVisible(true);
    scheduleHide();
    loadAPI().then(() => {
      if (destroyed || !ref.current) return;
      playerRef.current = new window.YT.Player(ref.current, {
        videoId,
        playerVars: {
          controls: 0,
          rel: 0,
          modestbranding: 1,
          disablekb: 1,
          fs: 0,
          iv_load_policy: 3,
          playsinline: 1,
          showinfo: 0,
          cc_load_policy: 0,
        },
        events: {
          onReady: (e: any) => {
            e.target.playVideo();
            setPlaying(true);
            setTimeout(() => {
              try {
                setQualities(e.target.getAvailableQualityLevels?.() ?? []);
              } catch {}
            }, 800);
          },
          onStateChange: (e: any) => {
            setPlaying(e.data === 1);
          },
        },
      });
    });
    return () => {
      destroyed = true;
      if (hideTimer.current) clearTimeout(hideTimer.current);
      try {
        playerRef.current?.destroy?.();
      } catch {}
      playerRef.current = null;
      setPlaying(false);
      setSpeed(1);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, videoId]);

  function toggle() {
    const p = playerRef.current;
    if (!p) return;
    playing ? p.pauseVideo() : p.playVideo();
  }

  function seekBy(deltaSeconds: number) {
    const p = playerRef.current;
    if (!p?.getCurrentTime || !p?.seekTo) return;
    const current = Number(p.getCurrentTime?.() ?? 0);
    const duration = Number(p.getDuration?.() ?? 0);
    const target = Math.max(0, Math.min(duration || current + deltaSeconds, current + deltaSeconds));
    p.seekTo(target, true);
  }

  function changeSpeed(v: number) {
    setSpeed(v);
    setShowSpeed(false);
    playerRef.current?.setPlaybackRate?.(v);
  }

  function changeQuality(q: string) {
    setQuality(q);
    setShowQual(false);
    try {
      playerRef.current?.setPlaybackQuality?.(q);
    } catch {}
  }

  async function fullscreen() {
    const el = wrapRef.current;
    if (!el) return;
    if (document.fullscreenElement) {
      try {
        // @ts-ignore
        screen.orientation?.unlock?.();
      } catch {}
      await document.exitFullscreen();
    } else {
      try {
        await el.requestFullscreen?.();
        try {
          // @ts-ignore — disponível em mobile
          await screen.orientation?.lock?.("landscape");
        } catch {}
      } catch {}
    }
  }

  if (!videoId) return null;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="card-glass overflow-hidden border-primary/30 p-0 sm:max-w-4xl">
        <DialogTitle className="sr-only">{title}</DialogTitle>
        <div ref={wrapRef} className="relative bg-black">
          <div className="aspect-video w-full" onDoubleClick={() => seekBy(10)}>
            <div ref={ref} className="h-full w-full pointer-events-none" />
          </div>

          {/* Overlay clicável que cobre o player inteiro: usado para mostrar
              controles novamente e impedir clique no chrome do YouTube. */}
          <div
            className="absolute inset-0 cursor-pointer"
            onClick={revealControls}
            onMouseMove={revealControls}
          />

          {/* Máscaras pretas para esconder chrome do YouTube:
              - topo: título, canal, botão compartilhar
              - direita: playlist/sugestões "Mais vídeos" e thumbs do final
              - "Mais vídeos" pill bottom-right */}
          <div className="pointer-events-none absolute left-0 right-0 top-0 h-14 bg-black" />
          <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-16 bg-black" />
          <div className="pointer-events-none absolute right-0 bottom-14 h-16 w-56 bg-black" />

          <div
            className={`absolute bottom-0 left-0 right-0 flex flex-wrap items-center gap-2 bg-gradient-to-t from-black/90 to-transparent p-3 transition-opacity duration-300 ${
              controlsVisible ? "opacity-100" : "pointer-events-none opacity-0"
            }`}
          >
            <Button size="icon" variant="ghost" className="text-white hover:bg-white/10" onClick={toggle}>
              {playing ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
            </Button>

            <Button size="sm" variant="ghost" className="text-white hover:bg-white/10" onClick={() => seekBy(-10)}>
              <RotateCcw className="mr-1 h-4 w-4" /> 10s
            </Button>

            <Button size="sm" variant="ghost" className="text-white hover:bg-white/10" onClick={() => seekBy(10)}>
              <RotateCw className="mr-1 h-4 w-4" /> 10s
            </Button>

            <div className="relative">
              <Button
                size="sm"
                variant="ghost"
                className="text-white hover:bg-white/10"
                onClick={() => {
                  setShowSpeed((s) => !s);
                  setShowQual(false);
                }}
              >
                <Gauge className="mr-1 h-4 w-4" /> {speed}x
              </Button>
              {showSpeed && (
                <div className="absolute bottom-10 left-0 rounded-md bg-background/95 p-1 shadow-lg ring-1 ring-border">
                  {[1, 1.25, 1.5, 1.75, 2].map((v) => (
                    <button
                      key={v}
                      onClick={() => changeSpeed(v)}
                      className={`block w-20 rounded px-2 py-1 text-left text-xs hover:bg-accent ${speed === v ? "font-semibold text-primary" : ""}`}
                    >
                      {v}x
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="relative">
              <Button
                size="sm"
                variant="ghost"
                className="text-white hover:bg-white/10"
                onClick={() => {
                  setShowQual((s) => !s);
                  setShowSpeed(false);
                }}
              >
                <Settings className="mr-1 h-4 w-4" /> {quality}
              </Button>
              {showQual && qualities.length > 0 && (
                <div className="absolute bottom-10 left-0 rounded-md bg-background/95 p-1 shadow-lg ring-1 ring-border">
                  {["auto", ...qualities].map((q) => (
                    <button
                      key={q}
                      onClick={() => changeQuality(q)}
                      className={`block w-24 rounded px-2 py-1 text-left text-xs hover:bg-accent ${quality === q ? "font-semibold text-primary" : ""}`}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex-1" />

            <Button size="icon" variant="ghost" className="text-white hover:bg-white/10" onClick={fullscreen}>
              <Maximize className="h-5 w-5" />
            </Button>
            <Button size="icon" variant="ghost" className="text-white hover:bg-white/10" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
