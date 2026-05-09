import { supabase } from '@/lib/supabase';

export interface DBContent {
  id: string;
  titulo: string;
  pilar: string;
  formato: string;
  status: string;
  plataforma: string;
  data_prevista: string;
  responsavel_id: string | null;
  created_at: string;
}

export async function getContent() {
  const { data, error } = await supabase
    .from('conteudo_pautas')
    .select('*')
    .order('data_prevista', { ascending: true });

  if (error) throw error;
  return data as DBContent[];
}

export async function updateContentStatus(id: string, status: string) {
  const { error } = await supabase
    .from('conteudo_pautas')
    .update({ status })
    .eq('id', id);

  if (error) throw error;
}

export async function createContent(content: Partial<DBContent>) {
  const { data, error } = await supabase
    .from('conteudo_pautas')
    .insert([content])
    .select()
    .single();

  if (error) throw error;
  return data;
}
