'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { 
  Zap, 
  Target, 
  BookOpen, 
  Flame,
  Star,
  Trophy,
  TrendingUp,
  CheckCircle,
  ChevronRight,
  Award,
  BarChart3,
  User
} from 'lucide-react';
import { getOrCreateUserStats, calcularNivel, NIVEIS } from '@/lib/xp-system';
import { verificarConquistas, getConquistasUsuario } from '@/lib/conquistas-system';
import DicaDoDia from '@/components/DicaDoDia';
import ConquistaNotification from '@/components/ConquistaNotification';

interface UserStats {
  xp_total: number;
  nivel: number;
  titulo: string;
  streak_atual: number;
  streak_max: number;
  ultimo_estudo: string;
  questoes_respondidas: number;
  questoes_corretas: number;
  batalhas_jogadas: number;
  batalhas_perfeitas: number;
}

interface DiagnosticoResult {
  nivel: string;
  nota_tri: number;
  percentual_geral: number;
  created_at: string;
}

interface ConquistaBase {
  id: string;
  titulo: string;
  descricao: string;
  icone: string;
  xp_bonus: number;
}

interface ConquistaComStatus extends ConquistaBase {
  desbloqueada: boolean;
  desbloqueada_em: string | null;
}

export default function DashboardPage() {
  const router = useRouter();
  const supabase = createClientComponentClient();

  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState('');
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [diagnostico, setDiagnostico] = useState<DiagnosticoResult | null>(null);
  const [errosPendentes, setErrosPendentes] = useState(0);
  const [conquistasRecentes, setConquistasRecentes] = useState<ConquistaComStatus[]>([]);
  const [totalConquistas, setTotalConquistas] = useState({ desbloqueadas: 0, total: 0 });
  const [novasConquistas, setNovasConquistas] = useState<ConquistaBase[]>([]);
  const [conquistaAtual, setConquistaAtual] = useState<ConquistaBase | null>(null);

  useEffect(() => {
    async function fetchData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      const nome = user.user_metadata?.nome || user.email?.split('@')[0] || 'Estudante';
      setUserName(nome);

      const stats = await getOrCreateUserStats(supabase, user.id);
      if (stats) {
        setUserStats(stats);

        const diagnosticoCompleto = await verificarDiagnostico(user.id);
        const novas = await verificarConquistas(supabase, user.id, stats, diagnosticoCompleto);
        if (novas.length > 0) {
          setNovasConquistas(novas);
          setConquistaAtual(novas[0]);
        }
      }

      const { data: diagData } = await supabase
        .from('diagnostico_resultados')
        .select('nivel, nota_tri, percentual_geral, created_at')
        .eq('user_id', user.id)
        .single();
      
      if (diagData) {
        setDiagnostico(diagData);
      }

      const { count } = await supabase
        .from('caderno_erros')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('revisado', false);
      
      setErrosPendentes(count || 0);

      const todasConquistas = await getConquistasUsuario(supabase, user.id);
      const desbloqueadas = todasConquistas.filter(c => c.desbloqueada);
      setTotalConquistas({ desbloqueadas: desbloqueadas.length, total: todasConquistas.length });
      
      const recentes = desbloqueadas
        .sort((a, b) => new Date(b.desbloqueada_em || 0).getTime() - new Date(a.desbloqueada_em || 0).getTime())
        .slice(0, 3);
      setConquistasRecentes(recentes);

      setLoading(false);
    }

    async function verificarDiagnostico(userId: string) {
      const { data } = await supabase
        .from('diagnostico_resultados')
        .select('id')
        .eq('user_id', userId)
        .single();
      return !!data;
    }

    fetchData();
  }, [supabase, router]);

  const handleCloseConquista = () => {
    const restantes = novasConquistas.slice(1);
    setNovasConquistas(restantes);
    setConquistaAtual(restantes[0] || null);
  };

  const nivelInfo = userStats ? calcularNivel(userStats.xp_total) : null;
  const taxaAcerto = userStats && userStats.questoes_respondidas > 0 
    ? Math.round((userStats.questoes_corretas / userStats.questoes_respondidas) * 100) 
    : 0;

  const getNivelCor = (nivel: number) => {
    if (nivel >= 9) return 'from-yellow-400 to-amber-500';
    if (nivel >= 7) return 'from-orange-400 to-red-500';
    if (nivel >= 5) return 'from-purple-400 to-pink-500';
    if (nivel >= 3) return 'from-blue-400 to-indigo-500';
    return 'from-emerald-400 to-teal-500';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {conquistaAtual && (
        <ConquistaNotification 
          conquista={conquistaAtual} 
          onClose={handleCloseConquista} 
        />
      )}

      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900">Olá, {userName}! 👋</h1>
              <p className="text-sm text-gray-500">Continue sua jornada de estudos</p>
            </div>
            <Link
              href="/perfil"
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              <User className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {nivelInfo && (
          <div className={`bg-gradient-to-r ${getNivelCor(nivelInfo.nivel)} rounded-3xl p-6 text-white shadow-lg`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center">
                  <Trophy className="w-8 h-8" />
                </div>
                <div>
                  <p className="text-white/80 text-sm">Nível {nivelInfo.nivel}</p>
                  <p className="text-2xl font-black">{nivelInfo.titulo}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-3xl font-black">{nivelInfo.xpTotal}</p>
                <p className="text-white/80 text-sm">XP Total</p>
              </div>
            </div>

            <div className="mb-2">
              <div className="flex justify-between text-sm text-white/80 mb-1">
                <span>Progresso para {nivelInfo.proximoNivel}</span>
                <span>{nivelInfo.progressoNivel}%</span>
              </div>
              <div className="h-3 bg-white/20 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-white rounded-full transition-all duration-500"
                  style={{ width: `${nivelInfo.progressoNivel}%` }}
                />
              </div>
              {nivelInfo.xpParaProximo > 0 && (
                <p className="text-white/70 text-xs mt-1">Faltam {nivelInfo.xpParaProximo} XP</p>
              )}
            </div>

            {userStats && userStats.streak_atual > 0 && (
              <div className="flex items-center gap-2 mt-4 bg-white/10 rounded-xl px-4 py-2 w-fit">
                <Flame className="w-5 h-5 text-orange-300" />
                <span className="font-bold">{userStats.streak_atual} dias</span>
                <span className="text-white/70 text-sm">de streak!</span>
              </div>
            )}
          </div>
        )}

        <DicaDoDia />

        <Link href="/conquistas" className="block bg-white rounded-2xl p-5 border border-gray-100 hover:border-amber-200 transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-500" />
              <h3 className="font-bold text-gray-900">Conquistas</h3>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">
                {totalConquistas.desbloqueadas}/{totalConquistas.total}
              </span>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </div>
          </div>

          {conquistasRecentes.length > 0 ? (
            <div className="flex gap-3">
              {conquistasRecentes.map(c => (
                <div 
                  key={c.id}
                  className="w-14 h-14 bg-amber-100 rounded-2xl flex items-center justify-center text-2xl"
                  title={c.titulo}
                >
                  {c.icone}
                </div>
              ))}
              {totalConquistas.desbloqueadas > 3 && (
                <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center text-sm text-gray-500 font-bold">
                  +{totalConquistas.desbloqueadas - 3}
                </div>
              )}
            </div>
          ) : (
            <p className="text-gray-400 text-sm">Nenhuma conquista ainda. Continue estudando!</p>
          )}
        </Link>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl p-4 border border-gray-100">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-5 h-5 text-emerald-500" />
              <span className="text-gray-500 text-sm">Questões</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{userStats?.questoes_respondidas || 0}</p>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-gray-100">
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 className="w-5 h-5 text-blue-500" />
              <span className="text-gray-500 text-sm">Taxa</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{taxaAcerto}%</p>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-gray-100">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-5 h-5 text-amber-500" />
              <span className="text-gray-500 text-sm">Batalhas</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{userStats?.batalhas_jogadas || 0}</p>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-gray-100">
            <div className="flex items-center gap-2 mb-2">
              <Award className="w-5 h-5 text-purple-500" />
              <span className="text-gray-500 text-sm">Perfeitas</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{userStats?.batalhas_perfeitas || 0}</p>
          </div>
        </div>

        {diagnostico ? (
          <div className="bg-white rounded-2xl p-5 border border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-violet-100 rounded-xl flex items-center justify-center">
                  <Target className="w-6 h-6 text-violet-600" />
                </div>
                <div>
                  <p className="font-bold text-gray-900">Diagnóstico: {diagnostico.nivel}</p>
                  <p className="text-sm text-gray-500">Nota TRI: {diagnostico.nota_tri} • {diagnostico.percentual_geral}% acertos</p>
                </div>
              </div>
              <Link href="/diagnostico" className="text-violet-600 hover:text-violet-700">
                <ChevronRight className="w-6 h-6" />
              </Link>
            </div>
          </div>
        ) : (
          <Link href="/diagnostico" className="block bg-gradient-to-r from-violet-500 to-purple-500 rounded-2xl p-5 text-white hover:from-violet-600 hover:to-purple-600 transition-all">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <Target className="w-6 h-6" />
                </div>
                <div>
                  <p className="font-bold">Faça seu Diagnóstico</p>
                  <p className="text-white/80 text-sm">Descubra seu nível em matemática</p>
                </div>
              </div>
              <ChevronRight className="w-6 h-6" />
            </div>
          </Link>
        )}

        <div className="space-y-3">
          <h2 className="text-lg font-bold text-gray-900">Estudar</h2>

          <Link href="/ranking" className="block bg-gradient-to-r from-yellow-500 to-amber-500 rounded-2xl p-5 text-white hover:from-yellow-600 hover:to-amber-600 transition-all">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <Trophy className="w-6 h-6" />
                </div>
                <div>
                  <p className="font-bold">Ranking</p>
                  <p className="text-white/80 text-sm">Veja sua posição</p>
                </div>
              </div>
              <ChevronRight className="w-6 h-6" />
            </div>
          </Link>

          <Link href="/batalha" className="block bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl p-5 text-white hover:from-amber-600 hover:to-orange-600 transition-all">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <Zap className="w-6 h-6" />
                </div>
                <div>
                  <p className="font-bold">Batalha Rápida</p>
                  <p className="text-white/80 text-sm">5 questões • 30s cada • +150 XP</p>
                </div>
              </div>
              <ChevronRight className="w-6 h-6" />
            </div>
          </Link>

          <Link href="/caderno-erros" className="block bg-white rounded-2xl p-5 border border-gray-100 hover:border-red-200 hover:bg-red-50/50 transition-all">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <p className="font-bold text-gray-900">Caderno de Erros</p>
                  <p className="text-gray-500 text-sm">
                    {errosPendentes > 0 ? `${errosPendentes} questões para revisar` : 'Nenhum erro pendente'}
                  </p>
                </div>
              </div>
              {errosPendentes > 0 && (
                <span className="bg-red-500 text-white text-sm font-bold px-3 py-1 rounded-full">
                  {errosPendentes}
                </span>
              )}
            </div>
          </Link>

          <Link href="/plataforma/enem" className="block bg-white rounded-2xl p-5 border border-gray-100 hover:border-blue-200 hover:bg-blue-50/50 transition-all">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="font-bold text-gray-900">Módulos ENEM</p>
                  <p className="text-gray-500 text-sm">Estude por tópicos</p>
                </div>
              </div>
              <ChevronRight className="w-6 h-6 text-gray-400" />
            </div>
          </Link>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-gray-100">
          <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Star className="w-5 h-5 text-amber-500" />
            Níveis e Títulos
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            {NIVEIS.map((n) => (
              <div 
                key={n.nivel}
                className={`p-3 rounded-xl text-center ${
                  nivelInfo && n.nivel === nivelInfo.nivel 
                    ? 'bg-amber-100 border-2 border-amber-400' 
                    : nivelInfo && n.nivel < nivelInfo.nivel
                      ? 'bg-gray-100'
                      : 'bg-gray-50 opacity-50'
                }`}
              >
                <p className="text-lg font-bold text-gray-900">{n.nivel}</p>
                <p className="text-xs text-gray-600">{n.titulo}</p>
                <p className="text-xs text-gray-400">{n.xpNecessario} XP</p>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
