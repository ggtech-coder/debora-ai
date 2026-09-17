import React from "react";
import { useLocation } from "react-router-dom";
import { usePermissions } from "@/hooks/usePermissions";
import { MODULES } from "@/lib/rbac";
import AccessDenied from "@/components/shared/AccessDenied";

/**
 * Wraps a page and blocks it when the current role cannot 'view' the module.
 */
const RequirePermission = ({ children }) => {
  const location = useLocation();
  const { can } = usePermissions();

  // Match by exact route first, fallback to prefix segment
  const path = location.pathname;
  const mod =
    MODULES.find((m) => m.route === path) ||
    MODULES.find((m) => path.startsWith(`/${m.key}`)) ||
    (path === "/" ? MODULES.find((m) => m.key === "dashboard") : null);

  if (!mod) return children;
  if (can(mod.key, "view")) return children;
  return <AccessDenied moduleKey={mod.key} moduleLabel={mod.label} />;
};

export default RequirePermission;
