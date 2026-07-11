import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Smartphone, X } from "lucide-react";

type BIPEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

function isStandalone() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia?.("(display-mode: standalone)").matches ||
    // iOS
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

function isIOS() {
  if (typeof navigator === "undefined") return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent) && !/crios|fxios/i.test(navigator.userAgent);
}

export function InstallAppButton({ className }: { className?: string }) {
  const [deferred, setDeferred] = useState<BIPEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [showIOSHelp, setShowIOSHelp] = useState(false);

  useEffect(() => {
    if (isStandalone()) {
      setInstalled(true);
      return;
    }
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BIPEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setDeferred(null);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (installed) return null;

  const handleClick = async () => {
    if (deferred) {
      await deferred.prompt();
      const { outcome } = await deferred.userChoice;
      if (outcome === "accepted") setInstalled(true);
      setDeferred(null);
      return;
    }
    // Sem prompt nativo (iOS Safari, ou navegador que ainda não disparou o evento)
    setShowIOSHelp(true);
  };

  return (
    <>
      <Button
        onClick={handleClick}
        size="sm"
        variant="outline"
        className={"border-primary/40 backdrop-blur hover:bg-primary/10 " + (className ?? "")}
      >
        <Download className="mr-2 h-4 w-4" />
        Baixar aplicativo
      </Button>

      {showIOSHelp && (
        <div
          className="fixed inset-0 z-[100] flex items-end justify-center bg-black/60 p-4 md:items-center"
          onClick={() => setShowIOSHelp(false)}
        >
          <div
            className="relative w-full max-w-md rounded-2xl border border-border/40 bg-background p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowIOSHelp(false)}
              className="absolute right-3 top-3 rounded-md p-1 text-muted-foreground hover:bg-muted"
              aria-label="Fechar"
            >
              <X className="h-4 w-4" />
            </button>
            <div className="flex items-center gap-2">
              <Smartphone className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">Instalar o aplicativo</h3>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              Adicione o Nota 1000 ENEM à tela inicial e use como um app.
            </p>

            {isIOS() ? (
              <ol className="mt-4 space-y-2 text-sm">
                <li>1. Toque no botão <strong>Compartilhar</strong> no Safari (ícone de caixa com seta ↑).</li>
                <li>2. Role e toque em <strong>Adicionar à Tela de Início</strong>.</li>
                <li>3. Toque em <strong>Adicionar</strong>. Pronto! 🎉</li>
              </ol>
            ) : (
              <ol className="mt-4 space-y-2 text-sm">
                <li>1. Abra o menu do navegador (⋮ no Chrome).</li>
                <li>2. Toque em <strong>Instalar aplicativo</strong> ou <strong>Adicionar à tela inicial</strong>.</li>
                <li>3. Confirme. O ícone aparecerá na sua tela inicial. 🎉</li>
              </ol>
            )}
          </div>
        </div>
      )}
    </>
  );
}
