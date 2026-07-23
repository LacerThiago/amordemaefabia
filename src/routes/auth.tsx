import { useState } from "react";
import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Acesso da Confeitaria — Fábia Bolos" },
      {
        name: "description",
        content: "Área restrita para gerenciar o cardápio da Fábia Bolos.",
      },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate({ from: "/auth" });
  const { redirect } = useSearch({ from: "/auth" }) as { redirect?: string };
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    setLoading(false);

    if (error) {
      toast.error(
        error.message === "Invalid login credentials"
          ? "Email ou senha incorretos."
          : error.message,
      );
      return;
    }

    toast.success("Bem-vinda de volta!");
    navigate({ to: redirect || "/admin", replace: true });
  };

  return (
    <div className="min-h-screen bg-[var(--cream)] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-card border border-border rounded-3xl shadow-xl p-6 sm:p-8">
        <div className="flex flex-col items-center text-center mb-8">
          <img src="/logo.png" alt="Fábia Bolos" className="h-20 w-auto object-contain rounded-2xl mb-3 shadow-sm" />
          <h1 className="font-display text-2xl text-[var(--chocolate)]">Área da confeitaria</h1>
          <p className="mt-1 text-sm text-muted-foreground">Acesso exclusivo para editar o cardápio.</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email-login">Email</Label>
            <Input
              id="email-login"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
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
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <Button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-[var(--chocolate)] hover:bg-[var(--chocolate)]/90 text-[var(--cream)] mt-2"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Entrar"}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <a href="/" className="text-sm text-muted-foreground hover:text-[var(--chocolate)]">
            ← Voltar ao cardápio
          </a>
        </div>
      </div>
    </div>
  );
}
