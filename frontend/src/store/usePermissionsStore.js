import { create } from "zustand";
import { persist } from "zustand/middleware";
import { DEFAULT_ROLES } from "@/lib/rbac";

const uid = () => `role_${Math.random().toString(36).slice(2, 9)}`;

export const usePermissionsStore = create(
  persist(
    (set, get) => ({
      roles: DEFAULT_ROLES,

      getRole: (id) => get().roles.find((r) => r.id === id),

      // Toggle a single (module, action) pair on/off. Admin/supreme is untouchable.
      togglePermission: (roleId, moduleKey, action) =>
        set((state) => ({
          roles: state.roles.map((r) => {
            if (r.id !== roleId || r.isSupreme) return r;
            const current = r.permissions[moduleKey] || [];
            const has = current.includes(action);
            const next = has ? current.filter((a) => a !== action) : [...current, action];
            return {
              ...r,
              permissions: { ...r.permissions, [moduleKey]: next },
            };
          }),
        })),

      // Grant/revoke all actions on a module for a role
      setModuleAccess: (roleId, moduleKey, allowed) =>
        set((state) => ({
          roles: state.roles.map((r) => {
            if (r.id !== roleId || r.isSupreme) return r;
            const nextPerms = { ...r.permissions };
            if (allowed) nextPerms[moduleKey] = ["view", "create", "edit", "delete"];
            else nextPerms[moduleKey] = [];
            return { ...r, permissions: nextPerms };
          }),
        })),

      createRole: (data) =>
        set((state) => ({
          roles: [
            ...state.roles,
            {
              id: uid(),
              name: data.name || "Novo papel",
              description: data.description || "",
              color: data.color || "#6B7280",
              isSystem: false,
              permissions: data.permissions || { dashboard: ["view"] },
            },
          ],
        })),

      updateRole: (id, patch) =>
        set((state) => ({
          roles: state.roles.map((r) => (r.id === id ? { ...r, ...patch } : r)),
        })),

      setScope: (roleId, scope) =>
        set((state) => ({
          roles: state.roles.map((r) => (r.id === roleId && !r.isSupreme ? { ...r, scope } : r)),
        })),

      deleteRole: (id) =>
        set((state) => ({
          roles: state.roles.filter((r) => !(r.id === id && !r.isSystem)),
        })),

      resetToDefaults: () => set({ roles: DEFAULT_ROLES }),
    }),
    { name: "debora-ai-rbac" }
  )
);
