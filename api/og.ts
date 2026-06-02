// Vercel Serverless Function — gera HTML com meta tags OG para link previews
// Usa fetch direto na REST API do Supabase (sem dependências externas)

const SUPABASE_URL = 'https://saoysiaolrogzfmzbsko.supabase.co';
const SUPABASE_KEY = 'sb_publishable_jVm-K3e2e73bNnK2XlBqAw_3feXCv4o';
const APP_URL = 'https://app.laetitiaeducacao.com';
const LOGO_URL = `${APP_URL}/logo.png`;

function esc(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function fmtDate(d: string | null): string {
  if (!d) return 'Sem prazo';
  try { return new Date(d).toLocaleDateString('pt-BR'); } catch { return d; }
}

function buildHtml(title: string, description: string, url: string): string {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta property="og:type" content="article"/>
<meta property="og:title" content="${esc(title)}"/>
<meta property="og:description" content="${esc(description)}"/>
<meta property="og:url" content="${esc(url)}"/>
<meta property="og:image" content="${LOGO_URL}"/>
<meta property="og:site_name" content="LaetitiAPP"/>
<meta name="twitter:card" content="summary"/>
<meta name="twitter:title" content="${esc(title)}"/>
<meta name="twitter:description" content="${esc(description)}"/>
<meta name="twitter:image" content="${LOGO_URL}"/>
<meta name="description" content="${esc(description)}"/>
<title>${esc(title)} — LaetitiAPP</title>
<meta http-equiv="refresh" content="0;url=${esc(url)}"/>
</head>
<body style="font-family:system-ui,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#F5F1EA;color:#333">
<div style="text-align:center;padding:2rem">
<p style="font-size:14px;color:#888">Redirecionando...</p>
<a href="${esc(url)}" style="color:#C9A96E">Clique aqui</a>
</div>
</body>
</html>`;
}

export default async function handler(req: any, res: any) {
  const taskId = req.query.task;
  const appUrl = taskId ? `${APP_URL}/tarefas?task=${taskId}` : `${APP_URL}/tarefas`;

  // Sem task ID → redireciona
  if (!taskId) {
    return res.writeHead(302, { Location: appUrl }).end();
  }

  try {
    // Busca tarefa via REST API do Supabase (sem SDK)
    const apiUrl = `${SUPABASE_URL}/rest/v1/tarefas?id=eq.${taskId}&select=id,titulo,descricao,status,prioridade,prazo,responsavel_id,profiles:responsavel_id(full_name)`;
    const resp = await fetch(apiUrl, {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
      },
    });

    if (!resp.ok) throw new Error(`Supabase ${resp.status}`);

    const rows = await resp.json();
    const tarefa = rows?.[0];

    if (!tarefa) {
      // Tarefa não encontrada — fallback com redirecionamento
      const html = buildHtml('Tarefa — LaetitiAPP', 'Abrir tarefa no LaetitiAPP', appUrl);
      return res.setHeader('Content-Type', 'text/html; charset=utf-8').status(200).send(html);
    }

    const title = tarefa.titulo || 'Tarefa';
    const responsavel = tarefa.profiles?.full_name || 'Sem responsável';
    const prazo = fmtDate(tarefa.prazo);
    const statusMap: Record<string, string> = { fazer: 'A Fazer', progresso: 'Em Andamento', revisao: 'Revisão', aprovacao: 'Aprovação', concluido: 'Concluído' };
    const status = statusMap[tarefa.status] || tarefa.status || '';
    const prioMap: Record<string, string> = { baixa: 'Baixa', normal: 'Normal', alta: 'Alta', urgente: 'Urgente' };
    const prioridade = prioMap[tarefa.prioridade] || tarefa.prioridade || '';

    const description = `👤 ${responsavel}  •  📅 ${prazo}  •  ${status}  •  ${prioridade}`;

    const html = buildHtml(title, description, appUrl);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
    return res.status(200).send(html);

  } catch (err: any) {
    // Fallback: redireciona mesmo se der erro
    console.error('OG error:', err?.message || err);
    const html = buildHtml('Tarefa — LaetitiAPP', 'Abrir tarefa no LaetitiAPP', appUrl);
    return res.setHeader('Content-Type', 'text/html; charset=utf-8').status(200).send(html);
  }
}
