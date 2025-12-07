-- ===========================================
-- XY CURSOS - SCHEMA DO BANCO DE DADOS
-- Execute este script no SQL Editor do Supabase
-- ===========================================

-- Habilitar extensões
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ===========================================
-- TABELA: profiles (perfis de usuário)
-- ===========================================
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  nome_completo TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  telefone TEXT,
  foto_url TEXT,
  
  -- Plataformas
  plataformas_ativas TEXT[] DEFAULT ARRAY['enem', 'olimpico', 'financeiro', 'ifpi'],
  plataforma_atual TEXT DEFAULT 'enem',
  
  -- Gamificação
  xp_total INTEGER DEFAULT 0,
  nivel INTEGER DEFAULT 1,
  streak_dias INTEGER DEFAULT 0,
  ultimo_acesso TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===========================================
-- TABELA: modulos
-- ===========================================
CREATE TABLE modulos (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  plataforma TEXT NOT NULL,
  numero INTEGER NOT NULL,
  titulo TEXT NOT NULL,
  descricao TEXT,
  icone TEXT,
  total_fases INTEGER DEFAULT 0,
  ordem INTEGER NOT NULL,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(plataforma, numero)
);

-- ===========================================
-- TABELA: fases
-- ===========================================
CREATE TABLE fases (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  modulo_id UUID REFERENCES modulos(id) ON DELETE CASCADE,
  numero INTEGER NOT NULL,
  titulo TEXT NOT NULL,
  descricao TEXT,
  total_questoes INTEGER DEFAULT 0,
  xp_recompensa INTEGER DEFAULT 100,
  ordem INTEGER NOT NULL,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(modulo_id, numero)
);

-- ===========================================
-- TABELA: questoes
-- ===========================================
CREATE TABLE questoes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  fase_id UUID REFERENCES fases(id) ON DELETE CASCADE,
  numero INTEGER NOT NULL,
  enunciado TEXT NOT NULL,
  imagem_url TEXT,
  alternativa_a TEXT NOT NULL,
  alternativa_b TEXT NOT NULL,
  alternativa_c TEXT NOT NULL,
  alternativa_d TEXT NOT NULL,
  alternativa_e TEXT,
  resposta_correta CHAR(1) NOT NULL CHECK (resposta_correta IN ('A', 'B', 'C', 'D', 'E')),
  explicacao TEXT,
  dificuldade TEXT DEFAULT 'medio' CHECK (dificuldade IN ('facil', 'medio', 'dificil')),
  
  -- ENEM específico
  competencia TEXT,
  habilidade TEXT,
  pontuacao_tri INTEGER,
  
  ordem INTEGER NOT NULL,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(fase_id, numero)
);

-- ===========================================
-- TABELA: progresso
-- ===========================================
CREATE TABLE progresso (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  plataforma TEXT NOT NULL,
  fase_id UUID REFERENCES fases(id) ON DELETE CASCADE,
  concluido BOOLEAN DEFAULT false,
  nota INTEGER,
  acertos INTEGER DEFAULT 0,
  erros INTEGER DEFAULT 0,
  tempo_gasto INTEGER,
  xp_ganho INTEGER DEFAULT 0,
  tentativas INTEGER DEFAULT 0,
  data_inicio TIMESTAMPTZ,
  data_conclusao TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, fase_id)
);

-- ===========================================
-- TABELA: respostas_usuario
-- ===========================================
CREATE TABLE respostas_usuario (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  questao_id UUID REFERENCES questoes(id) ON DELETE CASCADE,
  progresso_id UUID REFERENCES progresso(id) ON DELETE SET NULL,
  resposta_selecionada CHAR(1) NOT NULL,
  correta BOOLEAN NOT NULL,
  tempo_resposta INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===========================================
-- TABELA: simulados
-- ===========================================
CREATE TABLE simulados (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  plataforma TEXT NOT NULL,
  titulo TEXT NOT NULL,
  descricao TEXT,
  modulo_id UUID REFERENCES modulos(id) ON DELETE SET NULL,
  tipo TEXT DEFAULT 'modulo' CHECK (tipo IN ('modulo', 'plataforma', 'geral')),
  total_questoes INTEGER NOT NULL,
  tempo_limite INTEGER,
  ativo BOOLEAN DEFAULT true,
  ordem INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===========================================
-- TABELA: resultado_simulados
-- ===========================================
CREATE TABLE resultado_simulados (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  simulado_id UUID REFERENCES simulados(id) ON DELETE CASCADE,
  nota INTEGER NOT NULL,
  acertos INTEGER NOT NULL,
  erros INTEGER NOT NULL,
  tempo_gasto INTEGER NOT NULL,
  xp_ganho INTEGER DEFAULT 0,
  data_realizacao TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===========================================
-- TABELA: badges
-- ===========================================
CREATE TABLE badges (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  nome TEXT NOT NULL,
  descricao TEXT,
  icone TEXT,
  criterio TEXT,
  xp_bonus INTEGER DEFAULT 0,
  plataforma TEXT,
  categoria TEXT DEFAULT 'conquista' CHECK (categoria IN ('progresso', 'conquista', 'streak', 'especial')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===========================================
-- TABELA: badges_usuario
-- ===========================================
CREATE TABLE badges_usuario (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  badge_id UUID REFERENCES badges(id) ON DELETE CASCADE,
  plataforma TEXT,
  data_conquista TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, badge_id)
);

-- ===========================================
-- ÍNDICES
-- ===========================================
CREATE INDEX idx_modulos_plataforma ON modulos(plataforma);
CREATE INDEX idx_fases_modulo ON fases(modulo_id);
CREATE INDEX idx_questoes_fase ON questoes(fase_id);
CREATE INDEX idx_progresso_user ON progresso(user_id);
CREATE INDEX idx_progresso_fase ON progresso(fase_id);
CREATE INDEX idx_respostas_user ON respostas_usuario(user_id);
CREATE INDEX idx_badges_usuario_user ON badges_usuario(user_id);

-- ===========================================
-- RLS (Row Level Security)
-- ===========================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE progresso ENABLE ROW LEVEL SECURITY;
ALTER TABLE respostas_usuario ENABLE ROW LEVEL SECURITY;
ALTER TABLE resultado_simulados ENABLE ROW LEVEL SECURITY;
ALTER TABLE badges_usuario ENABLE ROW LEVEL SECURITY;

-- Políticas para profiles
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Políticas para progresso
CREATE POLICY "Users can view own progress" ON progresso
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own progress" ON progresso
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own progress" ON progresso
  FOR UPDATE USING (auth.uid() = user_id);

-- Políticas públicas (leitura)
CREATE POLICY "Public read modulos" ON modulos FOR SELECT USING (true);
CREATE POLICY "Public read fases" ON fases FOR SELECT USING (true);
CREATE POLICY "Public read questoes" ON questoes FOR SELECT USING (true);
CREATE POLICY "Public read simulados" ON simulados FOR SELECT USING (true);
CREATE POLICY "Public read badges" ON badges FOR SELECT USING (true);

-- ===========================================
-- TRIGGER: Criar perfil ao cadastrar
-- ===========================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, nome_completo, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome_completo', 'Usuário'),
    NEW.email
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ===========================================
-- FUNÇÃO: Incrementar XP
-- ===========================================
CREATE OR REPLACE FUNCTION incrementar_xp(user_id UUID, xp_adicional INTEGER)
RETURNS VOID AS $$
BEGIN
  UPDATE profiles
  SET xp_total = xp_total + xp_adicional,
      updated_at = NOW()
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
