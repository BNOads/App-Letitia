-- Migração: Tabela de Metas (Gerenciamento de Metas de Comissão)
-- Execute este SQL no Supabase Dashboard > SQL Editor

CREATE TABLE IF NOT EXISTS public.metas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  produto_id TEXT NOT NULL,
  escalonamento BOOLEAN DEFAULT false,
  faixas JSONB DEFAULT '[]'::jsonb,        -- Array de { min_vendas: number, bonus: number }
  min_vendas INTEGER DEFAULT 1,             -- Modo fixo: mínimo de vendas
  bonus DECIMAL(12,2) DEFAULT 0,            -- Modo fixo: valor do bônus
  descricao TEXT,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.metas ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Equipe acesso total' AND polrelid = 'public.metas'::regclass) THEN
        CREATE POLICY "Equipe acesso total" ON public.metas FOR ALL USING (auth.role() = 'authenticated');
    END IF;
END $$;

-- Tabela de registros de metas batidas
CREATE TABLE IF NOT EXISTS public.metas_batidas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  meta_id UUID REFERENCES public.metas(id) ON DELETE CASCADE,
  registrado_por UUID REFERENCES public.profiles(id),
  observacao TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.metas_batidas ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Equipe acesso total' AND polrelid = 'public.metas_batidas'::regclass) THEN
        CREATE POLICY "Equipe acesso total" ON public.metas_batidas FOR ALL USING (auth.role() = 'authenticated');
    END IF;
END $$;
