-- Script de Migração: Criação da tabela push_subscriptions e Políticas RLS
-- Execute este script no SQL Editor do seu Painel do Supabase.

CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  endpoint TEXT UNIQUE NOT NULL,
  subscription JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar Row Level Security (RLS)
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS
DO $$
BEGIN
    -- Permitir acesso total aos usuários apenas para suas próprias inscrições
    IF NOT EXISTS (
        SELECT 1 FROM pg_policy 
        WHERE polname = 'Usuários gerenciam suas próprias assinaturas' 
        AND polrelid = 'public.push_subscriptions'::regclass
    ) THEN
        CREATE POLICY "Usuários gerenciam suas próprias assinaturas" 
          ON public.push_subscriptions 
          FOR ALL 
          USING (auth.uid() = user_id)
          WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;

-- Índice para busca rápida de assinaturas por usuário
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id ON public.push_subscriptions(user_id);
