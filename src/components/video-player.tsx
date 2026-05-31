import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

/**
 * Reprodutor de vídeo: usa o player nativo do YouTube com controles originais
 * (play/pause, barra de progresso, tempo, volume, velocidade, qualidade, fullscreen).
 * Apenas remove vídeos relacionados de outros canais (rel=0) e usa modestbranding.
 * Sem overlays, sem máscaras pretas, sem controles customizados.
 */

function extractId(url: string): string | null {
  if (!url) return null;
  const m =
    url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([A-Za-z0-9_-]{6,})/) ||
    url.match(/[?&]v=([A-Za-z0-9_-]{6,})/) ||
    url.match(/^([A-Za-z0-9_-]{6,})$/);
  return m ? m[1] : null;
}

type Props = {
  open: boolean;
  onClose: () => void;
  videoUrl: string;
  title: string;
};

export function VideoPlayer({ open, onClose, videoUrl, title }: Props) {
  const videoId = extractId(videoUrl);
  if (!videoId) return null;

  const params = new URLSearchParams({
    autoplay: "1",
    controls: "1",
    disablekb: "0",
    fs: "1",
    iv_load_policy: "3",
    modestbranding: "1",
    playsinline: "1",
    rel: "0",
    showinfo: "0",
  });

  const src = `https://www.youtube-nocookie.com/embed/${videoId}?${params.toString()}`;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="overflow-hidden border-primary/30 bg-black p-0 sm:max-w-4xl [&>button]:hidden">
        <DialogTitle className="sr-only">{title}</DialogTitle>
        <div className="relative aspect-video w-full overflow-hidden bg-black">
          <iframe
            key={videoId}
            src={src}
            title={title}
            className="h-full w-full"
            referrerPolicy="strict-origin-when-cross-origin"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
            allowFullScreen
            frameBorder={0}
          />
          <div className="pointer-events-auto absolute bottom-0 left-0 z-10 h-24 w-24 bg-transparent" aria-hidden="true" />
          <div className="pointer-events-auto absolute bottom-0 right-0 z-10 h-24 w-44 bg-transparent" aria-hidden="true" />
        </div>
      </DialogContent>
    </Dialog>
  );
}
