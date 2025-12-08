'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { ArrowLeft, BookOpen, FileText, CheckCircle, Clock, Play, ChevronRight, Trophy, Lock, Target } from 'lucide-react';

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

interface SimuladoModulo {
  id: string;
  titulo: string;
  total_questoes: number;
  tempo_minutos: number;
  percentual_liberacao: number;
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
  const [questoesRespondidas, setQuestoesRespondidas] = useState(0);
  const [simulado, setSimulado] = useState<SimuladoModulo | null>(null);
  const [simuladoConcluido, setSimuladoConcluido] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
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

      if (moduloData) setModulo(moduloData);

      // Buscar aulas do módulo
      const { data: aulasData } = await supabase
        .from('aulas')
        .select('*')
        .eq('modulo_id', moduloId)
        .eq('ativo', true)
        .order('ordem', { ascending: true });

      if (aulasData) setAulas(aulasData);

      // Buscar progresso das aulas
      const { data: progressoData } = await supabase
        .from('progresso_aulas')
        .select('aula_id, concluida')
        .eq('user_id', user.id);

      if (progressoData) setProgressoAulas(progressoData);

      // Buscar total de questões do módulo
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

        // Buscar questões respondidas
        const { data: respostasData } = await supabase
          .from('respostas_usuario')
          .select('questao_id, questoes!inner(fase_id)')
          .eq('user_id', user.id)
          .eq('questoes.fase_id', faseData.id);

