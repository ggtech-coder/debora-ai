import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle,
  AlertDialogDescription, AlertDialogFooter, AlertDialogAction, AlertDialogCancel, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { usePermissionsStore } from "@/store/usePermissionsStore";
import { usePermissions } from "@/hooks/usePermissions";
import { MODULES, ACTIONS, moduleGroups, roleCan, SCOPES } from "@/lib/rbac";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Shield, ShieldCheck, Trash2, Plus, RotateCcw, Lock, Info, Crown, Eye } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const PermissionsEditor = () => {
  const { isAdmin, role: currentRole } = usePermissions();
  const { roles, togglePermission, setModuleAccess, createRole, updateRole, deleteRole, resetToDefaults, setScope } =
    usePermissionsStore();
  const [selectedId, setSelectedId] = useState(roles[0]?.id || "admin");
  const [showCreate, setShowCreate] = useState(false);
  const [newRole, setNewRole] = useState({ name: "", description: "", color: "#3B82F6" });

  const selected = roles.find((r) => r.id === selectedId) || roles[0];
  const groups = moduleGroups();

  if (!isAdmin) {
    return (
      <Alert>
        <Lock className="w-4 h-4" />
        <AlertDescription>
          Apenas usuários com o papel <span className="font-semibold">Admin</span> podem alterar permissões.
          Seu papel atual: <span className="font-semibold">{currentRole?.name}</span>.
        </AlertDescription>
      </Alert>
    );
  }

  const handleCreate = () => {
    if (!newRole.name.trim()) return toast.error("Informe um nome para o papel");
    createRole(newRole);
    toast.success(`Papel "${newRole.name}" criado`);
    setNewRole({ name: "", description: "", color: "#3B82F6" });
    setShowCreate(false);
  };

  const handleDelete = (id) => {
    deleteRole(id);
    toast.success("Papel excluído");
    if (selectedId === id) setSelectedId("admin");
  };

  const enabledCount = MODULES.filter((m) => roleCan(selected, m.key, "view")).length;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-4" data-testid="permissions-editor">
      {/* Roles list */}
      <Card className="lg:col-span-1 p-4 h-fit">
        <div className="flex items-center justify-between mb-3">
          <div className="font-heading font-semibold flex items-center gap-2">
            <Shield className="w-4 h-4" /> Papéis
          </div>
          <Dialog open={showCreate} onOpenChange={setShowCreate}>
            <DialogTrigger asChild>
              <Button size="icon" variant="ghost" className="h-7 w-7" data-testid="btn-new-role"><Plus className="w-4 h-4" /></Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Criar novo papel</DialogTitle></DialogHeader>
              <div className="space-y-3 py-2">
                <div><Label>Nome</Label><Input value={newRole.name} onChange={(e) => setNewRole({ ...newRole, name: e.target.value })} placeholder="Ex.: Estagiário" data-testid="new-role-name" /></div>
                <div><Label>Descrição</Label><Textarea rows={2} value={newRole.description} onChange={(e) => setNewRole({ ...newRole, description: e.target.value })} /></div>
                <div><Label>Cor identificadora</Label><Input type="color" value={newRole.color} onChange={(e) => setNewRole({ ...newRole, color: e.target.value })} className="h-10" /></div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowCreate(false)}>Cancelar</Button>
                <Button onClick={handleCreate} data-testid="save-new-role">Criar papel</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="space-y-1">
          {roles.map((r) => (
            <button
              key={r.id}
              onClick={() => setSelectedId(r.id)}
              data-testid={`role-item-${r.id}`}
              className={cn(
                "w-full flex items-center gap-2 p-2.5 rounded-md text-left transition-colors",
                selectedId === r.id ? "bg-primary/10 border border-primary/30" : "hover:bg-secondary border border-transparent"
              )}
            >
              <span className="inline-block w-2.5 h-2.5 rounded-full shrink-0" style={{ background: r.color }} />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate flex items-center gap-1.5">
                  {r.name}
                  {r.isSupreme && <Crown className="w-3 h-3 text-accent" />}
                </div>
                <div className="text-[10px] text-muted-foreground">
                  {r.isSupreme ? "Acesso total" : `${Object.values(r.permissions).filter((p) => p?.length > 0).length} módulos`}
                </div>
              </div>
              {r.isSystem && <Badge variant="outline" className="text-[9px] px-1 py-0">SYS</Badge>}
            </button>
          ))}
        </div>

        <div className="mt-4 pt-4 border-t border-border">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="sm" className="w-full text-xs text-muted-foreground">
                <RotateCcw className="w-3 h-3 mr-1.5" /> Restaurar padrão
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Restaurar papéis padrão?</AlertDialogTitle>
                <AlertDialogDescription>Isso descarta todas as personalizações e recria os 5 papéis originais.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={() => { resetToDefaults(); toast.success("Papéis restaurados"); }}>Restaurar</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </Card>

      {/* Permission matrix */}
      <Card className="lg:col-span-3 p-5">
        <div className="flex items-start justify-between gap-3 mb-4 pb-4 border-b border-border">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-md flex items-center justify-center" style={{ background: `${selected.color}25`, color: selected.color }}>
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <Input
                    value={selected.name}
                    disabled={selected.isSupreme}
                    onChange={(e) => updateRole(selected.id, { name: e.target.value })}
                    className="h-8 font-heading text-lg font-semibold border-transparent hover:border-border focus-visible:border-input px-2"
                    data-testid="role-name-input"
                  />
                  {selected.isSupreme && <Badge className="shrink-0"><Crown className="w-3 h-3 mr-1" />Supremo</Badge>}
                  {selected.isSystem && <Badge variant="outline" className="shrink-0">Sistema</Badge>}
                </div>
                <Input
                  value={selected.description || ""}
                  disabled={selected.isSupreme}
                  onChange={(e) => updateRole(selected.id, { description: e.target.value })}
                  className="h-7 border-transparent hover:border-border focus-visible:border-input px-2 text-xs text-muted-foreground"
                  placeholder="Descrição do papel"
                />
              </div>
            </div>
          </div>
          <div className="text-right shrink-0">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Módulos liberados</div>
            <div className="font-heading text-2xl font-semibold tabular-nums">{enabledCount}<span className="text-muted-foreground text-sm">/{MODULES.length}</span></div>
          </div>
          {!selected.isSystem && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" className="text-destructive"><Trash2 className="w-4 h-4" /></Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Excluir papel "{selected.name}"?</AlertDialogTitle>
                  <AlertDialogDescription>Usuários com este papel voltarão para "Somente visualização".</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={() => handleDelete(selected.id)} className="bg-destructive text-destructive-foreground">Excluir</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>

        {selected.isSupreme ? (
          <Alert>
            <Crown className="w-4 h-4" />
            <AlertDescription>
              O papel <span className="font-semibold">Admin</span> é supremo: sempre tem acesso a tudo. Não pode ser alterado ou excluído.
            </AlertDescription>
          </Alert>
        ) : (
          <>
            {/* Data scope selector */}
            <div className="mb-4 rounded-lg border border-border p-4 bg-secondary/30">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-md bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <Eye className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="font-medium text-sm">Escopo de visibilidade dos dados</div>
                    <Badge variant="outline" className="text-[10px]">registro a registro</Badge>
                  </div>
                  <div className="text-xs text-muted-foreground mb-3">
                    Controla quais registros (leads, clientes, negócios, agenda) este papel enxerga — mesmo tendo permissão de "Visualizar".
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {SCOPES.map((s) => {
                      const active = (selected.scope || "all") === s.key;
                      return (
                        <button
                          key={s.key}
                          onClick={() => setScope(selected.id, s.key)}
                          data-testid={`scope-${selected.id}-${s.key}`}
                          className={cn(
                            "text-left rounded-md border p-3 transition-colors",
                            active ? "border-primary bg-primary/5" : "border-border hover:bg-secondary"
                          )}
                        >
                          <div className="text-sm font-medium">{s.label}</div>
                          <div className="text-[11px] text-muted-foreground mt-0.5">{s.description}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            <Alert className="mb-4">
              <Info className="w-4 h-4" />
              <AlertDescription className="text-xs">
                Marque as ações permitidas por módulo. O toggle da esquerda liga/desliga todas as ações do módulo de uma vez.
              </AlertDescription>
            </Alert>

            <div className="space-y-6">
              {Object.entries(groups).map(([groupName, mods]) => (
                <div key={groupName}>
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2 px-1">{groupName}</div>
                  <div className="rounded-lg border border-border overflow-hidden">
                    <div className="grid grid-cols-[minmax(0,1fr)_auto_repeat(4,80px)] items-center gap-2 px-3 py-2 bg-secondary/50 text-[10px] uppercase tracking-wider text-muted-foreground">
                      <div>Módulo</div>
                      <div className="text-center">Ativo</div>
                      {ACTIONS.map((a) => <div key={a.key} className="text-center">{a.label}</div>)}
                    </div>
                    <div className="divide-y divide-border">
                      {mods.map((m) => {
                        const hasView = roleCan(selected, m.key, "view");
                        return (
                          <div key={m.key} className="grid grid-cols-[minmax(0,1fr)_auto_repeat(4,80px)] items-center gap-2 px-3 py-2" data-testid={`perm-row-${m.key}`}>
                            <div className="text-sm">{m.label}</div>
                            <div className="flex justify-center">
                              <Switch
                                checked={hasView}
                                onCheckedChange={(v) => setModuleAccess(selected.id, m.key, v)}
                                data-testid={`toggle-${selected.id}-${m.key}`}
                              />
                            </div>
                            {ACTIONS.map((a) => (
                              <div key={a.key} className="flex justify-center">
                                <Checkbox
                                  checked={roleCan(selected, m.key, a.key)}
                                  onCheckedChange={() => togglePermission(selected.id, m.key, a.key)}
                                  data-testid={`perm-${selected.id}-${m.key}-${a.key}`}
                                />
                              </div>
                            ))}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </Card>
    </div>
  );
};

export default PermissionsEditor;
