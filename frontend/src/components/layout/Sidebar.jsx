import React from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useAppStore } from "@/store/useAppStore";
import { usePermissions } from "@/hooks/usePermissions";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, BarChart3, Tv, Users, Shuffle, Kanban, UserCircle2,
  Building2, CalendarDays, Wallet, Settings, Palette, Bell, CreditCard,
  UserCog, ShieldCheck, FileText, MessageSquare, Instagram, Megaphone,
  Zap, Sparkles, Globe, Bot, MessagesSquare, ChevronsLeft, ChevronsRight,
  ChevronDown, Home,
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const GROUPS = [
  {
    label: "Principal",
    items: [
      { to: "/", icon: LayoutDashboard, label: "Dashboard", end: true },
      { to: "/reports", icon: BarChart3, label: "Relatórios" },
      { to: "/tv", icon: Tv, label: "Modo TV" },
    ],
  },
  {
    label: "Comercial",
    items: [
      { to: "/leads", icon: Users, label: "Leads" },
      { to: "/lead-rotation", icon: Shuffle, label: "Rodízio" },
      { to: "/crm", icon: Kanban, label: "CRM" },
      { to: "/clients", icon: UserCircle2, label: "Clientes" },
    ],
  },
  {
    label: "Operacional",
    items: [
      { to: "/inventory", icon: Building2, label: "Inventário" },
      { to: "/calendar", icon: CalendarDays, label: "Agenda" },
      { to: "/finance", icon: Wallet, label: "Financeiro" },
      { to: "/documents", icon: FileText, label: "Documentos" },
    ],
  },
  {
    label: "Comunicação",
    items: [
      { to: "/inbox", icon: MessageSquare, label: "Atendimento" },
      { to: "/whatsapp", icon: MessagesSquare, label: "WhatsApp" },
      { to: "/instagram", icon: Instagram, label: "Instagram" },
      { to: "/chatbot", icon: Bot, label: "Chatbot" },
    ],
  },
  {
    label: "Crescimento",
    items: [
      { to: "/marketing", icon: Megaphone, label: "Marketing" },
      { to: "/automations", icon: Zap, label: "Automações" },
      { to: "/ai", icon: Sparkles, label: "IA" },
      { to: "/sites", icon: Globe, label: "Sites" },
    ],
  },
  {
    label: "Conta",
    items: [
      { to: "/settings", icon: Settings, label: "Configurações" },
      { to: "/customization", icon: Palette, label: "Personalizações" },
      { to: "/notifications", icon: Bell, label: "Notificações" },
      { to: "/plan", icon: CreditCard, label: "Meu Plano" },
      { to: "/account", icon: UserCog, label: "Minha Conta" },
      { to: "/admin-master", icon: ShieldCheck, label: "Admin Master" },
    ],
  },
];

