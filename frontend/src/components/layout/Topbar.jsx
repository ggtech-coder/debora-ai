import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAppStore } from "@/store/useAppStore";
import { useDataStore } from "@/store/useDataStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Bell, Sun, Moon, LogOut, User, Menu } from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { relativeTime, initials } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { usePermissions } from "@/hooks/usePermissions";
import { usePermissionsStore } from "@/store/usePermissionsStore";
import { toast } from "sonner";

const ROUTE_LABELS = {
  "": "Dashboard", reports: "Relatórios", tv: "Modo TV", leads: "Leads",
  "lead-rotation": "Rodízio de Leads", crm: "CRM", clients: "Clientes",
  inventory: "Inventário", calendar: "Agenda", finance: "Financeiro",
  documents: "Documentos", inbox: "Atendimento", whatsapp: "WhatsApp",
  instagram: "Instagram", chatbot: "Chatbot", marketing: "Marketing",
  automations: "Automações", ai: "IA", sites: "Sites", settings: "Configurações",
  customization: "Personalizações", notifications: "Notificações",
  plan: "Meu Plano", account: "Minha Conta", "admin-master": "Admin Master",
};

const Topbar = ({ onOpenMobileNav }) => {
  const { user, logout, theme, toggleTheme, globalPeriod, setGlobalPeriod, setUserRole, setUserAgent, stopImpersonation, activeTenantId } = useAppStore();
  const { notifications, markAllRead, markRead } = useDataStore();
  const agents = useDataStore((s) => s.agents);
  const { role, isAdmin } = usePermissions();
  const roles = usePermissionsStore((s) => s.roles);
  const tenantAgents = agents.filter((a) => a.tenantId === activeTenantId);
  // Admin controls are available whenever the user's *original* role is admin,
  // so admins keep the switcher even while impersonating another role.
  const canImpersonate = user?.originalRoleId === "admin";
  const isImpersonating = canImpersonate && (user?.roleId !== user?.originalRoleId || user?.agentId !== user?.originalAgentId);
  const nav = useNavigate();
  const location = useLocation();
  const parts = location.pathname.split("/").filter(Boolean);
  const unread = notifications.filter((n) => !n.read).length;

  return (
    <header className="glass-topbar sticky top-0 z-30" data-testid="app-topbar">
      <div className="flex items-center gap-3 px-4 md:px-6 h-16">
        <button className="md:hidden p-2 -ml-2" onClick={onOpenMobileNav} data-testid="mobile-menu-btn">
          <Menu className="w-5 h-5" />
        </button>

        {/* Breadcrumbs */}
        <nav className="hidden md:flex items-center gap-2 text-sm min-w-0" data-testid="breadcrumbs">
          <Link to="/" className="text-muted-foreground hover:text-foreground truncate">Débora.ai</Link>
          {parts.length === 0 ? (
            <>
              <span className="text-muted-foreground">/</span>
              <span className="text-foreground font-medium">Dashboard</span>
            </>
          ) : (
            parts.map((p, i) => (
              <React.Fragment key={p}>
                <span className="text-muted-foreground">/</span>
                <span className={cn(i === parts.length - 1 ? "text-foreground font-medium" : "text-muted-foreground")}>
                  {ROUTE_LABELS[p] || p}
                </span>
              </React.Fragment>
            ))
          )}
        </nav>

        <div className="flex-1" />

        {/* Search */}
        <div className="hidden lg:flex items-center gap-2 relative w-72">
          <Search className="absolute left-3 w-4 h-4 text-muted-foreground pointer-events-none" />
          <Input
            data-testid="global-search"
            placeholder="Buscar leads, clientes, imóveis..."
            className="pl-9 h-9 bg-secondary/50 border-transparent focus-visible:bg-background focus-visible:border-input"
          />
          <kbd className="absolute right-3 text-[10px] px-1.5 py-0.5 rounded border border-border bg-background text-muted-foreground font-mono">⌘K</kbd>
        </div>

        {/* Global period */}
        <Select value={globalPeriod} onValueChange={setGlobalPeriod}>
          <SelectTrigger className="w-[130px] h-9 hidden sm:flex" data-testid="global-period">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Últimos 7 dias</SelectItem>
            <SelectItem value="30d">Últimos 30 dias</SelectItem>
            <SelectItem value="90d">Últimos 90 dias</SelectItem>
            <SelectItem value="ytd">Ano atual</SelectItem>
            <SelectItem value="all">Todo período</SelectItem>
          </SelectContent>
        </Select>

        {/* Theme */}
        <Button variant="ghost" size="icon" onClick={toggleTheme} data-testid="theme-toggle" className="h-9 w-9">
          {theme === "dark" ? <Sun className="w-[18px] h-[18px]" /> : <Moon className="w-[18px] h-[18px]" />}
        </Button>

        {/* Notifications */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="relative h-9 w-9" data-testid="notifications-btn">
              <Bell className="w-[18px] h-[18px]" />
              {unread > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-destructive pulse-dot" />
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-96 p-0">
            <div className="flex items-center justify-between p-3 border-b border-border">
              <div className="font-semibold text-sm">Notificações</div>
              <button onClick={markAllRead} className="text-xs text-primary hover:underline" data-testid="mark-all-read">Marcar todas lidas</button>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {notifications.map((n) => (
                <button
                  key={n.id}
                  onClick={() => markRead(n.id)}
                  className={cn(
                    "w-full text-left p-3 border-b border-border hover:bg-secondary/50 flex items-start gap-2",
                    !n.read && "bg-primary/5"
                  )}
                >
                  {!n.read && <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium">{n.title}</div>
                    <div className="text-xs text-muted-foreground line-clamp-2">{n.desc}</div>
                    <div className="text-[10px] text-muted-foreground mt-1">{relativeTime(n.createdAt)}</div>
                  </div>
                </button>
              ))}
            </div>
            <div className="p-2 border-t border-border">
              <Button variant="ghost" size="sm" className="w-full" onClick={() => nav("/notifications")}>
                Ver todas
              </Button>
            </div>
          </PopoverContent>
        </Popover>

        {/* User */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-md hover:bg-secondary" data-testid="user-menu">
              <Avatar className="w-8 h-8">
                <AvatarImage src={user?.avatar} />
                <AvatarFallback>{initials(user?.name)}</AvatarFallback>
              </Avatar>
              <div className="hidden md:block text-left">
                <div className="text-sm font-medium leading-none">{user?.name || "Usuário"}</div>
                <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                  <span className="inline-block w-1.5 h-1.5 rounded-full" style={{ background: role?.color || "hsl(var(--primary))" }} />
                  {role?.name || "—"}
                </div>
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64">
            <DropdownMenuLabel>{user?.email}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {canImpersonate && (
              <>
                <div className="px-2 py-1.5 space-y-2">
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Simular papel (admin)</div>
                    <Select value={user?.roleId || "admin"} onValueChange={(v) => { setUserRole(v); toast.success(`Papel alterado para ${roles.find(r => r.id === v)?.name}`); }}>
                      <SelectTrigger className="h-8 text-xs" data-testid="role-switcher"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {roles.map((r) => (
                          <SelectItem key={r.id} value={r.id}>
                            <span className="flex items-center gap-2">
                              <span className="inline-block w-2 h-2 rounded-full" style={{ background: r.color }} />
                              {r.name}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Simular como corretor</div>
                    <Select value={user?.agentId || "a1"} onValueChange={(v) => { setUserAgent(v); toast.success(`Assumindo perspectiva de ${tenantAgents.find(a => a.id === v)?.name || "corretor"}`); }}>
                      <SelectTrigger className="h-8 text-xs" data-testid="agent-switcher"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {tenantAgents.map((a) => (
                          <SelectItem key={a.id} value={a.id}>
                            <span className="flex items-center gap-2 text-xs">
                              <span className="inline-block w-2 h-2 rounded-full bg-primary" />
                              {a.name} · {a.team}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {isImpersonating && (
                    <button
                      onClick={() => { stopImpersonation(); toast.success("Voltou ao Admin"); }}
                      className="w-full text-[11px] text-primary hover:underline text-left"
                      data-testid="stop-impersonation"
                    >
                      ← Sair da simulação (voltar ao Admin)
                    </button>
                  )}
                </div>
                <DropdownMenuSeparator />
              </>
            )}
            <DropdownMenuItem onClick={() => nav("/account")}><User className="w-4 h-4 mr-2" />Minha Conta</DropdownMenuItem>
            <DropdownMenuItem onClick={() => nav("/plan")}>Meu Plano</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => { logout(); nav("/login"); }} className="text-destructive" data-testid="logout-btn">
              <LogOut className="w-4 h-4 mr-2" />Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};

export default Topbar;
