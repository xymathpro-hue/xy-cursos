'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { 
  ArrowLeft,
  Trophy,
  Medal,
  Flame,
  Star,
  Crown,
  Zap,
  Target
} from 'lucide-react';

interface RankingUser {
  user_id: string;
  nome: string;
  xp_total: number;
  nivel: number;
  titulo: string;
  streak_atual: number;
  posicao: number;
}

export default function RankingPage() {
  const router = useRouter();
  const supabase = createClientComponentClient();

  const [loading, setLoading] = useState(true);
  const [ranking, setRanking] = useState<RankingUser[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [minhaPosicao, setMinhaPosicao] = useState<RankingUser | null>(null);

  useEffect(() => {
    async function fetchData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }
      setUserId(user.id);

      // Buscar top 50 do ranking
      const { data: rankingData } = await supabase
        .from('ranking_usuarios')
        .select('*')
        .order('posicao')
        .limit(50);

      if (rankingData) {
        setRanking(rankingData);
        
        // Encontrar posição do usuário atual
        const minha = rankingData.find(r => r.user_id === user.id);
        if (minha) {
          setMinhaPosicao(minha);
        } else {
          // Buscar posição se não estiver no top 50
          const { data: minhaData } = await supabase
            .from('ranking_usuarios')
            .select('*')
            .eq('user_id', user.id)
            .single();
          
          if (minhaData) {
            setMinhaPosicao(minhaData);
          }
        }
      }

      setLoading(false);
    }

    fetchData();
  }, [supabase, router]);

  const getPosicaoIcon = (posicao: number) => {
    switch (posicao) {
      case 1: return <Crown className="w-6 h-6 text-yellow-500" />;
      case 2: return <Medal className="w-6 h-6 text-gray-400" />;
      case 3: return <Medal className="w-6 h-6 text-amber-600" />;
      default: return <span className="w-6 h-6 flex items-center justify-center text-gray-500 font-bold">{posicao}</span>;
    }
  };

  const getPosicaoBg = (posicao: number, isMe: boolean) => {
    if (isMe) return 'bg-violet-50 border-violet-300';
    switch (posicao) {
      case 1: return 'bg-yellow-50 border-yellow-300';
      case 2: return 'bg-gray-50 border-gray-300';
      case 3: return 'bg-amber-50 border-amber-300';
      default: return 'bg-white border-gray-100';
    }
  };

  const getNivelCor = (nivel: number) => {
    if (nivel >= 9) return 'text-yellow-600 bg-yellow-100';
    if (nivel >= 7) return 'text-orange-600 bg-orange-100';
    if (nivel >= 5) return 'text-purple-600 bg-purple-100';
    if (nivel >= 3) return 'text-blue-600 bg-blue-100';
    return 'text-emerald-600 bg-emerald-100';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-amber-500/30 border-t-amber-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-amber-500 to-yellow-500 text-white">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="p-2 hover:bg-white/10 rounded-lg">
              <ArrowLeft className="w-6 h-6" />
            </Link>
            <div>
              <h1 className="text-xl font-bold flex items-center gap-2">
                <Trophy className="w-6 h-6" />
                Ranking
              </h1>
              <p className="text-white/80 text-sm">Os melhores estudantes</p>
            </div>
          </div>
        </div>
      </header>

      {/* Minha posição (fixo no topo se não estiver no top 3) */}
      {minhaPosicao && minhaPosicao.posicao > 3 && (
        <div className="bg-violet-500 text-white px-4 py-3 sticky top-0 z-10">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center font-bold">
                {minhaPosicao.posicao}º
              </div>
              <div>
                <p className="font-bold">Você</p>
                <p className="text-white/80 text-sm">{minhaPosicao.titulo}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-bold">{minhaPosicao.xp_total} XP</p>
              <p className="text-white/80 text-sm">Nível {minhaPosicao.nivel}</p>
            </div>
          </div>
        </div>
      )}

      {/* Top 3 Podium */}
      {ranking.length >= 3 && (
        <div className="bg-gradient-to-b from-amber-500/10 to-transparent px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-end justify-center gap-4">
              {/* 2º lugar */}
              <div className="flex flex-col items-center">
                <div className={`w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center text-2xl font-bold border-4 border-gray-400 ${ranking[1].user_id === userId ? 'ring-4 ring-violet-400' : ''}`}>
                  🥈
                </div>
                <p className="mt-2 font-bold text-gray-900 text-center text-sm truncate max-w-20">
                  {ranking[1].user_id === userId ? 'Você' : ranking[1].nome}
                </p>
                <p className="text-gray-500 text-xs">{ranking[1].xp_total} XP</p>
                <div className="mt-2 w-20 h-16 bg-gray-300 rounded-t-lg flex items-center justify-center">
                  <span className="text-2xl font-black text-gray-600">2</span>
                </div>
              </div>

              {/* 1º lugar */}
              <div className="flex flex-col items-center -mt-4">
                <div className="relative">
                  <Crown className="w-8 h-8 text-yellow-500 absolute -top-6 left-1/2 -translate-x-1/2" />
                  <div className={`w-20 h-20 rounded-full bg-yellow-200 flex items-center justify-center text-3xl font-bold border-4 border-yellow-500 ${ranking[0].user_id === userId ? 'ring-4 ring-violet-400' : ''}`}>
                    🥇
                  </div>
                </div>
                <p className="mt-2 font-bold text-gray-900 text-center text-sm truncate max-w-24">
                  {ranking[0].user_id === userId ? 'Você' : ranking[0].nome}
                </p>
                <p className="text-gray-500 text-xs">{ranking[0].xp_total} XP</p>
                <div className="mt-2 w-24 h-24 bg-yellow-400 rounded-t-lg flex items-center justify-center">
                  <span className="text-3xl font-black text-yellow-700">1</span>
                </div>
              </div>

              {/* 3º lugar */}
              <div className="flex flex-col items-center">
                <div className={`w-16 h-16 rounded-full bg-amber-200 flex items-center justify-center text-2xl font-bold border-4 border-amber-500 ${ranking[2].user_id === userId ? 'ring-4 ring-violet-400' : ''}`}>
                  🥉
                </div>
                <p className="mt-2 font-bold text-gray-900 text-center text-sm truncate max-w-20">
                  {ranking[2].user_id === userId ? 'Você' : ranking[2].nome}
                </p>
                <p className="text-gray-500 text-xs">{ranking[2].xp_total} XP</p>
                <div className="mt-2 w-20 h-12 bg-amber-400 rounded-t-lg flex items-center justify-center">
                  <span className="text-2xl font-black text-amber-700">3</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lista do ranking */}
      <main className="max-w-4xl mx-auto px-4 py-6">
        <div className="space-y-2">
          {ranking.slice(3).map((user) => {
            const isMe = user.user_id === userId;
            
            return (
              <div
                key={user.user_id}
                className={`rounded-2xl p-4 border-2 transition-all ${getPosicaoBg(user.posicao, isMe)}`}
              >
                <div className="flex items-center gap-4">
                  {/* Posição */}
                  <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center font-bold text-gray-600">
                    {user.posicao}º
                  </div>

                  {/* Avatar/Nome */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className={`font-bold ${isMe ? 'text-violet-700' : 'text-gray-900'}`}>
                        {isMe ? 'Você' : user.nome}
                      </p>
                      {user.streak_atual >= 3 && (
                        <div className="flex items-center gap-1 text-orange-500">
                          <Flame className="w-4 h-4" />
                          <span className="text-xs font-medium">{user.streak_atual}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getNivelCor(user.nivel)}`}>
                        Nível {user.nivel}
                      </span>
                      <span className="text-xs text-gray-400">{user.titulo}</span>
                    </div>
                  </div>

                  {/* XP */}
                  <div className="text-right">
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-amber-500" />
                      <p className="font-bold text-gray-900">{user.xp_total}</p>
                    </div>
                    <p className="text-xs text-gray-400">XP</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {ranking.length === 0 && (
          <div className="text-center py-12">
            <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Nenhum usuário no ranking ainda</p>
            <p className="text-gray-400 text-sm">Seja o primeiro a ganhar XP!</p>
          </div>
        )}

        {/* Call to action */}
        <div className="mt-8 bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl p-6 text-white text-center">
          <Zap className="w-10 h-10 mx-auto mb-3" />
          <h3 className="text-xl font-bold mb-2">Suba no Ranking!</h3>
          <p className="text-white/80 mb-4">Faça batalhas e exercícios para ganhar XP</p>
          <Link 
            href="/batalha"
            className="inline-block bg-white text-amber-600 font-bold px-6 py-3 rounded-xl hover:bg-amber-50 transition-all"
          >
            ⚡ Batalha Rápida
          </Link>
        </div>
      </main>
    </div>
  );
}
