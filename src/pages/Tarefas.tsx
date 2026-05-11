import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getTasks, updateTaskStatus, createTask, updateTask, deleteTask, getTaskComments, addTaskComment, deleteTaskComment, type DBTask, type TaskStatus, type TaskPriority, type TaskComment } from "@/services/taskService";
import { getProfiles, type DBProfile } from "@/services/profileService";
import { prioridadeColors } from "@/data/mockData";
import { 
  Plus, Search, ChevronDown, ChevronUp, Clock, AlertCircle, CheckCircle2, 
  CalendarClock, Square, CheckSquare2, LayoutGrid, List, Loader2, X, 
  Share2, Trash2, History, MessageSquare, Send, User, Calendar, Edit3, Copy, Check
} from "lucide-react";
import { cn } from "@/lib/utils";
import { UserSelector } from "@/components/UserSelector";

type ViewMode = "lista" | "kanban";
type TabFilter = "minhas" | "time";

const kanbanColumns = [
  { id: "fazer" as const, label: "A Fazer", color: "border-t-gray-400" },
  { id: "progresso" as const, label: "Em Progresso", color: "border-t-blue-400" },
  { id: "revisao" as const, label: "Revisão", color: "border-t-amber-400" },
  { id: "concluido" as const, label: "Concluído", color: "border-t-green-400" },
];

