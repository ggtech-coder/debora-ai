import React from "react";
import PageHeader from "@/components/shared/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Zap, TrendingUp } from "lucide-react";

const PLANS = [
  { name: "Starter", price: "R$ 199", users: 5, features: ["CRM básico", "Até 500 leads/mês", "1 funil"], current: false },
  { name: "Business", price: "R$ 599", users: 20, features: ["CRM completo", "Rodízio inteligente", "Funis ilimitados", "Relatórios avançados"], current: true },
  { name: "Enterprise", price: "R$ 1.499", users: 100, features: ["Tudo Business", "IA integrada", "API + Webhooks", "SLA dedicado"], current: false },
];

const MyPlan = () => (
  <div className="space-y-6">
    <PageHeader title="Meu Plano" subtitle="Plano contratado, consumo, faturas e upgrades" />

    <Card className="p-6 bg-primary text-primary-foreground border-primary">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <Badge variant="secondary" className="mb-2">Plano atual</Badge>
          <div className="font-heading text-3xl font-semibold">Business</div>
          <div className="text-sm text-primary-foreground/80 mt-1">Próxima cobrança em 12 de março · R$ 599</div>
        </div>
        <div className="grid grid-cols-3 gap-6 text-center">
          <div><div className="font-heading text-2xl font-semibold">12/20</div><div className="text-xs text-primary-foreground/70">Usuários</div></div>
          <div><div className="font-heading text-2xl font-semibold">1.8k</div><div className="text-xs text-primary-foreground/70">Leads/mês</div></div>
          <div><div className="font-heading text-2xl font-semibold">8/∞</div><div className="text-xs text-primary-foreground/70">Funis</div></div>
        </div>
      </div>
    </Card>

    <div className="grid md:grid-cols-3 gap-4">
      {PLANS.map((p) => (
        <Card key={p.name} className={`p-6 relative ${p.current ? "border-primary ring-2 ring-primary/20" : ""}`}>
          {p.current && <Badge className="absolute top-3 right-3">Atual</Badge>}
          <div className="text-xs uppercase tracking-wider text-muted-foreground">{p.name}</div>
          <div className="mt-1 mb-3"><span className="font-heading text-3xl font-semibold">{p.price}</span><span className="text-muted-foreground text-sm">/mês</span></div>
          <div className="text-xs text-muted-foreground mb-4">Até {p.users} usuários</div>
          <div className="space-y-2 mb-5">
            {p.features.map((f) => (<div key={f} className="flex items-center gap-2 text-sm"><Check className="w-4 h-4 text-primary" />{f}</div>))}
          </div>
          <Button variant={p.current ? "outline" : "default"} className="w-full" disabled={p.current}>
            {p.current ? "Plano atual" : "Fazer upgrade"}
          </Button>
        </Card>
      ))}
    </div>

    <Card className="p-6">
      <div className="font-heading text-lg font-semibold mb-3">Últimas faturas</div>
      <div className="divide-y divide-border">
        {["Fev/2026", "Jan/2026", "Dez/2025", "Nov/2025"].map((d, i) => (
          <div key={d} className="flex items-center justify-between py-3">
            <div className="text-sm">{d}</div>
            <div className="font-mono text-sm">R$ 599,00</div>
            <Badge variant="outline" className="text-emerald-600 border-emerald-500/30">Pago</Badge>
            <Button variant="link" size="sm">Baixar NF</Button>
          </div>
        ))}
      </div>
    </Card>
  </div>
);

export default MyPlan;
