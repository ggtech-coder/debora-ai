import React from "react";
import { Card } from "@/components/ui/card";
import { Construction } from "lucide-react";

const ModulePlaceholder = ({ title, description, icon: Icon = Construction, testId }) => (
  <div data-testid={testId} className="max-w-3xl">
    <Card className="p-10 border-dashed">
      <div className="flex items-start gap-4">
        <div className="w-14 h-14 rounded-lg bg-accent/15 text-accent flex items-center justify-center shrink-0">
          <Icon className="w-7 h-7" strokeWidth={1.5} />
        </div>
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-accent mb-2">Módulo em preparação</div>
          <h2 className="font-heading text-2xl font-semibold mb-2">{title}</h2>
          <p className="text-muted-foreground text-sm max-w-xl">{description}</p>
          <div className="mt-5 grid grid-cols-2 gap-2 max-w-md">
            {["Estrutura de dados pronta", "Rotas configuradas", "UI base implementada", "Aguardando integração"].map((it) => (
              <div key={it} className="flex items-center gap-2 text-xs text-muted-foreground">
                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                {it}
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  </div>
);

export default ModulePlaceholder;
