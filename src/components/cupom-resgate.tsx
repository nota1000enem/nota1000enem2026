import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Gift, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Props = {
  tipo: "redacao" | "simulado";
  onResgatado?: () => void;
};

export function CupomResgate({ tipo, onResgatado }: Props) {
  const [codigo, setCodigo] = useState("");
  const [loading, setLoading] = useState(false);

  const codigoEsperado = tipo === "redacao" ? "REDACAO10" : "SIMULA10";
  const descricao =
    tipo === "redacao"
      ? "Tem um cupom promocional? Digite o código para liberar seus benefícios de correção de redação."
      : "Tem um cupom promocional? Digite o código para liberar seus benefícios em simulados.";

  async function handleResgate() {
    const cod = codigo.trim().toUpperCase();
    if (!cod) {
      toast.error("Digite um código.");
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc("resgatar_cupom", { _codigo: cod });
      if (error) throw error;
      const r = (data ?? {}) as { ok?: boolean; motivo?: string };
      if (!r.ok) {
        const msgs: Record<string, string> = {
          codigo_invalido: "Código inválido.",
          ja_usado: "Você já usou esse cupom.",
        };
        toast.error(msgs[r.motivo ?? ""] ?? "Não foi possível resgatar o cupom.");
        return;
      }
      if (cod !== codigoEsperado) {
        toast.success("Cupom resgatado, mas ele é para outra seção. Vá à página correspondente para usar.");
      } else if (tipo === "redacao") {
        toast.success("10 créditos de redação liberados!");
      } else {
        toast.success("Simulados liberados por 30 dias!");
      }
      setCodigo("");
      onResgatado?.();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao resgatar cupom.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="card-glass mt-4 p-4 border-primary/30">
      <div className="flex items-start gap-3">
        <Gift className="mt-1 h-5 w-5 text-primary shrink-0" />
        <div className="flex-1">
          <p className="text-sm font-semibold">Resgatar cupom</p>
          <p className="mt-0.5 text-xs text-muted-foreground">{descricao}</p>
          <div className="mt-3 flex gap-2">
            <Input
              value={codigo}
              onChange={(e) => setCodigo(e.target.value.toUpperCase())}
              placeholder={codigoEsperado}
              maxLength={20}
              className="uppercase"
            />
            <Button onClick={handleResgate} disabled={loading} className="shrink-0">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Resgatar"}
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
