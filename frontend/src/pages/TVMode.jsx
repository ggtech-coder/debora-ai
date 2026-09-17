import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppStore } from "@/store/useAppStore";
import { useDataStore } from "@/store/useDataStore";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatBRLShort, initials, formatNumber } from "@/lib/format";
import { SALES_TIMELINE } from "@/lib/mockData";
import { ArrowLeft, Trophy, Users, DollarSign, Target } from "lucide-react";
import { ResponsiveContainer, LineChart, Line, XAxis, Tooltip } from "recharts";

const slides = ["ranking-corretores", "ranking-equipes", "vgv-metas", "corretor-mes"];

const TVMode = () => {
  const nav = useNavigate();
  const { setTheme, theme, activeTenantId } = useAppStore();
  const { agents, teams } = useDataStore();
  const [idx, setIdx] = useState(0);
  const [originalTheme] = useState(theme);

  useEffect(() => {
    setTheme("dark");
    const int = setInterval(() => setIdx((i) => (i + 1) % slides.length), 8000);
    return () => { clearInterval(int); setTheme(originalTheme); };
    // eslint-disable-next-line
  }, []);

  const rankAgents = [...agents.filter((a) => a.tenantId === activeTenantId)].sort((a, b) => b.salesVGV - a.salesVGV);
  const topAgent = rankAgents[0];
  const rankTeams = [...teams.filter((t) => t.tenantId === activeTenantId)].sort((a, b) => b.vgv - a.vgv);
  const currentSlide = slides[idx];

  return (
    <div className="tv-mode min-h-screen p-8 md:p-12 relative">
      <div className="absolute top-6 left-6 flex items-center gap-3 z-10">
        <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center font-heading font-bold text-primary-foreground">D</div>
        <div>
          <div className="font-heading text-xl font-semibold">Débora<span className="text-accent">.ai</span></div>
          <div className="text-xs text-muted-foreground uppercase tracking-wider">Modo TV · Live</div>
        </div>
      </div>
      <Button variant="outline" size="sm" onClick={() => nav("/")} className="absolute top-6 right-6 z-10" data-testid="tv-back">
        <ArrowLeft className="w-4 h-4 mr-2" /> Voltar ao CRM
      </Button>

      <div className="absolute bottom-6 left-6 flex gap-2 z-10">
        {slides.map((_, i) => (
          <div key={i} className={`h-1 rounded-full transition-all ${i === idx ? "bg-accent w-12" : "bg-muted w-6"}`} />
        ))}
      </div>

      <div className="max-w-7xl mx-auto pt-20">
        {currentSlide === "ranking-corretores" && (
          <div>
            <div className="text-center mb-10">
              <div className="text-accent uppercase tracking-widest text-sm">Live Ranking</div>
              <h1 className="font-heading text-5xl md:text-6xl font-semibold mt-2">Corretores em destaque</h1>
            </div>
            <div className="space-y-3 max-w-3xl mx-auto">
              {rankAgents.slice(0, 5).map((a, i) => (
                <div key={a.id} className={`flex items-center gap-6 p-5 rounded-xl border ${i === 0 ? "border-accent bg-accent/10" : "border-border bg-card"}`}>
                  <div className="font-heading text-4xl font-bold w-12 text-accent">{i + 1}</div>
                  <Avatar className="w-16 h-16"><AvatarImage src={a.avatar} /><AvatarFallback>{initials(a.name)}</AvatarFallback></Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="font-heading text-2xl font-semibold">{a.name}</div>
                    <div className="text-sm text-muted-foreground">{a.role} · {a.team}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-heading text-3xl font-bold tabular-nums text-primary">{formatBRLShort(a.salesVGV)}</div>
                    <div className="text-xs text-muted-foreground">{a.dealsWon} vendas</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {currentSlide === "ranking-equipes" && (
          <div>
            <div className="text-center mb-10">
              <div className="text-accent uppercase tracking-widest text-sm">Live Ranking</div>
              <h1 className="font-heading text-5xl md:text-6xl font-semibold mt-2">Equipes</h1>
            </div>
            <div className="grid md:grid-cols-2 gap-4 max-w-4xl mx-auto">
              {rankTeams.map((t, i) => (
                <div key={t.id} className={`p-8 rounded-xl border ${i === 0 ? "border-accent bg-accent/10" : "border-border bg-card"}`}>
                  <div className="flex items-center gap-4 mb-4">
                    <Trophy className={`w-8 h-8 ${i === 0 ? "text-accent" : "text-muted-foreground"}`} />
                    <div className="font-heading text-3xl font-semibold">{t.name}</div>
                  </div>
                  <div className="text-sm text-muted-foreground mb-2">Líder: {t.lead} · {t.members} corretores</div>
                  <div className="font-heading text-5xl font-bold tabular-nums text-primary">{formatBRLShort(t.vgv)}</div>
                  <div className="text-xs text-muted-foreground mt-1">VGV acumulado</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {currentSlide === "vgv-metas" && (
          <div>
            <div className="text-center mb-10">
              <div className="text-accent uppercase tracking-widest text-sm">Performance</div>
              <h1 className="font-heading text-5xl md:text-6xl font-semibold mt-2">VGV & Meta do mês</h1>
            </div>
            <div className="grid md:grid-cols-3 gap-4 max-w-5xl mx-auto mb-8">
              <div className="p-8 rounded-xl border border-border bg-card text-center">
                <DollarSign className="w-8 h-8 mx-auto mb-3 text-primary" />
                <div className="font-heading text-5xl font-bold tabular-nums text-primary">R$ 5,2M</div>
                <div className="text-sm text-muted-foreground mt-1">VGV atual</div>
              </div>
              <div className="p-8 rounded-xl border border-border bg-card text-center">
                <Target className="w-8 h-8 mx-auto mb-3 text-accent" />
                <div className="font-heading text-5xl font-bold tabular-nums">68%</div>
                <div className="text-sm text-muted-foreground mt-1">da meta atingida</div>
              </div>
              <div className="p-8 rounded-xl border border-border bg-card text-center">
                <Users className="w-8 h-8 mx-auto mb-3 text-accent" />
                <div className="font-heading text-5xl font-bold tabular-nums">{formatNumber(103)}</div>
                <div className="text-sm text-muted-foreground mt-1">novos leads</div>
              </div>
            </div>
            <div className="h-56 max-w-5xl mx-auto">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={SALES_TIMELINE}>
                  <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                  <Tooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))" }} />
                  <Line dataKey="vgv" stroke="hsl(var(--accent))" strokeWidth={3} dot={{ r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {currentSlide === "corretor-mes" && topAgent && (
          <div className="text-center">
            <div className="text-accent uppercase tracking-widest text-sm">Destaque</div>
            <h1 className="font-heading text-6xl font-semibold mt-2 mb-10">Corretor do mês</h1>
            <div className="inline-block">
              <Avatar className="w-40 h-40 mx-auto ring-4 ring-accent">
                <AvatarImage src={topAgent.avatar} /><AvatarFallback>{initials(topAgent.name)}</AvatarFallback>
              </Avatar>
              <div className="font-heading text-4xl font-semibold mt-6">{topAgent.name}</div>
              <div className="text-muted-foreground mt-1">{topAgent.role} · {topAgent.team}</div>
              <div className="mt-8 grid grid-cols-3 gap-8">
                <div><div className="font-heading text-4xl font-bold text-primary tabular-nums">{formatBRLShort(topAgent.salesVGV)}</div><div className="text-xs text-muted-foreground uppercase mt-1">VGV</div></div>
                <div><div className="font-heading text-4xl font-bold text-accent tabular-nums">{topAgent.dealsWon}</div><div className="text-xs text-muted-foreground uppercase mt-1">Vendas</div></div>
                <div><div className="font-heading text-4xl font-bold tabular-nums">{topAgent.leadsAssigned}</div><div className="text-xs text-muted-foreground uppercase mt-1">Leads</div></div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TVMode;