const TenantChip = ({ collapsed }) => {
  const { tenants, activeTenantId, setActiveTenant } = useAppStore();
  const active = tenants.find((t) => t.id === activeTenantId) || tenants[0];
  const [open, setOpen] = React.useState(false);
  return (
    <div className="relative px-3 pt-4 pb-3" data-testid="tenant-selector">
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          "w-full flex items-center gap-3 rounded-lg border border-border bg-card hover:bg-secondary transition-colors p-2.5",
          collapsed && "justify-center p-2"
        )}
      >
        <div className="w-8 h-8 rounded-md bg-primary text-primary-foreground flex items-center justify-center font-heading font-semibold text-sm shrink-0">
          {active.logo}
        </div>
        {!collapsed && (
          <>
            <div className="flex-1 text-left min-w-0">
              <div className="text-sm font-medium truncate">{active.name}</div>
              <div className="text-xs text-muted-foreground truncate">{active.plan}</div>
            </div>
            <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
          </>
        )}
      </button>
      {open && !collapsed && (
        <div className="absolute left-3 right-3 mt-1 z-40 rounded-lg border border-border bg-popover shadow-lg overflow-hidden">
          {tenants.map((t) => (
            <button
              key={t.id}
              data-testid={`tenant-option-${t.id}`}
              onClick={() => { setActiveTenant(t.id); setOpen(false); }}
              className={cn(
                "w-full flex items-center gap-2 p-2.5 hover:bg-secondary text-left text-sm",
                t.id === activeTenantId && "bg-secondary"
              )}
            >
              <div className="w-7 h-7 rounded bg-primary text-primary-foreground flex items-center justify-center text-xs font-semibold">
                {t.logo}
              </div>
              <div className="flex-1 min-w-0">
                <div className="truncate font-medium">{t.name}</div>
                <div className="text-xs text-muted-foreground truncate">{t.city}</div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const Sidebar = () => {
  const { sidebarCollapsed, toggleSidebar } = useAppStore();
  const { can } = usePermissions();
  const location = useLocation();

  // Filter items and full groups based on view permission
  const visibleGroups = GROUPS
    .map((g) => ({
      ...g,
      items: g.items.filter((item) => {
        const key = item.to === "/" ? "dashboard" : item.to.replace(/^\//, "");
        return can(key, "view");
      }),
    }))
    .filter((g) => g.items.length > 0);

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        data-testid="app-sidebar"
        className={cn(
          "hidden md:flex flex-col shrink-0 border-r border-border bg-[hsl(var(--sidebar))] text-[hsl(var(--sidebar-foreground))] transition-[width] duration-200 ease-out",
          sidebarCollapsed ? "w-[80px]" : "w-[280px]"
        )}
      >
        {/* Brand */}
        <div className={cn("flex items-center gap-2 px-4 pt-5 pb-1", sidebarCollapsed && "justify-center px-2")}>
          <div className="w-9 h-9 rounded-lg bg-primary text-primary-foreground flex items-center justify-center shrink-0">
            <Home className="w-5 h-5" strokeWidth={2} />
          </div>
          {!sidebarCollapsed && (
            <div>
              <div className="font-heading font-semibold text-lg leading-tight">Débora<span className="text-accent">.ai</span></div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Real Estate ERP</div>
            </div>
          )}
        </div>

        <TenantChip collapsed={sidebarCollapsed} />

        <nav className="flex-1 overflow-y-auto px-2 pb-4">
          {visibleGroups.map((group) => (
            <div key={group.label} className="mb-3">
              {!sidebarCollapsed && (
                <div className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {group.label}
                </div>
              )}
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const link = (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      end={item.end}
                      data-testid={`nav-${item.to.replace("/", "") || "dashboard"}`}
                      className={({ isActive }) =>
                        cn(
                          "nav-item flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium",
                          isActive
                            ? "bg-primary/10 text-primary"
                            : "text-[hsl(var(--sidebar-foreground))] hover:bg-secondary",
                          sidebarCollapsed && "justify-center px-2"
                        )
                      }
                    >
                      <Icon className="w-[18px] h-[18px] shrink-0" strokeWidth={1.75} />
                      {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
                    </NavLink>
                  );
                  return sidebarCollapsed ? (
                    <Tooltip key={item.to}>
                      <TooltipTrigger asChild>{link}</TooltipTrigger>
                      <TooltipContent side="right">{item.label}</TooltipContent>
                    </Tooltip>
                  ) : link;
                })}
              </div>
            </div>
          ))}
        </nav>

        <button
          onClick={toggleSidebar}
          data-testid="sidebar-toggle"
          className="border-t border-border px-3 py-3 text-muted-foreground hover:text-foreground hover:bg-secondary flex items-center gap-2 text-xs"
        >
          {sidebarCollapsed ? <ChevronsRight className="w-4 h-4" /> : <><ChevronsLeft className="w-4 h-4" /><span>Recolher menu</span></>}
        </button>
      </aside>
    </TooltipProvider>
  );
};

export default Sidebar;
