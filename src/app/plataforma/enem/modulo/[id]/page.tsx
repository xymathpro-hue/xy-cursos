'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { ArrowLeft, BookOpen, FileText, CheckCircle, Lock, Clock, Play, ChevronRight } from 'lucide-react';

interface Aula {
  id: string;
  numero: number;
  titulo: string;
  descricao: string;
  duracao_minutos: number;
  ordem: number;
}

interface Modulo {
  id: string;
  numero: number;
  titulo: string;
  descricao: string;
}

interface ProgressoAula {
  aula_id: string;
  concluida: boolean;
}

export default function ModuloPage() {
  const params = useParams();
  const router = useRouter();
  const moduloId = params.id as string;
  const supabase = createClientComponentClient();

  const [modulo, setModulo] = useState<Modulo | null>(null);
  const [aulas, setAulas] = useState<Aula[]>([]);
  const [progressoAulas, setProgressoAulas] = useState<ProgressoAula[]>([]);
  const [totalQuestoes, setTotalQuestoes] = useState(0);
  const [loading, setLoading] = useState(true);
  const [tabAtiva, setTabAtiva] = useState<'aulas' | 'exercicios'>('aulas');
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      // Verificar usuário
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }
      setUserId(user.id);

      // Buscar módulo
      const { data: moduloData } = await supabase
        .from('modulos')
        .select('*')
        .eq('id', moduloId)
        .single();

      if (moduloData) {
        setModulo(moduloData);
      }

      // Buscar aulas do módulo
      const { data: aulasData } = await supabase
        .from('aulas')
        .select('*')
        .eq('modulo_id', moduloId)
        .eq('ativo', true)
        .order('ordem', { ascending: true });

      if (aulasData) {
        setAulas(aulasData);
      }

      // Buscar progresso das aulas
      const { data: progressoData } = await supabase
        .from('progresso_aulas')
        .select('aula_id, concluida')
        .eq('user_id', user.id);

      if (progressoData) {
        setProgressoAulas(progressoData);
      }

      // Buscar total de questões
      const { data: faseData } = await supabase
        .from('fases')
        .select('id')
        .eq('modulo_id', moduloId)
        .single();

      if (faseData) {
        const { count } = await supabase
          .from('questoes')
          .select('*', { count: 'exact', head: true })
          .eq('fase_id', faseData.id)
          .eq('ativo', true);

        setTotalQuestoes(count || 0);
      }

      setLoading(false);
    }

    if (moduloId) {
      fetchData();
    }
  }, [moduloId, supabase, router]);

  const isAulaConcluida = (aulaId: string) => {
    return progressoAulas.some(p => p.aula_id === aulaId && p.concluida);
  };

  const aulasCompletadas = aulas.filter(a => isAulaConcluida(a.id)).length;
  const progressoTotal = aulas.length > 0 ? Math.round((aulasCompletadas / aulas.length) * 100) : 0;
  const tempoTotal = aulas.reduce((acc, a) => acc + (a.duracao_minutos || 0), 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!modulo) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center">
        <p className="text-slate-400 mb-4">Módulo não encontrado.</p>
        <Link href="/plataforma/enem" className="text-blue-400 hover:underline">
          Voltar aos módulos
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <header className="bg-slate-900/80 backdrop-blur-xl border-b border-slate-800/50 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/plataforma/enem" className="flex items-center gap-2 text-slate-400 hover:text-white">
              <ArrowLeft className="w-5 h-5" />
              <span className="hidden sm:inline">Voltar</span>
            </Link>
            <div className="text-center">
              <p className="text-slate-500 text-sm">Módulo {modulo.numero}</p>
              <p className="font-bold text-white">{modulo.titulo}</p>
            </div>
            <div className="w-20"></div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* Card de Progresso */}
        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-white">{modulo.titulo}</h1>
              <p className="text-blue-100 text-sm mt-1">{modulo.descricao}</p>
            </div>
            <div className="text-right">
              <p className="text-4xl font-black text-white">{progressoTotal}%</p>
              <p className="text-blue-100 text-sm">concluído</p>
            </div>
          </div>
          
          <div className="h-3 bg-white/20 rounded-full overflow-hidden mb-4">
            <div 
              className="h-full bg-white rounded-full transition-all duration-500"
              style={{ width: `${progressoTotal}%` }}
            ></div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white/10 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-white">{aulas.length}</p>
              <p className="text-blue-100 text-xs">Aulas</p>
            </div>
            <div className="bg-white/10 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-white">{totalQuestoes}</p>
              <p className="text-blue-100 text-xs">Questões</p>
            </div>
            <div className="bg-white/10 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-white">{tempoTotal}min</p>
              <p className="text-blue-100 text-xs">Duração</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex rounded-xl bg-slate-800/50 p-1 mb-6">
          <button
            onClick={() => setTabAtiva('aulas')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-medium transition-all ${
              tabAtiva === 'aulas'
                ? 'bg-blue-600 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <BookOpen className="w-5 h-5" />
            Aulas ({aulas.length})
          </button>
          <button
            onClick={() => setTabAtiva('exercicios')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-medium transition-all ${
              tabAtiva === 'exercicios'
                ? 'bg-blue-600 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <FileText className="w-5 h-5" />
            Exercícios ({totalQuestoes})
          </button>
        </div>

        {/* Conteúdo das Tabs */}
        {tabAtiva === 'aulas' && (
          <div className="space-y-3">
            {aulas.length === 0 ? (
              <div className="text-center py-12">
                <BookOpen className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400">Nenhuma aula cadastrada ainda.</p>
              </div>
            ) : (
              aulas.map((aula, index) => {
                const concluida = isAulaConcluida(aula.id);
                const bloqueada = index > 0 && !isAulaConcluida(aulas[index - 1].id);

                return (
                  <Link
                    key={aula.id}
                    href={bloqueada ? '#' : `/plataforma/enem/modulo/${moduloId}/aula/${aula.id}`}
                    className={`block rounded-2xl border transition-all ${
                      bloqueada
                        ? 'bg-slate-800/30 border-slate-700/30 opacity-50 cursor-not-allowed'
                        : concluida
                          ? 'bg-emerald-500/10 border-emerald-500/30 hover:bg-emerald-500/20'
                          : 'bg-slate-800/50 border-slate-700/50 hover:bg-slate-700/50'
                    }`}
                  >
                    <div className="p-4 flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        bloqueada
                          ? 'bg-slate-700/50 text-slate-500'
                          : concluida
                            ? 'bg-emerald-500 text-white'
                            : 'bg-blue-500/20 text-blue-400'
                      }`}>
                        {bloqueada ? (
                          <Lock className="w-5 h-5" />
                        ) : concluida ? (
                          <CheckCircle className="w-6 h-6" />
                        ) : (
                          <Play className="w-5 h-5" />
                        )}
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-slate-500 text-sm">Aula {aula.numero}</span>
                          {concluida && (
                            <span className="px-2 py-0.5 rounded-full text-xs bg-emerald-500/20 text-emerald-400">
                              ✓ Concluída
                            </span>
                          )}
                        </div>
                        <h3 className="font-semibold text-white">{aula.titulo}</h3>
                        <p className="text-slate-400 text-sm">{aula.descricao}</p>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <div className="flex items-center gap-1 text-slate-400 text-sm">
                            <Clock className="w-4 h-4" />
                            {aula.duracao_minutos}min
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-slate-500" />
                      </div>
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        )}

        {tabAtiva === 'exercicios' && (
          <div className="space-y-4">
            {/* Aviso se não completou aulas */}
            {progressoTotal < 100 && (
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
                <p className="text-amber-400 text-sm">
                  💡 Recomendamos completar as aulas antes de fazer os exercícios.
                </p>
              </div>
            )}

            {/* Card de Exercícios */}
            <Link
              href={`/plataforma/enem/modulo/${moduloId}/exercicios`}
              className="block rounded-2xl bg-slate-800/50 border border-slate-700/50 hover:bg-slate-700/50 transition-all"
            >
              <div className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                    <FileText className="w-7 h-7 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-white">Exercícios do Módulo</h3>
                    <p className="text-slate-400">{totalQuestoes} questões para praticar</p>
                  </div>
                  <ChevronRight className="w-6 h-6 text-slate-500" />
                </div>
              </div>
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
