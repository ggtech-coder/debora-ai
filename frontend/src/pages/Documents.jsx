import React from "react";
import PageHeader from "@/components/shared/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { FileText, Upload, Check, Clock, PenTool, Folder } from "lucide-react";
import { useDataStore } from "@/store/useDataStore";
import { useAppStore } from "@/store/useAppStore";

const DOCS = [
  { id: "d1", client: "Roberto Cavalcanti", type: "RG", status: "aprovado" },
  { id: "d2", client: "Roberto Cavalcanti", type: "CPF", status: "aprovado" },
  { id: "d3", client: "Roberto Cavalcanti", type: "Comprovante", status: "revisão" },
  { id: "d4", client: "Helena Vasconcelos", type: "RG", status: "aprovado" },
  { id: "d5", client: "Helena Vasconcelos", type: "Contrato", status: "aguardando assinatura" },
  { id: "d6", client: "Marcos Aurélio", type: "RG", status: "pendente" },
  { id: "d7", client: "Marcos Aurélio", type: "CPF", status: "pendente" },
  { id: "d8", client: "Cíntia Batista", type: "Contrato", status: "aprovado" },
];

const statusColor = {
  aprovado: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  "revisão": "bg-amber-500/10 text-amber-600 border-amber-500/20",
  pendente: "bg-muted text-muted-foreground border-border",
  "aguardando assinatura": "bg-blue-500/10 text-blue-600 border-blue-500/20",
};

const statusIcon = { aprovado: Check, "revisão": Clock, pendente: Clock, "aguardando assinatura": PenTool };

const Documents = () => {
  const { clients } = useDataStore();
  const { activeTenantId } = useAppStore();
  const tenantClients = clients.filter((c) => c.tenantId === activeTenantId).slice(0, 5);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pipeline de Documentos"
        subtitle="Upload, organização por cliente, contratos e assinatura eletrônica"
        actions={<Button size="sm" data-testid="btn-upload-doc"><Upload className="w-4 h-4 mr-2" />Enviar documento</Button>}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2 p-0 overflow-hidden">
          <div className="p-4 border-b border-border font-heading font-semibold">Documentos recentes</div>
          <div className="divide-y divide-border">
            {DOCS.map((d) => {
              const Icon = statusIcon[d.status] || Clock;
              return (
                <div key={d.id} className="flex items-center gap-3 p-4 hover:bg-secondary/50">
                  <div className="w-10 h-10 rounded-md bg-secondary flex items-center justify-center"><FileText className="w-5 h-5 text-muted-foreground" /></div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm">{d.type} — {d.client}</div>
                    <div className="text-xs text-muted-foreground">2.4 MB · PDF</div>
                  </div>
                  <Badge className={`border capitalize ${statusColor[d.status]}`} variant="outline">
                    <Icon className="w-3 h-3 mr-1" />{d.status}
                  </Badge>
                  <Button size="sm" variant="ghost">Ver</Button>
                </div>
              );
            })}
          </div>
        </Card>

        <Card className="p-5">
          <div className="font-heading font-semibold mb-3">Por cliente</div>
          <div className="space-y-2">
            {tenantClients.map((c) => (
              <div key={c.id} className="flex items-center gap-2 p-2 rounded-md hover:bg-secondary/50 cursor-pointer">
                <Folder className="w-4 h-4 text-accent" />
                <div className="text-sm font-medium truncate">{c.name}</div>
                <Badge variant="outline" className="ml-auto text-[10px]">3 docs</Badge>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Documents;
