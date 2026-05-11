import { supabase } from '@/lib/supabase';

export async function getDashboardStats(userId?: string) {
  const today = new Date().toISOString().split('T')[0];

  // 1. Vendas do mês
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  const startOfMonthStr = startOfMonth.toISOString().split('T')[0];
  const { data: vendas } = await supabase.from('vendas').select('valor').gte('data_venda', startOfMonthStr);
  const totalVendas = vendas?.reduce((acc, v) => acc + Number(v.valor), 0) || 0;

  // 2. Tarefas (filtradas pelo usuário logado)
  let tarefasQuery = supabase.from('tarefas').select('id, status, titulo, prazo, prioridade, responsavel_id');
  if (userId) tarefasQuery = tarefasQuery.eq('responsavel_id', userId);
  const { data: allTarefas } = await tarefasQuery;
  const totalTarefas = allTarefas?.length || 0;
  const concluidasTarefas = allTarefas?.filter(t => t.status === 'concluido').length || 0;
  const proximasTarefas = allTarefas
    ?.filter(t => t.status !== 'concluido')
    .sort((a, b) => (a.prazo || '').localeCompare(b.prazo || ''))
    .slice(0, 5) || [];

  // 3. Agenda (Eventos)
  const { data: eventos } = await supabase
    .from('eventos')
    .select('*')
    .gte('data_evento', today)
    .order('data_evento', { ascending: true })
    .order('hora_inicio', { ascending: true })
    .limit(3);

  // 4. Tickets (Suporte) - fetch all counts in parallel
  const [
    { count: ticketsAbertos },
    { count: ticketsEmAtendimento },
    { count: ticketsResolvidos },
    { data: ticketsComSLA }
  ] = await Promise.all([
    supabase.from('tickets').select('*', { count: 'exact', head: true }).eq('status', 'Aberto'),
    supabase.from('tickets').select('*', { count: 'exact', head: true }).eq('status', 'Em atendimento'),
    supabase.from('tickets').select('*', { count: 'exact', head: true }).eq('status', 'Resolvido'),
    supabase.from('tickets').select('prazo_sla').in('status', ['Aberto', 'Em atendimento']).not('prazo_sla', 'is', null)
  ]);

  const ticketsAtrasados = ticketsComSLA?.filter(t => t.prazo_sla && new Date(t.prazo_sla) < new Date()).length || 0;

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
    ticketsEmAtendimento: ticketsEmAtendimento || 0,
    ticketsAtrasados,
    ticketsResolvidos: ticketsResolvidos || 0,
    pautas: pautas || []
  };
}
