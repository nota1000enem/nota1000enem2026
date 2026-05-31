import { useEffect, useMemo, useState } from "react";
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

  const { inicio, fim } = useMemo(() => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 7);
    return { inicio: start, fim: end };
  }, []);

  useEffect(() => {
    if (!userId) return;
    (async () => {
      const [{ data: redData }, { data: tentData }] = await Promise.all([
        supabase
          .from("redacoes")
          .select("nota_total, created_at")
          .eq("user_id", userId)
          .gte("created_at", inicio.toISOString()),
        supabase.rpc("get_minhas_tentativas", { _user_id: userId }),
      ]);

      setRedacoes(((redData as Array<{ nota_total: number | null }> | null) ?? []).map((r) => Number(r.nota_total ?? 0)).filter(Boolean));
      setSimulados(((tentData as TentativaResumo[] | null) ?? [])
        .filter((t) => new Date(t.finished_at) >= inicio)
        .map((t) => Number(t.nota_total ?? 0))
        .filter(Boolean));
    })();
  }, [fim, inicio, userId]);

  const mediaRedacao = redacoes.length ? Math.round(redacoes.reduce((a, n) => a + n, 0) / redacoes.length) : 0;
  const mediaSimulado = simulados.length ? Math.round(simulados.reduce((a, n) => a + n, 0) / simulados.length) : 0;

  return (
    <Card className="card-glass mt-6 border-primary/30 bg-primary/5 p-4">
      <div className="flex items-start gap-3">
        <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
        <div className="flex-1">
          <p className="text-sm font-semibold">Notas e planos ficam salvos por 1 semana e depois resetam.</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Semana 1: dia {formatDate(inicio)} a {formatDate(fim)}
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
              <p className="text-muted-foreground">Questões — nota total média</p>
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