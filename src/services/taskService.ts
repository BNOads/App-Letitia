import { supabase } from '@/lib/supabase';

// ─── AUREA Webhook ─────────────────────────────────────────
const AUREA_WEBHOOK_URL = 'https://aureawook.redbearid.com.br/webhook/838ae18f-330a-424b-bd4a-bb509bce699e-lc';
const AUREA_PROFILE_NAME = 'Áurea Design';

type WebhookAction = 'criado' | 'atualizado';
type WebhookTipo = 'tarefa' | 'subtarefa';

/** Cache do ID da Áurea para não buscar no banco a cada chamada */
let _aureaIdCache: string | null = null;
let _aureaIdFetched = false;

async function getAureaProfileId(): Promise<string | null> {
  if (_aureaIdFetched) return _aureaIdCache;
  try {
    const { data } = await supabase
      .from('profiles')
      .select('id')
      .eq('full_name', AUREA_PROFILE_NAME)
      .single();
    _aureaIdCache = data?.id ?? null;
  } catch {
    _aureaIdCache = null;
  }
  _aureaIdFetched = true;
  return _aureaIdCache;
}

/** Verifica se o responsável é a Áurea Design */
async function isAureaResponsavel(responsavelId: string | null | undefined): Promise<boolean> {
  if (!responsavelId) return false;
  const aureaId = await getAureaProfileId();
  return aureaId !== null && responsavelId === aureaId;
}

/**
 * Dispara webhook para AUREA somente quando ela é a responsável.
 * Fire-and-forget: não bloqueia a operação principal.
 */
async function sendAureaWebhook(action: WebhookAction, tipo: WebhookTipo, itemData: Record<string, any>) {
  try {
    // Só dispara se a Áurea for a responsável
    const responsavelId = itemData.responsavel_id;
    if (!(await isAureaResponsavel(responsavelId))) return;

    await fetch(AUREA_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: action,
        tipo,
        timestamp: new Date().toISOString(),
        ...(tipo === 'tarefa' ? { tarefa: itemData } : { subtarefa: itemData }),
      }),
    });
  } catch (err) {
    console.warn(`[AUREA Webhook] Erro ao enviar (${action} ${tipo}):`, err);
  }
}

export type TaskStatus = 'fazer' | 'progresso' | 'revisao' | 'concluido' | 'espera';
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
  em_aprovacao?: boolean;
  profiles?: {
    full_name: string | null;
    avatar_url: string | null;
  } | null;
  created_by?: string | null;
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
  if (status === 'concluido') {
    const { data: task } = await supabase.from('tarefas').select('*').eq('id', taskId).single();
    if (task && task.recorrencia && task.prazo) {
      const parentId = task.recorrencia_pai_id || task.id;
      const { count } = await supabase
        .from('tarefas')
        .select('*', { count: 'exact', head: true })
        .eq('recorrencia_pai_id', parentId)
        .gt('prazo', task.prazo);

      if (count === 0) {
        const nextDates = generateRecurringDates(task.prazo, task.recorrencia as RecurrenceType, 1);
        if (nextDates.length > 0) {
          const nextTask = {
            titulo: task.titulo,
            descricao: task.descricao,
            prioridade: task.prioridade,
            status: 'fazer' as TaskStatus,
            responsavel_id: task.responsavel_id,
            recorrencia: task.recorrencia,
            recorrencia_pai_id: parentId,
            prazo: nextDates[0],
            created_by: task.created_by,
          };
          const { data: newRecurring } = await supabase.from('tarefas').insert([nextTask]).select().single();
          if (newRecurring) sendAureaWebhook('criado', 'tarefa', newRecurring);
        }
      }
    }
  }

  const { error } = await supabase
    .from('tarefas')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', taskId);

  if (error) throw error;

  // Webhook AUREA – status atualizado
  const { data: updatedTask } = await supabase.from('tarefas').select('*').eq('id', taskId).single();
  if (updatedTask) sendAureaWebhook('atualizado', 'tarefa', updatedTask);
}

