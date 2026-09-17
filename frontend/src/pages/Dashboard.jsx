import React from "react";
import PageHeader from "@/components/shared/PageHeader";
import KPICard from "@/components/shared/KPICard";
import { useDataStore } from "@/store/useDataStore";
import { useAppStore } from "@/store/useAppStore";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import {
  Users, DollarSign, Kanban, Target, Award, Flame, AlertTriangle, RefreshCw,
  Plus, Zap, ArrowUpRight,
} from "lucide-react";
import { formatBRL, formatBRLShort, formatNumber, initials } from "@/lib/format";
import { SALES_TIMELINE, LEAD_SOURCES, FUNNEL_CONVERSION } from "@/lib/mockData";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, BarChart, Bar,
} from "recharts";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const chartTheme = () => ({
  grid: "hsl(var(--border))",
  text: "hsl(var(--muted-foreground))",
});

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 shadow-lg text-xs">
      <div className="font-medium mb-1">{label}</div>
      {payload.map((p) => (
        <div key={p.dataKey} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-muted-foreground">{p.name}:</span>
          <span className="font-medium tabular-nums">
            {typeof p.value === "number" && p.value > 10000 ? formatBRLShort(p.value) : formatNumber(p.value)}
          </span>
        </div>
      ))}
    </div>
  );
};