export function Tarefas() {
  const { user, loading: authLoading } = useAuth();
  const [tarefas, setTarefas] = useState<DBTask[]>([]);
  const [profiles, setProfiles] = useState<DBProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<ViewMode>("lista");
  const [tab, setTab] = useState<TabFilter>("minhas");
  const [busca, setBusca] = useState("");
  const [showConcluidas, setShowConcluidas] = useState(true);
  const [showAtrasadas, setShowAtrasadas] = useState(true);
  const [showHoje, setShowHoje] = useState(true);
  const [showProximas, setShowProximas] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTarefa, setEditingTarefa] = useState<DBTask | null>(null);
  const [selectedTarefa, setSelectedTarefa] = useState<DBTask | null>(null);

  const hoje = new Date().toISOString().split("T")[0];

  useEffect(() => {
    if (!authLoading && user) {
      fetchData();
    }
  }, [user, authLoading]);

  async function fetchData() {
    try {
      const [tasksData, profilesData] = await Promise.all([
        getTasks(), 
        getProfiles()
      ]);
      setTarefas(tasksData);
      setProfiles(profilesData);
    } catch (error) {
      console.error("Erro ao buscar dados:", error);
    } finally {
      setLoading(false);
    }
  }

  const fetchTarefas = async () => {
    try {
      const data = await getTasks();
      setTarefas(data);
      if (selectedTarefa) {
        const updated = data.find(t => t.id === selectedTarefa.id);
        if (updated) setSelectedTarefa(updated);
      }
    } catch (error) {
      console.error("Erro ao buscar tarefas:", error);
    }
  };

  const filtradas = tarefas.filter((t) => {
    const matchBusca = t.titulo.toLowerCase().includes(busca.toLowerCase()) ||
                       t.profiles?.full_name?.toLowerCase().includes(busca.toLowerCase()) || false;
    
    if (tab === "minhas") {
      return matchBusca && t.responsavel_id === user?.id;
    }
    return matchBusca;
  });

  const pendentes = filtradas.filter((t) => t.status !== "concluido");
  const concluidas = filtradas.filter((t) => t.status === "concluido");
  const atrasadas = pendentes.filter((t) => t.prazo && t.prazo < hoje);
  const paraHoje = pendentes.filter((t) => t.prazo === hoje);
  const proximas = pendentes.filter((t) => !t.prazo || t.prazo > hoje);
  const altaPrioridade = pendentes.filter((t) => t.prioridade === "alta" || t.prioridade === "urgente");

  const totalTarefas = filtradas.length;
  const progresso = totalTarefas > 0 ? Math.round((concluidas.length / totalTarefas) * 100) : 0;

  const toggleConcluida = async (id: string, currentStatus: TaskStatus) => {
    const newStatus: TaskStatus = currentStatus === "concluido" ? "fazer" : "concluido";
    setTarefas(prev => prev.map(t => t.id === id ? { ...t, status: newStatus } : t));
    try {
      await updateTaskStatus(id, newStatus);
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
      fetchTarefas();
    }
  };

  const handleDeleteTask = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta tarefa?")) return;
    try {
      await deleteTask(id);
      setSelectedTarefa(null);
      fetchTarefas();
    } catch (error) {
      console.error("Erro ao excluir tarefa:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-letitia-gold" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="font-serif text-3xl font-medium tracking-tight text-foreground">Tarefas</h2>
          <p className="mt-1 text-sm text-muted">Gerencie suas atividades e do seu time.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-all flex items-center gap-2 self-start"
        >
          <Plus className="h-4 w-4" /> Nova Tarefa
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-center justify-between border-b border-border pb-4">
        <div className="flex items-center gap-1 bg-card border border-border rounded-lg p-1">
          <button onClick={() => setTab("minhas")} className={cn("px-4 py-1.5 rounded-md text-sm font-medium transition-all", tab === "minhas" ? "bg-primary text-primary-foreground" : "text-muted hover:text-foreground")}>
            Minhas Tarefas
          </button>
          <button onClick={() => setTab("time")} className={cn("px-4 py-1.5 rounded-md text-sm font-medium transition-all", tab === "time" ? "bg-primary text-primary-foreground" : "text-muted hover:text-foreground")}>
            Time
          </button>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
            <input
              type="text"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="rounded-md border border-border bg-card pl-9 pr-3 py-2 text-sm text-foreground placeholder:text-muted focus:ring-2 focus:ring-letitia-gold focus:outline-none w-48"
              placeholder="Buscar tarefas..."
            />
          </div>

          <div className="flex items-center gap-0.5 bg-card border border-border rounded-md p-0.5">
            <button onClick={() => setView("lista")} className={cn("p-1.5 rounded text-sm transition-all", view === "lista" ? "bg-primary text-primary-foreground" : "text-muted hover:text-foreground")}>
              <List className="h-4 w-4" />
            </button>
            <button onClick={() => setView("kanban")} className={cn("p-1.5 rounded text-sm transition-all", view === "kanban" ? "bg-primary text-primary-foreground" : "text-muted hover:text-foreground")}>
              <LayoutGrid className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <KPIBox icon={<Clock className="h-4 w-4 text-muted" />} label="Pendentes" value={pendentes.length} />
        <KPIBox icon={<CheckCircle2 className="h-4 w-4 text-green-500" />} label="Concluídas" value={concluidas.length} />
        <KPIBox icon={<AlertCircle className="h-4 w-4 text-red-500" />} label="Atrasadas" value={atrasadas.length} color="text-red-500" />
        <KPIBox icon={<CalendarClock className="h-4 w-4 text-amber-500" />} label="Alta prioridade" value={altaPrioridade.length} />
      </div>

      {tab === "time" ? (
        <TeamView
          tarefas={filtradas}
          profiles={profiles}
          view={view}
          hoje={hoje}
          onTaskClick={setSelectedTarefa}
          onTaskEdit={setEditingTarefa}
          onTaskDelete={handleDeleteTask}
          onToggle={toggleConcluida}
          onNewTask={(profileId) => {
            setIsModalOpen(true);
          }}
          busca={busca}
        />
      ) : view === "lista" ? (
        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-foreground">Progresso geral</span>
              <span className="text-sm font-semibold text-letitia-sage">{progresso}%</span>
            </div>
            <div className="h-2 w-full rounded-full bg-border overflow-hidden">
              <div className="h-full bg-letitia-sage rounded-full transition-all duration-500" style={{ width: `${progresso}%` }} />
            </div>
          </div>

          {atrasadas.length > 0 && (
            <TaskSection
              label="Em atraso"
              count={atrasadas.length}
              icon={<AlertCircle className="h-4 w-4 text-red-500" />}
              color="text-red-500"
              open={showAtrasadas}
              onToggle={() => setShowAtrasadas(!showAtrasadas)}
            >
              {atrasadas.map((t) => (
                <TaskRow key={t.id} tarefa={t} onClick={() => setSelectedTarefa(t)} onToggle={() => toggleConcluida(t.id, t.status)} onEdit={setEditingTarefa} onDelete={handleDeleteTask} isOverdue />
              ))}
            </TaskSection>
          )}

          <TaskSection
            label="Hoje"
            count={paraHoje.length}
            icon={<CalendarClock className="h-4 w-4 text-amber-500" />}
            color="text-foreground"
            open={showHoje}
            onToggle={() => setShowHoje(!showHoje)}
          >
            {paraHoje.length === 0 ? (
              <p className="text-sm text-muted italic py-3 px-4">Nenhuma tarefa para hoje.</p>
            ) : (
              paraHoje.map((t) => <TaskRow key={t.id} tarefa={t} onClick={() => setSelectedTarefa(t)} onToggle={() => toggleConcluida(t.id, t.status)} onEdit={setEditingTarefa} onDelete={handleDeleteTask} />)
            )}
          </TaskSection>

          <TaskSection
            label="Próximas e Sem Prazo"
            count={proximas.length}
            icon={<Clock className="h-4 w-4 text-muted" />}
            color="text-foreground"
            open={showProximas}
            onToggle={() => setShowProximas(!showProximas)}
          >
            {proximas.map((t) => <TaskRow key={t.id} tarefa={t} onClick={() => setSelectedTarefa(t)} onToggle={() => toggleConcluida(t.id, t.status)} onEdit={setEditingTarefa} onDelete={handleDeleteTask} />)}
          </TaskSection>

          <TaskSection
            label={`Concluídas`}
            count={concluidas.length}
            icon={<CheckCircle2 className="h-4 w-4 text-green-500" />}
            color="text-green-500"
            open={showConcluidas}
            onToggle={() => setShowConcluidas(!showConcluidas)}
          >
            {concluidas.map((t) => <TaskRow key={t.id} tarefa={t} onClick={() => setSelectedTarefa(t)} onToggle={() => toggleConcluida(t.id, t.status)} onEdit={setEditingTarefa} onDelete={handleDeleteTask} isDone />)}
          </TaskSection>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {kanbanColumns.map((col) => {
            const colTarefas = filtradas.filter((t) => t.status === col.id);
            return (
              <div key={col.id} className="flex flex-col">
                <div className={cn("rounded-t-lg border-t-2 bg-card border border-border px-4 py-3 flex items-center justify-between", col.color)}>
                  <h3 className="text-sm font-semibold text-foreground">{col.label}</h3>
                  <span className="text-xs font-medium text-muted bg-background px-2 py-0.5 rounded-full">{colTarefas.length}</span>
                </div>
                <div className="flex-1 bg-background/30 border border-t-0 border-border rounded-b-lg p-2 space-y-2 min-h-[200px]">
                  {colTarefas.map((t) => (
                    <KanbanCard key={t.id} tarefa={t} onClick={() => setSelectedTarefa(t)} onEdit={setEditingTarefa} onDelete={handleDeleteTask} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {(isModalOpen || editingTarefa) && (
        <NovoTarefaModal 
          onClose={() => { setIsModalOpen(false); setEditingTarefa(null); }} 
          onSuccess={() => { setIsModalOpen(false); setEditingTarefa(null); fetchTarefas(); }} 
          tarefa={editingTarefa}
          profiles={profiles}
        />
      )}

      {selectedTarefa && (
        <TaskDetailModal
          tarefa={selectedTarefa}
          profiles={profiles}
          onClose={() => setSelectedTarefa(null)}
          onEdit={(t) => { setSelectedTarefa(null); setEditingTarefa(t); }}
          onDelete={handleDeleteTask}
          onStatusChange={async (status) => {
            await updateTaskStatus(selectedTarefa.id, status);
            fetchTarefas();
          }}
          onUpdate={async (updates) => {
            await updateTask(selectedTarefa.id, updates);
            fetchTarefas();
          }}
        />
      )}
    </div>
  );
}

/* ─── Modals ────────────────────────────────────────────── */

function TaskDetailModal({ tarefa, profiles: _profiles, onClose, onEdit, onDelete, onStatusChange }: {
  tarefa: DBTask;
  profiles: DBProfile[];
  onClose: () => void;
  onEdit: (t: DBTask) => void;
  onDelete: (id: string) => void;
  onStatusChange: (status: TaskStatus) => Promise<void>;
}) {
  const prior = prioridadeColors[tarefa.prioridade] || prioridadeColors.normal;
  
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-2 sm:p-4 md:p-8" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="relative w-full max-w-6xl max-h-[95vh] md:max-h-[90vh] bg-background border border-border rounded-2xl shadow-2xl flex flex-col md:flex-row overflow-hidden animate-in fade-in zoom-in duration-300">
        
        {/* Botão Fixo de Fechar — sempre visível */}
        <button 
          onClick={onClose} 
          className="absolute top-3 right-3 z-10 h-10 w-10 flex items-center justify-center rounded-full bg-foreground/10 hover:bg-foreground/20 backdrop-blur-md border border-border/50 transition-all shadow-lg"
          title="Fechar"
        >
          <X className="h-5 w-5 text-foreground" />
        </button>

        {/* Coluna Esquerda: Informações Principais */}
        <div className="flex-1 flex flex-col overflow-y-auto md:border-r border-border bg-card/30 min-h-0">
          <div className="p-5 sm:p-6 md:p-8 space-y-6 md:space-y-8 pr-14 md:pr-8">
            {/* Header com breadcrumb e ações */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted">
                <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                <span>Administrativo</span>
                <span className="opacity-30">/</span>
                <span>Tarefa</span>
                <span className="bg-foreground/5 px-1.5 py-0.5 rounded text-[8px]">{tarefa.id.substring(0, 8)}</span>
              </div>
              <div className="flex items-center gap-1 sm:gap-2">
                <button onClick={() => onEdit(tarefa)} className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 rounded-md hover:bg-foreground/5 text-xs font-medium text-muted transition-colors">
                  <Share2 className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Compartilhar</span>
                </button>
                <button onClick={() => onDelete(tarefa.id)} className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 rounded-md hover:bg-red-500/10 text-xs font-medium text-red-500 transition-colors">
                  <Trash2 className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Excluir</span>
                </button>
              </div>
            </div>

            {/* Título */}
            <h1 className="text-2xl sm:text-3xl font-serif font-medium leading-tight text-foreground">{tarefa.titulo}</h1>

            {/* Grid de Propriedades */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-y-5 gap-x-6 md:gap-x-12 md:gap-y-6">
              <Property label="Status">
                <select 
                  value={tarefa.status} 
                  onChange={(e) => onStatusChange(e.target.value as TaskStatus)}
                  className="bg-foreground/5 hover:bg-foreground/10 px-3 py-1 rounded text-xs font-bold uppercase tracking-tight focus:outline-none transition-colors border-none cursor-pointer"
                >
                  <option value="fazer">A Fazer</option>
                  <option value="progresso">Em Progresso</option>
                  <option value="revisao">Revisão</option>
                  <option value="concluido">Concluído</option>
                </select>
              </Property>
              
              <Property label="Responsável">
                <div className="flex items-center gap-2 bg-foreground/5 hover:bg-foreground/10 px-2 py-1 rounded cursor-pointer transition-colors">
                  <div className="h-5 w-5 rounded-full bg-letitia-gold/20 flex items-center justify-center text-[8px] font-bold text-letitia-gold border border-letitia-gold/30">
                    {tarefa.profiles?.full_name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || "??"}
                  </div>
                  <span className="text-xs font-medium truncate max-w-[100px] sm:max-w-none">{tarefa.profiles?.full_name || "Sem atribuição"}</span>
                  <ChevronDown className="h-3 w-3 text-muted flex-shrink-0" />
                </div>
              </Property>

              <Property label="Prioridade">
                <span className={cn("text-[10px] font-bold uppercase px-3 py-1 rounded transition-colors", prior.bg, prior.text)}>
                  {prior.label}
                </span>
              </Property>

              <Property label="Datas">
                <div className="flex items-center gap-2 text-xs font-medium text-foreground">
                  <Calendar className="h-3.5 w-3.5 text-muted flex-shrink-0" />
                  <span className="truncate">{tarefa.prazo ? new Date(tarefa.prazo + 'T00:00:00').toLocaleDateString("pt-BR", { day: 'numeric', month: 'long', year: 'numeric' }) : "Sem prazo definido"}</span>
                </div>
              </Property>

              <Property label="Criado em">
                <span className="text-xs font-medium text-muted">
                  {new Date(tarefa.created_at).toLocaleDateString("pt-BR", { day: 'numeric', month: 'long' })}
                </span>
              </Property>
            </div>

            {/* Descrição */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted">
                <List className="h-3.5 w-3.5" /> Descrição
              </div>
              <div className="min-h-[80px] md:min-h-[120px] p-4 md:p-6 rounded-xl border border-border bg-background/50 text-sm text-foreground/80 leading-relaxed">
                {tarefa.descricao || <span className="italic opacity-50">Nenhuma descrição anexada. Clique para adicionar.</span>}
              </div>
            </div>

            {/* Subtarefas (Placeholder) */}
            <div className="space-y-4 pt-4 border-t border-border/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted">
                  Subtarefas <span className="bg-foreground/5 px-1.5 rounded ml-1">0</span>
                </div>
              </div>
              <button className="flex items-center gap-2 text-xs font-medium text-muted hover:text-foreground transition-colors px-2 py-1 rounded hover:bg-foreground/5">
                <Plus className="h-3.5 w-3.5" /> Adicionar Subtarefa
              </button>
            </div>
          </div>
        </div>

        {/* Coluna Direita: Atividade e Comentários */}
        <div className="w-full md:w-80 lg:w-96 flex flex-col bg-background border-t md:border-t-0 border-border min-h-0 max-h-[50vh] md:max-h-none">
          {/* Tabs Atividade/Comentários */}
          <div className="flex border-b border-border flex-shrink-0">
            <button className="flex-1 py-3 md:py-4 text-[10px] font-bold uppercase tracking-widest border-b-2 border-primary text-foreground">Atividade</button>
            <button className="flex-1 py-3 md:py-4 text-[10px] font-bold uppercase tracking-widest text-muted hover:text-foreground transition-colors">Comentários</button>
          </div>

          <div className="flex-1 flex flex-col overflow-hidden min-h-0">
            {/* Histórico */}
            <div className="flex-1 p-4 md:p-6 overflow-y-auto space-y-6">
              <section>
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted mb-4 flex items-center gap-2">
                  <History className="h-3 w-3" /> Histórico de Atividades
                </h4>
                <div className="space-y-4">
                  <ActivityItem 
                    user={tarefa.profiles?.full_name || "Sistema"} 
                    action="criou a tarefa" 
                    date={new Date(tarefa.created_at).toLocaleString("pt-BR", { day: '2-digit', month: 'long', hour: '2-digit', minute: '2-digit' })} 
                  />
                  {tarefa.updated_at !== tarefa.created_at && (
                    <ActivityItem 
                      user={tarefa.profiles?.full_name || "Sistema"} 
                      action="atualizou a tarefa" 
                      date={new Date(tarefa.updated_at).toLocaleString("pt-BR", { day: '2-digit', month: 'long', hour: '2-digit', minute: '2-digit' })} 
                    />
                  )}
                </div>
              </section>

              <section>
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted mb-4 flex items-center gap-2">
                  <MessageSquare className="h-3 w-3" /> Comentários
                </h4>
                <div className="flex flex-col items-center justify-center py-8 md:py-12 text-center">
                  <div className="h-12 w-12 rounded-full bg-foreground/5 flex items-center justify-center mb-3">
                    <MessageSquare className="h-6 w-6 text-muted/30" />
                  </div>
                  <p className="text-xs text-muted">Nenhum comentário ainda.</p>
                </div>
              </section>
            </div>

            {/* Input de Comentário */}
            <div className="p-3 md:p-4 border-t border-border bg-card/20 flex-shrink-0">
              <div className="relative">
                <textarea 
                  placeholder="Escreva um comentário..."
                  className="w-full bg-background border border-border rounded-xl px-4 py-3 text-xs focus:ring-2 focus:ring-primary focus:outline-none min-h-[80px] md:min-h-[100px] resize-none pr-12"
                />
                <button className="absolute bottom-3 right-3 h-8 w-8 flex items-center justify-center rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity">
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Property({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-[10px] font-bold uppercase tracking-widest text-muted flex items-center gap-1.5">
        <span className="h-1 w-1 rounded-full bg-muted/40"></span>
        {label}
      </label>
      <div className="flex items-center">{children}</div>
    </div>
  );
}

function ActivityItem({ user, action, date }: { user: string; action: string; date: string }) {
  return (
    <div className="flex gap-3">
      <div className="flex-shrink-0 h-6 w-6 rounded-full bg-foreground/5 flex items-center justify-center">
        <User className="h-3 w-3 text-muted" />
      </div>
      <div>
        <p className="text-xs leading-snug">
          <span className="font-semibold text-foreground">{user}</span> {action}
        </p>
        <p className="text-[10px] text-muted mt-0.5">{date}</p>
      </div>
    </div>
  );
}

export function NovoTarefaModal({ profiles, onClose, onSuccess, tarefa }: { 
  profiles: DBProfile[]; 
  onClose: () => void; 
  onSuccess: () => void;
  tarefa?: DBTask | null;
}) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    titulo: tarefa?.titulo || "",
    descricao: tarefa?.descricao || "",
    prioridade: (tarefa?.prioridade as TaskPriority) || "normal",
    status: (tarefa?.status as TaskStatus) || "fazer",
    responsavel_id: tarefa?.responsavel_id || user?.id || "",
    prazo: tarefa?.prazo || ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const taskData = {
      ...formData,
      responsavel_id: formData.responsavel_id || null,
      prazo: formData.prazo || null
    };

    try {
      if (tarefa) {
        await updateTask(tarefa.id, taskData);
      } else {
        await createTask(taskData);
      }
      onSuccess();
    } catch (error) {
      console.error("Erro ao salvar tarefa:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-serif text-2xl font-medium text-foreground">{tarefa ? "Editar Tarefa" : "Nova Tarefa"}</h3>
          <button onClick={onClose} className="rounded-full p-1 hover:bg-foreground/10 transition-colors">
            <X className="h-5 w-5 text-muted" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1.5">Título</label>
            <input
              required
              value={formData.titulo}
              onChange={e => setFormData({ ...formData, titulo: e.target.value })}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:ring-2 focus:ring-letitia-gold focus:outline-none"
              placeholder="O que precisa ser feito?"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1.5">Descrição</label>
            <textarea
              value={formData.descricao}
              onChange={e => setFormData({ ...formData, descricao: e.target.value })}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:ring-2 focus:ring-letitia-gold focus:outline-none min-h-[100px]"
              placeholder="Detalhes da tarefa..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1.5">Prioridade</label>
              <select
                value={formData.prioridade}
                onChange={e => setFormData({ ...formData, prioridade: e.target.value as TaskPriority })}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:ring-2 focus:ring-letitia-gold focus:outline-none"
              >
                <option value="baixa">Baixa</option>
                <option value="normal">Normal</option>
                <option value="alta">Alta</option>
                <option value="urgente">Urgente</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1.5">Prazo</label>
              <input
                type="date"
                value={formData.prazo}
                onChange={e => setFormData({ ...formData, prazo: e.target.value })}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:ring-2 focus:ring-letitia-gold focus:outline-none"
              />
            </div>
          </div>

          <UserSelector
            label="Responsável"
            users={profiles}
            selectedIds={formData.responsavel_id || ""}
            onSelect={(id) => setFormData({ ...formData, responsavel_id: id as string })}
          />

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-border px-4 py-2 text-sm font-medium text-muted hover:text-foreground transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-md bg-primary px-6 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-all flex items-center gap-2"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              {tarefa ? "Salvar Alterações" : "Criar Tarefa"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─── Sub-components ──────────────────────────────────────── */

function KPIBox({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number; color?: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center gap-2 mb-1">{icon}<span className="text-[11px] font-semibold uppercase tracking-wider text-muted">{label}</span></div>
      <p className={cn("font-serif text-3xl font-medium", color || "text-foreground")}>{value}</p>
    </div>
  );
}

function TaskSection({ label, count, icon, color, open, onToggle, children }: {
  label: string; count: number; icon: React.ReactNode; color: string;
  open: boolean; onToggle: () => void; children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <button onClick={onToggle} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          {icon}
          <span className={cn("text-sm font-semibold", color)}>{label}</span>
          <span className="text-xs font-medium text-muted bg-card border border-border px-2 py-0.5 rounded-full">{count}</span>
          {open ? <ChevronUp className="h-3.5 w-3.5 text-muted" /> : <ChevronDown className="h-3.5 w-3.5 text-muted" />}
        </button>
      </div>
      {open && <div className="space-y-1">{children}</div>}
    </div>
  );
}

function TaskRow({ tarefa, onClick, onToggle, onEdit, onDelete, isOverdue, isDone }: {
  tarefa: DBTask; onClick: () => void; onToggle: () => void; onEdit: (t: DBTask) => void; onDelete: (id: string) => void; isOverdue?: boolean; isDone?: boolean;
}) {
  const prior = prioridadeColors[tarefa.prioridade as keyof typeof prioridadeColors] || prioridadeColors.normal;
  const iniciais = tarefa.profiles?.full_name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || "??";

  return (
    <div 
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 px-4 py-3 rounded-lg border transition-all cursor-pointer hover:shadow-sm group",
        isOverdue ? "border-red-500/30 bg-red-500/5" :
        isDone ? "border-green-500/20 bg-green-500/5" :
        "border-border bg-card hover:border-letitia-gold/30"
      )}
    >
      <button
        onClick={(e) => { e.stopPropagation(); onToggle(); }}
        className="flex-shrink-0"
      >
        {isDone ? (
          <CheckSquare2 className="h-5 w-5 text-green-500" />
        ) : (
          <Square className={cn("h-5 w-5", isOverdue ? "text-red-400" : "text-border group-hover:text-muted")} />
        )}
      </button>

      <div className="flex-1 min-w-0">
        <p className={cn("text-sm font-medium leading-snug", isDone ? "line-through text-muted" : "text-foreground")}>
          {tarefa.titulo}
        </p>
        <div className="flex items-center gap-3 mt-1 flex-wrap">
          <span className="flex items-center gap-1.5 text-[11px] text-muted">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-background border border-border text-[9px] font-medium text-foreground">
              {iniciais}
            </span>
            {tarefa.profiles?.full_name?.split(" ")[0] || "Sem atribuição"}
          </span>
          <span className={cn("flex items-center gap-1 text-[11px]", isOverdue ? "text-red-500 font-medium" : "text-muted")}>
            <Clock className="h-3 w-3" />
            {tarefa.prazo ? new Date(tarefa.prazo + 'T00:00:00').toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }) : "Sem prazo"}
          </span>
          {tarefa.prioridade !== "baixa" && (
            <span className={cn("text-[10px] font-medium px-1.5 py-0.5 rounded", prior.bg, prior.text)}>
              {prior.label}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button 
          onClick={(e) => { e.stopPropagation(); onEdit(tarefa); }}
          className="p-1.5 rounded hover:bg-foreground/5 text-muted hover:text-foreground"
        >
          <Plus className="h-3.5 w-3.5 rotate-45" />
        </button>
        <button 
          onClick={(e) => { e.stopPropagation(); onDelete(tarefa.id); }}
          className="p-1.5 rounded hover:bg-red-500/10 text-muted hover:text-red-500"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

function KanbanCard({ tarefa, onClick, onEdit, onDelete }: { tarefa: DBTask; onClick: () => void; onEdit: (t: DBTask) => void; onDelete: (id: string) => void }) {
  const prior = prioridadeColors[tarefa.prioridade as keyof typeof prioridadeColors] || prioridadeColors.normal;
  const iniciais = tarefa.profiles?.full_name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || "??";

  return (
    <div 
      onClick={onClick}
      className="rounded-lg border border-border bg-card p-3 shadow-sm hover:shadow-md transition-shadow cursor-pointer group hover:border-letitia-gold/30"
    >
      <div className="flex justify-between items-start gap-2">
        <p className="text-sm font-medium text-foreground leading-snug">{tarefa.titulo}</p>
        <div className="flex opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={(e) => { e.stopPropagation(); onEdit(tarefa); }} className="p-1 rounded hover:bg-foreground/5 text-muted">
            <Plus className="h-3 w-3 rotate-45" />
          </button>
          <button onClick={(e) => { e.stopPropagation(); onDelete(tarefa.id); }} className="p-1 rounded hover:bg-red-500/10 text-muted hover:text-red-500">
            <X className="h-3 w-3" />
          </button>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-background border border-border text-[10px] font-medium text-foreground">{iniciais}</span>
          <span className={cn("text-[10px] font-medium px-1.5 py-0.5 rounded-full", prior.bg, prior.text)}>{prior.label}</span>
        </div>
        <span className="text-[10px] text-muted flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {tarefa.prazo ? new Date(tarefa.prazo + 'T00:00:00').toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }) : "---"}
        </span>
      </div>
    </div>
  );
}

/* ─── Team View ──────────────────────────────────────────── */

function TeamView({ tarefas, profiles, view, hoje, onTaskClick, onTaskEdit, onTaskDelete, onToggle, onNewTask, busca }: {
  tarefas: DBTask[];
  profiles: DBProfile[];
  view: ViewMode;
  hoje: string;
  onTaskClick: (t: DBTask) => void;
  onTaskEdit: (t: DBTask) => void;
  onTaskDelete: (id: string) => void;
  onToggle: (id: string, status: TaskStatus) => void;
  onNewTask: (profileId: string) => void;
  busca: string;
}) {
  const [expandedUsers, setExpandedUsers] = useState<Record<string, boolean>>({});
  const [showConcluidasMap, setShowConcluidasMap] = useState<Record<string, boolean>>({});

  // Group tasks by responsible
  const grouped = new Map<string, { profile: DBProfile | null; tasks: DBTask[] }>();
  
  // Add all profiles first
  profiles.forEach(p => {
    grouped.set(p.id, { profile: p, tasks: [] });
  });
  // Add "unassigned" group
  grouped.set("__none__", { profile: null, tasks: [] });

  tarefas.forEach(t => {
    const key = t.responsavel_id || "__none__";
    if (!grouped.has(key)) {
      grouped.set(key, { profile: t.profiles || null, tasks: [] });
    }
    grouped.get(key)!.tasks.push(t);
  });

  // Filter out profiles with no tasks (unless searching)
  const entries = Array.from(grouped.entries())
    .filter(([, v]) => v.tasks.length > 0 || busca)
    .filter(([, v]) => {
      if (!busca) return v.tasks.length > 0;
      const nameMatch = v.profile?.full_name?.toLowerCase().includes(busca.toLowerCase());
      return nameMatch || v.tasks.length > 0;
    })
    .sort((a, b) => b[1].tasks.length - a[1].tasks.length);

  const toggleUser = (id: string) => {
    setExpandedUsers(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleConcluidas = (id: string) => {
    setShowConcluidasMap(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-muted mb-2">
        <User className="h-4 w-4" />
        <span className="text-sm font-semibold">Tarefas por Responsável</span>
        <span className="text-xs bg-card border border-border px-2 py-0.5 rounded-full">{entries.length} membros</span>
      </div>

      {view === "kanban" ? (
        /* ── Kanban Cards View ── */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {entries.map(([id, { profile, tasks }]) => {
            const pendentes = tasks.filter(t => t.status !== "concluido");
            const concluidas = tasks.filter(t => t.status === "concluido");
            const atrasadas = pendentes.filter(t => t.prazo && t.prazo < hoje);
            const alta = pendentes.filter(t => t.prioridade === "alta" || t.prioridade === "urgente");
            const taxa = tasks.length > 0 ? Math.round((concluidas.length / tasks.length) * 100) : 0;
            const iniciais = profile?.full_name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || "??";
            const isExpanded = expandedUsers[id] !== false; // default expanded
            const showDone = showConcluidasMap[id] || false;

            return (
              <div key={id} className="rounded-xl border border-border bg-card overflow-hidden">
                {/* Header */}
                <div className="p-4 pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-letitia-gold/10 border-2 border-letitia-gold/30 flex items-center justify-center overflow-hidden flex-shrink-0">
                        {profile?.avatar_url ? (
                          <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <span className="text-xs font-bold text-letitia-gold">{iniciais}</span>
                        )}
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-foreground">{profile?.full_name || "Sem atribuição"}</h4>
                        <p className="text-[11px] text-muted">{pendentes.length} pendentes · {concluidas.length} concluídas</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onNewTask(id)}
                        className="text-[11px] font-medium px-2.5 py-1 rounded-md border border-border hover:bg-foreground/5 transition-colors flex items-center gap-1"
                      >
                        <Plus className="h-3 w-3" /> Nova Tarefa
                      </button>
                      <span className="text-2xl font-serif font-medium text-letitia-gold">{tasks.length}</span>
                      <span className="text-[10px] text-muted">tarefas</span>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-4 mt-3 text-[11px]">
                    <span className="flex items-center gap-1">
                      <AlertCircle className="h-3 w-3 text-red-500" />
                      <span className="text-muted">Atrasadas:</span>
                      <span className={cn("font-semibold", atrasadas.length > 0 ? "text-red-500" : "text-foreground")}>{atrasadas.length}</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <AlertCircle className="h-3 w-3 text-amber-500" />
                      <span className="text-muted">Alta:</span>
                      <span className="font-semibold text-foreground">{alta.length}</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3 text-green-500" />
                      <span className="text-muted">Taxa:</span>
                      <span className="font-semibold text-green-600">{taxa}%</span>
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="h-1.5 w-full rounded-full bg-border overflow-hidden mt-3">
                    <div className="h-full bg-letitia-gold rounded-full transition-all duration-500" style={{ width: `${taxa}%` }} />
                  </div>
                </div>

                {/* Tasks */}
                <div className="border-t border-border">
                  <button onClick={() => toggleUser(id)} className="w-full flex items-center justify-between px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-muted hover:bg-foreground/5 transition-colors">
                    <span>Tarefas pendentes ({pendentes.length})</span>
                    {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                  </button>

                  {isExpanded && (
                    <div className="px-3 pb-3 space-y-1 max-h-[300px] overflow-y-auto">
                      {pendentes.length === 0 ? (
                        <p className="text-xs text-muted italic text-center py-4">Nenhuma tarefa pendente 🎉</p>
                      ) : (
                        pendentes.map(t => {
                          const prior = prioridadeColors[t.prioridade as keyof typeof prioridadeColors] || prioridadeColors.normal;
                          const isOverdue = t.prazo && t.prazo < hoje;
                          return (
                            <div
                              key={t.id}
                              onClick={() => onTaskClick(t)}
                              className={cn(
                                "flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-pointer hover:bg-foreground/5 transition-colors group",
                                isOverdue && "bg-red-500/5"
                              )}
                            >
                              <button onClick={e => { e.stopPropagation(); onToggle(t.id, t.status); }} className="flex-shrink-0">
                                <Square className={cn("h-4 w-4", isOverdue ? "text-red-400" : "text-border group-hover:text-muted")} />
                              </button>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium text-foreground truncate">{t.titulo}</p>
                              </div>
                              <span className={cn("text-[9px] font-medium px-1.5 py-0.5 rounded", prior.bg, prior.text)}>{prior.label}</span>
                              <span className={cn("text-[10px] flex items-center gap-0.5", isOverdue ? "text-red-500 font-medium" : "text-muted")}>
                                <Clock className="h-2.5 w-2.5" />
                                {t.prazo ? new Date(t.prazo + 'T00:00:00').toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }) : "—"}
                              </span>
                            </div>
                          );
                        })
                      )}

                      {concluidas.length > 0 && (
                        <button onClick={() => toggleConcluidas(id)} className="w-full text-center text-[11px] text-muted hover:text-foreground py-2 flex items-center justify-center gap-1 transition-colors">
                          <Clock className="h-3 w-3" />
                          {showDone ? "Ocultar" : `+ ${concluidas.length} tarefas concluídas`}
                        </button>
                      )}

                      {showDone && concluidas.map(t => (
                        <div
                          key={t.id}
                          onClick={() => onTaskClick(t)}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-pointer hover:bg-foreground/5 transition-colors opacity-60"
                        >
                          <button onClick={e => { e.stopPropagation(); onToggle(t.id, t.status); }} className="flex-shrink-0">
                            <CheckSquare2 className="h-4 w-4 text-green-500" />
                          </button>
                          <p className="text-xs font-medium text-muted line-through truncate flex-1">{t.titulo}</p>
                          <span className="text-[10px] text-muted">
                            {t.prazo ? new Date(t.prazo + 'T00:00:00').toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }) : "—"}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* ── List View ── */
        <div className="space-y-6">
          {entries.map(([id, { profile, tasks }]) => {
            const pendentes = tasks.filter(t => t.status !== "concluido");
            const concluidas = tasks.filter(t => t.status === "concluido");
            const iniciais = profile?.full_name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || "??";
            const showDone = showConcluidasMap[id] || false;

            return (
              <div key={id} className="rounded-xl border border-border bg-card overflow-hidden">
                {/* Person Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-letitia-gold/10 border-2 border-letitia-gold/30 flex items-center justify-center overflow-hidden flex-shrink-0">
                      {profile?.avatar_url ? (
                        <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <span className="text-[10px] font-bold text-letitia-gold">{iniciais}</span>
                      )}
                    </div>
                    <span className="text-sm font-semibold text-foreground">{profile?.full_name || "Sem atribuição"}</span>
                    <button onClick={() => onNewTask(id)} className="h-5 w-5 rounded-full bg-green-500 text-white flex items-center justify-center hover:bg-green-600 transition-colors">
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted">
                    <span>{tasks.length} tarefas</span>
                    <span className="flex items-center gap-1"><Square className="h-3 w-3" />{pendentes.length}</span>
                    <span className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-green-500" />{concluidas.length}</span>
                  </div>
                </div>

                {/* Table header */}
                <div className="grid grid-cols-12 gap-2 px-5 py-2 text-[10px] font-bold uppercase tracking-widest text-muted border-b border-border/50 bg-background/30">
                  <div className="col-span-1"></div>
                  <div className="col-span-5">Tarefa</div>
                  <div className="col-span-2 text-center">Prioridade</div>
                  <div className="col-span-2 text-center">Prazo</div>
                  <div className="col-span-2 text-center">Status</div>
                </div>

                {/* Pending tasks */}
                {pendentes.length === 0 && !showDone ? (
                  <p className="text-xs text-muted italic text-center py-6">Nenhuma tarefa pendente 🎉</p>
                ) : (
                  pendentes.map(t => {
                    const prior = prioridadeColors[t.prioridade as keyof typeof prioridadeColors] || prioridadeColors.normal;
                    const isOverdue = t.prazo && t.prazo < hoje;
                    const statusLabels: Record<string, string> = { fazer: "Pendente", progresso: "Em andamento", revisao: "Revisão", concluido: "Concluído" };
                    return (
                      <div
                        key={t.id}
                        onClick={() => onTaskClick(t)}
                        className={cn("grid grid-cols-12 gap-2 items-center px-5 py-3 border-b border-border/30 cursor-pointer hover:bg-foreground/5 transition-colors", isOverdue && "bg-red-500/5")}
                      >
                        <div className="col-span-1">
                          <button onClick={e => { e.stopPropagation(); onToggle(t.id, t.status); }}>
                            <Square className={cn("h-4 w-4", isOverdue ? "text-red-400" : "text-border hover:text-muted")} />
                          </button>
                        </div>
                        <div className="col-span-5">
                          <p className="text-xs font-medium text-foreground truncate">{t.titulo}</p>
                        </div>
                        <div className="col-span-2 text-center">
                          <span className={cn("text-[10px] font-medium px-2 py-0.5 rounded", prior.bg, prior.text)}>{prior.label}</span>
                        </div>
                        <div className="col-span-2 text-center">
                          <span className={cn("text-[11px]", isOverdue ? "text-red-500 font-semibold" : "text-muted")}>
                            {t.prazo ? new Date(t.prazo + 'T00:00:00').toLocaleDateString("pt-BR") : "—"}
                          </span>
                        </div>
                        <div className="col-span-2 text-center">
                          <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-foreground/5 text-foreground">{statusLabels[t.status] || t.status}</span>
                        </div>
                      </div>
                    );
                  })
                )}

                {/* Concluidas toggle */}
                {concluidas.length > 0 && (
                  <>
                    <button onClick={() => toggleConcluidas(id)} className="w-full text-center text-[11px] text-muted hover:text-foreground py-2.5 flex items-center justify-center gap-1 border-b border-border/30 transition-colors hover:bg-foreground/5">
                      <Clock className="h-3 w-3" />
                      {showDone ? "Ocultar concluídas" : `+ ${concluidas.length} tarefas concluídas`}
                    </button>
                    {showDone && concluidas.map(t => {
                      const prior = prioridadeColors[t.prioridade as keyof typeof prioridadeColors] || prioridadeColors.normal;
                      return (
                        <div
                          key={t.id}
                          onClick={() => onTaskClick(t)}
                          className="grid grid-cols-12 gap-2 items-center px-5 py-2.5 border-b border-border/20 cursor-pointer hover:bg-foreground/5 transition-colors opacity-50"
                        >
                          <div className="col-span-1">
                            <button onClick={e => { e.stopPropagation(); onToggle(t.id, t.status); }}>
                              <CheckSquare2 className="h-4 w-4 text-green-500" />
                            </button>
                          </div>
                          <div className="col-span-5">
                            <p className="text-xs font-medium text-muted line-through truncate">{t.titulo}</p>
                          </div>
                          <div className="col-span-2 text-center">
                            <span className={cn("text-[10px] font-medium px-2 py-0.5 rounded", prior.bg, prior.text)}>{prior.label}</span>
                          </div>
                          <div className="col-span-2 text-center">
                            <span className="text-[11px] text-muted">{t.prazo ? new Date(t.prazo + 'T00:00:00').toLocaleDateString("pt-BR") : "—"}</span>
                          </div>
                          <div className="col-span-2 text-center">
                            <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-green-500/10 text-green-600">Concluído</span>
                          </div>
                        </div>
                      );
                    })}
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
