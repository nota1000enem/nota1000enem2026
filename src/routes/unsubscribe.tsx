import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/unsubscribe")({
  head: () => ({
    meta: [
      { title: "Cancelar inscrição | Nota 1000 ENEM" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: UnsubscribePage,
});

function UnsubscribePage() {
  const [token, setToken] = useState<string | null>(null);
  const [state, setState] = useState<
    "loading" | "ready" | "already" | "invalid" | "submitting" | "done" | "error"
  >("loading");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const t = params.get("token");
    if (!t) {
      setState("invalid");
      return;
    }
    setToken(t);
    fetch(`/email/unsubscribe?token=${encodeURIComponent(t)}`)
      .then(async (r) => {
        const json = await r.json().catch(() => ({}));
        if (!r.ok) return setState("invalid");
        if (json.valid === false && json.reason === "already_unsubscribed") {
          return setState("already");
        }
        if (json.valid === true) return setState("ready");
        setState("invalid");
      })
      .catch(() => setState("error"));
  }, []);

  async function confirmar() {
    if (!token) return;
    setState("submitting");
    try {
      const r = await fetch("/email/unsubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const json = await r.json().catch(() => ({}));
      if (!r.ok) return setState("error");
      if (json.success || json.reason === "already_unsubscribed") {
        setState("done");
      } else {
        setState("error");
      }
    } catch {
      setState("error");
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4 bg-background text-foreground">
      <div className="card-glass max-w-md w-full p-8 rounded-2xl text-center">
        <h1 className="text-2xl font-bold mb-2">Cancelar inscrição</h1>
        {state === "loading" && (
          <p className="text-muted-foreground">Verificando link…</p>
        )}
        {state === "invalid" && (
          <p className="text-destructive">
            Link inválido ou expirado.
          </p>
        )}
        {state === "already" && (
          <p className="text-muted-foreground">
            Este e-mail já está cancelado. Você não receberá mais mensagens.
          </p>
        )}
        {state === "ready" && (
          <>
            <p className="text-muted-foreground mb-6">
              Tem certeza que deseja parar de receber e-mails do Nota 1000 ENEM?
            </p>
            <button
              onClick={confirmar}
              className="btn-gradient-primary px-6 py-3 rounded-xl font-semibold"
            >
              Confirmar cancelamento
            </button>
          </>
        )}
        {state === "submitting" && (
          <p className="text-muted-foreground">Processando…</p>
        )}
        {state === "done" && (
          <p className="text-primary font-semibold">
            ✅ Pronto! Sua inscrição foi cancelada.
          </p>
        )}
        {state === "error" && (
          <p className="text-destructive">
            Erro ao processar. Tente novamente em alguns instantes.
          </p>
        )}
      </div>
    </main>
  );
}