const Dashboard = () => {
  const { activeTenantId } = useAppStore();
  const { deals, leads, properties, agents, notifications } = useDataStore();
  const nav = useNavigate();

  const tenantDeals = deals.filter((d) => d.tenantId === activeTenantId);
  const wonDeals = tenantDeals.filter((d) => d.stageId === "s6");
  const totalVGV = wonDeals.reduce((sum, d) => sum + d.value, 0) + 4200000;
  const tenantLeads = leads.filter((l) => l.tenantId === activeTenantId);
  const tenantProps = properties.filter((p) => p.tenantId === activeTenantId);
  const activeAgents = agents.filter((a) => a.tenantId === activeTenantId && a.active);

  const rankingAgents = [...activeAgents].sort((a, b) => b.salesVGV - a.salesVGV).slice(0, 5);
  const criticalAlerts = notifications.filter((n) => !n.read).slice(0, 3);

  const goalPct = 68;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        subtitle="Visão geral do desempenho comercial e financeiro em tempo real"
        actions={
          <>
            <Button variant="outline" size="sm" onClick={() => toast.success("Indicadores atualizados")} data-testid="refresh-dashboard">
              <RefreshCw className="w-4 h-4 mr-2" /> Atualizar
            </Button>
            <Button size="sm" onClick={() => nav("/leads")}>
              <Plus className="w-4 h-4 mr-2" /> Novo Lead
            </Button>
          </>
        }
      />

      {/* KPI Bento */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard testId="kpi-vgv" label="VGV do mês" value={formatBRLShort(totalVGV)} delta={12.4} icon={DollarSign} tone="default" />
        <KPICard testId="kpi-deals" label="Negócios ativos" value={tenantDeals.length} delta={8.1} icon={Kanban} tone="accent" />
        <KPICard testId="kpi-leads" label="Leads no mês" value={tenantLeads.length} delta={-2.3} icon={Users} tone="info" />
        <KPICard testId="kpi-conversion" label="Taxa de conversão" value="24.8%" delta={3.7} icon={Target} tone="warning" />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2 p-5">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Evolução de VGV</div>
              <div className="font-heading text-2xl font-semibold mt-1">{formatBRLShort(totalVGV)}</div>
            </div>
            <Badge variant="secondary" className="gap-1"><ArrowUpRight className="w-3 h-3" />+18% YoY</Badge>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={SALES_TIMELINE} margin={{ top: 10, right: 10, bottom: 0, left: -20 }}>
                <defs>
                  <linearGradient id="gvgv" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" stroke={chartTheme().text} fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke={chartTheme().text} fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `${v / 1000000}M`} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="vgv" name="VGV" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#gvgv)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-5">
          <div className="mb-3">
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Origem dos leads</div>
            <div className="font-heading text-2xl font-semibold mt-1">{formatNumber(LEAD_SOURCES.reduce((s, x) => s + x.value, 0))}</div>
          </div>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={LEAD_SOURCES} dataKey="value" nameKey="name" innerRadius={45} outerRadius={70} paddingAngle={2}>
                  {LEAD_SOURCES.map((_, i) => (
                    <Cell key={i} fill={`hsl(var(--chart-${(i % 5) + 1}))`} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 space-y-1">
            {LEAD_SOURCES.slice(0, 3).map((s, i) => (
              <div key={s.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full" style={{ background: `hsl(var(--chart-${i + 1}))` }} />
                  <span>{s.name}</span>
                </div>
                <span className="font-medium tabular-nums">{s.value}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Funnel + Meta + Rankings */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="p-5">
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">Funil de conversão</div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={FUNNEL_CONVERSION} layout="vertical" margin={{ top: 0, right: 20, bottom: 0, left: 5 }}>
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="stage" stroke={chartTheme().text} fontSize={11} width={85} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-5">
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">Meta do mês</div>
          <div className="flex items-center justify-between mb-2">
            <div className="font-heading text-3xl font-semibold">{goalPct}%</div>
            <Target className="w-6 h-6 text-primary" />
          </div>
          <Progress value={goalPct} className="h-2" />
          <div className="mt-3 text-xs text-muted-foreground">
            <div className="flex justify-between mb-1"><span>Realizado</span><span className="tabular-nums">{formatBRLShort(totalVGV)}</span></div>
            <div className="flex justify-between"><span>Meta</span><span className="tabular-nums">R$ 7,5M</span></div>
          </div>
          <div className="mt-4 pt-4 border-t border-border">
            <div className="flex items-center gap-2 text-xs">
              <Flame className="w-4 h-4 text-accent" />
              <span className="text-muted-foreground">Ritmo atual:</span>
              <span className="font-medium">Superior à meta</span>
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Ranking corretores</div>
            <Award className="w-4 h-4 text-accent" />
          </div>
          <div className="space-y-3">
            {rankingAgents.map((a, i) => (
              <div key={a.id} className="flex items-center gap-3">
                <div className="font-mono text-xs w-4 text-muted-foreground">{i + 1}</div>
                <Avatar className="w-8 h-8"><AvatarImage src={a.avatar} /><AvatarFallback>{initials(a.name)}</AvatarFallback></Avatar>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{a.name}</div>
                  <div className="text-xs text-muted-foreground">{a.dealsWon} vendas</div>
                </div>
                <div className="text-sm font-medium tabular-nums">{formatBRLShort(a.salesVGV)}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Alerts + Quick actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Alertas prioritários</div>
              <div className="font-heading text-lg font-semibold mt-0.5">Ações que precisam da sua atenção</div>
            </div>
            <AlertTriangle className="w-5 h-5 text-amber-500" />
          </div>
          <div className="space-y-2">
            {criticalAlerts.length === 0 && (
              <div className="text-sm text-muted-foreground py-6 text-center">Tudo em dia. Nenhum alerta.</div>
            )}
            {criticalAlerts.map((n) => (
              <div key={n.id} className="flex items-start gap-3 p-3 rounded-md bg-secondary/50 border border-border">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium">{n.title}</div>
                  <div className="text-xs text-muted-foreground">{n.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">Ações rápidas</div>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: "Novo Lead", to: "/leads", icon: Users },
              { label: "Novo Imóvel", to: "/inventory", icon: Kanban },
              { label: "CRM", to: "/crm", icon: Zap },
              { label: "Agenda", to: "/calendar", icon: Target },
            ].map((a) => {
              const Icon = a.icon;
              return (
                <button
                  key={a.label}
                  onClick={() => nav(a.to)}
                  className="p-3 rounded-md border border-border hover:bg-secondary text-left transition-colors"
                >
                  <Icon className="w-4 h-4 text-primary mb-2" />
                  <div className="text-xs font-medium">{a.label}</div>
                </button>
              );
            })}
          </div>
          <Button variant="outline" size="sm" className="w-full mt-3" onClick={() => nav("/tv")}>
            Modo TV →
          </Button>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
