import { supabase } from '@/lib/supabase';

export interface DBContact {
  id: string;
  nome: string;
  email: string;
  telefone: string | null;
  pilar: string | null;
  tags: string[];
  produtos: string[];
  origem: string | null;
  created_at: string;
}

export async function getContacts() {
  const { data, error } = await supabase
    .from('contatos')
    .select('*')
    .order('nome', { ascending: true });

  if (error) throw error;
  return data as DBContact[];
}

export async function createContact(contact: Partial<DBContact>) {
  const { data, error } = await supabase
    .from('contatos')
    .insert([contact])
    .select()
    .single();

  if (error) throw error;
  return data;
}
