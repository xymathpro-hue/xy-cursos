
import { SupabaseClient } from '@supabase/supabase-js';

interface Conquista {
  id: string;
  codigo: string;
  titulo: string;
  descricao: string;
  icone: string;
  categoria: string;
  xp_bonus: number;
  criterio_tipo: string;
  criterio_valor: number;
}

interface UserStats {
  xp_total: number;
  nivel: number;
  streak_atual: number;
  questoes_respondidas: number;
  questoes_corretas: number;
  batalhas_jogadas: number;
  batalhas_perfeitas: number;
}

export async function verificarConquistas(
  supabase: SupabaseClient,
  userId: string,
  stats: UserStats,
  diagnosticoCompleto: boolean = false
): Promise<Conquista[]> {
  // Buscar todas as conquistas
  const { data: todasConquistas } = await supabase
    .from('conquistas')
    .select('*')
    .eq('ativo', true);

  if (!todasConquistas) return [];

  // Buscar conquistas já desbloqueadas
  const { data: conquistasUsuario } = await supabase
    .from('user_conquistas')
    .select('conquista_id')
    .eq('user_id', userId);

  const idsDesbloqueadas = new Set(conquistasUsuario?.map(c => c.conquista_id) || []);

  // Verificar quais conquistas novas foram alcançadas
  const novasConquistas: Conquista[] = [];

  for (const conquista of todasConquistas) {
    // Pular se já desbloqueada
    if (idsDesbloqueadas.has(conquista.id)) continue;

    let alcancou = false;

    switch (conquista.criterio_tipo) {
      case 'questoes_respondidas':
        alcancou = stats.questoes_respondidas >= conquista.criterio_valor;
        break;
      case 'questoes_corretas':
        alcancou = stats.questoes_corretas >= conquista.criterio_valor;
        break;
      case 'batalhas_jogadas':
        alcancou = stats.batalhas_jogadas >= conquista.criterio_valor;
        break;
      case 'batalhas_perfeitas':
        alcancou = stats.batalhas_perfeitas >= conquista.criterio_valor;
        break;
      case 'streak_atual':
        alcancou = stats.streak_atual >= conquista.criterio_valor;
        break;
      case 'xp_total':
        alcancou = stats.xp_total >= conquista.criterio_valor;
        break;
      case 'nivel':
        alcancou = stats.nivel >= conquista.criterio_valor;
        break;
      case 'diagnostico_completo':
        alcancou = diagnosticoCompleto;
        break;
    }

    if (alcancou) {
      novasConquistas.push(conquista);

      // Salvar conquista desbloqueada
      await supabase.from('user_conquistas').insert({
        user_id: userId,
        conquista_id: conquista.id
      });

      // Dar XP bonus se houver
      if (conquista.xp_bonus > 0) {
        const { data: currentStats } = await supabase
          .from('user_stats')
          .select('xp_total')
          .eq('user_id', userId)
          .single();

        if (currentStats) {
          await supabase
            .from('user_stats')
            .update({ 
              xp_total: currentStats.xp_total + conquista.xp_bonus,
              updated_at: new Date().toISOString()
            })
            .eq('user_id', userId);
        }
      }
    }
  }

  return novasConquistas;
}

export async function getConquistasUsuario(supabase: SupabaseClient, userId: string) {
  // Todas as conquistas
  const { data: todas } = await supabase
    .from('conquistas')
    .select('*')
    .eq('ativo', true)
    .order('ordem');

  // Conquistas do usuário
  const { data: doUsuario } = await supabase
    .from('user_conquistas')
    .select('conquista_id, desbloqueada_em')
    .eq('user_id', userId);

  const mapDesbloqueadas = new Map(
    doUsuario?.map(c => [c.conquista_id, c.desbloqueada_em]) || []
  );

  return (todas || []).map(c => ({
    ...c,
    desbloqueada: mapDesbloqueadas.has(c.id),
    desbloqueada_em: mapDesbloqueadas.get(c.id) || null
  }));
}
