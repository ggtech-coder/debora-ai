import React from "react";
import PageHeader from "@/components/shared/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useAppStore } from "@/store/useAppStore";
import { useDataStore } from "@/store/useDataStore";
import { Palette, Layout, Sun, Moon } from "lucide-react";

const Customization = () => {
  const { theme, setTheme } = useAppStore();
  const { stages } = useDataStore();
  return (
    <div className="space-y-6">
      <PageHeader title="Personalizações" subtitle="Campos, interface, temas, dashboard e Modo TV" />
      <Tabs defaultValue="fields">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="fields">Campos personalizados</TabsTrigger>
          <TabsTrigger value="origins">Origens & Tipos</TabsTrigger>
          <TabsTrigger value="funnels">Funis & Etapas</TabsTrigger>
          <TabsTrigger value="interface">Interface</TabsTrigger>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="tv">Modo TV</TabsTrigger>
        </TabsList>

        <TabsContent value="fields" className="mt-4">
          <Card className="p-6"><div className="text-sm">Crie campos personalizados para Leads, Clientes, Imóveis e Negócios.</div><Button className="mt-3">Adicionar campo</Button></Card>
        </TabsContent>
        <TabsContent value="origins" className="mt-4">
          <div className="grid md:grid-cols-2 gap-4">
            {["Origens de lead", "Tipos de imóvel", "Finalidades", "Status"].map((k) => (
              <Card key={k} className="p-5"><div className="font-heading font-semibold mb-3">{k}</div><div className="flex flex-wrap gap-2">{["Item 1", "Item 2", "Item 3"].map(i => <Badge key={i} variant="outline">{i}</Badge>)}</div></Card>
            ))}
          </div>
        </TabsContent>
        <TabsContent value="funnels" className="mt-4">
          <Card className="p-5">
            <div className="font-heading font-semibold mb-3">Etapas do funil</div>
            <div className="space-y-2">
              {stages.map((s, i) => (
                <div key={s.id} className="flex items-center gap-3 p-2 rounded-md border border-border">
                  <div className="font-mono text-xs text-muted-foreground w-6">{i + 1}</div>
                  <div className="w-3 h-3 rounded" style={{ background: s.color }} />
                  <div className="text-sm flex-1">{s.name}</div>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>
        <TabsContent value="interface" className="mt-4">
          <Card className="p-6 space-y-4 max-w-xl">
            <div><Label>Logo da empresa</Label><Input type="file" /></div>
            <div><Label>Cor primária</Label><Input type="color" defaultValue="#0F4C3A" /></div>
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2"><Palette className="w-4 h-4" />Tema padrão</Label>
              <div className="flex items-center gap-2">
                <Button variant={theme === "light" ? "default" : "outline"} size="sm" onClick={() => setTheme("light")}><Sun className="w-4 h-4 mr-1" />Claro</Button>
                <Button variant={theme === "dark" ? "default" : "outline"} size="sm" onClick={() => setTheme("dark")}><Moon className="w-4 h-4 mr-1" />Escuro</Button>
              </div>
            </div>
          </Card>
        </TabsContent>
        <TabsContent value="dashboard" className="mt-4">
          <Card className="p-6"><div className="flex items-center gap-2 mb-2"><Layout className="w-4 h-4" /><span className="font-medium">Widgets do dashboard</span></div><div className="text-sm text-muted-foreground">Arraste e reorganize os cards que aparecem no seu dashboard.</div></Card>
        </TabsContent>
        <TabsContent value="tv" className="mt-4">
          <Card className="p-6 space-y-3 max-w-xl">
            {["Ranking corretores", "Ranking equipes", "VGV & Metas", "Corretor do mês"].map((s) => (
              <div key={s} className="flex items-center justify-between"><Label>{s}</Label><Switch defaultChecked /></div>
            ))}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Customization;
