import React, { useMemo, useState } from "react";
import PageHeader from "@/components/shared/PageHeader";
import { useAppStore } from "@/store/useAppStore";
import { useDataStore } from "@/store/useDataStore";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors,
} from "@dnd-kit/core";
import { Plus, Flame, Clock, LayoutList, Kanban as KanbanIcon, Sparkles } from "lucide-react";
import { formatBRLShort, initials } from "@/lib/format";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useDroppable, useDraggable } from "@dnd-kit/core";
import EntityDrawer from "@/components/shared/EntityDrawer";
import CopilotDialog from "@/components/copilot/CopilotDialog";
import ScopeBanner from "@/components/shared/ScopeBanner";
import { usePermissions } from "@/hooks/usePermissions";

const DealCard = ({ deal, agent, funnel, onOpen }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: deal.id });
  const style = transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` } : undefined;
  const stage = funnel.stages.find((s) => s.id === deal.stageId);
  const stageName = stage?.name || "";

  const tempColor = { quente: "text-red-500", morno: "text-amber-500", frio: "text-blue-400" }[deal.temperature];
  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "p-3 rounded-md bg-card border border-border hover-lift group",
        isDragging && "opacity-50"
      )}
      data-testid={`deal-card-${deal.id}`}
    >
      <div {...listeners} {...attributes} className="cursor-grab active:cursor-grabbing">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="text-sm font-medium leading-tight line-clamp-2 flex-1">{deal.title}</div>
          <Flame className={cn("w-3.5 h-3.5 shrink-0", tempColor)} />
        </div>
        <div className="text-xs text-muted-foreground line-clamp-1 mb-3">{deal.propertyTitle}</div>
        <div className="flex items-center justify-between">
          <div className="font-heading font-semibold text-sm tabular-nums text-primary">{formatBRLShort(deal.value)}</div>
          {agent && (
            <Avatar className="w-6 h-6"><AvatarImage src={agent.avatar} /><AvatarFallback className="text-[10px]">{initials(agent.name)}</AvatarFallback></Avatar>
          )}
        </div>
        <div className="flex items-center gap-1 mt-2 text-[10px] text-muted-foreground">
          <Clock className="w-3 h-3" /> {deal.daysInStage}d na etapa
        </div>
      </div>
      <div className="flex items-center gap-1 mt-2 pt-2 border-t border-border opacity-0 group-hover:opacity-100 transition-opacity">
        <CopilotDialog
          deal={{ ...deal, stage: stageName }}
          clientName={deal.clientName}
          propertyTitle={deal.propertyTitle}
          defaultTab="suggest"
          trigger={
            <Button size="sm" variant="ghost" className="h-6 px-2 text-[10px] flex-1" data-testid={`deal-copilot-${deal.id}`}>
              <Sparkles className="w-3 h-3 mr-1" /> Copilot
            </Button>
          }
        />
        <Button size="sm" variant="ghost" className="h-6 px-2 text-[10px] flex-1" onClick={() => onOpen({ ...deal, stage: stageName })}>
          Detalhes
        </Button>
      </div>
    </div>
  );
};

const KanbanColumn = ({ stage, deals, agents, funnel, onOpen }) => {
  const { setNodeRef, isOver } = useDroppable({ id: stage.id });
  const total = deals.reduce((s, d) => s + d.value, 0);
  return (
    <div className="w-72 shrink-0">
      <div className="flex items-center justify-between mb-2 px-1">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ background: stage.color }} />
          <div className="text-sm font-medium">{stage.name}</div>
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{deals.length}</Badge>
        </div>
        <div className="text-xs text-muted-foreground tabular-nums">{formatBRLShort(total)}</div>
      </div>
      <div
        ref={setNodeRef}
        className={cn("kanban-column rounded-lg p-2 min-h-[400px] space-y-2 transition-colors", isOver && "bg-primary/5 border-primary/40")}
        data-testid={`kanban-col-${stage.id}`}
      >
        {deals.map((d) => (
          <DealCard key={d.id} deal={d} agent={agents.find((a) => a.id === d.agentId)} funnel={funnel} onOpen={onOpen} />
        ))}
      </div>
    </div>
  );
};

const CRM = () => {
  const { activeTenantId } = useAppStore();
  const { deals, funnels, agents, moveDeal } = useDataStore();
  const { filterByScope } = usePermissions();
  const [funnelId, setFunnelId] = useState("f1");
  const [drawerDeal, setDrawerDeal] = useState(null);
  const funnel = funnels.find((f) => f.id === funnelId) || funnels[0];
  const tenantDeals = filterByScope(deals).filter((d) => d.tenantId === activeTenantId && d.funnelId === funnel.id);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const onDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const deal = deals.find((d) => d.id === active.id);
    if (!deal || deal.stageId === over.id) return;
    moveDeal(active.id, over.id);
    const stage = funnel.stages.find((s) => s.id === over.id);
    toast.success(`"${deal.title.slice(0, 30)}..." → ${stage?.name}`);
  };

  const dealsByStage = useMemo(() => {
    const map = {};
    funnel.stages.forEach((s) => (map[s.id] = []));
    tenantDeals.forEach((d) => {
      if (map[d.stageId]) map[d.stageId].push(d);
    });
    return map;
  }, [tenantDeals, funnel]);

  const totalVGV = tenantDeals.reduce((s, d) => s + d.value, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="CRM"
        subtitle={`${tenantDeals.length} negócios · ${formatBRLShort(totalVGV)} em pipeline`}
        actions={
          <>
            <div className="flex items-center gap-1 rounded-md border border-border p-1">
              {funnels.map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFunnelId(f.id)}
                  className={cn(
                    "px-3 py-1 text-xs rounded transition-colors",
                    f.id === funnelId ? "bg-primary text-primary-foreground" : "hover:bg-secondary"
                  )}
                  data-testid={`funnel-${f.id}`}
                >
                  {f.name}
                </button>
              ))}
            </div>
            <Button size="sm" data-testid="btn-new-deal" onClick={() => toast.info("Novo negócio (mock)")}>
              <Plus className="w-4 h-4 mr-2" /> Novo negócio
            </Button>
          </>
        }
      />

      <Tabs defaultValue="kanban">
        <TabsList>
          <TabsTrigger value="kanban" data-testid="tab-kanban"><KanbanIcon className="w-4 h-4 mr-1.5" />Kanban</TabsTrigger>
          <TabsTrigger value="list" data-testid="tab-list"><LayoutList className="w-4 h-4 mr-1.5" />Lista</TabsTrigger>
        </TabsList>

        <div className="mt-4"><ScopeBanner /></div>

        <TabsContent value="kanban" className="mt-4">
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
            <div className="flex gap-4 overflow-x-auto pb-4">
              {funnel.stages.map((stage) => (
                <KanbanColumn key={stage.id} stage={stage} deals={dealsByStage[stage.id] || []} agents={agents} funnel={funnel} onOpen={setDrawerDeal} />
              ))}
            </div>
          </DndContext>
        </TabsContent>

        <TabsContent value="list" className="mt-4">
          <Card className="p-0 overflow-hidden">
            <div className="divide-y divide-border">
              {tenantDeals.map((d) => {
                const agent = agents.find((a) => a.id === d.agentId);
                const stage = funnel.stages.find((s) => s.id === d.stageId);
                return (
                  <div key={d.id} className="flex items-center gap-4 p-4 hover:bg-secondary/50 cursor-pointer" onClick={() => setDrawerDeal({ ...d, stage: stage?.name })}>
                    <div className="w-1 h-10 rounded-full" style={{ background: stage?.color }} />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{d.title}</div>
                      <div className="text-xs text-muted-foreground truncate">{d.propertyTitle}</div>
                    </div>
                    <Badge variant="outline">{stage?.name}</Badge>
                    <div className="font-heading font-semibold tabular-nums text-primary w-24 text-right">{formatBRLShort(d.value)}</div>
                    {agent && (
                      <Avatar className="w-8 h-8"><AvatarImage src={agent.avatar} /><AvatarFallback>{initials(agent.name)}</AvatarFallback></Avatar>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CRM;
