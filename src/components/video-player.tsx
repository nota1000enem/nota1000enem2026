import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

/**
 * Reprodutor de vídeo: usa o player nativo do YouTube com controles originais
 * (play/pause, barra de progresso, tempo, volume, velocidade, qualidade, fullscreen).
 * Reduz overlays nativos do YouTube e bloqueia navegação para fora do site,
 * mantendo os controles originais do player.
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
    cc_load_policy: "0",
    color: "white",
    controls: "1",
    disablekb: "0",
    fs: "1",
    iv_load_policy: "3",
    modestbranding: "1",
    mute: "1",
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
            sandbox="allow-scripts allow-same-origin allow-presentation"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
            allowFullScreen
            frameBorder={0}
          />
          <button
            type="button"
            tabIndex={-1}
            className="absolute bottom-11 left-4 z-10 h-14 w-20 cursor-default bg-transparent"
            aria-hidden="true"
            onClick={(e) => e.preventDefault()}
          />
          <button
            type="button"
            tabIndex={-1}
            className="absolute bottom-11 right-4 z-10 h-16 w-72 max-w-[42%] cursor-default bg-transparent"
            aria-hidden="true"
            onClick={(e) => e.preventDefault()}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
