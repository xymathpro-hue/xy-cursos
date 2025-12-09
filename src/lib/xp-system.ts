
import { SupabaseClient } from '@supabase/supabase-js';

// Configuração de níveis
export const NIVEIS = [
  { nivel: 1, xpNecessario: 0, titulo: 'Iniciante', cor: 'gray' },
  { nivel: 2, xpNecessario: 100, titulo: 'Aprendiz', cor: 'green' },
  { nivel: 3, xpNecessario: 300, titulo: 'Estudante', cor: 'blue' },
  { nivel: 4, xpNecessario: 600, titulo: 'Dedicado', cor: 'indigo' },
  { nivel: 5, xpNecessario: 1000, titulo: 'Aplicado', cor: 'purple' },
  { nivel: 6, xpNecessario: 1500, titulo: 'Competente', cor: 'pink' },
  { nivel: 7, xpNecessario: 2200, titulo: 'Habilidoso', cor: 'orange' },
  { nivel: 8, xpNecessario: 3000, titulo: 'Expert', cor: 'amber' },
  { nivel: 9, xpNecessario: 4000, titulo: 'Mestre', cor: 'red' },
  { nivel: 10, xpNecessario: 5500, titulo: 'Lenda', cor: 'yellow' },
];

// XP por atividade
export const XP_CONFIG = {
  QUESTAO_CORRETA: 10,
  QUESTAO_FACIL: 5,
  QUESTAO_MEDIA: 10,
  QUESTAO_DIFICIL: 15,
  BATALHA_ACERTO: 20,
  BATALHA_PERFEITA_BONUS: 50,
  EXERCICIO_COMPLETO: 30,
  STREAK_BONUS: 5, // por dia de streak
};

export function calcularNivel(xpTotal: number) {
  let nivelAtual = NIVEIS[0];
  
  for (const nivel of NIVEIS) {
    if (xpTotal >= nivel.xpNecessario) {
      nivelAtual = nivel;
    } else {
      break;
    }
  }
  
  const proximoNivel = NIVEIS.find(n => n.nivel === nivelAtual.nivel + 1);
  const xpParaProximo = proximoNivel ? proximoNivel.xpNecessario - xpTotal : 0;
  const xpNoNivel = xpTotal - nivelAtual.xpNecessario;
  const xpTotalNivel = proximoNivel ? proximoNivel.xpNecessario - nivelAtual.xpNecessario : 0;
  const progressoNivel = xpTotalNivel > 0 ? Math.round((xpNoNivel / xpTotalNivel) * 100) : 100;

  return {
    ...nivelAtual,
    xpTotal,
    xpParaProximo,
    progressoNivel,
    proximoNivel: proximoNivel?.titulo || 'Máximo'
  };
}

export async function getOrCreateUserStats(supabase: SupabaseClient, userId: string) {
  // Tentar buscar stats existentes
  const { data: stats } = await supabase
    .from('user_stats')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (stats) {
    return stats;
  }

  // Criar novo registro
  const { data: newStats, error } = await supabase
    .from('user_stats')
    .insert({ user_id: userId })
    .select()
    .single();

  if (error) {
    console.error('Erro ao criar user_stats:', error);
    return null;
  }

  return newStats;
}

export async function adicionarXP(
  supabase: SupabaseClient,
  userId: string,
  xpGanho: number,
  motivo: string
) {
  // Buscar stats atuais
  const stats = await getOrCreateUserStats(supabase, userId);
  if (!stats) return null;

  const novoXpTotal = stats.xp_total + xpGanho;
  const nivelInfo = calcularNivel(novoXpTotal);

  // Verificar streak
  const hoje = new Date().toISOString().split('T')[0];
  const ultimoEstudo = stats.ultimo_estudo;
  let novoStreak = stats.streak_atual;
  let streakMax = stats.streak_max;

  if (ultimoEstudo) {
    const ontem = new Date();
    ontem.setDate(ontem.getDate() - 1);
    const ontemStr = ontem.toISOString().split('T')[0];

    if (ultimoEstudo === ontemStr) {
      novoStreak += 1;
    } else if (ultimoEstudo !== hoje) {
      novoStreak = 1;
    }
  } else {
    novoStreak = 1;
  }

  if (novoStreak > streakMax) {
    streakMax = novoStreak;
  }

  // Atualizar stats
  await supabase
    .from('user_stats')
    .update({
      xp_total: novoXpTotal,
      nivel: nivelInfo.nivel,
      titulo: nivelInfo.titulo,
      streak_atual: novoStreak,
      streak_max: streakMax,
      ultimo_estudo: hoje,
      updated_at: new Date().toISOString()
    })
    .eq('user_id', userId);

  // Registrar no histórico
  await supabase
    .from('xp_historico')
    .insert({
      user_id: userId,
      xp_ganho: xpGanho,
      motivo
    });

  return {
    xpGanho,
    xpTotal: novoXpTotal,
    nivelInfo,
    streak: novoStreak,
    subiuNivel: nivelInfo.nivel > stats.nivel
  };
}

export async function registrarQuestaoRespondida(
  supabase: SupabaseClient,
  userId: string,
  correta: boolean,
  dificuldade: string
) {
  const stats = await getOrCreateUserStats(supabase, userId);
  if (!stats) return null;

  let xpGanho = 0;
  if (correta) {
    switch (dificuldade) {
      case 'facil': xpGanho = XP_CONFIG.QUESTAO_FACIL; break;
      case 'dificil': xpGanho = XP_CONFIG.QUESTAO_DIFICIL; break;
      default: xpGanho = XP_CONFIG.QUESTAO_MEDIA;
    }
  }

  // Atualizar contadores
  await supabase
    .from('user_stats')
    .update({
      questoes_respondidas: stats.questoes_respondidas + 1,
      questoes_corretas: correta ? stats.questoes_corretas + 1 : stats.questoes_corretas,
      updated_at: new Date().toISOString()
    })
    .eq('user_id', userId);

  if (xpGanho > 0) {
    return await adicionarXP(supabase, userId, xpGanho, `Questão ${dificuldade} correta`);
  }

  return null;
}

export async function registrarBatalha(
  supabase: SupabaseClient,
  userId: string,
  acertos: number,
  total: number
) {
  const stats = await getOrCreateUserStats(supabase, userId);
  if (!stats) return null;

  const perfeita = acertos === total;
  let xpGanho = acertos * XP_CONFIG.BATALHA_ACERTO;
  if (perfeita) xpGanho += XP_CONFIG.BATALHA_PERFEITA_BONUS;

  // Atualizar contadores
  await supabase
    .from('user_stats')
    .update({
      batalhas_jogadas: stats.batalhas_jogadas + 1,
      batalhas_perfeitas: perfeita ? stats.batalhas_perfeitas + 1 : stats.batalhas_perfeitas,
      updated_at: new Date().toISOString()
    })
    .eq('user_id', userId);

  const motivo = perfeita ? 'Batalha Rápida Perfeita!' : `Batalha Rápida (${acertos}/${total})`;
  return await adicionarXP(supabase, userId, xpGanho, motivo);
}
