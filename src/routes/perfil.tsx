import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Navbar } from "@/components/navbar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AlertCircle, CheckCircle2, Mail, User as UserIcon, Shield, Crown, Loader2 } from "lucide-react";

export const Route = createFileRoute("/perfil")({
  head: () => ({ meta: [{ title: "Meu Perfil – Nota 1000 ENEM" }] }),
  component: PerfilPage,
});

type Profile = {
  id: string;
  email: string;
  full_name: string | null;
  plan: string | null;
  plan_expires_at: string | null;
  plan_vitalicio: boolean | null;
};

const PLAN_LABELS: Record<string, { label: string; cls: string }> = {
  free: { label: "Free", cls: "bg-muted text-foreground" },
  light: { label: "Light", cls: "bg-blue-500/20 text-blue-300 border-blue-500/40" },
  pro: { label: "Pro", cls: "bg-purple-500/20 text-purple-300 border-purple-500/40" },
  full: { label: "Full", cls: "bg-pink-500/20 text-pink-300 border-pink-500/40" },
  vitalicio: { label: "Vitalício", cls: "bg-gradient-to-r from-yellow-500/30 to-amber-500/30 text-yellow-200 border-yellow-500/40" },
};

function PerfilPage() {
  const nav = useNavigate();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [subscription, setSubscription] = useState<{ credits_remaining: number; status: string; current_period_end: string; plan_type: string } | null>(null);
  const [userEmail, setUserEmail] = useState<string>("");

  // password change
  const [currentPwd, setCurrentPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [savingPwd, setSavingPwd] = useState(false);
  const [pwdErr, setPwdErr] = useState("");
  const [pwdOk, setPwdOk] = useState("");

  // forgot password by email
  const [resetEmail, setResetEmail] = useState("");
  const [sendingReset, setSendingReset] = useState(false);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.auth.getUser();
      if (error || !data.user) {
        nav({ to: "/auth" });
        return;
      }
      setUserEmail(data.user.email ?? "");
      setResetEmail(data.user.email ?? "");
      const { data: p } = await supabase
        .from("profiles")
        .select("id,email,full_name,plan,plan_expires_at,plan_vitalicio")
        .eq("id", data.user.id)
        .maybeSingle();
      setProfile(p as Profile | null);
      const { data: sub } = await supabase
        .from("subscriptions")
        .select("credits_remaining,status,current_period_end,plan_type")
        .eq("user_id", data.user.id)
        .maybeSingle();
      setSubscription(sub as any);
      setLoading(false);
    })();
  }, [nav]);

  function validarSenha(s: string): string | null {
    if (s.length < 6) return "A senha precisa ter no mínimo 6 caracteres.";
    if (!/[A-Z]/.test(s)) return "A senha precisa ter pelo menos 1 letra MAIÚSCULA.";
    if (!/[a-z]/.test(s)) return "A senha precisa ter pelo menos 1 letra minúscula.";
    if (!/[0-9]/.test(s)) return "A senha precisa ter pelo menos 1 número.";
    if (!/[^A-Za-z0-9]/.test(s)) return "A senha precisa ter pelo menos 1 caractere especial (!@#$%...).";
    return null;
  }

  async function alterarSenha(e: React.FormEvent) {
    e.preventDefault();
    setPwdErr(""); setPwdOk("");
    if (newPwd !== confirmPwd) { setPwdErr("As senhas não coincidem."); return; }
    const v = validarSenha(newPwd);
    if (v) { setPwdErr(v); return; }

    setSavingPwd(true);
    // Reauthenticate first
    const { error: reauthErr } = await supabase.auth.signInWithPassword({
      email: userEmail,
      password: currentPwd,
    });
    if (reauthErr) {
      setSavingPwd(false);
      setPwdErr("Senha atual incorreta. Tente novamente.");
      return;
    }
    const { error } = await supabase.auth.updateUser({ password: newPwd });
    setSavingPwd(false);
    if (error) { setPwdErr(error.message); return; }
    setPwdOk("Senha alterada com sucesso!");
    setCurrentPwd(""); setNewPwd(""); setConfirmPwd("");
    toast.success("Senha atualizada");
  }

  async function enviarReset() {
    if (!resetEmail) { toast.error("Informe um email"); return; }
    setSendingReset(true);
    const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setSendingReset(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Email enviado! Cheque sua caixa de entrada.");
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center py-32 text-muted-foreground">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Carregando seu perfil...
        </div>
      </div>
    );
  }

  const planKey = profile?.plan_vitalicio ? "vitalicio" : (profile?.plan ?? "free");
  const planMeta = PLAN_LABELS[planKey] ?? PLAN_LABELS.free;
  const ativo = planKey === "vitalicio" || (planKey !== "free" && profile?.plan_expires_at && new Date(profile.plan_expires_at) > new Date());
  const vence = profile?.plan_expires_at ? new Date(profile.plan_expires_at).toLocaleDateString("pt-BR") : null;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="mx-auto max-w-3xl px-4 py-10">
        <div className="mb-8 flex items-center gap-3">
          <div className="grid h-12 w-12 place-content-center rounded-full bg-primary/20 ring-1 ring-primary/40">
            <UserIcon className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Meu Perfil</h1>
            <p className="text-sm text-muted-foreground">Gerencie seus dados, senha e assinatura.</p>
          </div>
        </div>

        {/* Dados pessoais */}
        <Card className="mb-6 p-6">
          <div className="mb-4 flex items-center gap-2">
            <UserIcon className="h-4 w-4 text-primary" />
            <h2 className="font-semibold">Dados pessoais</h2>
            <Badge variant="outline" className="ml-auto gap-1">
              <CheckCircle2 className="h-3 w-3 text-green-400" /> Logado
            </Badge>
          </div>
          <div className="space-y-3">
            <div>
              <Label className="text-xs text-muted-foreground">Nome</Label>
              <Input value={profile?.full_name ?? ""} readOnly className="bg-muted/30" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input value={userEmail} readOnly className="bg-muted/30 pl-9" />
              </div>
              <p className="mt-1 text-xs text-muted-foreground">Email verificado e vinculado à sua conta.</p>
            </div>
          </div>
        </Card>

        {/* Plano */}
        <Card className="mb-6 p-6">
          <div className="mb-4 flex items-center gap-2">
            <Crown className="h-4 w-4 text-primary" />
            <h2 className="font-semibold">Plano atual</h2>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Badge className={`border ${planMeta.cls} px-3 py-1 text-sm`}>{planMeta.label}</Badge>
            {ativo ? (
              <span className="text-xs text-green-400">● Ativo {vence && planKey !== "vitalicio" ? `até ${vence}` : ""}</span>
            ) : (
              <span className="text-xs text-muted-foreground">● Sem assinatura ativa</span>
            )}
            <Link to="/planos" className="ml-auto">
              <Button size="sm" className="glow-blue">{ativo ? "Renovar / Trocar" : "Fazer Upgrade"}</Button>
            </Link>
          </div>
          {subscription && (
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-lg border border-border/60 bg-card/40 p-3">
                <div className="text-xs text-muted-foreground">Créditos de redação</div>
                <div className="text-2xl font-bold text-primary">{subscription.credits_remaining}</div>
              </div>
              <div className="rounded-lg border border-border/60 bg-card/40 p-3">
                <div className="text-xs text-muted-foreground">Ciclo termina em</div>
                <div className="text-sm font-medium">
                  {subscription.plan_type === "VITALICIO"
                    ? "Nunca (vitalício)"
                    : new Date(subscription.current_period_end).toLocaleDateString("pt-BR")}
                </div>
              </div>
            </div>
          )}
        </Card>

        {/* Alterar senha */}
        <Card className="mb-6 p-6">
          <div className="mb-4 flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary" />
            <h2 className="font-semibold">Alterar senha</h2>
          </div>
          <form onSubmit={alterarSenha} className="space-y-3">
            <div>
              <Label>Senha atual</Label>
              <Input type="password" value={currentPwd} onChange={(e) => setCurrentPwd(e.target.value)} required autoComplete="current-password" />
            </div>
            <div>
              <Label>Nova senha</Label>
              <Input type="password" value={newPwd} onChange={(e) => setNewPwd(e.target.value)} required autoComplete="new-password" />
              <p className="mt-1 text-xs text-muted-foreground">Mín. 6 caracteres, com maiúscula, minúscula, número e caractere especial.</p>
            </div>
            <div>
              <Label>Confirmar nova senha</Label>
              <Input type="password" value={confirmPwd} onChange={(e) => setConfirmPwd(e.target.value)} required autoComplete="new-password" />
              {confirmPwd && newPwd !== confirmPwd && (
                <p className="mt-1 text-xs text-destructive">As senhas não coincidem.</p>
              )}
              {confirmPwd && newPwd === confirmPwd && newPwd.length > 0 && (
                <p className="mt-1 text-xs text-green-400">✓ As senhas coincidem</p>
              )}
            </div>
            {pwdErr && (
              <div className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {pwdErr}
              </div>
            )}
            {pwdOk && (
              <div className="flex items-start gap-2 rounded-md border border-green-500/40 bg-green-500/10 p-3 text-sm text-green-400">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" /> {pwdOk}
              </div>
            )}
            <Button type="submit" disabled={savingPwd} className="w-full">
              {savingPwd && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {savingPwd ? "Salvando..." : "Alterar senha"}
            </Button>
          </form>
        </Card>

        {/* Esqueci a senha por email */}
        <Card className="p-6">
          <div className="mb-4 flex items-center gap-2">
            <Mail className="h-4 w-4 text-primary" />
            <h2 className="font-semibold">Esqueci minha senha</h2>
          </div>
          <p className="mb-3 text-sm text-muted-foreground">
            Vamos enviar um link no seu email para você criar uma senha nova.
          </p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input type="email" value={resetEmail} onChange={(e) => setResetEmail(e.target.value)} placeholder="seu@email.com" />
            <Button onClick={enviarReset} disabled={sendingReset} variant="outline">
              {sendingReset && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Enviar link
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
