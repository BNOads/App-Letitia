import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell, CheckCircle2, FileText, HeadphonesIcon, CheckSquare,
  FileStack, CheckCheck, Filter, Search, ArrowLeft
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNotifications } from '@/contexts/NotificationContext';
import type { NotificationType, DBNotification } from '@/services/notificationService';

const typeConfig: Record<NotificationType, { icon: typeof Bell; color: string; bg: string; label: string }> = {
  tarefa_concluida: {
    icon: CheckCircle2,
    color: 'text-emerald-600',
    bg: 'bg-emerald-500/10',
    label: 'Tarefa Concluída',
  },
  nova_tarefa: {
    icon: CheckSquare,
    color: 'text-blue-500',
    bg: 'bg-blue-500/10',
    label: 'Nova Tarefa',
  },
  novo_post: {
    icon: FileText,
    color: 'text-amber-500',
    bg: 'bg-amber-500/10',
    label: 'Nova Pauta',
  },
  novo_documento: {
    icon: FileStack,
    color: 'text-purple-500',
    bg: 'bg-purple-500/10',
    label: 'Novo Documento',
  },
  novo_ticket: {
    icon: HeadphonesIcon,
    color: 'text-rose-500',
    bg: 'bg-rose-500/10',
    label: 'Novo Ticket',
  },
};

const filterOptions: { value: string; label: string }[] = [
  { value: 'todas', label: 'Todas' },
  { value: 'tarefa_concluida', label: 'Tarefas concluídas' },
  { value: 'nova_tarefa', label: 'Novas tarefas' },
  { value: 'novo_post', label: 'Pautas' },
  { value: 'novo_documento', label: 'Documentos' },
  { value: 'novo_ticket', label: 'Tickets' },
];

function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffMin < 1) return 'Agora';
  if (diffMin < 60) return `${diffMin}min atrás`;
  if (diffHour < 24) return `${diffHour}h atrás`;
  if (diffDay < 7) return `${diffDay}d atrás`;
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

function NotificationItem({
  notif,
  onRead,
  onNavigate,
}: {
  notif: DBNotification;
  onRead: (id: string) => void;
  onNavigate: (link: string) => void;
}) {
  const config = typeConfig[notif.tipo] || typeConfig.nova_tarefa;
  const Icon = config.icon;

  return (
    <button
      onClick={() => {
        if (!notif.lida) onRead(notif.id);
        onNavigate(notif.link);
      }}
      className={cn(
        'w-full flex items-start gap-4 p-4 rounded-xl text-left transition-all duration-200',
        'hover:scale-[1.01] hover:shadow-md',
        notif.lida
          ? 'bg-card/50 opacity-70 hover:opacity-100'
          : 'bg-card shadow-sm border border-letitia-gold/10'
      )}
    >
      {/* Icon */}
      <div className={cn('flex-shrink-0 h-10 w-10 rounded-lg flex items-center justify-center', config.bg)}>
        <Icon className={cn('h-5 w-5', config.color)} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className={cn(
            'text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full',
            config.bg, config.color
          )}>
            {config.label}
          </span>
          {!notif.lida && (
            <span className="h-2 w-2 rounded-full bg-letitia-clay flex-shrink-0 animate-pulse" />
          )}
        </div>
        <p className={cn(
          'text-sm leading-snug',
          notif.lida ? 'text-muted' : 'text-foreground font-medium'
        )}>
          {notif.descricao}
        </p>
        <p className="text-[11px] text-muted mt-1">{timeAgo(notif.created_at)}</p>
      </div>
    </button>
  );
}

export function Notificacoes() {
  const navigate = useNavigate();
  const { notifications, unreadCount, markAsRead, markAllAsRead, loading } = useNotifications();
  const [activeFilter, setActiveFilter] = useState('todas');
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    let result = notifications;
    if (activeFilter !== 'todas') {
      result = result.filter((n) => n.tipo === activeFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (n) =>
          n.descricao.toLowerCase().includes(q) ||
          n.titulo.toLowerCase().includes(q)
      );
    }
    return result;
  }, [notifications, activeFilter, search]);

  // Group by date
  const grouped = useMemo(() => {
    const groups: Record<string, DBNotification[]> = {};
    for (const n of filtered) {
      const date = new Date(n.created_at);
      const today = new Date();
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      let key: string;
      if (date.toDateString() === today.toDateString()) {
        key = 'Hoje';
      } else if (date.toDateString() === yesterday.toDateString()) {
        key = 'Ontem';
      } else {
        key = date.toLocaleDateString('pt-BR', {
          day: '2-digit',
          month: 'long',
          year: 'numeric',
        });
      }
      if (!groups[key]) groups[key] = [];
      groups[key].push(n);
    }
    return groups;
  }, [filtered]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-lg text-muted hover:text-foreground hover:bg-foreground/5 transition-colors md:hidden"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl md:text-3xl font-serif font-semibold text-foreground tracking-tight">
              Notificações
            </h1>
            <p className="text-sm text-muted mt-0.5">
              {unreadCount > 0
                ? `${unreadCount} não ${unreadCount === 1 ? 'lida' : 'lidas'}`
                : 'Tudo em dia ✨'}
            </p>
          </div>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-letitia-gold bg-letitia-gold/10 hover:bg-letitia-gold/20 transition-colors border border-letitia-gold/20"
          >
            <CheckCheck className="h-4 w-4" />
            Marcar todas como lidas
          </button>
        )}
      </div>

      {/* Search + Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar notificações..."
            className="w-full rounded-lg border-0 py-2.5 pl-10 pr-4 text-sm text-foreground bg-card ring-1 ring-inset ring-border placeholder:text-muted focus:ring-2 focus:ring-letitia-gold/50"
          />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <Filter className="h-4 w-4 text-muted flex-shrink-0" />
          {filterOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setActiveFilter(opt.value)}
              className={cn(
                'px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all',
                activeFilter === opt.value
                  ? 'bg-letitia-gold/15 text-letitia-gold border border-letitia-gold/30'
                  : 'bg-card text-muted hover:text-foreground border border-border hover:border-foreground/20'
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Notification List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="h-8 w-8 border-2 border-letitia-gold/30 border-t-letitia-gold rounded-full animate-spin" />
          <p className="text-sm text-muted">Carregando notificações...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="h-16 w-16 rounded-2xl bg-card flex items-center justify-center border border-border">
            <Bell className="h-8 w-8 text-muted" />
          </div>
          <div className="text-center">
            <p className="text-foreground font-medium">Nenhuma notificação</p>
            <p className="text-sm text-muted mt-1">
              {search || activeFilter !== 'todas'
                ? 'Tente alterar os filtros ou termo de busca.'
                : 'Quando algo acontecer no sistema, você será notificado aqui.'}
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([label, items]) => (
            <div key={label}>
              <h3 className="text-xs font-semibold uppercase tracking-widest text-muted mb-3 px-1">
                {label}
              </h3>
              <div className="space-y-2">
                {items.map((n) => (
                  <NotificationItem
                    key={n.id}
                    notif={n}
                    onRead={markAsRead}
                    onNavigate={(link) => navigate(link)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
