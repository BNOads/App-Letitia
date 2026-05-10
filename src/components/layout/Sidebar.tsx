import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard, CheckSquare, Users, LineChart, FileText,
  GitBranch, Calendar, FileStack, GraduationCap, KeyRound,
  PanelLeftClose, PanelLeftOpen, HeadphonesIcon, LogOut, Link2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSidebar } from "./SidebarContext";
import { useAuth } from "@/contexts/AuthContext";

const sections = [
  {
    label: "Operação",
    items: [
      { name: "Dashboard", href: "/", icon: LayoutDashboard },
      { name: "Tarefas", href: "/tarefas", icon: CheckSquare },
      { name: "Agenda", href: "/agenda", icon: Calendar },
      { name: "Documentos", href: "/documentos", icon: FileStack },
      { name: "Suporte", href: "/suporte", icon: HeadphonesIcon },
      { name: "Links Úteis", href: "/links", icon: Link2 },
    ],
  },
  {
    label: "Comercial",
    items: [
      { name: "CRM", href: "/crm", icon: Users },
      { name: "Pipeline THE WAY", href: "/pipeline", icon: GitBranch },
      { name: "Vendas", href: "/vendas", icon: LineChart },
    ],
  },
  {
    label: "Conteúdo",
    items: [
      { name: "Editorial", href: "/conteudo", icon: FileText },
    ],
  },
  {
    label: "Interno",
    items: [
      { name: "Treinamentos", href: "/treinamentos", icon: GraduationCap },
      { name: "Senhas Úteis", href: "/senhas", icon: KeyRound },
    ],
  },
];

export function Sidebar() {
  const location = useLocation();
  const { collapsed, toggle } = useSidebar();
  const { user, signOut } = useAuth();

  // Se tiver um nome no metadado do supabase, pega as iniciais, se não 'LC'
  const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || "Letícia Cazarré";
  const initials = userName.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase();

  return (
    <div className={cn(
      "hidden md:flex h-full flex-col border-r border-border bg-card transition-all duration-300",
      collapsed ? "w-16" : "w-64"
    )}>
      {/* Logo */}
      <div className={cn("flex h-16 items-center border-b border-border", collapsed ? "justify-center" : "px-4")}>
        <button 
          onClick={toggle}
          className={cn("transition-transform hover:scale-105", collapsed ? "h-8 w-8" : "")}
        >
          {!collapsed ? (
            <h1 className="font-serif text-2xl font-semibold tracking-wide text-foreground">
              LetitiAPP
            </h1>
          ) : (
            <img src="/favicon.png" alt="L'app" className="h-8 w-8 object-contain rounded" />
          )}
        </button>
      </div>

      {/* Nav */}
      <div className="flex flex-1 flex-col overflow-y-auto px-2 py-4">
        <nav className="flex-1 space-y-5">
          {sections.map((section) => (
            <div key={section.label}>
              {!collapsed && (
                <p className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-widest text-muted">
                  {section.label}
                </p>
              )}
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const isActive = item.href === "/" ? location.pathname === "/" : location.pathname.startsWith(item.href);
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      title={collapsed ? item.name : undefined}
                      className={cn(
                        isActive
                          ? "bg-letitia-gold/10 text-foreground font-medium"
                          : "text-muted hover:bg-foreground/5 hover:text-foreground",
                        "group flex items-center rounded-md transition-colors",
                        collapsed ? "justify-center px-2 py-2.5" : "px-3 py-2 text-sm"
                      )}
                    >
                      <item.icon
                        className={cn(
                          isActive ? "text-letitia-clay" : "text-muted group-hover:text-foreground",
                          "h-4 w-4 flex-shrink-0 transition-colors",
                          collapsed ? "" : "mr-3"
                        )}
                        aria-hidden="true"
                      />
                      {!collapsed && item.name}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Toggle Button Bottom */}
        <div className="mt-auto pt-4 pb-2 px-2">
          <button
            onClick={toggle}
            className={cn(
              "w-full flex items-center rounded-md p-2 text-muted hover:text-foreground hover:bg-foreground/5 transition-colors",
              collapsed ? "justify-center" : "px-3"
            )}
            title={collapsed ? "Expandir" : "Recolher"}
          >
            {collapsed ? (
              <PanelLeftOpen className="h-4 w-4" />
            ) : (
              <div className="flex items-center gap-3">
                <PanelLeftClose className="h-4 w-4" />
                <span className="text-xs font-medium">Recolher menu</span>
              </div>
            )}
          </button>
        </div>
      </div>

      {/* User */}
      <div className="border-t border-border p-3">
        <div className={cn("flex items-center", collapsed ? "justify-center" : "justify-between")}>
          <div className="flex items-center">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-card border border-border text-sm font-medium text-foreground flex-shrink-0">
              {initials}
            </div>
            {!collapsed && (
              <div className="ml-3 overflow-hidden">
                <p className="text-sm font-medium text-foreground truncate">{userName}</p>
                <p className="text-xs text-muted truncate">{user?.email || "Dona"}</p>
              </div>
            )}
          </div>
          
          {!collapsed && (
            <button 
              onClick={signOut}
              className="p-1.5 text-muted hover:text-red-500 hover:bg-red-500/10 rounded-md transition-colors"
              title="Sair"
            >
              <LogOut className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
