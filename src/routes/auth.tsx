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
import { Sparkles } from "lucide-react";

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

  useEffect(() => {
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
    e.preventDefault(); setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) return toast.error(traduzirErro(error.message));
    nav({ to: "/dashboard" });
  }
  async function signUp(e: React.FormEvent) {
    e.preventDefault();
    const erroSenha = validarSenha(password);
    if (erroSenha) return toast.error(erroSenha);
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email, password,
      options: { emailRedirectTo: window.location.origin + "/dashboard", data: { full_name: name } },
    });
    setLoading(false);
    if (error) return toast.error(traduzirErro(error.message));
    toast.success("Conta criada com sucesso! Redirecionando...");
    // auto-confirm está ativo, então já podemos logar direto
    const { error: loginErr } = await supabase.auth.signInWithPassword({ email, password });
    if (loginErr) return toast.error(traduzirErro(loginErr.message));
    nav({ to: "/dashboard" });
  }
  async function google() {
    const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin + "/dashboard" });
    if (r.error) toast.error("Erro ao entrar com Google. Tente novamente.");
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
          <Tabs defaultValue="login">
            <TabsList className="grid w-full grid-cols-2"><TabsTrigger value="login">Entrar</TabsTrigger><TabsTrigger value="signup">Cadastrar</TabsTrigger></TabsList>
            <TabsContent value="login">
              <form onSubmit={signIn} className="space-y-4">
                <div><Label>Email</Label><Input type="email" value={email} onChange={e=>setEmail(e.target.value)} required /></div>
                <div><Label>Senha</Label><Input type="password" value={password} onChange={e=>setPassword(e.target.value)} required /></div>
                <Button disabled={loading} className="w-full glow-blue">Entrar</Button>
              </form>
            </TabsContent>
            <TabsContent value="signup">
              <form onSubmit={signUp} className="space-y-4">
                <div><Label>Nome</Label><Input value={name} onChange={e=>setName(e.target.value)} required /></div>
                <div><Label>Email</Label><Input type="email" value={email} onChange={e=>setEmail(e.target.value)} required /></div>
                <div>
                  <Label>Senha</Label>
                  <Input type="password" value={password} onChange={e=>setPassword(e.target.value)} required minLength={6} />
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    Mínimo 6 caracteres com 1 MAIÚSCULA, 1 minúscula, 1 número e 1 caractere especial.
                  </p>
                </div>
                <Button disabled={loading} className="w-full glow-blue">Criar conta</Button>
              </form>
            </TabsContent>
          </Tabs>
          <div className="my-4 flex items-center gap-2"><div className="h-px flex-1 bg-border" /><span className="text-xs text-muted-foreground">ou</span><div className="h-px flex-1 bg-border" /></div>
          <Button variant="outline" className="w-full" onClick={google}>Entrar com Google</Button>
        </Card>
      </div>
    </div>
  );
}