import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { AlertCircle, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

/**
 * Mostra um alerta quando o aluno ainda não preencheu nome completo + idade.
 * Aparece em telas-chave (redação, dashboard) para empurrar a conclusão do perfil.
 */
export function ProfileIncompleteBanner() {
  const [missing, setMissing] = useState<string[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) { setLoaded(true); return; }
      const { data: p } = await supabase
        .from("profiles")
        .select("full_name, idade")
        .eq("id", u.user.id)
        .maybeSingle();
      const faltam: string[] = [];
      const nomeOk = p?.full_name && p.full_name.trim().split(/\s+/).length >= 2;
      if (!nomeOk) faltam.push("nome completo (nome + sobrenome)");
      if (!p?.idade) faltam.push("idade");
      setMissing(faltam);
      setLoaded(true);
    })();
  }, []);

  if (!loaded || missing.length === 0) return null;

  return (
    <div className="mb-6 flex flex-col gap-3 rounded-lg border-2 border-yellow-500/50 bg-yellow-500/10 p-4 sm:flex-row sm:items-center">
      <AlertCircle className="h-5 w-5 shrink-0 text-yellow-400" />
      <div className="flex-1 text-sm">
        <p className="font-semibold text-yellow-200">Conclua seu perfil para liberar todos os recursos</p>
        <p className="mt-0.5 text-xs text-yellow-100/80">
          Falta: <strong>{missing.join(" e ")}</strong>. Sem isso você não aparece corretamente no ranking nem nas correções (gratuitas ou pagas).
        </p>
      </div>
      <Link to="/perfil">
        <Button size="sm" className="bg-yellow-500 text-black hover:bg-yellow-400">
          Concluir agora <ArrowRight className="ml-1 h-4 w-4" />
        </Button>
      </Link>
    </div>
  );
}
