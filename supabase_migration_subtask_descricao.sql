-- ============================================================
-- Migration: Adicionar descrição nas subtarefas
-- ============================================================

ALTER TABLE public.subtarefas
  ADD COLUMN IF NOT EXISTS descricao TEXT;
