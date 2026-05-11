-- =====================================================
-- Migration: Adicionar recorrência para eventos e tarefas
-- Execute este SQL no Supabase SQL Editor
-- =====================================================

-- 1. Adicionar coluna de recorrência na tabela eventos
ALTER TABLE eventos
  ADD COLUMN IF NOT EXISTS recorrencia TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS recorrencia_pai_id UUID DEFAULT NULL;

-- Valores possíveis para recorrencia: 
-- NULL (sem recorrência), 'diario', 'semanal', 'quinzenal', 'mensal', 'semestral', 'anual'

-- 2. Adicionar coluna de recorrência na tabela tarefas
ALTER TABLE tarefas
  ADD COLUMN IF NOT EXISTS recorrencia TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS recorrencia_pai_id UUID DEFAULT NULL;

-- 3. Adicionar comentários para documentação
COMMENT ON COLUMN eventos.recorrencia IS 'Tipo de recorrência: diario, semanal, quinzenal, mensal, semestral, anual';
COMMENT ON COLUMN eventos.recorrencia_pai_id IS 'ID do evento pai que originou esta recorrência';
COMMENT ON COLUMN tarefas.recorrencia IS 'Tipo de recorrência: diario, semanal, quinzenal, mensal, semestral, anual';
COMMENT ON COLUMN tarefas.recorrencia_pai_id IS 'ID da tarefa pai que originou esta recorrência';
