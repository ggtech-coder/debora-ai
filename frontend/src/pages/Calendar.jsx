import React from "react";
import PageHeader from "@/components/shared/PageHeader";
import { useAppStore } from "@/store/useAppStore";
import { useDataStore } from "@/store/useDataStore";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Calendar as CalendarUI } from "@/components/ui/calendar";
import { Plus, MapPin, Clock, Users } from "lucide-react";
import { formatDate, formatDateTime, initials } from "@/lib/format";
import { cn } from "@/lib/utils";
import ScopeBanner from "@/components/shared/ScopeBanner";
import { usePermissions } from "@/hooks/usePermissions";

const typeColor = {
  Visita: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  Reunião: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  Contrato: "bg-purple-500/10 text-purple-600 border-purple-500/20",
  Vistoria: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  Ligação: "bg-cyan-500/10 text-cyan-600 border-cyan-500/20",
  Fechamento: "bg-primary/15 text-primary border-primary/20",
};

const CalendarPage = () => {
  const { activeTenantId } = useAppStore();
  const { events, agents } = useDataStore();
  const { filterByScope } = usePermissions();
  const [date, setDate] = React.useState(new Date());

  const tenantEvents = filterByScope(events).filter((e) => e.tenantId === activeTenantId).sort((a, b) => new Date(a.date) - new Date(b.date));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Agenda"
        subtitle="Compromissos, visitas e reuniões da equipe"
        actions={<Button size="sm" data-testid="btn-new-event"><Plus className="w-4 h-4 mr-2" />Novo compromisso</Button>}
      />

      <ScopeBanner />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="p-4 lg:col-span-1">
          <CalendarUI mode="single" selected={date} onSelect={setDate} className="rounded-md" />
          <div className="mt-4 pt-4 border-t border-border">
            <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">Integrações</div>
            <div className="flex gap-2">
              <Badge variant="outline" className="text-xs">Google Agenda (em breve)</Badge>
              <Badge variant="outline" className="text-xs">Outlook (em breve)</Badge>
            </div>
          </div>
        </Card>

        <Card className="p-5 lg:col-span-2">
          <div className="font-heading text-lg font-semibold mb-4">Próximos eventos</div>
          <div className="space-y-3">
            {tenantEvents.map((e) => {
              const agent = agents.find((a) => a.id === e.agentId);
              return (
                <div key={e.id} className="flex items-start gap-3 p-3 rounded-md border border-border hover:bg-secondary/50" data-testid={`event-${e.id}`}>
                  <div className="w-14 shrink-0 text-center">
                    <div className="text-xs text-muted-foreground uppercase">{new Date(e.date).toLocaleDateString("pt-BR", { month: "short" })}</div>
                    <div className="font-heading text-2xl font-semibold leading-none">{new Date(e.date).getDate()}</div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="font-medium">{e.title}</div>
                      <Badge className={cn("border text-[10px]", typeColor[e.type])} variant="outline">{e.type}</Badge>
                    </div>
                    <div className="text-xs text-muted-foreground flex items-center gap-3 flex-wrap">
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{formatDateTime(e.date)}</span>
                      <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{e.location}</span>
                      <span className="flex items-center gap-1"><Users className="w-3 h-3" />{e.clientName}</span>
                    </div>
                  </div>
                  {agent && <Avatar className="w-9 h-9"><AvatarImage src={agent.avatar} /><AvatarFallback>{initials(agent.name)}</AvatarFallback></Avatar>}
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default CalendarPage;
