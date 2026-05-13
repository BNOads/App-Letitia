import { supabase } from '@/lib/supabase';

// ─── Types ─────────────────────────────────────────────────

export type NotificationType =
  | 'tarefa_concluida'
  | 'nova_tarefa'
  | 'novo_post'
  | 'novo_documento'
  | 'novo_ticket';

export interface DBNotification {
  id: string;
  tipo: NotificationType;
  titulo: string;
  descricao: string;
  link: string;
  lida: boolean;
  user_id: string | null;       // null = broadcast to everyone
  created_by: string | null;    // who triggered the notification
  ref_id: string | null;        // reference to the original item
  created_at: string;
  profiles?: {
    full_name: string | null;
    avatar_url: string | null;
  } | null;
}

// ─── Fetch ─────────────────────────────────────────────────

/** Get notifications for a given user (personal + broadcasts) */
export async function getNotifications(userId: string, limit = 50): Promise<DBNotification[]> {
  const { data, error } = await supabase
    .from('notificacoes')
    .select(`
      *,
      profiles:created_by (
        full_name,
        avatar_url
      )
    `)
    .or(`user_id.eq.${userId},user_id.is.null`)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.warn('Erro ao buscar notificações:', error.message);
    return [];
  }
  return data as DBNotification[];
}

/** Get unread count */
export async function getUnreadCount(userId: string): Promise<number> {
  const { count, error } = await supabase
    .from('notificacoes')
    .select('*', { count: 'exact', head: true })
    .or(`user_id.eq.${userId},user_id.is.null`)
    .eq('lida', false);

  if (error) {
    console.warn('Erro ao contar notificações:', error.message);
    return 0;
  }
  return count || 0;
}

// ─── Mark as Read ──────────────────────────────────────────

export async function markAsRead(notificationId: string) {
  const { error } = await supabase
    .from('notificacoes')
    .update({ lida: true })
    .eq('id', notificationId);

  if (error) console.warn('Erro ao marcar como lida:', error.message);
}

export async function markAllAsRead(userId: string) {
  const { error } = await supabase
    .from('notificacoes')
    .update({ lida: true })
    .or(`user_id.eq.${userId},user_id.is.null`)
    .eq('lida', false);

  if (error) console.warn('Erro ao marcar todas como lidas:', error.message);
}

// ─── Create Notifications ─────────────────────────────────

interface CreateNotificationParams {
  tipo: NotificationType;
  titulo: string;
  descricao: string;
  link: string;
  created_by: string | null;
  ref_id?: string | null;
  user_id?: string | null;   // null = everyone
}

export async function createNotification(params: CreateNotificationParams) {
  const { error } = await supabase
    .from('notificacoes')
    .insert([{
      tipo: params.tipo,
      titulo: params.titulo,
      descricao: params.descricao,
      link: params.link,
      lida: false,
      created_by: params.created_by,
      ref_id: params.ref_id || null,
      user_id: params.user_id !== undefined ? params.user_id : null,
    }]);

  if (error) console.warn('Erro ao criar notificação:', error.message);
}

/** Create a notification for multiple users at once */
export async function createNotificationForUsers(
  userIds: string[],
  params: Omit<CreateNotificationParams, 'user_id'>
) {
  if (userIds.length === 0) return;

  const rows = userIds.map(uid => ({
    tipo: params.tipo,
    titulo: params.titulo,
    descricao: params.descricao,
    link: params.link,
    lida: false,
    created_by: params.created_by,
    ref_id: params.ref_id || null,
    user_id: uid,
  }));

  const { error } = await supabase.from('notificacoes').insert(rows);
  if (error) console.warn('Erro ao criar notificações em massa:', error.message);
}

// ─── Convenience Helpers (call from existing services) ────

/** Notify everyone: a task was completed */
export async function notifyTaskCompleted(
  taskTitle: string,
  taskId: string,
  completedByUserId: string,
  completedByName: string
) {
  await createNotification({
    tipo: 'tarefa_concluida',
    titulo: 'Tarefa concluída',
    descricao: `${completedByName} concluiu a tarefa "${taskTitle}"`,
    link: '/tarefas',
    created_by: completedByUserId,
    ref_id: taskId,
    user_id: null, // broadcast
  });
}

/** Notify specific user: a new task was assigned to them */
export async function notifyNewTaskAssigned(
  taskTitle: string,
  taskId: string,
  assignedToUserId: string,
  assignedByUserId: string,
  assignedByName: string
) {
  await createNotification({
    tipo: 'nova_tarefa',
    titulo: 'Nova tarefa atribuída',
    descricao: `${assignedByName} atribuiu a tarefa "${taskTitle}" para você`,
    link: '/tarefas',
    created_by: assignedByUserId,
    ref_id: taskId,
    user_id: assignedToUserId,
  });
}

/** Notify everyone: a new post was created */
export async function notifyNewPost(
  postTitle: string,
  postId: string,
  createdByUserId: string,
  createdByName: string,
  responsavelId?: string | null
) {
  // Broadcast for everyone
  await createNotification({
    tipo: 'novo_post',
    titulo: 'Nova pauta editorial',
    descricao: `${createdByName} criou a pauta "${postTitle}"`,
    link: '/editorial',
    created_by: createdByUserId,
    ref_id: postId,
    user_id: null,
  });

  // Extra notification for the responsible person
  if (responsavelId && responsavelId !== createdByUserId) {
    await createNotification({
      tipo: 'novo_post',
      titulo: 'Você é responsável por uma nova pauta',
      descricao: `${createdByName} criou a pauta "${postTitle}" e você é o responsável`,
      link: '/editorial',
      created_by: createdByUserId,
      ref_id: postId,
      user_id: responsavelId,
    });
  }
}

/** Notify everyone: a new document was created */
export async function notifyNewDocument(
  docTitle: string,
  docId: string,
  createdByUserId: string,
  createdByName: string
) {
  await createNotification({
    tipo: 'novo_documento',
    titulo: 'Novo documento',
    descricao: `${createdByName} criou o documento "${docTitle}"`,
    link: '/documentos',
    created_by: createdByUserId,
    ref_id: docId,
    user_id: null,
  });
}

/** Notify everyone: a new ticket was created */
export async function notifyNewTicket(
  ticketNumero: number,
  clienteNome: string,
  ticketId: string,
  createdByUserId: string,
  createdByName: string
) {
  await createNotification({
    tipo: 'novo_ticket',
    titulo: 'Novo ticket de suporte',
    descricao: `${createdByName} abriu o ticket #${ticketNumero} — ${clienteNome}`,
    link: '/suporte',
    created_by: createdByUserId,
    ref_id: ticketId,
    user_id: null,
  });
}
