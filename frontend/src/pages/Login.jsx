import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAppStore } from "@/store/useAppStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Home, ArrowRight } from "lucide-react";

const Login = () => {
  const [email, setEmail] = useState("debora@prime.com");
  const [password, setPassword] = useState("demo1234");
  const nav = useNavigate();
  const { login, isAuthenticated, authLoading, authError } = useAppStore();

  useEffect(() => {
    if (isAuthenticated) nav("/");
  }, [isAuthenticated, nav]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try { await login(email, password); nav("/"); } catch (_) {}
  };

  return (
    <div className="min-h-screen w-full grid md:grid-cols-2 bg-background">
      {/* Left panel */}
      <div className="hidden md:flex relative flex-col justify-between p-12 bg-primary text-primary-foreground overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center">
              <Home className="w-5 h-5 text-accent-foreground" />
            </div>
            <div className="font-heading font-semibold text-2xl">Débora<span className="text-accent">.ai</span></div>
          </div>
        </div>
        <div className="relative z-10">
          <h1 className="font-heading text-4xl lg:text-5xl font-semibold leading-tight tracking-tight max-w-md">
            O ERP inteligente para corretoras que crescem com propósito.
          </h1>
          <p className="mt-4 text-primary-foreground/80 max-w-md text-sm leading-relaxed">
            CRM, funis, rodízio de leads, inventário completo e financeiro em uma única plataforma multi-tenant, preparada para IA e integrações.
          </p>
          <div className="mt-8 flex gap-6 text-sm">
            {[
              { k: "R$ 1.2B+", v: "em VGV gerido" },
              { k: "150+", v: "corretoras ativas" },
              { k: "98%", v: "satisfação" },
            ].map((s) => (
              <div key={s.k}>
                <div className="font-heading text-2xl font-semibold text-accent">{s.k}</div>
                <div className="text-primary-foreground/70 text-xs">{s.v}</div>
              </div>
            ))}
          </div>
        </div>
        {/* decorative */}
        <div className="absolute -bottom-24 -right-24 w-96 h-96 rounded-full bg-accent/20 blur-3xl" />
        <div className="absolute top-1/2 -left-24 w-72 h-72 rounded-full bg-white/5 blur-3xl" />
      </div>

      {/* Right form */}
      <div className="flex items-center justify-center p-6 md:p-12">
        <Card className="w-full max-w-md p-8">
          <div className="mb-6">
            <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Acesso</div>
            <h2 className="font-heading text-3xl font-semibold">Entre na sua conta</h2>
            <p className="text-sm text-muted-foreground mt-1">Entre com sua conta Firebase. Enquanto o Firebase não estiver configurado, o modo demo permanece disponível.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4" data-testid="login-form">
            <div>
              <Label htmlFor="email" className="text-xs">E-mail</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} data-testid="login-email" className="mt-1.5" />
            </div>
            <div>
              <Label htmlFor="password" className="text-xs">Senha</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} data-testid="login-password" className="mt-1.5" />
            </div>
            {authError && <div className="text-sm text-destructive bg-destructive/10 rounded-md p-3">{authError}</div>}
            <Button type="submit" disabled={authLoading} className="w-full h-11" data-testid="login-submit">
              {authLoading ? "Entrando..." : "Entrar"} {!authLoading && <ArrowRight className="w-4 h-4 ml-2" />}
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-border text-xs text-muted-foreground">
            <div className="mb-2 font-medium text-foreground">Credenciais demo</div>
            <div className="font-mono">debora@prime.com / demo1234</div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Login;
