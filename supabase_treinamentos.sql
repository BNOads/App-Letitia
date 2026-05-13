-- ══════════════════════════════════════════════════════════
-- TREINAMENTOS: Cursos, Aulas e PDI
-- Execute este SQL no Supabase SQL Editor
-- ══════════════════════════════════════════════════════════

-- 1. Tabela de Cursos
CREATE TABLE IF NOT EXISTS cursos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  titulo TEXT NOT NULL,
  descricao TEXT DEFAULT '',
  categoria TEXT NOT NULL DEFAULT 'Geral',
  nivel TEXT NOT NULL DEFAULT 'Iniciante',
  instrutor TEXT DEFAULT '',
  capa_url TEXT DEFAULT NULL,
  publicado BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Tabela de Aulas (vinculadas a um curso)
CREATE TABLE IF NOT EXISTS aulas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  curso_id UUID NOT NULL REFERENCES cursos(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  descricao TEXT DEFAULT '',
  ordem INT NOT NULL DEFAULT 0,
  tipo TEXT NOT NULL DEFAULT 'video', -- video, texto, link
  video_url TEXT DEFAULT NULL,        -- YouTube, Vimeo, Drive embed URL
  duracao_minutos INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Progresso do usuário por aula
CREATE TABLE IF NOT EXISTS aulas_progresso (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  aula_id UUID NOT NULL REFERENCES aulas(id) ON DELETE CASCADE,
  concluida BOOLEAN DEFAULT false,
  concluida_em TIMESTAMPTZ DEFAULT NULL,
  UNIQUE(user_id, aula_id)
);

-- 4. PDI (Plano de Desenvolvimento Individual)
CREATE TABLE IF NOT EXISTS pdis (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  descricao TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'em_andamento', -- em_andamento, concluido, pausado
  prazo DATE DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Metas do PDI
CREATE TABLE IF NOT EXISTS pdi_metas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  pdi_id UUID NOT NULL REFERENCES pdis(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  concluida BOOLEAN DEFAULT false,
  ordem INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_aulas_curso ON aulas(curso_id);
CREATE INDEX IF NOT EXISTS idx_aulas_progresso_user ON aulas_progresso(user_id);
CREATE INDEX IF NOT EXISTS idx_pdis_user ON pdis(user_id);
CREATE INDEX IF NOT EXISTS idx_pdi_metas_pdi ON pdi_metas(pdi_id);

-- RLS (Row Level Security) - Habilitar
ALTER TABLE cursos ENABLE ROW LEVEL SECURITY;
ALTER TABLE aulas ENABLE ROW LEVEL SECURITY;
ALTER TABLE aulas_progresso ENABLE ROW LEVEL SECURITY;
ALTER TABLE pdis ENABLE ROW LEVEL SECURITY;
ALTER TABLE pdi_metas ENABLE ROW LEVEL SECURITY;

-- Policies - Todos autenticados podem ler/escrever
CREATE POLICY "cursos_all" ON cursos FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "aulas_all" ON aulas FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "aulas_progresso_all" ON aulas_progresso FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "pdis_all" ON pdis FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "pdi_metas_all" ON pdi_metas FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
