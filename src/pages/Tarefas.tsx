import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getTasks, updateTaskStatus, type DBTask, type TaskStatus } from "@/services/taskService";
import { prioridadeColors } from "@/data/mockData";
import { Plus, Search, ChevronDown, ChevronUp, Clock, AlertCircle, CheckCircle2, CalendarClock, SkipForward, Square, CheckSquare2, Filter, LayoutGrid, List, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type ViewMode = "lista" | "kanban";
type TabFilter = "minhas" | "time";

const kanbanColumns = [
  { id: "fazer" as const, label: "A Fazer", color: "border-t-gray-400" },
  { id: "progresso" as const, label: "Em Progresso", color: "border-t-blue-400" },
  { id: "revisao" as const, label: "Revisão", color: "border-t-amber-400" },
  { id: "concluido" as const, label: "Concluído", color: "border-t-green-400" },
];

export function Tarefas() {
  const { user } = useAuth();
  const [tarefas, setTarefas] = useState<DBTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<ViewMode>("lista");
  const [tab, setTab] = useState<TabFilter>("minhas");
  const [busca, setBusca] = useState("");
  const [showConcluidas, setShowConcluidas] = useState(true);
  const [showAtrasadas, setShowAtrasadas] = useState(true);
  const [showHoje, setShowHoje] = useState(true);
  const [showProximas, setShowProximas] = useState(true);

  const hoje = new Date().toISOString().split("T")[0];

  useEffect(() => {
    fetchTarefas();
  }, []);

  async function fetchTarefas() {
    try {
      const data = await getTasks();
      setTarefas(data);
    } catch (error) {
      console.error("Erro ao buscar tarefas:", error);
    } finally {
      setLoading(false);
    }
  }

  const filtradas = tarefas.filter((t) => {
    const matchBusca = t.titulo.toLowerCase().includes(busca.toLowerCase()) ||
                       t.profiles?.full_name.toLowerCase().includes(busca.toLowerCase());
    
    if (tab === "minhas") {
      return matchBusca && t.responsavel_id === user?.id;
    }
    return matchBusca;
  });

  const pendentes = filtradas.filter((t) => t.status !== "concluido");
  const concluidas = filtradas.filter((t) => t.status === "concluido");
  const atrasadas = pendentes.filter((t) => t.prazo < hoje);
  const paraHoje = pendentes.filter((t) => t.prazo === hoje);
  const proximas = pendentes.filter((t) => t.prazo > hoje);
  const altaPrioridade = pendentes.filter((t) => t.prioridade === "alta" || t.prioridade === "urgente");

  const totalTarefas = filtradas.length;
  const progresso = totalTarefas > 0 ? Math.round((concluidas.length / totalTarefas) * 100) : 0;

  const toggleConcluida = async (id: string, currentStatus: TaskStatus) => {
    const newStatus: TaskStatus = currentStatus === "concluido" ? "fazer" : "concluido";
    
    // Otimista
    setTarefas(prev => prev.map(t => t.id === id ? { ...t, status: newStatus } : t));

    try {
      await updateTaskStatus(id, newStatus);
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
      // Reverter se der erro
      fetchTarefas();
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
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="font-serif text-3xl font-medium tracking-tight text-foreground">Tarefas</h2>
            <p className="mt-1 text-sm text-muted">Gerencie suas atividades e da sua equipe</p>
          </div>
          <div className="flex items-center gap-2">
            <button className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-all flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Nova Tarefa
            </button>
          </div>
        </div>

        {/* Tabs + View Toggle */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-1 bg-card border border-border rounded-lg p-0.5">
            <button onClick={() => setTab("minhas")} className={cn("px-4 py-1.5 rounded-md text-sm font-medium transition-all", tab === "minhas" ? "bg-primary text-primary-foreground" : "text-muted hover:text-foreground")}>
              Minhas
            </button>
            <button onClick={() => setTab("time")} className={cn("px-4 py-1.5 rounded-md text-sm font-medium transition-all", tab === "time" ? "bg-primary text-primary-foreground" : "text-muted hover:text-foreground")}>
              Time
            </button>
          </div>

          <div className="flex items-center gap-3">
            {/* Search */}
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

            {/* View Toggle */}
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
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <KPIBox icon={<Clock className="h-4 w-4 text-muted" />} label="Pendentes" value={pendentes.length} />
        <KPIBox icon={<CheckCircle2 className="h-4 w-4 text-green-500" />} label="Concluídas" value={concluidas.length} />
        <KPIBox icon={<AlertCircle className="h-4 w-4 text-red-500" />} label="Atrasadas" value={atrasadas.length} color="text-red-500" />
        <KPIBox icon={<CalendarClock className="h-4 w-4 text-amber-500" />} label="Alta prioridade" value={altaPrioridade.length} />
      </div>

      {view === "lista" ? (
        <div className="space-y-4">
          {/* Progresso Geral */}
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-foreground">Progresso geral</span>
              <span className="text-sm font-semibold text-letitia-sage">{progresso}%</span>
            </div>
            <div className="h-2 w-full rounded-full bg-border overflow-hidden">
              <div className="h-full bg-letitia-sage rounded-full transition-all duration-500" style={{ width: `${progresso}%` }} />
            </div>
          </div>

          {/* Seção: Atrasadas */}
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
                <TaskRow key={t.id} tarefa={t} onToggle={() => toggleConcluida(t.id, t.status)} isOverdue />
              ))}
            </TaskSection>
          )}

          {/* Seção: Hoje */}
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
              paraHoje.map((t) => <TaskRow key={t.id} tarefa={t} onToggle={() => toggleConcluida(t.id, t.status)} />)
            )}
          </TaskSection>

          {/* Seção: Próximas */}
          <TaskSection
            label="Próximas e Sem Prazo"
            count={proximas.length}
            icon={<Clock className="h-4 w-4 text-muted" />}
            color="text-foreground"
            open={showProximas}
            onToggle={() => setShowProximas(!showProximas)}
          >
            {proximas.map((t) => <TaskRow key={t.id} tarefa={t} onToggle={() => toggleConcluida(t.id, t.status)} />)}
          </TaskSection>

          {/* Seção: Concluídas */}
          <TaskSection
            label={`Concluídas`}
            count={concluidas.length}
            icon={<CheckCircle2 className="h-4 w-4 text-green-500" />}
            color="text-green-500"
            open={showConcluidas}
            onToggle={() => setShowConcluidas(!showConcluidas)}
          >
            {concluidas.map((t) => <TaskRow key={t.id} tarefa={t} onToggle={() => toggleConcluida(t.id, t.status)} isDone />)}
          </TaskSection>
        </div>
      ) : (
        /* Kanban View */
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
                    <KanbanCard key={t.id} tarefa={t} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
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

function TaskRow({ tarefa, onToggle, isOverdue, isDone }: {
  tarefa: DBTask; onToggle: () => void; isOverdue?: boolean; isDone?: boolean;
}) {
  const prior = prioridadeColors[tarefa.prioridade as keyof typeof prioridadeColors] || prioridadeColors.normal;
  const iniciais = tarefa.profiles?.full_name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || "??";

  return (
    <div className={cn(
      "flex items-center gap-3 px-4 py-3 rounded-lg border transition-all cursor-pointer hover:shadow-sm group",
      isOverdue ? "border-red-500/30 bg-red-500/5" :
      isDone ? "border-green-500/20 bg-green-500/5" :
      "border-border bg-card"
    )}>
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
            {tarefa.prazo ? new Date(tarefa.prazo).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }) : "Sem prazo"}
          </span>
          {tarefa.prioridade !== "baixa" && (
            <span className={cn("text-[10px] font-medium px-1.5 py-0.5 rounded", prior.bg, prior.text)}>
              {prior.label}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function KanbanCard({ tarefa }: { tarefa: DBTask }) {
  const prior = prioridadeColors[tarefa.prioridade as keyof typeof prioridadeColors] || prioridadeColors.normal;
  const iniciais = tarefa.profiles?.full_name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || "??";

  return (
    <div className="rounded-lg border border-border bg-card p-3 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
      <p className="text-sm font-medium text-foreground leading-snug">{tarefa.titulo}</p>
      <div className="mt-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-background border border-border text-[10px] font-medium text-foreground">{iniciais}</span>
          <span className={cn("text-[10px] font-medium px-1.5 py-0.5 rounded-full", prior.bg, prior.text)}>{prior.label}</span>
        </div>
        <span className="text-[10px] text-muted flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {tarefa.prazo ? new Date(tarefa.prazo).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }) : "---"}
        </span>
      </div>
    </div>
  );
}

