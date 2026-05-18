import { Resend } from 'resend';

// A chave da API foi fornecida no prompt. O ideal em produção é usar process.env.RESEND_API_KEY
const resend = new Resend('re_JeHJzoKE_A6TBDjKVAk4WH2j9QB6zhVTP');

export default async function handler(req: any, res: any) {
  // CORS Headers (para uso local se necessário, Vercel cuida em prod na maioria)
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { to, subject, html } = req.body;
    
    const data = await resend.emails.send({
      from: 'Sistema <onboarding@resend.dev>', // Importante: Mude para um e-mail verificado no Resend ex: suporte@seudominio.com
      to,
      subject,
      html
    });

    res.status(200).json(data);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
}
