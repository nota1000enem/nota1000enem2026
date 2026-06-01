import { useEffect, useState } from "react";
import { AlertCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";

type TentativaResumo = { nota_total: number; finished_at: string };
type WeeklyRetentionSummaryProps = { userId?: string | null };

function formatDate(date: Date) {
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export function WeeklyRetentionSummary({ userId }: WeeklyRetentionSummaryProps) {
  const [redacoes, setRedacoes] = useState<number[]>([]);
  const [simulados, setSimulados] = useState<number[]>([]);
  const [periodo, setPeriodo] = useState<{ inicio: Date; fim: Date } | null>(null);
  const [mostrar, setMostrar] = useState(false);

  useEffect(() => {
    // Anchor da semana persistido localmente. Só aparece como "resumo da semana passada"
    // depois que 7 dias se passarem desde o anchor. Quando aparece, ao iniciar nova semana
    // o anchor é reiniciado.
    const KEY = "weekly_anchor_v1";
    const stored = localStorage.getItem(KEY);
    const now = new Date();
    let anchor = stored ? new Date(stored) : null;
    if (!anchor || isNaN(anchor.getTime())) {
      anchor = new Date(now);
      anchor.setHours(0, 0, 0, 0);
      localStorage.setItem(KEY, anchor.toISOString());
    }
    const fim = new Date(anchor);
    fim.setDate(fim.getDate() + 7);
    if (now >= fim) {
      setPeriodo({ inicio: anchor, fim });
      setMostrar(true);
    } else {
      setMostrar(false);
    }
  }, []);

  useEffect(() => {
    if (!userId || !periodo) return;
    (async () => {
      const [{ data: redData }, { data: tentData }] = await Promise.all([
        supabase
          .from("redacoes")
          .select("nota_total, created_at")
          .eq("user_id", userId)
          .gte("created_at", periodo.inicio.toISOString()),
        supabase.rpc("get_minhas_tentativas", { _user_id: userId }),
      ]);

      setRedacoes(
        ((redData as Array<{ nota_total: number | null }> | null) ?? [])
          .map((r) => Number(r.nota_total ?? 0))
          .filter(Boolean),
      );
      setSimulados(
        ((tentData as TentativaResumo[] | null) ?? [])
          .filter((t) => new Date(t.finished_at) >= periodo.inicio)
          .map((t) => Number(t.nota_total ?? 0))
          .filter(Boolean),
      );
    })();
  }, [periodo, userId]);

  const mediaRedacao = redacoes.length
    ? Math.round(redacoes.reduce((a, n) => a + n, 0) / redacoes.length)
    : 0;
  const mediaSimulado = simulados.length
    ? Math.round(simulados.reduce((a, n) => a + n, 0) / simulados.length)
    : 0;

  if (!mostrar || !periodo) return null;

  return (
    <Card className="card-glass mt-6 border-primary/30 bg-primary/5 p-4">
      <div className="flex items-start gap-3">
        <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
        <div className="flex-1">
          <p className="text-sm font-semibold">
            Resumo da semana passada
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {`Período: ${formatDate(periodo.inicio)} a ${formatDate(periodo.fim)}`}
          </p>
          <div className="mt-3 grid gap-3 text-xs sm:grid-cols-2">
            <div className="rounded-lg border border-border/50 bg-background/50 p-3">
              <p className="text-muted-foreground">Redação — nota total média</p>
              <p className="mt-1 text-2xl font-bold gradient-text">{mediaRedacao || "—"}</p>
              <p className="mt-1 text-muted-foreground">
                {redacoes.length} redação(ões) · média = soma das notas ÷ quantidade
              </p>
            </div>
            <div className="rounded-lg border border-border/50 bg-background/50 p-3">
              <p className="text-muted-foreground">Simulados — nota total média</p>
              <p className="mt-1 text-2xl font-bold gradient-text">{mediaSimulado || "—"}</p>
              <p className="mt-1 text-muted-foreground">
                {simulados.length} simulado(s) · média = soma das notas ÷ quantidade
              </p>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
