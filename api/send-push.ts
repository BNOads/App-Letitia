import webpush from 'web-push';

// Chaves VAPID configuradas por padrão.
// O ideal em produção é definir as variáveis de ambiente:
// VAPID_PUBLIC_KEY e VAPID_PRIVATE_KEY no painel da Vercel.
const publicKey = process.env.VAPID_PUBLIC_KEY || 'BFus97kRwt6LrSp9jzHocgtdpZ4uFmDsCrUazBsvdhsi4J8lzROnVDIVJ3hmCWZDCVS_SIty8IuyAkSX2f1INvg';
const privateKey = process.env.VAPID_PRIVATE_KEY || 'z_p4b8MbLuDZQXsRGErD91_zKVii2UepLVDLEZp_JJs';

webpush.setVapidDetails(
  'mailto:notificacoes@app.laetitiaeducacao.com',
  publicKey,
  privateKey
);

export default async function handler(req: any, res: any) {
  // Configuração de CORS para permitir requisições seguras de qualquer origem do app
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { subscriptions, payload } = req.body;

    if (!subscriptions || !Array.isArray(subscriptions)) {
      return res.status(400).json({ error: 'subscriptions array is required' });
    }

    if (!payload) {
      return res.status(400).json({ error: 'payload object is required' });
    }

    const payloadString = JSON.stringify(payload);

    // Envia o push de forma paralela para todas as assinaturas informadas
    const results = await Promise.all(
      subscriptions.map(async (sub: any) => {
        try {
          await webpush.sendNotification(sub, payloadString);
          return { success: true, endpoint: sub.endpoint };
        } catch (error: any) {
          console.warn('Erro ao enviar push para endpoint:', sub.endpoint, error.statusCode);
          return { 
            success: false, 
            endpoint: sub.endpoint, 
            statusCode: error.statusCode, 
            error: error.message 
          };
        }
      })
    );

    res.status(200).json({ success: true, results });
  } catch (error: any) {
    console.error('Falha geral no envio de notificações push:', error);
    res.status(500).json({ error: error.message });
  }
}
