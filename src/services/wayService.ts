import { supabase } from '@/lib/supabase';

export interface DBApplication {
  id: string;
  cliente_nome: string;
  email: string;
  whatsapp: string;
  status: string;
  data_aplicacao: string;
}

export async function getApplications() {
  const { data, error } = await supabase
    .from('theway_aplicacoes')
    .select('*')
    .order('data_aplicacao', { ascending: false });

  if (error) throw error;
  return data as DBApplication[];
}

export async function updateApplicationStatus(id: string, status: string) {
  const { error } = await supabase
    .from('theway_aplicacoes')
    .update({ status })
    .eq('id', id);

  if (error) throw error;
}
