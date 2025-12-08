'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Flame, Zap, Trophy, TrendingUp, Calendar, Target, Star } from 'lucide-react';

interface UserStats {
  xp_total: number;
  nivel: number;
  streak_dias: number;
  questoes_respondidas: number;
  acertos: number;
}

interface DashboardStatsProps {
  userId: string;
}

export function DashboardStats({ userId }: DashboardStatsProps) {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClientComponentClient();

  useEffect(() => {
    async function fetchStats() {
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('xp_total, nivel, streak_dias')
          .eq('id', userId)
          .single();

        const { data: progresso } = await supabase
          .from('progresso')
          .select('questoes_respondidas, acertos')
          .eq('user_id', userId);

        const totalQuestoes = progresso?.reduce((acc, p) => acc + (p.questoes_respondidas || 0), 0) || 0;
        const totalAcertos = progresso?.reduce((acc, p) => acc + (p.acertos || 0), 0) || 0;

        setStats({
          xp_total: profile?.xp_total || 0,
          nivel: profile?.nivel || 1,
          streak_dias: profile?.streak_dias || 0,
          questoes_respondidas: totalQuestoes,
          acertos: totalAcertos
        });
      } catch (error) {
        console.error('Erro ao carregar estatísticas:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, [userId, supabase]);

  const taxaAcerto = stats && stats.questoes_respondidas > 0 
    ? Math.round((stats.acertos / stats.questoes_respondidas) * 100) 
    : 0;

  const xpProximoNivel = stats ? (stats.nivel * 1000) : 1000;
  const xpAtual = stats?.xp_total || 0;
  const progressoNivel = Math.min((xpAtual / xpProximoNivel) * 100, 100);

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-64 bg-slate-800/50 rounded-3xl"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Hero Card - Streak & Nível */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-slate-700/50 p-8">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 25px 25px, white 2px, transparent 0)`,
            backgroundSize: '50px 50px'
          }}></div>
        </div>
        
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-orange-500/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-blue-500/20 rounded-full blur-3xl"></div>

        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
          {/* Streak Section */}
          <div className="flex items-center gap-6">
            <div className="relative">
              <div className={`w-24 h-24 rounded-2xl flex items-center justify-center ${
                stats && stats.streak_dias > 0 
                  ? 'bg-gradient-to-br from-orange-500 to-amber-600 shadow-lg shadow-orange-500/30' 
                  : 'bg-slate-700/50'
              }`}>
                <Flame className={`w-12 h-12 ${stats && stats.streak_dias > 0 ? 'text-white' : 'text-slate-500'}`} />
              </div>
              {stats && stats.streak_dias >= 7 && (
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center shadow-lg">
                  <Star className="w-5 h-5 text-yellow-900" />
                </div>
              )}
            </div>
            <div>
              <p className="text-slate-400 text-sm font-medium uppercase tracking-wider">Sequência</p>
              <p className="text-5xl font-black text-white">{stats?.streak_dias || 0}</p>
              <p className="text-slate-500 text-sm">
                {stats && stats.streak_dias === 1 ? 'dia' : 'dias'} consecutivos
              </p>
            </div>
          </div>

          <div className="hidden md:block w-px h-24 bg-gradient-to-b from-transparent via-slate-600 to-transparent"></div>

          {/* Level & XP Section */}
          <div className="flex-1 max-w-md">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-slate-400 text-xs font-medium uppercase tracking-wider">Nível</p>
                  <p className="text-3xl font-black text-white">{stats?.nivel || 1}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-slate-400 text-xs font-medium uppercase tracking-wider">XP Total</p>
                <p className="text-2xl font-bold text-blue-400">{xpAtual.toLocaleString()}</p>
              </div>
            </div>
            
            <div className="relative h-4 bg-slate-700/50 rounded-full overflow-hidden">
              <div 
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 rounded-full transition-all duration-1000 ease-out"
                style={{ width: `${progressoNivel}%` }}
              >
                <div className="absolute inset-0 bg-gradient-to-t from-transparent to-white/20"></div>
              </div>
            </div>
            <p className="text-slate-500 text-xs mt-2 text-right">
              {xpAtual.toLocaleString()} / {xpProximoNivel.toLocaleString()} XP para nível {(stats?.nivel || 1) + 1}
            </p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={<Target className="w-6 h-6" />} label="Questões" value={stats?.questoes_respondidas || 0} color="emerald" />
        <StatCard icon={<Trophy className="w-6 h-6" />} label="Taxa de Acerto" value={`${taxaAcerto}%`} color="amber" />
        <StatCard icon={<Calendar className="w-6 h-6" />} label="Maior Streak" value={stats?.streak_dias || 0} color="purple" />
        <StatCard icon={<TrendingUp className="w-6 h-6" />} label="Acertos" value={stats?.acertos || 0} color="cyan" />
      </div>
    </div>
  );
}

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color: 'emerald' | 'amber' | 'purple' | 'cyan';
}

function StatCard({ icon, label, value, color }: StatCardProps) {
  const colorClasses = {
    emerald: 'from-emerald-500/20 to-emerald-600/10 border-emerald-500/30 text-emerald-400',
    amber: 'from-amber-500/20 to-amber-600/10 border-amber-500/30 text-amber-400',
    purple: 'from-purple-500/20 to-purple-600/10 border-purple-500/30 text-purple-400',
    cyan: 'from-cyan-500/20 to-cyan-600/10 border-cyan-500/30 text-cyan-400'
  };

  return (
    <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${colorClasses[color]} border p-5 transition-all hover:scale-[1.02] hover:shadow-lg`}>
      <div className="flex items-start justify-between">
        <div className={colorClasses[color].split(' ').pop()}>{icon}</div>
      </div>
      <p className="text-2xl font-bold text-white mt-3">{value}</p>
      <p className="text-slate-400 text-sm mt-1">{label}</p>
    </div>
  );
}
