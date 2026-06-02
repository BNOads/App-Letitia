// Vercel Serverless Function — Open Graph meta tags para previews de link
// Tenta usar o SDK do Supabase; se falhar, retorna fallback com redirecionamento

const APP_URL = 'https://app.laetitiaeducacao.com';
const LOGO_URL = `${APP_URL}/logo.png`;
const FAVICON_URL = `${APP_URL}/favicon.png`;
const SUPABASE_URL = 'https://saoysiaolrogzfmzbsko.supabase.co';
const SUPABASE_KEY = 'sb_publishable_jVm-K3e2e73bNnK2XlBqAw_3feXCv4o';

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function fmtDate(d: string | null): string {
  if (!d) return 'Sem prazo';
  try { return new Date(d).toLocaleDateString('pt-BR'); } catch { return d; }
}

function html(title: string, desc: string, url: string): string {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<link rel="icon" type="image/png" href="${FAVICON_URL}"/>
<meta property="og:type" content="article"/>
<meta property="og:title" content="${esc(title)}"/>
<meta property="og:description" content="${esc(desc)}"/>
<meta property="og:url" content="${esc(url)}"/>
<meta property="og:image" content="${LOGO_URL}"/>
<meta property="og:site_name" content="LaetitiAPP"/>
<meta name="twitter:card" content="summary"/>
<meta name="twitter:title" content="${esc(title)}"/>
<meta name="twitter:description" content="${esc(desc)}"/>
<meta name="twitter:image" content="${LOGO_URL}"/>
<meta name="description" content="${esc(desc)}"/>
<title>${esc(title)}</title>
<meta http-equiv="refresh" content="0;url=${esc(url)}"/>
</head>
<body style="font-family:system-ui;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#F5F1EA">
<p><a href="${esc(url)}" style="color:#C9A96E">Abrindo LaetitiAPP...</a></p>
</body>
</html>`;
}

export default async function handler(req: any, res: any) {
  const taskId = req.query.task;
  const appUrl = taskId ? `${APP_URL}/tarefas?task=${taskId}` : `${APP_URL}/tarefas`;

  if (!taskId) {
    return res.writeHead(302, { Location: appUrl }).end();
  }

  let tarefa: any = null;

  // Tenta buscar a tarefa via SDK
  try {
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    const { data } = await supabase
      .from('tarefas')
      .select('id, titulo, status, prioridade, prazo, profiles:responsavel_id(full_name)')
      .eq('id', taskId)
      .single();
    tarefa = data;
  } catch (e: any) {
    console.error('OG: Supabase SDK error:', e?.message);
  }

  // Se SDK falhou, tenta REST API direto
  if (!tarefa) {
    try {
      const url = `${SUPABASE_URL}/rest/v1/tarefas?id=eq.${encodeURIComponent(taskId)}&select=id,titulo,status,prioridade,prazo`;
      const r = await fetch(url, {
        headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` },
      });
      if (r.ok) {
        const rows = await r.json();
        tarefa = rows?.[0] || null;
      }
    } catch (e: any) {
      console.error('OG: REST API error:', e?.message);
    }
  }

  // Monta o HTML
  if (tarefa) {
    const title = tarefa.titulo || 'Tarefa';
    const responsavel = tarefa.profiles?.full_name || '';
    const prazo = fmtDate(tarefa.prazo);
    const statusMap: Record<string, string> = { fazer: 'A Fazer', progresso: 'Em Andamento', revisao: 'Revisão', aprovacao: 'Aprovação', concluido: 'Concluído' };
    const status = statusMap[tarefa.status] || '';

    const parts = [
      responsavel && `👤 ${responsavel}`,
      `📅 ${prazo}`,
      status && `📋 ${status}`,
    ].filter(Boolean).join('  •  ');

    const page = html(title, parts, appUrl);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
    return res.status(200).send(page);
  }

  // Fallback genérico
  const page = html('Tarefa — LaetitiAPP', 'Abrir tarefa no LaetitiAPP', appUrl);
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  return res.status(200).send(page);
}
