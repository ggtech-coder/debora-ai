import React from "react";
import PageHeader from "@/components/shared/PageHeader";
import KPICard from "@/components/shared/KPICard";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { useAppStore } from "@/store/useAppStore";
import { Building2, Users, DollarSign, Activity, ArrowUpRight, Edit } from "lucide-react";
import { toast } from "sonner";

const AdminMaster = () => {
  const { tenants, setActiveTenant } = useAppStore();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Administração Master"
        subtitle="Gestão global de empresas, planos, saúde da plataforma e indicadores SaaS"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard label="MRR" value="R$ 148k" delta={22.4} icon={DollarSign} tone="default" />
        <KPICard label="Empresas ativas" value={tenants.length + 147} delta={5.8} icon={Building2} tone="accent" />
        <KPICard label="Churn mensal" value="2.1%" delta={-0.4} icon={Users} tone="info" />
        <KPICard label="LTV médio" value="R$ 24k" delta={11.2} icon={ArrowUpRight} tone="warning" />
      </div>

      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="font-heading text-lg font-semibold">Empresas (tenants)</div>
          <div className="flex items-center gap-2">
            <Badge variant="outline"><Activity className="w-3 h-3 mr-1 text-emerald-500" />Plataforma saudável</Badge>
            <Button size="sm" variant="outline">Exportar</Button>
          </div>
        </div>
        <Table>
          <TableHeader>
            <TableRow className="bg-secondary/50 hover:bg-secondary/50">
              <TableHead>Empresa</TableHead>
              <TableHead>Cidade</TableHead>
              <TableHead>Plano</TableHead>
              <TableHead>MRR</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tenants.map((t) => (
              <TableRow key={t.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-md bg-primary text-primary-foreground flex items-center justify-center text-xs font-semibold">{t.logo}</div>
                    <div className="font-medium">{t.name}</div>
                  </div>
                </TableCell>
                <TableCell>{t.city}</TableCell>
                <TableCell><Badge variant="outline">{t.plan}</Badge></TableCell>
                <TableCell className="font-mono">R$ {t.plan === "Enterprise" ? "1.499" : t.plan === "Business" ? "599" : "199"}</TableCell>
                <TableCell><Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20" variant="outline">Ativo</Badge></TableCell>
                <TableCell className="text-right">
                  <Button size="sm" variant="ghost" onClick={() => { setActiveTenant(t.id); toast.success(`Assumindo ${t.name}`); }}><Edit className="w-3.5 h-3.5 mr-1" />Assumir</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <div className="grid md:grid-cols-3 gap-4">
        {[
          { title: "Cupons & Promoções", desc: "6 cupons ativos · 2 campanhas em andamento" },
          { title: "Tickets de suporte", desc: "3 tickets abertos · SLA médio 4h" },
          { title: "Logs & Auditoria", desc: "Últimas 24h: 1.284 eventos registrados" },
        ].map((c) => (
          <Card key={c.title} className="p-5 hover-lift">
            <div className="font-heading font-semibold mb-2">{c.title}</div>
            <div className="text-sm text-muted-foreground">{c.desc}</div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default AdminMaster;
