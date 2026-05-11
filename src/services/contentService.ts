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
  descricao: string | null;
  big_idea: string | null;
  roteiro: string | null;
  links: string[] | null;
  prazo_seguranca: string | null;
  created_at: string;
}

export interface DBConteudoComentario {
  id: string;
  conteudo_id: string;
  user_id: string;
  tipo: 'comentario' | 'ajuste' | 'rastro';
  conteudo: string;
  created_at: string;
  // joined
  profiles?: { full_name: string; avatar_url: string | null };
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

export async function updateContent(id: string, updates: Partial<DBContent>) {
  const { error } = await supabase
    .from('conteudo_pautas')
    .update(updates)
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

export async function getConteudoComentarios(conteudoId: string) {
  const { data, error } = await supabase
    .from('conteudo_comentarios')
    .select('*, profiles(full_name, avatar_url)')
    .eq('conteudo_id', conteudoId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data as DBConteudoComentario[];
}

export async function addConteudoComentario(conteudoId: string, userId: string, conteudo: string, tipo: string = 'comentario') {
  const { data, error } = await supabase
    .from('conteudo_comentarios')
    .insert([{ conteudo_id: conteudoId, user_id: userId, conteudo, tipo }])
    .select('*, profiles(full_name, avatar_url)')
    .single();

  if (error) throw error;
  return data as DBConteudoComentario;
}
