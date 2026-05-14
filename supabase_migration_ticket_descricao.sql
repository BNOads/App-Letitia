-- Migration: Adicionar campo "descricao" na tabela tickets
-- Descrição: Campo para descrever "o que é a questão" do ticket

ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS descricao TEXT;

COMMENT ON COLUMN public.tickets.descricao IS 'Descrição detalhada da questão/problema do ticket';
