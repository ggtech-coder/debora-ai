import React, { useState } from "react";
import PageHeader from "@/components/shared/PageHeader";
import KPICard from "@/components/shared/KPICard";
import { useAppStore } from "@/store/useAppStore";
import { useDataStore } from "@/store/useDataStore";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter,
} from "@/components/ui/sheet";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle,
  AlertDialogDescription, AlertDialogFooter, AlertDialogAction, AlertDialogCancel, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Plus, Play, Pause, Trash2, Zap, TrendingUp, CheckCircle2, XCircle,
  UserPlus, Clock, MoveRight, CalendarPlus, Send, Cake, AlertTriangle,
  MessageSquare, Mail, UserCheck, Kanban, CalendarCheck, Bell, Sparkles, Tag,
  X, GripVertical, PlayCircle, Zap as Bolt,
} from "lucide-react";
import { TRIGGER_TYPES, ACTION_TYPES, AUTOMATION_TEMPLATES } from "@/lib/mockData";
import { formatNumber, relativeTime, formatDateTime } from "@/lib/format";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const TRIGGER_ICONS = { UserPlus, Clock, MoveRight, CalendarPlus, Send, Cake, AlertTriangle };
const ACTION_ICONS = { MessageSquare, Mail, UserCheck, Kanban, CalendarCheck, Bell, Sparkles, Tag };

const trigger = (key) => TRIGGER_TYPES.find((t) => t.key === key);
const actionMeta = (key) => ACTION_TYPES.find((a) => a.key === key);

/* ---------- Automation card ---------- */
const AutomationCard = ({ auto, onEdit, onToggle, onDelete, onRun }) => {
  const t = trigger(auto.trigger?.type);
  const TIcon = TRIGGER_ICONS[t?.icon] || Zap;
  const successRate = auto.stats?.runs > 0 ? Math.round((auto.stats.success / auto.stats.runs) * 100) : 0;

  return (
    <Card className={cn("p-5 hover-lift", !auto.active && "opacity-70")} data-testid={`automation-card-${auto.id}`}>
      <div className="flex items-start gap-3 mb-3">
        <div className={cn(
          "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
          auto.active ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
        )}>
          <TIcon className="w-5 h-5" strokeWidth={1.75} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-heading font-semibold leading-tight truncate">{auto.name}</div>
          <div className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{auto.description}</div>
        </div>
        <Switch checked={auto.active} onCheckedChange={() => onToggle(auto.id)} data-testid={`toggle-auto-${auto.id}`} />
      </div>

      <div className="flex flex-wrap gap-1.5 mb-4">
        <Badge variant="outline" className="text-[10px]"><Bolt className="w-2.5 h-2.5 mr-1" />{t?.label || auto.trigger?.type}</Badge>
        {auto.actions?.map((a, i) => {
          const meta = actionMeta(a.type);
          const AIcon = ACTION_ICONS[meta?.icon] || Zap;
          return (
            <Badge key={i} className="text-[10px] border" variant="outline" style={{ color: meta?.color, borderColor: `${meta?.color}40` }}>
              <AIcon className="w-2.5 h-2.5 mr-1" />{meta?.label || a.type}
            </Badge>
          );
        })}
      </div>

      <div className="grid grid-cols-3 gap-2 mb-4 text-xs">
        <div>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Execuções</div>
          <div className="font-heading font-semibold tabular-nums">{formatNumber(auto.stats?.runs || 0)}</div>
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Sucesso</div>
          <div className="font-heading font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">{successRate}%</div>
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Última</div>
          <div className="text-xs text-muted-foreground">{auto.stats?.lastRunAt ? relativeTime(auto.stats.lastRunAt) : "—"}</div>
        </div>
      </div>

      <div className="flex gap-1 pt-3 border-t border-border">
        <Button size="sm" variant="outline" className="flex-1" onClick={() => onEdit(auto)} data-testid={`edit-auto-${auto.id}`}>Editar</Button>
        <Button size="sm" variant="outline" onClick={() => { onRun(auto.id); toast.success(`"${auto.name}" executada`); }} data-testid={`run-auto-${auto.id}`}>
          <PlayCircle className="w-3.5 h-3.5 mr-1" />Rodar
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive"><Trash2 className="w-3.5 h-3.5" /></Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir "{auto.name}"?</AlertDialogTitle>
              <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={() => onDelete(auto.id)} className="bg-destructive text-destructive-foreground">Excluir</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </Card>
  );
};

