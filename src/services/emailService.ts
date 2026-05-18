/**
 * Serviço responsável por enviar e-mails via Vercel Serverless Function (Resend).
 */

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: SendEmailParams) {
  try {
    const response = await fetch('/api/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ to, subject, html }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Erro ao enviar e-mail');
    }

    return await response.json();
  } catch (error) {
    console.error('Falha ao enviar e-mail via API:', error);
    throw error;
  }
}

// Modelos de E-mail

export const emailTemplates = {
  userCreated: (name: string, tempPassword?: string) => `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
      <h2 style="color: #4F46E5;">Bem-vindo(a) ao sistema, ${name}!</h2>
      <p>Sua conta foi criada com sucesso pelo administrador.</p>
      ${tempPassword ? `<p>Sua senha temporária é: <strong>${tempPassword}</strong></p><p>Recomendamos que você altere sua senha no primeiro acesso.</p>` : ''}
      <p>Acesse o sistema e aproveite!</p>
    </div>
  `,

  passwordChanged: (name: string) => `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
      <h2 style="color: #4F46E5;">Senha alterada</h2>
      <p>Olá, ${name}.</p>
      <p>Sua senha foi alterada recentemente com sucesso.</p>
      <p>Se você não realizou esta alteração, entre em contato com o suporte imediatamente.</p>
    </div>
  `,

  notificationsEnabled: (name: string) => `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
      <h2 style="color: #4F46E5;">Notificações por E-mail Ativadas</h2>
      <p>Olá, ${name}.</p>
      <p>O recebimento de notificações gerais do sistema por e-mail foi <strong>ativado</strong> com sucesso.</p>
      <p>A partir de agora, você será avisado por aqui sempre que houver novidades.</p>
    </div>
  `,

  generalNotification: (title: string, description: string) => `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
      <h2 style="color: #4F46E5;">${title}</h2>
      <p>${description}</p>
      <br />
      <p style="font-size: 12px; color: #888;">Você está recebendo este e-mail porque as notificações por e-mail estão habilitadas em seu perfil.</p>
    </div>
  `,
};
