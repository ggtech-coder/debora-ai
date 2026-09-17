/**
 * RBAC — Role-Based Access Control constants for Débora.ai
 * Every module is a "screen" the sidebar can navigate to.
 * Every action can be granted or denied per module.
 */

export const ACTIONS = [
  { key: "view", label: "Visualizar" },
  { key: "create", label: "Criar" },
  { key: "edit", label: "Editar" },
  { key: "delete", label: "Excluir" },
];

export const MODULES = [
  // Principal
  { key: "dashboard", label: "Dashboard", group: "Principal", route: "/" },
  { key: "reports", label: "Relatórios", group: "Principal", route: "/reports" },
  { key: "tv", label: "Modo TV", group: "Principal", route: "/tv" },

  // Comercial
  { key: "leads", label: "Leads", group: "Comercial", route: "/leads" },
  { key: "lead-rotation", label: "Rodízio", group: "Comercial", route: "/lead-rotation" },
  { key: "crm", label: "CRM", group: "Comercial", route: "/crm" },
  { key: "clients", label: "Clientes", group: "Comercial", route: "/clients" },

  // Operacional
  { key: "inventory", label: "Inventário", group: "Operacional", route: "/inventory" },
  { key: "calendar", label: "Agenda", group: "Operacional", route: "/calendar" },
  { key: "finance", label: "Financeiro", group: "Operacional", route: "/finance" },
  { key: "documents", label: "Documentos", group: "Operacional", route: "/documents" },

  // Comunicação
  { key: "inbox", label: "Atendimento", group: "Comunicação", route: "/inbox" },
  { key: "whatsapp", label: "WhatsApp", group: "Comunicação", route: "/whatsapp" },
  { key: "instagram", label: "Instagram", group: "Comunicação", route: "/instagram" },
  { key: "chatbot", label: "Chatbot", group: "Comunicação", route: "/chatbot" },

  // Crescimento
  { key: "marketing", label: "Marketing", group: "Crescimento", route: "/marketing" },
  { key: "automations", label: "Automações", group: "Crescimento", route: "/automations" },
  { key: "ai", label: "IA", group: "Crescimento", route: "/ai" },
  { key: "sites", label: "Sites", group: "Crescimento", route: "/sites" },

  // Conta
  { key: "settings", label: "Configurações", group: "Conta", route: "/settings" },
  { key: "customization", label: "Personalizações", group: "Conta", route: "/customization" },
  { key: "notifications", label: "Notificações", group: "Conta", route: "/notifications" },
  { key: "plan", label: "Meu Plano", group: "Conta", route: "/plan" },
  { key: "account", label: "Minha Conta", group: "Conta", route: "/account" },
  { key: "admin-master", label: "Admin Master", group: "Conta", route: "/admin-master" },
];

// Helper: build a permissions object with given action list for each module
const forAll = (moduleKeys, actions = ["view"]) =>
  Object.fromEntries(moduleKeys.map((k) => [k, actions]));

/**
 * Data scope options — controls which records a role can see:
 * - all: every record in the tenant (default for Admin, Gestor, Financeiro)
 * - team: only records assigned to agents of the user's team
 * - own: only records assigned to the user's own agent id
 */
export const SCOPES = [
  { key: "all", label: "Toda a empresa", description: "Vê todos os registros do tenant" },
  { key: "team", label: "Apenas sua equipe", description: "Vê registros dos corretores da mesma equipe" },
  { key: "own", label: "Apenas seus registros", description: "Vê somente registros atribuídos a você" },
];

/**
 * Default system roles.
 * Admin is a wildcard — grants everything to everyone. isSystem roles cannot be deleted.
 */
export const DEFAULT_ROLES = [
  {
    id: "admin",
    name: "Admin",
    description: "Acesso total ao sistema. Único papel que pode editar permissões.",
    color: "#0F4C3A",
    isSystem: true,
    isSupreme: true,
    scope: "all",
    permissions: { "*": ["view", "create", "edit", "delete"] },
  },
  {
    id: "gestor",
    name: "Gestor",
    description: "Gerencia equipe, negócios e relatórios (sem admin da plataforma).",
    color: "#C49A45",
    isSystem: true,
    scope: "all",
    permissions: {
      ...forAll(
        ["dashboard", "reports", "leads", "lead-rotation", "crm", "clients", "inventory", "calendar", "documents", "notifications", "account"],
        ["view", "create", "edit"]
      ),
      finance: ["view"],
      customization: ["view"],
      settings: ["view"],
      plan: ["view"],
      "admin-master": [],
    },
  },
  {
    id: "corretor",
    name: "Corretor",
    description: "Foco em vendas: leads, negócios, clientes e agenda.",
    color: "#3B82F6",
    isSystem: true,
    scope: "own",
    permissions: {
      ...forAll(
        ["dashboard", "leads", "crm", "clients", "calendar", "inventory", "notifications", "account"],
        ["view", "create", "edit"]
      ),
      documents: ["view", "create"],
    },
  },
  {
    id: "financeiro",
    name: "Financeiro",
    description: "Fluxo de caixa, comissões e relatórios financeiros.",
    color: "#22C55E",
    isSystem: true,
    scope: "all",
    permissions: {
      dashboard: ["view"],
      finance: ["view", "create", "edit", "delete"],
      reports: ["view"],
      clients: ["view"],
      documents: ["view"],
      notifications: ["view"],
      account: ["view", "edit"],
    },
  },
  {
    id: "visualizacao",
    name: "Somente visualização",
    description: "Consulta sem edição. Ideal para stakeholders e auditoria.",
    color: "#6B7280",
    isSystem: true,
    scope: "team",
    permissions: forAll(
      ["dashboard", "reports", "leads", "crm", "clients", "inventory", "calendar", "finance", "notifications", "account"],
      ["view"]
    ),
  },
];

/**
 * Check if a role grants a given (module, action) permission.
 * Wildcard "*" module grants access to every module.
 */
export const roleCan = (role, moduleKey, action = "view") => {
  if (!role) return false;
  if (role.isSupreme) return true;
  const perms = role.permissions || {};
  if (perms["*"] && perms["*"].includes(action)) return true;
  const modulePerms = perms[moduleKey] || [];
  return modulePerms.includes(action);
};

export const moduleGroups = () => {
  const groups = {};
  MODULES.forEach((m) => {
    groups[m.group] = groups[m.group] || [];
    groups[m.group].push(m);
  });
  return groups;
};