/* ---------- Builder Sheet ---------- */
const AutomationBuilder = ({ open, onOpenChange, initial, onSave }) => {
  const [form, setForm] = useState(initial || { name: "", description: "", trigger: { type: "lead_created", config: {} }, actions: [], active: true });

  React.useEffect(() => {
    if (initial) setForm({ ...initial, actions: initial.actions || [] });
  }, [initial]);

  const t = trigger(form.trigger?.type);
  const TIcon = TRIGGER_ICONS[t?.icon] || Zap;

  const addAction = (type) => setForm({ ...form, actions: [...(form.actions || []), { type, config: {} }] });
  const removeAction = (i) => setForm({ ...form, actions: form.actions.filter((_, idx) => idx !== i) });

  const handleSave = () => {
    if (!form.name?.trim()) return toast.error("Dê um nome à automação");
    if (!form.actions?.length) return toast.error("Adicione pelo menos uma ação");
    onSave(form);
    onOpenChange(false);
    toast.success(initial?.id ? "Automação atualizada" : "Automação criada");
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto flex flex-col p-0">
        <SheetHeader className="p-6 border-b border-border">
          <SheetTitle className="font-heading flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary" />
            {initial?.id ? "Editar automação" : "Nova automação"}
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Basic info */}
          <div className="space-y-3">
            <div>
              <Label>Nome</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ex.: Boas-vindas ao lead novo" data-testid="auto-name" />
            </div>
            <div>
              <Label>Descrição</Label>
              <Textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="O que essa automação faz?" />
            </div>
          </div>

          {/* Trigger */}
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Gatilho</div>
            <div className="rounded-lg border-2 border-primary/30 border-dashed p-4 bg-primary/5">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary text-primary-foreground flex items-center justify-center shrink-0">
                  <TIcon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <Select value={form.trigger?.type} onValueChange={(v) => setForm({ ...form, trigger: { type: v, config: {} } })}>
                    <SelectTrigger data-testid="auto-trigger"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {TRIGGER_TYPES.map((tr) => (
                        <SelectItem key={tr.key} value={tr.key}>{tr.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="text-xs text-muted-foreground mt-1.5">{t?.desc}</div>

                  {/* Trigger config */}
                  {form.trigger?.type === "deal_stale" && (
                    <div className="mt-3">
                      <Label className="text-xs">Dias parado</Label>
                      <Input type="number" defaultValue={7} onChange={(e) => setForm({ ...form, trigger: { ...form.trigger, config: { ...form.trigger.config, days: Number(e.target.value) } } })} className="mt-1" />
                    </div>
                  )}
                  {form.trigger?.type === "contract_expiring" && (
                    <div className="mt-3">
                      <Label className="text-xs">Dias antes do vencimento</Label>
                      <Input type="number" defaultValue={45} onChange={(e) => setForm({ ...form, trigger: { ...form.trigger, config: { ...form.trigger.config, daysBefore: Number(e.target.value) } } })} className="mt-1" />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Flow arrow */}
          <div className="flex justify-center">
            <div className="w-px h-6 bg-border" />
          </div>

          {/* Actions */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Ações · executadas em sequência</div>
              <Badge variant="secondary" className="text-[10px]">{form.actions?.length || 0}</Badge>
            </div>

            <div className="space-y-2">
              {form.actions?.map((a, i) => {
                const meta = actionMeta(a.type);
                const AIcon = ACTION_ICONS[meta?.icon] || Zap;
                return (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-lg border border-border bg-card group" data-testid={`action-${i}`}>
                    <GripVertical className="w-4 h-4 text-muted-foreground mt-2 shrink-0" />
                    <div className="w-9 h-9 rounded-md flex items-center justify-center shrink-0" style={{ background: `${meta?.color}20`, color: meta?.color }}>
                      <AIcon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium">{meta?.label}</div>
                      {a.type === "send_whatsapp" && (
                        <Textarea rows={2} value={a.config?.template || ""} onChange={(e) => {
                          const next = [...form.actions]; next[i] = { ...a, config: { ...a.config, template: e.target.value } }; setForm({ ...form, actions: next });
                        }} placeholder="Olá {nome}, tudo bem?" className="mt-2 text-xs" />
                      )}
                      {a.type === "ai_message" && (
                        <div className="flex gap-2 mt-2">
                          <Select value={a.config?.channel || "whatsapp"} onValueChange={(v) => {
                            const next = [...form.actions]; next[i] = { ...a, config: { ...a.config, channel: v } }; setForm({ ...form, actions: next });
                          }}>
                            <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                            <SelectContent><SelectItem value="whatsapp">WhatsApp</SelectItem><SelectItem value="email">E-mail</SelectItem><SelectItem value="sms">SMS</SelectItem></SelectContent>
                          </Select>
                          <Select value={a.config?.tone || "cordial"} onValueChange={(v) => {
                            const next = [...form.actions]; next[i] = { ...a, config: { ...a.config, tone: v } }; setForm({ ...form, actions: next });
                          }}>
                            <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                            <SelectContent><SelectItem value="cordial">Cordial</SelectItem><SelectItem value="formal">Formal</SelectItem><SelectItem value="urgente">Urgente</SelectItem></SelectContent>
                          </Select>
                        </div>
                      )}
                      {a.type === "create_task" && (
                        <Input placeholder="Título da tarefa" value={a.config?.title || ""} onChange={(e) => {
                          const next = [...form.actions]; next[i] = { ...a, config: { ...a.config, title: e.target.value } }; setForm({ ...form, actions: next });
                        }} className="mt-2 h-8 text-xs" />
                      )}
                    </div>
                    <Button size="icon" variant="ghost" className="h-7 w-7 opacity-0 group-hover:opacity-100" onClick={() => removeAction(i)}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                );
              })}
              {form.actions?.length === 0 && (
                <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                  Nenhuma ação ainda. Adicione uma abaixo.
                </div>
              )}
            </div>

            {/* Action picker */}
            <div className="mt-3">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Adicionar ação</div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {ACTION_TYPES.map((a) => {
                  const AIcon = ACTION_ICONS[a.icon] || Zap;
                  return (
                    <button
                      key={a.key}
                      onClick={() => addAction(a.key)}
                      data-testid={`add-action-${a.key}`}
                      className="p-2.5 rounded-md border border-border hover:border-primary/40 hover:bg-primary/5 text-left transition-colors"
                    >
                      <AIcon className="w-4 h-4 mb-1" style={{ color: a.color }} />
                      <div className="text-[11px] font-medium leading-tight">{a.label}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <SheetFooter className="p-6 border-t border-border">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSave} data-testid="save-automation">
            <Zap className="w-4 h-4 mr-2" />
            {initial?.id ? "Salvar alterações" : "Criar automação"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};

/* ---------- Main page ---------- */
const Automations = () => {
  const { activeTenantId } = useAppStore();
  const { automations, automationLog, addAutomation, updateAutomation, toggleAutomation, deleteAutomation, runAutomation } = useDataStore();
  const [builderOpen, setBuilderOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const tenantAutomations = automations.filter((a) => a.tenantId === activeTenantId);
  const activeCount = tenantAutomations.filter((a) => a.active).length;
  const totalRuns = tenantAutomations.reduce((s, a) => s + (a.stats?.runs || 0), 0);
  const successRuns = tenantAutomations.reduce((s, a) => s + (a.stats?.success || 0), 0);
  const successRate = totalRuns > 0 ? Math.round((successRuns / totalRuns) * 100) : 0;
  const todayRuns = automationLog.filter((l) => new Date(l.at).toDateString() === new Date().toDateString()).length;

  const handleSave = (data) => {
    if (data.id) updateAutomation(data.id, data);
    else addAutomation({ ...data, tenantId: activeTenantId });
  };

  const applyTemplate = (tpl) => {
    setEditing({
      name: tpl.name,
      description: tpl.desc,
      trigger: { type: tpl.trigger, config: {} },
      actions: tpl.actions.map((t) => ({ type: t, config: {} })),
      active: true,
    });
    setBuilderOpen(true);
  };

  return (
    <div className="space-y-6" data-testid="automations-page">
      <PageHeader
        title="Automações"
        subtitle="Fluxos automáticos que rodam pela sua equipe 24/7"
        actions={
          <Button size="sm" onClick={() => { setEditing(null); setBuilderOpen(true); }} data-testid="btn-new-automation">
            <Plus className="w-4 h-4 mr-2" /> Nova automação
          </Button>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard label="Automações ativas" value={`${activeCount}/${tenantAutomations.length}`} icon={Zap} tone="default" testId="kpi-active-autos" />
        <KPICard label="Execuções hoje" value={todayRuns} delta={22.4} icon={PlayCircle} tone="accent" />
        <KPICard label="Total executado" value={formatNumber(totalRuns)} icon={TrendingUp} tone="info" />
        <KPICard label="Taxa de sucesso" value={`${successRate}%`} icon={CheckCircle2} tone="default" />
      </div>

      <Tabs defaultValue="mine">
        <TabsList>
          <TabsTrigger value="mine" data-testid="tab-mine">Minhas automações ({tenantAutomations.length})</TabsTrigger>
          <TabsTrigger value="templates" data-testid="tab-templates">Templates ({AUTOMATION_TEMPLATES.length})</TabsTrigger>
          <TabsTrigger value="logs" data-testid="tab-logs">Execuções ({automationLog.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="mine" className="mt-4">
          {tenantAutomations.length === 0 ? (
            <Card className="p-10 text-center">
              <Zap className="w-10 h-10 text-muted-foreground mx-auto mb-3" strokeWidth={1.5} />
              <div className="font-heading font-semibold mb-1">Nenhuma automação criada</div>
              <div className="text-sm text-muted-foreground mb-4">Comece por um template ou crie a sua do zero.</div>
              <Button onClick={() => { setEditing(null); setBuilderOpen(true); }}>Criar automação</Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {tenantAutomations.map((auto) => (
                <AutomationCard
                  key={auto.id}
                  auto={auto}
                  onEdit={(a) => { setEditing(a); setBuilderOpen(true); }}
                  onToggle={toggleAutomation}
                  onDelete={deleteAutomation}
                  onRun={runAutomation}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="templates" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {AUTOMATION_TEMPLATES.map((tpl) => {
              const t = trigger(tpl.trigger);
              const TIcon = TRIGGER_ICONS[t?.icon] || Zap;
              return (
                <Card key={tpl.id} className="p-5 hover-lift" data-testid={`template-${tpl.id}`}>
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-accent/15 text-accent flex items-center justify-center shrink-0">
                      <TIcon className="w-5 h-5" strokeWidth={1.75} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-heading font-semibold leading-tight">{tpl.name}</div>
                      <Badge variant="outline" className="text-[10px] mt-1">{tpl.category}</Badge>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground mb-4 line-clamp-3">{tpl.desc}</div>
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {tpl.actions.map((k) => {
                      const meta = actionMeta(k);
                      const AIcon = ACTION_ICONS[meta?.icon] || Zap;
                      return (
                        <Badge key={k} variant="outline" className="text-[10px]" style={{ color: meta?.color, borderColor: `${meta?.color}40` }}>
                          <AIcon className="w-2.5 h-2.5 mr-1" />{meta?.label}
                        </Badge>
                      );
                    })}
                  </div>
                  <Button size="sm" className="w-full" onClick={() => applyTemplate(tpl)} data-testid={`use-template-${tpl.id}`}>
                    Usar este template
                  </Button>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="logs" className="mt-4">
          <Card className="overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-secondary/50 hover:bg-secondary/50">
                  <TableHead>Automação</TableHead>
                  <TableHead>Origem</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Detalhe</TableHead>
                  <TableHead>Quando</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {automationLog.map((l) => (
                  <TableRow key={l.id}>
                    <TableCell className="font-medium text-sm">{l.automationName}</TableCell>
                    <TableCell className="text-sm">{l.triggeredBy}</TableCell>
                    <TableCell>
                      {l.status === "sucesso" ? (
                        <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20" variant="outline"><CheckCircle2 className="w-3 h-3 mr-1" />Sucesso</Badge>
                      ) : (
                        <Badge className="bg-red-500/10 text-red-600 border-red-500/20" variant="outline"><XCircle className="w-3 h-3 mr-1" />Falhou</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{l.detail}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      <div>{formatDateTime(l.at)}</div>
                      <div>{relativeTime(l.at)}</div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>

      <AutomationBuilder
        open={builderOpen}
        onOpenChange={setBuilderOpen}
        initial={editing}
        onSave={handleSave}
      />
    </div>
  );
};

export default Automations;
