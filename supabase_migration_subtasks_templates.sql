-- ============================================================
-- Migration: Subtarefas + Modelos de Tarefas
-- ============================================================

-- 1. SUBTAREFAS — subtarefas vinculadas a uma tarefa principal
CREATE TABLE IF NOT EXISTS public.subtarefas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tarefa_id UUID REFERENCES public.tarefas(id) ON DELETE CASCADE NOT NULL,
  titulo TEXT NOT NULL,
  concluida BOOLEAN DEFAULT false,
  responsavel_id UUID REFERENCES public.profiles(id),
  prazo DATE,
  ordem INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.subtarefas ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Equipe acesso total' AND polrelid = 'public.subtarefas'::regclass) THEN
    CREATE POLICY "Equipe acesso total" ON public.subtarefas FOR ALL USING (auth.role() = 'authenticated');
  END IF;
END $$;

-- 2. MODELOS DE TAREFAS — templates reutilizáveis
CREATE TABLE IF NOT EXISTS public.tarefa_modelos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  descricao TEXT,
  prioridade task_priority DEFAULT 'normal',
  responsavel_id UUID REFERENCES public.profiles(id),
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.tarefa_modelos ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Equipe acesso total' AND polrelid = 'public.tarefa_modelos'::regclass) THEN
    CREATE POLICY "Equipe acesso total" ON public.tarefa_modelos FOR ALL USING (auth.role() = 'authenticated');
  END IF;
END $$;

-- 3. SUBTAREFAS DO MODELO — subtarefas pré-configuradas do template
CREATE TABLE IF NOT EXISTS public.modelo_subtarefas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  modelo_id UUID REFERENCES public.tarefa_modelos(id) ON DELETE CASCADE NOT NULL,
  titulo TEXT NOT NULL,
  responsavel_id UUID REFERENCES public.profiles(id),
  ordem INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.modelo_subtarefas ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Equipe acesso total' AND polrelid = 'public.modelo_subtarefas'::regclass) THEN
    CREATE POLICY "Equipe acesso total" ON public.modelo_subtarefas FOR ALL USING (auth.role() = 'authenticated');
  END IF;
END $$;
