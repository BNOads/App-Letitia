import { supabase } from '@/lib/supabase';

export interface DBSenha {
  id: string;
  servico: string;
  usuario: string | null;
  senha: string;
  url: string | null;
  categoria: string | null;
  notas: string | null;
  favorito: boolean;
  created_at: string;
}

export async function getSenhas() {
  const { data, error } = await supabase
    .from('senhas')
    .select('*')
    .order('servico', { ascending: true });

  if (error) throw error;
  return data as DBSenha[];
}

export async function createSenha(senha: Partial<DBSenha>) {
  const { data, error } = await supabase
    .from('senhas')
    .insert([senha])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateSenha(id: string, updates: Partial<DBSenha>) {
  const { error } = await supabase
    .from('senhas')
    .update(updates)
    .eq('id', id);

  if (error) throw error;
}

export async function deleteSenha(id: string) {
  const { error } = await supabase
    .from('senhas')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export async function toggleFavoritoSenha(id: string, favorito: boolean) {
  const { error } = await supabase
    .from('senhas')
    .update({ favorito })
    .eq('id', id);

  if (error) throw error;
}
