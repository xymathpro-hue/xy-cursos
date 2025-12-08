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
  TrendingUp
} from 'lucide-react';

interface Profile {
  nome: string;
  xp_total: number;
  nivel: number;
  streak_atual: number;
  maior_streak: number;
}

interface Stats {
  questoes_respondidas: number;
  acertos: number;
  taxa_acerto: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [stats, setStats] = useState<Stats>({ questoes_respondidas: 0, acertos: 0, taxa_acerto: 0 });
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
      }

      // Buscar estatísticas
      const { data: progressoData } = await supabase
        .from('progresso')
        .select('questoes_respondidas, questoes_corretas')
        .eq('user_id', user.id);

      if (progressoData && progressoData.length > 0) {
        const totalQuestoes = progressoData.reduce((acc, p) => acc + (p.questoes_respondidas || 0), 0);
        const totalAcertos = progressoData.reduce((acc, p) => acc + (p.questoes_corretas || 0), 0);
        setStats({
          questoes_respondidas: totalQuestoes,
          acertos: totalAcertos,
          taxa_acerto: totalQuestoes > 0 ? Math.round((totalAcertos / totalQuestoes) * 100) : 0
        });
      }

      setLoading(false);
    }

    fetchData();
  }, [supabase, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  const xpParaProximoNivel = 1000;
  const xpAtual = profile?.xp_total || 0;
  const progressoXP = (xpAtual % xpParaProximoNivel) / xpParaProximoNivel * 100;

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <header className="bg-slate-900/80 backdrop-blur-xl border-b border-slate-800/50 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold">XY</span>
              </div>
              <div>
                <p className="text-slate-400 text-sm">Olá,</p>
                <p className="font-bold text-white">{profile?.nome || 'Estudante'}</p>
              </div>
            </div>
            <Link 
              href="/plataforma/enem"
              className="px-4 py-2 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 flex items-center gap-2"
            >
              <BookOpen className="w-4 h-4" />
              ENEM
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        {/* Card de Progresso */}
        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              {/* Streak */}
              <div className="flex items-center gap-2">
                <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center">
                  <Flame className="w-6 h-6 text-orange-400" />
                </div>
                <div>
                  <p className="text-3xl font-black text-white">{profile?.streak_atual || 0}</p>
                  <p className="text-blue-100 text-sm">dias seguidos</p>
                </div>
              </div>
            </div>
            
            {/* Nível e XP */}
            <div className="text-right">
              <div className="flex items-center gap-2 justify-end">
                <Zap className="w-5 h-5 text-yellow-400" />
                <p className="text-2xl font-bold text-white">Nível {profile?.nivel || 1}</p>
              </div>
              <p className="text-blue-100 text-sm">{xpAtual} XP total</p>
            </div>
          </div>

          {/* Barra de XP */}
          <div>
            <div className="flex justify-between text-sm text-blue-100 mb-1">
              <span>Progresso para Nível {(profile?.nivel || 1) + 1}</span>
              <span>{Math.round(progressoXP)}%</span>
            </div>
            <div className="h-3 bg-white/20 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full transition-all"
                style={{ width: `${progressoXP}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-5 h-5 text-blue-400" />
              <span className="text-slate-400 text-sm">Questões</span>
            </div>
            <p className="text-2xl font-bold text-white">{stats.questoes_respondidas}</p>
          </div>
          
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Trophy className="w-5 h-5 text-emerald-400" />
              <span className="text-slate-400 text-sm">Acertos</span>
            </div>
            <p className="text-2xl font-bold text-white">{stats.acertos}</p>
          </div>
          
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5 text-amber-400" />
              <span className="text-slate-400 text-sm">Taxa de Acerto</span>
            </div>
            <p className="text-2xl font-bold text-white">{stats.taxa_acerto}%</p>
          </div>
          
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Flame className="w-5 h-5 text-orange-400" />
              <span className="text-slate-400 text-sm">Maior Streak</span>
            </div>
            <p className="text-2xl font-bold text-white">{profile?.maior_streak || 0}</p>
          </div>
        </div>

        {/* Ações Rápidas */}
        <h2 className="text-xl font-bold text-white mb-4">Ações Rápidas</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <Link
            href="/plataforma/enem"
            className="bg-gradient-to-br from-blue-500/10 to-indigo-500/10 border border-blue-500/30 rounded-xl p-6 hover:bg-blue-500/20 transition-all"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-blue-500 rounded-xl flex items-center justify-center">
                <BookOpen className="w-7 h-7 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-white">Continuar Estudando</h3>
                <p className="text-slate-400 text-sm">ENEM - Matemática</p>
              </div>
              <ChevronRight className="w-6 h-6 text-slate-400" />
            </div>
          </Link>

          <Link
            href="/plataforma/enem"
            className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/30 rounded-xl p-6 hover:bg-amber-500/20 transition-all"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center">
                <Swords className="w-7 h-7 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-white">Batalha Rápida</h3>
                <p className="text-slate-400 text-sm">5 questões cronometradas</p>
              </div>
              <ChevronRight className="w-6 h-6 text-slate-400" />
            </div>
          </Link>
        </div>
      </main>
    </div>
  );
}
