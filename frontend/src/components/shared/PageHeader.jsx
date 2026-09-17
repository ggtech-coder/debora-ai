import React from "react";
import { cn } from "@/lib/utils";

const PageHeader = ({ title, subtitle, actions, className }) => (
  <div className={cn("flex flex-col md:flex-row md:items-center justify-between gap-3 mb-6", className)}>
    <div>
      <h1 className="font-heading text-3xl md:text-4xl font-semibold tracking-tight">{title}</h1>
      {subtitle && <p className="text-muted-foreground text-sm mt-1">{subtitle}</p>}
    </div>
    {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
  </div>
);

export default PageHeader;
