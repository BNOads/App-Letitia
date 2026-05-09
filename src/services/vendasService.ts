import { supabase } from '@/lib/supabase';

export interface DBVenda {
  id: string;
  cliente_nome: string;
  produto: string;
  valor: number;
  data_venda: string;
  vendedor_id: string | null;
}

export async function getVendas() {
  const { data, error } = await supabase
    .from('vendas')
    .select('*')
    .order('data_venda', { ascending: false });

  if (error) throw error;
  return data as DBVenda[];
}

export async function createVenda(venda: Partial<DBVenda>) {
  const { data, error } = await supabase
    .from('vendas')
    .insert([venda])
    .select()
    .single();

  if (error) throw error;
  return data;
}
