import { supabase } from '@/lib/supabase';
import { sendEmail, emailTemplates } from './emailService';
import { sendPushNotification } from './pushService';

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

  if (error) {
    console.warn('Erro ao criar notificação:', error.message);
    return;
  }

  // Dispara e-mail e push se necessário (não bloqueia)
  setTimeout(async () => {
    // 1. DISPARAR PUSH NOTIFICATION
    try {
      let subscriptions: any[] = [];
      if (params.user_id) {
        // Busca inscrições do usuário específico
        const { data } = await supabase
          .from('push_subscriptions')
          .select('subscription')
          .eq('user_id', params.user_id);
        if (data) subscriptions = data.map(s => s.subscription);
      } else {
        // Broadcast para todas as inscrições cadastradas
        const { data } = await supabase
          .from('push_subscriptions')
          .select('subscription');
        if (data) subscriptions = data.map(s => s.subscription);
      }

      if (subscriptions.length > 0) {
        const response = await sendPushNotification({
          subscriptions,
          payload: {
            title: params.titulo,
            body: params.descricao,
            icon: '/logo.png',
            badge: '/favicon.png',
            data: { url: params.link || '/' }
          }
        });

        // Autolimpeza de endpoints inativos (410 Gone / 404 Not Found)
        if (response && response.results) {
          const deadEndpoints = response.results
            .filter((r: any) => !r.success && (r.statusCode === 410 || r.statusCode === 404))
            .map((r: any) => r.endpoint);
          
          if (deadEndpoints.length > 0) {
            await supabase
              .from('push_subscriptions')
              .delete()
              .in('endpoint', deadEndpoints);
          }
        }
      }
    } catch (err) {
      console.warn('Erro ao processar envio de push notification:', err);
    }

    // 2. DISPARAR E-MAIL
    try {
      if (params.user_id) {
        // Notificação para usuário específico
        const { data: profile } = await supabase
          .from('profiles')
          .select('email, full_name, receber_notificacoes_email')
          .eq('id', params.user_id)
          .single();

        if (profile?.receber_notificacoes_email && profile?.email) {
          await sendEmail({
            to: profile.email,
            subject: params.titulo,
            html: emailTemplates.generalNotification(params.titulo, params.descricao)
          });
        }
      } else {
        // Broadcast para todos os usuários com email ativado
        const { data: profiles } = await supabase
          .from('profiles')
          .select('email')
          .eq('receber_notificacoes_email', true);

        if (profiles && profiles.length > 0) {
          const emails = profiles.map(p => p.email).filter(Boolean) as string[];
          if (emails.length > 0) {
            for (const email of emails) {
              await sendEmail({
                to: email,
                subject: params.titulo,
                html: emailTemplates.generalNotification(params.titulo, params.descricao)
              }).catch(e => console.warn('Erro ao enviar email em massa', e));
            }
          }
        }
      }
    } catch (err) {
      console.warn('Erro na rotina de email da notificação', err);
    }
  }, 0);
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
  if (error) {
    console.warn('Erro ao criar notificações em massa:', error.message);
    return;
  }

  // Dispara e-mail e push se necessário (não bloqueia)
  setTimeout(async () => {
    // 1. DISPARAR PUSH NOTIFICATION EM MASSA
    try {
      const { data } = await supabase
        .from('push_subscriptions')
        .select('subscription')
        .in('user_id', userIds);
      
      if (data && data.length > 0) {
        const subscriptions = data.map(s => s.subscription);
        const response = await sendPushNotification({
          subscriptions,
          payload: {
            title: params.titulo,
            body: params.descricao,
            icon: '/logo.png',
            badge: '/favicon.png',
            data: { url: params.link || '/' }
          }
        });

        // Autolimpeza de endpoints inativos (410 Gone / 404 Not Found)
        if (response && response.results) {
          const deadEndpoints = response.results
            .filter((r: any) => !r.success && (r.statusCode === 410 || r.statusCode === 404))
            .map((r: any) => r.endpoint);
          
          if (deadEndpoints.length > 0) {
            await supabase
              .from('push_subscriptions')
              .delete()
              .in('endpoint', deadEndpoints);
          }
        }
      }
    } catch (err) {
      console.warn('Erro ao processar envio de push notification em massa:', err);
    }

    // 2. DISPARAR E-MAIL EM MASSA
    try {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, email, receber_notificacoes_email')
        .in('id', userIds)
        .eq('receber_notificacoes_email', true);

      if (profiles && profiles.length > 0) {
        for (const profile of profiles) {
          if (profile.email) {
            await sendEmail({
              to: profile.email,
              subject: params.titulo,
              html: emailTemplates.generalNotification(params.titulo, params.descricao)
            }).catch(e => console.warn('Erro ao enviar email notificação em massa', e));
          }
        }
      }
    } catch (err) {
      console.warn('Erro na rotina de email em massa', err);
    }
  }, 0);
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
