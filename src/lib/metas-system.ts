import { SupabaseClient } from '@supabase/supabase-js';

export interface UserMeta {
  id: string;
  user_id: string;
  meta_xp_diario: number;
  meta_questoes_diario: number;
  meta_ativa: boolean;
}

export interface ProgressoDiario {
  id: string;
  user_id: string;
  data: string;
  xp_ganho: number;
  questoes_respondidas: number;
  questoes_corretas: number;
  meta_xp_cumprida: boolean;
  meta_questoes_cumprida: boolean;
}

export async function getOrCreateUserMeta(
  supabase: SupabaseClient,
  userId: string
): Promise<UserMeta | null> {
  // Tentar buscar meta existente
  const { data: metaExistente } = await supabase
    .from('user_metas')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (metaExistente) {
    return metaExistente;
  }

  // Criar meta padrão
  const { data: novaMeta, error } = await supabase
    .from('user_metas')
    .insert({
      user_id: userId,
      meta_xp_diario: 50,
      meta_questoes_diario: 10,
      meta_ativa: true
    })
    .select()
    .single();

  if (error) {
    console.error('Erro ao criar meta:', error);
    return null;
  }

  return novaMeta;
}

export async function getProgressoDiario(
  supabase: SupabaseClient,
  userId: string
): Promise<ProgressoDiario | null> {
  const hoje = new Date().toISOString().split('T')[0];

  // Tentar buscar progresso do dia
  const { data: progressoExistente } = await supabase
    .from('progresso_diario')
    .select('*')
    .eq('user_id', userId)
    .eq('data', hoje)
    .single();

  if (progressoExistente) {
    return progressoExistente;
  }

  // Criar progresso do dia
  const { data: novoProgresso, error } = await supabase
    .from('progresso_diario')
    .insert({
      user_id: userId,
      data: hoje,
      xp_ganho: 0,
      questoes_respondidas: 0,
      questoes_corretas: 0
    })
    .select()
    .single();

  if (error) {
    console.error('Erro ao criar progresso:', error);
    return null;
  }

  return novoProgresso;
}

export async function atualizarProgressoDiario(
  supabase: SupabaseClient,
  userId: string,
  xpGanho: number,
  questoesRespondidas: number,
  questoesCorretas: number
): Promise<void> {
  const hoje = new Date().toISOString().split('T')[0];

  // Buscar progresso atual
  const progresso = await getProgressoDiario(supabase, userId);
  if (!progresso) return;

  // Buscar meta do usuário
  const meta = await getOrCreateUserMeta(supabase, userId);
  if (!meta) return;

  const novoXP = progresso.xp_ganho + xpGanho;
  const novasQuestoes = progresso.questoes_respondidas + questoesRespondidas;
  const novosAcertos = progresso.questoes_corretas + questoesCorretas;

  // Atualizar progresso
  await supabase
    .from('progresso_diario')
    .update({
      xp_ganho: novoXP,
      questoes_respondidas: novasQuestoes,
      questoes_corretas: novosAcertos,
      meta_xp_cumprida: novoXP >= meta.meta_xp_diario,
      meta_questoes_cumprida: novasQuestoes >= meta.meta_questoes_diario,
      updated_at: new Date().toISOString()
    })
    .eq('user_id', userId)
    .eq('data', hoje);
}

export async function atualizarMetaUsuario(
  supabase: SupabaseClient,
  userId: string,
  metaXP: number,
  metaQuestoes: number
): Promise<boolean> {
  const { error } = await supabase
    .from('user_metas')
    .update({
      meta_xp_diario: metaXP,
      meta_questoes_diario: metaQuestoes,
      updated_at: new Date().toISOString()
    })
    .eq('user_id', userId);

  return !error;
}
