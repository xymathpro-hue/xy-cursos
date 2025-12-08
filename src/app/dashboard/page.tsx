'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { 
  Flame, 
  Zap, 
  Trophy, 
  Target, 
  BookOpen, 
  Swords,
  ChevronRight,
  TrendingUp,
  CheckCircle,
  Clock,
  Settings
} from 'lucide-react';

interface Profile {
  nome: string;
  xp_total: number;
  nivel: number;
  streak_atual: number;
  maior_streak: number;
  onboarding_completo: boolean;
}

interface Modulo {
  id: string;
  numero: number;
  titulo: string;
  descricao: string;
  icone: string;
}

interface ProgressoModulo {
  modulo_id: string;
  aulas_concluidas: number;
  total_aulas: number;
  questoes_respondidas: number;
  questoes_corretas: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [modulos, setModulos] = useState<Modulo[]>([]);
  const [progressoModulos, setProgressoModulos] = useState<{[key: string]: ProgressoModulo}>({});
  const [stats, setStats] = useState({ questoes: 0, acertos: 0, taxa: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push('/login');
        return;
      }

      // Buscar perfil
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileData) {
        setProfile(profileData);
        // Se não completou onboarding, redirecionar
        // if (!profileData.onboarding_completo) {
        //   router.push('/onboarding');
        //   return;
        // }
      }

      // Buscar módulos ENEM
      const { data: modulosData } = await supabase
        .from('modulos')
        .select('*')
        .eq('plataforma', 'enem')
        .eq('ativo', true)
        .order('ordem');

      if (modulosData) setModulos(modulosData);

      // Buscar progresso de cada módulo
      const progressoTemp: {[key: string]: ProgressoModulo} = {};
      
      for (const modulo of modulosData || []) {
        // Buscar aulas do módulo
        const { data: aulasData } = await supabase
          .from('aulas')
          .select('id')
          .eq('modulo_id', modulo.id);
        
        const totalAulas = aulasData?.length || 0;

        // Buscar aulas concluídas
        const { data: progressoAulas } = await supabase
          .from('progresso_aulas')
          .select('aula_id')
          .eq('user_id', user.id)
          .eq('concluida', true)
          .in('aula_id', aulasData?.map(a => a.id) || []);

        const aulasConcluidas = progressoAulas?.length || 0;

        // Buscar questões respondidas
        const { data: faseData } = await supabase
          .from('fases')
          .select('id')
          .eq('modulo_id', modulo.id)
          .single();

        let questoesRespondidas = 0;
        let questoesCorretas = 0;

        if (faseData) {
          const { data: respostasData } = await supabase
            .from('respostas_usuario')
            .select('correta, questoes!inner(fase_id)')
            .eq('user_id', user.id)
            .eq('questoes.fase_id', faseData.id);

          questoesRespondidas = respostasData?.length || 0;
          questoesCorretas = respostasData?.filter(r => r.correta).length || 0;
        }

        progressoTemp[modulo.id] = {
          modulo_id: modulo.id,
          aulas_concluidas: aulasConcluidas,
          total_aulas: totalAulas,
          questoes_respondidas: questoesRespondidas,
          questoes_corretas: questoesCorretas
        };
      }

      setProgressoModulos(progressoTemp);

      // Calcular estatísticas gerais
      const totalQuestoes = Object.values(progressoTemp).reduce((acc, p) => acc + p.questoes_respondidas, 0);
      const totalAcertos = Object.values(progressoTemp).reduce((acc, p) => acc + p.questoes_corretas, 0);
      setStats({
        questoes: totalQuestoes,
        acertos: totalAcertos,
        taxa: totalQuestoes > 0 ? Math.round((totalAcertos / totalQuestoes) * 100) : 0
      });

