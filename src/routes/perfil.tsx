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
import { AlertCircle, CheckCircle2, Mail, User as UserIcon, Shield, Crown, Loader2, Camera, MapPin, Cake } from "lucide-react";
import { usePlanAccess } from "@/hooks/use-plan-access";

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
  avatar_url: string | null;
  estado: string | null;
  idade: number | null;
};

const ESTADOS_BR = ["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"];

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
  // Fonte autoritativa do plano (combina profiles + subscriptions + assinaturas)
  const planAccess = usePlanAccess();

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
        .select("id,email,full_name,plan,plan_expires_at,plan_vitalicio,avatar_url,estado,idade")
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

  // Usa usePlanAccess (mesma fonte do dashboard) — antes só lia profile.plan, que ficava "free"
  // quando o upgrade era registrado apenas em subscriptions/assinaturas.
  const planKey = planAccess.vitalicio ? "vitalicio" : planAccess.tier;
  const planMeta = PLAN_LABELS[planKey] ?? PLAN_LABELS.free;
  const ativo = planAccess.isPaid;
  const vence = planAccess.expiresAt ? planAccess.expiresAt.toLocaleDateString("pt-BR") : null;

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
          <NomeEditor
            currentName={profile?.full_name ?? ""}
            userId={profile?.id ?? ""}
            onSaved={(n) => setProfile((p) => (p ? { ...p, full_name: n } : p))}
          />
          <div className="mt-4">
            <Label className="text-xs text-muted-foreground">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={userEmail} readOnly className="bg-muted/30 pl-9" />
            </div>
            <p className="mt-1 text-xs text-muted-foreground">Email verificado e vinculado à sua conta. Esse nome aparece no ranking, dashboard e nas suas correções.</p>
          </div>
        </Card>

        {/* Foto, Estado e Idade (Ranking) */}
        <Card className="mb-6 p-6">
          <div className="mb-4 flex items-center gap-2">
            <Camera className="h-4 w-4 text-primary" />
            <h2 className="font-semibold">Perfil público no Ranking</h2>
          </div>
          <p className="mb-4 text-xs text-muted-foreground">
            Sua foto aparece no ranking <strong>apenas se você ficar no TOP 3</strong>. Estado e idade aparecem para todos os colocados.
          </p>
          <RankingProfileEditor
            profile={profile}
            onSaved={(updates) => setProfile((p) => (p ? { ...p, ...updates } : p))}
          />
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

function NomeEditor({ currentName, userId, onSaved }: { currentName: string; userId: string; onSaved: (n: string) => void }) {
  const [nome, setNome] = useState(currentName);
  const [saving, setSaving] = useState(false);
  useEffect(() => { setNome(currentName); }, [currentName]);

  const dirty = nome.trim() !== currentName.trim();
  const valid = nome.trim().length >= 2 && nome.trim().length <= 60;

  async function salvar() {
    if (!valid || !dirty || !userId) return;
    setSaving(true);
    const novo = nome.trim();
    const { error } = await supabase.from("profiles").update({ full_name: novo }).eq("id", userId);
    setSaving(false);
    if (error) { toast.error("Não foi possível salvar o nome."); return; }
    toast.success("Nome atualizado! Já aparece no ranking e dashboard.");
    onSaved(novo);
  }

  return (
    <div>
      <Label className="text-xs text-muted-foreground">Nome (aparece no ranking, dashboard e perfil)</Label>
      <div className="mt-1 flex gap-2">
        <Input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Seu nome" maxLength={60} />
        <Button onClick={salvar} disabled={!dirty || !valid || saving} size="sm">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar"}
        </Button>
      </div>
      {!valid && nome.length > 0 && (
        <p className="mt-1 text-xs text-destructive">Nome precisa ter entre 2 e 60 caracteres.</p>
      )}
    </div>
  );
}

