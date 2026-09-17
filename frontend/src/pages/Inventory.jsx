import React, { useState } from "react";
import PageHeader from "@/components/shared/PageHeader";
import { useAppStore } from "@/store/useAppStore";
import { useDataStore } from "@/store/useDataStore";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Search, Plus, Bed, Bath, Square, MapPin } from "lucide-react";
import { formatBRLShort } from "@/lib/format";
import { cn } from "@/lib/utils";

const statusColor = {
  Disponível: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  Reservado: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  Vendido: "bg-muted text-muted-foreground border-border",
};

const Inventory = () => {
  const { activeTenantId } = useAppStore();
  const { properties } = useDataStore();
  const [search, setSearch] = useState("");
  const [purpose, setPurpose] = useState("all");
  const [type, setType] = useState("all");

  const list = properties.filter((p) => {
    if (p.tenantId !== activeTenantId) return false;
    if (purpose !== "all" && p.purpose !== purpose) return false;
    if (type !== "all" && p.type !== type) return false;
    if (search && !`${p.title} ${p.neighborhood} ${p.code}`.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const types = [...new Set(properties.map((p) => p.type))];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Inventário de Imóveis"
        subtitle={`${list.length} imóveis · ${list.filter((p) => p.status === "Disponível").length} disponíveis`}
        actions={<Button size="sm" data-testid="btn-new-property"><Plus className="w-4 h-4 mr-2" />Novo imóvel</Button>}
      />

      <Card className="p-4 flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Buscar por código, título ou bairro..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={purpose} onValueChange={setPurpose}>
          <SelectTrigger className="w-full md:w-40"><SelectValue placeholder="Finalidade" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas finalidades</SelectItem>
            <SelectItem value="Venda">Venda</SelectItem>
            <SelectItem value="Locação">Locação</SelectItem>
          </SelectContent>
        </Select>
        <Select value={type} onValueChange={setType}>
          <SelectTrigger className="w-full md:w-40"><SelectValue placeholder="Tipo" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos tipos</SelectItem>
            {types.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {list.map((p) => (
          <Card key={p.id} className="overflow-hidden hover-lift" data-testid={`property-card-${p.id}`}>
            <div className="relative aspect-[4/3] bg-secondary overflow-hidden">
              <img src={p.image} alt={p.title} className="w-full h-full object-cover" />
              <Badge className={cn("absolute top-3 left-3 border", statusColor[p.status])} variant="outline">
                {p.status}
              </Badge>
              <Badge variant="secondary" className="absolute top-3 right-3 font-mono text-[10px]">{p.code}</Badge>
            </div>
            <div className="p-4">
              <div className="text-xs text-muted-foreground flex items-center gap-1 mb-1"><MapPin className="w-3 h-3" />{p.neighborhood}, {p.city}</div>
              <div className="font-medium leading-tight line-clamp-2 mb-2">{p.title}</div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
                <span className="flex items-center gap-1"><Bed className="w-3.5 h-3.5" />{p.bedrooms}</span>
                <span className="flex items-center gap-1"><Bath className="w-3.5 h-3.5" />{p.bathrooms}</span>
                <span className="flex items-center gap-1"><Square className="w-3.5 h-3.5" />{p.area}m²</span>
              </div>
              <div className="flex items-baseline justify-between">
                <div>
                  <div className="text-[10px] uppercase text-muted-foreground">{p.purpose}</div>
                  <div className="font-heading text-lg font-semibold tabular-nums text-primary">{formatBRLShort(p.price)}</div>
                </div>
                <Badge variant="outline" className="text-[10px]">{p.developer}</Badge>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Inventory;
