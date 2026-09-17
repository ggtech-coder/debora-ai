import React from "react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { TrendingUp, TrendingDown } from "lucide-react";

const KPICard = ({ label, value, delta, icon: Icon, tone = "default", className, testId }) => {
  const positive = (delta ?? 0) >= 0;
  const toneRing = {
    default: "bg-primary/10 text-primary",
    accent: "bg-accent/15 text-accent",
    info: "bg-blue-500/10 text-blue-500",
    warning: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    danger: "bg-destructive/10 text-destructive",
  }[tone];

  return (
    <Card
      data-testid={testId}
      className={cn("p-5 hover-lift border-border", className)}
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</div>
        {Icon && (
          <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center", toneRing)}>
            <Icon className="w-[18px] h-[18px]" strokeWidth={1.75} />
          </div>
        )}
      </div>
      <div className="font-heading text-3xl font-semibold tabular-nums">{value}</div>
      {delta !== undefined && (
        <div className="flex items-center gap-1 mt-2 text-xs">
          {positive ? (
            <TrendingUp className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          ) : (
            <TrendingDown className="w-3.5 h-3.5 text-destructive" />
          )}
          <span className={cn("font-medium", positive ? "text-emerald-600 dark:text-emerald-400" : "text-destructive")}>
            {positive ? "+" : ""}{delta}%
          </span>
          <span className="text-muted-foreground">vs período anterior</span>
        </div>
      )}
    </Card>
  );
};

export default KPICard;
