import React from "react";
import PageHeader from "@/components/shared/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useDataStore } from "@/store/useDataStore";
import { relativeTime } from "@/lib/format";
import { cn } from "@/lib/utils";

const Notifications = () => {
  const { notifications, markAllRead, markRead } = useDataStore();
  const unread = notifications.filter((n) => !n.read);
  const read = notifications.filter((n) => n.read);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Central de Notificações"
        subtitle={`${unread.length} não lidas de ${notifications.length}`}
        actions={<Button size="sm" variant="outline" onClick={markAllRead}>Marcar todas como lidas</Button>}
      />
      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">Todas ({notifications.length})</TabsTrigger>
          <TabsTrigger value="unread">Não lidas ({unread.length})</TabsTrigger>
          <TabsTrigger value="read">Lidas ({read.length})</TabsTrigger>
        </TabsList>
        {[
          { k: "all", list: notifications },
          { k: "unread", list: unread },
          { k: "read", list: read },
        ].map((t) => (
          <TabsContent key={t.k} value={t.k} className="mt-4">
            <Card className="divide-y divide-border">
              {t.list.map((n) => (
                <button key={n.id} onClick={() => markRead(n.id)} className={cn("w-full text-left p-4 flex items-start gap-3 hover:bg-secondary/50", !n.read && "bg-primary/5")}>
                  {!n.read && <span className="w-2 h-2 rounded-full bg-primary mt-2 shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <div className="font-medium">{n.title}</div>
                      <Badge variant="outline" className="text-[10px] capitalize">{n.type}</Badge>
                    </div>
                    <div className="text-sm text-muted-foreground mt-0.5">{n.desc}</div>
                    <div className="text-xs text-muted-foreground mt-1">{relativeTime(n.createdAt)}</div>
                  </div>
                </button>
              ))}
              {t.list.length === 0 && <div className="p-10 text-center text-sm text-muted-foreground">Nenhuma notificação</div>}
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

export default Notifications;
