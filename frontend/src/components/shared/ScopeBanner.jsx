import React from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Eye, Users, User } from "lucide-react";
import { usePermissions } from "@/hooks/usePermissions";

/**
 * Small badge shown at the top of Leads/Clients/CRM/Calendar pages
 * to make it obvious when a role is only seeing a subset of records.
 */
const ScopeBanner = () => {
  const { scope, role, teamName } = usePermissions();
  if (!role || scope === "all") return null;
  const config = {
    own: { icon: User, text: "Vendo apenas registros atribuídos a você", tone: "text-blue-600 bg-blue-500/10 border-blue-500/20" },
    team: { icon: Users, text: `Vendo apenas registros da equipe "${teamName || "—"}"`, tone: "text-amber-600 bg-amber-500/10 border-amber-500/20" },
  }[scope];
  if (!config) return null;
  const Icon = config.icon;
  return (
    <div className={`rounded-md border px-3 py-2 text-xs flex items-center gap-2 ${config.tone}`} data-testid={`scope-banner-${scope}`}>
      <Icon className="w-3.5 h-3.5 shrink-0" />
      <span className="flex-1">{config.text}</span>
      <Badge variant="outline" className="text-[9px] uppercase font-semibold border-current">{role.name}</Badge>
    </div>
  );
};

export default ScopeBanner;
