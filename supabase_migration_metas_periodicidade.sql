-- Migração: Adicionar periodicidade às metas
-- Execute este SQL no Supabase Dashboard > SQL Editor

ALTER TABLE public.metas 
ADD COLUMN IF NOT EXISTS periodicidade TEXT DEFAULT 'mensal' 
CHECK (periodicidade IN ('diaria', 'semanal', 'mensal'));

-- Atualizar metas existentes para mensal (padrão)
UPDATE public.metas SET periodicidade = 'mensal' WHERE periodicidade IS NULL;
