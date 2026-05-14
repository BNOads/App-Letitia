-- Migration: Adicionar campos faltantes na tabela tickets
-- cliente_telefone e descricao (caso não exista ainda)

ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS cliente_telefone TEXT;
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS descricao TEXT;

-- Tornar cliente_email opcional (pode criar ticket só com telefone ou instagram)
ALTER TABLE public.tickets ALTER COLUMN cliente_email DROP NOT NULL;

COMMENT ON COLUMN public.tickets.cliente_telefone IS 'Telefone do cliente';
COMMENT ON COLUMN public.tickets.descricao IS 'Descrição detalhada da questão/problema do ticket';
