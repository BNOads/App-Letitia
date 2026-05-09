import { supabase } from '@/lib/supabase';

export interface DBEvent {
  id: string;
  titulo: string;
  data_evento: string;
  hora_inicio: string;
  tipo: string;
  participantes: string[];
}

export async function getEvents() {
  const { data, error } = await supabase
    .from('eventos')
    .select('*')
    .order('data_evento', { ascending: true })
    .order('hora_inicio', { ascending: true });

  if (error) throw error;
  return data as DBEvent[];
}

export async function createEvent(event: Partial<DBEvent>) {
  const { data, error } = await supabase
    .from('eventos')
    .insert([event])
    .select()
    .single();

  if (error) throw error;
  return data;
}
