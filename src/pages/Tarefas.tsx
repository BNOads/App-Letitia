import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getTasks, updateTaskStatus, createTask, updateTask, deleteTask, deleteRecurringTaskSeries, getTaskComments, addTaskComment, saveTaskHistory, recurrenceLabels, type DBTask, type TaskStatus, type TaskPriority, type TaskComment, type RecurrenceType } from "@/services/taskService";
import { getProfiles, type DBProfile } from "@/services/profileService";
import { prioridadeColors } from "@/data/mockData";
import { 
  Plus, Search, ChevronDown, ChevronUp, Clock, AlertCircle, CheckCircle2, 
  CalendarClock, Square, CheckSquare2, LayoutGrid, List, Loader2, X, 
  Trash2, History, MessageSquare, Send, User, Edit3, Copy, Check, Repeat, Layers
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
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
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
    const tarefa = tarefas.find(t => t.id === id);
    setTarefas(prev => prev.map(t => t.id === id ? { ...t, status: newStatus } : t));
    try {
      await updateTaskStatus(id, newStatus);
      if (tarefa) {
        saveTaskHistory({
          tarefa_id: id,
          titulo: tarefa.titulo,
          prioridade: tarefa.prioridade,
          status: newStatus,
          responsavel_nome: tarefa.profiles?.full_name || undefined,
          responsavel_id: tarefa.responsavel_id,
          prazo: tarefa.prazo,
          action: newStatus === 'concluido' ? 'concluida' : 'status_alterado',
          details: newStatus === 'concluido' ? 'Tarefa concluída' : 'Tarefa reaberta',
        });
      }
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
      fetchTarefas();
    }
  };

  const handleDeleteTask = async (id: string) => {
    const tarefa = tarefas.find(t => t.id === id);
    if (!tarefa) return;

    // If the task has recurrence, ask if they want to delete only this or the series
    if (tarefa.recorrencia) {
      const choice = confirm(
        "Esta é uma tarefa recorrente.\n\nOK = Excluir TODA a série\nCancelar = Cancelar"
      );
      if (!choice) return;
      try {
        saveTaskHistory({
          tarefa_id: id, titulo: tarefa.titulo, prioridade: tarefa.prioridade,
          status: tarefa.status, responsavel_nome: tarefa.profiles?.full_name || undefined,
          responsavel_id: tarefa.responsavel_id, prazo: tarefa.prazo,
          action: 'excluida', details: 'Série recorrente excluída',
        });
        const parentId = tarefa.recorrencia_pai_id || tarefa.id;
        await deleteRecurringTaskSeries(parentId);
        setSelectedTarefa(null);
        fetchTarefas();
      } catch (error) {
        console.error("Erro ao excluir série:", error);
      }
      return;
    }

    if (!confirm("Tem certeza que deseja excluir esta tarefa?")) return;
    try {
      saveTaskHistory({
        tarefa_id: id, titulo: tarefa.titulo, prioridade: tarefa.prioridade,
        status: tarefa.status, responsavel_nome: tarefa.profiles?.full_name || undefined,
        responsavel_id: tarefa.responsavel_id, prazo: tarefa.prazo,
        action: 'excluida', details: 'Tarefa excluída manualmente',
      });
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
        <div className="flex items-center gap-2 self-start">
          <button 
            onClick={() => setIsHistoryOpen(true)}
            className="rounded-md border border-border px-3 py-2 text-sm font-medium text-muted hover:text-foreground hover:bg-foreground/5 transition-all flex items-center gap-2"
            title="Histórico de tarefas"
          >
            <History className="h-4 w-4" /> Histórico
          </button>
          <button 
            onClick={() => setIsBulkModalOpen(true)}
            className="rounded-md border border-primary/30 bg-primary/5 px-3 py-2 text-sm font-medium text-primary hover:bg-primary/10 transition-all flex items-center gap-2"
          >
            <Layers className="h-4 w-4" /> Em Massa
          </button>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-all flex items-center gap-2"
          >
            <Plus className="h-4 w-4" /> Nova Tarefa
          </button>
        </div>
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
          onNewTask={(_profileId) => {
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

      {isBulkModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-serif text-xl font-medium text-foreground">Criar Tarefas em Massa</h3>
              <button onClick={() => setIsBulkModalOpen(false)} className="rounded-full p-1 hover:bg-foreground/10"><X className="h-5 w-5 text-muted" /></button>
            </div>
            <p className="text-sm text-muted">Em breve: criação de tarefas em massa.</p>
          </div>
        </div>
      )}

      {isHistoryOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-serif text-xl font-medium text-foreground">Histórico de Tarefas</h3>
              <button onClick={() => setIsHistoryOpen(false)} className="rounded-full p-1 hover:bg-foreground/10"><X className="h-5 w-5 text-muted" /></button>
            </div>
            <p className="text-sm text-muted">Em breve: histórico completo de tarefas.</p>
          </div>
        </div>
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

export function TaskDetailModal({ tarefa, profiles: allProfiles, onClose, onEdit, onDelete, onStatusChange, onUpdate }: {
  tarefa: DBTask;
  profiles: DBProfile[];
  onClose: () => void;
  onEdit: (t: DBTask) => void;
  onDelete: (id: string) => void;
  onStatusChange: (status: TaskStatus) => Promise<void>;
  onUpdate: (updates: Partial<DBTask>) => Promise<void>;
}) {
  const { user } = useAuth();
  const prior = prioridadeColors[tarefa.prioridade] || prioridadeColors.normal;
  const [comments, setComments] = useState<TaskComment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [sending, setSending] = useState(false);
  const [copied, setCopied] = useState(false);
  const [editingDesc, setEditingDesc] = useState(false);
  const [descDraft, setDescDraft] = useState(tarefa.descricao || "");
  const [showResponsavelPicker, setShowResponsavelPicker] = useState(false);
  const [respSearch, setRespSearch] = useState("");
  const feedEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => { getTaskComments(tarefa.id).then(setComments); }, [tarefa.id]);

  const handleSendComment = async () => {
    if (!newComment.trim() || !user || sending) return;
    setSending(true);
    try {
      const c = await addTaskComment(tarefa.id, user.id, newComment.trim());
      setComments(prev => [...prev, c]);
      setNewComment("");
      setTimeout(() => feedEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    } catch (e) { console.error("Erro ao enviar comentário:", e); }
    finally { setSending(false); }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(tarefa.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveDesc = async () => {
    await onUpdate({ descricao: descDraft } as any);
    setEditingDesc(false);
  };

  // Build unified timeline
  type TimelineEntry = { type: "activity" | "comment"; date: string; data: any };
  const timeline: TimelineEntry[] = ([
    { type: "activity" as const, date: tarefa.created_at, data: { user: tarefa.profiles?.full_name || "Sistema", action: "criou a tarefa" } },
    ...(tarefa.updated_at !== tarefa.created_at ? [{ type: "activity" as const, date: tarefa.updated_at, data: { user: tarefa.profiles?.full_name || "Sistema", action: "atualizou a tarefa" } }] : []),
    ...comments.map(c => ({ type: "comment" as const, date: c.created_at, data: c })),
  ] as TimelineEntry[]).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-2 sm:p-4 md:p-8" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="relative w-full max-w-6xl max-h-[95vh] md:max-h-[90vh] bg-background border border-border rounded-2xl shadow-2xl flex flex-col md:flex-row overflow-hidden animate-in fade-in zoom-in duration-300">
        
        <button onClick={onClose} className="absolute top-3 right-3 z-10 h-10 w-10 flex items-center justify-center rounded-full bg-foreground/10 hover:bg-foreground/20 backdrop-blur-md border border-border/50 transition-all shadow-lg" title="Fechar">
          <X className="h-5 w-5 text-foreground" />
        </button>

        {/* Left Column */}
        <div className="flex-1 flex flex-col overflow-y-auto md:border-r border-border bg-card/30 min-h-0">
          <div className="p-5 sm:p-6 md:p-8 space-y-6 md:space-y-8 pr-14 md:pr-8">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted">
                <div className="h-2 w-2 rounded-full bg-blue-500" />
                <span>Tarefa</span>
                <span className="bg-foreground/5 px-1.5 py-0.5 rounded text-[8px]">{tarefa.id.substring(0, 8)}</span>
              </div>
              <div className="flex items-center gap-1 sm:gap-2">
                <button onClick={handleCopy} className="flex items-center gap-1 px-2 sm:px-3 py-1.5 rounded-md hover:bg-foreground/5 text-xs font-medium text-muted transition-colors">
                  {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
                  <span className="hidden sm:inline">{copied ? "Copiado!" : "Copiar ID"}</span>
                </button>
                <button onClick={() => onEdit(tarefa)} className="flex items-center gap-1 px-2 sm:px-3 py-1.5 rounded-md hover:bg-foreground/5 text-xs font-medium text-muted transition-colors">
                  <Edit3 className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Editar</span>
                </button>
                <button onClick={() => onDelete(tarefa.id)} className="flex items-center gap-1 px-2 sm:px-3 py-1.5 rounded-md hover:bg-red-500/10 text-xs font-medium text-red-500 transition-colors">
                  <Trash2 className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Excluir</span>
                </button>
              </div>
            </div>

            <h1 className="text-2xl sm:text-3xl font-serif font-medium leading-tight text-foreground">{tarefa.titulo}</h1>

            {/* Editable Properties */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-y-5 gap-x-6 md:gap-x-12 md:gap-y-6">
              <Property label="Status">
                <select value={tarefa.status} onChange={(e) => onStatusChange(e.target.value as TaskStatus)} className="bg-foreground/5 hover:bg-foreground/10 px-3 py-1 rounded text-xs font-bold uppercase tracking-tight focus:outline-none transition-colors border-none cursor-pointer">
                  <option value="fazer">A Fazer</option>
                  <option value="progresso">Em Progresso</option>
                  <option value="revisao">Revisão</option>
                  <option value="concluido">Concluído</option>
                </select>
              </Property>
              
              <Property label="Responsável">
                <div className="relative">
                  <button onClick={() => setShowResponsavelPicker(!showResponsavelPicker)} className="flex items-center gap-2 bg-foreground/5 hover:bg-foreground/10 px-2 py-1 rounded cursor-pointer transition-colors">
                    <div className="h-5 w-5 rounded-full bg-letitia-gold/20 flex items-center justify-center text-[8px] font-bold text-letitia-gold border border-letitia-gold/30">
                      {tarefa.profiles?.full_name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || "??"}
                    </div>
                    <span className="text-xs font-medium truncate max-w-[100px]">{tarefa.profiles?.full_name || "Sem atribuição"}</span>
                    <ChevronDown className="h-3 w-3 text-muted" />
                  </button>
                  {showResponsavelPicker && (
                    <div className="absolute top-full left-0 mt-1 z-50 w-56 bg-card border border-border rounded-lg shadow-xl overflow-hidden">
                      <div className="relative p-1.5 border-b border-border">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3 w-3 text-muted" />
                        <input autoFocus type="text" value={respSearch} onChange={e => setRespSearch(e.target.value)} placeholder="Buscar..." className="w-full bg-background border border-border rounded-md pl-7 pr-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary" />
                      </div>
                      <div className="max-h-40 overflow-y-auto p-1">
                        <button onClick={() => { onUpdate({ responsavel_id: null } as any); setShowResponsavelPicker(false); setRespSearch(""); }} className="flex items-center gap-2 w-full px-2 py-1.5 rounded text-xs hover:bg-foreground/5 transition-colors text-muted">
                          <X className="h-3.5 w-3.5" /> Sem atribuição
                        </button>
                        {allProfiles.filter(p => (p.full_name || "").toLowerCase().includes(respSearch.toLowerCase())).map(p => (
                          <button key={p.id} onClick={() => { onUpdate({ responsavel_id: p.id } as any); setShowResponsavelPicker(false); setRespSearch(""); }} className="flex items-center gap-2 w-full px-2 py-1.5 rounded text-xs hover:bg-foreground/5 transition-colors">
                            <div className="h-5 w-5 rounded-full bg-letitia-gold/20 flex items-center justify-center text-[7px] font-bold text-letitia-gold">{(p.full_name || "??").split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}</div>
                            <span>{p.full_name}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </Property>

              <Property label="Prioridade">
                <select value={tarefa.prioridade} onChange={(e) => onUpdate({ prioridade: e.target.value } as any)} className={cn("text-[10px] font-bold uppercase px-3 py-1 rounded border-none cursor-pointer focus:outline-none", prior.bg, prior.text)}>
                  <option value="baixa">Baixa</option>
                  <option value="normal">Normal</option>
                  <option value="alta">Alta</option>
                  <option value="urgente">Urgente</option>
                </select>
              </Property>

              <Property label="Prazo">
                <input type="date" value={tarefa.prazo || ""} onChange={(e) => onUpdate({ prazo: e.target.value || null } as any)} className="bg-foreground/5 hover:bg-foreground/10 px-2 py-1 rounded text-xs font-medium focus:outline-none border-none cursor-pointer" />
              </Property>

              <Property label="Criado em">
                <span className="text-xs font-medium text-muted">{new Date(tarefa.created_at).toLocaleDateString("pt-BR", { day: 'numeric', month: 'long' })}</span>
              </Property>
            </div>

            {/* Editable Description */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted">
                  <List className="h-3.5 w-3.5" /> Descrição
                </div>
                {!editingDesc && <button onClick={() => setEditingDesc(true)} className="text-[10px] text-muted hover:text-foreground transition-colors"><Edit3 className="h-3 w-3" /></button>}
              </div>
              {editingDesc ? (
                <div className="space-y-2">
                  <textarea value={descDraft} onChange={e => setDescDraft(e.target.value)} className="w-full min-h-[100px] p-4 rounded-xl border border-border bg-background text-sm focus:ring-2 focus:ring-primary focus:outline-none resize-none" autoFocus />
                  <div className="flex gap-2 justify-end">
                    <button onClick={() => { setEditingDesc(false); setDescDraft(tarefa.descricao || ""); }} className="px-3 py-1 rounded text-xs text-muted hover:text-foreground">Cancelar</button>
                    <button onClick={handleSaveDesc} className="px-3 py-1 rounded bg-primary text-primary-foreground text-xs font-medium">Salvar</button>
                  </div>
                </div>
              ) : (
                <div onClick={() => setEditingDesc(true)} className="min-h-[60px] p-4 rounded-xl border border-border bg-background/50 text-sm text-foreground/80 leading-relaxed cursor-pointer hover:border-primary/30 transition-colors">
                  {tarefa.descricao || <span className="italic opacity-50">Clique para adicionar descrição...</span>}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Unified Timeline */}
        <div className="w-full md:w-80 lg:w-96 flex flex-col bg-background border-t md:border-t-0 border-border min-h-0 max-h-[50vh] md:max-h-none">
          <div className="px-4 md:px-6 py-3 md:py-4 border-b border-border flex-shrink-0">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-foreground flex items-center gap-2">
              <History className="h-3 w-3" /> Atividade & Comentários
            </h3>
          </div>

          <div className="flex-1 flex flex-col overflow-hidden min-h-0">
            <div className="flex-1 p-4 md:p-6 overflow-y-auto space-y-4">
              {timeline.map((entry, i) => (
                <div key={i} className="flex gap-3">
                  <div className={cn("flex-shrink-0 h-6 w-6 rounded-full flex items-center justify-center", entry.type === "comment" ? "bg-primary/10" : "bg-foreground/5")}>
                    {entry.type === "comment" ? <MessageSquare className="h-3 w-3 text-primary" /> : <User className="h-3 w-3 text-muted" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    {entry.type === "activity" ? (
                      <>
                        <p className="text-xs"><span className="font-semibold">{entry.data.user}</span> {entry.data.action}</p>
                        <p className="text-[10px] text-muted mt-0.5">{new Date(entry.date).toLocaleString("pt-BR", { day: '2-digit', month: 'long', hour: '2-digit', minute: '2-digit' })}</p>
                      </>
                    ) : (
                      <>
                        <p className="text-xs"><span className="font-semibold">{entry.data.profiles?.full_name || "Usuário"}</span> comentou</p>
                        <div className="mt-1 p-2.5 rounded-lg bg-foreground/[0.03] border border-border/50 text-xs text-foreground/80">{entry.data.conteudo}</div>
                        <p className="text-[10px] text-muted mt-1">{new Date(entry.date).toLocaleString("pt-BR", { day: '2-digit', month: 'long', hour: '2-digit', minute: '2-digit' })}</p>
                      </>
                    )}
                  </div>
                </div>
              ))}
              <div ref={feedEndRef} />
            </div>

            <div className="p-3 md:p-4 border-t border-border bg-card/20 flex-shrink-0">
              <div className="relative">
                <textarea value={newComment} onChange={e => setNewComment(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSendComment(); } }} placeholder="Escreva um comentário..." className="w-full bg-background border border-border rounded-xl px-4 py-3 text-xs focus:ring-2 focus:ring-primary focus:outline-none min-h-[70px] resize-none pr-12" />
                <button onClick={handleSendComment} disabled={!newComment.trim() || sending} className="absolute bottom-3 right-3 h-8 w-8 flex items-center justify-center rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-30">
                  {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
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
    prazo: tarefa?.prazo || "",
    recorrencia: (tarefa?.recorrencia || null) as RecurrenceType | null
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
        saveTaskHistory({
          tarefa_id: tarefa.id, titulo: formData.titulo, prioridade: formData.prioridade,
          status: formData.status, responsavel_id: formData.responsavel_id || null,
          prazo: formData.prazo || null, action: 'editada', details: 'Tarefa editada',
        });
      } else {
        const created = await createTask(taskData);
        saveTaskHistory({
          tarefa_id: created.id, titulo: formData.titulo, prioridade: formData.prioridade,
          status: formData.status, responsavel_id: formData.responsavel_id || null,
          prazo: formData.prazo || null, action: 'criada', details: 'Tarefa criada',
        });
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

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1.5">Recorrência</label>
            <div className="relative">
              <Repeat className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
              <select
                value={formData.recorrencia || ''}
                onChange={e => setFormData({ ...formData, recorrencia: (e.target.value || null) as RecurrenceType | null })}
                className="w-full rounded-md border border-border bg-background pl-9 pr-3 py-2 text-sm text-foreground focus:ring-2 focus:ring-letitia-gold focus:outline-none appearance-none"
              >
                <option value="">Sem recorrência</option>
                <option value="diario">📅 Diário</option>
                <option value="semanal">📆 Semanal</option>
                <option value="quinzenal">🗓️ Quinzenal</option>
                <option value="mensal">📅 Mensal</option>
                <option value="semestral">🗓️ Semestral</option>
                <option value="anual">📆 Anual</option>
              </select>
            </div>
            {formData.recorrencia && !formData.prazo && (
              <p className="mt-1.5 text-[11px] text-amber-600 flex items-center gap-1 bg-amber-500/5 px-2 py-1 rounded">
                ⚠️ Defina um prazo para gerar as recorrências
              </p>
            )}
            {formData.recorrencia && formData.prazo && (
              <p className="mt-1.5 text-[11px] text-violet-600 flex items-center gap-1.5 bg-violet-500/5 px-2.5 py-1.5 rounded-md border border-violet-500/10">
                <Repeat className="h-3 w-3" />
                Esta tarefa será repetida automaticamente ({recurrenceLabels[formData.recorrencia]}) a partir de {new Date(formData.prazo + 'T00:00:00').toLocaleDateString('pt-BR')}
              </p>
            )}
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
          {tarefa.recorrencia && (
            <span className="flex items-center gap-1 text-[9px] font-medium px-1.5 py-0.5 rounded-full bg-violet-500/10 text-violet-600 border border-violet-500/20">
              <Repeat className="h-2.5 w-2.5" />
              {recurrenceLabels[tarefa.recorrencia as RecurrenceType]}
            </span>
          )}
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
      {tarefa.recorrencia && (
        <div className="mt-2 flex items-center gap-1">
          <Repeat className="h-2.5 w-2.5 text-violet-500" />
          <span className="text-[9px] font-medium text-violet-600">{recurrenceLabels[tarefa.recorrencia as RecurrenceType]}</span>
        </div>
      )}
    </div>
  );
}

/* ─── Team View ──────────────────────────────────────────── */

function TeamView({ tarefas, profiles, view, hoje, onTaskClick, onTaskEdit: _onTaskEdit, onTaskDelete: _onTaskDelete, onToggle, onNewTask, busca }: {
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
      grouped.set(key, { profile: (t.profiles as DBProfile | null) || null, tasks: [] });
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

  const [memberSearch, setMemberSearch] = useState("");

  const filteredEntries = entries.filter(([, v]) => {
    if (!memberSearch) return true;
    return (v.profile?.full_name || "Sem atribuição").toLowerCase().includes(memberSearch.toLowerCase());
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-2">
        <div className="flex items-center gap-2 text-muted">
          <User className="h-4 w-4" />
          <span className="text-sm font-semibold">Tarefas por Responsável</span>
          <span className="text-xs bg-card border border-border px-2 py-0.5 rounded-full">{filteredEntries.length} membros</span>
        </div>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted" />
          <input type="text" value={memberSearch} onChange={e => setMemberSearch(e.target.value)} placeholder="Buscar membro..." className="rounded-md border border-border bg-card pl-8 pr-3 py-1.5 text-xs text-foreground placeholder:text-muted focus:ring-2 focus:ring-letitia-gold focus:outline-none w-44" />
        </div>
      </div>

      {view === "kanban" ? (
        /* ── Kanban Cards View ── */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredEntries.map(([id, { profile, tasks }]) => {
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
                    {filteredEntries.map(([id, { profile, tasks }]) => {
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

/* ─── Bulk Task Creation Modal ─────────────────────────────── */

function BulkTaskModal({ profiles, onClose, onSuccess }: {
  profiles: DBProfile[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [tasksText, setTasksText] = useState("");
  const [responsavelId, setResponsavelId] = useState(user?.id || "");
  const [prazo, setPrazo] = useState("");
  const [prioridade, setPrioridade] = useState<TaskPriority>("normal");
  const [resultado, setResultado] = useState<{ total: number; criadas: number } | null>(null);

  const linhas = tasksText.split("\n").filter(l => l.trim().length > 0);

  const handleSubmit = async () => {
    if (linhas.length === 0) return;
    setLoading(true);
    try {
      const tasks = linhas.map(titulo => ({
        titulo: titulo.trim(),
        descricao: "",
        prioridade,
        status: "fazer" as TaskStatus,
        responsavel_id: responsavelId || null,
        prazo: prazo || null,
      }));
      const created = await createBulkTasks(tasks);
      for (const t of created) {
        saveTaskHistory({
          tarefa_id: t.id, titulo: t.titulo, prioridade: t.prioridade,
          status: t.status, responsavel_id: t.responsavel_id, prazo: t.prazo,
          action: 'bulk_criada', details: `Criada em massa (${created.length} tarefas)`,
        });
      }
      setResultado({ total: linhas.length, criadas: created.length });
      setTimeout(() => onSuccess(), 1500);
    } catch (error) {
      console.error("Erro ao criar tarefas em massa:", error);
      alert("Erro ao criar tarefas. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-2xl rounded-xl border border-border bg-card shadow-2xl animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Layers className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-serif text-2xl font-medium text-foreground">Criar Tarefas em Massa</h3>
              <p className="text-xs text-muted mt-0.5">Uma tarefa por linha. Todas compartilham responsável, prazo e prioridade.</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-full p-1 hover:bg-foreground/10 transition-colors">
            <X className="h-5 w-5 text-muted" />
          </button>
        </div>
        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1.5">Tarefas (uma por linha)</label>
            <textarea
              value={tasksText}
              onChange={e => setTasksText(e.target.value)}
              className="w-full rounded-md border border-border bg-background px-3 py-3 text-sm text-foreground focus:ring-2 focus:ring-letitia-gold focus:outline-none min-h-[180px] font-mono"
              placeholder={"Revisar copy do e-mail de lançamento\nGravar episódio 47\nCriar criativos Instagram semana 20\nFollow-up boletos Maio"}
            />
            {linhas.length > 0 && (
              <p className="text-[11px] text-muted mt-1.5 flex items-center gap-1.5">
                <FileText className="h-3 w-3" />
                {linhas.length} {linhas.length === 1 ? "tarefa será criada" : "tarefas serão criadas"}
              </p>
            )}
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1.5">Prioridade</label>
              <select value={prioridade} onChange={e => setPrioridade(e.target.value as TaskPriority)} className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:ring-2 focus:ring-letitia-gold focus:outline-none">
                <option value="baixa">Baixa</option>
                <option value="normal">Normal</option>
                <option value="alta">Alta</option>
                <option value="urgente">Urgente</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1.5">Prazo</label>
              <input type="date" value={prazo} onChange={e => setPrazo(e.target.value)} className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:ring-2 focus:ring-letitia-gold focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1.5">Responsável</label>
              <select value={responsavelId} onChange={e => setResponsavelId(e.target.value)} className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:ring-2 focus:ring-letitia-gold focus:outline-none">
                <option value="">Sem atribuição</option>
                {profiles.map(p => (<option key={p.id} value={p.id}>{p.full_name}</option>))}
              </select>
            </div>
          </div>
          {linhas.length > 0 && (
            <div className="rounded-lg border border-border bg-background/50 p-3 max-h-[150px] overflow-y-auto">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted mb-2">Pré-visualização</p>
              {linhas.map((l, i) => (
                <div key={i} className="flex items-center gap-2 py-1.5 border-b border-border/30 last:border-0">
                  <Square className="h-3.5 w-3.5 text-border flex-shrink-0" />
                  <span className="text-xs text-foreground truncate">{l.trim()}</span>
                </div>
              ))}
            </div>
          )}
          {resultado && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-700">
              <CheckCircle2 className="h-5 w-5" />
              <span className="text-sm font-medium">{resultado.criadas} tarefas criadas com sucesso!</span>
            </div>
          )}
        </div>
        <div className="flex justify-end gap-3 p-6 border-t border-border">
          <button type="button" onClick={onClose} className="rounded-md border border-border px-4 py-2 text-sm font-medium text-muted hover:text-foreground transition-colors">Cancelar</button>
          <button onClick={handleSubmit} disabled={loading || linhas.length === 0} className="rounded-md bg-primary px-6 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-all flex items-center gap-2 disabled:opacity-50">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Layers className="h-4 w-4" />}
            Criar {linhas.length} {linhas.length === 1 ? "Tarefa" : "Tarefas"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Task History Modal ───────────────────────────────────── */

function TaskHistoryModal({ onClose }: { onClose: () => void }) {
  const [history] = useState<TaskHistoryEntry[]>(() => getTaskHistory());
  const [busca, setBusca] = useState("");
  const filteredHistory = history.filter(h =>
    h.titulo.toLowerCase().includes(busca.toLowerCase()) ||
    h.responsavel_nome?.toLowerCase().includes(busca.toLowerCase()) ||
    h.action.toLowerCase().includes(busca.toLowerCase())
  );
  const handleExport = () => {
    const data = exportTaskHistory();
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `tarefas_historico_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };
  const actionLabels: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
    criada: { label: "Criada", color: "bg-blue-500/10 text-blue-600", icon: <Plus className="h-3 w-3" /> },
    bulk_criada: { label: "Em massa", color: "bg-violet-500/10 text-violet-600", icon: <Layers className="h-3 w-3" /> },
    concluida: { label: "Concluída", color: "bg-green-500/10 text-green-600", icon: <CheckCircle2 className="h-3 w-3" /> },
    editada: { label: "Editada", color: "bg-amber-500/10 text-amber-600", icon: <Edit3 className="h-3 w-3" /> },
    excluida: { label: "Excluída", color: "bg-red-500/10 text-red-600", icon: <Trash2 className="h-3 w-3" /> },
    status_alterado: { label: "Status", color: "bg-gray-500/10 text-gray-600", icon: <Clock className="h-3 w-3" /> },
  };
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-3xl max-h-[85vh] rounded-xl border border-border bg-card shadow-2xl animate-in fade-in zoom-in duration-200 flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-letitia-gold/10 flex items-center justify-center">
              <History className="h-5 w-5 text-letitia-gold" />
            </div>
            <div>
              <h3 className="font-serif text-2xl font-medium text-foreground">Histórico de Tarefas</h3>
              <p className="text-xs text-muted mt-0.5">{history.length} registros salvos localmente</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleExport} className="rounded-md border border-border px-3 py-1.5 text-xs font-medium text-muted hover:text-foreground hover:bg-foreground/5 transition-all flex items-center gap-1.5" title="Exportar como JSON">
              <Download className="h-3.5 w-3.5" /> Exportar
            </button>
            <button onClick={onClose} className="rounded-full p-1 hover:bg-foreground/10 transition-colors">
              <X className="h-5 w-5 text-muted" />
            </button>
          </div>
        </div>
        <div className="px-6 pt-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
            <input type="text" value={busca} onChange={e => setBusca(e.target.value)} className="w-full rounded-md border border-border bg-background pl-9 pr-3 py-2 text-sm text-foreground placeholder:text-muted focus:ring-2 focus:ring-letitia-gold focus:outline-none" placeholder="Buscar no histórico..." />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-2">
          {filteredHistory.length === 0 ? (
            <div className="py-16 text-center">
              <History className="h-12 w-12 text-muted/30 mx-auto mb-3" />
              <p className="text-sm text-muted">Nenhum registro encontrado.</p>
              <p className="text-xs text-muted/60 mt-1">O histórico é salvo automaticamente quando tarefas são criadas, concluídas ou excluídas.</p>
            </div>
          ) : (
            filteredHistory.map((entry) => {
              const info = actionLabels[entry.action] || actionLabels.editada;
              return (
                <div key={entry.id} className="flex items-start gap-3 p-3 rounded-lg border border-border hover:bg-foreground/[0.02] transition-colors">
                  <div className={cn("flex-shrink-0 h-7 w-7 rounded-lg flex items-center justify-center", info.color)}>{info.icon}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{entry.titulo}</p>
                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                      <span className={cn("text-[9px] font-bold uppercase px-1.5 py-0.5 rounded", info.color)}>{info.label}</span>
                      {entry.responsavel_nome && <span className="text-[10px] text-muted flex items-center gap-1"><User className="h-2.5 w-2.5" /> {entry.responsavel_nome}</span>}
                      {entry.prazo && <span className="text-[10px] text-muted flex items-center gap-1"><Calendar className="h-2.5 w-2.5" /> {new Date(entry.prazo + 'T00:00:00').toLocaleDateString("pt-BR")}</span>}
                      {entry.details && <span className="text-[10px] text-muted italic">{entry.details}</span>}
                    </div>
                  </div>
                  <span className="text-[10px] text-muted flex-shrink-0">{new Date(entry.timestamp).toLocaleString("pt-BR", { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
