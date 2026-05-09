import { supabase } from '@/lib/supabase';

export async function getDashboardStats() {
  // 1. Vendas do mês (Mock real connection)
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  const startOfMonthStr = startOfMonth.toISOString().split('T')[0];

  const { data: vendas } = await supabase
    .from('vendas')
    .select('valor')
    .gte('data_venda', startOfMonthStr);

  const totalVendas = vendas?.reduce((acc, v) => acc + Number(v.valor), 0) || 0;

  // 2. Aplicações THE WAY pendentes
  const { count: pendentesTheWay } = await supabase
    .from('theway_aplicacoes')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pendente');

  // 3. Tarefas do dia (atribuídas ao usuário logado)
  const today = new Date().toISOString().split('T')[0];
  const { count: tarefasHoje } = await supabase
    .from('tarefas')
    .select('*', { count: 'exact', head: true })
    .eq('prazo', today);

  // 4. Próximas pautas
  const { data: pautas } = await supabase
    .from('conteudo_pautas')
    .select('*')
    .gte('data_prevista', today)
    .order('data_prevista', { ascending: true })
    .limit(3);

  return {
    totalVendas,
    pendentesTheWay: pendentesTheWay || 0,
    tarefasHoje: tarefasHoje || 0,
    pautas: pautas || []
  };
}
