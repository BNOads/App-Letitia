import { supabase } from '@/lib/supabase';

export async function getDashboardStats() {
  const today = new Date().toISOString().split('T')[0];

  // 1. Vendas do mês
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  const startOfMonthStr = startOfMonth.toISOString().split('T')[0];
  const { data: vendas } = await supabase.from('vendas').select('valor').gte('data_venda', startOfMonthStr);
  const totalVendas = vendas?.reduce((acc, v) => acc + Number(v.valor), 0) || 0;

  // 2. Tarefas
  const { data: allTarefas } = await supabase.from('tarefas').select('status, titulo, prazo, prioridade');
  const totalTarefas = allTarefas?.length || 0;
  const concluidasTarefas = allTarefas?.filter(t => t.status === 'concluido').length || 0;
  const proximasTarefas = allTarefas
    ?.filter(t => t.status !== 'concluido')
    .sort((a, b) => (a.prazo || '').localeCompare(b.prazo || ''))
    .slice(0, 3) || [];

  // 3. Agenda (Eventos)
  const { data: eventos } = await supabase
    .from('eventos')
    .select('*')
    .gte('data_evento', today)
    .order('data_evento', { ascending: true })
    .order('hora_inicio', { ascending: true })
    .limit(3);

  // 4. Tickets (Suporte)
  const { count: ticketsAbertos } = await supabase
    .from('tickets')
    .select('*', { count: 'exact', head: true })
    .in('status', ['Aberto', 'Em atendimento']);

  // 5. Editorial (Pautas)
  const { data: pautas } = await supabase
    .from('conteudo_pautas')
    .select('*')
    .gte('data_prevista', today)
    .order('data_prevista', { ascending: true })
    .limit(3);

  return {
    totalVendas,
    tarefas: {
      total: totalTarefas,
      concluidas: concluidasTarefas,
      proximas: proximasTarefas
    },
    eventos: eventos || [],
    ticketsAbertos: ticketsAbertos || 0,
    pautas: pautas || []
  };
}
