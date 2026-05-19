import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getDashboardStats } from "@/services/dashboardService";
import { 
  Clock, 
  Loader2, ChevronRight, ChevronDown,
  Calendar, Headset, Plus, List as ListIcon, CalendarDays, CalendarClock,
  Circle, CheckCircle2, Send, Repeat, ArrowRight, AlertCircle,
  Bell, BellDot, X, Info
} from "lucide-react";
import { cn } from "@/lib/utils";

import { createTask, updateTaskStatus, updateTask, updateSubtask, getTasks, type DBTask } from "@/services/taskService";
import { getProfiles, type DBProfile } from "@/services/profileService";
import { notifyTaskCompleted } from "@/services/notificationService";
import { useNotifications } from "@/contexts/NotificationContext";
import { NovoTarefaModal, TaskDetailModal } from "./Tarefas";


type Stats = {
  tarefas: {
    total: number;
    concluidas: number;
    atrasadas: any[];
    hoje: any[];
    proximas: any[];
  };
  eventos: any[];
  ticketsAbertos: number;
  ticketsEmAtendimento: number;
  ticketsAtrasados: number;
  ticketsResolvidos: number;
  pautas: any[];
};




export function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [profiles, setProfiles] = useState<DBProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [quickTask, setQuickTask] = useState("");
  const [addingTask, setAddingTask] = useState(false);
  const [selectedTarefa, setSelectedTarefa] = useState<DBTask | null>(null);
  const [allTasks, setAllTasks] = useState<DBTask[]>([]);
  const [showDashAtrasadas, setShowDashAtrasadas] = useState(true);
  const [showDashHoje, setShowDashHoje] = useState(true);
  const [showDashProximas, setShowDashProximas] = useState(false);
  
  const { notifications, unreadCount, markAsRead, markAllAsRead, loading: notifLoading } = useNotifications();
  const [hasCheckedUnread, setHasCheckedUnread] = useState(false);
  const [showUnreadModal, setShowUnreadModal] = useState(false);


  const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || "Letícia";
  const hour = new Date().getHours();
  const saudacao = hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite";

  const loadStats = async () => {
    try {
      const [statsData, profilesData, tasksData] = await Promise.all([
        getDashboardStats(user?.id),
        getProfiles(),
        getTasks()
      ]);
      setStats(statsData);
      setProfiles(profilesData);
      setAllTasks(tasksData);
    } catch (error) {
      console.error("Erro ao carregar estatísticas:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  useEffect(() => {
    if (!notifLoading && !hasCheckedUnread) {
      if (unreadCount > 0) {
        setShowUnreadModal(true);
      }
      setHasCheckedUnread(true);
    }
  }, [notifLoading, unreadCount, hasCheckedUnread]);

  const handleQuickTask = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!quickTask.trim() || !user || addingTask) return;
    
    setAddingTask(true);
    try {
      await createTask({
        titulo: quickTask.trim(),
        descricao: null as any,
        status: 'fazer',
        prioridade: 'normal',
        responsavel_id: user.id,
        prazo: new Date().toISOString().split('T')[0],
        created_by: user.id
      });
      setQuickTask("");
      await loadStats();
    } catch (error: any) {
      console.error("Erro ao criar tarefa rápida:", error?.message || error);
      alert("Erro ao criar tarefa. Tente novamente.");
    } finally {
      setAddingTask(false);
    }
  };

  const handleToggleTask = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'concluido' ? 'fazer' : 'concluido';
    try {
      if (id.startsWith('sub_')) {
        await updateSubtask(id.replace('sub_', ''), { concluida: newStatus === 'concluido' });
      } else {
        await updateTaskStatus(id, newStatus as any);
      }
      
      // Notify everyone when a task is completed from the dashboard
      if (newStatus === 'concluido' && user) {
        const tarefa = allTasks.find(t => t.id === id);
        if (tarefa && !id.startsWith('sub_')) {
          const uName = profiles.find(p => p.id === user.id)?.full_name || 'Alguém';
          notifyTaskCompleted(tarefa.titulo, tarefa.id, user.id, uName);
        }
      }
      loadStats();
    } catch (error) {
      console.error("Erro ao alternar tarefa:", error);
    }
  };

  const handleUpdateTaskField = async (id: string, updates: any) => {
    try {
      if (id.startsWith('sub_')) {
        await updateSubtask(id.replace('sub_', ''), updates);
      } else {
        await updateTask(id, updates);
      }
      loadStats();
    } catch (error) {
      console.error("Erro ao atualizar tarefa:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-letitia-gold" />
      </div>
    );
  }

  const progressoGeral = stats ? Math.round((stats.tarefas.concluidas / (stats.tarefas.total || 1)) * 100) : 0;
  const hoje = new Date().toISOString().split('T')[0];
  const concluidasHoje = allTasks.filter(t => t.status === 'concluido' && t.responsavel_id === user?.id && t.updated_at?.startsWith(hoje));

  return (
    <div className="space-y-8 pb-10">
      <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h2 className="font-serif text-4xl font-medium tracking-tight text-foreground">
            {saudacao}, {userName}
          </h2>
          <p className="mt-1.5 text-muted text-sm">Aqui está o panorama geral do seu ecossistema hoje.</p>
        </div>
        
        {/* Ticket Summary */}
        <a 
          href="/suporte"
          className="flex items-center gap-5 bg-card border border-border px-6 py-4 rounded-2xl cursor-pointer hover:border-letitia-gold/30 transition-colors shadow-sm"
        >
          <div className="h-11 w-11 rounded-xl bg-red-500/10 flex items-center justify-center flex-shrink-0">
            <Headset className="h-5 w-5 text-red-500" />
          </div>
          <div className="flex items-center gap-4 divide-x divide-border">
            <div className="flex flex-col items-center pr-4">
              <span className="text-xl font-bold text-blue-600 leading-none">{stats?.ticketsAbertos || 0}</span>
              <span className="text-[9px] font-bold uppercase tracking-widest text-blue-500/70 mt-0.5">Abertos</span>
            </div>
            <div className="flex flex-col items-center px-4">
              <span className="text-xl font-bold text-amber-600 leading-none">{stats?.ticketsEmAtendimento || 0}</span>
              <span className="text-[9px] font-bold uppercase tracking-widest text-amber-500/70 mt-0.5">Atendendo</span>
            </div>
            {(stats?.ticketsAtrasados || 0) > 0 && (
              <div className="flex flex-col items-center px-4">
                <span className="text-xl font-bold text-red-600 leading-none">{stats?.ticketsAtrasados}</span>
                <span className="text-[9px] font-bold uppercase tracking-widest text-red-500/70 mt-0.5">Atrasados</span>
              </div>
            )}
            <div className="flex flex-col items-center pl-4">
              <span className="text-xl font-bold text-green-600 leading-none">{stats?.ticketsResolvidos || 0}</span>
              <span className="text-[9px] font-bold uppercase tracking-widest text-green-500/70 mt-0.5">Resolvidos</span>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-muted ml-auto" />
        </a>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* AGENDA - Column Left (7/12) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-card border border-border rounded-[2rem] p-8 shadow-sm relative overflow-hidden group">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <h3 className="text-xl font-semibold text-foreground">Próximos Eventos</h3>
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-letitia-gold/10 text-xs font-bold text-letitia-gold">
                  {stats?.eventos.length}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex bg-background border border-border p-1 rounded-lg">
                  <button className="p-1.5 rounded bg-letitia-gold/10 text-letitia-gold"><ListIcon className="h-4 w-4" /></button>
                  <button className="p-1.5 rounded text-muted hover:text-foreground"><CalendarDays className="h-4 w-4" /></button>
                </div>
                <button className="bg-letitia-gold text-white p-2 rounded-xl hover:opacity-90 transition-all">
                  <Plus className="h-4 w-4" />
                </button>
                <a href="/agenda" className="text-sm font-medium text-letitia-gold hover:underline">Ver agenda</a>
              </div>
            </div>

            <div className="space-y-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/50 mb-2">Próximos</p>
              {stats?.eventos.length === 0 ? (
                <div className="py-10 text-center border-2 border-dashed border-border rounded-2xl">
                  <p className="text-sm text-muted">Nenhum evento agendado para os próximos dias.</p>
                </div>
              ) : (
                stats?.eventos.map((evento, _idx) => (
                  <div 
                    key={evento.id}
                    className="flex items-center gap-4 p-4 rounded-2xl bg-letitia-gold/[0.03] border border-letitia-gold/5 group/item hover:border-letitia-gold/20 hover:bg-letitia-gold/[0.05] transition-colors cursor-pointer"
                  >
                    <div className="w-1 bg-letitia-gold rounded-full self-stretch" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-foreground">{evento.titulo}</h4>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 uppercase">
                          {evento.tipo}
                        </span>
                        {evento.recorrencia && (
                          <span className="flex items-center gap-1 text-[9px] font-medium px-1.5 py-0.5 rounded-full bg-violet-500/10 text-violet-600 border border-violet-500/20">
                            <Repeat className="h-2.5 w-2.5" />
                            {evento.recorrencia === 'diario' ? 'Diário' : evento.recorrencia === 'semanal' ? 'Semanal' : evento.recorrencia === 'quinzenal' ? 'Quinzenal' : evento.recorrencia === 'mensal' ? 'Mensal' : evento.recorrencia === 'semestral' ? 'Semestral' : 'Anual'}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 mt-1">
                        <div className="flex items-center gap-1.5 text-muted">
                          <Clock className="h-3.5 w-3.5" />
                          <span className="text-xs font-medium">{evento.hora_inicio.slice(0, 5)}</span>
                        </div>
                        {evento.participantes?.length > 0 && (
                          <div className="flex -space-x-2">
                             {evento.participantes.slice(0, 3).map((p: string, i: number) => (
                               <div key={i} className="h-6 w-6 rounded-full border-2 border-card bg-letitia-gold/20 flex items-center justify-center text-[8px] font-bold">
                                 {p.charAt(0)}
                               </div>
                             ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted/30 group-hover/item:text-letitia-gold transition-colors" />
                  </div>
                ))
              )}
            </div>
            
            <div className="mt-8 text-center">
              <a href="/agenda" className="text-sm font-medium text-letitia-gold/60 hover:text-letitia-gold transition-colors">Ver mais eventos →</a>
            </div>
          </div>
        </div>

        {/* TAREFAS - Column Right (5/12) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-card border border-border rounded-[2rem] p-8 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-xl font-semibold text-foreground">Minhas Tarefas</h3>
                <p className="text-xs text-muted mt-1">{stats?.tarefas.concluidas} de {stats?.tarefas.total} tarefas concluídas</p>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setIsModalOpen(true)}
                  className="bg-letitia-gold text-white px-4 py-2 rounded-xl text-xs font-semibold hover:opacity-90 transition-all flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" /> Nova Tarefa
                </button>
                <a href="/tarefas" className="p-2 border border-border rounded-xl text-muted hover:text-letitia-gold hover:border-letitia-gold/30 transition-all" title="Ver todas as tarefas">
                  <ArrowRight className="h-4 w-4" />
                </a>
              </div>
            </div>

            <div className="space-y-2 mb-8">
              <div className="flex justify-between text-xs font-bold uppercase tracking-wider mb-2">
                <span className="text-muted">Progresso geral</span>
                <span className="text-letitia-gold">{progressoGeral}%</span>
              </div>
              <div className="h-2 w-full bg-letitia-gold/10 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-letitia-gold transition-[width] duration-500"
                  style={{ width: `${progressoGeral}%` }}
                />
              </div>
            </div>

            {/* Input de Criação Rápida */}
            <form onSubmit={handleQuickTask} className="relative mb-4">
              <input 
                type="text"
                value={quickTask}
                onChange={e => setQuickTask(e.target.value)}
                placeholder="Criar tarefa rápida... (Aperte Enter)"
                disabled={addingTask}
                className="w-full bg-background border border-border rounded-2xl pl-5 pr-12 py-3 text-sm focus:ring-2 focus:ring-letitia-gold focus:outline-none transition-all placeholder:text-muted/50"
              />
              <button 
                type="button"
                onClick={() => handleQuickTask()}
                disabled={!quickTask.trim() || addingTask}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-xl bg-letitia-gold text-white disabled:opacity-30 transition-all z-10"
              >
                {addingTask ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </button>
            </form>

            <div className="space-y-3">
              {/* Seção: Em atraso */}
              {(stats?.tarefas.atrasadas.length || 0) > 0 && (
                <div>
                  <button onClick={() => setShowDashAtrasadas(!showDashAtrasadas)} className="flex items-center gap-2 hover:opacity-80 transition-opacity mb-2 w-full">
                    <AlertCircle className="h-4 w-4 text-red-500" />
                    <span className="text-sm font-semibold text-red-500">Em atraso</span>
                    <span className="text-xs font-medium text-white bg-red-500 px-2 py-0.5 rounded-full">{stats?.tarefas.atrasadas.length}</span>
                    <ChevronDown className={cn("h-3.5 w-3.5 text-muted ml-auto transition-transform", showDashAtrasadas && "rotate-180")} />
                  </button>
                  {showDashAtrasadas && (
                    <div className="max-h-[340px] overflow-y-auto pr-1">
                      {stats?.tarefas.atrasadas.map((tarefa: any, idx: number) => (
                        <DashboardTaskCard key={tarefa.id || idx} tarefa={tarefa} allTasks={allTasks} profiles={profiles} onSelect={setSelectedTarefa} onToggle={handleToggleTask} onUpdate={handleUpdateTaskField} isOverdue />
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Seção: Hoje */}
              <div>
                <button onClick={() => setShowDashHoje(!showDashHoje)} className="flex items-center gap-2 hover:opacity-80 transition-opacity mb-2 w-full">
                  <CalendarClock className="h-4 w-4 text-amber-500" />
                  <span className="text-sm font-semibold text-foreground">Hoje</span>
                  <span className="text-xs font-medium text-muted bg-card border border-border px-2 py-0.5 rounded-full">{stats?.tarefas.hoje.length || 0}</span>
                  <ChevronDown className={cn("h-3.5 w-3.5 text-muted ml-auto transition-transform", showDashHoje && "rotate-180")} />
                </button>
                {showDashHoje && (
                  (stats?.tarefas.hoje.length || 0) === 0 ? (
                    <p className="text-sm text-muted italic py-3 px-4">Nenhuma tarefa para hoje.</p>
                  ) : (
                    <div className="max-h-[340px] overflow-y-auto pr-1">
                      {stats?.tarefas.hoje.map((tarefa: any, idx: number) => (
                        <DashboardTaskCard key={tarefa.id || idx} tarefa={tarefa} allTasks={allTasks} profiles={profiles} onSelect={setSelectedTarefa} onToggle={handleToggleTask} onUpdate={handleUpdateTaskField} />
                      ))}
                    </div>
                  )
                )}
              </div>

              {/* Seção: Próximas */}
              <div>
                <button onClick={() => setShowDashProximas(!showDashProximas)} className="flex items-center gap-2 hover:opacity-80 transition-opacity mb-2 w-full">
                  <Clock className="h-4 w-4 text-muted" />
                  <span className="text-sm font-semibold text-foreground">Próximas e Sem Prazo</span>
                  <span className="text-xs font-medium text-muted bg-card border border-border px-2 py-0.5 rounded-full">{stats?.tarefas.proximas.length || 0}</span>
                  <ChevronDown className={cn("h-3.5 w-3.5 text-muted ml-auto transition-transform", showDashProximas && "rotate-180")} />
                </button>
                {showDashProximas && (
                  <div className="max-h-[340px] overflow-y-auto pr-1">
                    {stats?.tarefas.proximas.map((tarefa: any, idx: number) => (
                      <DashboardTaskCard key={tarefa.id || idx} tarefa={tarefa} allTasks={allTasks} profiles={profiles} onSelect={setSelectedTarefa} onToggle={handleToggleTask} onUpdate={handleUpdateTaskField} />
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Concluídas Hoje */}
            {concluidasHoje.length > 0 && (
              <div className="mt-6 space-y-3">
                <div className="flex items-center gap-2 text-green-600 mb-3">
                  <CheckCircle2 className="h-4 w-4" />
                  <span className="text-xs font-bold uppercase tracking-widest">Concluídas hoje ({concluidasHoje.length})</span>
                </div>
                {concluidasHoje.map((tarefa) => (
                  <div
                    key={tarefa.id}
                    onClick={() => setSelectedTarefa(tarefa)}
                    className="flex items-center gap-4 p-3 rounded-2xl border border-green-500/10 bg-green-500/5 hover:border-green-500/20 transition-all cursor-pointer"
                  >
                    <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-muted line-through truncate">{tarefa.titulo}</h4>
                    </div>
                    <span className="text-[9px] font-medium text-green-600 bg-green-500/10 px-2 py-0.5 rounded-full">✓ Feita</span>
                  </div>
                ))}
              </div>
            )}
            
            <div className="mt-8">
              <a href="/tarefas" className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl border border-border text-xs font-bold text-muted hover:text-foreground hover:bg-muted/5 transition-all">
                <ListIcon className="h-3.5 w-3.5" />
                Ver todas as tarefas
                <ChevronRight className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>
        </div>

        {/* NOTIFICATIONS - Bottom row (12/12) */}
        <div className="lg:col-span-12">
          <div className="bg-card border border-border rounded-[2rem] p-8 shadow-sm">
             <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center", unreadCount > 0 ? "bg-amber-500/20 animate-pulse" : "bg-blue-500/10")}>
                    {unreadCount > 0 ? (
                      <BellDot className="h-5 w-5 text-amber-500" />
                    ) : (
                      <Bell className="h-5 w-5 text-blue-500" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-foreground flex items-center gap-2">
                      Resumo de Notificações
                      {unreadCount > 0 && (
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-white animate-pulse">
                          {unreadCount}
                        </span>
                      )}
                    </h3>
                    <p className="text-xs text-muted">Acompanhe as últimas atualizações do seu ecossistema</p>
                  </div>
                </div>
                <a href="/notificacoes" className="text-sm font-medium text-blue-500 hover:underline">Ir para Notificações</a>
             </div>

             <div className="flex flex-col gap-3">
                {notifications.slice(0, 5).map((notif) => {
                  const creator = notif.profiles;
                  const initials = creator?.full_name ? creator.full_name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : null;

                  return (
                    <div 
                      key={notif.id}
                      onClick={() => { if (!notif.lida) markAsRead(notif.id); }}
                      className={cn(
                        "flex items-start gap-4 p-4 rounded-2xl border transition-colors cursor-pointer group relative overflow-hidden",
                        notif.lida ? "border-border bg-background/40 hover:bg-muted/30 hover:border-border/80" : "border-amber-500/40 bg-amber-500/5 hover:bg-amber-500/10 hover:border-amber-500/60"
                      )}
                    >
                      {!notif.lida && (
                        <div className="absolute top-0 left-0 w-1 h-full bg-amber-500 group-hover:w-1.5 transition-all" />
                      )}
                      
                      <div className="flex-shrink-0 mt-0.5 relative">
                        {creator?.avatar_url ? (
                          <img src={creator.avatar_url} alt={creator.full_name || ""} className="h-10 w-10 rounded-xl object-cover border border-border" />
                        ) : initials ? (
                          <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center font-bold text-xs", notif.lida ? "bg-blue-500/10 text-blue-600" : "bg-amber-500/10 text-amber-600")}>
                            {initials}
                          </div>
                        ) : (
                          <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center", notif.lida ? "bg-blue-500/10 text-blue-500" : "bg-amber-500/10 text-amber-500")}>
                            <Info className="h-5 w-5" />
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h4 className="font-medium text-foreground text-sm line-clamp-1">{notif.titulo}</h4>
                          <div className="flex items-center gap-2 text-[10px] text-muted whitespace-nowrap">
                            <span>{new Date(notif.created_at).toLocaleDateString('pt-BR')}</span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {new Date(notif.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                        <p className="text-xs text-muted line-clamp-1">{notif.descricao}</p>
                        {creator?.full_name && (
                          <div className="mt-2 flex items-center gap-1.5 text-[10px] font-medium text-muted">
                            <span className="px-2 py-0.5 rounded-md bg-muted/10 border border-border/50">De: {creator.full_name.split(' ')[0]}</span>
                          </div>
                        )}
                      </div>
                      
                      {!notif.lida && (
                        <span className="flex-shrink-0 self-center ml-2 text-[9px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-600 uppercase tracking-tighter">
                          Não lida
                        </span>
                      )}
                    </div>
                  );
                })}
                {notifications.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-sm text-muted">Você não tem notificações no momento.</p>
                  </div>
                )}
             </div>
          </div>
        </div>

      </div>

      {showUnreadModal && unreadCount > 0 && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl bg-card border border-border shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/20">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-amber-500/20 flex items-center justify-center animate-pulse">
                  <BellDot className="h-5 w-5 text-amber-500" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Notificações Não Lidas</h3>
                  <p className="text-xs text-muted">Você tem {unreadCount} {unreadCount === 1 ? 'notificação' : 'notificações'} aguardando.</p>
                </div>
              </div>
              <button onClick={() => setShowUnreadModal(false)} className="rounded-full p-2 hover:bg-muted transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-2">
              <div className="space-y-1">
                {notifications.filter(n => !n.lida).map(notif => {
                  const creator = notif.profiles;
                  const initials = creator?.full_name ? creator.full_name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : null;
                  
                  return (
                    <div key={notif.id} className="p-4 rounded-xl hover:bg-muted/50 transition-colors border border-transparent hover:border-border group flex gap-3">
                      <div className="flex-shrink-0 mt-0.5 relative">
                        {creator?.avatar_url ? (
                          <img src={creator.avatar_url} alt={creator.full_name || ""} className="h-8 w-8 rounded-full object-cover border border-border" />
                        ) : initials ? (
                          <div className="h-8 w-8 rounded-full bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold text-[10px]">
                            {initials}
                          </div>
                        ) : (
                          <div className="h-8 w-8 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center">
                            <Info className="h-4 w-4" />
                          </div>
                        )}
                        <div className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-amber-500 border-2 border-card" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="text-sm font-medium text-foreground">{notif.titulo}</h4>
                          <span className="text-[10px] text-muted whitespace-nowrap">{new Date(notif.created_at).toLocaleDateString('pt-BR')} às {new Date(notif.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <p className="text-xs text-muted mt-1 leading-relaxed">{notif.descricao}</p>
                        {creator?.full_name && (
                          <div className="mt-1 flex items-center gap-1 text-[10px] text-muted">
                            <span className="font-medium">De: {creator.full_name}</span>
                          </div>
                        )}
                        <button 
                          onClick={() => markAsRead(notif.id)}
                          className="mt-3 text-xs font-medium text-amber-600 hover:text-amber-700 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          Marcar como lida
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            
            <div className="p-4 border-t border-border bg-muted/10 flex justify-end gap-3">
              <button 
                onClick={() => setShowUnreadModal(false)}
                className="px-4 py-2 rounded-xl text-sm font-medium text-muted hover:text-foreground transition-colors"
              >
                Sair
              </button>
              <button 
                onClick={async () => { await markAllAsRead(); setShowUnreadModal(false); }}
                className="px-5 py-2 rounded-xl bg-amber-500 text-white text-sm font-medium hover:bg-amber-600 transition-colors shadow-sm"
              >
                Marcar todas como lidas
              </button>
            </div>
          </div>
        </div>
      )}

      {isModalOpen && (
        <NovoTarefaModal 
          profiles={profiles}
          onClose={() => setIsModalOpen(false)}
          onSuccess={() => {
            setIsModalOpen(false);
            loadStats();
          }}
        />
      )}

      {selectedTarefa && (
        <TaskDetailModal
          tarefa={selectedTarefa}
          profiles={profiles}
          onClose={() => setSelectedTarefa(null)}
          onEdit={() => { setSelectedTarefa(null); setIsModalOpen(true); }}
          onDelete={async (id) => {
            const { deleteTask } = await import("@/services/taskService");
            if (confirm("Excluir tarefa?")) { await deleteTask(id); setSelectedTarefa(null); loadStats(); }
          }}
          onStatusChange={async (status) => {
            setSelectedTarefa(prev => prev ? { ...prev, status } : null);
            await updateTaskStatus(selectedTarefa.id, status);
            loadStats();
          }}
          onUpdate={async (updates) => {
            setSelectedTarefa(prev => prev ? { ...prev, ...updates } : null);
            await updateTask(selectedTarefa.id, updates);
            loadStats();
          }}
        />
      )}
    </div>
  );
}

/* ── Dashboard Task Card ── */
function DashboardTaskCard({ tarefa, allTasks, profiles, onSelect, onToggle, onUpdate, isOverdue }: {
  tarefa: any;
  allTasks: DBTask[];
  profiles: DBProfile[];
  onSelect: (t: DBTask) => void;
  onToggle: (id: string, status: string) => void;
  onUpdate: (id: string, updates: any) => void;
  isOverdue?: boolean;
}) {
  const [optimisticStatus, setOptimisticStatus] = useState(tarefa.status);
  const [optimisticPrazo, setOptimisticPrazo] = useState(tarefa.prazo);
  const [optimisticResp, setOptimisticResp] = useState(tarefa.responsavel_id);
  const [optimisticPrio, setOptimisticPrio] = useState(tarefa.prioridade);

  useEffect(() => { setOptimisticStatus(tarefa.status); }, [tarefa.status]);
  useEffect(() => { setOptimisticPrazo(tarefa.prazo); }, [tarefa.prazo]);
  useEffect(() => { setOptimisticResp(tarefa.responsavel_id); }, [tarefa.responsavel_id]);
  useEffect(() => { setOptimisticPrio(tarefa.prioridade); }, [tarefa.prioridade]);

  const handleLocalUpdate = (field: string, val: any) => {
    if (field === 'status') setOptimisticStatus(val);
    if (field === 'prazo') setOptimisticPrazo(val);
    if (field === 'responsavel_id') setOptimisticResp(val);
    if (field === 'prioridade') setOptimisticPrio(val);
    
    if (field === 'status' && tarefa.__isSubtask) {
      onUpdate(tarefa.id, { status: val, concluida: val === 'concluido' });
    } else {
      onUpdate(tarefa.id, { [field]: val });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'concluido': return { label: 'Concluído', color: 'bg-green-500/10 text-green-600 border-green-500/20' };
      case 'progresso': return { label: 'Em Andamento', color: 'bg-blue-500/10 text-blue-600 border-blue-500/20' };
      case 'revisao': return { label: 'Revisão', color: 'bg-orange-500/10 text-orange-600 border-orange-500/20' };
      case 'aprovacao': return { label: 'Aprovação', color: 'bg-purple-500/10 text-purple-600 border-purple-500/20' };
      case 'fazer':
      default: return { label: 'Pendente', color: 'bg-slate-500/10 text-slate-600 border-slate-500/20' };
    }
  };

  const badge = getStatusBadge(optimisticStatus);

  return (
    <div 
      onClick={() => {
        if (tarefa.__isSubtask && tarefa.__parentId) {
          const parent = allTasks.find(t => t.id === tarefa.__parentId);
          if (parent) onSelect(parent);
          return;
        }
        const fullTask = allTasks.find(t => t.id === tarefa.id);
        if (fullTask) onSelect(fullTask);
      }}
      className={cn(
        "flex flex-col gap-2 p-3.5 rounded-2xl border transition-colors group cursor-pointer mb-2",
        "bg-background/50 hover:border-letitia-gold/20",
        isOverdue && "shadow-[0_0_12px_-3px_rgba(239,68,68,0.25)] border-red-500/20 hover:border-red-500/40 bg-red-500/[0.02]"
      )}
    >
      <div className="flex items-start gap-3">
        <button 
          onClick={(e) => { 
            e.stopPropagation(); 
            const newStatus = optimisticStatus === 'concluido' ? 'fazer' : 'concluido';
            handleLocalUpdate('status', newStatus);
            onToggle(tarefa.id, optimisticStatus);
          }}
          className="p-1 hover:bg-foreground/5 rounded-full transition-colors self-start mt-0.5"
        >
          {optimisticStatus === 'concluido' ? (
            <CheckCircle2 className="h-5 w-5 text-green-500" />
          ) : (
            <Circle className={cn("h-5 w-5", isOverdue ? "text-red-400 group-hover:text-red-500" : "text-muted group-hover:text-letitia-gold")} />
          )}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-2 flex-wrap pt-0.5">
            <div className="relative flex items-center" onClick={e => e.stopPropagation()}>
              <span className={cn(
                "flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-md uppercase tracking-widest flex-shrink-0 transition-colors border underline decoration-transparent hover:decoration-current underline-offset-2",
                badge.color
              )}>
                {badge.label}
                <ChevronDown className="h-2.5 w-2.5 opacity-70" />
              </span>
              <select 
                value={optimisticStatus}
                onChange={(e) => handleLocalUpdate('status', e.target.value)}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              >
                <option value="fazer">Fazer</option>
                <option value="progresso">Em andamento</option>
                <option value="aprovacao">Aprovação</option>
                <option value="revisao">Revisão</option>
                <option value="concluido">Concluído</option>
              </select>
            </div>
            
            {tarefa.__isSubtask && (
              <span className="flex-shrink-0 flex items-center gap-1 text-[8px] font-bold px-1.5 py-0.5 rounded-md bg-purple-500/10 text-purple-600 uppercase tracking-widest border border-purple-500/20">
                <ListIcon className="h-2 w-2" /> Subtarefa
              </span>
            )}

            <h4 className={cn("text-sm font-medium text-foreground leading-snug mt-0.5", optimisticStatus === 'concluido' && "line-through text-muted")}>
              {tarefa.titulo}
            </h4>

            {isOverdue && (
              <span className="flex-shrink-0 text-[8px] font-bold px-1.5 py-0.5 mt-0.5 rounded-full bg-red-500 text-white uppercase tracking-wider">
                Atrasada
              </span>
            )}
          </div>
          {tarefa.__isSubtask && tarefa.__parentTitle && (
            <div className="flex items-center gap-1 text-[10px] font-medium text-muted mt-1.5">
              <span className="opacity-50">↳</span> {tarefa.__parentTitle}
            </div>
          )}
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex items-center justify-between pl-9 mt-1 gap-2 flex-wrap">
        <div className="flex items-center gap-3">
          {/* Data */}
          <div className="relative flex items-center gap-1.5 text-[10px] text-muted hover:text-foreground transition-colors group/date" onClick={e => e.stopPropagation()}>
            <Calendar className="h-3.5 w-3.5" />
            <span className="font-medium underline decoration-muted/50 underline-offset-2 hover:decoration-foreground">
              {optimisticPrazo ? new Date(optimisticPrazo + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }) : 'Sem prazo'}
            </span>
            <input 
              type="date"
              value={optimisticPrazo || ''}
              onChange={(e) => handleLocalUpdate('prazo', e.target.value || null)}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            />
          </div>

          {/* Responsável */}
          <div className="relative flex items-center gap-1.5 text-[10px] text-muted hover:text-foreground transition-colors group/resp" onClick={e => e.stopPropagation()}>
            <div className="h-4 w-4 rounded-full bg-muted/20 border border-border flex items-center justify-center overflow-hidden">
              {optimisticResp ? (
                profiles.find(p => p.id === optimisticResp)?.avatar_url ? (
                  <img src={profiles.find(p => p.id === optimisticResp)?.avatar_url || undefined} className="h-full w-full object-cover" />
                ) : (
                  <span className="text-[8px] font-bold text-muted">{profiles.find(p => p.id === optimisticResp)?.full_name?.charAt(0) || '?'}</span>
                )
              ) : (
                <span className="text-[8px] font-bold text-muted">?</span>
              )}
            </div>
            <span className="font-medium truncate max-w-[80px] underline decoration-muted/50 underline-offset-2 hover:decoration-foreground">
              {optimisticResp ? profiles.find(p => p.id === optimisticResp)?.full_name?.split(' ')[0] : 'Sem resp.'}
            </span>
            <select 
              value={optimisticResp || ''}
              onChange={(e) => handleLocalUpdate('responsavel_id', e.target.value || null)}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            >
              <option value="">Sem responsável</option>
              {profiles.map(p => (
                <option key={p.id} value={p.id}>{p.full_name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Prioridade */}
          <div className="relative flex items-center" onClick={e => e.stopPropagation()}>
            <span className={cn(
              "text-[9px] font-bold px-2 py-0.5 rounded-md uppercase tracking-widest flex-shrink-0 transition-colors underline decoration-transparent hover:decoration-current underline-offset-2",
              optimisticPrio === 'urgente' ? "bg-red-500/10 text-red-500 hover:bg-red-500/20" :
              optimisticPrio === 'alta' ? "bg-orange-500/10 text-orange-500 hover:bg-orange-500/20" : "bg-letitia-gold/10 text-letitia-gold hover:bg-letitia-gold/20"
            )}>
              {optimisticPrio || 'Normal'}
            </span>
            {!tarefa.__isSubtask && (
              <select 
                value={optimisticPrio || 'normal'}
                onChange={(e) => handleLocalUpdate('prioridade', e.target.value)}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              >
                <option value="normal">Normal</option>
                <option value="alta">Alta</option>
                <option value="urgente">Urgente</option>
              </select>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
