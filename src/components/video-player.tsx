import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

/**
 * Reprodutor de vídeo: usa o player nativo do YouTube com controles originais
 * (play/pause, barra de progresso, tempo, volume, velocidade, qualidade, fullscreen).
 * Bloqueia cliques/hover na área onde o YouTube abre playlist, links e sugestões,
 * sem desenhar máscaras por cima do vídeo e mantendo a barra nativa inferior.
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
    enablejsapi: "1",
    fs: "1",
    iv_load_policy: "3",
    loop: "1",
    modestbranding: "1",
    mute: "1",
    playlist: videoId,
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
          {/* Camada 100% transparente: impede hover/cliques na área do vídeo que
              dispara playlist/sugestões/links, deixando a barra inferior nativa
              do YouTube livre para play, pausa, tempo, volume e fullscreen. */}
          <button
            type="button"
            tabIndex={-1}
            aria-hidden="true"
            className="absolute inset-x-0 top-0 bottom-14 z-10 cursor-default bg-transparent"
            onPointerDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
          />
          {/* Bloqueio invisível só no atalho/logo/link do YouTube na barra,
              preservando play, tempo, volume, engrenagem e fullscreen. */}
          <button
            type="button"
            tabIndex={-1}
            aria-hidden="true"
            className="absolute bottom-0 right-11 z-10 h-12 w-16 cursor-default bg-transparent"
            onPointerDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
