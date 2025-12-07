// ===========================================
// XY CURSOS - TIPOS DO BANCO DE DADOS
// ===========================================

import type { PlataformaSlug } from '@/lib/constants/plataformas';

// ============================================
// USUÁRIO E PERFIL
// ============================================
export interface Profile {
  id: string;
  nome_completo: string;
  email: string;
  telefone?: string;
  foto_url?: string;
  
  // Plataformas ativas
  plataformas_ativas: PlataformaSlug[];
  plataforma_atual?: PlataformaSlug;
  
  // Gamificação global
  xp_total: number;
  nivel: number;
  streak_dias: number;
  ultimo_acesso?: string;
  
  created_at: string;
  updated_at: string;
}

// ============================================
// MÓDULOS E FASES
// ============================================
export interface Modulo {
  id: string;
  plataforma: PlataformaSlug;
  numero: number;
  titulo: string;
  descricao?: string;
  icone?: string;
  total_fases: number;
  ordem: number;
  ativo: boolean;
  created_at: string;
}

export interface ModuloComProgresso extends Modulo {
  fases_concluidas: number;
  progresso_percentual: number;
  bloqueado: boolean;
}

export interface Fase {
  id: string;
  modulo_id: string;
  numero: number;
  titulo: string;
  descricao?: string;
  total_questoes: number;
  xp_recompensa: number;
  ordem: number;
  ativo: boolean;
  created_at: string;
}

export interface FaseComProgresso extends Fase {
  concluida: boolean;
  nota?: number;
  melhor_nota?: number;
  tentativas: number;
  bloqueada: boolean;
}

// ============================================
// QUESTÕES
// ============================================
export interface Questao {
  id: string;
  fase_id: string;
  numero: number;
  enunciado: string;
  imagem_url?: string;
  alternativa_a: string;
  alternativa_b: string;
  alternativa_c: string;
  alternativa_d: string;
  alternativa_e?: string;
  resposta_correta: 'A' | 'B' | 'C' | 'D' | 'E';
  explicacao?: string;
  dificuldade: 'facil' | 'medio' | 'dificil';
  
  // Específico ENEM
  competencia?: string;
  habilidade?: string;
  pontuacao_tri?: number;
  
  ordem: number;
  ativo: boolean;
  created_at: string;
}

// ============================================
// PROGRESSO
// ============================================
export interface Progresso {
  id: string;
  user_id: string;
  plataforma: PlataformaSlug;
  fase_id: string;
  concluido: boolean;
  nota?: number;
  acertos: number;
  erros: number;
  tempo_gasto?: number;
  xp_ganho: number;
  tentativas: number;
  data_inicio?: string;
  data_conclusao?: string;
  created_at: string;
}

export interface RespostaUsuario {
  id: string;
  user_id: string;
  questao_id: string;
  progresso_id?: string;
  resposta_selecionada: 'A' | 'B' | 'C' | 'D' | 'E';
  correta: boolean;
  tempo_resposta?: number;
  created_at: string;
}

// ============================================
// SIMULADOS
// ============================================
export interface Simulado {
  id: string;
  plataforma: PlataformaSlug;
  titulo: string;
  descricao?: string;
  modulo_id?: string;
  tipo: 'modulo' | 'plataforma' | 'geral';
  total_questoes: number;
  tempo_limite?: number;
  ativo: boolean;
  ordem: number;
  created_at: string;
}

export interface ResultadoSimulado {
  id: string;
  user_id: string;
  simulado_id: string;
  nota: number;
  acertos: number;
  erros: number;
  tempo_gasto: number;
  xp_ganho: number;
  data_realizacao: string;
  created_at: string;
}

// ============================================
// BADGES E CONQUISTAS
// ============================================
export interface Badge {
  id: string;
  slug: string;
  nome: string;
  descricao?: string;
  icone?: string;
  criterio?: string;
  xp_bonus: number;
  plataforma?: PlataformaSlug;
  categoria: 'progresso' | 'conquista' | 'streak' | 'especial';
  created_at: string;
}

export interface BadgeUsuario {
  id: string;
  user_id: string;
  badge_id: string;
  plataforma?: PlataformaSlug;
  data_conquista: string;
  badge?: Badge;
}

// ============================================
// PONTOS CEGOS (ENEM)
// ============================================
export interface PontoCego {
  id: string;
  user_id: string;
  competencia: string;
  habilidade: string;
  percentual_erro: number;
  total_questoes: number;
  questoes_erradas: number;
  ultima_atualizacao: string;
}

// ============================================
// ESTATÍSTICAS
// ============================================
export interface EstatisticasUsuario {
  plataforma: PlataformaSlug;
  xp_total: number;
  fases_concluidas: number;
  total_fases: number;
  questoes_respondidas: number;
  acertos: number;
  tempo_estudo: number;
  melhor_streak: number;
  simulados_realizados: number;
  melhor_nota_simulado?: number;
}

// ============================================
// TIPOS AUXILIARES
// ============================================
export type Alternativa = 'A' | 'B' | 'C' | 'D' | 'E';
export type Dificuldade = 'facil' | 'medio' | 'dificil';

export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  success: boolean;
}
