import React from "react";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  Phone, Mail, MapPin, Calendar as CalIcon, FileText, DollarSign,
  Sparkles, MessageSquare, Clock, Home, TrendingUp, Building2, User,
} from "lucide-react";
import { formatBRL, formatBRLShort, formatDate, relativeTime, initials } from "@/lib/format";
import { useDataStore } from "@/store/useDataStore";
import { useAppStore } from "@/store/useAppStore";
import CopilotDialog from "@/components/copilot/CopilotDialog";
import { cn } from "@/lib/utils";

// Deterministic mock timeline builder based on entity id
const buildTimeline = (entityId, entityName) => {
  const base = entityId ? entityId.charCodeAt(entityId.length - 1) : 0;
  const now = Date.now();
  const day = 3.6e6 * 24;

  const items = [
    { type: "lead", icon: TrendingUp, color: "text-blue-500", title: "Lead cadastrado", desc: `${entityName} entrou pelo canal Instagram`, at: now - (28 + base) * day },
    { type: "call", icon: Phone, color: "text-cyan-500", title: "Primeira ligação", desc: "Conversa de 12 min · qualificação inicial", at: now - (25 + base) * day },
    { type: "visit", icon: MapPin, color: "text-purple-500", title: "Visita agendada", desc: "Cobertura em Moema · sábado 10h", at: now - (18 + base) * day },
    { type: "visit", icon: MapPin, color: "text-purple-500", title: "Visita realizada", desc: "Cliente gostou do layout, ficou de retornar", at: now - (14 + base) * day },
    { type: "doc", icon: FileText, color: "text-amber-500", title: "Documentos enviados", desc: "RG, CPF e comprovante de renda anexados", at: now - (10 + base) * day },
    { type: "proposal", icon: DollarSign, color: "text-emerald-500", title: "Proposta enviada", desc: `Valor: ${formatBRL(2450000 + base * 55000)} · 30% entrada`, at: now - (7 + base) * day },
    { type: "message", icon: MessageSquare, color: "text-indigo-500", title: "Follow-up WhatsApp", desc: "Cliente pediu 48h para decidir com esposa", at: now - (4 + base) * day },
    { type: "commission", icon: DollarSign, color: "text-primary", title: "Comissão prevista", desc: `${formatBRL(122500 + base * 2200)} (5%) a receber após fechamento`, at: now - (2 + base) * day },
  ];
  return items.sort((a, b) => b.at - a.at);
};

