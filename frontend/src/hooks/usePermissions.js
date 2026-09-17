import { useMemo } from "react";
import { useAppStore } from "@/store/useAppStore";
import { usePermissionsStore } from "@/store/usePermissionsStore";
import { useDataStore } from "@/store/useDataStore";
import { roleCan, MODULES } from "@/lib/rbac";

/**
 * usePermissions — central hook to check what the current user can do AND see.
 * Returns:
 *   - role: the current role object (or admin fallback)
 *   - can(moduleKey, action='view'): boolean
 *   - allowedModules: array of module objects the user can view
 *   - isAdmin: boolean shortcut
 *   - scope: 'all' | 'team' | 'own' — data visibility scope
 *   - agentId: current user's agent id (for record-level filtering)
 *   - teamName: current user's team name
 *   - filterByScope(records, field='agentId'): filters records honoring current scope
 */
export const usePermissions = () => {
  const user = useAppStore((s) => s.user);
  const roles = usePermissionsStore((s) => s.roles);
  const agents = useDataStore((s) => s.agents);

  return useMemo(() => {
    const roleId = user?.roleId || "admin";
    const role = roles.find((r) => r.id === roleId) || roles.find((r) => r.id === "admin");
    const scope = role?.scope || "all";
    const agentId = user?.agentId;
    const currentAgent = agents.find((a) => a.id === agentId);
    const teamName = currentAgent?.team;

    const can = (moduleKey, action = "view") => roleCan(role, moduleKey, action);
    const allowedModules = MODULES.filter((m) => can(m.key, "view"));

    const filterByScope = (records = [], field = "agentId") => {
      if (scope === "all") return records;
      if (scope === "own") return records.filter((r) => r[field] === agentId);
      if (scope === "team") {
        const teamAgentIds = new Set(agents.filter((a) => a.team === teamName).map((a) => a.id));
        return records.filter((r) => teamAgentIds.has(r[field]));
      }
      return records;
    };

    return {
      role,
      can,
      allowedModules,
      isAdmin: Boolean(role?.isSupreme),
      scope,
      agentId,
      teamName,
      filterByScope,
    };
  }, [user, roles, agents]);
};
