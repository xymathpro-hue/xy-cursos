'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { ArrowLeft, User, Target, Clock, Calendar, Brain, Save, LogOut } from 'lucide-react';

interface Profile {
  id: string;
  nome: string;
  nome_completo: string;
  email: string;
  xp_total: number;
  nivel: number;
  streak_atual: number;
  maior_streak: number;
  meta_pontuacao: number;
  horas_semana: string;
  dias_estudo: string[];
  data_enem: string;
  nivel_autoavaliado: string;
}

interface Inscricao {
  plataforma: string;
}

const plataformasInfo: Record<string, { nome: string; cor: string; icone: string }> = {
  enem: { nome: 'XY Matemática ENEM', cor: '#3B82F6', icone: '🎓' },
  olimpico: { nome: 'XY Olímpico', cor: '#F97316', icone: '🏆' },
  financeiro: { nome: 'XY Educação Financeira', cor: '#22C55E', icone: '💰' },
  ifpi: { nome: 'XY Preparatório IFPI', cor: '#A855F7', icone: '🎯' },
};

const niveisLabel: Record<string, string> = {
  basico: '🌱 Básico',
  intermediario: '📚 Intermediário',
  avancado: '🚀 Avançado',
  expert: '🏆 Expert',
};

export default function PerfilPage() {
  const router = useRouter();
  const supabase = createClientComponentClient();
  
  const [profile, setProfile] = useState<Profile | null>(null);
  const [inscricoes, setInscricoes] = useState<Inscricao[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [nome, setNome] = useState('');
  const [mensagem, setMensagem] = useState('');

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
        setNome(profileData.nome || profileData.nome_completo || '');
      }

      // Buscar inscrições
      const { data: inscricoesData } = await supabase
        .from('inscricoes')
        .select('plataforma')
        .eq('user_id', user.id);

      if (inscricoesData) {
        setInscricoes(inscricoesData);
      }

      setLoading(false);
    }

    fetchData();
  }, [supabase, router]);

  const salvarNome = async () => {
    if (!profile) return;
    setSaving(true);
    
    const { error } = await supabase
      .from('profiles')
      .update({ nome: nome, updated_at: new Date().toISOString() })
      .eq('id', profile.id);

    if (error) {
      setMensagem('Erro ao salvar');
    } else {
      setMensagem('Salvo com sucesso!');
      setTimeout(() => setMensagem(''), 3000);
    }
    setSaving(false);
  };

  const fazerLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  const diasAteEnem = profile?.data_enem 
    ? Math.ceil((new Date(profile.data_enem).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/dashboard" className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
              <ArrowLeft className="w-5 h-5" />
              <span>Voltar</span>
            </Link>
            <h1 className="font-bold text-gray-900">Meu Perfil</h1>
            <div className="w-20"></div>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Card do Usuário */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center">
              <User className="w-10 h-10 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">{nome || 'Estudante'}</h2>
              <p className="text-gray-500">{profile?.email}</p>
              <div className="flex items-center gap-3 mt-2">
                <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                  Nível {profile?.nivel || 1}
                </span>
                <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-sm font-medium">
                  {profile?.xp_total || 0} XP
                </span>
              </div>
            </div>
          </div>

          {/* Editar Nome */}
          <div className="border-t border-gray-100 pt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Nome</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="flex-1 px-4 py-2 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
              />
              <button
                onClick={salvarNome}
                disabled={saving}
                className="px-4 py-2 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600 disabled:opacity-50 flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
            {mensagem && (
              <p className="text-emerald-600 text-sm mt-2">{mensagem}</p>
            )}
          </div>
        </div>

        {/* Minhas Metas */}
        {profile?.meta_pontuacao && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h3 className="font-bold text-gray-900 mb-4">Minhas Metas</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-50 rounded-xl p-4">
                <div className="flex items-center gap-2 text-blue-600 mb-1">
                  <Target className="w-5 h-5" />
                  <span className="text-sm font-medium">Meta ENEM</span>
                </div>
                <p className="text-2xl font-bold text-gray-900">{profile.meta_pontuacao}+ pts</p>
              </div>

              {profile.horas_semana && (
                <div className="bg-emerald-50 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-emerald-600 mb-1">
                    <Clock className="w-5 h-5" />
                    <span className="text-sm font-medium">Tempo/Semana</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{profile.horas_semana}</p>
                </div>
              )}

              {diasAteEnem && diasAteEnem > 0 && (
                <div className="bg-amber-50 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-amber-600 mb-1">
                    <Calendar className="w-5 h-5" />
                    <span className="text-sm font-medium">Dias p/ ENEM</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{diasAteEnem} dias</p>
                </div>
              )}

              {profile.nivel_autoavaliado && (
                <div className="bg-purple-50 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-purple-600 mb-1">
                    <Brain className="w-5 h-5" />
                    <span className="text-sm font-medium">Meu Nível</span>
                  </div>
                  <p className="text-lg font-bold text-gray-900">{niveisLabel[profile.nivel_autoavaliado] || profile.nivel_autoavaliado}</p>
                </div>
              )}
            </div>

            <Link
              href="/onboarding"
              className="block text-center text-blue-500 text-sm font-medium mt-4 hover:underline"
            >
              Alterar metas →
            </Link>
          </div>
        )}

        {/* Plataformas Inscritas */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h3 className="font-bold text-gray-900 mb-4">Minhas Plataformas</h3>
          
          {inscricoes.length === 0 ? (
            <p className="text-gray-500 text-center py-4">Nenhuma inscrição encontrada</p>
          ) : (
            <div className="space-y-3">
              {inscricoes.map((inscricao) => {
                const info = plataformasInfo[inscricao.plataforma];
                if (!info) return null;
                
                return (
                  <Link
                    key={inscricao.plataforma}
                    href={`/plataforma/${inscricao.plataforma}`}
                    className="flex items-center gap-4 p-4 rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all"
                  >
                    <span className="text-3xl">{info.icone}</span>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">{info.nome}</p>
                      <p className="text-sm text-gray-500">Inscrito</p>
                    </div>
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: info.cor }}
                    ></div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Estatísticas */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h3 className="font-bold text-gray-900 mb-4">Estatísticas</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-xl">
              <p className="text-3xl font-bold text-gray-900">{profile?.streak_atual || 0}</p>
              <p className="text-gray-500 text-sm">Sequência Atual</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-xl">
              <p className="text-3xl font-bold text-gray-900">{profile?.maior_streak || 0}</p>
              <p className="text-gray-500 text-sm">Maior Sequência</p>
            </div>
          </div>
        </div>

        {/* Sair */}
        <button
          onClick={fazerLogout}
          className="w-full flex items-center justify-center gap-2 py-4 rounded-xl border-2 border-red-200 text-red-600 font-medium hover:bg-red-50 transition-all"
        >
          <LogOut className="w-5 h-5" />
          Sair da conta
        </button>
      </main>
    </div>
  );
}
