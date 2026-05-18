-- Adiciona a coluna para habilitar notificações por e-mail no perfil dos usuários
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS receber_notificacoes_email BOOLEAN DEFAULT false;
