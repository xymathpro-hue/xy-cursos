'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { PLATAFORMAS } from '@/lib/constants/plataformas';

interface Inscricao {
  plataforma: string;
  data_inscricao: string;
}

interface UserProfile {
  nome_completo: string;
  xp_total: number;
  nivel: number;
  streak_dias: number;
}

export default function DashboardPage() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [inscricoes, setInscricoes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  
  const supabase = createClientComponentClient();

  useEffect(() => {
    async function loadData() {
      try {
        // Buscar usuário autenticado
        const { data: { user: authUser } } = await supabase.auth.getUser();
        
        if (authUser) {
          // Buscar perfil
          const { data: profile } = await supabase
            .from('profiles')
            .select('nome_completo, xp_total, nivel, streak_dias')
            .eq('id', authUser.id)
            .single();

          if (profile) {
            setUser(profile);
          }

          // Buscar inscrições
          const { data: inscricoesData } = await supabase
            .from('inscricoes')
            .select('plataforma')
            .eq('user_id', authUser.id);

          if (inscricoesData) {
            setInscricoes(inscricoesData.map(i => i.plataforma));
          }
        }
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [supabase]);

  const cursosInscritos = PLATAFORMAS.filter(p => inscricoes.includes(p.slug));
  const cursosDisponiveis = PLATAFORMAS.filter(p => !inscricoes.includes(p.slug));

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-accent-purple border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-dark-400">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-20 lg:pb-8">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-white mb-2">
          Olá, {user?.nome_completo?.split(' ')[0] || 'Estudante'}! 👋
        </h1>
        <p className="text-dark-400">
          Continue seus estudos e conquiste seus objetivos.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="stat-card">
          <div className="text-2xl mb-2">⭐</div>
          <div className="text-2xl font-bold text-white">{user?.xp_total || 0}</div>
          <div className="text-dark-400 text-sm">XP Total</div>
        </div>
        <div className="stat-card">
          <div className="text-2xl mb-2">🏅</div>
          <div className="text-2xl font-bold text-white">Nível {user?.nivel || 1}</div>
          <div className="text-dark-400 text-sm">Seu nível</div>
        </div>
        <div className="stat-card">
          <div className="text-2xl mb-2">🔥</div>
          <div className="text-2xl font-bold text-white">{user?.streak_dias || 0} dias</div>
          <div className="text-dark-400 text-sm">Sequência</div>
        </div>
        <div className="stat-card">
          <div className="text-2xl mb-2">📚</div>
          <div className="text-2xl font-bold text-white">{cursosInscritos.length}</div>
          <div className="text-dark-400 text-sm">Cursos ativos</div>
        </div>
      </div>

      {/* Meus Cursos */}
      {cursosInscritos.length > 0 ? (
        <div>
          <h2 className="font-display text-xl font-semibold text-white mb-4">
            Meus Cursos
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {cursosInscritos.map((plataforma) => (
              <Link
                key={plataforma.slug}
                href={`/plataforma/${plataforma.slug}`}
                className="card-hover group"
              >
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div 
                    className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl shrink-0"
                    style={{ backgroundColor: `${plataforma.cor}20` }}
                  >
                    {plataforma.icone}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div 
                      className="text-xs font-semibold uppercase tracking-wider mb-1"
                      style={{ color: plataforma.cor }}
                    >
                      {plataforma.subtitulo}
                    </div>
                    <h3 className="font-display font-semibold text-white mb-2 truncate">
                      {plataforma.nome}
                    </h3>
                    <p className="text-dark-400 text-sm line-clamp-2">
                      {plataforma.descricaoCompleta}
                    </p>
                  </div>

                  {/* Arrow */}
                  <div className="text-dark-500 group-hover:text-white transition-colors">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      ) : (
        <div className="card-hover p-8 text-center">
          <div className="text-4xl mb-4">📚</div>
          <h3 className="text-xl font-bold text-white mb-2">
            Nenhum curso inscrito
          </h3>
          <p className="text-dark-400 mb-6">
            Você ainda não se inscreveu em nenhum curso. Escolha um abaixo para começar!
          </p>
        </div>
      )}

      {/* Outros Cursos Disponíveis */}
      {cursosDisponiveis.length > 0 && (
        <div>
          <h2 className="font-display text-xl font-semibold text-white mb-4">
            Outros Cursos Disponíveis
          </h2>
          <p className="text-dark-400 text-sm mb-4">
            Inscreva-se em outros cursos com a mesma conta
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {cursosDisponiveis.map((plataforma) => (
              <div
                key={plataforma.slug}
                className="card-hover relative overflow-hidden"
              >
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div 
                    className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl shrink-0 opacity-60"
                    style={{ backgroundColor: `${plataforma.cor}20` }}
                  >
                    {plataforma.icone}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div 
                      className="text-xs font-semibold uppercase tracking-wider mb-1 opacity-60"
                      style={{ color: plataforma.cor }}
                    >
                      {plataforma.subtitulo}
                    </div>
                    <h3 className="font-display font-semibold text-white mb-2 truncate">
                      {plataforma.nome}
                    </h3>
                    
                    <Link
                      href={`/curso/${plataforma.slug}/entrar`}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white transition-all hover:opacity-90"
                      style={{ backgroundColor: plataforma.cor }}
                    >
                      Inscrever-se
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tip Card */}
      <div className="card bg-gradient-to-r from-accent-purple/10 to-accent-blue/10 border-accent-purple/20">
        <div className="flex items-start gap-4">
          <div className="text-3xl">💡</div>
          <div>
            <h3 className="font-medium text-white mb-1">Dica</h3>
            <p className="text-dark-300 text-sm">
              Estude um pouco todos os dias para manter sua sequência e fixar o conteúdo. 
              Apenas 15 minutos diários fazem uma grande diferença!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
