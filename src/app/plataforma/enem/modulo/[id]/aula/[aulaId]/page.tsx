'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { ArrowLeft, BookOpen, Trophy, Lock, CheckCircle, Star } from 'lucide-react';

interface Aula {
  id: string;
  titulo: string;
  descricao: string;
  conteudo: string;
  ordem: number;
}

interface NivelProgresso {
  total: number;
  corretas: number;
  completo: boolean;
}

export default function AulaPage() {
  const params = useParams();
  const router = useRouter();
  const supabase = createClientComponentClient();

  const moduloId = params.id as string;
  const aulaId = params.aulaId as string;

  const [loading, setLoading] = useState(true);
  const [aula, setAula] = useState<Aula | null>(null);
  const [progresso, setProgresso] = useState({
    facil: { total: 10, corretas: 0, completo: false },
    medio: { total: 10, corretas: 0, completo: false },
    dificil: { total: 10, corretas: 0, completo: false }
  });
  const [tab, setTab] = useState<'teoria' | 'exercicios'>('teoria');

  useEffect(() => {
    async function fetchData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      // Buscar aula
      const { data: aulaData } = await supabase
        .from('aulas')
        .select('*')
        .eq('id', aulaId)
        .single();

      if (aulaData) {
        setAula(aulaData);
      }

      // Buscar progresso do usuário por nível
      const { data: respostas } = await supabase
        .from('user_respostas')
        .select('questao_id, correta, questoes(dificuldade)')
        .eq('user_id', user.id);

      // Buscar questões da aula
      const { data: questoes } = await supabase
        .from('questoes')
        .select('id, dificuldade')
        .eq('aula_id', aulaId)
        .eq('ativo', true);

      if (questoes && respostas) {
        const questoesIds = questoes.map(q => q.id);
        const respostasAula = respostas.filter(r => questoesIds.includes(r.questao_id));

        const faceis = questoes.filter(q => q.dificuldade === 'facil');
        const medias = questoes.filter(q => q.dificuldade === 'medio');
        const dificeis = questoes.filter(q => q.dificuldade === 'dificil');

        const respostasFacil = respostasAula.filter((r: any) => r.questoes?.dificuldade === 'facil');
        const respostasMedio = respostasAula.filter((r: any) => r.questoes?.dificuldade === 'medio');
        const respostasDificil = respostasAula.filter((r: any) => r.questoes?.dificuldade === 'dificil');

        setProgresso({
          facil: {
            total: faceis.length || 10,
            corretas: respostasFacil.filter((r: any) => r.correta).length,
            completo: respostasFacil.length >= (faceis.length || 10)
          },
          medio: {
            total: medias.length || 10,
            corretas: respostasMedio.filter((r: any) => r.correta).length,
            completo: respostasMedio.length >= (medias.length || 10)
          },
          dificil: {
            total: dificeis.length || 10,
            corretas: respostasDificil.filter((r: any) => r.correta).length,
            completo: respostasDificil.length >= (dificeis.length || 10)
          }
        });
      }

      setLoading(false);
    }

    fetchData();
  }, [supabase, router, aulaId]);

  const getProgressoGeral = () => {
    const totalQuestoes = progresso.facil.total + progresso.medio.total + progresso.dificil.total;
    const totalCorretas = progresso.facil.corretas + progresso.medio.corretas + progresso.dificil.corretas;
    return Math.round((totalCorretas / totalQuestoes) * 100);
  };

  const nivelDesbloqueado = (nivel: 'facil' | 'medio' | 'dificil') => {
    if (nivel === 'facil') return true;
    if (nivel === 'medio') return progresso.facil.completo;
    if (nivel === 'dificil') return progresso.medio.completo;
    return false;
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
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <Link href={`/plataforma/enem/modulo/${moduloId}`} className="p-2 hover:bg-gray-100 rounded-lg">
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </Link>
            <div className="flex-1">
              <h1 className="text-lg font-bold text-gray-900">{aula?.titulo || 'Aula'}</h1>
              <div className="flex items-center gap-2 mt-1">
                <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all"
                    style={{ width: `${getProgressoGeral()}%` }}
                  />
                </div>
                <span className="text-sm font-medium text-gray-600">{getProgressoGeral()}%</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex gap-4">
            <button
              onClick={() => setTab('teoria')}
              className={`py-3 px-4 font-medium border-b-2 transition-all ${
                tab === 'teoria'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              📖 Teoria
            </button>
            <button
              onClick={() => setTab('exercicios')}
              className={`py-3 px-4 font-medium border-b-2 transition-all ${
                tab === 'exercicios'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              📝 Exercícios
            </button>
          </div>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {tab === 'teoria' ? (
          /* Aba Teoria */
          <div className="bg-white rounded-2xl p-6 border border-gray-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">{aula?.titulo}</h2>
                <p className="text-gray-500">{aula?.descricao}</p>
              </div>
            </div>
            
            <div className="prose prose-blue max-w-none">
              {aula?.conteudo ? (
                <div dangerouslySetInnerHTML={{ __html: aula.conteudo }} />
              ) : (
                <div className="text-center py-12 text-gray-400">
                  <BookOpen className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p>Conteúdo teórico em breve...</p>
                </div>
              )}
            </div>

            <button
              onClick={() => setTab('exercicios')}
              className="w-full mt-8 bg-blue-500 text-white font-bold py-4 rounded-xl hover:bg-blue-600 transition-all"
            >
              Ir para Exercícios →
            </button>
          </div>
        ) : (
          /* Aba Exercícios - 3 Níveis */
          <div className="space-y-4">
            {/* Nível Fácil */}
            <div className={`bg-white rounded-2xl border-2 overflow-hidden transition-all ${
              nivelDesbloqueado('facil') ? 'border-emerald-200' : 'border-gray-200 opacity-60'
            }`}>
              <div className="p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                      <span className="text-2xl">🟢</span>
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">Nível Fácil</h3>
                      <p className="text-sm text-gray-500">Questões básicas para fixação</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-black text-emerald-600">
                      {progresso.facil.corretas}/{progresso.facil.total}
                    </p>
                    <p className="text-xs text-gray-400">acertos</p>
                  </div>
                </div>
                
                {/* Barra de progresso */}
                <div className="mt-4 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-emerald-500 transition-all"
                    style={{ width: `${(progresso.facil.corretas / progresso.facil.total) * 100}%` }}
                  />
                </div>

                <Link
                  href={`/plataforma/enem/modulo/${moduloId}/aula/${aulaId}/exercicios?nivel=facil`}
                  className="mt-4 w-full bg-emerald-500 text-white font-bold py-3 rounded-xl hover:bg-emerald-600 transition-all flex items-center justify-center gap-2"
                >
                  {progresso.facil.completo ? (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      Revisar
                    </>
                  ) : (
                    <>
                      <Star className="w-5 h-5" />
                      {progresso.facil.corretas > 0 ? 'Continuar' : 'Começar'}
                    </>
                  )}
                </Link>
              </div>
            </div>

            {/* Nível Médio */}
            <div className={`bg-white rounded-2xl border-2 overflow-hidden transition-all ${
              nivelDesbloqueado('medio') ? 'border-yellow-200' : 'border-gray-200 opacity-60'
            }`}>
              <div className="p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                      <span className="text-2xl">🟡</span>
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">Nível Médio</h3>
                      <p className="text-sm text-gray-500">Questões intermediárias</p>
                    </div>
                  </div>
                  <div className="text-right">
                    {nivelDesbloqueado('medio') ? (
                      <>
                        <p className="text-2xl font-black text-yellow-600">
                          {progresso.medio.corretas}/{progresso.medio.total}
                        </p>
                        <p className="text-xs text-gray-400">acertos</p>
                      </>
                    ) : (
                      <Lock className="w-6 h-6 text-gray-400" />
                    )}
                  </div>
                </div>
                
                {nivelDesbloqueado('medio') && (
                  <>
                    <div className="mt-4 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-yellow-500 transition-all"
                        style={{ width: `${(progresso.medio.corretas / progresso.medio.total) * 100}%` }}
                      />
                    </div>

                    <Link
                      href={`/plataforma/enem/modulo/${moduloId}/aula/${aulaId}/exercicios?nivel=medio`}
                      className="mt-4 w-full bg-yellow-500 text-white font-bold py-3 rounded-xl hover:bg-yellow-600 transition-all flex items-center justify-center gap-2"
                    >
                      {progresso.medio.completo ? (
                        <>
                          <CheckCircle className="w-5 h-5" />
                          Revisar
                        </>
                      ) : (
                        <>
                          <Star className="w-5 h-5" />
                          {progresso.medio.corretas > 0 ? 'Continuar' : 'Começar'}
                        </>
                      )}
                    </Link>
                  </>
                )}

                {!nivelDesbloqueado('medio') && (
                  <p className="mt-4 text-center text-sm text-gray-400">
                    🔒 Complete o nível Fácil para desbloquear
                  </p>
                )}
              </div>
            </div>

            {/* Nível Difícil */}
            <div className={`bg-white rounded-2xl border-2 overflow-hidden transition-all ${
              nivelDesbloqueado('dificil') ? 'border-red-200' : 'border-gray-200 opacity-60'
            }`}>
              <div className="p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                      <span className="text-2xl">🔴</span>
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">Nível Difícil</h3>
                      <p className="text-sm text-gray-500">Questões avançadas estilo ENEM</p>
                    </div>
                  </div>
                  <div className="text-right">
                    {nivelDesbloqueado('dificil') ? (
                      <>
                        <p className="text-2xl font-black text-red-600">
                          {progresso.dificil.corretas}/{progresso.dificil.total}
                        </p>
                        <p className="text-xs text-gray-400">acertos</p>
                      </>
                    ) : (
                      <Lock className="w-6 h-6 text-gray-400" />
                    )}
                  </div>
                </div>
                
                {nivelDesbloqueado('dificil') && (
                  <>
                    <div className="mt-4 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-red-500 transition-all"
                        style={{ width: `${(progresso.dificil.corretas / progresso.dificil.total) * 100}%` }}
                      />
                    </div>

                    <Link
                      href={`/plataforma/enem/modulo/${moduloId}/aula/${aulaId}/exercicios?nivel=dificil`}
                      className="mt-4 w-full bg-red-500 text-white font-bold py-3 rounded-xl hover:bg-red-600 transition-all flex items-center justify-center gap-2"
                    >
                      {progresso.dificil.completo ? (
                        <>
                          <Trophy className="w-5 h-5" />
                          Revisar
                        </>
                      ) : (
                        <>
                          <Star className="w-5 h-5" />
                          {progresso.dificil.corretas > 0 ? 'Continuar' : 'Começar'}
                        </>
                      )}
                    </Link>
                  </>
                )}

                {!nivelDesbloqueado('dificil') && (
                  <p className="mt-4 text-center text-sm text-gray-400">
                    🔒 Complete o nível Médio para desbloquear
                  </p>
                )}
              </div>
            </div>

            {/* Resumo Final */}
            {progresso.facil.completo && progresso.medio.completo && progresso.dificil.completo && (
              <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl p-6 text-white text-center">
                <Trophy className="w-16 h-16 mx-auto mb-4" />
                <h3 className="text-2xl font-black mb-2">Aula Completa! 🎉</h3>
                <p className="text-white/80">Você completou todos os níveis desta aula.</p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
