import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { getTasks, updateTaskStatus, createTask, createBulkTasks, updateTask, deleteTask, deleteRecurringTaskSeries, getTaskComments, addTaskComment, saveTaskHistory, getTaskHistory, exportTaskHistory, recurrenceLabels, getSubtasks, createSubtask, toggleSubtask, deleteSubtask, updateSubtask, getAllSubtasks, getTaskTemplates, createTaskTemplate, deleteTaskTemplate, createTaskFromTemplate, createBulkSubtasks, type DBTask, type TaskStatus, type TaskPriority, type TaskComment, type RecurrenceType, type TaskHistoryEntry, type DBSubtask, type DBTaskTemplate } from "@/services/taskService";
import { getProfiles, updateProfile, type DBProfile } from "@/services/profileService";
import { notifyTaskCompleted, notifyNewTaskAssigned } from "@/services/notificationService";
import { prioridadeColors } from "@/data/mockData";
import { 
  Plus, Search, ChevronDown, ChevronUp, Clock, AlertCircle, CheckCircle2, 
  CalendarClock, Square, CheckSquare2, LayoutGrid, List, Loader2, X, 
  Trash2, History, MessageSquare, Send, User, Edit3, Copy, Check, Repeat,
  Download, Calendar, FileText, Layers, Filter, Flag, BookTemplate, ListChecks,
  GripVertical, AlignLeft
} from "lucide-react";
import { cn } from "@/lib/utils";
import { UserSelector } from "@/components/UserSelector";
import { TiptapEditor } from "@/components/TiptapEditor";

type ViewMode = "lista" | "kanban";
type TabFilter = "minhas" | "time" | "aprovacoes";

const kanbanColumns = [
  { id: "fazer" as const, label: "A Fazer", color: "border-t-gray-400" },
  { id: "progresso" as const, label: "Em Progresso", color: "border-t-blue-400" },
  { id: "revisao" as const, label: "Revisão", color: "border-t-amber-400" },
  { id: "concluido" as const, label: "Concluído", color: "border-t-green-400" },
];

