import { supabase } from '@/lib/supabase';

export type TaskStatus = 'fazer' | 'progresso' | 'revisao' | 'concluido';
export type TaskPriority = 'baixa' | 'normal' | 'alta' | 'urgente';

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
  return data;
}

export async function deleteTask(taskId: string) {
  const { error } = await supabase
    .from('tarefas')
    .delete()
    .eq('id', taskId);

  if (error) throw error;
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