const EntityDrawer = ({ entity, kind, open, onOpenChange }) => {
  const { activeTenantId } = useAppStore();
  const { agents, deals, properties } = useDataStore();

  if (!entity) return null;

  const isLead = kind === "lead";
  const isClient = kind === "client";
  const isDeal = kind === "deal";

  const agent = agents.find((a) => a.id === entity.agentId);
  const relatedDeals = deals.filter((d) => d.tenantId === activeTenantId && (d.clientName === entity.name || d.id === entity.id)).slice(0, 3);
  const relatedProps = properties.filter((p) => p.tenantId === activeTenantId).slice(0, 3);

  const timeline = buildTimeline(entity.id, entity.name || entity.title);
  const displayName = entity.name || entity.title || "Registro";

  const subLabel = isLead
    ? `Lead · ${entity.origin || "—"}`
    : isClient
    ? `Cliente · ${entity.type || "—"}`
    : `Negócio · ${entity.stage || "—"}`;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto p-0">
        {/* Header */}
        <div className="p-6 border-b border-border">
          <div className="flex items-start gap-4">
            <Avatar className="w-16 h-16">
              <AvatarImage src={entity.avatar} />
              <AvatarFallback className="bg-primary text-primary-foreground text-lg">{initials(displayName)}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <SheetHeader className="text-left space-y-0">
                <SheetTitle className="font-heading text-xl leading-tight truncate">{displayName}</SheetTitle>
              </SheetHeader>
              <div className="text-xs text-muted-foreground mt-0.5">{subLabel}</div>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {isLead && entity.status && <Badge variant="outline">{entity.status}</Badge>}
                {isClient && entity.type && <Badge variant="outline">{entity.type}</Badge>}
                {isDeal && entity.temperature && <Badge variant="outline" className="capitalize">{entity.temperature}</Badge>}
                {entity.score !== undefined && (
                  <Badge className={cn("border", entity.score > 70 ? "bg-red-500/10 text-red-600 border-red-500/20" : "bg-muted text-muted-foreground border-border")} variant="outline">
                    Score {entity.score}
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Contact strip */}
          <div className="grid grid-cols-2 gap-2 mt-4 text-xs">
            {entity.phone && (<div className="flex items-center gap-2 text-muted-foreground"><Phone className="w-3.5 h-3.5" />{entity.phone}</div>)}
            {entity.email && (<div className="flex items-center gap-2 text-muted-foreground truncate"><Mail className="w-3.5 h-3.5" />{entity.email}</div>)}
            {entity.budget && (<div className="flex items-center gap-2 text-muted-foreground"><DollarSign className="w-3.5 h-3.5" />{formatBRL(entity.budget)}</div>)}
            {entity.interest && (<div className="flex items-center gap-2 text-muted-foreground truncate"><Home className="w-3.5 h-3.5" />{entity.interest}</div>)}
            {entity.document && (<div className="flex items-center gap-2 text-muted-foreground font-mono"><User className="w-3.5 h-3.5" />{entity.document}</div>)}
            {isDeal && entity.value && (<div className="flex items-center gap-2 text-primary font-semibold"><DollarSign className="w-3.5 h-3.5" />{formatBRLShort(entity.value)}</div>)}
          </div>

          {/* Quick actions */}
          <div className="flex flex-wrap gap-2 mt-4">
            <CopilotDialog
              deal={isDeal ? { title: entity.title, value: entity.value, stage: entity.stage, daysInStage: entity.daysInStage, temperature: entity.temperature, probability: entity.probability } : { title: displayName }}
              clientName={displayName}
              propertyTitle={entity.propertyTitle || entity.interest}
              defaultTab="suggest"
              trigger={<Button size="sm" data-testid="drawer-copilot-btn"><Sparkles className="w-4 h-4 mr-2" />Débora Copilot</Button>}
            />
            <CopilotDialog
              deal={isDeal ? entity : { title: displayName }}
              clientName={displayName}
              propertyTitle={entity.propertyTitle || entity.interest}
              defaultTab="followup"
              trigger={<Button size="sm" variant="outline"><MessageSquare className="w-4 h-4 mr-2" />Follow-up IA</Button>}
            />
          </div>

          {agent && (
            <div className="mt-4 pt-4 border-t border-border flex items-center gap-2 text-xs">
              <span className="text-muted-foreground">Corretor responsável:</span>
              <Avatar className="w-5 h-5"><AvatarImage src={agent.avatar} /><AvatarFallback>{initials(agent.name)}</AvatarFallback></Avatar>
              <span className="font-medium">{agent.name}</span>
            </div>
          )}
        </div>

        {/* Tabs */}
        <Tabs defaultValue="timeline" className="p-6">
          <TabsList className="w-full">
            <TabsTrigger value="timeline" className="flex-1" data-testid="drawer-tab-timeline"><Clock className="w-3.5 h-3.5 mr-1.5" />Timeline</TabsTrigger>
            <TabsTrigger value="properties" className="flex-1"><Building2 className="w-3.5 h-3.5 mr-1.5" />Imóveis</TabsTrigger>
            <TabsTrigger value="docs" className="flex-1"><FileText className="w-3.5 h-3.5 mr-1.5" />Documentos</TabsTrigger>
            <TabsTrigger value="finance" className="flex-1"><DollarSign className="w-3.5 h-3.5 mr-1.5" />Financeiro</TabsTrigger>
          </TabsList>

          <TabsContent value="timeline" className="mt-4">
            <div className="relative pl-6">
              <div className="absolute left-[9px] top-2 bottom-2 w-px bg-border" />
              {timeline.map((it, i) => {
                const Icon = it.icon;
                return (
                  <div key={i} className="relative pb-4">
                    <div className={cn("absolute -left-[22px] top-1 w-4 h-4 rounded-full bg-background border-2 flex items-center justify-center", "border-border")}>
                      <Icon className={cn("w-2.5 h-2.5", it.color)} />
                    </div>
                    <div className="text-sm font-medium leading-tight">{it.title}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{it.desc}</div>
                    <div className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
                      <CalIcon className="w-3 h-3" />{formatDate(new Date(it.at).toISOString())} · {relativeTime(new Date(it.at).toISOString())}
                    </div>
                  </div>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="properties" className="mt-4">
            <div className="space-y-2">
              {relatedProps.map((p) => (
                <div key={p.id} className="flex items-center gap-3 p-3 rounded-md border border-border hover:bg-secondary/50">
                  <img src={p.image} alt={p.title} className="w-14 h-14 rounded object-cover" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{p.title}</div>
                    <div className="text-xs text-muted-foreground">{p.neighborhood} · {p.bedrooms} dorms · {p.area}m²</div>
                  </div>
                  <div className="font-heading font-semibold text-sm tabular-nums text-primary">{formatBRLShort(p.price)}</div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="docs" className="mt-4">
            <div className="space-y-2">
              {["RG", "CPF", "Comprovante de residência", "Comprovante de renda"].map((d, i) => (
                <div key={d} className="flex items-center gap-3 p-3 rounded-md border border-border">
                  <FileText className="w-4 h-4 text-muted-foreground" />
                  <div className="flex-1 text-sm">{d}</div>
                  <Badge variant="outline" className={cn(i < 2 && "bg-emerald-500/10 text-emerald-600 border-emerald-500/20")}>
                    {i < 2 ? "aprovado" : "pendente"}
                  </Badge>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="finance" className="mt-4 space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div className="p-4 rounded-md border border-border">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Comissão prevista</div>
                <div className="font-heading text-xl font-semibold text-primary tabular-nums mt-1">{formatBRL((entity.value || entity.totalValue || 800000) * 0.05)}</div>
              </div>
              <div className="p-4 rounded-md border border-border">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Total transacionado</div>
                <div className="font-heading text-xl font-semibold tabular-nums mt-1">{formatBRL(entity.totalValue || entity.value || 800000)}</div>
              </div>
            </div>
            <Separator />
            <div className="text-xs text-muted-foreground">Histórico financeiro completo disponível no módulo Financeiro.</div>
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
};

export default EntityDrawer;
