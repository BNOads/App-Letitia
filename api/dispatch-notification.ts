import webpush from 'web-push';
import { Resend } from 'resend';

/**
 * Endpoint acionado por um Database Webhook do Supabase (trigger AFTER INSERT
 * em `notificacoes`). Faz o envio de Push + E-mail SERVER-SIDE, de forma
 * confiável — não depende mais do navegador de quem disparou a ação.
 *
 * O trigger no banco já coleta as inscrições de push e os e-mails elegíveis
 * (SECURITY DEFINER), então este endpoint só precisa disparar os envios.
 */

// ─── VAPID (Push) ──────────────────────────────────────────
const vapidPublicKey =
  process.env.VAPID_PUBLIC_KEY ||
  'BFus97kRwt6LrSp9jzHocgtdpZ4uFmDsCrUazBsvdhsi4J8lzROnVDIVJ3hmCWZDCVS_SIty8IuyAkSX2f1INvg';
const vapidPrivateKey =
  process.env.VAPID_PRIVATE_KEY || 'z_p4b8MbLuDZQXsRGErD91_zKVii2UepLVDLEZp_JJs';

webpush.setVapidDetails(
  'mailto:notificacoes@app.laetitiaeducacao.com',
  vapidPublicKey,
  vapidPrivateKey
);

// ─── Resend (E-mail) ───────────────────────────────────────
const resend = new Resend(
  process.env.RESEND_API_KEY || 're_JeHJzoKE_A6TBDjKVAk4WH2j9QB6zhVTP'
);

const EMAIL_FROM = 'Sistema Laetitia <notificacoes@app.laetitiaeducacao.com>';

function emailHtml(title: string, description: string) {
  return `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
      <h2 style="color: #4F46E5;">${title}</h2>
      <p>${description}</p>
      <br />
      <p style="font-size: 12px; color: #888;">Você está recebendo este e-mail porque as notificações por e-mail estão habilitadas em seu perfil.</p>
    </div>
  `;
}

/**
 * Remove do banco as inscrições cujos endpoints expiraram (410/404).
 * Opcional: só roda se as variáveis de service role estiverem configuradas.
 */
async function cleanupDeadEndpoints(deadEndpoints: string[]) {
  if (deadEndpoints.length === 0) return;
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return; // cleanup é opcional

  try {
    const { createClient } = await import('@supabase/supabase-js');
    const admin = createClient(url, serviceKey);
    await admin.from('push_subscriptions').delete().in('endpoint', deadEndpoints);
  } catch (err) {
    console.warn('Falha ao limpar endpoints inativos:', err);
  }
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Autenticação: segredo compartilhado entre o trigger e este endpoint
  const expectedSecret = process.env.WEBHOOK_SECRET;
  const providedSecret = req.headers['x-webhook-secret'];
  if (expectedSecret && providedSecret !== expectedSecret) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const {
      titulo,
      descricao,
      link,
      subscriptions = [],
      emails = [],
    } = body || {};

    if (!titulo) {
      return res.status(400).json({ error: 'titulo is required' });
    }

    // ── 1. PUSH ──────────────────────────────────────────
    const payloadString = JSON.stringify({
      title: titulo,
      body: descricao,
      icon: '/logo.png',
      badge: '/favicon.png',
      data: { url: link || '/' },
    });

    const pushResults = await Promise.all(
      (subscriptions as any[]).map(async (sub: any) => {
        try {
          await webpush.sendNotification(sub, payloadString);
          return { success: true, endpoint: sub?.endpoint };
        } catch (error: any) {
          return {
            success: false,
            endpoint: sub?.endpoint,
            statusCode: error?.statusCode,
          };
        }
      })
    );

    const deadEndpoints = pushResults
      .filter((r) => !r.success && (r.statusCode === 410 || r.statusCode === 404))
      .map((r) => r.endpoint)
      .filter(Boolean) as string[];

    await cleanupDeadEndpoints(deadEndpoints);

    // ── 2. E-MAIL ────────────────────────────────────────
    const uniqueEmails = Array.from(
      new Set((emails as string[]).filter(Boolean))
    );
    const html = emailHtml(titulo, descricao || '');

    const emailResults = await Promise.all(
      uniqueEmails.map(async (to) => {
        try {
          await resend.emails.send({ from: EMAIL_FROM, to, subject: titulo, html });
          return { success: true, to };
        } catch (error: any) {
          console.warn('Falha ao enviar e-mail para', to, error?.message);
          return { success: false, to };
        }
      })
    );

    return res.status(200).json({
      ok: true,
      push: { sent: pushResults.filter((r) => r.success).length, total: pushResults.length },
      email: { sent: emailResults.filter((r) => r.success).length, total: emailResults.length },
      cleaned: deadEndpoints.length,
    });
  } catch (error: any) {
    console.error('Falha no dispatch-notification:', error);
    return res.status(500).json({ error: error.message });
  }
}
