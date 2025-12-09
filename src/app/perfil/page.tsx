'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { 
  ArrowLeft,
  User,
  Mail,
  Calendar,
  Trophy,
  Flame,
  Star,
  Zap,
  Target,
  CheckCircle,
  XCircle,
  Edit3,
  Save,
  X,
  BarChart3,
  Award,
  BookOpen
} from 'lucide-react';
import { getOrCreateUserStats, calcularNivel } from '@/lib/xp-system';
import { getConquistasUsuario } from '@/lib/conquistas-system';

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
  created_at: string;
}

interface XPHistorico {
  id: string;
  xp_ganho: number;
  motivo: string;
  created_at: string;
}

export default function PerfilPage() {
  const router = useRouter();
  const supabase = createClientComponentClient();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editando, setEditando] = useState(false);
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [novoNome, setNovoNome] = useState('');
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [historicoXP, setHistoricoXP] = useState<XPHistorico[]>([]);
  const [totalConquistas, setTotalConquistas] = useState({ desbloqueadas: 0, total: 0 });
  const [dataCriacao, setDataCriacao] = useState<string>('');

  useEffect(() => {
    async function fetchData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      // Dados do usuário
      const nome = user.user_metadata?.nome || user.email?.split('@')[0] || 'Estudante';
      setUserName(nome);
      setNovoNome(nome);
      setUserEmail(user.email || '');
      setDataCriacao(user.created_at);

      // Stats
      const stats = await getOrCreateUserStats(supabase, user.id);
      if (stats) {
        setUserStats(stats);
      }

      // Histórico de XP (últimos 10)
      const { data: historico } = await supabase
        .from('xp_historico')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (historico) {
        setHistoricoXP(historico);
      }

      // Conquistas
      const conquistas = await getConquistasUsuario(supabase, user.id);
      const desbloqueadas = conquistas.filter(c => c.desbloqueada);
      setTotalConquistas({ desbloqueadas: desbloqueadas.length, total: conquistas.length });

      setLoading(false);
    }

    fetchData();
  }, [supabase, router]);

  const handleSalvarNome = async () => {
    if (!novoNome.trim()) return;
    setSaving(true);

    const { error } = await supabase.auth.updateUser({
      data: { nome: novoNome.trim() }
    });

    if (!error) {
      setUserName(novoNome.trim());
      setEditando(false);
    }

    setSaving(false);
  };

  const handleCancelarEdicao = () => {
    setNovoNome(userName);
    setEditando(false);
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

  const formatarData = (data: string) => {
    return new Date(data).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  const formatarDataHora = (data: string) => {
    return new Date(data).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-violet-500/30 border-t-violet-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className={`bg-gradient-to-r ${getNivelCor(nivelInfo?.nivel || 1)} text-white`}>
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3 mb-6">
            <Link href="/dashboard" className="p-2 hover:bg-white/10 rounded-lg">
              <ArrowLeft className="w-6 h-6" />
            </Link>
            <h1 className="text-xl font-bold">Meu Perfil</h1>
          </div>

          {/* Card do usuário */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center">
                <User className="w-10 h-10" />
              </div>
              <div className="flex-1">
                {editando ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={novoNome}
                      onChange={(e) => setNovoNome(e.target.value)}
                      className="bg-white/20 border border-white/30 rounded-lg px-3 py-2 text-white placeholder-white/50 focus:outline-none focus:border-white"
                      placeholder="Seu nome"
                      autoFocus
                    />
                    <button
                      onClick={handleSalvarNome}
                      disabled={saving}
                      className="p-2 bg-white/20 rounded-lg hover:bg-white/30"
                    >
                      <Save className="w-5 h-5" />
                    </button>
                    <button
                      onClick={handleCancelarEdicao}
                      className="p-2 bg-white/20 rounded-lg hover:bg-white/30"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <h2 className="text-2xl font-black">{userName}</h2>
                    <button
                      onClick={() => setEditando(true)}
                      className="p-1.5 hover:bg-white/10 rounded-lg"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                  </div>
                )}
                <p className="text-white/80 text-sm flex items-center gap-1 mt-1">
                  <Mail className="w-4 h-4" />
                  {userEmail}
                </p>
                <p className="text-white/60 text-xs flex items-center gap-1 mt-1">
                  <Calendar className="w-3 h-3" />
                  Membro desde {formatarData(dataCriacao)}
                </p>
              </div>
            </div>

            {/* Nível e XP */}
            {nivelInfo && (
              <div className="mt-6 grid grid-cols-3 gap-4">
                <div className="bg-white/10 rounded-xl p-3 text-center">
                  <p className="text-2xl font-black">{nivelInfo.nivel}</p>
                  <p className="text-white/70 text-xs">Nível</p>
                </div>
                <div className="bg-white/10 rounded-xl p-3 text-center">
                  <p className="text-2xl font-black">{nivelInfo.xpTotal}</p>
                  <p className="text-white/70 text-xs">XP Total</p>
                </div>
                <div className="bg-white/10 rounded-xl p-3 text-center">
                  <p className="text-2xl font-black">{userStats?.streak_max || 0}</p>
                  <p className="text-white/70 text-xs">Maior Streak</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Estatísticas Detalhadas */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100">
          <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-500" />
            Estatísticas
          </h3>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-emerald-50 rounded-xl p-4 text-center">
              <CheckCircle className="w-6 h-6 text-emerald-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-emerald-600">{userStats?.questoes_respondidas || 0}</p>
              <p className="text-emerald-700 text-xs">Questões Respondidas</p>
            </div>

            <div className="bg-blue-50 rounded-xl p-4 text-center">
              <Target className="w-6 h-6 text-blue-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-blue-600">{userStats?.questoes_corretas || 0}</p>
              <p className="text-blue-700 text-xs">Acertos</p>
            </div>

            <div className="bg-amber-50 rounded-xl p-4 text-center">
              <Zap className="w-6 h-6 text-amber-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-amber-600">{userStats?.batalhas_jogadas || 0}</p>
              <p className="text-amber-700 text-xs">Batalhas</p>
            </div>

            <div className="bg-purple-50 rounded-xl p-4 text-center">
              <Award className="w-6 h-6 text-purple-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-purple-600">{userStats?.batalhas_perfeitas || 0}</p>
              <p className="text-purple-700 text-xs">Perfeitas</p>
            </div>
          </div>

          {/* Taxa de acerto */}
          <div className="mt-4 bg-gray-50 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-700 font-medium">Taxa de Acerto</span>
              <span className="font-bold text-gray-900">{taxaAcerto}%</span>
            </div>
            <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full ${taxaAcerto >= 70 ? 'bg-emerald-500' : taxaAcerto >= 50 ? 'bg-amber-500' : 'bg-red-500'}`}
                style={{ width: `${taxaAcerto}%` }}
              />
            </div>
          </div>
        </div>

        {/* Streak e Conquistas */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl p-5 border border-gray-100">
            <div className="flex items-center gap-2 mb-3">
              <Flame className="w-5 h-5 text-orange-500" />
              <h3 className="font-bold text-gray-900">Streak</h3>
            </div>
            <div className="text-center">
              <p className="text-4xl font-black text-orange-500">{userStats?.streak_atual || 0}</p>
              <p className="text-gray-500 text-sm">dias seguidos</p>
              <p className="text-gray-400 text-xs mt-2">Recorde: {userStats?.streak_max || 0} dias</p>
            </div>
          </div>

          <Link href="/conquistas" className="bg-white rounded-2xl p-5 border border-gray-100 hover:border-amber-200 transition-all">
            <div className="flex items-center gap-2 mb-3">
              <Trophy className="w-5 h-5 text-amber-500" />
              <h3 className="font-bold text-gray-900">Conquistas</h3>
            </div>
            <div className="text-center">
              <p className="text-4xl font-black text-amber-500">{totalConquistas.desbloqueadas}</p>
              <p className="text-gray-500 text-sm">de {totalConquistas.total}</p>
              <p className="text-amber-600 text-xs mt-2">Ver todas →</p>
            </div>
          </Link>
        </div>

        {/* Histórico de XP */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100">
          <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Star className="w-5 h-5 text-amber-500" />
            Últimos Ganhos de XP
          </h3>

          {historicoXP.length > 0 ? (
            <div className="space-y-2">
              {historicoXP.map((item) => (
                <div key={item.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <div>
                    <p className="text-gray-900 font-medium">{item.motivo}</p>
                    <p className="text-gray-400 text-xs">{formatarDataHora(item.created_at)}</p>
                  </div>
                  <span className="text-emerald-600 font-bold">+{item.xp_ganho} XP</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-center py-4">Nenhum XP ganho ainda</p>
          )}
        </div>

        {/* Ações */}
        <div className="space-y-3">
          <Link href="/ranking" className="block bg-white rounded-2xl p-4 border border-gray-100 hover:border-amber-200 transition-all">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Trophy className="w-6 h-6 text-amber-500" />
                <span className="font-medium text-gray-900">Ver Ranking</span>
              </div>
              <ArrowLeft className="w-5 h-5 text-gray-400 rotate-180" />
            </div>
          </Link>

          <Link href="/caderno-erros" className="block bg-white rounded-2xl p-4 border border-gray-100 hover:border-red-200 transition-all">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <BookOpen className="w-6 h-6 text-red-500" />
                <span className="font-medium text-gray-900">Caderno de Erros</span>
              </div>
              <ArrowLeft className="w-5 h-5 text-gray-400 rotate-180" />
            </div>
          </Link>
        </div>
      </main>
    </div>
  );
}
