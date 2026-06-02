import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://saoysiaolrogzfmzbsko.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return 'Sem prazo';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

export default async function handler(req: any, res: any) {
  const taskId = req.query.task;

  if (!taskId) {
    // Sem task ID — redireciona para o app
    res.writeHead(302, { Location: '/tarefas' });
    res.end();
    return;
  }

  try {
    // Busca a tarefa com o perfil do responsável
    const { data: tarefa, error } = await supabase
      .from('tarefas')
      .select(`
        id, titulo, descricao, status, prioridade, prazo, created_at,
        profiles:responsavel_id (
          full_name,
          avatar_url
        )
      `)
      .eq('id', taskId)
      .single();

    if (error || !tarefa) {
      // Tarefa não encontrada — redireciona para o app com o param
      res.writeHead(302, { Location: `/tarefas?task=${taskId}` });
      res.end();
      return;
    }

    const title = escapeHtml(tarefa.titulo || 'Tarefa');
    const responsavel = (tarefa.profiles as any)?.full_name || 'Sem responsável';
    const prazo = formatDate(tarefa.prazo);
    const statusMap: Record<string, string> = {
      fazer: '📋 A Fazer',
      progresso: '🔄 Em Andamento',
      revisao: '👀 Revisão',
      aprovacao: '✅ Aprovação',
      concluido: '✔️ Concluído',
    };
    const status = statusMap[tarefa.status] || tarefa.status;
    const prioridadeMap: Record<string, string> = {
      baixa: '🟢 Baixa',
      normal: '🔵 Normal',
      alta: '🟠 Alta',
      urgente: '🔴 Urgente',
    };
    const prioridade = prioridadeMap[tarefa.prioridade] || tarefa.prioridade;

    // Monta descrição rica para o OG
    const description = escapeHtml(
      `👤 ${responsavel} • 📅 ${prazo} • ${status} • ${prioridade}`
    );

    const appUrl = `https://app.laetitiaeducacao.com/tarefas?task=${taskId}`;
    const logoUrl = 'https://app.laetitiaeducacao.com/logo.png';

    // HTML com meta OG + redirecionamento automático para o app
    const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} — LaetitiAPP</title>

  <!-- Open Graph (WhatsApp, Facebook, LinkedIn) -->
  <meta property="og:type" content="article" />
  <meta property="og:title" content="${title}" />
  <meta property="og:description" content="${description}" />
  <meta property="og:url" content="${escapeHtml(appUrl)}" />
  <meta property="og:image" content="${logoUrl}" />
  <meta property="og:site_name" content="LaetitiAPP" />

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary" />
  <meta name="twitter:title" content="${title}" />
  <meta name="twitter:description" content="${description}" />
  <meta name="twitter:image" content="${logoUrl}" />

  <!-- Descrição genérica -->
  <meta name="description" content="${description}" />

  <!-- Redireciona humanos para o app -->
  <meta http-equiv="refresh" content="0;url=${escapeHtml(appUrl)}" />
</head>
<body style="font-family: system-ui, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: #F5F1EA; color: #333;">
  <div style="text-align: center; padding: 2rem;">
    <p style="font-size: 14px; color: #888;">Redirecionando para LaetitiAPP...</p>
    <p><a href="${escapeHtml(appUrl)}" style="color: #C9A96E; text-decoration: underline;">Clique aqui se não for redirecionado</a></p>
  </div>
</body>
</html>`;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
    res.status(200).send(html);
  } catch (err: any) {
    console.error('Erro ao gerar OG para tarefa:', err);
    res.writeHead(302, { Location: `/tarefas?task=${taskId}` });
    res.end();
  }
}
