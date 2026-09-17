import React from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShieldOff, ArrowLeft } from "lucide-react";
import { usePermissions } from "@/hooks/usePermissions";

const AccessDenied = ({ moduleKey, moduleLabel }) => {
  const nav = useNavigate();
  const { role } = usePermissions();
  return (
    <div className="min-h-[60vh] flex items-center justify-center" data-testid="access-denied">
      <Card className="p-10 max-w-md text-center">
        <div className="w-14 h-14 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mx-auto mb-4">
          <ShieldOff className="w-7 h-7" strokeWidth={1.5} />
        </div>
        <h2 className="font-heading text-2xl font-semibold mb-2">Acesso restrito</h2>
        <p className="text-sm text-muted-foreground mb-1">
          Seu papel <span className="font-medium text-foreground">{role?.name || "atual"}</span> não tem permissão para acessar
          {moduleLabel ? ` "${moduleLabel}"` : ` este módulo`}.
        </p>
        <p className="text-xs text-muted-foreground mb-6">
          Peça a um <span className="font-medium">Admin</span> para liberar esta tela em Configurações → Permissões.
        </p>
        <div className="flex gap-2 justify-center">
          <Button variant="outline" size="sm" onClick={() => nav(-1)}><ArrowLeft className="w-4 h-4 mr-2" />Voltar</Button>
          <Button size="sm" onClick={() => nav("/")}>Ir ao Dashboard</Button>
        </div>
      </Card>
    </div>
  );
};

export default AccessDenied;
