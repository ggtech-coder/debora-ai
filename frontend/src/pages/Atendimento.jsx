import React, { useEffect, useMemo, useRef, useState } from "react";
import PageHeader from "@/components/shared/PageHeader";
import KPICard from "@/components/shared/KPICard";
import { useAppStore } from "@/store/useAppStore";
import { useDataStore } from "@/store/useDataStore";
import { useAgentStore } from "@/store/useAgentStore";
import { STAGES, stageMeta, ACTION_META } from "@/lib/agentEngine";
import { formatBRL, formatBRLShort, relativeTime, initials } from "@/lib/format";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import {
  Bot, Send, Sparkles, Play, Search, MessageSquare, ClipboardCheck, CalendarCheck,
  FileSignature, Percent, ShieldAlert, MoveRight, Trophy, Clock, UserCheck, XCircle,
  Zap, Users, TrendingUp, Radio, PauseCircle, PlayCircle, RotateCw, Wand2, Plus,
  Instagram, Globe, Phone, Mail, Loader2, Target, Gauge, Trash2,
} from "lucide-react";

const ICONS = {
  MessageSquare, ClipboardCheck, Search, CalendarCheck, FileSignature, Percent,
  ShieldAlert, MoveRight, Trophy, Clock, UserCheck, XCircle,
};

const CHANNELS = {
  whatsapp: { label: "WhatsApp", icon: MessageSquare, color: "#25D366" },
  instagram: { label: "Instagram", icon: Instagram, color: "#E1306C" },
  site: { label: "Site", icon: Globe, color: "#6366F1" },
  email: { label: "E-mail", icon: Mail, color: "#F59E0B" },
  telefone: { label: "Telefone", icon: Phone, color: "#0EA5E9" },
};

/* ==================== Etapa ==================== */

const StageBadge = ({ stage, className }) => {
  const m = stageMeta(stage);
  return (
    <Badge
      variant="outline"
      className={cn("text-[10px] font-medium", className)}
      style={{ color: m.color, borderColor: `${m.color}55`, backgroundColor: `${m.color}12` }}
    >
      {m.label}
    </Badge>
  );
};

const StageTrack = ({ stage }) => {
  const flow = STAGES.filter((s) => !["perdido", "humano"].includes(s.key));
  const idx = flow.findIndex((s) => s.key === stage);
  return (
    <div className="flex items-center gap-1">
      {flow.map((s, i) => (
        <div key={s.key} className="flex-1" title={s.label}>
          <div
            className="h-1.5 rounded-full transition-colors"
            style={{ backgroundColor: i <= idx && idx >= 0 ? s.color : "hsl(var(--muted))" }}
          />
        </div>
      ))}
    </div>
  );
};

/* ==================== Lista de conversas ==================== */

const ConversationItem = ({ conv, active, onClick }) => {
  const ch = CHANNELS[conv.channel] || CHANNELS.whatsapp;
  const ChIcon = ch.icon;
  const last = conv.messages[conv.messages.length - 1];
  return (
    <button
      onClick={onClick}
      data-testid={`conv-item-${conv.id}`}
      className={cn(
        "w-full text-left p-3 rounded-lg border transition-colors",
        active ? "border-primary/40 bg-primary/5" : "border-transparent hover:bg-secondary"
      )}
    >
      <div className="flex items-start gap-2.5">
        <div className="relative shrink-0">
          <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center text-xs font-semibold">
            {initials(conv.leadName)}
          </div>
          <div
            className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2 border-card flex items-center justify-center"
            style={{ backgroundColor: ch.color }}
          >
            <ChIcon className="w-2 h-2 text-white" />
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="font-medium text-sm truncate">{conv.leadName}</span>
            {conv.autopilot && !conv.state.encerrada && (
              <Bot className="w-3 h-3 text-primary shrink-0" title="Piloto automático" />
            )}
            <span className="ml-auto text-[10px] text-muted-foreground shrink-0">
              {relativeTime(conv.updatedAt)}
            </span>
          </div>
          <div className="text-xs text-muted-foreground truncate mt-0.5">
            {last ? `${last.role === "lead" ? "" : "IA: "}${last.text.split("\n")[0]}` : "—"}
          </div>
          <div className="flex items-center gap-1.5 mt-1.5">
            <StageBadge stage={conv.state.stage} />
            {conv.unread > 0 && (
              <span className="ml-auto text-[10px] bg-primary text-primary-foreground rounded-full px-1.5 py-0.5">
                {conv.unread}
              </span>
            )}
          </div>
        </div>
      </div>
    </button>
  );
};

