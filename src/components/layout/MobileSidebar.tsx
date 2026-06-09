import { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard, CheckSquare, Users, FileText,
  Calendar, FileStack, GraduationCap, KeyRound,
  HeadphonesIcon, LogOut, Link2, X, ContactRound, Percent
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { useState } from "react";

const sections = [
  {
    label: "Operação",
    items: [
      { name: "Dashboard", href: "/", icon: LayoutDashboard },
      { name: "Tarefas", href: "/tarefas", icon: CheckSquare },
      { name: "Agenda", href: "/agenda", icon: Calendar },
      { name: "Documentos", href: "/documentos", icon: FileStack },
      { name: "Alunos", href: "/alunos", icon: ContactRound },
      { name: "Suporte", href: "/suporte", icon: HeadphonesIcon },
      { name: "Links Úteis", href: "/links", icon: Link2 },
    ],
  },
  {
    label: "Conteúdo",
    items: [
      { name: "Editorial", href: "/editorial", icon: FileText },
    ],
  },
  {
    label: "Interno",
    items: [
      { name: "Treinamentos", href: "/treinamentos", icon: GraduationCap },
      { name: "Senhas Úteis", href: "/senhas", icon: KeyRound },
      { name: "Comissões e Metas", href: "/comissoes", icon: Percent },
    ],
  },
];

const adminSections = [
  {
    label: "Gestão",
    items: [
      { name: "Equipe", href: "/equipe", icon: Users },
    ],
  },
];

interface MobileSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileSidebar({ isOpen, onClose }: MobileSidebarProps) {
  const location = useLocation();
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState<any>(null);

  // Close on route change
  useEffect(() => {
    onClose();
  }, [location.pathname]);

  // Fetch profile
  useEffect(() => {
    if (user) {
      const fetchProfile = async () => {
        const { data } = await supabase
          .from('profiles')
          .select('full_name, avatar_url, role')
          .eq('id', user.id)
          .single();
        if (data) setProfile(data);
      };
      fetchProfile();

      const channel = supabase
        .channel('mobile-sidebar-profile')
        .on('postgres_changes', {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${user.id}`
        }, (payload) => {
          setProfile(payload.new);
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const userName = profile?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || "Usuário";
  const avatarUrl = profile?.avatar_url || user?.user_metadata?.avatar_url;
  const initials = userName.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase();

  const allSections = (profile?.role === "CEO" || profile?.role === "Diretoria")
    ? [...sections, ...adminSections]
    : sections;

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="md:hidden fixed inset-0 z-[60] bg-black/50"
          onClick={onClose}
          style={{ animation: 'overlay-in 100ms ease-out both' }}
        />
      )}

      {/* Drawer */}
      <div
        className={cn(
          "md:hidden fixed inset-y-0 left-0 z-[70] w-72 bg-card border-r border-border flex flex-col",
          "transition-transform duration-200 ease-out",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Header */}
        <div className="flex h-16 pt-[env(safe-area-inset-top,0px)] box-content items-center justify-between px-4 border-b border-border">
          <h1 className="font-serif text-xl font-semibold tracking-wide text-foreground">
            LaetitiAPP
          </h1>
          <button
            onClick={onClose}
            className="p-1.5 text-muted hover:text-foreground hover:bg-foreground/5 rounded-md transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Nav */}
        <div className="flex-1 overflow-y-auto px-2 py-4">
          <nav className="space-y-5">
            {allSections.map((section) => (
              <div key={section.label}>
                <p className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-widest text-muted">
                  {section.label}
                </p>
                <div className="space-y-0.5">
                  {section.items.map((item) => {
                    const isActive = item.href === "/" ? location.pathname === "/" : location.pathname.startsWith(item.href);
                    return (
                      <Link
                        key={item.name}
                        to={item.href}
                        className={cn(
                          isActive
                            ? "bg-letitia-gold/10 text-foreground font-medium"
                            : "text-muted hover:bg-foreground/5 hover:text-foreground",
                          "group flex items-center rounded-md px-3 py-2.5 text-sm transition-colors"
                        )}
                      >
                        <item.icon
                          className={cn(
                            isActive ? "text-letitia-clay" : "text-muted group-hover:text-foreground",
                            "h-4 w-4 flex-shrink-0 mr-3 transition-colors"
                          )}
                          aria-hidden="true"
                        />
                        {item.name}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
        </div>

        {/* User */}
        <div className="border-t border-border p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] bg-card">
          <div className="flex items-center justify-between">
            <Link to="/perfil" className="flex items-center hover:opacity-80 transition-opacity flex-1 min-w-0">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-card border border-border text-sm font-medium text-foreground flex-shrink-0 overflow-hidden">
                {avatarUrl ? (
                  <img
                    key={avatarUrl}
                    src={avatarUrl}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : initials}
              </div>
              <div className="ml-3 overflow-hidden flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-foreground truncate">{userName}</p>
                  <span className="px-1.5 py-0.5 rounded-full bg-letitia-gold/10 text-letitia-gold text-[8px] font-bold uppercase tracking-wider border border-letitia-gold/20 flex-shrink-0">
                    {profile?.role || "Suporte"}
                  </span>
                </div>
                <p className="text-xs text-muted truncate">{user?.email || "Dona"}</p>
              </div>
            </Link>

            <button
              onClick={signOut}
              className="p-1.5 text-muted hover:text-red-500 hover:bg-red-500/10 rounded-md transition-colors ml-2"
              title="Sair"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
