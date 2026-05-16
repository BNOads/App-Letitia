import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getDashboardStats } from "@/services/dashboardService";
import { 
  Clock, 
  Loader2, ChevronRight, ChevronDown, Video, Camera,
  Calendar, Headset, Plus, List as ListIcon, CalendarDays, CalendarClock,
  Circle, CheckCircle2, Send, Repeat, ArrowRight, AlertCircle
} from "lucide-react";
import { cn } from "@/lib/utils";

import { createTask, updateTaskStatus, updateTask, getTasks, type DBTask } from "@/services/taskService";
import { getProfiles, type DBProfile } from "@/services/profileService";
import { notifyTaskCompleted } from "@/services/notificationService";
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
        prazo: new Date().toISOString().split('T')[0]
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
      await updateTaskStatus(id, newStatus as any);
      // Notify everyone when a task is completed from the dashboard
      if (newStatus === 'concluido' && user) {
        const tarefa = allTasks.find(t => t.id === id);
        if (tarefa) {
          const uName = profiles.find(p => p.id === user.id)?.full_name || 'Alguém';
          notifyTaskCompleted(tarefa.titulo, tarefa.id, user.id, uName);
        }
      }
      loadStats();
    } catch (error) {
      console.error("Erro ao alternar tarefa:", error);
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
                        <DashboardTaskCard key={tarefa.id || idx} tarefa={tarefa} allTasks={allTasks} onSelect={setSelectedTarefa} onToggle={handleToggleTask} isOverdue />
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
                        <DashboardTaskCard key={tarefa.id || idx} tarefa={tarefa} allTasks={allTasks} onSelect={setSelectedTarefa} onToggle={handleToggleTask} />
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
                      <DashboardTaskCard key={tarefa.id || idx} tarefa={tarefa} allTasks={allTasks} onSelect={setSelectedTarefa} onToggle={handleToggleTask} />
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

        {/* EDITORIAL - Bottom row (12/12) */}
        <div className="lg:col-span-12">
          <div className="bg-card border border-border rounded-[2rem] p-8 shadow-sm">
             <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                    <Camera className="h-5 w-5 text-purple-500" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-foreground">Editorial & Pautas</h3>
                    <p className="text-xs text-muted">Próximas publicações agendadas</p>
                  </div>
                </div>
                <a href="/conteudo" className="text-sm font-medium text-purple-500 hover:underline">Ir para Editorial</a>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {stats?.pautas.map((pauta) => (
                  <div 
                    key={pauta.id}
                    className="p-5 rounded-3xl border border-border bg-background/40 hover:border-purple-500/30 hover:-translate-y-1 transition-[border-color,transform] flex flex-col gap-4"
                  >
                    <div className="flex items-start justify-between">
                      <div className={cn("p-2 rounded-xl", pauta.formato === 'youtube' ? "bg-red-500/10 text-red-500" : "bg-pink-500/10 text-pink-500")}>
                        {pauta.formato === 'youtube' ? <Video className="h-5 w-5" /> : <Camera className="h-5 w-5" />}
                      </div>
                      <span className="text-[10px] font-bold text-muted uppercase tracking-widest">{pauta.plataforma}</span>
                    </div>
                    <h4 className="font-medium text-foreground text-sm line-clamp-2 min-h-[2.5rem]">{pauta.titulo}</h4>
                    <div className="flex items-center justify-between mt-auto pt-4 border-t border-border/50">
                      <div className="flex items-center gap-1.5 text-xs text-muted font-medium">
                        <Calendar className="h-3.5 w-3.5" />
                        {new Date(pauta.data_prevista).toLocaleDateString('pt-BR')}
                      </div>
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-600 uppercase tracking-tighter">
                        {pauta.pilar}
                      </span>
                    </div>
                  </div>
                ))}
             </div>
          </div>
        </div>

      </div>

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
            await updateTaskStatus(selectedTarefa.id, status);
            loadStats();
          }}
          onUpdate={async (updates) => {
            await updateTask(selectedTarefa.id, updates);
            loadStats();
          }}
        />
      )}
    </div>
  );
}

/* ── Dashboard Task Card ── */
function DashboardTaskCard({ tarefa, allTasks, onSelect, onToggle, isOverdue }: {
  tarefa: any;
  allTasks: DBTask[];
  onSelect: (t: DBTask) => void;
  onToggle: (id: string, status: string) => void;
  isOverdue?: boolean;
}) {
  return (
    <div 
      onClick={() => {
        const fullTask = allTasks.find(t => t.id === tarefa.id);
        if (fullTask) onSelect(fullTask);
      }}
      className={cn(
        "flex items-center gap-4 p-4 rounded-2xl border transition-colors group cursor-pointer mb-2",
        isOverdue
          ? "border-red-500/20 bg-red-500/[0.03] shadow-[0_0_12px_-3px_rgba(239,68,68,0.25)] hover:border-red-500/40"
          : "border-border bg-background/50 hover:border-letitia-gold/20"
      )}
    >
      <button 
        onClick={(e) => { e.stopPropagation(); onToggle(tarefa.id, tarefa.status); }}
        className="p-1 hover:bg-foreground/5 rounded-full transition-colors"
      >
        {tarefa.status === 'concluido' ? (
          <CheckCircle2 className="h-5 w-5 text-green-500" />
        ) : (
          <Circle className={cn("h-5 w-5", isOverdue ? "text-red-400 group-hover:text-red-500" : "text-muted group-hover:text-letitia-gold")} />
        )}
      </button>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h4 className={cn("text-sm font-medium text-foreground truncate", tarefa.status === 'concluido' && "line-through text-muted")}>
            {tarefa.titulo}
          </h4>
          {isOverdue && (
            <span className="flex-shrink-0 text-[8px] font-bold px-1.5 py-0.5 rounded-full bg-red-500 text-white uppercase tracking-wider">
              Atrasada
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 mt-1">
          <div className={cn("flex items-center gap-1 text-[10px]", isOverdue ? "text-red-500 font-medium" : "text-muted")}>
            <Calendar className="h-3 w-3" />
            {tarefa.prazo ? new Date(tarefa.prazo + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }) : 'Sem prazo'}
          </div>
        </div>
      </div>
      <span className={cn(
        "text-[8px] font-bold px-2 py-1 rounded-lg uppercase tracking-widest",
        tarefa.prioridade === 'urgente' ? "bg-red-500/10 text-red-500" :
        tarefa.prioridade === 'alta' ? "bg-orange-500/10 text-orange-500" : "bg-letitia-gold/10 text-letitia-gold"
      )}>
        {tarefa.prioridade}
      </span>
    </div>
  );
}