/* ==================== Chat ==================== */

const Bubble = ({ m }) => {
  const isLead = m.role === "lead";
  return (
    <div className={cn("flex", isLead ? "justify-start" : "justify-end")}>
      <div
        className={cn(
          "max-w-[78%] rounded-2xl px-3.5 py-2.5 text-sm whitespace-pre-line",
          isLead
            ? "bg-secondary rounded-tl-sm"
            : m.human
            ? "bg-accent/20 border border-accent/30 rounded-tr-sm"
            : "bg-primary text-primary-foreground rounded-tr-sm"
        )}
      >
        {!isLead && (
          <div className="flex items-center gap-1 mb-1 text-[10px] opacity-80">
            {m.human ? <UserCheck className="w-2.5 h-2.5" /> : <Bot className="w-2.5 h-2.5" />}
            {m.human ? "Corretor" : "Agente IA"}
          </div>
        )}
        {m.text}
        <div className={cn("text-[10px] mt-1", isLead ? "text-muted-foreground" : "opacity-70")}>
          {relativeTime(m.at)}
        </div>
      </div>
    </div>
  );
};

const ChatPanel = ({ conv }) => {
  const { receiveLeadMessage, sendHumanMessage, simulateNextLeadReply, autoRun, toggleAutopilot, thinking } =
    useAgentStore();
  const [text, setText] = useState("");
  const [as, setAs] = useState("lead");
  const [dificuldade, setDificuldade] = useState("medio");
  const [running, setRunning] = useState(false);
  const endRef = useRef(null);
  const busy = !!thinking[conv.id];

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conv.messages.length, busy]);

  const send = async () => {
    const t = text.trim();
    if (!t) return;
    setText("");
    if (as === "lead") await receiveLeadMessage(conv.id, t);
    else sendHumanMessage(conv.id, t);
  };

  const runAll = async () => {
    setRunning(true);
    try {
      const state = await autoRun(conv.id, { dificuldade, maxTurnos: 12 });
      if (state?.stage === "fechamento") toast.success("Agente fechou a venda sozinho 🎉");
      else if (state?.stage === "humano") toast.info("Agente escalou para um corretor humano");
      else toast.info("Simulação concluída");
    } finally {
      setRunning(false);
    }
  };

  return (
    <Card className="flex flex-col h-[640px]" data-testid="agent-chat">
      <div className="flex items-center gap-3 p-3 border-b border-border">
        <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center text-xs font-semibold">
          {initials(conv.leadName)}
        </div>
        <div className="min-w-0">
          <div className="font-medium text-sm truncate">{conv.leadName}</div>
          <div className="text-xs text-muted-foreground truncate">
            {conv.leadPhone} · {(CHANNELS[conv.channel] || CHANNELS.whatsapp).label}
          </div>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <StageBadge stage={conv.state.stage} />
          <div className="flex items-center gap-1.5 pl-2 border-l border-border">
            <Bot className={cn("w-4 h-4", conv.autopilot ? "text-primary" : "text-muted-foreground")} />
            <Switch
              checked={conv.autopilot}
              onCheckedChange={() => toggleAutopilot(conv.id)}
              data-testid="toggle-autopilot"
            />
          </div>
        </div>
      </div>

      <div className="px-3 pt-2">
        <StageTrack stage={conv.state.stage} />
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {conv.messages.map((m) => (
          <Bubble key={m.id} m={m} />
        ))}
        {busy && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            Agente analisando o contexto e decidindo o próximo passo…
          </div>
        )}
        <div ref={endRef} />
      </div>

      <div className="border-t border-border p-3 space-y-2">
        <div className="flex gap-2">
          <Select value={as} onValueChange={setAs}>
            <SelectTrigger className="w-[130px] h-9 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="lead">Como o lead</SelectItem>
              <SelectItem value="humano">Como corretor</SelectItem>
            </SelectContent>
          </Select>
          <Input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
            placeholder={as === "lead" ? "Escreva como se fosse o lead…" : "Assumir e responder manualmente…"}
            disabled={busy || conv.state.encerrada}
            data-testid="agent-chat-input"
          />
          <Button onClick={send} disabled={busy || !text.trim()} size="icon" data-testid="agent-chat-send">
            <Send className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Select value={dificuldade} onValueChange={setDificuldade}>
            <SelectTrigger className="w-[150px] h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="facil">Lead fácil</SelectItem>
              <SelectItem value="medio">Lead médio</SelectItem>
              <SelectItem value="dificil">Lead difícil</SelectItem>
            </SelectContent>
          </Select>
          <Button
            size="sm"
            variant="outline"
            className="h-8 text-xs"
            disabled={busy || running || conv.state.encerrada}
            onClick={() => simulateNextLeadReply(conv.id, dificuldade)}
            data-testid="simulate-lead-reply"
          >
            <Wand2 className="w-3.5 h-3.5 mr-1.5" />
            Simular resposta do lead
          </Button>
          <Button
            size="sm"
            className="h-8 text-xs"
            disabled={busy || running || conv.state.encerrada}
            onClick={runAll}
            data-testid="agent-autorun"
          >
            {running ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Play className="w-3.5 h-3.5 mr-1.5" />}
            Rodar sozinho até a venda
          </Button>
          {conv.state.encerrada && (
            <Badge variant="outline" className="text-[10px]">
              Conversa encerrada · {conv.state.motivoEncerramento === "venda" ? "venda fechada" : conv.state.motivoEncerramento}
            </Badge>
          )}
        </div>
      </div>
    </Card>
  );
};