export async function updateTask(taskId: string, updates: Partial<DBTask>) {
  const { error } = await supabase
    .from('tarefas')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', taskId);

  if (error) throw error;

  // Webhook AUREA – tarefa atualizada
  const { data: updatedTask } = await supabase.from('tarefas').select('*').eq('id', taskId).single();
  if (updatedTask) sendAureaWebhook('atualizado', 'tarefa', updatedTask);
}

export async function createTask(task: Partial<DBTask>) {
  const { data, error } = await supabase
    .from('tarefas')
    .insert([task])
    .select()
    .single();

  if (error) throw error;

  // Webhook AUREA – tarefa criada (só se Áurea for responsável)
  sendAureaWebhook('criado', 'tarefa', data);

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

  // Webhook AUREA – cada tarefa criada em massa (só se Áurea for responsável)
  for (const t of (data as DBTask[])) {
    sendAureaWebhook('criado', 'tarefa', t);
  }

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

/**
 * Limpar tarefas recorrentes duplicadas pendentes.
 * Para cada grupo de recorrência, mantém apenas a tarefa pendente
 * com o prazo mais próximo e exclui as demais pendentes futuras.
 */
export async function cleanupDuplicateRecurringTasks() {
  // Fetch all recurring tasks that are NOT completed
  const { data: allRecurring, error } = await supabase
    .from('tarefas')
    .select('id, recorrencia, recorrencia_pai_id, prazo, status')
    .not('recorrencia', 'is', null)
    .neq('status', 'concluido');

  if (error) {
    console.warn('Erro ao buscar tarefas recorrentes:', error.message);
    return;
  }
  if (!allRecurring || allRecurring.length === 0) return;

  // Group by recurrence parent
  const groups = new Map<string, typeof allRecurring>();
  allRecurring.forEach(t => {
    const groupId = t.recorrencia_pai_id || t.id;
    const list = groups.get(groupId) || [];
    list.push(t);
    groups.set(groupId, list);
  });

  // For each group with more than 1 pending task, delete all but the earliest
  const idsToDelete: string[] = [];
  groups.forEach((tasks) => {
    if (tasks.length <= 1) return;
    // Sort by prazo ascending
    tasks.sort((a, b) => {
      const pa = a.prazo || '9999-12-31';
      const pb = b.prazo || '9999-12-31';
      return pa.localeCompare(pb);
    });
    // Keep the first, mark rest for deletion
    for (let i = 1; i < tasks.length; i++) {
      idsToDelete.push(tasks[i].id);
    }
  });

  if (idsToDelete.length === 0) return;

  console.log(`Limpando ${idsToDelete.length} tarefas recorrentes duplicadas...`);
  
  // Delete in batches
  const batchSize = 50;
  for (let i = 0; i < idsToDelete.length; i += batchSize) {
    const batch = idsToDelete.slice(i, i + batchSize);
    const { error: delError } = await supabase
      .from('tarefas')
      .delete()
      .in('id', batch);
    if (delError) {
      console.warn('Erro ao deletar tarefas recorrentes duplicadas:', delError.message);
    }
  }
  
  console.log('Limpeza de tarefas recorrentes concluída.');
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

// ─── Subtasks ──────────────────────────────────────────────

export interface DBSubtask {
  id: string;
  tarefa_id: string;
  titulo: string;
  descricao: string | null;
  concluida: boolean;
  status?: string;
  responsavel_id: string | null;
  prazo: string | null;
  ordem: number;
  created_at: string;
  profiles?: {
    full_name: string | null;
    avatar_url: string | null;
  } | null;
}

export async function getSubtasks(taskId: string): Promise<DBSubtask[]> {
  const { data, error } = await supabase
    .from('subtarefas')
    .select(`
      *,
      profiles (
        full_name,
        avatar_url
      )
    `)
    .eq('tarefa_id', taskId)
    .order('ordem', { ascending: true });

  if (error) {
    console.warn('Erro ao buscar subtarefas:', error.message);
    return [] as DBSubtask[];
  }
  return data as DBSubtask[];
}

/** Fetch ALL subtasks (across all tasks) with parent task info */
export async function getAllSubtasks(): Promise<(DBSubtask & { tarefas?: { titulo: string; id: string } | null })[]> {
  const { data, error } = await supabase
    .from('subtarefas')
    .select(`
      *,
      profiles (
        full_name,
        avatar_url
      ),
      tarefas (
        id,
        titulo
      )
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.warn('Erro ao buscar todas subtarefas:', error.message);
    return [];
  }
  return data as any[];
}

export async function createSubtask(subtask: Partial<DBSubtask>): Promise<DBSubtask> {
  const { data, error } = await supabase
    .from('subtarefas')
    .insert([subtask])
    .select(`
      *,
      profiles (
        full_name,
        avatar_url
      )
    `)
    .single();

  if (error) throw error;

  // Webhook AUREA – subtarefa criada (só se Áurea for responsável)
  // Re-fetch com joins para payload completo
  const { data: fullSub } = await supabase
    .from('subtarefas')
    .select(`
      *,
      profiles (
        full_name,
        avatar_url
      ),
      tarefas (
        id,
        titulo
      )
    `)
    .eq('id', data.id)
    .single();
  sendAureaWebhook('criado', 'subtarefa', fullSub || data);

  return data as DBSubtask;
}

export async function updateSubtask(id: string, updates: Partial<DBSubtask>) {
  const { error } = await supabase
    .from('subtarefas')
    .update(updates)
    .eq('id', id);

  if (error) throw error;

  // Webhook AUREA – subtarefa atualizada (só se Áurea for responsável)
  const { data: updatedSub } = await supabase
    .from('subtarefas')
    .select(`
      *,
      profiles (
        full_name,
        avatar_url
      ),
      tarefas (
        id,
        titulo
      )
    `)
    .eq('id', id)
    .single();
  if (updatedSub) sendAureaWebhook('atualizado', 'subtarefa', updatedSub);
}

export async function toggleSubtask(id: string, concluida: boolean) {
  const { error } = await supabase
    .from('subtarefas')
    .update({ concluida, status: concluida ? 'concluido' : 'fazer' })
    .eq('id', id);

  if (error) throw error;

  // Webhook AUREA – subtarefa toggle (só se Áurea for responsável)
  const { data: toggledSub } = await supabase
    .from('subtarefas')
    .select(`
      *,
      profiles (
        full_name,
        avatar_url
      ),
      tarefas (
        id,
        titulo
      )
    `)
    .eq('id', id)
    .single();
  if (toggledSub) sendAureaWebhook('atualizado', 'subtarefa', toggledSub);
}

export async function deleteSubtask(id: string) {
  const { error } = await supabase
    .from('subtarefas')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export async function createBulkSubtasks(subtasks: Partial<DBSubtask>[]): Promise<DBSubtask[]> {
  if (subtasks.length === 0) return [];
  const { data, error } = await supabase
    .from('subtarefas')
    .insert(subtasks)
    .select(`
      *,
      profiles (
        full_name,
        avatar_url
      ),
      tarefas (
        id,
        titulo
      )
    `);

  if (error) throw error;

  // Webhook AUREA – cada subtarefa criada em massa (só se Áurea for responsável)
  for (const s of (data as DBSubtask[])) {
    sendAureaWebhook('criado', 'subtarefa', s);
  }

  return data as DBSubtask[];
}

// ─── Task Templates (Modelos) ──────────────────────────────

export interface DBTaskTemplate {
  id: string;
  nome: string;
  descricao: string | null;
  prioridade: TaskPriority;
  responsavel_id: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  profiles?: {
    full_name: string | null;
    avatar_url: string | null;
  } | null;
  modelo_subtarefas?: DBTemplateSubtask[];
}

export interface DBTemplateSubtask {
  id: string;
  modelo_id: string;
  titulo: string;
  responsavel_id: string | null;
  ordem: number;
  created_at: string;
  profiles?: {
    full_name: string | null;
    avatar_url: string | null;
  } | null;
}

export async function getTaskTemplates(): Promise<DBTaskTemplate[]> {
  const { data, error } = await supabase
    .from('tarefa_modelos')
    .select(`
      *,
      profiles!tarefa_modelos_responsavel_id_fkey (
        full_name,
        avatar_url
      ),
      modelo_subtarefas (
        *,
        profiles!modelo_subtarefas_responsavel_id_fkey (
          full_name,
          avatar_url
        )
      )
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.warn('Erro ao buscar modelos:', error.message);
    return [] as DBTaskTemplate[];
  }
  return (data as DBTaskTemplate[]).map(t => ({
    ...t,
    modelo_subtarefas: (t.modelo_subtarefas || []).sort((a, b) => a.ordem - b.ordem),
  }));
}

export async function createTaskTemplate(template: {
  nome: string;
  descricao?: string;
  prioridade?: TaskPriority;
  responsavel_id?: string | null;
  created_by?: string | null;
  subtarefas: { titulo: string; responsavel_id?: string | null; ordem: number }[];
}): Promise<DBTaskTemplate> {
  const { subtarefas, ...templateData } = template;
  const { data, error } = await supabase
    .from('tarefa_modelos')
    .insert([templateData])
    .select()
    .single();

  if (error) throw error;

  if (subtarefas.length > 0) {
    const subs = subtarefas.map(s => ({
      modelo_id: data.id,
      titulo: s.titulo,
      responsavel_id: s.responsavel_id || null,
      ordem: s.ordem,
    }));
    await supabase.from('modelo_subtarefas').insert(subs);
  }

  return data as DBTaskTemplate;
}

export async function updateTaskTemplate(id: string, updates: Partial<DBTaskTemplate>) {
  const { error } = await supabase
    .from('tarefa_modelos')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) throw error;
}

export async function deleteTaskTemplate(id: string) {
  const { error } = await supabase
    .from('tarefa_modelos')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export async function updateTemplateSubtasks(
  modeloId: string,
  subtarefas: { titulo: string; responsavel_id?: string | null; ordem: number }[]
) {
  await supabase.from('modelo_subtarefas').delete().eq('modelo_id', modeloId);

  if (subtarefas.length > 0) {
    const subs = subtarefas.map(s => ({
      modelo_id: modeloId,
      titulo: s.titulo,
      responsavel_id: s.responsavel_id || null,
      ordem: s.ordem,
    }));
    const { error } = await supabase.from('modelo_subtarefas').insert(subs);
    if (error) throw error;
  }
}

/** Create a task from a template, including all template subtasks */
export async function createTaskFromTemplate(
  template: DBTaskTemplate,
  overrides: {
    titulo?: string;
    descricao?: string;
    prazo?: string | null;
    responsavel_id?: string | null;
    prioridade?: TaskPriority;
    created_by?: string | null;
  } = {}
): Promise<DBTask> {
  const taskData = {
    titulo: overrides.titulo || template.nome,
    descricao: overrides.descricao || template.descricao || '',
    prioridade: overrides.prioridade || template.prioridade || 'normal',
    status: 'fazer' as TaskStatus,
    responsavel_id: overrides.responsavel_id !== undefined ? overrides.responsavel_id : template.responsavel_id,
    prazo: overrides.prazo || null,
    created_by: overrides.created_by || null,
  };

  const { data, error } = await supabase
    .from('tarefas')
    .insert([taskData])
    .select()
    .single();

  if (error) throw error;

  const templateSubs = template.modelo_subtarefas || [];
  if (templateSubs.length > 0) {
    const subs = templateSubs.map(s => ({
      tarefa_id: data.id,
      titulo: s.titulo,
      concluida: false,
      responsavel_id: s.responsavel_id || null,
      ordem: s.ordem,
    }));
    await supabase.from('subtarefas').insert(subs);
  }

  // Webhook AUREA – tarefa criada a partir de modelo (só se Áurea for responsável)
  sendAureaWebhook('criado', 'tarefa', data);

  return data as DBTask;
}
