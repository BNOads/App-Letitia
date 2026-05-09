import { useState } from "react";
import { tarefasMock, type Tarefa, prioridadeColors } from "@/data/mockData";
import { Plus, Search, ChevronDown, ChevronUp, Clock, AlertCircle, CheckCircle2, CalendarClock, SkipForward, Square, CheckSquare2, Filter, LayoutGrid, List } from "lucide-react";
import { cn } from "@/lib/utils";

type ViewMode = "lista" | "kanban";
type TabFilter = "minhas" | "time";

const kanbanColumns = [
  { id: "a_fazer" as const, label: "A Fazer", color: "border-t-gray-400" },
  { id: "em_progresso" as const, label: "Em Progresso", color: "border-t-blue-400" },
  { id: "revisao" as const, label: "Revisão", color: "border-t-amber-400" },
  { id: "concluido" as const, label: "Concluído", color: "border-t-green-400" },
];

export function Tarefas() {
  const [tarefas, setTarefas] = useState<Tarefa[]>(tarefasMock);
  const [view, setView] = useState<ViewMode>("lista");
  const [tab, setTab] = useState<TabFilter>("minhas");
  const [busca, setBusca] = useState("");
  const [showConcluidas, setShowConcluidas] = useState(true);
  const [showAtrasadas, setShowAtrasadas] = useState(true);
  const [showHoje, setShowHoje] = useState(true);
  const [showProximas, setShowProximas] = useState(true);

  const hoje = new Date().toISOString().split("T")[0];

  const filtradas = tarefas.filter((t) =>
    t.titulo.toLowerCase().includes(busca.toLowerCase()) ||
    t.responsavel.nome.toLowerCase().includes(busca.toLowerCase())
  );

  const pendentes = filtradas.filter((t) => t.status !== "concluido");
  const concluidas = filtradas.filter((t) => t.status === "concluido");
  const atrasadas = pendentes.filter((t) => t.prazo < hoje);
  const paraHoje = pendentes.filter((t) => t.prazo === hoje);
  const proximas = pendentes.filter((t) => t.prazo > hoje);
  const altaPrioridade = pendentes.filter((t) => t.prioridade === "alta");

  const totalTarefas = filtradas.length;
  const progresso = totalTarefas > 0 ? Math.round((concluidas.length / totalTarefas) * 100) : 0;

  const toggleConcluida = (id: string) => {
    setTarefas((prev) =>
      prev.map((t) =>
        t.id === id
          ? { ...t, status: t.status === "concluido" ? "a_fazer" : "concluido" as Tarefa["status"] }
          : t
      )
    );
  };

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
              action={
                <button className="text-[11px] font-medium text-letitia-clay bg-letitia-clay/10 px-3 py-1 rounded-md hover:bg-letitia-clay/20 transition-colors flex items-center gap-1">
                  <SkipForward className="h-3 w-3" /> Adiar para Hoje
                </button>
              }
            >
              {atrasadas.map((t) => (
                <TaskRow key={t.id} tarefa={t} onToggle={toggleConcluida} isOverdue />
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
              paraHoje.map((t) => <TaskRow key={t.id} tarefa={t} onToggle={toggleConcluida} />)
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
            {proximas.map((t) => <TaskRow key={t.id} tarefa={t} onToggle={toggleConcluida} />)}
          </TaskSection>

          {/* Seção: Concluídas */}
          <TaskSection
            label={`Concluídas hoje`}
            count={concluidas.length}
            icon={<CheckCircle2 className="h-4 w-4 text-green-500" />}
            color="text-green-500"
            open={showConcluidas}
            onToggle={() => setShowConcluidas(!showConcluidas)}
          >
            {concluidas.map((t) => <TaskRow key={t.id} tarefa={t} onToggle={toggleConcluida} isDone />)}
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

function TaskSection({ label, count, icon, color, open, onToggle, action, children }: {
  label: string; count: number; icon: React.ReactNode; color: string;
  open: boolean; onToggle: () => void; action?: React.ReactNode; children: React.ReactNode;
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
        {action}
      </div>
      {open && <div className="space-y-1">{children}</div>}
    </div>
  );
}

function TaskRow({ tarefa, onToggle, isOverdue, isDone }: {
  tarefa: Tarefa; onToggle: (id: string) => void; isOverdue?: boolean; isDone?: boolean;
}) {
  const prior = prioridadeColors[tarefa.prioridade];

  return (
    <div className={cn(
      "flex items-center gap-3 px-4 py-3 rounded-lg border transition-all cursor-pointer hover:shadow-sm group",
      isOverdue ? "border-red-500/30 bg-red-500/5" :
      isDone ? "border-green-500/20 bg-green-500/5" :
      "border-border bg-card"
    )}>
      {/* Checkbox */}
      <button
        onClick={(e) => { e.stopPropagation(); onToggle(tarefa.id); }}
        className="flex-shrink-0"
      >
        {isDone ? (
          <CheckSquare2 className="h-5 w-5 text-green-500" />
        ) : (
          <Square className={cn("h-5 w-5", isOverdue ? "text-red-400" : "text-border group-hover:text-muted")} />
        )}
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className={cn("text-sm font-medium leading-snug", isDone ? "line-through text-muted" : "text-foreground")}>
          {tarefa.titulo}
        </p>
        <div className="flex items-center gap-3 mt-1 flex-wrap">
          {/* Responsável */}
          <span className="flex items-center gap-1.5 text-[11px] text-muted">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-background border border-border text-[9px] font-medium text-foreground">
              {tarefa.responsavel.iniciais}
            </span>
            {tarefa.responsavel.nome.split(" ")[0]}
          </span>
          {/* Data */}
          <span className={cn("flex items-center gap-1 text-[11px]", isOverdue ? "text-red-500 font-medium" : "text-muted")}>
            <Clock className="h-3 w-3" />
            {new Date(tarefa.prazo).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
          </span>
          {/* Prioridade */}
          {tarefa.prioridade !== "baixa" && (
            <span className={cn("text-[10px] font-medium px-1.5 py-0.5 rounded", prior.bg, prior.text)}>
              {prior.label}
            </span>
          )}
        </div>
      </div>

      {/* Subtarefas progress */}
      {tarefa.subtarefas && tarefa.subtarefas.length > 0 && !isDone && (
        <div className="hidden sm:flex items-center gap-2">
          <div className="w-16 h-1.5 rounded-full bg-border overflow-hidden">
            <div className="h-full bg-letitia-gold rounded-full" style={{ width: `${(tarefa.subtarefas.filter(s => s.concluida).length / tarefa.subtarefas.length) * 100}%` }} />
          </div>
          <span className="text-[10px] text-muted">{tarefa.subtarefas.filter(s => s.concluida).length}/{tarefa.subtarefas.length}</span>
        </div>
      )}
    </div>
  );
}

function KanbanCard({ tarefa }: { tarefa: Tarefa }) {
  const prior = prioridadeColors[tarefa.prioridade];
  return (
    <div className="rounded-lg border border-border bg-card p-3 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
      <p className="text-sm font-medium text-foreground leading-snug">{tarefa.titulo}</p>
      {tarefa.subtarefas && tarefa.subtarefas.length > 0 && (
        <div className="mt-2">
          <div className="h-1.5 w-full rounded-full bg-border overflow-hidden">
            <div className="h-full bg-letitia-gold rounded-full" style={{ width: `${(tarefa.subtarefas.filter(s => s.concluida).length / tarefa.subtarefas.length) * 100}%` }} />
          </div>
          <p className="text-[10px] text-muted mt-1">{tarefa.subtarefas.filter(s => s.concluida).length}/{tarefa.subtarefas.length} subtarefas</p>
        </div>
      )}
      <div className="mt-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-background border border-border text-[10px] font-medium text-foreground">{tarefa.responsavel.iniciais}</span>
          <span className={cn("text-[10px] font-medium px-1.5 py-0.5 rounded-full", prior.bg, prior.text)}>{prior.label}</span>
        </div>
        <span className="text-[10px] text-muted flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {new Date(tarefa.prazo).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
        </span>
      </div>
    </div>
  );
}