function RankingProfileEditor({ profile, onSaved }: { profile: Profile | null; onSaved: (u: Partial<Profile>) => void }) {
  const [estado, setEstado] = useState(profile?.estado ?? "");
  const [idade, setIdade] = useState<string>(profile?.idade ? String(profile.idade) : "");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setEstado(profile?.estado ?? "");
    setIdade(profile?.idade ? String(profile.idade) : "");
  }, [profile?.estado, profile?.idade]);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !profile?.id) return;
    if (file.size > 3 * 1024 * 1024) { toast.error("A foto deve ter no máximo 3MB."); return; }
    if (!file.type.startsWith("image/")) { toast.error("Envie um arquivo de imagem."); return; }
    setUploading(true);
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = `${profile.id}/avatar.${ext}`;
    const { error: upErr } = await supabase.storage.from("avatars").upload(path, file, { upsert: true, contentType: file.type });
    if (upErr) { setUploading(false); toast.error("Erro ao enviar foto: " + upErr.message); return; }
    const { data: pub } = supabase.storage.from("avatars").getPublicUrl(path);
    const url = `${pub.publicUrl}?v=${Date.now()}`;
    const { error: updErr } = await supabase.from("profiles").update({ avatar_url: url }).eq("id", profile.id);
    setUploading(false);
    if (updErr) { toast.error("Erro ao salvar foto."); return; }
    onSaved({ avatar_url: url });
    toast.success("Foto de perfil atualizada!");
  }

  async function removerFoto() {
    if (!profile?.id) return;
    const { error } = await supabase.from("profiles").update({ avatar_url: null }).eq("id", profile.id);
    if (error) { toast.error("Erro ao remover foto."); return; }
    onSaved({ avatar_url: null });
    toast.success("Foto removida.");
  }

  async function salvarDados() {
    if (!profile?.id) return;
    const idadeNum = idade ? parseInt(idade, 10) : null;
    if (idadeNum !== null && (isNaN(idadeNum) || idadeNum < 10 || idadeNum > 100)) {
      toast.error("Idade deve estar entre 10 e 100.");
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("profiles")
      .update({ estado: estado || null, idade: idadeNum })
      .eq("id", profile.id);
    setSaving(false);
    if (error) { toast.error("Erro ao salvar."); return; }
    onSaved({ estado: estado || null, idade: idadeNum });
    toast.success("Dados do ranking atualizados!");
  }

  const dirty = (profile?.estado ?? "") !== estado || String(profile?.idade ?? "") !== idade;

  return (
    <div className="space-y-5">
      {/* Foto */}
      <div className="flex items-center gap-4">
        <div className="relative h-20 w-20 overflow-hidden rounded-full border-2 border-primary/40 bg-muted">
          {profile?.avatar_url ? (
            <img src={profile.avatar_url} alt="Avatar" className="h-full w-full object-cover" />
          ) : (
            <div className="grid h-full w-full place-content-center">
              <UserIcon className="h-8 w-8 text-muted-foreground" />
            </div>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <label className="cursor-pointer">
            <input type="file" accept="image/*" className="hidden" onChange={handleFile} disabled={uploading} />
            <span className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
              {profile?.avatar_url ? "Trocar foto" : "Enviar foto"}
            </span>
          </label>
          {profile?.avatar_url && (
            <Button variant="ghost" size="sm" onClick={removerFoto} className="text-xs text-muted-foreground">
              Remover foto
            </Button>
          )}
        </div>
      </div>

      {/* Estado */}
      <div>
        <Label className="flex items-center gap-1 text-xs text-muted-foreground"><MapPin className="h-3 w-3" /> Estado</Label>
        <select
          value={estado}
          onChange={(e) => setEstado(e.target.value)}
          className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="">Selecione seu estado</option>
          {ESTADOS_BR.map((uf) => (<option key={uf} value={uf}>{uf}</option>))}
        </select>
      </div>

      {/* Idade */}
      <div>
        <Label className="flex items-center gap-1 text-xs text-muted-foreground"><Cake className="h-3 w-3" /> Idade</Label>
        <Input
          type="number" min={10} max={100}
          value={idade}
          onChange={(e) => setIdade(e.target.value)}
          placeholder="Ex: 17"
          className="mt-1"
        />
      </div>

      <Button onClick={salvarDados} disabled={!dirty || saving} className="w-full">
        {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Salvar estado e idade
      </Button>
    </div>
  );
}
