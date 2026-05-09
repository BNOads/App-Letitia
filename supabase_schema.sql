-- TABELA: profiles
-- Armazena dados extras do usuário logado
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  avatar_url TEXT,
  departamento TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Política: Usuários podem ver seu próprio perfil
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

-- Política: Usuários podem atualizar seu próprio perfil
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Trigger para criar perfil automaticamente ao registrar no Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();


-- TABELA: tarefas
CREATE TYPE task_priority AS ENUM ('baixa', 'normal', 'alta', 'urgente');
CREATE TYPE task_status AS ENUM ('fazer', 'progresso', 'revisao', 'concluido');

CREATE TABLE public.tarefas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  titulo TEXT NOT NULL,
  descricao TEXT,
  prioridade task_priority DEFAULT 'normal',
  status task_status DEFAULT 'fazer',
  responsavel_id UUID REFERENCES public.profiles(id),
  prazo DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.tarefas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Todos autenticados podem ver tarefas" ON public.tarefas FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Apenas responsável ou admin pode editar" ON public.tarefas FOR ALL USING (auth.uid() = responsavel_id);


-- TABELA: vendas
CREATE TABLE public.vendas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cliente_nome TEXT NOT NULL,
  produto TEXT NOT NULL,
  valor DECIMAL(12,2) NOT NULL,
  data_venda DATE DEFAULT CURRENT_DATE,
  vendedor_id UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.vendas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Todos autenticados podem ver vendas" ON public.vendas FOR SELECT USING (auth.role() = 'authenticated');


-- TABELA: conteudo_pautas
CREATE TABLE public.conteudo_pautas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  titulo TEXT NOT NULL,
  pilar TEXT NOT NULL, -- pessoal, profissional, interior
  formato TEXT NOT NULL, -- reels, carrossel, post, youtube, podcast
  status TEXT DEFAULT 'rascunho', -- rascunho, revisao_leticia, aprovado, publicado
  plataforma TEXT NOT NULL,
  data_prevista DATE,
  responsavel_id UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.conteudo_pautas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Equipe pode ver pautas" ON public.conteudo_pautas FOR SELECT USING (auth.role() = 'authenticated');


-- TABELA: theway_aplicacoes
CREATE TABLE public.theway_aplicacoes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cliente_nome TEXT NOT NULL,
  email TEXT,
  whatsapp TEXT,
  status TEXT DEFAULT 'pendente', -- pendente, triagem, aprovada, recusada
  data_aplicacao TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.theway_aplicacoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Equipe pode ver aplicacoes" ON public.theway_aplicacoes FOR SELECT USING (auth.role() = 'authenticated');
