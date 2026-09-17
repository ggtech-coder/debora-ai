import React, { useState } from "react";
import PageHeader from "@/components/shared/PageHeader";
import { useAppStore } from "@/store/useAppStore";
import { useDataStore } from "@/store/useDataStore";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Shuffle, Zap } from "lucide-react";
import { initials } from "@/lib/format";
import { toast } from "sonner";

const LeadRotation = () => {
  const { activeTenantId } = useAppStore();
  const { agents, rotateLeads } = useDataStore();
  const active = agents.filter((a) => a.tenantId === activeTenantId);
  const [weights, setWeights] = useState(Object.fromEntries(active.map((a) => [a.id, 1])));
  const [autoRotate, setAutoRotate] = useState(true);
  const [limit, setLimit] = useState(20);

  const handleRotate = () => {
    const n = rotateLeads(activeTenantId);
    toast.success(`${n} leads distribuídos`);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Rodízio de Leads"
        subtitle="Distribuição automática, regras, peso por corretor e histórico"
        actions={<Button size="sm" onClick={handleRotate} data-testid="btn-run-rotation"><Zap className="w-4 h-4 mr-2" />Executar rodízio</Button>}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="p-5 lg:col-span-2">
          <div className="font-heading text-lg font-semibold mb-4">Peso por corretor</div>
          <div className="space-y-4">
            {active.map((a) => (
              <div key={a.id} className="flex items-center gap-4">
                <Avatar className="w-9 h-9"><AvatarImage src={a.avatar} /><AvatarFallback>{initials(a.name)}</AvatarFallback></Avatar>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{a.name}</div>
                  <div className="text-xs text-muted-foreground">{a.leadsAssigned} leads atribuídos · {a.dealsWon} conversões</div>
                </div>
                <div className="w-40">
                  <Slider value={[weights[a.id] || 1]} min={0} max={5} step={1} onValueChange={(v) => setWeights({ ...weights, [a.id]: v[0] })} />
                </div>
                <div className="font-mono text-xs w-6 text-right">{weights[a.id]}x</div>
                <Switch checked={a.active} />
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <div className="font-heading text-lg font-semibold mb-4">Regras</div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="auto">Distribuição automática</Label>
              <Switch id="auto" checked={autoRotate} onCheckedChange={setAutoRotate} />
            </div>
            <div>
              <Label>Limite diário por corretor</Label>
              <Input type="number" value={limit} onChange={(e) => setLimit(Number(e.target.value))} className="mt-1.5" />
            </div>
            <div>
              <Label>Horário de distribuição</Label>
              <div className="grid grid-cols-2 gap-2 mt-1.5">
                <Input type="time" defaultValue="08:00" />
                <Input type="time" defaultValue="20:00" />
              </div>
            </div>
            <div className="pt-3 border-t border-border">
              <Badge variant="outline" className="w-full justify-center">
                <Shuffle className="w-3 h-3 mr-1" /> Round-robin ponderado ativo
              </Badge>
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-5">
        <div className="font-heading text-lg font-semibold mb-2">Histórico e auditoria</div>
        <div className="text-sm text-muted-foreground">Todas as distribuições são registradas com timestamp, corretor de destino e origem do lead. Estrutura pronta para auditoria completa e exportação.</div>
      </Card>
    </div>
  );
};

export default LeadRotation;