/* ==================== Painel lateral do agente ==================== */

const ActionRow = ({ a }) => {
  const meta = ACTION_META[a.tipo] || ACTION_META.mensagem;
  const Icon = ICONS[meta.icon] || Zap;
  return (
    <div className="flex gap-2.5 text-xs">
      <div
        className="w-6 h-6 rounded-md flex items-center justify-center shrink-0 mt-0.5"
        style={{ backgroundColor: `${meta.color}18`, color: meta.color }}
      >
        <Icon className="w-3 h-3" />
      </div>
      <div className="min-w-0 flex-1 pb-3 border-b border-border/60">
        <div className="font-medium leading-snug">{a.resumo}</div>
        <div className="text-[10px] text-muted-foreground mt-0.5">
          {meta.label} · {relativeTime(a.at)}
        </div>
      </div>
    </div>
  );
};

const AgentSidePanel = ({ conv }) => {
  const { takeOver, runFollowup } = useAgentStore();
  const st = conv.state;
  const q = st.qualificacao || {};

  return (
    <Card className="h-[640px] flex flex-col" data-testid="agent-side-panel">
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="font-heading font-semibold text-sm">Raciocínio do agente</span>
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Etapa</div>
            <StageBadge stage={st.stage} className="mt-1" />
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Score</div>
            <div className="font-heading font-semibold tabular-nums">{q.score ?? "—"}</div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Follow-ups</div>
            <div className="tabular-nums">{st.followups || 0}</div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Próximo</div>
            <div className="text-muted-foreground">
              {st.proximoFollowup ? relativeTime(st.proximoFollowup).replace(" atrás", "") : "—"}
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 border-b border-border space-y-2 text-xs">
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Qualificação coletada</div>
        {Object.keys(q).length === 0 && <div className="text-muted-foreground">Ainda coletando…</div>}
        <div className="flex flex-wrap gap-1">
          {Object.entries(q)
            .filter(([k]) => k !== "score")
            .map(([k, v]) => (
              <Badge key={k} variant="secondary" className="text-[10px] font-normal">
                {k}: {typeof v === "number" && v > 1000 ? formatBRLShort(v) : String(v)}
              </Badge>
            ))}
        </div>
        {st.proposta && (
          <div className="mt-2 rounded-lg border border-border p-2.5">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Proposta ativa</div>
            <div className="font-medium">{st.proposta.imovelTitulo || "Imóvel"}</div>
            <div className="font-heading font-semibold text-base tabular-nums">{formatBRL(st.proposta.valor)}</div>
            {st.proposta.descontoPct ? (
              <div className="text-[10px] text-muted-foreground">Desconto aplicado: {st.proposta.descontoPct}%</div>
            ) : null}
          </div>
        )}
        {st.visita && (
          <div className="mt-2 rounded-lg border border-border p-2.5">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Visita</div>
            <div className="font-medium">{st.visita.imovelTitulo || "Imóvel"}</div>
            <div className="text-muted-foreground">{new Date(st.visita.data).toLocaleString("pt-BR")}</div>
          </div>
        )}
        {!!st.objecoes?.length && (
          <div className="mt-2">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Objeções</div>
            {st.objecoes.map((o, i) => (
              <div key={i} className="text-muted-foreground">
                • {o.tipo}: {o.detalhe?.slice(0, 60)}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Ações executadas</div>
        {conv.actions.length === 0 && <div className="text-xs text-muted-foreground">Nenhuma ação ainda.</div>}
        {conv.actions.map((a) => (
          <ActionRow key={a.id} a={a} />
        ))}
      </div>

      <div className="p-3 border-t border-border flex gap-2">
        <Button
          size="sm"
          variant="outline"
          className="flex-1 text-xs"
          onClick={() => runFollowup(conv.id)}
          disabled={conv.state.encerrada}
        >
          <Clock className="w-3.5 h-3.5 mr-1.5" />
          Follow-up agora
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="flex-1 text-xs"
          onClick={() => {
            takeOver(conv.id);
            toast.success("Você assumiu a conversa — o agente parou de responder");
          }}
        >
          <UserCheck className="w-3.5 h-3.5 mr-1.5" />
          Assumir
        </Button>
      </div>
    </Card>
  );
};

/* ==================== Novo atendimento ==================== */

const NewConversationSheet = ({ open, onOpenChange }) => {
  const { activeTenantId } = useAppStore();
  const leads = useDataStore((s) => s.leads);
  const { startConversation, conversations } = useAgentStore();
  const [leadId, setLeadId] = useState("");
  const [channel, setChannel] = useState("whatsapp");
  const [loading, setLoading] = useState(false);

  const disponiveis = useMemo(() => {
    const emAtendimento = new Set(conversations.map((c) => c.leadId));
    return leads.filter((l) => l.tenantId === activeTenantId && !emAtendimento.has(l.id));
  }, [leads, activeTenantId, conversations]);

  const start = async () => {
    const lead = disponiveis.find((l) => l.id === leadId);
    if (!lead) return toast.error("Escolha um lead");
    setLoading(true);
    try {
      await startConversation(lead, { channel });
      toast.success(`Agente iniciou o contato com ${lead.name}`);
      onOpenChange(false);
      setLeadId("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Novo atendimento autônomo</SheetTitle>
        </SheetHeader>
        <div className="space-y-4 py-5">
          <p className="text-sm text-muted-foreground">
            O agente faz o primeiro contato sozinho, qualifica, apresenta imóveis do inventário,
            agenda a visita, envia a proposta e conduz até o fechamento.
          </p>
          <div className="space-y-1.5">
            <Label>Lead</Label>
            <Select value={leadId} onValueChange={setLeadId}>
              <SelectTrigger data-testid="new-conv-lead">
                <SelectValue placeholder="Selecione um lead sem atendimento" />
              </SelectTrigger>
              <SelectContent>
                {disponiveis.slice(0, 40).map((l) => (
                  <SelectItem key={l.id} value={l.id}>
                    {l.name} · {l.origin} · {formatBRLShort(l.budget)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Canal</Label>
            <Select value={channel} onValueChange={setChannel}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(CHANNELS).map(([k, v]) => (
                  <SelectItem key={k} value={k}>
                    {v.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <SheetFooter>
          <Button onClick={start} disabled={loading} className="w-full" data-testid="new-conv-start">
            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Bot className="w-4 h-4 mr-2" />}
            Colocar o agente para trabalhar
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};

/* ==================== Configuração ==================== */

const AgentSettings = () => {
  const { config, updateConfig, resetConfig } = useAgentStore();
  const set = (k) => (v) => updateConfig({ [k]: v });

  return (
    <div className="grid lg:grid-cols-2 gap-4">
      <Card className="p-5 space-y-4">
        <div className="font-heading font-semibold">Identidade</div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Nome do agente</Label>
            <Input value={config.nome} onChange={(e) => set("nome")(e.target.value)} data-testid="cfg-nome" />
          </div>
          <div className="space-y-1.5">
            <Label>Empresa</Label>
            <Input value={config.empresa} onChange={(e) => set("empresa")(e.target.value)} />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label>Persona</Label>
          <Textarea rows={3} value={config.persona} onChange={(e) => set("persona")(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>Mensagem de abertura (opcional — use {"{nome}"})</Label>
          <Textarea
            rows={3}
            placeholder="Deixe vazio para o agente criar a abertura sozinho"
            value={config.mensagemAbertura}
            onChange={(e) => set("mensagemAbertura")(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label>Base de conhecimento</Label>
          <Textarea
            rows={4}
            value={config.conhecimento}
            onChange={(e) => set("conhecimento")(e.target.value)}
            placeholder="Condições de pagamento, diferenciais, políticas, parceiros bancários…"
          />
        </div>
      </Card>

      <Card className="p-5 space-y-5">
        <div className="font-heading font-semibold">Condução comercial</div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Tom</Label>
            <Select value={config.tom} onValueChange={set("tom")}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="cordial">Cordial</SelectItem>
                <SelectItem value="consultivo">Consultivo</SelectItem>
                <SelectItem value="direto">Direto</SelectItem>
                <SelectItem value="premium">Premium</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Autonomia</Label>
            <Select value={config.autonomia} onValueChange={set("autonomia")}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="sugerir">Só sugerir ao corretor</SelectItem>
                <SelectItem value="semi">Responder, mas não fechar</SelectItem>
                <SelectItem value="total">Total — até a venda</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between">
            <Label>Agressividade comercial</Label>
            <span className="text-xs text-muted-foreground">{config.agressividade}/5</span>
          </div>
          <Slider
            min={1}
            max={5}
            step={1}
            value={[config.agressividade]}
            onValueChange={([v]) => set("agressividade")(v)}
          />
          <div className="text-[11px] text-muted-foreground">
            1 = paciente e consultivo · 5 = vai direto para visita e proposta
          </div>
        </div>

        <Separator />

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Desconto máximo (%)</Label>
            <Input
              type="number"
              value={config.descontoMaxPct}
              onChange={(e) => set("descontoMaxPct")(parseFloat(e.target.value) || 0)}
              data-testid="cfg-desconto"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Ticket máximo autônomo</Label>
            <Input
              type="number"
              value={config.ticketMaxAutonomo}
              onChange={(e) => set("ticketMaxAutonomo")(parseFloat(e.target.value) || 0)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Follow-ups máximos</Label>
            <Input
              type="number"
              value={config.followupsMax}
              onChange={(e) => set("followupsMax")(parseInt(e.target.value, 10) || 0)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Intervalo entre follow-ups (h)</Label>
            <Input
              type="number"
              value={config.intervaloFollowupHoras}
              onChange={(e) => set("intervaloFollowupHoras")(parseInt(e.target.value, 10) || 0)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Atende das</Label>
            <Input
              type="number"
              value={config.horarioInicio}
              onChange={(e) => set("horarioInicio")(parseInt(e.target.value, 10) || 0)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Até as</Label>
            <Input
              type="number"
              value={config.horarioFim}
              onChange={(e) => set("horarioFim")(parseInt(e.target.value, 10) || 0)}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>Escalar para humano quando</Label>
          <Textarea
            rows={4}
            value={(config.escalarSe || []).join("\n")}
            onChange={(e) => set("escalarSe")(e.target.value.split("\n").filter(Boolean))}
          />
          <div className="text-[11px] text-muted-foreground">Uma condição por linha.</div>
        </div>

        <Button variant="outline" size="sm" onClick={() => { resetConfig(); toast.success("Configuração restaurada"); }}>
          <RotateCw className="w-3.5 h-3.5 mr-1.5" />
          Restaurar padrão
        </Button>
      </Card>
    </div>
  );
};

/* ==================== Playbook ==================== */

const TOOLBOX = [
  { tipo: "busca_imovel", desc: "Consulta o inventário real e ranqueia imóveis pelo perfil do lead." },
  { tipo: "qualificacao", desc: "Coleta orçamento, região, prazo, pagamento e decisor; atualiza o cadastro." },
  { tipo: "agendar_visita", desc: "Cria o evento na Agenda com corretor, imóvel e horário." },
  { tipo: "proposta", desc: "Monta e envia proposta com valor, entrada e condições; abre o negócio no CRM." },
  { tipo: "desconto", desc: "Negocia dentro do limite autorizado. Acima disso, bloqueia e escala." },
  { tipo: "objecao", desc: "Registra objeções para análise de perda e ajuste de abordagem." },
  { tipo: "mover_etapa", desc: "Move o card no Kanban conforme o funil avança." },
  { tipo: "venda", desc: "Fecha a venda, converte o lead em cliente e lança a comissão no Financeiro." },
  { tipo: "followup_agendado", desc: "Programa a cadência de retorno quando o lead some." },
  { tipo: "escalonamento", desc: "Transfere para um corretor humano com briefing do caso." },
];

const Playbook = () => (
  <div className="space-y-4">
    <Card className="p-5">
      <div className="font-heading font-semibold mb-4">Playbook de vendas do agente</div>
      <div className="grid md:grid-cols-7 gap-2">
        {STAGES.filter((s) => !["perdido", "humano"].includes(s.key)).map((s, i) => (
          <div key={s.key} className="rounded-lg border border-border p-3">
            <div
              className="w-7 h-7 rounded-md flex items-center justify-center text-xs font-semibold mb-2"
              style={{ backgroundColor: `${s.color}18`, color: s.color }}
            >
              {i + 1}
            </div>
            <div className="text-sm font-medium">{s.label}</div>
            <div className="text-[11px] text-muted-foreground mt-1">
              {[
                "Aborda o lead e cria contexto com a origem.",
                "Descobre orçamento, região, prazo e decisor.",
                "Apresenta até 2 imóveis reais do inventário.",
                "Oferece 2 janelas e confirma na agenda.",
                "Envia valor, entrada e condições.",
                "Trata objeção; desconto só dentro do limite.",
                "Fecha, converte em cliente e lança comissão.",
              ][i]}
            </div>
          </div>
        ))}
      </div>
    </Card>

    <Card className="p-5">
      <div className="font-heading font-semibold mb-1">Ferramentas que o agente executa sozinho</div>
      <p className="text-xs text-muted-foreground mb-4">
        Não são respostas de chatbot: cada item abaixo altera dados reais do sistema.
      </p>
      <div className="grid md:grid-cols-2 gap-2">
        {TOOLBOX.map((t) => {
          const meta = ACTION_META[t.tipo];
          const Icon = ICONS[meta.icon] || Zap;
          return (
            <div key={t.tipo} className="flex gap-3 rounded-lg border border-border p-3">
              <div
                className="w-8 h-8 rounded-md flex items-center justify-center shrink-0"
                style={{ backgroundColor: `${meta.color}18`, color: meta.color }}
              >
                <Icon className="w-4 h-4" />
              </div>
              <div>
                <div className="text-sm font-medium">{meta.label}</div>
                <div className="text-xs text-muted-foreground">{t.desc}</div>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  </div>
);

/* ==================== Página ==================== */

const Atendimento = () => {
  const { activeTenantId } = useAppStore();
  const {
    conversations, activeId, setActive, checkBackend, backendOnline, backendChecked,
    tickFollowups, metrics, deleteConversation,
  } = useAgentStore();
  const [novo, setNovo] = useState(false);
  const [filtro, setFiltro] = useState("todas");

  useEffect(() => {
    checkBackend();
  }, [checkBackend]);

  const doTenant = conversations.filter((c) => c.tenantId === activeTenantId);
  const lista = doTenant.filter((c) =>
    filtro === "todas" ? true
      : filtro === "ativas" ? !c.state.encerrada
      : filtro === "ia" ? c.autopilot && !c.state.encerrada
      : filtro === "humano" ? c.state.stage === "humano"
      : c.state.stage === "fechamento"
  );

  const active = doTenant.find((c) => c.id === activeId) || lista[0] || doTenant[0];
  const m = metrics();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Atendimento"
        subtitle="Agente autônomo: aborda, qualifica, agenda, negocia e fecha — sozinho"
        actions={
          <>
            <Badge
              variant="outline"
              className={cn("gap-1.5 h-9 px-3", backendOnline ? "border-emerald-500/40 text-emerald-600 dark:text-emerald-400" : "")}
            >
              <Radio className={cn("w-3 h-3", backendOnline && "animate-pulse")} />
              {!backendChecked ? "Verificando…" : backendOnline ? "IA conectada (OpenAI)" : "Motor local"}
            </Badge>
            <Button
              variant="outline"
              onClick={async () => {
                const n = await tickFollowups();
                toast.success(n ? `${n} follow-up(s) disparado(s)` : "Nenhum follow-up vencido");
              }}
            >
              <Clock className="w-4 h-4 mr-2" />
              Rodar cadência
            </Button>
            <Button onClick={() => setNovo(true)} data-testid="btn-novo-atendimento">
              <Plus className="w-4 h-4 mr-2" />
              Novo atendimento
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <KPICard label="Conversas ativas" value={m.ativas} icon={MessageSquare} testId="kpi-ativas" />
        <KPICard label="Visitas agendadas" value={m.visitas} icon={CalendarCheck} tone="info" />
        <KPICard label="Vendas pela IA" value={m.vendas} icon={Trophy} tone="accent" />
        <KPICard label="VGV gerado" value={formatBRLShort(m.receita)} icon={TrendingUp} />
        <KPICard label="Ações executadas" value={m.acoes} icon={Zap} tone="warning" />
      </div>

      <Tabs defaultValue="conversas">
        <TabsList>
          <TabsTrigger value="conversas" data-testid="tab-conversas">Conversas</TabsTrigger>
          <TabsTrigger value="agente" data-testid="tab-agente">Configurar agente</TabsTrigger>
          <TabsTrigger value="playbook" data-testid="tab-playbook">Playbook</TabsTrigger>
        </TabsList>

        <TabsContent value="conversas" className="mt-4">
          {doTenant.length === 0 ? (
            <Card className="p-12 text-center">
              <Bot className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
              <div className="font-heading font-semibold mb-1">Nenhum atendimento ainda</div>
              <p className="text-sm text-muted-foreground mb-4">
                Escolha um lead e deixe o agente conduzir do primeiro contato até a venda.
              </p>
              <Button onClick={() => setNovo(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Novo atendimento
              </Button>
            </Card>
          ) : (
            <div className="grid lg:grid-cols-[300px_1fr_320px] gap-4">
              <Card className="h-[640px] flex flex-col">
                <div className="p-3 border-b border-border">
                  <Select value={filtro} onValueChange={setFiltro}>
                    <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todas">Todas ({doTenant.length})</SelectItem>
                      <SelectItem value="ativas">Em andamento</SelectItem>
                      <SelectItem value="ia">No piloto automático</SelectItem>
                      <SelectItem value="humano">Escaladas p/ humano</SelectItem>
                      <SelectItem value="fechadas">Vendas fechadas</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                  {lista.map((c) => (
                    <div key={c.id} className="group relative">
                      <ConversationItem conv={c} active={active?.id === c.id} onClick={() => setActive(c.id)} />
                      <button
                        onClick={() => deleteConversation(c.id)}
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity"
                        title="Remover conversa"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                  {lista.length === 0 && (
                    <div className="text-xs text-muted-foreground p-4 text-center">Nada neste filtro.</div>
                  )}
                </div>
              </Card>

              {active ? <ChatPanel conv={active} /> : <Card className="h-[640px]" />}
              {active ? <AgentSidePanel conv={active} /> : <Card className="h-[640px]" />}
            </div>
          )}
        </TabsContent>

        <TabsContent value="agente" className="mt-4">
          <AgentSettings />
        </TabsContent>

        <TabsContent value="playbook" className="mt-4">
          <Playbook />
        </TabsContent>
      </Tabs>

      <NewConversationSheet open={novo} onOpenChange={setNovo} />
    </div>
  );
};

export default Atendimento;
