import { supabase } from '@/lib/supabase';

export interface DBTicket {
  id: string;
  numero: number;
  cliente_nome: string;
  cliente_email: string;
  cliente_instagram: string | null;
  cliente_telefone: string | null;
  categoria: string;
  prioridade: string;
  status: string;
  responsavel_id: string | null;
  data_abertura: string;
  prazo_sla: string | null;
  profiles?: {
    full_name: string;
    avatar_url: string;
  };
}

export interface DBTicketComment {
  id: string;
  ticket_id: string;
  user_id: string;
  conteudo: string;
  is_system?: boolean;
  created_at: string;
  profiles?: {
    full_name: string;
    avatar_url: string;
  };
}

export async function getTickets() {
  const { data, error } = await supabase
    .from('tickets')
    .select(`
      *,
      profiles (
        full_name,
        avatar_url
      )
    `)
    .order('numero', { ascending: false });

  if (error) throw error;
  return data as DBTicket[];
}

export async function updateTicketStatus(id: string, status: string) {
  const { error } = await supabase
    .from('tickets')
    .update({ status })
    .eq('id', id);

  if (error) throw error;
}

export async function createTicket(ticket: Partial<DBTicket>) {
  const { data, error } = await supabase
    .from('tickets')
    .insert([ticket])
    .select()
    .single();

  if (error) throw error;
  return data;
}
export async function updateTicket(id: string, updates: Partial<DBTicket>) {
  const { error } = await supabase
    .from('tickets')
    .update(updates)
    .eq('id', id);

  if (error) throw error;
}

export async function deleteTicket(id: string) {
  const { error } = await supabase
    .from('tickets')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export async function getComments(ticketId: string) {
  const { data, error } = await supabase
    .from('ticket_comments')
    .select(`
      *,
      profiles (
        full_name,
        avatar_url
      )
    `)
    .eq('ticket_id', ticketId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data as DBTicketComment[];
}

export async function createComment(comment: Partial<DBTicketComment>) {
  const { data, error } = await supabase
    .from('ticket_comments')
    .insert([comment])
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Transferir ticket para outro responsável com motivo registrado no histórico.
 */
export async function transferTicket(
  ticketId: string,
  fromUserId: string,
  toUserId: string,
  motivo: string,
  fromName: string,
  toName: string
) {
  // 1. Atualizar responsável
  await updateTicket(ticketId, { responsavel_id: toUserId } as any);

  // 2. Criar comentário de sistema com o motivo
  const conteudo = `🔄 **Transferência**: ${fromName} transferiu para ${toName}.\n📝 **Motivo**: ${motivo}`;
  await createComment({
    ticket_id: ticketId,
    user_id: fromUserId,
    conteudo,
    is_system: true,
  } as any);
}

/**
 * Concluir/resolver um ticket registrando no histórico.
 */
export async function resolveTicket(ticketId: string, userId: string, userName: string) {
  await updateTicketStatus(ticketId, 'Resolvido');

  const conteudo = `✅ **Ticket concluído** por ${userName}.`;
  await createComment({
    ticket_id: ticketId,
    user_id: userId,
    conteudo,
    is_system: true,
  } as any);
}
