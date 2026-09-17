import React from "react";
import PageHeader from "@/components/shared/PageHeader";
import KPICard from "@/components/shared/KPICard";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Download, FileText, Sparkles, TrendingUp, Clock, Target, Trophy } from "lucide-react";
import { formatBRLShort } from "@/lib/format";
import { SALES_TIMELINE, FUNNEL_CONVERSION, LEAD_SOURCES } from "@/lib/mockData";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar,
} from "recharts";
import { toast } from "sonner";

const Reports = () => {
  const handleExport = (fmt) => toast.success(`Relatório exportado em ${fmt.toUpperCase()}`);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Relatórios"
        subtitle="Painel executivo, indicadores comerciais, financeiros e de marketing"
        actions={
          <>
            <Button variant="outline" size="sm" onClick={() => handleExport("pdf")} data-testid="export-pdf"><FileText className="w-4 h-4 mr-2" />PDF</Button>
            <Button variant="outline" size="sm" onClick={() => handleExport("xlsx")} data-testid="export-xlsx"><Download className="w-4 h-4 mr-2" />Excel</Button>
            <Button size="sm" data-testid="ai-report"><Sparkles className="w-4 h-4 mr-2" />Insight com IA</Button>
          </>
        }
      />

      <Tabs defaultValue="executive">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="executive">Executivo</TabsTrigger>
          <TabsTrigger value="commercial">Comercial</TabsTrigger>
          <TabsTrigger value="finance">Financeiro</TabsTrigger>
          <TabsTrigger value="marketing">Marketing</TabsTrigger>
          <TabsTrigger value="crm">CRM</TabsTrigger>
          <TabsTrigger value="properties">Imóveis</TabsTrigger>
          <TabsTrigger value="agents">Corretores</TabsTrigger>
        </TabsList>

        <TabsContent value="executive" className="mt-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <KPICard label="VGV total" value="R$ 5,25M" delta={18.4} icon={TrendingUp} />
            <KPICard label="Ticket médio" value="R$ 328k" delta={5.7} icon={Target} tone="accent" />
            <KPICard label="Tempo médio fechamento" value="42d" delta={-8.1} icon={Clock} tone="info" />
            <KPICard label="Top corretor" value="Débora A." icon={Trophy} tone="warning" />
          </div>
          <Card className="p-5">
            <div className="font-heading text-lg font-semibold mb-4">Evolução VGV & Negócios</div>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={SALES_TIMELINE} margin={{ top: 10, right: 10, bottom: 0, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} vertical={false} />
                  <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis yAxisId="left" stroke="hsl(var(--primary))" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `${v / 1000000}M`} />
                  <YAxis yAxisId="right" orientation="right" stroke="hsl(var(--accent))" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                  <Line yAxisId="left" type="monotone" dataKey="vgv" stroke="hsl(var(--primary))" strokeWidth={2.5} dot={{ r: 3 }} />
                  <Line yAxisId="right" type="monotone" dataKey="deals" stroke="hsl(var(--accent))" strokeWidth={2.5} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="commercial" className="mt-4">
          <Card className="p-5">
            <div className="font-heading text-lg font-semibold mb-4">Funil de conversão</div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={FUNNEL_CONVERSION} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} vertical={false} />
                  <XAxis dataKey="stage" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
                  <Tooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                  <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </TabsContent>

        {["finance", "marketing", "crm", "properties", "agents"].map((t) => (
          <TabsContent key={t} value={t} className="mt-4">
            <Card className="p-10 text-center">
              <div className="text-sm text-muted-foreground">Relatório detalhado disponível. Configure filtros para gerar sua análise.</div>
              <Button className="mt-4" variant="outline"><Sparkles className="w-4 h-4 mr-2" />Gerar com IA</Button>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

export default Reports;
