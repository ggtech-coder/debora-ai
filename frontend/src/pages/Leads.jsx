import React, { useState } from "react";
import PageHeader from "@/components/shared/PageHeader";
import { useDataStore } from "@/store/useDataStore";
import { useAppStore } from "@/store/useAppStore";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Search, Plus, Shuffle, Filter, Flame } from "lucide-react";
import { formatBRL, relativeTime, initials } from "@/lib/format";
import { toast } from "sonner";
import EntityDrawer from "@/components/shared/EntityDrawer";
import ScopeBanner from "@/components/shared/ScopeBanner";
import { usePermissions } from "@/hooks/usePermissions";

const ORIGINS = ["Instagram", "Facebook Ads", "Google Ads", "Site próprio", "Indicação", "OLX", "Zap Imóveis", "WhatsApp"];
const STATUS = ["Novo", "Contatado", "Qualificado", "Sem interesse"];

const statusColor = {
  Novo: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
  Contatado: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  Qualificado: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  "Sem interesse": "bg-muted text-muted-foreground border-border",
};

const Leads = () => {
  const { activeTenantId } = useAppStore();
  const { leads, agents, addLead, rotateLeads } = useDataStore();
  const { filterByScope } = usePermissions();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [originFilter, setOriginFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", email: "", origin: "Instagram", interest: "", budget: "" });
  const [drawerLead, setDrawerLead] = useState(null);

  const filtered = filterByScope(leads).filter((l) => {
    if (l.tenantId !== activeTenantId) return false;
    if (statusFilter !== "all" && l.status !== statusFilter) return false;
    if (originFilter !== "all" && l.origin !== originFilter) return false;
    if (search && !`${l.name} ${l.email} ${l.phone}`.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const handleAdd = () => {
    if (!form.name) return toast.error("Nome é obrigatório");
    addLead({
      ...form,
      budget: Number(form.budget) || 0,
      tenantId: activeTenantId,
      status: "Novo",
      agentId: agents.find((a) => a.tenantId === activeTenantId)?.id,
    });
    toast.success("Lead cadastrado");
    setForm({ name: "", phone: "", email: "", origin: "Instagram", interest: "", budget: "" });
    setDialogOpen(false);
  };

  const handleRotate = () => {
    const n = rotateLeads(activeTenantId);
    toast.success(`${n} leads distribuídos via rodízio`);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Leads"
        subtitle={`${filtered.length} leads na base ativa`}
        actions={
          <>
            <Button variant="outline" size="sm" onClick={handleRotate} data-testid="btn-rotate">
              <Shuffle className="w-4 h-4 mr-2" /> Rodízio
            </Button>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" data-testid="btn-new-lead"><Plus className="w-4 h-4 mr-2" /> Novo Lead</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Cadastrar novo lead</DialogTitle></DialogHeader>
                <div className="grid grid-cols-2 gap-3 py-2">
                  <div className="col-span-2"><Label>Nome</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} data-testid="lead-name" /></div>
                  <div><Label>Telefone</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
                  <div><Label>E-mail</Label><Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
                  <div>
                    <Label>Origem</Label>
                    <Select value={form.origin} onValueChange={(v) => setForm({ ...form, origin: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{ORIGINS.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div><Label>Orçamento (R$)</Label><Input type="number" value={form.budget} onChange={(e) => setForm({ ...form, budget: e.target.value })} /></div>
                  <div className="col-span-2"><Label>Interesse</Label><Input value={form.interest} onChange={(e) => setForm({ ...form, interest: e.target.value })} /></div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
                  <Button onClick={handleAdd} data-testid="save-lead">Salvar lead</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </>
        }
      />

      {/* Filters */}
      <ScopeBanner />
      <Card className="p-4 flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Buscar por nome, e-mail, telefone..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" data-testid="lead-search" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full md:w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos status</SelectItem>
            {STATUS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={originFilter} onValueChange={setOriginFilter}>
          <SelectTrigger className="w-full md:w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas origens</SelectItem>
            {ORIGINS.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
          </SelectContent>
        </Select>
      </Card>

      {/* Table */}
      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-secondary/50 hover:bg-secondary/50">
              <TableHead>Lead</TableHead>
              <TableHead>Origem</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Interesse</TableHead>
              <TableHead className="text-right">Orçamento</TableHead>
              <TableHead>Score</TableHead>
              <TableHead>Corretor</TableHead>
              <TableHead>Criado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((l) => {
              const agent = agents.find((a) => a.id === l.agentId);
              return (
                <TableRow key={l.id} data-testid={`lead-row-${l.id}`} className="cursor-pointer" onClick={() => setDrawerLead(l)}>
                  <TableCell>
                    <div className="font-medium hover:text-primary transition-colors">{l.name}</div>
                    <div className="text-xs text-muted-foreground">{l.email}</div>
                  </TableCell>
                  <TableCell><Badge variant="outline">{l.origin}</Badge></TableCell>
                  <TableCell><Badge className={`border ${statusColor[l.status]}`} variant="outline">{l.status}</Badge></TableCell>
                  <TableCell className="text-sm">{l.interest}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatBRL(l.budget)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      {l.score > 70 && <Flame className="w-3.5 h-3.5 text-accent" />}
                      <span className="font-mono text-xs">{l.score}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {agent && (
                      <div className="flex items-center gap-2">
                        <Avatar className="w-6 h-6"><AvatarImage src={agent.avatar} /><AvatarFallback>{initials(agent.name)}</AvatarFallback></Avatar>
                        <span className="text-xs truncate max-w-[100px]">{agent.name.split(" ")[0]}</span>
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{relativeTime(l.createdAt)}</TableCell>
                </TableRow>
              );
            })}
            {filtered.length === 0 && (
              <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">Nenhum lead encontrado</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      <EntityDrawer entity={drawerLead} kind="lead" open={!!drawerLead} onOpenChange={(v) => !v && setDrawerLead(null)} />
    </div>
  );
};

export default Leads;