        setQuestoesRespondidas(respostasData?.length || 0);
      }

      // Buscar simulado do módulo
      const { data: simuladoData } = await supabase
        .from('simulados_modulo')
        .select('*')
        .eq('modulo_id', moduloId)
        .eq('ativo', true)
        .single();

      if (simuladoData) setSimulado(simuladoData);

      // Verificar se simulado foi concluído
      if (simuladoData) {
        const { data: resultadoData } = await supabase
          .from('resultado_simulado_modulo')
          .select('concluido')
          .eq('user_id', user.id)
          .eq('simulado_id', simuladoData.id)
          .single();

        setSimuladoConcluido(resultadoData?.concluido || false);
      }

      setLoading(false);
    }

    if (moduloId) fetchData();
  }, [moduloId, supabase, router]);

  const isAulaConcluida = (aulaId: string) => {
    return progressoAulas.some(p => p.aula_id === aulaId && p.concluida);
  };

  const aulasCompletadas = aulas.filter(a => isAulaConcluida(a.id)).length;
  const progressoAulasPercent = aulas.length > 0 ? Math.round((aulasCompletadas / aulas.length) * 100) : 0;
  const progressoExerciciosPercent = totalQuestoes > 0 ? Math.round((questoesRespondidas / totalQuestoes) * 100) : 0;
  const progressoTotal = Math.round((progressoAulasPercent + progressoExerciciosPercent) / 2);
  const simuladoLiberado = progressoTotal >= (simulado?.percentual_liberacao || 80);
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
        <Link href="/plataforma/enem" className="text-blue-400 hover:underline">Voltar</Link>
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

          {/* Barras de progresso separadas */}
          <div className="space-y-3 mb-4">
            <div>
              <div className="flex justify-between text-sm text-blue-100 mb-1">
                <span>📖 Aulas</span>
                <span>{aulasCompletadas}/{aulas.length} ({progressoAulasPercent}%)</span>
              </div>
              <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-400 rounded-full transition-all" style={{ width: `${progressoAulasPercent}%` }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm text-blue-100 mb-1">
                <span>✏️ Exercícios</span>
                <span>{questoesRespondidas}/{totalQuestoes} ({progressoExerciciosPercent}%)</span>
              </div>
              <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                <div className="h-full bg-amber-400 rounded-full transition-all" style={{ width: `${progressoExerciciosPercent}%` }}></div>
              </div>
            </div>
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

        {/* Lista de Aulas com Exercícios */}
        <div className="mb-6">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-blue-400" />
            Aulas do Módulo
          </h2>
          <div className="space-y-3">
            {aulas.map((aula) => {
              const concluida = isAulaConcluida(aula.id);
              return (
                <div key={aula.id} className={`rounded-2xl border transition-all ${
                  concluida
                    ? 'bg-emerald-500/10 border-emerald-500/30'
                    : 'bg-slate-800/50 border-slate-700/50'
                }`}>
                  {/* Card da Aula */}
                  <Link href={`/plataforma/enem/modulo/${moduloId}/aula/${aula.id}`} className="block p-4">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        concluida ? 'bg-emerald-500 text-white' : 'bg-blue-500/20 text-blue-400'
                      }`}>
                        {concluida ? <CheckCircle className="w-6 h-6" /> : <Play className="w-5 h-5" />}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-slate-500 text-sm">Aula {aula.numero}</span>
                          {concluida && <span className="px-2 py-0.5 rounded-full text-xs bg-emerald-500/20 text-emerald-400">✓ Concluída</span>}
                        </div>
                        <h3 className="font-semibold text-white">{aula.titulo}</h3>
                        <p className="text-slate-400 text-sm">{aula.descricao}</p>
                      </div>
                      <div className="flex items-center gap-2 text-slate-400">
                        <Clock className="w-4 h-4" />
                        <span className="text-sm">{aula.duracao_minutos}min</span>
                        <ChevronRight className="w-5 h-5" />
                      </div>
                    </div>
                  </Link>
                  
                  {/* Botão de Exercícios da Aula */}
                  <div className="px-4 pb-4">
                    <Link
                      href={`/plataforma/enem/modulo/${moduloId}/aula/${aula.id}/exercicios`}
                      className="flex items-center justify-between p-3 rounded-xl bg-slate-700/30 hover:bg-slate-700/50 transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-amber-400" />
                        <span className="text-slate-300 text-sm">Exercícios desta aula</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-500" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Simulado do Módulo */}
        {simulado && (
          <div className="mb-6">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-400" />
              Simulado Final
            </h2>
            <div className={`rounded-2xl border p-6 ${
              simuladoLiberado
                ? simuladoConcluido
                  ? 'bg-emerald-500/10 border-emerald-500/30'
                  : 'bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-amber-500/30'
                : 'bg-slate-800/30 border-slate-700/30 opacity-60'
            }`}>
              <div className="flex items-center gap-4">
                <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${
                  simuladoLiberado
                    ? simuladoConcluido
                      ? 'bg-emerald-500 text-white'
                      : 'bg-gradient-to-br from-amber-500 to-orange-500 text-white'
                    : 'bg-slate-700/50 text-slate-500'
                }`}>
                  {simuladoLiberado ? (
                    simuladoConcluido ? <CheckCircle className="w-7 h-7" /> : <Trophy className="w-7 h-7" />
                  ) : (
                    <Lock className="w-6 h-6" />
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-white">{simulado.titulo}</h3>
                  <p className="text-slate-400 text-sm">
                    {simulado.total_questoes} questões • {simulado.tempo_minutos} minutos
                  </p>
                  {!simuladoLiberado && (
                    <p className="text-amber-400 text-sm mt-1">
                      🔒 Libera com {simulado.percentual_liberacao}% do módulo (você tem {progressoTotal}%)
                    </p>
                  )}
                  {simuladoConcluido && (
                    <p className="text-emerald-400 text-sm mt-1">✓ Simulado concluído!</p>
                  )}
                </div>
                {simuladoLiberado && !simuladoConcluido && (
                  <Link
                    href={`/plataforma/enem/modulo/${moduloId}/simulado`}
                    className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold hover:opacity-90"
                  >
                    Iniciar
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Dica de progresso */}
        {!simuladoLiberado && simulado && (
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <Target className="w-5 h-5 text-blue-400 mt-0.5" />
              <div>
                <p className="text-blue-400 font-medium">Continue estudando!</p>
                <p className="text-slate-400 text-sm">
                  Complete mais {simulado.percentual_liberacao - progressoTotal}% para liberar o Simulado Final.
                </p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
