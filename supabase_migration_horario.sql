-- Migration: Add horario_previsto to conteudo_pautas
-- This column stores the scheduled time for posts (e.g., '14:30')
-- so users can see what goes out at each hour in the editorial calendar.

ALTER TABLE conteudo_pautas
ADD COLUMN IF NOT EXISTS horario_previsto TIME DEFAULT NULL;

-- Optional: Add a comment for documentation
COMMENT ON COLUMN conteudo_pautas.horario_previsto IS 'Horário previsto para publicação do post (ex: 14:30)';
