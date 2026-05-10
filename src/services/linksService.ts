import { supabase } from '@/lib/supabase';

export interface DBLink {
  id: string;
  titulo: string;
  url: string;
  categoria: string;
  favorito: boolean;
  ordem: number;
  created_at: string;
}

export async function getLinks() {
  const { data, error } = await supabase
    .from('links_uteis')
    .select('*')
    .order('ordem', { ascending: true });

  if (error) throw error;
  return data as DBLink[];
}

export async function createLink(link: Partial<DBLink>) {
  const { data, error } = await supabase
    .from('links_uteis')
    .insert([link])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateLink(id: string, updates: Partial<DBLink>) {
  const { data, error } = await supabase
    .from('links_uteis')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteLink(id: string) {
  const { error } = await supabase
    .from('links_uteis')
    .delete()
    .eq('id', id);

  if (error) throw error;
}
