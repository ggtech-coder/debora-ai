import React from "react";
import PageHeader from "@/components/shared/PageHeader";
import KPICard from "@/components/shared/KPICard";
import { useAppStore } from "@/store/useAppStore";
import { useDataStore } from "@/store/useDataStore";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  TrendingUp, TrendingDown, Wallet, ArrowUpCircle, ArrowDownCircle, Plus, Download,
} from "lucide-react";
import { formatBRL, formatBRLShort, formatDate } from "@/lib/format";
import { CASH_FLOW } from "@/lib/mockData";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid,
} from "recharts";
import { cn } from "@/lib/utils";

const statusColor = {
  pago: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  pendente: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  atrasado: "bg-red-500/10 text-red-600 border-red-500/20",
};

const Finance = () => {
  const { activeTenantId } = useAppStore();
  const { transactions } = useDataStore();
  const list = transactions.filter((t) => t.tenantId === activeTenantId);
  const receitas = list.filter((t) => t.type === "receita");
  const despesas = list.filter((t) => t.type === "despesa");
  const totalReceitas = receitas.reduce((s, t) => s + t.amount, 0);
  const totalDespesas = despesas.reduce((s, t) => s + Math.abs(t.amount), 0);
  const saldo = totalReceitas - totalDespesas;
  const pendentes = list.filter((t) => t.status === "pendente").length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Financeiro"
        subtitle="Contas a pagar, receber, fluxo de caixa e comissões"
        actions={
          <>
            <Button variant="outline" size="sm"><Download className="w-4 h-4 mr-2" />Exportar</Button>
            <Button size="sm"><Plus className="w-4 h-4 mr-2" />Nova transação</Button>
          </>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard label="Receitas" value={formatBRLShort(totalReceitas)} delta={12.5} icon={ArrowUpCircle} tone="default" />
        <KPICard label="Despesas" value={formatBRLShort(totalDespesas)} delta={-4.2} icon={ArrowDownCircle} tone="danger" />
        <KPICard label="Saldo" value={formatBRLShort(saldo)} delta={18.3} icon={Wallet} tone="accent" />
        <KPICard label="Pendentes" value={pendentes} icon={TrendingDown} tone="warning" />
      </div>

      <Card className="p-5">
        <div className="font-heading text-lg font-semibold mb-4">Fluxo de caixa</div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={CASH_FLOW} margin={{ top: 10, right: 10, bottom: 0, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} vertical={false} />
              <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `${v / 1000}k`} />
              <Tooltip
                contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px" }}
                formatter={(v) => formatBRL(v)}
              />
              <Legend wrapperStyle={{ fontSize: "12px" }} />
              <Bar dataKey="entradas" name="Entradas" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              <Bar dataKey="saidas" name="Saídas" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">Todas ({list.length})</TabsTrigger>
          <TabsTrigger value="receitas">A receber ({receitas.length})</TabsTrigger>
          <TabsTrigger value="despesas">A pagar ({despesas.length})</TabsTrigger>
          <TabsTrigger value="commissions">Comissões</TabsTrigger>
        </TabsList>

        {["all", "receitas", "despesas", "commissions"].map((tab) => {
          const rows =
            tab === "all" ? list :
            tab === "receitas" ? receitas :
            tab === "despesas" ? despesas :
            list.filter((t) => t.category?.includes("Comissão"));
          return (
            <TabsContent key={tab} value={tab} className="mt-4">
              <Card className="overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-secondary/50 hover:bg-secondary/50">
                      <TableHead>Descrição</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead>Vencimento</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((t) => (
                      <TableRow key={t.id}>
                        <TableCell className="font-medium">{t.description}</TableCell>
                        <TableCell><Badge variant="outline">{t.category}</Badge></TableCell>
                        <TableCell className="text-sm text-muted-foreground">{formatDate(t.dueDate)}</TableCell>
                        <TableCell><Badge className={cn("border capitalize", statusColor[t.status])} variant="outline">{t.status}</Badge></TableCell>
                        <TableCell className={cn("text-right tabular-nums font-medium", t.amount < 0 ? "text-destructive" : "text-emerald-600 dark:text-emerald-400")}>
                          {formatBRL(Math.abs(t.amount))}
                        </TableCell>
                      </TableRow>
                    ))}
                    {rows.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">Nenhuma transação</TableCell></TableRow>}
                  </TableBody>
                </Table>
              </Card>
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
};

export default Finance;
