import { supabase } from '@/lib/supabase';

export type TaskStatus = 'fazer' | 'progresso' | 'revisao' | 'concluido';
export type TaskPriority = 'baixa' | 'normal' | 'alta' | 'urgente';
export type RecurrenceType = 'diario' | 'semanal' | 'quinzenal' | 'mensal' | 'semestral' | 'anual';

export interface DBTask {
  id: string;
  titulo: string;
  descricao: string;
  prioridade: TaskPriority;
  status: TaskStatus;
  responsavel_id: string | null;
  prazo: string | null;
  created_at: string;
  updated_at: string;
  recorrencia?: RecurrenceType | null;
  recorrencia_pai_id?: string | null;
  profiles?: {
    full_name: string | null;
    avatar_url: string | null;
  } | null;
}

export interface TaskComment {
  id: string;
  tarefa_id: string;
  user_id: string;
  conteudo: string;
  created_at: string;
  profiles?: {
    full_name: string | null;
    avatar_url: string | null;
  } | null;
}

// ─── Recurrence helpers ────────────────────────────────────

export const recurrenceLabels: Record<RecurrenceType, string> = {
  diario: 'Diário',
  semanal: 'Semanal',
  quinzenal: 'Quinzenal',
  mensal: 'Mensal',
  semestral: 'Semestral',
  anual: 'Anual',
};

function generateRecurringDates(baseDate: string, type: RecurrenceType, count: number): string[] {
  const dates: string[] = [];
  const base = new Date(baseDate + 'T00:00:00');

  for (let i = 1; i <= count; i++) {
    const d = new Date(base);
    switch (type) {
      case 'diario':
        d.setDate(d.getDate() + i);
        break;
      case 'semanal':
        d.setDate(d.getDate() + i * 7);
        break;
      case 'quinzenal':
        d.setDate(d.getDate() + i * 14);
        break;
      case 'mensal':
        d.setMonth(d.getMonth() + i);
        break;
      case 'semestral':
        d.setMonth(d.getMonth() + i * 6);
        break;
      case 'anual':
        d.setFullYear(d.getFullYear() + i);
        break;
    }
    dates.push(d.toISOString().split('T')[0]);
  }
  return dates;
}

const RECURRENCE_COUNT: Record<RecurrenceType, number> = {
  diario: 30,
  semanal: 12,
  quinzenal: 12,
  mensal: 12,
  semestral: 4,
  anual: 3,
};

// ─── CRUD ──────────────────────────────────────────────────

export async function getTasks() {
  const { data, error } = await supabase
    .from('tarefas')
    .select(`
      *,
      profiles (
        full_name,
        avatar_url
      )
    `)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as DBTask[];
}

export async function updateTaskStatus(taskId: string, status: TaskStatus) {
  const { error } = await supabase
    .from('tarefas')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', taskId);

  if (error) throw error;
}

export async function updateTask(taskId: string, updates: Partial<DBTask>) {
  const { error } = await supabase
    .from('tarefas')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', taskId);

  if (error) throw error;
}

export async function createTask(task: Partial<DBTask>) {
  const { data, error } = await supabase
    .from('tarefas')
    .insert([task])
    .select()
    .single();

  if (error) throw error;

  // If the task has recurrence and a deadline, generate future occurrences
  if (data.recorrencia && data.prazo) {
    const count = RECURRENCE_COUNT[data.recorrencia as RecurrenceType] || 4;
    const futureDates = generateRecurringDates(data.prazo, data.recorrencia as RecurrenceType, count);

    const recurringTasks = futureDates.map(date => ({
      titulo: task.titulo,
      descricao: task.descricao,
      prioridade: task.prioridade,
      status: 'fazer' as TaskStatus,
      responsavel_id: task.responsavel_id,
      recorrencia: task.recorrencia,
      recorrencia_pai_id: data.id,
      prazo: date,
    }));

    if (recurringTasks.length > 0) {
      await supabase.from('tarefas').insert(recurringTasks);
    }
  }

  return data;
}

