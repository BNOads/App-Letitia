import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getDashboardStats } from "@/services/dashboardService";
import { 
  FileText, Clock, 
  Loader2, ChevronRight, Video, Camera,
  Calendar, Headset, Plus, List as ListIcon, CalendarDays,
  Circle, CheckCircle2, Send
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { createTask, updateTaskStatus } from "@/services/taskService";
import { getProfiles, type DBProfile } from "@/services/profileService";
import { NovoTarefaModal } from "./Tarefas";

type Stats = {
  totalVendas: number;
  tarefas: {
    total: number;
    concluidas: number;
    proximas: any[];
  };
  eventos: any[];
  ticketsAbertos: number;
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

  const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || "Letícia";
  const hour = new Date().getHours();
  const saudacao = hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite";

  const loadStats = async () => {
    try {
      const [statsData, profilesData] = await Promise.all([
        getDashboardStats(),
        getProfiles()
      ]);
      setStats(statsData);
      setProfiles(profilesData);
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
        titulo: quickTask,
        descricao: "",
        status: 'a_fazer',
        prioridade: 'normal',
        responsavel_id: user.id,
        prazo: new Date().toISOString().split('T')[0]
      });
      setQuickTask("");
      await loadStats();
    } catch (error) {
      console.error("Erro ao criar tarefa rápida:", error);
      alert("Erro ao criar tarefa. Tente novamente.");
    } finally {
      setAddingTask(false);
    }
  };

  const handleToggleTask = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'concluido' ? 'a_fazer' : 'concluido';
    try {
      await updateTaskStatus(id, newStatus as any);
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

  return (
    <div className="space-y-8 pb-10">
      <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <motion.h2 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-serif text-4xl font-medium tracking-tight text-foreground"
          >
            {saudacao}, {userName}
          </motion.h2>
          <p className="mt-1.5 text-muted text-sm">Aqui está o panorama geral do seu ecossistema hoje.</p>
        </div>
        
        {/* Ticket Counter Shortcut */}
        <motion.a 
          href="/suporte"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex items-center gap-4 bg-red-500/5 border border-red-500/20 px-6 py-3 rounded-2xl cursor-pointer hover:bg-red-500/10 transition-colors"
        >
          <Headset className="h-6 w-6 text-red-500" />
          <div className="flex flex-col">
            <span className="text-2xl font-bold text-red-600 leading-none">{stats?.ticketsAbertos}</span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-red-500/70">Tickets em Aberto</span>
          </div>
        </motion.a>
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
                stats?.eventos.map((evento, idx) => (
                  <motion.div 
                    key={evento.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="flex items-center gap-4 p-4 rounded-2xl bg-letitia-gold/[0.03] border border-letitia-gold/5 group/item hover:border-letitia-gold/20 hover:bg-letitia-gold/[0.05] transition-all cursor-pointer"
                  >
                    <div className="w-1 bg-letitia-gold rounded-full self-stretch" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-foreground">{evento.titulo}</h4>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 uppercase">
                          {evento.tipo}
                        </span>
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
                  </motion.div>
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
                <button className="p-2 border border-border rounded-xl text-muted hover:text-foreground">
                  <FileText className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="space-y-2 mb-8">
              <div className="flex justify-between text-xs font-bold uppercase tracking-wider mb-2">
                <span className="text-muted">Progresso geral</span>
                <span className="text-letitia-gold">{progressoGeral}%</span>
              </div>
              <div className="h-2 w-full bg-letitia-gold/10 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${progressoGeral}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className="h-full bg-letitia-gold"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2 text-letitia-gold mb-4">
                <ChevronRight className="h-4 w-4 rotate-90" />
                <Clock className="h-4 w-4" />
                <span className="text-xs font-bold uppercase tracking-widest">Próximas ({stats?.tarefas.proximas.length})</span>
              </div>

              {/* Input de Criação Rápida */}
              <form onSubmit={handleQuickTask} className="relative mb-6">
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

              <AnimatePresence>
                {stats?.tarefas.proximas.map((tarefa, idx) => (
                  <motion.div 
                    key={tarefa.id || idx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: idx * 0.05 }}
                    className="flex items-center gap-4 p-4 rounded-2xl border border-border bg-background/50 hover:border-letitia-gold/20 transition-all group"
                  >
                    <button 
                      onClick={() => handleToggleTask(tarefa.id, tarefa.status)}
                      className="p-1 hover:bg-foreground/5 rounded-full transition-colors"
                    >
                      {tarefa.status === 'concluido' ? (
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                      ) : (
                        <Circle className="h-5 w-5 text-muted group-hover:text-letitia-gold" />
                      )}
                    </button>
                    <div className="flex-1 min-w-0">
                      <h4 className={cn("text-sm font-medium text-foreground truncate", tarefa.status === 'concluido' && "line-through text-muted")}>
                        {tarefa.titulo}
                      </h4>
                      <div className="flex items-center gap-3 mt-1">
                         <div className="flex items-center gap-1 text-[10px] text-muted">
                           <Calendar className="h-3 w-3" />
                           {tarefa.prazo ? new Date(tarefa.prazo).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }) : 'Sem prazo'}
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
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
            
            <div className="mt-8">
              <a href="/tarefas" className="flex items-center justify-center w-full py-3 rounded-2xl border border-border text-xs font-bold text-muted hover:text-foreground hover:bg-muted/5 transition-all">
                Ver todas as tarefas
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
                  <motion.div 
                    key={pauta.id}
                    whileHover={{ y: -5 }}
                    className="p-5 rounded-3xl border border-border bg-background/40 hover:border-purple-500/30 transition-all flex flex-col gap-4"
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
                  </motion.div>
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
    </div>
  );
}
