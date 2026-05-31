import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Navbar } from "@/components/navbar";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { toast } from "sonner";
import { Sparkles, AlertCircle } from "lucide-react";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Entrar – Nota 1000 ENEM" }] }),
  component: AuthPage,
});

function AuthPage() {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [erroLogin, setErroLogin] = useState<string>("");
  const [erroSignup, setErroSignup] = useState<string>("");
  const [enviandoReset, setEnviandoReset] = useState(false);
  const [tab, setTab] = useState<"login" | "signup">("login");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("erro") === "sem_conta") {
      setErroLogin("Conta não existe, cadastre-se ou revise os dados.");
      setTab("signup");
    }
    // Limpa qualquer dado autopreenchido pelo navegador ao abrir a página
    setEmail("");
    setPassword("");
    setName("");
    supabase.auth.getSession().then(({ data }) => { if (data.session) nav({ to: "/dashboard" }); });
  }, [nav]);

  function validarSenha(s: string): string | null {
    if (s.length < 6) return "A senha precisa ter no mínimo 6 caracteres.";
    if (!/[A-Z]/.test(s)) return "A senha precisa ter pelo menos 1 letra MAIÚSCULA.";
    if (!/[a-z]/.test(s)) return "A senha precisa ter pelo menos 1 letra minúscula.";
    if (!/[0-9]/.test(s)) return "A senha precisa ter pelo menos 1 número.";
    if (!/[^A-Za-z0-9]/.test(s)) return "A senha precisa ter pelo menos 1 caractere especial (!@#$%...).";
    return null;
  }

  function traduzirErro(msg: string): string {
    const m = msg.toLowerCase();
    if (m.includes("invalid login credentials")) return "Email ou senha incorretos. Verifique e tente novamente.";
    if (m.includes("email not confirmed")) return "Este email ainda não foi confirmado.";
    if (m.includes("user not found")) return "Esta conta não existe. Cadastre-se primeiro.";
    if (m.includes("already registered") || m.includes("already exists")) return "Este email já está cadastrado. Faça login.";
    if (m.includes("password")) return "Senha inválida — siga os requisitos de segurança.";
    if (m.includes("rate limit") || m.includes("too many")) return "Muitas tentativas. Aguarde alguns minutos.";
    return msg;
  }

  async function signIn(e: React.FormEvent) {
    e.preventDefault(); setLoading(true); setErroLogin("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) { setErroLogin(traduzirErro(error.message)); return; }
    nav({ to: "/dashboard" });
  }
  async function signUp(e: React.FormEvent) {
    e.preventDefault();
    setErroSignup("");
    const erroSenha = validarSenha(password);
    if (erroSenha) { setErroSignup(erroSenha); return; }
    if (!name.trim()) { setErroSignup("Informe seu nome."); return; }
    if (!email.trim()) { setErroSignup("Informe seu email."); return; }
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          emailRedirectTo: window.location.origin + "/dashboard",
          data: { full_name: name.trim() },
        },
      });
      if (error) {
        console.error("signUp error:", error);
        setLoading(false);
        setErroSignup(traduzirErro(error.message));
        return;
      }
      // Eventos Meta Pixel — Lead (interesse) + CompleteRegistration (cadastro feito)
      try {
        const { pixelTrack } = await import("@/lib/meta-pixel");
        pixelTrack("Lead", { content_name: "signup" });
        pixelTrack("CompleteRegistration", { content_name: "signup", status: true });
      } catch {}
      // Se já existe sessão (auto-confirm), redireciona
      if (data.session) {
        toast.success("Conta criada! Redirecionando...");
        setLoading(false);
        return nav({ to: "/dashboard" });
      }
      // Caso contrário tenta login imediato (auto-confirm ligado)
      const { error: loginErr } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });
      setLoading(false);
      if (loginErr) {
        console.error("post-signup login error:", loginErr);
        toast.success("Conta criada! Faça login para continuar.");
        return;
      }
      toast.success("Conta criada com sucesso!");
      nav({ to: "/dashboard" });
    } catch (err) {
      console.error("signUp exception:", err);
      setLoading(false);
      setErroSignup("Erro inesperado ao cadastrar. Tente novamente.");
    }
  }
  async function esqueciSenha() {
    if (!email.trim()) {
      setErroLogin("Digite seu email acima para receber o link de recuperação.");
      return;
    }
    setEnviandoReset(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
      redirectTo: window.location.origin + "/reset-password",
    });
    setEnviandoReset(false);
    if (error) {
      setErroLogin(traduzirErro(error.message));
    } else {
      toast.success("Link de recuperação enviado! Confira seu email.");
    }
  }
  async function google() {
    // Marca a intenção (login vs cadastro) pra checar do outro lado após OAuth
    sessionStorage.setItem("oauth_intent", tab);
    const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin + "/dashboard" });
    if (r.error) toast.error("Erro ao entrar com Google. Tente novamente.");
    else if (!r.redirected) nav({ to: "/dashboard" });
  }
  async function apple() {
    sessionStorage.setItem("oauth_intent", tab);
    const r = await lovable.auth.signInWithOAuth("apple", { redirect_uri: window.location.origin + "/dashboard" });
    if (r.error) toast.error("Erro ao entrar com Apple. Tente novamente.");
    else if (!r.redirected) nav({ to: "/dashboard" });
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="mx-auto flex max-w-md flex-col px-4 py-16">
        <div className="mb-6 text-center">
          <Sparkles className="mx-auto h-8 w-8 text-primary" />
          <h1 className="mt-2 text-2xl font-bold">Bem-vindo à <span className="gradient-text">Nota 1000 ENEM</span></h1>
          <p className="text-sm text-muted-foreground">Entre e comece a corrigir suas redações</p>
        </div>
        <Card className="card-glass p-6">
          {/* 1-CLICK OAUTH NO TOPO — entrada mais rápida possível */}
          {tab === "login" && (
            <div className="mb-3 flex items-start gap-2 rounded-md border border-amber-500/40 bg-amber-500/10 p-3">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
              <p className="text-xs font-medium text-amber-200">
                Atenção: só entre com Google/Apple se você <strong>já tem conta</strong> com esse mesmo email. Caso contrário, clique em <strong>Cadastrar</strong> primeiro para evitar erro.
              </p>
            </div>
          )}
          {tab === "signup" && (
            <div className="mb-3 flex items-start gap-2 rounded-md border border-primary/40 bg-primary/10 p-3">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <p className="text-xs font-medium text-foreground">
                Ao continuar com Google/Apple, sua conta será <strong>criada automaticamente</strong> com esse email.
              </p>
            </div>
          )}
          <div className="space-y-2">
            <Button onClick={google} className="w-full h-11 bg-white text-black hover:bg-white/90" size="lg">
              <svg className="h-5 w-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
              Continuar com Google
            </Button>
            <Button onClick={apple} className="w-full h-11 bg-black text-white hover:bg-black/90 border border-white/10" size="lg">
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor"><path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.49-2.09-.51-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.78 1.18-.07 2.31-.84 3.57-.78 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.53 4.04zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/></svg>
              Continuar com Apple
            </Button>
          </div>
          <div className="my-4 flex items-center gap-2"><div className="h-px flex-1 bg-border" /><span className="text-xs text-muted-foreground">ou com email</span><div className="h-px flex-1 bg-border" /></div>

          <Tabs value={tab} onValueChange={(v) => setTab(v as "login" | "signup")}>
            <TabsList className="grid w-full grid-cols-2"><TabsTrigger value="login">Entrar</TabsTrigger><TabsTrigger value="signup">Cadastrar</TabsTrigger></TabsList>
            <TabsContent value="login">
              <form onSubmit={signIn} className="space-y-4" autoComplete="off">
                <div><Label>Email</Label><Input type="email" name="login-email" autoComplete="off" value={email} onChange={e=>setEmail(e.target.value)} required /></div>
                <div><Label>Senha</Label><Input type="password" name="login-password" autoComplete="new-password" value={password} onChange={e=>setPassword(e.target.value)} required /></div>
                {erroLogin && (
                  <div className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 p-3">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                    <p className="text-sm font-semibold text-destructive">{erroLogin}</p>
                  </div>
                )}
                <Button disabled={loading} className="w-full glow-blue">Entrar</Button>
                <button
                  type="button"
                  onClick={esqueciSenha}
                  disabled={enviandoReset}
                  className="block w-full text-center text-xs text-primary hover:underline disabled:opacity-50"
                >
                  {enviandoReset ? "Enviando..." : "Esqueci minha senha"}
                </button>
              </form>
            </TabsContent>
            <TabsContent value="signup">
              <form onSubmit={signUp} className="space-y-4" autoComplete="off">
                <div><Label>Nome</Label><Input name="signup-name" autoComplete="off" value={name} onChange={e=>setName(e.target.value)} required /></div>
                <div><Label>Email</Label><Input type="email" name="signup-email" autoComplete="off" value={email} onChange={e=>setEmail(e.target.value)} required /></div>
                <div>
                  <Label>Senha</Label>
                  <Input type="password" name="signup-password" autoComplete="new-password" value={password} onChange={e=>setPassword(e.target.value)} required minLength={6} />
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    Mínimo 6 caracteres com 1 MAIÚSCULA, 1 minúscula, 1 número e 1 caractere especial.
                  </p>
                </div>
                {erroSignup && (
                  <div className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 p-3">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                    <p className="text-sm font-semibold text-destructive">{erroSignup}</p>
                  </div>
                )}
                <Button disabled={loading} className="w-full glow-blue">Criar conta</Button>
              </form>
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
}