/** Criação de tarefas em massa */
export async function createBulkTasks(tasks: Partial<DBTask>[]): Promise<DBTask[]> {
  if (tasks.length === 0) return [];

  const { data, error } = await supabase
    .from('tarefas')
    .insert(tasks)
    .select(`
      *,
      profiles (
        full_name,
        avatar_url
      )
    `);

  if (error) throw error;
  return data as DBTask[];
}

export async function deleteTask(taskId: string) {
  const { error } = await supabase
    .from('tarefas')
    .delete()
    .eq('id', taskId);

  if (error) throw error;
}

/**
 * Deletar todas as tarefas futuras de uma recorrência
 */
export async function deleteRecurringTaskSeries(parentId: string) {
  const today = new Date().toISOString().split('T')[0];

  // Delete the parent
  await supabase.from('tarefas').delete().eq('id', parentId);

  // Delete all future children
  const { error } = await supabase
    .from('tarefas')
    .delete()
    .eq('recorrencia_pai_id', parentId)
    .gte('prazo', today);

  if (error) throw error;
}

// ─── Task History / Backup ─────────────────────────────────

const TASK_HISTORY_KEY = 'letitia_task_history_backup';
const MAX_HISTORY_SIZE = 5000;

export interface TaskHistoryEntry {
  id: string;
  tarefa_id: string;
  titulo: string;
  descricao?: string;
  prioridade: string;
  status: string;
  responsavel_nome?: string;
  responsavel_id?: string | null;
  prazo?: string | null;
  action: 'criada' | 'concluida' | 'editada' | 'excluida' | 'status_alterado' | 'bulk_criada';
  timestamp: string;
  details?: string;
}

/** Salvar entrada no histórico local */
export function saveTaskHistory(entry: Omit<TaskHistoryEntry, 'id' | 'timestamp'>) {
  try {
    const history = getTaskHistory();
    const newEntry: TaskHistoryEntry = {
      ...entry,
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
    };
    history.unshift(newEntry);
    // Limitar tamanho
    const trimmed = history.slice(0, MAX_HISTORY_SIZE);
    localStorage.setItem(TASK_HISTORY_KEY, JSON.stringify(trimmed));
  } catch (e) {
    console.warn('Erro ao salvar histórico de tarefas:', e);
  }
}

/** Recuperar histórico do localStorage */
export function getTaskHistory(): TaskHistoryEntry[] {
  try {
    const raw = localStorage.getItem(TASK_HISTORY_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as TaskHistoryEntry[];
  } catch {
    return [];
  }
}

/** Exportar histórico como JSON */
export function exportTaskHistory(): string {
  const history = getTaskHistory();
  return JSON.stringify(history, null, 2);
}

/** Limpar histórico */
export function clearTaskHistory() {
  localStorage.removeItem(TASK_HISTORY_KEY);
}

// ─── Comments ──────────────────────────────────────────────

export async function getTaskComments(taskId: string) {
  const { data, error } = await supabase
    .from('task_comments')
    .select(`
      *,
      profiles (
        full_name,
        avatar_url
      )
    `)
    .eq('tarefa_id', taskId)
    .order('created_at', { ascending: true });

  if (error) {
    // Table may not exist yet — return empty array gracefully
    console.warn('Erro ao buscar comentários:', error.message);
    return [] as TaskComment[];
  }
  return data as TaskComment[];
}

export async function addTaskComment(taskId: string, userId: string, conteudo: string) {
  const { data, error } = await supabase
    .from('task_comments')
    .insert([{ tarefa_id: taskId, user_id: userId, conteudo }])
    .select(`
      *,
      profiles (
        full_name,
        avatar_url
      )
    `)
    .single();

  if (error) throw error;
  return data as TaskComment;
}

export async function deleteTaskComment(commentId: string) {
  const { error } = await supabase
    .from('task_comments')
    .delete()
    .eq('id', commentId);

  if (error) throw error;
}
