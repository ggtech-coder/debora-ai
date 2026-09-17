import React from "react";
import PageHeader from "@/components/shared/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useDataStore } from "@/store/useDataStore";
import { useAppStore } from "@/store/useAppStore";
import { usePermissionsStore } from "@/store/usePermissionsStore";
import { usePermissions } from "@/hooks/usePermissions";
import { initials } from "@/lib/format";
import { Plus, Shield, Webhook, Key, History, Lock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import PermissionsEditor from "@/components/settings/PermissionsEditor";
import { toast } from "sonner";

const Settings = () => {
  const { activeTenantId } = useAppStore();
  const { agents, teams } = useDataStore();
  const { roles } = usePermissionsStore();
  const { isAdmin } = usePermissions();
  const tenantAgents = agents.filter((a) => a.tenantId === activeTenantId);
  const [assignments, setAssignments] = React.useState(() => {
    // seed default mapping: keep whatever role each agent has (fallback by role string)
    return Object.fromEntries(tenantAgents.map((a) => [a.id, a.roleId || (a.role?.includes("Diretora") ? "admin" : a.role?.includes("Sênior") ? "gestor" : "corretor")]));
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Configurações" subtitle="Empresa, usuários, permissões, integrações e segurança" />
      <Tabs defaultValue="general">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="general">Gerais</TabsTrigger>
          <TabsTrigger value="users">Usuários</TabsTrigger>
          <TabsTrigger value="teams">Equipes</TabsTrigger>
          <TabsTrigger value="permissions">Permissões</TabsTrigger>
          <TabsTrigger value="security">Segurança</TabsTrigger>
          <TabsTrigger value="api">API</TabsTrigger>
          <TabsTrigger value="integrations">Integrações</TabsTrigger>
          <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
          <TabsTrigger value="audit">Auditoria</TabsTrigger>
          <TabsTrigger value="notif">Notificações</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="mt-4">
          <Card className="p-6 max-w-2xl space-y-4">
            <div><Label>Razão social</Label><Input defaultValue="Prime Imóveis LTDA" /></div>
            <div><Label>CNPJ</Label><Input defaultValue="12.345.678/0001-90" /></div>
            <div><Label>Cidade</Label><Input defaultValue="São Paulo, SP" /></div>
            <Button>Salvar alterações</Button>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="mt-4">
          <Card className="p-4">
            <div className="flex justify-between mb-4">
              <div className="font-heading font-semibold">Usuários da conta</div>
              <Button size="sm" disabled={!isAdmin} data-testid="btn-invite-user"><Plus className="w-4 h-4 mr-2" />Convidar</Button>
            </div>
            <div className="divide-y divide-border">
              {tenantAgents.map((a) => {
                const currentRoleId = assignments[a.id] || "corretor";
                const currentRole = roles.find((r) => r.id === currentRoleId);
                return (
                  <div key={a.id} className="flex items-center gap-3 py-3">
                    <Avatar className="w-9 h-9"><AvatarImage src={a.avatar} /><AvatarFallback>{initials(a.name)}</AvatarFallback></Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">{a.name}</div>
                      <div className="text-xs text-muted-foreground truncate">{a.email}</div>
                    </div>
                    <div className="w-44">
                      <Select
                        value={currentRoleId}
                        onValueChange={(v) => {
                          if (!isAdmin) return;
                          setAssignments({ ...assignments, [a.id]: v });
                          toast.success(`${a.name.split(" ")[0]} agora é ${roles.find((r) => r.id === v)?.name}`);
                        }}
                        disabled={!isAdmin}
                      >
                        <SelectTrigger className="h-8 text-xs" data-testid={`user-role-${a.id}`}>
                          <SelectValue>
                            <span className="flex items-center gap-1.5">
                              <span className="inline-block w-2 h-2 rounded-full" style={{ background: currentRole?.color }} />
                              {currentRole?.name}
                            </span>
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {roles.map((r) => (
                            <SelectItem key={r.id} value={r.id}>
                              <span className="flex items-center gap-2">
                                <span className="inline-block w-2 h-2 rounded-full" style={{ background: r.color }} />
                                {r.name}
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Switch checked={a.active} disabled={!isAdmin} />
                  </div>
                );
              })}
            </div>
            {!isAdmin && (
              <div className="mt-4 pt-4 border-t border-border flex items-center gap-2 text-xs text-muted-foreground">
                <Lock className="w-3.5 h-3.5" /> Apenas Admins podem alterar papéis e convidar usuários.
              </div>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="teams" className="mt-4">
          <div className="grid md:grid-cols-2 gap-4">
            {teams.filter((t) => t.tenantId === activeTenantId).map((t) => (
              <Card key={t.id} className="p-5">
                <div className="font-heading text-lg font-semibold">{t.name}</div>
                <div className="text-sm text-muted-foreground">Líder: {t.lead}</div>
                <div className="text-xs text-muted-foreground mt-2">{t.members} membros</div>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="permissions" className="mt-4">
          <PermissionsEditor />
        </TabsContent>
        <TabsContent value="security" className="mt-4">
          <Card className="p-6 space-y-4 max-w-xl">
            <div className="flex items-center justify-between"><Label>Autenticação em 2 fatores</Label><Switch defaultChecked /></div>
            <div className="flex items-center justify-between"><Label>Sessão única por usuário</Label><Switch /></div>
            <div className="flex items-center justify-between"><Label>Logs de login</Label><Switch defaultChecked /></div>
          </Card>
        </TabsContent>
        <TabsContent value="api" className="mt-4">
          <Card className="p-6 max-w-2xl">
            <div className="flex items-center gap-2 mb-4"><Key className="w-4 h-4" /><div className="font-medium">API Keys</div></div>
            <div className="flex items-center gap-2 p-3 rounded-md bg-secondary font-mono text-xs">sk_live_deb_•••••••••••••••••••• <Button size="sm" variant="outline" className="ml-auto">Copiar</Button></div>
          </Card>
        </TabsContent>
        <TabsContent value="integrations" className="mt-4">
          <div className="grid md:grid-cols-3 gap-3">
            {["Google Calendar", "Outlook", "WhatsApp Business", "Meta Ads", "Google Ads", "Zap Imóveis", "OLX", "VivaReal", "Portal Imovelweb"].map((n) => (
              <Card key={n} className="p-4 flex items-center justify-between hover-lift">
                <div className="text-sm font-medium">{n}</div>
                <Switch />
              </Card>
            ))}
          </div>
        </TabsContent>
        <TabsContent value="webhooks" className="mt-4">
          <Card className="p-6 max-w-2xl"><div className="flex items-center gap-2 mb-2"><Webhook className="w-4 h-4" /><span className="font-medium">Webhooks</span></div><Input placeholder="https://sua-api.com/webhook" /><Button className="mt-3" size="sm">Adicionar endpoint</Button></Card>
        </TabsContent>
        <TabsContent value="audit" className="mt-4">
          <Card className="p-6"><div className="flex items-center gap-2 mb-3"><History className="w-4 h-4" /><span className="font-medium">Logs de auditoria</span></div><div className="text-sm text-muted-foreground">Registros de todas as ações críticas dos usuários serão exibidos aqui.</div></Card>
        </TabsContent>
        <TabsContent value="notif" className="mt-4">
          <Card className="p-6 space-y-3 max-w-xl">
            {["E-mail", "Push", "WhatsApp", "SMS"].map((c) => (
              <div key={c} className="flex items-center justify-between"><Label>{c}</Label><Switch defaultChecked={c !== "SMS"} /></div>
            ))}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;
