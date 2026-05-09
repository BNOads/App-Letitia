import { supabase } from '@/lib/supabase';

export interface DBTicket {
  id: string;
  numero: number;
  cliente_nome: string;
  cliente_email: string;
  cliente_instagram: string | null;
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
