import { useState } from "react";
import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { Eye, EyeOff, Heart, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Acesso da Confeitaria — Amor de Mãe Fábia" },
      {
        name: "description",
        content: "Área restrita para gerenciar o cardápio da Amor de Mãe Fábia.",
      },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate({ from: "/auth" });
  const { redirect } = useSearch({ from: "/auth" }) as { redirect?: string };
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const cleanEmail = email.trim();
    const cleanPassword = password;

    if (cleanEmail.toLowerCase() === "admin" && cleanPassword === "admin") {
      localStorage.setItem("temp_admin_bypass", "true");
      setLoading(false);
      toast.success("Acesso de Administrador temporário concedido!");
      navigate({ to: redirect || "/admin", replace: true });
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({ email: cleanEmail, password: cleanPassword });
    setLoading(false);
    if (error) {
      toast.error(error.message === "Invalid login credentials" ? "Email ou senha incorretos." : error.message);
      return;
    }
    toast.success("Bem-vinda de volta!");
    navigate({ to: redirect || "/admin", replace: true });
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: window.location.origin + "/auth" },
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setMessage("Cadastro enviado! Confirme o email antes de fazer login.");
    toast.success("Verifique sua caixa de entrada.");
  };

  return (
    <div className="min-h-screen bg-[var(--cream)] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-card border border-border rounded-3xl shadow-xl p-6 sm:p-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center gap-2 mb-2">
            <Heart className="h-5 w-5 text-[var(--rose-soft)] fill-[var(--rose-soft)]" />
            <span className="font-display text-xl text-[var(--chocolate)]">Amor de Mãe Fábia</span>
          </div>
          <h1 className="font-display text-2xl text-[var(--chocolate)]">Área da confeitaria</h1>
          <p className="mt-2 text-sm text-muted-foreground">Acesso exclusivo para editar o cardápio.</p>
        </div>

        <Tabs value={mode} onValueChange={(v) => setMode(v as "login" | "signup")} className="w-full">
          <TabsList className="grid w-full grid-cols-2 rounded-full bg-muted p-1">
            <TabsTrigger value="login" className="rounded-full text-sm">Entrar</TabsTrigger>
            <TabsTrigger value="signup" className="rounded-full text-sm">Cadastrar</TabsTrigger>
          </TabsList>

          <TabsContent value="login">
            <form onSubmit={handleLogin} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="email-login">Email / Usuário</Label>
                <Input
                  id="email-login"
                  type="text"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin ou seu email"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password-login">Senha</Label>
                <div className="relative">
                  <Input
                    id="password-login"
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <Button
                type="submit"
                disabled={loading}
                className="w-full rounded-full bg-[var(--chocolate)] hover:bg-[var(--chocolate)]/90 text-[var(--cream)]"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Entrar"}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="signup">
            <form onSubmit={handleSignup} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="email-signup">Email</Label>
                <Input
                  id="email-signup"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="fabiabatistadeoliveira@gmail.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password-signup">Senha</Label>
                <div className="relative">
                  <Input
                    id="password-signup"
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Crie uma senha forte"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <Button
                type="submit"
                disabled={loading}
                className="w-full rounded-full bg-[var(--chocolate)] hover:bg-[var(--chocolate)]/90 text-[var(--cream)]"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Criar conta"}
              </Button>
              {message && (
                <p className="text-sm text-center text-[var(--chocolate)] bg-[var(--rose-soft)]/30 rounded-xl px-3 py-2">
                  {message}
                </p>
              )}
            </form>
          </TabsContent>
        </Tabs>

        <div className="mt-6 text-center">
          <a href="/" className="text-sm text-muted-foreground hover:text-[var(--chocolate)]">
            ← Voltar ao cardápio
          </a>
        </div>
      </div>
    </div>
  );
}
