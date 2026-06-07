import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Navbar } from "@/components/navbar";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { KeyRound, AlertCircle } from "lucide-react";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Redefinir senha – Nota 1000 ENEM" },
      { name: "description", content: "Defina uma nova senha para sua conta Nota 1000 ENEM." },
      { name: "robots", content: "noindex, nofollow" },
    ],
    links: [{ rel: "canonical", href: "https://nota1000enem.online/reset-password" }],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const nav = useNavigate();
  const [senha, setSenha] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");
  const [sessaoOk, setSessaoOk] = useState(false);

  useEffect(() => {
    // Quando o usuário chega via link, Supabase já estabelece a sessão de recovery
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || session) setSessaoOk(true);
    });
    supabase.auth.getSession().then(({ data }) => { if (data.session) setSessaoOk(true); });
    return () => sub.subscription.unsubscribe();
  }, []);

  function validarSenha(s: string): string | null {
    if (s.length < 6) return "A senha precisa ter no mínimo 6 caracteres.";
    if (!/[A-Z]/.test(s)) return "A senha precisa ter pelo menos 1 letra MAIÚSCULA.";
    if (!/[a-z]/.test(s)) return "A senha precisa ter pelo menos 1 letra minúscula.";
    if (!/[0-9]/.test(s)) return "A senha precisa ter pelo menos 1 número.";
    if (!/[^A-Za-z0-9]/.test(s)) return "A senha precisa ter pelo menos 1 caractere especial.";
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    const v = validarSenha(senha);
    if (v) { setErro(v); return; }
    if (senha !== confirmar) { setErro("As senhas não conferem."); return; }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: senha });
    setLoading(false);
    if (error) {
      setErro(error.message);
      return;
    }
    toast.success("Senha redefinida com sucesso!");
    nav({ to: "/dashboard" });
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="mx-auto flex max-w-md flex-col px-4 py-16">
        <div className="mb-6 text-center">
          <KeyRound className="mx-auto h-8 w-8 text-primary" />
          <h1 className="mt-2 text-2xl font-bold">Redefinir <span className="gradient-text">senha</span></h1>
          <p className="text-sm text-muted-foreground">Crie uma nova senha forte para sua conta.</p>
        </div>
        <Card className="card-glass p-6">
          {!sessaoOk ? (
            <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
              Link inválido ou expirado. Volte para "Esqueci minha senha" e gere um novo link.
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Nova senha</Label>
                <Input type="password" value={senha} onChange={e => setSenha(e.target.value)} required minLength={6} />
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Mínimo 6 caracteres com 1 MAIÚSCULA, 1 minúscula, 1 número e 1 caractere especial.
                </p>
              </div>
              <div>
                <Label>Confirmar nova senha</Label>
                <Input type="password" value={confirmar} onChange={e => setConfirmar(e.target.value)} required />
              </div>
              {erro && (
                <div className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 p-3">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                  <p className="text-sm font-semibold text-destructive">{erro}</p>
                </div>
              )}
              <Button disabled={loading} className="w-full glow-blue">
                {loading ? "Salvando..." : "Salvar nova senha"}
              </Button>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
}