import { supabase } from '@/lib/supabase';

export async function getDashboardStats(userId?: string) {
  const today = new Date().toISOString().split('T')[0];

  // 1. Tarefas (filtradas pelo usuário logado)
  let tarefasQuery = supabase.from('tarefas').select('id, status, titulo, prazo, prioridade, responsavel_id');
  if (userId) tarefasQuery = tarefasQuery.eq('responsavel_id', userId);
  const { data: rawTarefas } = await tarefasQuery;
  const allTarefas = (rawTarefas || []) as any[];

  // Also fetch subtasks assigned to the user
  let subtarefasQuery = supabase.from('subtarefas').select('id, concluida, titulo, prazo, responsavel_id, tarefa_id, tarefas(titulo)');
  if (userId) subtarefasQuery = subtarefasQuery.eq('responsavel_id', userId);
  const { data: rawSubtarefas } = await subtarefasQuery;

  if (rawSubtarefas) {
    rawSubtarefas.forEach((s: any) => {
      allTarefas.push({
        id: `sub_${s.id}`,
        titulo: s.titulo,
        status: s.concluida ? 'concluido' : 'fazer',
        prazo: s.prazo,
        prioridade: 'normal',
        responsavel_id: s.responsavel_id,
        __isSubtask: true,
        __parentId: s.tarefa_id,
        __parentTitle: s.tarefas?.titulo || ''
      });
    });
  }

  const totalTarefas = allTarefas.length;
  const concluidasTarefas = allTarefas.filter(t => t.status === 'concluido').length;
  const pendentes = allTarefas.filter(t => t.status !== 'concluido');
  const atrasadasTarefas = pendentes
    .filter(t => t.prazo && t.prazo < today)
    .sort((a, b) => (a.prazo || '').localeCompare(b.prazo || ''));
  const hojeTarefas = pendentes
    .filter(t => t.prazo === today)
    .sort((a, b) => (a.prazo || '').localeCompare(b.prazo || ''));
  const proximasTarefas = pendentes
    .filter(t => !t.prazo || t.prazo > today)
    .sort((a, b) => (a.prazo || '').localeCompare(b.prazo || ''));

  // 2. Agenda (Eventos)
  const { data: eventos } = await supabase
    .from('eventos')
    .select('*')
    .gte('data_evento', today)
    .order('data_evento', { ascending: true })
    .order('hora_inicio', { ascending: true })
    .limit(3);

  // 3. Tickets (Suporte) - fetch all counts in parallel
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

  // 4. Editorial (Pautas)
  const { data: pautas } = await supabase
    .from('conteudo_pautas')
    .select('*')
    .gte('data_prevista', today)
    .order('data_prevista', { ascending: true })
    .limit(3);

  return {
    tarefas: {
      total: totalTarefas,
      concluidas: concluidasTarefas,
      atrasadas: atrasadasTarefas,
      hoje: hojeTarefas,
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