export function Tarefas() {
  const location = useLocation();
  const { user, loading: authLoading } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [tarefas, setTarefas] = useState<DBTask[]>([]);
  const [allSubtasks, setAllSubtasks] = useState<(DBSubtask & { tarefas?: { titulo: string; id: string } | null })[]>([]);
  const [profiles, setProfiles] = useState<DBProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState<string>("Todas");
  const [filtroPrioridade, setFiltroPrioridade] = useState<string>("Todas");
  const [filtroPessoa, setFiltroPessoa] = useState<string>("Todas");
  const [filtroData, setFiltroData] = useState<string>("Todas as datas");
  const [showConcluidas, setShowConcluidas] = useState(true);
  const [showAtrasadas, setShowAtrasadas] = useState(true);
  const [showHoje, setShowHoje] = useState(true);
  const [showProximas, setShowProximas] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [editingTarefa, setEditingTarefa] = useState<DBTask | null>(null);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [defaultResponsavelId, setDefaultResponsavelId] = useState<string | undefined>(undefined);

  // URL-driven state: tab, view, selectedTarefa
  const tab = (searchParams.get('tab') as TabFilter) || 'minhas';
  const view = (searchParams.get('view') as ViewMode) || 'lista';
  const selectedTaskId = searchParams.get('task');

  const setTab = useCallback((newTab: TabFilter) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      next.set('tab', newTab);
      next.delete('task');
      return next;
    }, { replace: true });
  }, [setSearchParams]);

  const setView = useCallback((newView: ViewMode) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      next.set('view', newView);
      return next;
    }, { replace: true });
  }, [setSearchParams]);

  const setSelectedTarefa = useCallback((t: DBTask | null) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      if (t) {
        next.set('task', t.id);
      } else {
        next.delete('task');
      }
      return next;
    }, { replace: true });
  }, [setSearchParams]);

  // Resolve selectedTarefa from URL param
  const selectedTarefa = selectedTaskId ? tarefas.find(t => t.id === selectedTaskId) || null : null;

  // Bulk selection state
  const [bulkSelectMode, setBulkSelectMode] = useState(false);
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(new Set());
  const [bulkUpdating, setBulkUpdating] = useState(false);

  const hoje = new Date().toISOString().split("T")[0];

  useEffect(() => {
    if (!authLoading && user) {
      fetchData();
    }
  }, [user, authLoading]);

  // Handle navigation from global search
  useEffect(() => {
    const state = location.state as { openTarefaId?: string } | null;
    if (state?.openTarefaId && tarefas.length > 0) {
      const target = tarefas.find(t => t.id === state.openTarefaId);
      if (target) {
        setSelectedTarefa(target);
        // Switch to "time" tab to ensure the task is visible
        setTab("time");
      }
      window.history.replaceState({}, document.title);
    }
  }, [location.state, tarefas]);

  async function fetchData() {
    try {
      const [tasksData, profilesData, subsData] = await Promise.all([
        getTasks(), 
        getProfiles(),
        getAllSubtasks()
      ]);
      setTarefas(tasksData);
      setProfiles(profilesData);
      setAllSubtasks(subsData);
    } catch (error) {
      console.error("Erro ao buscar dados:", error);
    } finally {
      setLoading(false);
    }
  }

  const fetchTarefas = async () => {
    try {
      const [data, subsData] = await Promise.all([getTasks(), getAllSubtasks()]);
      setTarefas(data);
      setAllSubtasks(subsData);
      if (selectedTarefa) {
        const updated = data.find(t => t.id === selectedTarefa.id);
        if (updated) setSelectedTarefa(updated);
      }
    } catch (error) {
      console.error("Erro ao buscar tarefas:", error);
    }
  };

  // Convert subtasks to virtual task entries for display in lists
  const subtasksAsTasks: (DBTask & { __isSubtask?: boolean; __parentTitle?: string; __parentId?: string; __subtaskId?: string })[] = allSubtasks
    .filter(s => !s.concluida)
    .map(s => ({
      id: `sub_${s.id}`,
      titulo: s.titulo,
      descricao: '',
      prioridade: 'normal' as TaskPriority,
      status: (s.concluida ? 'concluido' : 'fazer') as TaskStatus,
      responsavel_id: s.responsavel_id,
      prazo: s.prazo,
      created_at: s.created_at,
      updated_at: s.created_at,
      profiles: s.profiles || null,
      __isSubtask: true,
      __parentTitle: s.tarefas?.titulo || '',
      __parentId: s.tarefa_id,
      __subtaskId: s.id,
    }));

  const filtradas = tarefas.filter((t) => {
    const matchBusca = t.titulo.toLowerCase().includes(busca.toLowerCase()) ||
                       t.profiles?.full_name?.toLowerCase().includes(busca.toLowerCase()) || false;
    
    if (tab === "minhas" && t.responsavel_id !== user?.id) return false;
    if (!matchBusca) return false;

    // Filtro de status
    if (filtroStatus !== "Todas") {
      if (filtroStatus === "fazer" && t.status !== "fazer") return false;
      if (filtroStatus === "progresso" && t.status !== "progresso") return false;
      if (filtroStatus === "revisao" && t.status !== "revisao") return false;
      if (filtroStatus === "concluido" && t.status !== "concluido") return false;
    }

    // Filtro de prioridade
    if (filtroPrioridade !== "Todas" && t.prioridade !== filtroPrioridade) return false;

    // Filtro de pessoa
    if (filtroPessoa !== "Todas" && t.responsavel_id !== filtroPessoa) return false;

    // Filtro de data
    if (filtroData !== "Todas as datas") {
      if (filtroData === "hoje" && t.prazo !== hoje) return false;
      if (filtroData === "atrasadas" && (!t.prazo || t.prazo >= hoje)) return false;
      if (filtroData === "semana") {
        const semana = new Date();
        semana.setDate(semana.getDate() + 7);
        const semanaStr = semana.toISOString().split('T')[0];
        if (!t.prazo || t.prazo > semanaStr || t.prazo < hoje) return false;
      }
      if (filtroData === "mes") {
        const mes = new Date();
        mes.setDate(mes.getDate() + 30);
        const mesStr = mes.toISOString().split('T')[0];
        if (!t.prazo || t.prazo > mesStr || t.prazo < hoje) return false;
      }
      if (filtroData === "sem_prazo" && t.prazo) return false;
    }

    return true;
  });

  // Filter subtasks the same way as tasks (tab + person filter)
  const filteredSubtasks = subtasksAsTasks.filter(s => {
    if (tab === "minhas" && s.responsavel_id !== user?.id) return false;
    if (filtroPessoa !== "Todas" && s.responsavel_id !== filtroPessoa) return false;
    const matchBusca = s.titulo.toLowerCase().includes(busca.toLowerCase()) ||
                       s.profiles?.full_name?.toLowerCase().includes(busca.toLowerCase()) || false;
    if (!matchBusca) return false;
    return true;
  });

  const allItems = [...filtradas, ...filteredSubtasks];
  const pendentes = allItems.filter((t) => t.status !== "concluido");
  const concluidas = allItems.filter((t) => t.status === "concluido");
  const atrasadas = pendentes.filter((t) => t.prazo && t.prazo < hoje);
  const paraHoje = pendentes.filter((t) => t.prazo === hoje);
  const proximas = pendentes.filter((t) => !t.prazo || t.prazo > hoje);
  const altaPrioridade = pendentes.filter((t) => t.prioridade === "alta" || t.prioridade === "urgente");

  const totalTarefas = allItems.length;
  const progresso = totalTarefas > 0 ? Math.round((concluidas.length / totalTarefas) * 100) : 0;

  const toggleConcluida = async (id: string, currentStatus: TaskStatus) => {
    if (id.startsWith('sub_')) {
      const realId = id.replace('sub_', '');
      const newVal = currentStatus !== 'concluido';
      setAllSubtasks(prev => prev.map(s => s.id === realId ? { ...s, concluida: newVal } : s));
      try { 
        await toggleSubtask(realId, newVal); 
        const sub = allSubtasks.find(s => s.id === realId);
        if (sub && sub.titulo.startsWith('Aprovação:') && newVal === true) {
          await updateTask(sub.tarefa_id, { em_aprovacao: false });
          saveTaskHistory({
             tarefa_id: sub.tarefa_id,
             titulo: sub.tarefas?.titulo || 'Tarefa',
             prioridade: 'normal',
             status: 'fazer',
             action: 'editada',
             details: `Aprovação concluída`
          });
          fetchTarefas();
        }
      } catch { fetchTarefas(); }
      return;
    }

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
        // Notify everyone when a task is completed
        if (newStatus === 'concluido' && user) {
          const userName = profiles.find(p => p.id === user.id)?.full_name || 'Alguém';
          notifyTaskCompleted(tarefa.titulo, tarefa.id, user.id, userName);
        }
      }
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
      fetchTarefas();
    }
  };

  const handleSendToApproval = async (tarefa: DBTask) => {
    const approvers = profiles.filter(p => p.metadata?.is_approver);
    if (approvers.length === 0) {
      alert("Nenhum gerente de aprovações configurado. Peça para a Diretoria/CEO configurar na aba Aprovações.");
      return;
    }
    
    try {
      await updateTask(tarefa.id, { em_aprovacao: true });
      
      // Cria sub-tarefa para cada aprovador (ou apenas o primeiro)
      const approver = approvers[0]; // Pega o primeiro por padrão
      await createSubtask({
        tarefa_id: tarefa.id,
        titulo: `Aprovação: ${tarefa.titulo}`,
        concluida: false,
        responsavel_id: approver.id,
        ordem: 0,
      });

      saveTaskHistory({
        tarefa_id: tarefa.id,
        titulo: tarefa.titulo,
        prioridade: tarefa.prioridade,
        status: tarefa.status,
        responsavel_nome: tarefa.profiles?.full_name || undefined,
        responsavel_id: tarefa.responsavel_id,
        prazo: tarefa.prazo,
        action: 'editada',
        details: `Enviada para aprovação de ${approver.full_name}`,
      });

      fetchTarefas();
      setTab("aprovacoes");
      setSelectedTarefa(null);
    } catch (error) {
      console.error("Erro ao enviar para aprovação:", error);
    }
  };

  const toggleApprover = async (profileId: string) => {
    const profile = profiles.find(p => p.id === profileId);
    if (!profile) return;
    const isCurrentlyApprover = profile.metadata?.is_approver;
    const newMetadata = profile.metadata ? { ...profile.metadata, is_approver: !isCurrentlyApprover } : { is_approver: !isCurrentlyApprover };
    
    // Atualização otimista na interface para não parecer que travou
    setProfiles(prev => prev.map(p => p.id === profileId ? { ...p, metadata: newMetadata } : p));
    
    try {
      await updateProfile(profileId, { metadata: newMetadata });
      // Se tiver sucesso, revalida silenciosamente
      fetchTarefas();
    } catch (e: any) {
      console.error("Erro ao atualizar aprovador:", e);
      // Reverte
      setProfiles(prev => prev.map(p => p.id === profileId ? { ...p, metadata: profile.metadata } : p));
      alert("Falha ao salvar aprovador. Verifique as permissões do banco de dados: " + e.message);
    }
  };

  const handleTaskClick = (t: any) => {
    if (t.__isSubtask && t.__parentId) {
      const parent = tarefas.find(task => task.id === t.__parentId);
      if (parent) { setSelectedTarefa(parent); return; }
    }
    setSelectedTarefa(t);
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

  // ── Bulk selection helpers ──
  const toggleBulkSelect = (id: string) => {
    setSelectedTaskIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const selectAllVisible = () => {
    const ids = allItems.map(t => t.id);
    setSelectedTaskIds(new Set(ids));
  };

  const clearSelection = () => {
    setSelectedTaskIds(new Set());
  };

  const exitBulkMode = () => {
    setBulkSelectMode(false);
    clearSelection();
  };

  const handleBulkStatusChange = async (status: TaskStatus) => {
    if (selectedTaskIds.size === 0) return;
    setBulkUpdating(true);
    try {
      await Promise.all(
        Array.from(selectedTaskIds).map(id => {
          if (id.startsWith('sub_')) {
            const realId = id.replace('sub_', '');
            return updateSubtask(realId, { concluida: status === 'concluido' });
          }
          return updateTaskStatus(id, status);
        })
      );
      clearSelection();
      await fetchTarefas();
    } catch (err) {
      console.error('Erro ao atualizar tarefas em massa:', err);
    } finally {
      setBulkUpdating(false);
    }
  };

  const handleBulkFieldUpdate = async (updates: Partial<DBTask>) => {
    if (selectedTaskIds.size === 0) return;
    setBulkUpdating(true);
    try {
      await Promise.all(
        Array.from(selectedTaskIds).map(id => {
          if (id.startsWith('sub_')) {
            const realId = id.replace('sub_', '');
            const subUpdates: any = {};
            if (updates.responsavel_id !== undefined) subUpdates.responsavel_id = updates.responsavel_id;
            if (updates.prazo !== undefined) subUpdates.prazo = updates.prazo;
            if (Object.keys(subUpdates).length > 0) {
              return updateSubtask(realId, subUpdates);
            }
            return Promise.resolve();
          }
          return updateTask(id, updates);
        })
      );
      clearSelection();
      await fetchTarefas();
    } catch (err) {
      console.error('Erro ao atualizar tarefas em massa:', err);
    } finally {
      setBulkUpdating(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedTaskIds.size === 0) return;
    if (!confirm(`Tem certeza que deseja excluir ${selectedTaskIds.size} item(ns)?`)) return;
    setBulkUpdating(true);
    try {
      for (const id of selectedTaskIds) {
        if (id.startsWith('sub_')) {
          const realId = id.replace('sub_', '');
          await deleteSubtask(realId);
          continue;
        }
        const tarefa = tarefas.find(t => t.id === id);
        if (tarefa) {
          saveTaskHistory({
            tarefa_id: id, titulo: tarefa.titulo, prioridade: tarefa.prioridade,
            status: tarefa.status, responsavel_nome: tarefa.profiles?.full_name || undefined,
            responsavel_id: tarefa.responsavel_id, prazo: tarefa.prazo,
            action: 'excluida', details: 'Excluída em lote',
          });
        }
        await deleteTask(id);
      }
      clearSelection();
      setBulkSelectMode(false);
      await fetchTarefas();
    } catch (err) {
      console.error('Erro ao excluir tarefas em massa:', err);
    } finally {
      setBulkUpdating(false);
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
            onClick={() => setIsTemplateModalOpen(true)}
            className="rounded-md border border-violet-500/30 bg-violet-500/5 px-3 py-2 text-sm font-medium text-violet-600 dark:text-violet-400 hover:bg-violet-500/10 transition-all flex items-center gap-2"
          >
            <BookTemplate className="h-4 w-4" /> Modelos
          </button>
          <button 
            onClick={() => setIsBulkModalOpen(true)}
            className="rounded-md border border-primary/30 bg-primary/5 px-3 py-2 text-sm font-medium text-primary hover:bg-primary/10 transition-all flex items-center gap-2"
          >
            <Layers className="h-4 w-4" /> Em Massa
          </button>
          <button
            onClick={() => { if (bulkSelectMode) exitBulkMode(); else setBulkSelectMode(true); }}
            className={cn(
              "rounded-md border px-3 py-2 text-sm font-medium transition-all flex items-center gap-2",
              bulkSelectMode
                ? "border-amber-500 bg-amber-500 text-white shadow-lg shadow-amber-500/25"
                : "border-border text-muted hover:text-foreground hover:bg-foreground/5"
            )}
            title="Selecionar tarefas em massa"
          >
            <CheckSquare2 className="h-4 w-4" />
            {bulkSelectMode ? "Cancelar Seleção" : "Selecionar"}
          </button>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-all flex items-center gap-2"
          >
            <Plus className="h-4 w-4" /> Nova Tarefa
          </button>
        </div>
      </div>

      {/* Barra de busca */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
          <input
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full rounded-md border border-border bg-card pl-9 pr-3 py-2 text-sm text-foreground placeholder:text-muted focus:ring-2 focus:ring-letitia-gold focus:outline-none"
            placeholder="Buscar tarefas..."
          />
        </div>

        {/* Filtro Status */}
        <div className="relative">
          <Flag className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted pointer-events-none" />
          <select
            value={filtroStatus}
            onChange={e => setFiltroStatus(e.target.value)}
            className="appearance-none rounded-md border border-border bg-card pl-8 pr-7 py-2 text-xs font-medium text-foreground focus:ring-2 focus:ring-letitia-gold focus:outline-none cursor-pointer"
          >
            <option value="Todas">Todas</option>
            <option value="fazer">A fazer</option>
            <option value="progresso">Em progresso</option>
            <option value="revisao">Em revisão</option>
            <option value="concluido">Concluídas</option>
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted pointer-events-none" />
        </div>

        {/* Filtro Prioridade */}
        <div className="relative">
          <Filter className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted pointer-events-none" />
          <select
            value={filtroPrioridade}
            onChange={e => setFiltroPrioridade(e.target.value)}
            className={cn("appearance-none rounded-md border bg-card pl-8 pr-7 py-2 text-xs font-medium text-foreground focus:ring-2 focus:ring-letitia-gold focus:outline-none cursor-pointer", filtroPrioridade !== "Todas" ? "border-letitia-gold ring-1 ring-letitia-gold/30" : "border-border")}
          >
            <option value="Todas">Todas</option>
            <option value="baixa">Baixa</option>
            <option value="normal">Normal</option>
            <option value="alta">Alta</option>
            <option value="urgente">Urgente</option>
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted pointer-events-none" />
        </div>

        {/* Filtro Data */}
        <div className="relative">
          <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted pointer-events-none" />
          <select
            value={filtroData}
            onChange={e => setFiltroData(e.target.value)}
            className="appearance-none rounded-md border border-border bg-card pl-8 pr-7 py-2 text-xs font-medium text-foreground focus:ring-2 focus:ring-letitia-gold focus:outline-none cursor-pointer"
          >
            <option value="Todas as datas">Todas as datas</option>
            <option value="hoje">Hoje</option>
            <option value="atrasadas">Atrasadas</option>
            <option value="semana">Próximos 7 dias</option>
            <option value="mes">Próximos 30 dias</option>
            <option value="sem_prazo">Sem prazo</option>
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted pointer-events-none" />
        </div>
      </div>

      {/* Tabs + View mode + Filtro Pessoa */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between border-b border-border pb-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-card border border-border rounded-lg p-1">
            <button onClick={() => setTab("minhas")} className={cn("px-4 py-1.5 rounded-md text-sm font-medium transition-all", tab === "minhas" ? "bg-primary text-primary-foreground" : "text-muted hover:text-foreground")}>
              Minhas Tarefas
            </button>
            <button onClick={() => setTab("time")} className={cn("px-4 py-1.5 rounded-md text-sm font-medium transition-all", tab === "time" ? "bg-primary text-primary-foreground" : "text-muted hover:text-foreground")}>
              Time
            </button>
            <button onClick={() => setTab("aprovacoes")} className={cn("px-4 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-1", tab === "aprovacoes" ? "bg-red-500 text-white" : "text-muted hover:text-foreground")}>
              <CheckCircle2 className="h-4 w-4" /> Aprovações
            </button>
          </div>

          {/* Filtro por Pessoa */}
          {tab === "time" && (
            <div className="relative">
              <User className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted pointer-events-none" />
              <select
                value={filtroPessoa}
                onChange={e => setFiltroPessoa(e.target.value)}
                className="appearance-none rounded-md border border-border bg-card pl-8 pr-7 py-2 text-xs font-medium text-foreground focus:ring-2 focus:ring-letitia-gold focus:outline-none cursor-pointer"
              >
                <option value="Todas">Todas as pessoas</option>
                {profiles.map(p => (
                  <option key={p.id} value={p.id}>{p.full_name}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted pointer-events-none" />
            </div>
          )}
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

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <KPIBox icon={<Clock className="h-4 w-4 text-muted" />} label="Pendentes" value={pendentes.length} />
        <KPIBox icon={<CheckCircle2 className="h-4 w-4 text-green-500" />} label="Concluídas" value={concluidas.length} />
        <KPIBox icon={<AlertCircle className="h-4 w-4 text-red-500" />} label="Atrasadas" value={atrasadas.length} color="text-red-500" />
        <KPIBox icon={<CalendarClock className="h-4 w-4 text-amber-500" />} label="Alta prioridade" value={altaPrioridade.length} />
      </div>

      {tab === "aprovacoes" ? (
        <AprovacoesView
          tarefas={tarefas.filter(t => t.em_aprovacao)}
          profiles={profiles}
          onTaskClick={setSelectedTarefa}
          onToggleApprover={toggleApprover}
        />
      ) : tab === "time" ? (
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
            setDefaultResponsavelId(profileId !== '__none__' ? profileId : undefined);
            setIsModalOpen(true);
          }}
          busca={busca}
          bulkSelectMode={bulkSelectMode}
          selectedTaskIds={selectedTaskIds}
          onBulkToggle={toggleBulkSelect}
          onBulkSelectPerson={(ids) => {
            setSelectedTaskIds(prev => {
              const next = new Set(prev);
              const allSelected = ids.every(id => next.has(id));
              if (allSelected) { ids.forEach(id => next.delete(id)); }
              else { ids.forEach(id => next.add(id)); }
              return next;
            });
          }}
          allSubtasks={allSubtasks}
          onSubtaskToggle={async (subId, newVal) => {
            setAllSubtasks(prev => prev.map(s => s.id === subId ? { ...s, concluida: newVal } : s));
            try { await toggleSubtask(subId, newVal); } catch { fetchTarefas(); }
          }}
          onTaskUpdate={async (taskId, updates) => {
            await updateTask(taskId, updates);
            fetchTarefas();
          }}
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
                <TaskRow key={t.id} tarefa={t} onClick={() => bulkSelectMode ? toggleBulkSelect(t.id) : handleTaskClick(t)} onToggle={() => toggleConcluida(t.id, t.status)} onEdit={setEditingTarefa} onDelete={handleDeleteTask} isOverdue bulkSelectMode={bulkSelectMode} isSelected={selectedTaskIds.has(t.id)} onBulkToggle={() => toggleBulkSelect(t.id)} onUpdate={async (id, u) => { await updateTask(id, u); fetchTarefas(); }} profiles={profiles} />
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
              paraHoje.map((t) => <TaskRow key={t.id} tarefa={t} onClick={() => bulkSelectMode ? toggleBulkSelect(t.id) : handleTaskClick(t)} onToggle={() => toggleConcluida(t.id, t.status)} onEdit={setEditingTarefa} onDelete={handleDeleteTask} bulkSelectMode={bulkSelectMode} isSelected={selectedTaskIds.has(t.id)} onBulkToggle={() => toggleBulkSelect(t.id)} onUpdate={async (id, u) => { await updateTask(id, u); fetchTarefas(); }} profiles={profiles} />)
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
            {proximas.map((t) => <TaskRow key={t.id} tarefa={t} onClick={() => bulkSelectMode ? toggleBulkSelect(t.id) : handleTaskClick(t)} onToggle={() => toggleConcluida(t.id, t.status)} onEdit={setEditingTarefa} onDelete={handleDeleteTask} bulkSelectMode={bulkSelectMode} isSelected={selectedTaskIds.has(t.id)} onBulkToggle={() => toggleBulkSelect(t.id)} onUpdate={async (id, u) => { await updateTask(id, u); fetchTarefas(); }} profiles={profiles} />)}
          </TaskSection>

          <TaskSection
            label={`Concluídas`}
            count={concluidas.length}
            icon={<CheckCircle2 className="h-4 w-4 text-green-500" />}
            color="text-green-500"
            open={showConcluidas}
            onToggle={() => setShowConcluidas(!showConcluidas)}
          >
            {concluidas.map((t) => <TaskRow key={t.id} tarefa={t} onClick={() => bulkSelectMode ? toggleBulkSelect(t.id) : handleTaskClick(t)} onToggle={() => toggleConcluida(t.id, t.status)} onEdit={setEditingTarefa} onDelete={handleDeleteTask} isDone bulkSelectMode={bulkSelectMode} isSelected={selectedTaskIds.has(t.id)} onBulkToggle={() => toggleBulkSelect(t.id)} onUpdate={async (id, u) => { await updateTask(id, u); fetchTarefas(); }} profiles={profiles} />)}
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
                    <KanbanCard key={t.id} tarefa={t} onClick={() => bulkSelectMode ? toggleBulkSelect(t.id) : handleTaskClick(t)} onEdit={setEditingTarefa} onDelete={handleDeleteTask} bulkSelectMode={bulkSelectMode} isSelected={selectedTaskIds.has(t.id)} onBulkToggle={() => toggleBulkSelect(t.id)} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {(isModalOpen || editingTarefa) && (
        <NovoTarefaModal 
          onClose={() => { setIsModalOpen(false); setEditingTarefa(null); setDefaultResponsavelId(undefined); }} 
          onSuccess={() => { setIsModalOpen(false); setEditingTarefa(null); setDefaultResponsavelId(undefined); fetchTarefas(); }} 
          tarefa={editingTarefa}
          profiles={profiles}
          defaultResponsavelId={defaultResponsavelId}
        />
      )}

      {isBulkModalOpen && (
        <BulkTaskModal
          profiles={profiles}
          onClose={() => setIsBulkModalOpen(false)}
          onSuccess={() => { setIsBulkModalOpen(false); fetchTarefas(); }}
        />
      )}

      {isHistoryOpen && (
        <TaskHistoryModal onClose={() => setIsHistoryOpen(false)} />
      )}

      {isTemplateModalOpen && (
        <TaskTemplateModal
          profiles={profiles}
          onClose={() => setIsTemplateModalOpen(false)}
          onTaskCreated={() => { setIsTemplateModalOpen(false); fetchTarefas(); }}
        />
      )}

      {selectedTarefa && (
        <TaskDetailModal
          tarefa={selectedTarefa}
          profiles={profiles}
          onClose={() => setSelectedTarefa(null)}
          onEdit={(t) => { setSelectedTarefa(null); setEditingTarefa(t); }}
          onDelete={handleDeleteTask}
          onSendToApproval={handleSendToApproval}
          onStatusChange={async (status) => {
            setSelectedTarefa(prev => prev ? { ...prev, status } : null);
            await updateTaskStatus(selectedTarefa.id, status);
            fetchTarefas();
          }}
          onUpdate={async (updates) => {
            setSelectedTarefa(prev => prev ? { ...prev, ...updates } : null);
            await updateTask(selectedTarefa.id, updates);
            fetchTarefas();
          }}
        />
      )}

      {/* ── Bulk Action Bar ── */}
      {bulkSelectMode && (
        <BulkActionBar
          selectedCount={selectedTaskIds.size}
          totalCount={allItems.length}
          onSelectAll={selectAllVisible}
          onClearSelection={clearSelection}
          onStatusChange={handleBulkStatusChange}
          onFieldUpdate={handleBulkFieldUpdate}
          onDelete={handleBulkDelete}
          onCancel={exitBulkMode}
          profiles={profiles}
          isUpdating={bulkUpdating}
        />
      )}
    </div>
  );
}

function AprovacoesView({ tarefas, profiles, onTaskClick, onToggleApprover }: any) {
  const { user } = useAuth();
  const currentUser = profiles.find((p: any) => p.id === user?.id);
  const isAdmin = currentUser?.role === "CEO" || currentUser?.role === "Diretoria" || currentUser?.role === "Admin" || currentUser?.role === "Administrador" || currentUser?.role === "Administração";

  return (
    <div className="space-y-6">
      {(isAdmin || true) && (
        <div className="rounded-xl border border-border bg-card p-4 space-y-4 shadow-sm">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-red-500" />
            <h3 className="text-lg font-medium">Configuração de Aprovações</h3>
          </div>
          <p className="text-sm text-muted">Selecione os gerentes de projeto que receberão as subtarefas de aprovação.</p>
          <div className="flex flex-wrap gap-2">
            {profiles.map((p: any) => {
              const isApprover = p.metadata?.is_approver;
              return (
                <button
                  key={p.id}
                  onClick={() => onToggleApprover(p.id)}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-sm font-medium transition-all flex items-center gap-2 border",
                    isApprover 
                      ? "bg-red-500/10 text-red-600 border-red-500/30" 
                      : "bg-background text-muted hover:bg-foreground/5 border-border"
                  )}
                >
                  <img src={p.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(p.full_name || "")}&background=random`} alt="" className="w-5 h-5 rounded-full" />
                  {p.full_name}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div>
        <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
          Tarefas Aguardando Aprovação
          <span className="bg-red-100 text-red-700 text-xs py-0.5 px-2 rounded-full dark:bg-red-900/30 dark:text-red-400">
            {tarefas.length}
          </span>
        </h3>
        
        {tarefas.length === 0 ? (
          <div className="p-8 text-center text-muted border border-dashed border-border rounded-xl">
            Nenhuma tarefa pendente de aprovação.
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {tarefas.map((t: any) => (
              <div 
                key={t.id} 
                onClick={() => onTaskClick(t)}
                className="bg-amber-500/5 border border-amber-500/30 rounded-xl p-4 cursor-pointer hover:bg-amber-500/10 transition-all flex flex-col gap-3 relative overflow-hidden group"
              >
                <div className="absolute top-0 left-0 w-1 h-full bg-amber-500" />
                <div className="flex items-start justify-between">
                  <h4 className="font-medium text-foreground text-sm line-clamp-2">{t.titulo}</h4>
                  <span className="text-[10px] uppercase font-bold text-amber-600 bg-amber-500/20 px-2 py-1 rounded">Em Aprovação</span>
                </div>
                {t.descricao && (
                  <p className="text-xs text-muted line-clamp-2" dangerouslySetInnerHTML={{ __html: t.descricao }} />
                )}
                <div className="mt-auto flex items-center justify-between pt-2">
                  <div className="flex items-center gap-2">
                    {t.profiles && (
                      <div className="flex items-center gap-1.5">
                        <img src={t.profiles.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(t.profiles.full_name || "")}&background=random`} alt="" className="w-5 h-5 rounded-full" />
                        <span className="text-xs text-muted truncate max-w-[100px]">{t.profiles.full_name}</span>
                      </div>
                    )}
                  </div>
                  {t.prazo && (
                    <span className="text-xs text-muted flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(t.prazo + 'T12:00:00').toLocaleDateString('pt-BR')}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Modals ────────────────────────────────────────────── */

export function TaskDetailModal({ tarefa, profiles: allProfiles, onClose, onEdit, onDelete, onStatusChange, onUpdate, onSendToApproval }: {
  tarefa: DBTask;
  profiles: DBProfile[];
  onClose: () => void;
  onEdit: (t: DBTask) => void;
  onDelete: (id: string) => void;
  onStatusChange: (status: TaskStatus) => Promise<void>;
  onUpdate: (updates: Partial<DBTask>) => Promise<void>;
  onSendToApproval?: (t: DBTask) => void;
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

  // Subtask state
  const [subtasks, setSubtasks] = useState<DBSubtask[]>([]);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");
  const [newSubtaskResp, setNewSubtaskResp] = useState<string | null>(null);
  const [newSubtaskPrazo, setNewSubtaskPrazo] = useState("");
  const [addingSubtask, setAddingSubtask] = useState(false);
  const [showSubtaskForm, setShowSubtaskForm] = useState(false);
  const [editingSubtaskId, setEditingSubtaskId] = useState<string | null>(null);
  const [editSubResp, setEditSubResp] = useState<string | null>(null);
  const [editSubPrazo, setEditSubPrazo] = useState("");
  const [expandedSubtaskId, setExpandedSubtaskId] = useState<string | null>(null);
  const [editSubDesc, setEditSubDesc] = useState("");
  const [editingSubDesc, setEditingSubDesc] = useState(false);

  useEffect(() => { getTaskComments(tarefa.id).then(setComments); }, [tarefa.id]);
  useEffect(() => { getSubtasks(tarefa.id).then(setSubtasks); }, [tarefa.id]);

  const subtasksDone = subtasks.filter(s => s.concluida).length;
  const subtasksTotal = subtasks.length;
  const subtasksProgress = subtasksTotal > 0 ? Math.round((subtasksDone / subtasksTotal) * 100) : 0;

  const handleAddSubtask = async () => {
    if (!newSubtaskTitle.trim() || addingSubtask) return;
    setAddingSubtask(true);
    try {
      const sub = await createSubtask({
        tarefa_id: tarefa.id,
        titulo: newSubtaskTitle.trim(),
        concluida: false,
        responsavel_id: newSubtaskResp,
        prazo: newSubtaskPrazo || null,
        ordem: subtasks.length,
      });
      setSubtasks(prev => [...prev, sub]);
      saveTaskHistory({
         tarefa_id: tarefa.id,
         titulo: tarefa.titulo,
         prioridade: tarefa.prioridade,
         status: tarefa.status,
         action: 'editada',
         details: `Subtarefa criada: "${sub.titulo}"`
      });
      setNewSubtaskTitle("");
      setNewSubtaskResp(null);
      setNewSubtaskPrazo("");
    } catch (e) { console.error("Erro ao criar subtarefa:", e); }
    finally { setAddingSubtask(false); }
  };

  const handleToggleSubtask = async (sub: DBSubtask) => {
    const newVal = !sub.concluida;
    setSubtasks(prev => prev.map(s => s.id === sub.id ? { ...s, concluida: newVal } : s));
    try { 
      await toggleSubtask(sub.id, newVal); 
      saveTaskHistory({
         tarefa_id: tarefa.id,
         titulo: tarefa.titulo,
         prioridade: tarefa.prioridade,
         status: tarefa.status,
         action: 'editada',
         details: `Subtarefa "${sub.titulo}" marcada como ${newVal ? 'Concluída' : 'Pendente'}`
      });
      if (sub.titulo.startsWith('Aprovação:') && newVal === true) {
        await onUpdate({ em_aprovacao: false });
        saveTaskHistory({
             tarefa_id: tarefa.id,
             titulo: tarefa.titulo,
             prioridade: tarefa.prioridade,
             status: tarefa.status,
             action: 'editada',
             details: `Aprovação concluída`
        });
      }
    } catch { getSubtasks(tarefa.id).then(setSubtasks); }
  };

  const handleDeleteSubtask = async (id: string) => {
    const sub = subtasks.find(s => s.id === id);
    setSubtasks(prev => prev.filter(s => s.id !== id));
    try { 
      await deleteSubtask(id); 
      if (sub) {
        saveTaskHistory({
           tarefa_id: tarefa.id,
           titulo: tarefa.titulo,
           prioridade: tarefa.prioridade,
           status: tarefa.status,
           action: 'editada',
           details: `Subtarefa excluída: "${sub.titulo}"`
        });
      }
    } catch { getSubtasks(tarefa.id).then(setSubtasks); }
  };

  const handleSaveSubtaskEdit = async (sub: DBSubtask) => {
    try {
      await updateSubtask(sub.id, { responsavel_id: editSubResp, prazo: editSubPrazo || null });
      setSubtasks(prev => prev.map(s => s.id === sub.id ? { ...s, responsavel_id: editSubResp, prazo: editSubPrazo || null } : s));
      setEditingSubtaskId(null);
      saveTaskHistory({
         tarefa_id: tarefa.id,
         titulo: tarefa.titulo,
         prioridade: tarefa.prioridade,
         status: tarefa.status,
         action: 'editada',
         details: `Subtarefa editada: "${sub.titulo}"`
      });
    } catch (e) { console.error("Erro ao editar subtarefa:", e); }
  };

  const handleSaveSubtaskDesc = async (sub: DBSubtask) => {
    try {
      await updateSubtask(sub.id, { descricao: editSubDesc || null });
      setSubtasks(prev => prev.map(s => s.id === sub.id ? { ...s, descricao: editSubDesc || null } : s));
      setEditingSubDesc(false);
      saveTaskHistory({
         tarefa_id: tarefa.id,
         titulo: tarefa.titulo,
         prioridade: tarefa.prioridade,
         status: tarefa.status,
         action: 'editada',
         details: `Descrição da subtarefa atualizada: "${sub.titulo}"`
      });
    } catch (e) { console.error("Erro ao salvar descrição da subtarefa:", e); }
  };

  const handleExpandSubtask = (sub: DBSubtask) => {
    if (expandedSubtaskId === sub.id) {
      setExpandedSubtaskId(null);
      setEditingSubDesc(false);
    } else {
      setExpandedSubtaskId(sub.id);
      setEditSubDesc(sub.descricao || "");
      setEditingSubDesc(false);
    }
  };

  const handleQuickAddDesc = (sub: DBSubtask) => {
    setExpandedSubtaskId(sub.id);
    setEditSubDesc(sub.descricao || "");
    setEditingSubDesc(true);
  };

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
    <div className="modal-overlay modal-overlay-z60 items-center justify-center p-2 sm:p-4 md:p-8" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="relative w-full max-w-6xl max-h-[95vh] md:max-h-[90vh] bg-background border border-border rounded-2xl shadow-lg flex flex-col md:flex-row overflow-hidden modal-content">
        
        <button onClick={onClose} className="absolute top-3 right-3 z-10 h-10 w-10 flex items-center justify-center rounded-full bg-foreground/10 hover:bg-foreground/20 border border-border/50 transition-colors" title="Fechar">
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
                <div className="flex items-center gap-2">
                  <select 
                    value={tarefa.em_aprovacao ? 'aprovacao' : tarefa.status} 
                    onChange={(e) => {
                      if (e.target.value === 'aprovacao') {
                        if (onSendToApproval && !tarefa.em_aprovacao) onSendToApproval(tarefa);
                      } else {
                        if (tarefa.em_aprovacao) {
                          onUpdate({ em_aprovacao: false, status: e.target.value as TaskStatus });
                        } else {
                          onStatusChange(e.target.value as TaskStatus);
                        }
                      }
                    }} 
                    className="bg-foreground/5 hover:bg-foreground/10 px-3 py-1 rounded text-xs font-bold uppercase tracking-tight focus:outline-none transition-colors border-none cursor-pointer"
                  >
                    <option value="fazer">A Fazer</option>
                    <option value="progresso">Em Progresso</option>
                    <option value="revisao">Revisão</option>
                    <option value="concluido">Concluído</option>
                    <option value="aprovacao">Aprovação</option>
                  </select>
                  {onSendToApproval && !tarefa.em_aprovacao && (
                    <button onClick={() => onSendToApproval(tarefa)} className="flex items-center gap-1 px-2 py-1 rounded-md bg-red-500 hover:bg-red-600 shadow-sm shadow-red-500/20 text-white text-[10px] font-bold uppercase tracking-tight transition-colors">
                      <Clock className="h-3 w-3" /> <span className="hidden sm:inline">Aprovação</span>
                    </button>
                  )}
                </div>
              </Property>
              
              <Property label="Responsável">
                <div className="relative">
                  <button onClick={() => setShowResponsavelPicker(!showResponsavelPicker)} className="flex items-center gap-2 bg-foreground/5 hover:bg-foreground/10 px-2 py-1 rounded cursor-pointer transition-colors">
                    {tarefa.profiles?.avatar_url ? (
                      <img src={tarefa.profiles.avatar_url} alt="" className="h-5 w-5 rounded-full object-cover border border-letitia-gold/30" />
                    ) : (
                      <div className="h-5 w-5 rounded-full bg-letitia-gold/20 flex items-center justify-center text-[8px] font-bold text-letitia-gold border border-letitia-gold/30">
                        {tarefa.profiles?.full_name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || "??"}
                      </div>
                    )}
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
                            {p.avatar_url ? (
                              <img src={p.avatar_url} alt="" className="h-5 w-5 rounded-full object-cover" />
                            ) : (
                              <div className="h-5 w-5 rounded-full bg-letitia-gold/20 flex items-center justify-center text-[7px] font-bold text-letitia-gold">{(p.full_name || "??").split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}</div>
                            )}
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
                  <TiptapEditor
                    value={descDraft}
                    onChange={setDescDraft}
                    placeholder="Descreva os detalhes da tarefa... Cole prints, insira links ou anexe arquivos."
                    minHeight="150px"
                  />
                  <div className="flex gap-2 justify-end">
                    <button onClick={() => { setEditingDesc(false); setDescDraft(tarefa.descricao || ""); }} className="px-3 py-1 rounded text-xs text-muted hover:text-foreground">Cancelar</button>
                    <button onClick={handleSaveDesc} className="px-3 py-1 rounded bg-primary text-primary-foreground text-xs font-medium">Salvar</button>
                  </div>
                </div>
              ) : (
                <div onClick={() => setEditingDesc(true)} className="min-h-[60px] p-4 rounded-xl border border-border bg-background/50 text-sm text-foreground/80 leading-relaxed cursor-pointer hover:border-primary/30 transition-colors">
                  {tarefa.descricao ? (
                    <div className="tiptap-display" dangerouslySetInnerHTML={{ __html: tarefa.descricao }} />
                  ) : (
                    <span className="italic opacity-50">Clique para adicionar descrição...</span>
                  )}
                </div>
              )}
            </div>

            {/* Subtasks Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted">
                  <ListChecks className="h-3.5 w-3.5" /> Subtarefas
                  {subtasksTotal > 0 && (
                    <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">
                      {subtasksDone}/{subtasksTotal}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => setShowSubtaskForm(!showSubtaskForm)}
                  className="flex items-center gap-1 text-[10px] font-medium text-primary hover:text-primary/80 transition-colors"
                >
                  <Plus className="h-3 w-3" /> Adicionar
                </button>
              </div>

              {/* Progress bar */}
              {subtasksTotal > 0 && (
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-1.5 rounded-full bg-border overflow-hidden">
                    <div
                      className="h-full bg-green-500 rounded-full transition-all duration-500"
                      style={{ width: `${subtasksProgress}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-semibold text-muted">{subtasksProgress}%</span>
                </div>
              )}

              {/* Subtask list */}
              <div className="space-y-1">
                {subtasks.map((sub) => {
                  const subProfile = allProfiles.find(p => p.id === sub.responsavel_id);
                  const subIniciais = subProfile?.full_name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || "";
                  const isEditing = editingSubtaskId === sub.id;
                  const isExpanded = expandedSubtaskId === sub.id;

                  return (
                    <div key={sub.id} className={cn(
                      "group rounded-lg transition-all border",
                      isExpanded ? "border-primary/20 bg-primary/[0.02] shadow-sm" : "border-transparent hover:border-border/50 hover:bg-foreground/[0.03]",
                      sub.concluida && "opacity-60"
                    )}>
                      <div className="flex items-start gap-2.5 px-3 py-2">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleToggleSubtask(sub); }}
                          className="flex-shrink-0 mt-0.5"
                        >
                          {sub.concluida ? (
                            <CheckSquare2 className="h-4 w-4 text-green-500" />
                          ) : (
                            <Square className="h-4 w-4 text-border group-hover:text-muted transition-colors" />
                          )}
                        </button>
                        <div
                          className="flex-1 min-w-0 cursor-pointer"
                          onClick={() => handleExpandSubtask(sub)}
                        >
                          <div className="flex items-center gap-1.5">
                            <p className={cn("text-xs font-medium leading-snug", sub.concluida && "line-through text-muted")}>
                              {sub.titulo}
                            </p>
                            {sub.descricao && (
                              <AlignLeft className="h-3 w-3 text-primary/50 flex-shrink-0" />
                            )}
                            <ChevronDown className={cn(
                              "h-3 w-3 text-muted/40 flex-shrink-0 transition-transform duration-200",
                              isExpanded && "rotate-180"
                            )} />
                          </div>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            {subProfile && (
                              <span className="flex items-center gap-1 text-[10px] text-muted">
                                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-letitia-gold/10 border border-letitia-gold/20 text-[7px] font-bold text-letitia-gold">
                                  {subIniciais}
                                </span>
                                {subProfile.full_name?.split(' ')[0]}
                              </span>
                            )}
                            {sub.prazo && (
                              <span className={cn("flex items-center gap-0.5 text-[10px]", sub.prazo < new Date().toISOString().split('T')[0] && !sub.concluida ? "text-red-500 font-medium" : "text-muted")}>
                                <Clock className="h-2.5 w-2.5" />
                                {new Date(sub.prazo + 'T00:00:00').toLocaleDateString("pt-BR", { day: '2-digit', month: 'short' })}
                              </span>
                            )}
                          </div>

                          {/* Inline edit */}
                          {isEditing && (
                            <div className="flex items-center gap-2 mt-2 flex-wrap" onClick={e => e.stopPropagation()}>
                              <select
                                value={editSubResp || ""}
                                onChange={e => setEditSubResp(e.target.value || null)}
                                className="rounded border border-border bg-background px-2 py-1 text-[10px] focus:outline-none focus:ring-1 focus:ring-primary"
                              >
                                <option value="">Sem responsável</option>
                                {allProfiles.map(p => <option key={p.id} value={p.id}>{p.full_name}</option>)}
                              </select>
                              <input
                                type="date"
                                value={editSubPrazo}
                                onChange={e => setEditSubPrazo(e.target.value)}
                                className="rounded border border-border bg-background px-2 py-1 text-[10px] focus:outline-none focus:ring-1 focus:ring-primary"
                              />
                              <button onClick={() => handleSaveSubtaskEdit(sub)} className="text-[9px] font-medium px-2 py-1 rounded bg-primary text-primary-foreground">Salvar</button>
                              <button onClick={() => setEditingSubtaskId(null)} className="text-[9px] text-muted hover:text-foreground">Cancelar</button>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                          <button
                            onClick={(e) => { e.stopPropagation(); handleQuickAddDesc(sub); }}
                            className={cn("p-1 rounded hover:bg-primary/10 transition-colors", sub.descricao ? "text-primary/60 hover:text-primary" : "text-muted hover:text-foreground")}
                            title="Adicionar descrição (D)"
                          >
                            <AlignLeft className="h-3 w-3" />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); setEditingSubtaskId(sub.id); setEditSubResp(sub.responsavel_id); setEditSubPrazo(sub.prazo || ""); }}
                            className="p-1 rounded hover:bg-foreground/5 text-muted hover:text-foreground"
                          >
                            <Edit3 className="h-3 w-3" />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDeleteSubtask(sub.id); }}
                            className="p-1 rounded hover:bg-red-500/10 text-muted hover:text-red-500"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </div>

                      {/* Expanded description area */}
                      {isExpanded && (
                        <div className="px-3 pb-3 pt-1 ml-[26px] border-t border-border/30 mt-1">
                          {editingSubDesc ? (
                            <div className="space-y-2" onClick={e => e.stopPropagation()}>
                              <TiptapEditor
                                value={editSubDesc}
                                onChange={setEditSubDesc}
                                placeholder="Descreva os detalhes da subtarefa..."
                                minHeight="80px"
                                compact
                              />
                              <div className="flex gap-2 justify-end">
                                <button onClick={() => { setEditingSubDesc(false); setEditSubDesc(sub.descricao || ""); }} className="px-2.5 py-1 rounded text-[10px] text-muted hover:text-foreground transition-colors">Cancelar</button>
                                <button onClick={() => handleSaveSubtaskDesc(sub)} className="px-2.5 py-1 rounded bg-primary text-primary-foreground text-[10px] font-medium hover:opacity-90 transition-opacity">Salvar</button>
                              </div>
                            </div>
                          ) : (
                            <div
                              onClick={(e) => { e.stopPropagation(); setEditingSubDesc(true); setEditSubDesc(sub.descricao || ""); }}
                              className="min-h-[40px] p-3 rounded-lg border border-dashed border-border/60 bg-background/40 text-xs text-foreground/70 leading-relaxed cursor-pointer hover:border-primary/30 hover:bg-primary/[0.02] transition-all"
                            >
                              {sub.descricao ? (
                                <div className="tiptap-display" dangerouslySetInnerHTML={{ __html: sub.descricao }} />
                              ) : (
                                <span className="italic opacity-50 flex items-center gap-1.5">
                                  <AlignLeft className="h-3 w-3" />
                                  Clique para adicionar descrição...
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Add subtask form */}
              {showSubtaskForm && (
                <div className="rounded-xl border border-border bg-background/50 p-3 space-y-2.5">
                  <input
                    type="text"
                    value={newSubtaskTitle}
                    onChange={e => setNewSubtaskTitle(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter") handleAddSubtask(); }}
                    placeholder="Nome da subtarefa..."
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted focus:ring-2 focus:ring-primary focus:outline-none"
                    autoFocus
                  />
                  <div className="flex items-center gap-2 flex-wrap">
                    <select
                      value={newSubtaskResp || ""}
                      onChange={e => setNewSubtaskResp(e.target.value || null)}
                      className="rounded-md border border-border bg-background px-2 py-1.5 text-[11px] focus:ring-1 focus:ring-primary focus:outline-none flex-1 min-w-[120px]"
                    >
                      <option value="">Sem responsável</option>
                      {allProfiles.map(p => <option key={p.id} value={p.id}>{p.full_name}</option>)}
                    </select>
                    <input
                      type="date"
                      value={newSubtaskPrazo}
                      onChange={e => setNewSubtaskPrazo(e.target.value)}
                      className="rounded-md border border-border bg-background px-2 py-1.5 text-[11px] focus:ring-1 focus:ring-primary focus:outline-none"
                    />
                  </div>
                  <div className="flex items-center justify-end gap-2">
                    <button onClick={() => { setShowSubtaskForm(false); setNewSubtaskTitle(""); }} className="px-3 py-1 rounded text-xs text-muted hover:text-foreground">Cancelar</button>
                    <button
                      onClick={handleAddSubtask}
                      disabled={!newSubtaskTitle.trim() || addingSubtask}
                      className="px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-xs font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-1"
                    >
                      {addingSubtask ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
                      Adicionar
                    </button>
                  </div>
                </div>
              )}

              {subtasksTotal === 0 && !showSubtaskForm && (
                <button
                  onClick={() => setShowSubtaskForm(true)}
                  className="w-full py-4 rounded-xl border border-dashed border-border text-xs text-muted hover:text-foreground hover:border-primary/30 transition-all flex items-center justify-center gap-2"
                >
                  <Plus className="h-3.5 w-3.5" /> Adicionar subtarefas
                </button>
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



export function NovoTarefaModal({ profiles, onClose, onSuccess, tarefa, defaultResponsavelId }: { 
  profiles: DBProfile[]; 
  onClose: () => void; 
  onSuccess: () => void;
  tarefa?: DBTask | null;
  defaultResponsavelId?: string;
}) {
  const { user } = useAuth();
  const hoje = new Date().toISOString().split("T")[0];
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    titulo: tarefa?.titulo || "",
    descricao: tarefa?.descricao || "",
    prioridade: (tarefa?.prioridade as TaskPriority) || "normal",
    status: (tarefa?.status as TaskStatus) || "fazer",
    responsavel_id: tarefa?.responsavel_id || defaultResponsavelId || user?.id || "",
    prazo: tarefa?.prazo || hoje,
    recorrencia: (tarefa?.recorrencia || null) as RecurrenceType | null
  });

  // Template selector state
  const [templates, setTemplates] = useState<DBTaskTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [loadingTemplates, setLoadingTemplates] = useState(false);

  useEffect(() => {
    if (!tarefa) {
      setLoadingTemplates(true);
      getTaskTemplates().then(setTemplates).finally(() => setLoadingTemplates(false));
    }
  }, [tarefa]);

  const selectedTemplate = templates.find(t => t.id === selectedTemplateId) || null;

  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplateId(templateId);
    const tmpl = templates.find(t => t.id === templateId);
    if (tmpl) {
      setFormData(prev => ({
        ...prev,
        titulo: tmpl.nome,
        descricao: tmpl.descricao || "",
        prioridade: tmpl.prioridade || "normal",
        responsavel_id: tmpl.responsavel_id || prev.responsavel_id,
      }));
    }
  };

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
          prazo: formData.prazo || null, action: 'criada',
          details: selectedTemplate ? `Criada do modelo "${selectedTemplate.nome}"` : 'Tarefa criada',
        });

        // Notify assigned user about the new task
        if (formData.responsavel_id && user && formData.responsavel_id !== user.id) {
          const creatorName = profiles.find(p => p.id === user.id)?.full_name || 'Alguém';
          notifyNewTaskAssigned(formData.titulo, created.id, formData.responsavel_id, user.id, creatorName);
        }

        // If a template was selected, create its subtasks
        if (selectedTemplate && selectedTemplate.modelo_subtarefas && selectedTemplate.modelo_subtarefas.length > 0) {
          const subs = selectedTemplate.modelo_subtarefas.map(s => ({
            tarefa_id: created.id,
            titulo: s.titulo,
            concluida: false,
            responsavel_id: s.responsavel_id || null,
            ordem: s.ordem,
          }));
          await createBulkSubtasks(subs);
        }
      }
      onSuccess();
    } catch (error) {
      console.error("Erro ao salvar tarefa:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay items-center justify-center p-4">
      <div className="w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-lg modal-content max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-serif text-2xl font-medium text-foreground">{tarefa ? "Editar Tarefa" : "Nova Tarefa"}</h3>
          <button onClick={onClose} className="rounded-full p-1 hover:bg-foreground/10 transition-colors">
            <X className="h-5 w-5 text-muted" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Template selector — only for new tasks */}
          {!tarefa && (
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1.5 flex items-center gap-1.5">
                <BookTemplate className="h-3.5 w-3.5" /> Usar modelo (opcional)
              </label>
              <select
                value={selectedTemplateId}
                onChange={e => handleTemplateChange(e.target.value)}
                className="w-full rounded-md border border-violet-500/30 bg-violet-500/5 px-3 py-2 text-sm text-foreground focus:ring-2 focus:ring-violet-500 focus:outline-none"
              >
                <option value="">Tarefa em branco</option>
                {loadingTemplates && <option disabled>Carregando modelos...</option>}
                {templates.map(t => (
                  <option key={t.id} value={t.id}>
                    📋 {t.nome} ({(t.modelo_subtarefas || []).length} subtarefas)
                  </option>
                ))}
              </select>
              {selectedTemplate && (selectedTemplate.modelo_subtarefas || []).length > 0 && (
                <div className="mt-2 p-2.5 rounded-lg border border-violet-500/15 bg-violet-500/5 space-y-1">
                  <p className="text-[9px] font-bold uppercase tracking-widest text-violet-600 mb-1">Subtarefas incluídas:</p>
                  {(selectedTemplate.modelo_subtarefas || []).map((s, i) => {
                    const sp = profiles.find(p => p.id === s.responsavel_id);
                    return (
                      <div key={i} className="flex items-center gap-2 text-[11px] text-muted">
                        <Square className="h-3 w-3 text-violet-400 flex-shrink-0" />
                        <span className="flex-1 truncate">{s.titulo}</span>
                        {sp && <span className="text-[9px] bg-foreground/5 px-1.5 py-0.5 rounded">{sp.full_name?.split(' ')[0]}</span>}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

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
            <TiptapEditor
              value={formData.descricao}
              onChange={(html) => setFormData({ ...formData, descricao: html })}
              placeholder="Detalhes da tarefa... Cole prints, insira links ou anexe arquivos."
              minHeight="120px"
              compact
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

function TaskRow({ tarefa, onClick, onToggle, onEdit, onDelete, isOverdue, isDone, bulkSelectMode, isSelected, onBulkToggle, onUpdate, profiles: rowProfiles }: {
  tarefa: DBTask; onClick: () => void; onToggle: () => void; onEdit: (t: DBTask) => void; onDelete: (id: string) => void; isOverdue?: boolean; isDone?: boolean;
  bulkSelectMode?: boolean; isSelected?: boolean; onBulkToggle?: () => void;
  onUpdate?: (taskId: string, updates: Partial<DBTask>) => Promise<void>;
  profiles?: DBProfile[];
}) {
  const prior = prioridadeColors[tarefa.prioridade as keyof typeof prioridadeColors] || prioridadeColors.normal;
  const iniciais = tarefa.profiles?.full_name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || "??";
  const isSubtask = (tarefa as any).__isSubtask;
  const parentTitle = (tarefa as any).__parentTitle;

  return (
    <div 
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 px-4 py-3 rounded-lg border transition-all cursor-pointer hover:shadow-sm group",
        isSelected ? "border-amber-500 bg-amber-500/5 ring-1 ring-amber-500/40" :
        isSubtask ? "border-violet-500/20 bg-violet-500/[0.03]" :
        isOverdue ? "border-red-500/30 bg-red-500/5" :
        isDone ? "border-green-500/20 bg-green-500/5" :
        "border-border bg-card hover:border-letitia-gold/30"
      )}
    >
      {/* Bulk selection checkbox */}
      {bulkSelectMode ? (
        <button
          onClick={(e) => { e.stopPropagation(); onBulkToggle?.(); }}
          className="flex-shrink-0 transition-transform hover:scale-110"
        >
          {isSelected ? (
            <CheckSquare2 className="h-5 w-5 text-amber-500" />
          ) : (
            <Square className="h-5 w-5 text-border hover:text-amber-500/60" />
          )}
        </button>
      ) : (
        <button
          onClick={(e) => { e.stopPropagation(); onToggle(); }}
          className="flex-shrink-0"
        >
          {isDone ? (
            <CheckSquare2 className="h-5 w-5 text-green-500" />
          ) : (
            <Square className={cn("h-5 w-5", isOverdue ? "text-red-400" : isSubtask ? "text-violet-400" : "text-border group-hover:text-muted")} />
          )}
        </button>
      )}

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          {isSubtask && (
            <span className="flex items-center gap-1 text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-violet-500/10 text-violet-600 border border-violet-500/20 flex-shrink-0">
              <ListChecks className="h-2.5 w-2.5" />
              Subtarefa
            </span>
          )}
          <p className={cn("text-sm font-medium leading-snug truncate", isDone ? "line-through text-muted" : "text-foreground")}>
            {tarefa.titulo}
          </p>
        </div>
        <div className="flex items-center gap-3 mt-1 flex-wrap">
          {isSubtask && parentTitle && (
            <span className="text-[10px] text-muted/70 italic truncate max-w-[200px]">
              ↳ {parentTitle}
            </span>
          )}
          {!isSubtask && onUpdate && rowProfiles ? (
            <InlineEditCell type="responsavel" value={tarefa.responsavel_id} taskId={tarefa.id} profiles={rowProfiles} onUpdate={onUpdate}>
              <span className="flex items-center gap-1.5 text-[11px] text-muted cursor-pointer">
                {tarefa.profiles?.avatar_url ? (
                  <img src={tarefa.profiles.avatar_url} alt="" className="h-5 w-5 rounded-full object-cover border border-border" />
                ) : (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-background border border-border text-[9px] font-medium text-foreground">
                    {iniciais}
                  </span>
                )}
                {tarefa.profiles?.full_name?.split(" ")[0] || "Sem atribuição"}
              </span>
            </InlineEditCell>
          ) : (
            <span className="flex items-center gap-1.5 text-[11px] text-muted">
              {tarefa.profiles?.avatar_url ? (
                <img src={tarefa.profiles.avatar_url} alt="" className="h-5 w-5 rounded-full object-cover border border-border" />
              ) : (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-background border border-border text-[9px] font-medium text-foreground">
                  {iniciais}
                </span>
              )}
              {tarefa.profiles?.full_name?.split(" ")[0] || "Sem atribuição"}
            </span>
          )}
          {!isSubtask && onUpdate ? (
            <InlineEditCell type="prazo" value={tarefa.prazo} taskId={tarefa.id} onUpdate={onUpdate}>
              <span className={cn("flex items-center gap-1 text-[11px] cursor-pointer", isOverdue ? "text-red-500 font-medium" : "text-muted")}>
                <Clock className="h-3 w-3" />
                {tarefa.prazo ? new Date(tarefa.prazo + 'T00:00:00').toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }) : "Sem prazo"}
              </span>
            </InlineEditCell>
          ) : (
            <span className={cn("flex items-center gap-1 text-[11px]", isOverdue ? "text-red-500 font-medium" : "text-muted")}>
              <Clock className="h-3 w-3" />
              {tarefa.prazo ? new Date(tarefa.prazo + 'T00:00:00').toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }) : "Sem prazo"}
            </span>
          )}
          {tarefa.recorrencia && (
            <span className="flex items-center gap-1 text-[9px] font-medium px-1.5 py-0.5 rounded-full bg-violet-500/10 text-violet-600 border border-violet-500/20">
              <Repeat className="h-2.5 w-2.5" />
              {recurrenceLabels[tarefa.recorrencia as RecurrenceType]}
            </span>
          )}
          {!isSubtask && onUpdate ? (
            <InlineEditCell type="prioridade" value={tarefa.prioridade} taskId={tarefa.id} onUpdate={onUpdate}>
              <span className={cn("text-[10px] font-medium px-1.5 py-0.5 rounded cursor-pointer", prior.bg, prior.text)}>
                {prior.label}
              </span>
            </InlineEditCell>
          ) : !isSubtask && tarefa.prioridade !== "baixa" ? (
            <span className={cn("text-[10px] font-medium px-1.5 py-0.5 rounded", prior.bg, prior.text)}>
              {prior.label}
            </span>
          ) : null}
        </div>
      </div>

      {!isSubtask && !bulkSelectMode && (
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
      )}
    </div>
  );
}

function KanbanCard({ tarefa, onClick, onEdit, onDelete, bulkSelectMode, isSelected, onBulkToggle }: {
  tarefa: DBTask; onClick: () => void; onEdit: (t: DBTask) => void; onDelete: (id: string) => void;
  bulkSelectMode?: boolean; isSelected?: boolean; onBulkToggle?: () => void;
}) {
  const prior = prioridadeColors[tarefa.prioridade as keyof typeof prioridadeColors] || prioridadeColors.normal;
  const iniciais = tarefa.profiles?.full_name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || "??";

  return (
    <div 
      onClick={onClick}
      className={cn(
        "rounded-lg border bg-card p-3 shadow-sm hover:shadow-md transition-all cursor-pointer group",
        isSelected ? "border-amber-500 bg-amber-500/5 ring-1 ring-amber-500/40" : "border-border hover:border-letitia-gold/30"
      )}
    >
      <div className="flex justify-between items-start gap-2">
        <div className="flex items-start gap-2">
          {bulkSelectMode && (
            <button
              onClick={(e) => { e.stopPropagation(); onBulkToggle?.(); }}
              className="flex-shrink-0 mt-0.5 transition-transform hover:scale-110"
            >
              {isSelected ? (
                <CheckSquare2 className="h-4 w-4 text-amber-500" />
              ) : (
                <Square className="h-4 w-4 text-border hover:text-amber-500/60" />
              )}
            </button>
          )}
          <p className="text-sm font-medium text-foreground leading-snug">{tarefa.titulo}</p>
        </div>
        {!bulkSelectMode && (
          <div className="flex opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={(e) => { e.stopPropagation(); onEdit(tarefa); }} className="p-1 rounded hover:bg-foreground/5 text-muted">
              <Plus className="h-3 w-3 rotate-45" />
            </button>
            <button onClick={(e) => { e.stopPropagation(); onDelete(tarefa.id); }} className="p-1 rounded hover:bg-red-500/10 text-muted hover:text-red-500">
              <X className="h-3 w-3" />
            </button>
          </div>
        )}
      </div>
      <div className="mt-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {tarefa.profiles?.avatar_url ? (
            <img src={tarefa.profiles.avatar_url} alt="" className="h-6 w-6 rounded-full object-cover border border-border" />
          ) : (
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-background border border-border text-[10px] font-medium text-foreground">{iniciais}</span>
          )}
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

/* ─── Inline Edit Popover ────────────────────────────────── */

function InlineEditCell({ type, value, taskId, profiles: editProfiles, onUpdate, children }: {
  type: 'prioridade' | 'prazo' | 'responsavel';
  value: string | null;
  taskId: string;
  profiles?: DBProfile[];
  onUpdate: (taskId: string, updates: Partial<DBTask>) => Promise<void>;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  const handleSelect = async (val: string | null) => {
    setOpen(false);
    if (type === 'prioridade') await onUpdate(taskId, { prioridade: val as TaskPriority });
    else if (type === 'prazo') await onUpdate(taskId, { prazo: val });
    else if (type === 'responsavel') await onUpdate(taskId, { responsavel_id: val });
  };

  return (
    <div ref={ref} className="relative inline-flex">
      <button
        onClick={e => { e.stopPropagation(); setOpen(!open); }}
        className="hover:ring-2 hover:ring-letitia-gold/30 rounded transition-all"
      >
        {children}
      </button>
      {open && (
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 z-50 rounded-lg border border-border bg-card shadow-lg py-1 min-w-[140px] max-h-[200px] overflow-y-auto animate-in fade-in slide-in-from-top-1 duration-150">
          {type === 'prioridade' && (
            <>
              {(['baixa', 'normal', 'alta', 'urgente'] as TaskPriority[]).map(p => {
                const c = prioridadeColors[p];
                return (
                  <button key={p} onClick={() => handleSelect(p)} className={cn("w-full text-left px-3 py-1.5 text-xs hover:bg-foreground/5 flex items-center gap-2", value === p && "bg-foreground/5 font-semibold")}>
                    <span className={cn("w-2 h-2 rounded-full", c.bg)} />
                    {c.label}
                  </button>
                );
              })}
            </>
          )}
          {type === 'prazo' && (
            <div className="px-2 py-1">
              <input
                type="date"
                defaultValue={value || ''}
                onChange={e => handleSelect(e.target.value || null)}
                className="w-full rounded border border-border bg-background px-2 py-1 text-xs text-foreground focus:ring-2 focus:ring-letitia-gold focus:outline-none"
                onClick={e => e.stopPropagation()}
              />
              {value && (
                <button onClick={() => handleSelect(null)} className="w-full text-center text-[10px] text-red-500 mt-1 hover:underline">Remover prazo</button>
              )}
            </div>
          )}
          {type === 'responsavel' && editProfiles && (
            <>
              <button onClick={() => handleSelect(null)} className={cn("w-full text-left px-3 py-1.5 text-xs hover:bg-foreground/5 text-muted italic", !value && "bg-foreground/5 font-semibold")}>Sem atribuição</button>
              {editProfiles.map(p => (
                <button key={p.id} onClick={() => handleSelect(p.id)} className={cn("w-full text-left px-3 py-1.5 text-xs hover:bg-foreground/5 flex items-center gap-2", value === p.id && "bg-foreground/5 font-semibold")}>
                  {p.avatar_url ? (
                    <img src={p.avatar_url} alt="" className="h-4 w-4 rounded-full object-cover" />
                  ) : (
                    <span className="h-4 w-4 rounded-full bg-letitia-gold/10 border border-letitia-gold/30 flex items-center justify-center text-[8px] font-bold text-letitia-gold">{p.full_name?.charAt(0)}</span>
                  )}
                  {p.full_name}
                </button>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}

/* ─── Team View ──────────────────────────────────────────── */

function TeamView({ tarefas, profiles, view, hoje, onTaskClick, onTaskEdit: _onTaskEdit, onTaskDelete: _onTaskDelete, onToggle, onNewTask, busca, bulkSelectMode, selectedTaskIds, onBulkToggle, onBulkSelectPerson, allSubtasks, onSubtaskToggle, onTaskUpdate }: {
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
  bulkSelectMode?: boolean;
  selectedTaskIds?: Set<string>;
  onBulkToggle?: (id: string) => void;
  onBulkSelectPerson?: (ids: string[]) => void;
  allSubtasks?: (DBSubtask & { tarefas?: { titulo: string; id: string } | null })[];
  onSubtaskToggle?: (subId: string, newVal: boolean) => void;
  onTaskUpdate?: (taskId: string, updates: Partial<DBTask>) => Promise<void>;
}) {
  const [expandedUsers, setExpandedUsers] = useState<Record<string, boolean>>({});
  const [showConcluidasMap, setShowConcluidasMap] = useState<Record<string, boolean>>({});
  const [expandedTaskSubs, setExpandedTaskSubs] = useState<Record<string, boolean>>({});
  const [subtaskSearch, setSubtaskSearch] = useState("");

  // Build a map of taskId -> subtasks
  const subtasksByTask = new Map<string, (DBSubtask & { tarefas?: { titulo: string; id: string } | null })[]>();
  (allSubtasks || []).forEach(s => {
    const list = subtasksByTask.get(s.tarefa_id) || [];
    list.push(s);
    subtasksByTask.set(s.tarefa_id, list);
  });

  const toggleTaskSubs = (taskId: string) => {
    setExpandedTaskSubs(prev => ({ ...prev, [taskId]: !prev[taskId] }));
  };

  // Combined search: main search bar + subtask search
  const effectiveSubSearch = subtaskSearch.toLowerCase();

  // Extended task type for subtask virtual entries
  type TeamTask = DBTask & { __isSubtask?: boolean; __parentTitle?: string; __parentId?: string; __subtaskId?: string };

  // Group tasks by responsible
  const grouped = new Map<string, { profile: DBProfile | null; tasks: TeamTask[] }>();
  
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

  // Add subtasks as virtual entries under their responsible person
  (allSubtasks || []).filter(s => !s.concluida).forEach(s => {
    const key = s.responsavel_id || "__none__";
    // Skip if the subtask is already shown under a parent task with the same responsible
    // (avoid duplication when parent task responsible == subtask responsible)
    const parentTask = tarefas.find(t => t.id === s.tarefa_id);
    if (parentTask && parentTask.responsavel_id === s.responsavel_id) return;
    if (!grouped.has(key)) {
      const prof = profiles.find(p => p.id === key);
      grouped.set(key, { profile: prof || null, tasks: [] });
    }
    const virtualTask: TeamTask = {
      id: `sub_${s.id}`,
      titulo: s.titulo,
      descricao: '',
      prioridade: 'normal' as TaskPriority,
      status: (s.concluida ? 'concluido' : 'fazer') as TaskStatus,
      responsavel_id: s.responsavel_id,
      prazo: s.prazo,
      created_at: s.created_at,
      updated_at: s.created_at,
      profiles: s.profiles || null,
      __isSubtask: true,
      __parentTitle: s.tarefas?.titulo || '',
      __parentId: s.tarefa_id,
      __subtaskId: s.id,
    };
    grouped.get(key)!.tasks.push(virtualTask);
  });

  // Also add subtasks matching the subtask search, even if responsavel matches parent
  if (effectiveSubSearch) {
    (allSubtasks || []).filter(s => !s.concluida && s.titulo.toLowerCase().includes(effectiveSubSearch)).forEach(s => {
      const key = s.responsavel_id || "__none__";
      const virtualId = `sub_${s.id}`;
      // Check if already added
      if (grouped.has(key) && grouped.get(key)!.tasks.some(t => t.id === virtualId)) return;
      if (!grouped.has(key)) {
        const prof = profiles.find(p => p.id === key);
        grouped.set(key, { profile: prof || null, tasks: [] });
      }
      const virtualTask: TeamTask = {
        id: virtualId,
        titulo: s.titulo,
        descricao: '',
        prioridade: 'normal' as TaskPriority,
        status: (s.concluida ? 'concluido' : 'fazer') as TaskStatus,
        responsavel_id: s.responsavel_id,
        prazo: s.prazo,
        created_at: s.created_at,
        updated_at: s.created_at,
        profiles: s.profiles || null,
        __isSubtask: true,
        __parentTitle: s.tarefas?.titulo || '',
        __parentId: s.tarefa_id,
        __subtaskId: s.id,
      };
      grouped.get(key)!.tasks.push(virtualTask);
    });
  }

  // Filter out profiles with no tasks (unless searching)
  const entries = Array.from(grouped.entries())
    .filter(([, v]) => v.tasks.length > 0 || busca)
    .filter(([, v]) => {
      if (!busca && !effectiveSubSearch) return v.tasks.length > 0;
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
  const [sortBy, setSortBy] = useState<'ativas' | 'alfabetica' | 'atrasadas' | 'taxa'>('ativas');

  const filteredEntries = entries.filter(([, v]) => {
    if (!memberSearch) return true;
    return (v.profile?.full_name || "Sem atribuição").toLowerCase().includes(memberSearch.toLowerCase());
  });

  // Sort entries
  const sortedEntries = [...filteredEntries].sort((a, b) => {
    const [, va] = a;
    const [, vb] = b;
    const pendA = va.tasks.filter(t => t.status !== 'concluido').length;
    const pendB = vb.tasks.filter(t => t.status !== 'concluido').length;
    switch (sortBy) {
      case 'alfabetica':
        return (va.profile?.full_name || 'ZZZ').localeCompare(vb.profile?.full_name || 'ZZZ');
      case 'ativas':
        return pendB - pendA;
      case 'atrasadas': {
        const atrA = va.tasks.filter(t => t.status !== 'concluido' && t.prazo && t.prazo < hoje).length;
        const atrB = vb.tasks.filter(t => t.status !== 'concluido' && t.prazo && t.prazo < hoje).length;
        return atrB - atrA;
      }
      case 'taxa': {
        const taxaA = va.tasks.length > 0 ? Math.round((va.tasks.filter(t => t.status === 'concluido').length / va.tasks.length) * 100) : 0;
        const taxaB = vb.tasks.length > 0 ? Math.round((vb.tasks.filter(t => t.status === 'concluido').length / vb.tasks.length) * 100) : 0;
        return taxaB - taxaA;
      }
      default:
        return pendB - pendA;
    }
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-2">
        <div className="flex items-center gap-2 text-muted">
          <User className="h-4 w-4" />
          <span className="text-sm font-semibold">Tarefas por Responsável</span>
          <span className="text-xs bg-card border border-border px-2 py-0.5 rounded-full">{sortedEntries.length} membros</span>
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted" />
            <input type="text" value={memberSearch} onChange={e => setMemberSearch(e.target.value)} placeholder="Buscar membro..." className="rounded-md border border-border bg-card pl-8 pr-3 py-1.5 text-xs text-foreground placeholder:text-muted focus:ring-2 focus:ring-letitia-gold focus:outline-none w-44" />
          </div>
          <div className="relative">
            <ListChecks className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-violet-400" />
            <input type="text" value={subtaskSearch} onChange={e => setSubtaskSearch(e.target.value)} placeholder="Buscar subtarefas..." className="rounded-md border border-violet-500/20 bg-card pl-8 pr-3 py-1.5 text-xs text-foreground placeholder:text-muted focus:ring-2 focus:ring-violet-500/40 focus:outline-none w-48" />
            {subtaskSearch && (
              <button onClick={() => setSubtaskSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2">
                <X className="h-3 w-3 text-muted hover:text-foreground" />
              </button>
            )}
          </div>
          <div className="relative">
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as any)}
              className="appearance-none rounded-md border border-border bg-card pl-3 pr-7 py-1.5 text-xs font-medium text-foreground focus:ring-2 focus:ring-letitia-gold focus:outline-none cursor-pointer"
            >
              <option value="ativas">Mais ativas</option>
              <option value="alfabetica">A → Z</option>
              <option value="atrasadas">Mais atrasadas</option>
              <option value="taxa">Maior taxa</option>
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted pointer-events-none" />
          </div>
        </div>
      </div>

      {view === "kanban" ? (
        /* ── Kanban Cards View ── */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {sortedEntries.map(([id, { profile, tasks }]) => {
            const pendentes = tasks.filter(t => t.status !== "concluido");
            const concluidas = tasks.filter(t => t.status === "concluido");
            const atrasadas = pendentes.filter(t => t.prazo && t.prazo < hoje);
            const alta = pendentes.filter(t => t.prioridade === "alta" || t.prioridade === "urgente");
            const taxa = tasks.length > 0 ? Math.round((concluidas.length / tasks.length) * 100) : 0;
            const iniciais = profile?.full_name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || "??";
            const isExpanded = pendentes.length > 0 ? (expandedUsers[id] !== false) : (expandedUsers[id] === true);
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
                      {bulkSelectMode && pendentes.length > 0 && (
                        <button
                          onClick={() => onBulkSelectPerson?.(pendentes.map(t => t.id))}
                          className={cn(
                            "text-[10px] font-semibold px-2 py-1 rounded-md border transition-colors flex items-center gap-1",
                            pendentes.every(t => selectedTaskIds?.has(t.id))
                              ? "border-amber-500 bg-amber-500 text-white"
                              : "border-amber-500/40 bg-amber-500/10 text-amber-600 hover:bg-amber-500/20"
                          )}
                        >
                          {pendentes.every(t => selectedTaskIds?.has(t.id)) ? <CheckSquare2 className="h-3 w-3" /> : <Square className="h-3 w-3" />}
                          Selecionar todas
                        </button>
                      )}
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

                  {/* Stats — only show if there are pending tasks */}
                  {pendentes.length > 0 && (
                    <>
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
                    </>
                  )}
                </div>

                {/* Tasks */}
                <div className="border-t border-border">
                  <button onClick={() => toggleUser(id)} className="w-full flex items-center justify-between px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-muted hover:bg-foreground/5 transition-colors">
                    <span>Tarefas pendentes ({pendentes.length})</span>
                    {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                  </button>

                  {isExpanded && pendentes.length > 0 && (
                    <div className="px-3 pb-3 space-y-1 max-h-[300px] overflow-y-auto">
                        {pendentes.map(t => {
                          const isVirtualSub = (t as TeamTask).__isSubtask;
                          const parentTitle = (t as TeamTask).__parentTitle;
                          const parentId = (t as TeamTask).__parentId;
                          const prior = prioridadeColors[t.prioridade as keyof typeof prioridadeColors] || prioridadeColors.normal;
                          const isOverdue = t.prazo && t.prazo < hoje;
                          const taskSubs = isVirtualSub ? [] : (subtasksByTask.get(t.id) || []);
                          const taskSubsDone = taskSubs.filter(s => s.concluida).length;
                          const filteredSubs = effectiveSubSearch
                            ? taskSubs.filter(s => s.titulo.toLowerCase().includes(effectiveSubSearch))
                            : taskSubs;
                          const isSubsExpanded = expandedTaskSubs[t.id] || (effectiveSubSearch !== '' && filteredSubs.length > 0);

                          const handleClick = () => {
                            if (bulkSelectMode) { onBulkToggle?.(t.id); return; }
                            if (isVirtualSub && parentId) {
                              const parent = tarefas.find(task => task.id === parentId);
                              if (parent) { onTaskClick(parent); return; }
                            }
                            onTaskClick(t);
                          };

                          return (
                            <div key={t.id}>
                              <div
                                onClick={handleClick}
                                className={cn(
                                  "flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-pointer hover:bg-foreground/5 transition-colors group",
                                  isVirtualSub ? "bg-violet-500/[0.03] border border-violet-500/15 ml-2" :
                                  selectedTaskIds?.has(t.id) ? "bg-amber-500/5 ring-1 ring-amber-500/30" :
                                  isOverdue ? "bg-red-500/5" : ""
                                )}
                              >
                                {bulkSelectMode ? (
                                  <button onClick={e => { e.stopPropagation(); onBulkToggle?.(t.id); }} className="flex-shrink-0 transition-transform hover:scale-110">
                                    {selectedTaskIds?.has(t.id) ? <CheckSquare2 className="h-4 w-4 text-amber-500" /> : <Square className="h-4 w-4 text-border hover:text-amber-500/60" />}
                                  </button>
                                ) : (
                                  <button onClick={e => { e.stopPropagation(); isVirtualSub ? onSubtaskToggle?.((t as TeamTask).__subtaskId!, true) : onToggle(t.id, t.status); }} className="flex-shrink-0">
                                    <Square className={cn("h-4 w-4", isVirtualSub ? "text-violet-400" : isOverdue ? "text-red-400" : "text-border group-hover:text-muted")} />
                                  </button>
                                )}
                                <div className="flex-1 min-w-0">
                                  {isVirtualSub && (
                                    <span className="flex items-center gap-1 text-[9px] font-semibold text-violet-500 mb-0.5">
                                      <ListChecks className="h-2.5 w-2.5" />
                                      Subtarefa · {parentTitle}
                                    </span>
                                  )}
                                  <p className="text-xs font-medium text-foreground truncate">{t.titulo}</p>
                                </div>
                                {!isVirtualSub && taskSubs.length > 0 && (
                                  <button
                                    onClick={e => { e.stopPropagation(); toggleTaskSubs(t.id); }}
                                    className={cn(
                                      "flex items-center gap-1 text-[9px] font-semibold px-1.5 py-0.5 rounded-full border transition-colors flex-shrink-0",
                                      taskSubsDone === taskSubs.length
                                        ? "bg-green-500/10 text-green-600 border-green-500/20"
                                        : "bg-violet-500/10 text-violet-600 border-violet-500/20 hover:bg-violet-500/20"
                                    )}
                                    title={`${taskSubsDone}/${taskSubs.length} subtarefas`}
                                  >
                                    <ListChecks className="h-2.5 w-2.5" />
                                    {taskSubsDone}/{taskSubs.length}
                                    {expandedTaskSubs[t.id] ? <ChevronUp className="h-2.5 w-2.5" /> : <ChevronDown className="h-2.5 w-2.5" />}
                                  </button>
                                )}
                                {!isVirtualSub && <span className={cn("text-[9px] font-medium px-1.5 py-0.5 rounded", prior.bg, prior.text)}>{prior.label}</span>}
                                <span className={cn("text-[10px] flex items-center gap-0.5", isOverdue ? "text-red-500 font-medium" : "text-muted")}>
                                  <Clock className="h-2.5 w-2.5" />
                                  {t.prazo ? new Date(t.prazo + 'T00:00:00').toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }) : "—"}
                                </span>
                              </div>
                              {/* Expandable subtasks */}
                              {!isVirtualSub && isSubsExpanded && filteredSubs.length > 0 && (
                                <div className="ml-8 mr-2 mb-1 mt-0.5 space-y-0.5 border-l-2 border-violet-500/20 pl-3">
                                  {filteredSubs.map(s => (
                                    <div key={s.id} className="flex items-center gap-2 py-1 group/sub">
                                      <button
                                        onClick={e => { e.stopPropagation(); onSubtaskToggle?.(s.id, !s.concluida); }}
                                        className="flex-shrink-0"
                                      >
                                        {s.concluida
                                          ? <CheckSquare2 className="h-3.5 w-3.5 text-green-500" />
                                          : <Square className="h-3.5 w-3.5 text-violet-400 hover:text-violet-600" />
                                        }
                                      </button>
                                      <span className={cn("text-[11px] truncate flex-1", s.concluida ? "line-through text-muted" : "text-foreground")}>
                                        {s.titulo}
                                      </span>
                                      {s.profiles?.full_name && (
                                        <span className="text-[9px] text-muted flex-shrink-0">{s.profiles.full_name.split(' ')[0]}</span>
                                      )}
                                      {s.prazo && (
                                        <span className={cn("text-[9px] flex-shrink-0", s.prazo < hoje && !s.concluida ? "text-red-500" : "text-muted")}>
                                          {new Date(s.prazo + 'T00:00:00').toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
                                        </span>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}

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
                    {sortedEntries.map(([id, { profile, tasks }]) => {
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
                    {bulkSelectMode && pendentes.length > 0 && (
                      <button
                        onClick={() => onBulkSelectPerson?.(pendentes.map(t => t.id))}
                        className={cn(
                          "text-[10px] font-semibold px-2 py-1 rounded-md border transition-colors flex items-center gap-1",
                          pendentes.every(t => selectedTaskIds?.has(t.id))
                            ? "border-amber-500 bg-amber-500 text-white"
                            : "border-amber-500/40 bg-amber-500/10 text-amber-600 hover:bg-amber-500/20"
                        )}
                      >
                        {pendentes.every(t => selectedTaskIds?.has(t.id)) ? <CheckSquare2 className="h-3 w-3" /> : <Square className="h-3 w-3" />}
                        Todas
                      </button>
                    )}
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
                    const isVirtualSub = (t as TeamTask).__isSubtask;
                    const parentTitle = (t as TeamTask).__parentTitle;
                    const parentId = (t as TeamTask).__parentId;
                    const prior = prioridadeColors[t.prioridade as keyof typeof prioridadeColors] || prioridadeColors.normal;
                    const isOverdue = t.prazo && t.prazo < hoje;
                    const statusLabels: Record<string, string> = { fazer: "Pendente", progresso: "Em andamento", revisao: "Revisão", concluido: "Concluído" };
                    const taskSubs = isVirtualSub ? [] : (subtasksByTask.get(t.id) || []);
                    const taskSubsDone = taskSubs.filter(s => s.concluida).length;
                    const filteredSubs = effectiveSubSearch
                      ? taskSubs.filter(s => s.titulo.toLowerCase().includes(effectiveSubSearch))
                      : taskSubs;
                    const isSubsExpanded = expandedTaskSubs[t.id] || (effectiveSubSearch !== '' && filteredSubs.length > 0);

                    const handleClick = () => {
                      if (bulkSelectMode) { onBulkToggle?.(t.id); return; }
                      if (isVirtualSub && parentId) {
                        const parent = tarefas.find(task => task.id === parentId);
                        if (parent) { onTaskClick(parent); return; }
                      }
                      onTaskClick(t);
                    };

                    return (
                      <div key={t.id}>
                        <div
                          onClick={handleClick}
                          className={cn(
                            "grid grid-cols-12 gap-2 items-center px-5 py-3 border-b border-border/30 cursor-pointer hover:bg-foreground/5 transition-colors",
                            isVirtualSub ? "bg-violet-500/[0.03]" :
                            selectedTaskIds?.has(t.id) ? "bg-amber-500/5" :
                            isOverdue ? "bg-red-500/5" : ""
                          )}
                        >
                          <div className="col-span-1">
                            {bulkSelectMode ? (
                              <button onClick={e => { e.stopPropagation(); onBulkToggle?.(t.id); }} className="transition-transform hover:scale-110">
                                {selectedTaskIds?.has(t.id) ? <CheckSquare2 className="h-4 w-4 text-amber-500" /> : <Square className="h-4 w-4 text-border hover:text-amber-500/60" />}
                              </button>
                            ) : (
                              <button onClick={e => { e.stopPropagation(); isVirtualSub ? onSubtaskToggle?.((t as TeamTask).__subtaskId!, true) : onToggle(t.id, t.status); }}>
                                <Square className={cn("h-4 w-4", isVirtualSub ? "text-violet-400" : isOverdue ? "text-red-400" : "text-border hover:text-muted")} />
                              </button>
                            )}
                          </div>
                          <div className="col-span-5">
                            <div className="flex items-center gap-2">
                              {isVirtualSub && (
                                <span className="flex items-center gap-1 text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-violet-500/10 text-violet-600 border border-violet-500/20 flex-shrink-0">
                                  <ListChecks className="h-2.5 w-2.5" />
                                  Sub
                                </span>
                              )}
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-medium text-foreground truncate">{t.titulo}</p>
                                {isVirtualSub && parentTitle && (
                                  <p className="text-[10px] text-muted/70 italic truncate">↳ {parentTitle}</p>
                                )}
                              </div>
                              {!isVirtualSub && taskSubs.length > 0 && (
                                <button
                                  onClick={e => { e.stopPropagation(); toggleTaskSubs(t.id); }}
                                  className={cn(
                                    "flex items-center gap-1 text-[9px] font-semibold px-1.5 py-0.5 rounded-full border transition-colors flex-shrink-0",
                                    taskSubsDone === taskSubs.length
                                      ? "bg-green-500/10 text-green-600 border-green-500/20"
                                      : "bg-violet-500/10 text-violet-600 border-violet-500/20 hover:bg-violet-500/20"
                                  )}
                                  title={`${taskSubsDone}/${taskSubs.length} subtarefas`}
                                >
                                  <ListChecks className="h-2.5 w-2.5" />
                                  {taskSubsDone}/{taskSubs.length}
                                  {expandedTaskSubs[t.id] ? <ChevronUp className="h-2.5 w-2.5" /> : <ChevronDown className="h-2.5 w-2.5" />}
                                </button>
                              )}
                            </div>
                          </div>
                          <div className="col-span-2 text-center">
                            {isVirtualSub ? (
                              <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-violet-500/10 text-violet-600">Subtarefa</span>
                            ) : onTaskUpdate ? (
                              <InlineEditCell type="prioridade" value={t.prioridade} taskId={t.id} onUpdate={onTaskUpdate}>
                                <span className={cn("text-[10px] font-medium px-2 py-0.5 rounded cursor-pointer", prior.bg, prior.text)}>{prior.label}</span>
                              </InlineEditCell>
                            ) : (
                              <span className={cn("text-[10px] font-medium px-2 py-0.5 rounded", prior.bg, prior.text)}>{prior.label}</span>
                            )}
                          </div>
                          <div className="col-span-2 text-center">
                            {!isVirtualSub && onTaskUpdate ? (
                              <InlineEditCell type="prazo" value={t.prazo} taskId={t.id} onUpdate={onTaskUpdate}>
                                <span className={cn("text-[11px] cursor-pointer", isOverdue ? "text-red-500 font-semibold" : "text-muted")}>
                                  {t.prazo ? new Date(t.prazo + 'T00:00:00').toLocaleDateString("pt-BR") : "—"}
                                </span>
                              </InlineEditCell>
                            ) : (
                              <span className={cn("text-[11px]", isOverdue ? "text-red-500 font-semibold" : "text-muted")}>
                                {t.prazo ? new Date(t.prazo + 'T00:00:00').toLocaleDateString("pt-BR") : "—"}
                              </span>
                            )}
                          </div>
                          <div className="col-span-2 text-center">
                            <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-foreground/5 text-foreground">{statusLabels[t.status] || t.status}</span>
                          </div>
                        </div>
                        {/* Expandable subtasks */}
                        {!isVirtualSub && isSubsExpanded && filteredSubs.length > 0 && (
                          <div className="border-b border-border/30 bg-violet-500/[0.02]">
                            <div className="ml-10 mr-5 py-1.5 space-y-0.5 border-l-2 border-violet-500/20 pl-3">
                              {filteredSubs.map(s => (
                                <div key={s.id} className="flex items-center gap-2 py-1">
                                  <button
                                    onClick={e => { e.stopPropagation(); onSubtaskToggle?.(s.id, !s.concluida); }}
                                    className="flex-shrink-0"
                                  >
                                    {s.concluida
                                      ? <CheckSquare2 className="h-3.5 w-3.5 text-green-500" />
                                      : <Square className="h-3.5 w-3.5 text-violet-400 hover:text-violet-600" />
                                    }
                                  </button>
                                  <span className={cn("text-[11px] truncate flex-1", s.concluida ? "line-through text-muted" : "text-foreground")}>
                                    {s.titulo}
                                  </span>
                                  {s.profiles?.full_name && (
                                    <span className="text-[9px] text-muted flex-shrink-0">{s.profiles.full_name.split(' ')[0]}</span>
                                  )}
                                  {s.prazo && (
                                    <span className={cn("text-[9px] flex-shrink-0", s.prazo < hoje && !s.concluida ? "text-red-500" : "text-muted")}>
                                      {new Date(s.prazo + 'T00:00:00').toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
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
      setTimeout(() => onSuccess(), 300);
    } catch (error) {
      console.error("Erro ao criar tarefas em massa:", error);
      alert("Erro ao criar tarefas. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay items-center justify-center p-4" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-2xl rounded-xl border border-border bg-card shadow-lg modal-content flex flex-col max-h-[90vh]">
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
    <div className="modal-overlay modal-overlay-z60 items-center justify-center p-4" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-3xl max-h-[85vh] rounded-xl border border-border bg-card shadow-lg modal-content flex flex-col">
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

/* ─── Task Template Modal ──────────────────────────────────── */

function TaskTemplateModal({ profiles, onClose, onTaskCreated }: {
  profiles: DBProfile[];
  onClose: () => void;
  onTaskCreated: () => void;
}) {
  const { user } = useAuth();
  const [templates, setTemplates] = useState<DBTaskTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"list" | "create" | "use">("list");
  const [selectedTemplate, setSelectedTemplate] = useState<DBTaskTemplate | null>(null);

  // Create form
  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [prioridade, setPrioridade] = useState<TaskPriority>("normal");
  const [respId, setRespId] = useState<string | null>(null);
  const [subs, setSubs] = useState<{ titulo: string; responsavel_id: string | null }[]>([]);
  const [newSubTitle, setNewSubTitle] = useState("");
  const [newSubResp, setNewSubResp] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Use template form
  const [useTitulo, setUseTitulo] = useState("");
  const [usePrazo, setUsePrazo] = useState("");
  const [useResp, setUseResp] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  useEffect(() => { fetchTemplates(); }, []);

  const fetchTemplates = async () => {
    setLoading(true);
    try { setTemplates(await getTaskTemplates()); } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleAddSub = () => {
    if (!newSubTitle.trim()) return;
    setSubs(prev => [...prev, { titulo: newSubTitle.trim(), responsavel_id: newSubResp }]);
    setNewSubTitle("");
    setNewSubResp(null);
  };

  const handleSaveTemplate = async () => {
    if (!nome.trim()) return;
    setSaving(true);
    try {
      await createTaskTemplate({
        nome: nome.trim(),
        descricao: descricao || undefined,
        prioridade,
        responsavel_id: respId,
        created_by: user?.id || null,
        subtarefas: subs.map((s, i) => ({ ...s, ordem: i })),
      });
      await fetchTemplates();
      setView("list");
      setNome(""); setDescricao(""); setSubs([]); setPrioridade("normal"); setRespId(null);
    } catch (e) { console.error(e); alert("Erro ao salvar modelo."); }
    finally { setSaving(false); }
  };

  const handleDeleteTemplate = async (id: string) => {
    if (!confirm("Excluir este modelo?")) return;
    try { await deleteTaskTemplate(id); setTemplates(prev => prev.filter(t => t.id !== id)); }
    catch (e) { console.error(e); }
  };

  const handleUseTemplate = async () => {
    if (!selectedTemplate) return;
    setCreating(true);
    try {
      const created = await createTaskFromTemplate(selectedTemplate, {
        titulo: useTitulo || undefined,
        prazo: usePrazo || null,
        responsavel_id: useResp !== null ? useResp : undefined,
      });
      saveTaskHistory({
        tarefa_id: created.id, titulo: created.titulo, prioridade: created.prioridade,
        status: created.status, responsavel_id: created.responsavel_id, prazo: created.prazo,
        action: 'criada', details: `Criada a partir do modelo "${selectedTemplate.nome}"`,
      });
      onTaskCreated();
    } catch (e) { console.error(e); alert("Erro ao criar tarefa."); }
    finally { setCreating(false); }
  };

  const openUseTemplate = (t: DBTaskTemplate) => {
    setSelectedTemplate(t);
    setUseTitulo(t.nome);
    setUseResp(t.responsavel_id);
    setUsePrazo("");
    setView("use");
  };

  return (
    <div className="modal-overlay modal-overlay-z60 items-center justify-center p-4" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-3xl max-h-[90vh] rounded-xl border border-border bg-card shadow-lg modal-content flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-violet-500/10 flex items-center justify-center">
              <BookTemplate className="h-5 w-5 text-violet-500" />
            </div>
            <div>
              <h3 className="font-serif text-2xl font-medium text-foreground">
                {view === "list" ? "Modelos de Tarefas" : view === "create" ? "Novo Modelo" : "Criar Tarefa do Modelo"}
              </h3>
              <p className="text-xs text-muted mt-0.5">
                {view === "list" ? `${templates.length} modelos disponíveis` : view === "create" ? "Configure as subtarefas padrão" : `Modelo: ${selectedTemplate?.nome}`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {view !== "list" && (
              <button onClick={() => setView("list")} className="rounded-md border border-border px-3 py-1.5 text-xs font-medium text-muted hover:text-foreground transition-colors">← Voltar</button>
            )}
            {view === "list" && (
              <button onClick={() => setView("create")} className="rounded-md bg-violet-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-violet-700 transition-colors flex items-center gap-1.5">
                <Plus className="h-3.5 w-3.5" /> Novo Modelo
              </button>
            )}
            <button onClick={onClose} className="rounded-full p-1 hover:bg-foreground/10 transition-colors"><X className="h-5 w-5 text-muted" /></button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {view === "list" && (
            loading ? (
              <div className="flex items-center justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-violet-500" /></div>
            ) : templates.length === 0 ? (
              <div className="py-16 text-center">
                <BookTemplate className="h-12 w-12 text-muted/30 mx-auto mb-3" />
                <p className="text-sm text-muted">Nenhum modelo criado ainda.</p>
                <p className="text-xs text-muted/60 mt-1">Crie modelos para tarefas repetitivas como "Postar Vídeo" com subtarefas pré-configuradas.</p>
                <button onClick={() => setView("create")} className="mt-4 rounded-md bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700 transition-colors">Criar primeiro modelo</button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {templates.map(t => {
                  const subsCount = t.modelo_subtarefas?.length || 0;
                  return (
                    <div key={t.id} className="rounded-xl border border-border bg-background hover:border-violet-500/30 transition-all group">
                      <div className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-semibold text-foreground truncate">{t.nome}</h4>
                            {t.descricao && <p className="text-[11px] text-muted mt-0.5 line-clamp-2">{t.descricao}</p>}
                          </div>
                          <button onClick={() => handleDeleteTemplate(t.id)} className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-red-500/10 text-muted hover:text-red-500 transition-all">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <div className="flex items-center gap-3 mt-3 text-[10px] text-muted">
                          <span className="flex items-center gap-1"><ListChecks className="h-3 w-3" /> {subsCount} subtarefas</span>
                          <span className={cn("px-1.5 py-0.5 rounded font-medium", prioridadeColors[t.prioridade]?.bg, prioridadeColors[t.prioridade]?.text)}>{prioridadeColors[t.prioridade]?.label}</span>
                        </div>
                        {subsCount > 0 && (
                          <div className="mt-3 space-y-1">
                            {(t.modelo_subtarefas || []).slice(0, 5).map((s, i) => {
                              const sp = profiles.find(p => p.id === s.responsavel_id);
                              return (
                                <div key={s.id || i} className="flex items-center gap-2 text-[11px] text-muted">
                                  <Square className="h-3 w-3 text-border flex-shrink-0" />
                                  <span className="flex-1 truncate">{s.titulo}</span>
                                  {sp && <span className="text-[9px] bg-foreground/5 px-1.5 py-0.5 rounded">{sp.full_name?.split(' ')[0]}</span>}
                                </div>
                              );
                            })}
                            {subsCount > 5 && <p className="text-[10px] text-muted/60 pl-5">+{subsCount - 5} mais...</p>}
                          </div>
                        )}
                      </div>
                      <div className="border-t border-border px-4 py-2.5">
                        <button onClick={() => openUseTemplate(t)} className="w-full flex items-center justify-center gap-1.5 text-xs font-medium text-violet-600 dark:text-violet-400 hover:text-violet-700 transition-colors py-1">
                          <Plus className="h-3.5 w-3.5" /> Usar este modelo
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          )}

          {view === "create" && (
            <div className="space-y-5 max-w-xl mx-auto">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1.5">Nome do Modelo</label>
                <input value={nome} onChange={e => setNome(e.target.value)} className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-violet-500 focus:outline-none" placeholder="Ex: Postar Vídeo, Lançamento..." />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1.5">Descrição (opcional)</label>
                <textarea value={descricao} onChange={e => setDescricao(e.target.value)} className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-violet-500 focus:outline-none min-h-[60px] resize-none" placeholder="Descrição do modelo..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1.5">Prioridade padrão</label>
                  <select value={prioridade} onChange={e => setPrioridade(e.target.value as TaskPriority)} className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-violet-500 focus:outline-none">
                    <option value="baixa">Baixa</option><option value="normal">Normal</option><option value="alta">Alta</option><option value="urgente">Urgente</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1.5">Responsável padrão</label>
                  <select value={respId || ""} onChange={e => setRespId(e.target.value || null)} className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-violet-500 focus:outline-none">
                    <option value="">Sem responsável</option>
                    {profiles.map(p => <option key={p.id} value={p.id}>{p.full_name}</option>)}
                  </select>
                </div>
              </div>

              {/* Subtasks builder */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-2 flex items-center gap-2">
                  <ListChecks className="h-3.5 w-3.5" /> Subtarefas do modelo ({subs.length})
                </label>
                <div className="space-y-1.5 mb-3">
                  {subs.map((s, i) => {
                    const sp = profiles.find(p => p.id === s.responsavel_id);
                    return (
                      <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-background group">
                        <GripVertical className="h-3.5 w-3.5 text-muted/40 flex-shrink-0" />
                        <span className="text-xs font-medium flex-1 truncate">{s.titulo}</span>
                        {sp && <span className="text-[9px] bg-violet-500/10 text-violet-600 px-1.5 py-0.5 rounded font-medium">{sp.full_name?.split(' ')[0]}</span>}
                        <button onClick={() => setSubs(prev => prev.filter((_, idx) => idx !== i))} className="p-0.5 rounded opacity-0 group-hover:opacity-100 hover:bg-red-500/10 text-muted hover:text-red-500 transition-all">
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    );
                  })}
                </div>
                <div className="flex items-center gap-2">
                  <input value={newSubTitle} onChange={e => setNewSubTitle(e.target.value)} onKeyDown={e => { if (e.key === "Enter") handleAddSub(); }} placeholder="Nova subtarefa..." className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-xs focus:ring-1 focus:ring-violet-500 focus:outline-none" />
                  <select value={newSubResp || ""} onChange={e => setNewSubResp(e.target.value || null)} className="rounded-md border border-border bg-background px-2 py-2 text-xs focus:ring-1 focus:ring-violet-500 focus:outline-none w-36">
                    <option value="">Sem resp.</option>
                    {profiles.map(p => <option key={p.id} value={p.id}>{p.full_name?.split(' ')[0]}</option>)}
                  </select>
                  <button onClick={handleAddSub} disabled={!newSubTitle.trim()} className="px-3 py-2 rounded-md bg-violet-600 text-white text-xs font-medium hover:bg-violet-700 disabled:opacity-40 transition-all">
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2 border-t border-border">
                <button onClick={() => setView("list")} className="px-4 py-2 text-sm text-muted hover:text-foreground">Cancelar</button>
                <button onClick={handleSaveTemplate} disabled={!nome.trim() || saving} className="px-6 py-2 rounded-md bg-violet-600 text-white text-sm font-medium hover:bg-violet-700 disabled:opacity-50 flex items-center gap-2 transition-all">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <BookTemplate className="h-4 w-4" />}
                  Salvar Modelo
                </button>
              </div>
            </div>
          )}

          {view === "use" && selectedTemplate && (
            <div className="space-y-5 max-w-xl mx-auto">
              <div className="rounded-xl border border-violet-500/20 bg-violet-500/5 p-4">
                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-violet-600 mb-2">
                  <BookTemplate className="h-3.5 w-3.5" /> Modelo selecionado
                </div>
                <h4 className="text-sm font-semibold">{selectedTemplate.nome}</h4>
                {(selectedTemplate.modelo_subtarefas || []).length > 0 && (
                  <div className="mt-2 space-y-1">
                    {(selectedTemplate.modelo_subtarefas || []).map((s, i) => {
                      const sp = profiles.find(p => p.id === s.responsavel_id);
                      return (
                        <div key={i} className="flex items-center gap-2 text-[11px] text-muted">
                          <Square className="h-3 w-3 text-violet-400 flex-shrink-0" />
                          <span className="flex-1 truncate">{s.titulo}</span>
                          {sp && <span className="text-[9px] bg-foreground/5 px-1.5 py-0.5 rounded">{sp.full_name?.split(' ')[0]}</span>}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1.5">Título da tarefa</label>
                <input value={useTitulo} onChange={e => setUseTitulo(e.target.value)} className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1.5">Prazo</label>
                  <input type="date" value={usePrazo} onChange={e => setUsePrazo(e.target.value)} className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1.5">Responsável</label>
                  <select value={useResp || ""} onChange={e => setUseResp(e.target.value || null)} className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:outline-none">
                    <option value="">Sem responsável</option>
                    {profiles.map(p => <option key={p.id} value={p.id}>{p.full_name}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2 border-t border-border">
                <button onClick={() => setView("list")} className="px-4 py-2 text-sm text-muted hover:text-foreground">Cancelar</button>
                <button onClick={handleUseTemplate} disabled={creating} className="px-6 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 disabled:opacity-50 flex items-center gap-2 transition-all">
                  {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  Criar Tarefa
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Bulk Action Bar ───────────────────────────────────── */

function BulkActionBar({ selectedCount, totalCount, onSelectAll, onClearSelection, onStatusChange, onFieldUpdate, onDelete, onCancel, profiles, isUpdating }: {
  selectedCount: number;
  totalCount: number;
  onSelectAll: () => void;
  onClearSelection: () => void;
  onStatusChange: (status: TaskStatus) => Promise<void>;
  onFieldUpdate: (updates: Partial<DBTask>) => Promise<void>;
  onDelete: () => Promise<void>;
  onCancel: () => void;
  profiles: DBProfile[];
  isUpdating: boolean;
}) {
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  const allSelected = selectedCount > 0 && selectedCount >= totalCount;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[80] flex justify-center pb-6 pointer-events-none" style={{ animation: 'bulkBarIn 0.3s ease-out' }}>
      <div className="pointer-events-auto flex items-center gap-2 rounded-2xl border border-border bg-card/95 backdrop-blur-xl px-4 py-3 shadow-2xl shadow-black/20 max-w-3xl">
        {/* Selection info */}
        <div className="flex items-center gap-2 pr-3 border-r border-border">
          <button
            onClick={allSelected ? onClearSelection : onSelectAll}
            className="flex items-center gap-1.5 text-xs font-medium text-muted hover:text-foreground transition-colors"
          >
            {allSelected ? (
              <CheckSquare2 className="h-4 w-4 text-amber-500" />
            ) : (
              <Square className="h-4 w-4" />
            )}
            {allSelected ? "Desmarcar" : "Todas"}
          </button>
          <span className="text-xs font-semibold bg-amber-500/10 text-amber-600 px-2.5 py-1 rounded-full border border-amber-500/20 min-w-[24px] text-center">
            {selectedCount}
          </span>
          <span className="text-[11px] text-muted">selecionada{selectedCount !== 1 ? "s" : ""}</span>
        </div>

        {isUpdating ? (
          <div className="flex items-center gap-2 px-4">
            <Loader2 className="h-4 w-4 animate-spin text-amber-500" />
            <span className="text-xs text-muted">Aplicando...</span>
          </div>
        ) : (
          <>
            {/* Status dropdown */}
            <div className="relative">
              <button
                onClick={() => setOpenDropdown(openDropdown === "status" ? null : "status")}
                disabled={selectedCount === 0}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-foreground hover:bg-foreground/5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Flag className="h-3.5 w-3.5" />
                Status
                <ChevronDown className={cn("h-3 w-3 text-muted transition-transform", openDropdown === "status" && "rotate-180")} />
              </button>
              {openDropdown === "status" && (
                <div className="absolute bottom-full left-0 mb-2 w-44 rounded-xl border border-border bg-card p-1.5 shadow-xl">
                  {[
                    { id: "fazer" as TaskStatus, label: "A Fazer", icon: "🔵" },
                    { id: "progresso" as TaskStatus, label: "Em Progresso", icon: "🟡" },
                    { id: "revisao" as TaskStatus, label: "Revisão", icon: "🟠" },
                    { id: "concluido" as TaskStatus, label: "Concluído", icon: "🟢" },
                  ].map(s => (
                    <button
                      key={s.id}
                      onClick={() => { setOpenDropdown(null); onStatusChange(s.id); }}
                      className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-xs font-medium hover:bg-foreground/5 transition-colors text-left"
                    >
                      <span>{s.icon}</span>
                      {s.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Priority dropdown */}
            <div className="relative">
              <button
                onClick={() => setOpenDropdown(openDropdown === "priority" ? null : "priority")}
                disabled={selectedCount === 0}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-foreground hover:bg-foreground/5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <AlertCircle className="h-3.5 w-3.5" />
                Prioridade
                <ChevronDown className={cn("h-3 w-3 text-muted transition-transform", openDropdown === "priority" && "rotate-180")} />
              </button>
              {openDropdown === "priority" && (
                <div className="absolute bottom-full left-0 mb-2 w-40 rounded-xl border border-border bg-card p-1.5 shadow-xl">
                  {[
                    { id: "baixa" as TaskPriority, label: "Baixa" },
                    { id: "normal" as TaskPriority, label: "Normal" },
                    { id: "alta" as TaskPriority, label: "Alta" },
                    { id: "urgente" as TaskPriority, label: "Urgente" },
                  ].map(p => {
                    const c = prioridadeColors[p.id as keyof typeof prioridadeColors];
                    return (
                      <button
                        key={p.id}
                        onClick={() => { setOpenDropdown(null); onFieldUpdate({ prioridade: p.id } as any); }}
                        className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-xs font-medium hover:bg-foreground/5 transition-colors text-left"
                      >
                        <span className={cn("h-2 w-2 rounded-full", c.bg.replace('/10', ''))} />
                        {p.label}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Responsible dropdown */}
            <div className="relative">
              <button
                onClick={() => setOpenDropdown(openDropdown === "resp" ? null : "resp")}
                disabled={selectedCount === 0}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-foreground hover:bg-foreground/5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <User className="h-3.5 w-3.5" />
                Responsável
                <ChevronDown className={cn("h-3 w-3 text-muted transition-transform", openDropdown === "resp" && "rotate-180")} />
              </button>
              {openDropdown === "resp" && (
                <div className="absolute bottom-full left-0 mb-2 w-52 rounded-xl border border-border bg-card shadow-xl overflow-hidden">
                  <div className="max-h-48 overflow-y-auto p-1.5">
                    <button
                      onClick={() => { setOpenDropdown(null); onFieldUpdate({ responsavel_id: null } as any); }}
                      className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-xs hover:bg-foreground/5 transition-colors text-muted"
                    >
                      <X className="h-3.5 w-3.5" /> Sem atribuição
                    </button>
                    {profiles.map(p => (
                      <button
                        key={p.id}
                        onClick={() => { setOpenDropdown(null); onFieldUpdate({ responsavel_id: p.id } as any); }}
                        className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-xs font-medium hover:bg-foreground/5 transition-colors text-left"
                      >
                        {p.avatar_url ? (
                          <img src={p.avatar_url} alt="" className="h-5 w-5 rounded-full object-cover" />
                        ) : (
                          <div className="h-5 w-5 rounded-full bg-letitia-gold/20 flex items-center justify-center text-[7px] font-bold text-letitia-gold">
                            {(p.full_name || "??").split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                          </div>
                        )}
                        {p.full_name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Divider */}
            <div className="h-6 w-px bg-border mx-1" />

            {/* Delete */}
            <button
              onClick={onDelete}
              disabled={selectedCount === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-red-500 hover:bg-red-500/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Excluir
            </button>
          </>
        )}

        {/* Cancel */}
        <div className="h-6 w-px bg-border mx-1" />
        <button
          onClick={onCancel}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-muted hover:text-foreground hover:bg-foreground/5 transition-colors"
        >
          <X className="h-3.5 w-3.5" />
          Fechar
        </button>
      </div>
    </div>
  );
}