      setLoading(false);
    }

    fetchData();
  }, [supabase, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  const xpParaProximoNivel = 1000;
  const xpAtual = profile?.xp_total || 0;
  const progressoXP = (xpAtual % xpParaProximoNivel) / xpParaProximoNivel * 100;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold">XY</span>
              </div>
              <div>
                <p className="text-gray-500 text-sm">Olá,</p>
                <p className="font-bold text-gray-900">{profile?.nome || 'Estudante'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/perfil" className="p-2 text-gray-500 hover:text-gray-700">
                <Settings className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        {/* Card de Status */}
        <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-6 mb-6 text-white">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-4">
              {/* Streak */}
              <div className="flex items-center gap-2">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <Flame className="w-6 h-6 text-orange-300" />
                </div>
                <div>
                  <p className="text-2xl font-black">{profile?.streak_atual || 0}</p>
                  <p className="text-blue-100 text-sm">dias seguidos</p>
                </div>
              </div>
            </div>
            
            {/* Nível e XP */}
            <div className="text-right">
              <div className="flex items-center gap-2 justify-end">
                <Zap className="w-5 h-5 text-yellow-300" />
                <p className="text-xl font-bold">Nível {profile?.nivel || 1}</p>
              </div>
              <p className="text-blue-100 text-sm">{xpAtual} XP</p>
            </div>
          </div>

          {/* Barra de XP */}
          <div className="h-2 bg-white/20 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-yellow-300 to-orange-400 rounded-full transition-all"
              style={{ width: `${progressoXP}%` }}
            ></div>
          </div>
          <p className="text-blue-100 text-xs mt-1 text-right">{Math.round(progressoXP)}% para Nível {(profile?.nivel || 1) + 1}</p>
        </div>

        {/* Estatísticas Rápidas */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <Target className="w-6 h-6 text-blue-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">{stats.questoes}</p>
            <p className="text-gray-500 text-sm">Questões</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <Trophy className="w-6 h-6 text-emerald-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">{stats.acertos}</p>
            <p className="text-gray-500 text-sm">Acertos</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <TrendingUp className="w-6 h-6 text-amber-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">{stats.taxa}%</p>
            <p className="text-gray-500 text-sm">Taxa</p>
          </div>
        </div>

        {/* Módulos */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-blue-500" />
              Módulos de Estudo
            </h2>
            <Link href="/plataforma/enem" className="text-blue-500 text-sm font-medium hover:underline">
              Ver todos →
            </Link>
          </div>
          
          <div className="space-y-3">
            {modulos.slice(0, 5).map((modulo) => {
              const progresso = progressoModulos[modulo.id];
              const aulasPercent = progresso?.total_aulas > 0 
                ? Math.round((progresso.aulas_concluidas / progresso.total_aulas) * 100) 
                : 0;

              return (
                <Link
                  key={modulo.id}
                  href={`/plataforma/enem/modulo/${modulo.id}`}
                  className="block bg-white rounded-xl border border-gray-200 p-4 hover:border-blue-300 hover:shadow-md transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-2xl">
                      {modulo.icone || '📚'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-400 text-sm">Módulo {modulo.numero}</span>
                        {aulasPercent === 100 && (
                          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs rounded-full">Completo</span>
                        )}
                      </div>
                      <h3 className="font-semibold text-gray-900 truncate">{modulo.titulo}</h3>
                      <div className="flex items-center gap-4 mt-1">
                        <div className="flex-1">
                          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-blue-500 rounded-full transition-all"
                              style={{ width: `${aulasPercent}%` }}
                            ></div>
                          </div>
                        </div>
                        <span className="text-gray-500 text-sm">{aulasPercent}%</span>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Ações Rápidas */}
        <h2 className="text-xl font-bold text-gray-900 mb-4">Ações Rápidas</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <Link
            href="/plataforma/enem"
            className="bg-white border-2 border-blue-200 rounded-xl p-5 hover:border-blue-400 hover:shadow-md transition-all"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-gray-900">Continuar Estudando</h3>
                <p className="text-gray-500 text-sm">ENEM - Matemática</p>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </div>
          </Link>

          <Link
            href="/plataforma/enem"
            className="bg-white border-2 border-amber-200 rounded-xl p-5 hover:border-amber-400 hover:shadow-md transition-all"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center">
                <Swords className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-gray-900">Batalha Rápida</h3>
                <p className="text-gray-500 text-sm">5 questões cronometradas</p>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </div>
          </Link>
        </div>
      </main>
    </div>
  );
}
