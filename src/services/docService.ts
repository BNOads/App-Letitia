import { supabase } from '@/lib/supabase';

export interface DBPasta {
  id: string;
  nome: string;
  favorita: boolean;
  created_at: string;
  documentos?: DBDocumento[];
}

export interface DBDocumento {
  id: string;
  titulo: string;
  conteudo: string;
  pasta_id: string;
  favorito: boolean;
  publico: boolean;
  criado_por: string | null;
  created_at: string;
}

export async function getPastas() {
  const { data, error } = await supabase
    .from('pastas')
    .select(`
      *,
      documentos (*)
    `)
    .order('nome', { ascending: true });

  if (error) throw error;
  return data as DBPasta[];
}

export async function updateDocumento(id: string, updates: Partial<DBDocumento>) {
  const { error } = await supabase
    .from('documentos')
    .update(updates)
    .eq('id', id);

  if (error) throw error;
}

export async function createDocumento(doc: Partial<DBDocumento>) {
  const { data, error } = await supabase
    .from('documentos')
    .insert([doc])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function createPasta(pasta: Partial<DBPasta>) {
  const { data, error } = await supabase
    .from('pastas')
    .insert([pasta])
    .select()
    .single();

  if (error) throw error;
  return data;
}
