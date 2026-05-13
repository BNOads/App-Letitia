import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell, Search, CheckCircle2, FileText, HeadphonesIcon,
  CheckSquare, FileStack, ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNotifications } from '@/contexts/NotificationContext';
import type { NotificationType, DBNotification } from '@/services/notificationService';
import { GlobalSearch } from '@/components/GlobalSearch';

const typeIcons: Record<NotificationType, { icon: typeof Bell; color: string; bg: string }> = {
  tarefa_concluida: { icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-500/10' },
  nova_tarefa: { icon: CheckSquare, color: 'text-blue-500', bg: 'bg-blue-500/10' },
  novo_post: { icon: FileText, color: 'text-amber-500', bg: 'bg-amber-500/10' },
  novo_documento: { icon: FileStack, color: 'text-purple-500', bg: 'bg-purple-500/10' },
  novo_ticket: { icon: HeadphonesIcon, color: 'text-rose-500', bg: 'bg-rose-500/10' },
};

function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffMin < 1) return 'Agora';
  if (diffMin < 60) return `${diffMin}min`;
  if (diffHour < 24) return `${diffHour}h`;
  if (diffDay < 7) return `${diffDay}d`;
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

function DropdownNotifItem({
  notif,
  onRead,
  onNavigate,
}: {
  notif: DBNotification;
  onRead: (id: string) => void;
  onNavigate: (link: string) => void;
}) {
  const config = typeIcons[notif.tipo] || typeIcons.nova_tarefa;
  const Icon = config.icon;

  return (
    <button
      onClick={() => {
        if (!notif.lida) onRead(notif.id);
        onNavigate(notif.link);
      }}
      className={cn(
        'w-full flex items-start gap-3 px-4 py-3 text-left transition-colors',
        'hover:bg-foreground/5',
        notif.lida ? 'opacity-60' : ''
      )}
    >
      <div className={cn('flex-shrink-0 h-8 w-8 rounded-lg flex items-center justify-center mt-0.5', config.bg)}>
        <Icon className={cn('h-4 w-4', config.color)} />
      </div>
      <div className="flex-1 min-w-0">
        <p className={cn(
          'text-[13px] leading-snug line-clamp-2',
          notif.lida ? 'text-muted' : 'text-foreground font-medium'
        )}>
          {notif.descricao}
        </p>
        <p className="text-[11px] text-muted mt-0.5">{timeAgo(notif.created_at)}</p>
      </div>
      {!notif.lida && (
        <span className="h-2 w-2 rounded-full bg-letitia-clay flex-shrink-0 mt-2 animate-pulse" />
      )}
    </button>
  );
}

export function Header() {
  const navigate = useNavigate();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Global keyboard shortcut: Cmd+K / Ctrl+K
  useEffect(() => {
    const handleSearchShortcut = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(prev => !prev);
      }
    };
    document.addEventListener('keydown', handleSearchShortcut);
    return () => document.removeEventListener('keydown', handleSearchShortcut);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const recentThree = notifications.slice(0, 3);

  return (
    <>
    <header className="flex h-16 items-center justify-between border-b border-border bg-background px-4 md:px-8">
      {/* Mobile: App Name | Desktop: Search */}
      <div className="flex flex-1 items-center gap-3">
        <h1 className="font-serif text-xl font-semibold tracking-wide text-foreground md:hidden">
          LaetitiAPP
        </h1>
        <div className="relative w-full max-w-md hidden md:block">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <Search className="h-4 w-4 text-muted" />
          </div>
          <button
            onClick={() => setIsSearchOpen(true)}
            className="block w-full rounded-md border-0 py-1.5 pl-10 pr-3 text-left text-muted bg-transparent ring-1 ring-inset ring-border hover:ring-letitia-gold/40 focus:ring-2 focus:ring-inset focus:ring-letitia-gold sm:text-sm sm:leading-6 transition-all cursor-pointer"
          >
            <span className="flex items-center justify-between">
              <span>Buscar documentos, posts, tarefas...</span>
              <kbd className="hidden lg:inline-flex h-5 items-center gap-1 rounded border border-border bg-background/60 px-1.5 text-[10px] font-medium text-muted/60 select-none">⌘K</kbd>
            </span>
          </button>
        </div>
      </div>
      <div className="flex items-center gap-2 md:gap-4">
        {/* Mobile search icon */}
        <button onClick={() => setIsSearchOpen(true)} className="md:hidden relative p-2 text-muted hover:text-foreground transition-colors">
          <Search className="h-5 w-5" />
        </button>

        {/* Notification Bell + Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="relative p-2 text-muted hover:text-foreground transition-colors"
            aria-label="Notificações"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-letitia-clay text-[10px] font-bold text-white ring-2 ring-background">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>

          {/* Dropdown */}
          {isOpen && (
            <div
              className={cn(
                'absolute right-0 top-full mt-2 w-[360px] max-w-[calc(100vw-2rem)]',
                'bg-popover border border-border rounded-xl shadow-xl',
                'modal-content',
                'z-50 overflow-hidden'
              )}
            >
              {/* Dropdown Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                <h3 className="text-sm font-semibold text-foreground">Notificações</h3>
                {unreadCount > 0 && (
                  <button
                    onClick={() => {
                      markAllAsRead();
                    }}
                    className="text-[11px] font-medium text-letitia-gold hover:text-letitia-gold/80 transition-colors"
                  >
                    Marcar todas como lidas
                  </button>
                )}
              </div>

              {/* Recent 3 */}
              {recentThree.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 gap-2">
                  <Bell className="h-8 w-8 text-muted/40" />
                  <p className="text-sm text-muted">Sem notificações</p>
                </div>
              ) : (
                <div className="divide-y divide-border/50 max-h-[280px] overflow-y-auto">
                  {recentThree.map((n) => (
                    <DropdownNotifItem
                      key={n.id}
                      notif={n}
                      onRead={markAsRead}
                      onNavigate={(link) => {
                        setIsOpen(false);
                        navigate(link);
                      }}
                    />
                  ))}
                </div>
              )}

              {/* Footer: link to all */}
              <button
                onClick={() => {
                  setIsOpen(false);
                  navigate('/notificacoes');
                }}
                className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 text-[13px] font-medium text-letitia-gold hover:bg-letitia-gold/5 border-t border-border transition-colors"
              >
                Ver todas as notificações
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>

    <GlobalSearch isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  );
}
