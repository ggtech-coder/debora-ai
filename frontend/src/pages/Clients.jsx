import React, { useState } from "react";
import PageHeader from "@/components/shared/PageHeader";
import { useAppStore } from "@/store/useAppStore";
import { useDataStore } from "@/store/useDataStore";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, Plus, Building2, Phone, Mail } from "lucide-react";
import { formatBRL, formatDate, initials } from "@/lib/format";
import EntityDrawer from "@/components/shared/EntityDrawer";
import ScopeBanner from "@/components/shared/ScopeBanner";
import { usePermissions } from "@/hooks/usePermissions";

const Clients = () => {
  const { activeTenantId } = useAppStore();
  const { clients, agents } = useDataStore();
  const { filterByScope } = usePermissions();
  const [search, setSearch] = useState("");
  const [drawerClient, setDrawerClient] = React.useState(null);

  const list = filterByScope(clients).filter((c) =>
    c.tenantId === activeTenantId &&
    (!search || c.name.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Clientes"
        subtitle={`${list.length} clientes cadastrados`}
        actions={<Button size="sm"><Plus className="w-4 h-4 mr-2" />Novo cliente</Button>}
      />

      <ScopeBanner />

      <Card className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Buscar cliente..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" data-testid="clients-search" />
        </div>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {list.map((c) => {
          const agent = agents.find((a) => a.id === c.agentId);
          return (
            <Card key={c.id} className="p-5 hover-lift cursor-pointer" data-testid={`client-card-${c.id}`} onClick={() => setDrawerClient(c)}>
              <div className="flex items-start gap-3 mb-4">
                <Avatar className="w-11 h-11"><AvatarFallback className="bg-primary text-primary-foreground">{initials(c.name)}</AvatarFallback></Avatar>
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{c.name}</div>
                  <div className="text-xs text-muted-foreground font-mono">{c.document}</div>
                </div>
                <Badge variant="outline">{c.type}</Badge>
              </div>
              <div className="space-y-1.5 text-xs text-muted-foreground">
                <div className="flex items-center gap-2"><Phone className="w-3.5 h-3.5" />{c.phone}</div>
                <div className="flex items-center gap-2"><Mail className="w-3.5 h-3.5" />{c.email}</div>
                <div className="flex items-center gap-2"><Building2 className="w-3.5 h-3.5" />{c.properties} imóveis</div>
              </div>
              <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Total investido</div>
                  <div className="font-heading font-semibold tabular-nums text-primary">{formatBRL(c.totalValue)}</div>
                </div>
                {agent && <Avatar className="w-7 h-7"><AvatarImage src={agent.avatar} /><AvatarFallback>{initials(agent.name)}</AvatarFallback></Avatar>}
              </div>
            </Card>
          );
        })}
      </div>

      <EntityDrawer entity={drawerClient} kind="client" open={!!drawerClient} onOpenChange={(v) => !v && setDrawerClient(null)} />
    </div>
  );
};

export default Clients;
