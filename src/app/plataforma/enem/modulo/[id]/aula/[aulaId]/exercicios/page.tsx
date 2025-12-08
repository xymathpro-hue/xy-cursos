'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { 
  ArrowLeft, 
  ArrowRight, 
  CheckCircle, 
  XCircle, 
  Lightbulb,
  Trophy,
  RotateCcw,
  BookOpen
} from 'lucide-react';

interface Questao {
  id: string;
  numero: number;
  enunciado: string;
  alternativa_a: string;
  alternativa_b: string;
  alternativa_c: string;
  alternativa_d: string;
  alternativa_e: string;
  resposta_correta: string;
  explicacao: string;
  dificuldade: string;
}

interface Aula {
  id: string;
  numero: number;
  titulo: string;
}

interface Modulo {
  id: string;
  numero: number;
  titulo: string;
}

export default function ExerciciosAulaPage() {
  const params = useParams();
  const router = useRouter();
  const moduloId = params.id as string;
  const aulaId = params.aulaId as string;
  const supabase = createClientComponentClient();

  const [modulo, setModulo] = useState<Modulo | null>(null);
  const [aula, setAula] = useState<Aula | null>(null);
  const [questoes, setQuestoes] = useState<Questao[]>([]);
  const [questaoAtual, setQuestaoAtual] = useState(0);
  const [respostaSelecionada, setRespostaSelecionada] = useState<string | null>(null);
  const [respondida, setRespondida] = useState(false);
  const [mostrarResolucao, setMostrarResolucao] = useState(false);
  const [acertos, setAcertos] = useState(0);
  const [erros, setErros] = useState(0);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [finalizado, setFinalizado] = useState(false);

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

      // Buscar aula
      const { data: aulaData } = await supabase
        .from('aulas')
        .select('*')
        .eq('id', aulaId)
        .single();

      if (aulaData) setAula(aulaData);

      // Buscar questões da aula (primeiro tenta por aula_id, depois por fase)
      let questoesData = null;
      
      // Tenta buscar questões vinculadas à aula
      const { data: questoesAula } = await supabase
        .from('questoes')
        .select('*')
        .eq('aula_id', aulaId)
        .eq('ativo', true)
        .order('numero', { ascending: true });

      if (questoesAula && questoesAula.length > 0) {
        questoesData = questoesAula;
      } else {
        // Se não tem questões por aula, busca da fase do módulo (temporário)
        const { data: faseData } = await supabase
          .from('fases')
          .select('id')
          .eq('modulo_id', moduloId)
          .single();

        if (faseData) {
          const { data: questoesFase } = await supabase
            .from('questoes')
            .select('*')
            .eq('fase_id', faseData.id)
            .eq('ativo', true)
            .order('numero', { ascending: true })
            .limit(10); // Limita a 10 questões por aula temporariamente

          questoesData = questoesFase;
        }
      }

      if (questoesData) setQuestoes(questoesData);
      setLoading(false);
    }

    if (moduloId && aulaId) fetchData();
  }, [moduloId, aulaId, supabase, router]);

  const questao = questoes[questaoAtual];

  const handleSelecionarResposta = (letra: string) => {
    if (respondida) return;
    setRespostaSelecionada(letra);
  };

  const handleConfirmarResposta = async () => {
    if (!respostaSelecionada || respondida || !userId) return;
    
    setRespondida(true);
    
    if (respostaSelecionada === questao.resposta_correta) {
      setAcertos(prev => prev + 1);
    } else {
      setErros(prev => prev + 1);
      // Registrar erro
      try {
        await supabase.rpc('registrar_erro', {
          p_user_id: userId,
          p_questao_id: questao.id,
          p_resposta_usuario: respostaSelecionada
        });
      } catch (e) {
        console.error('Erro ao registrar:', e);
      }
    }

    // Salvar resposta
    try {
      await supabase.from('respostas_usuario').upsert({
        user_id: userId,
        questao_id: questao.id,
        resposta: respostaSelecionada,
        correta: respostaSelecionada === questao.resposta_correta
      }, { onConflict: 'user_id,questao_id' });
    } catch (e) {
      console.error('Erro ao salvar resposta:', e);
    }
  };

  const handleProximaQuestao = () => {
    if (questaoAtual < questoes.length - 1) {
      setQuestaoAtual(prev => prev + 1);
      setRespostaSelecionada(null);
      setRespondida(false);
      setMostrarResolucao(false);
    } else {
      setFinalizado(true);
    }
  };

  const handleQuestaoAnterior = () => {
    if (questaoAtual > 0) {
      setQuestaoAtual(prev => prev - 1);
      setRespostaSelecionada(null);
      setRespondida(false);
      setMostrarResolucao(false);
    }
  };

  const handleReiniciar = () => {
    setQuestaoAtual(0);
    setRespostaSelecionada(null);
    setRespondida(false);
    setMostrarResolucao(false);
    setAcertos(0);
    setErros(0);
    setFinalizado(false);
  };

  const getCorDificuldade = (dif: string) => {
    switch (dif) {
      case 'facil': return 'bg-emerald-500/20 text-emerald-400';
      case 'dificil': return 'bg-red-500/20 text-red-400';
      default: return 'bg-amber-500/20 text-amber-400';
    }
  };

  const getNomeDificuldade = (dif: string) => {
    switch (dif) {
      case 'facil': return 'Fácil';
      case 'dificil': return 'Difícil';
      default: return 'Médio';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!aula || !modulo) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center">
        <p className="text-slate-400 mb-4">Aula não encontrada.</p>
        <Link href={`/plataforma/enem/modulo/${moduloId}`} className="text-blue-400 hover:underline">Voltar</Link>
      </div>
    );
  }

  if (questoes.length === 0) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <BookOpen className="w-16 h-16 text-slate-600 mb-4" />
        <p className="text-slate-400 text-center mb-2">Nenhum exercício cadastrado para esta aula.</p>
        <p className="text-slate-500 text-sm text-center mb-6">Em breve adicionaremos questões específicas!</p>
        <Link href={`/plataforma/enem/modulo/${moduloId}`} className="text-blue-400 hover:underline">Voltar ao módulo</Link>
      </div>
    );
  }

  // Tela de resultado final
  if (finalizado) {
    const percentual = Math.round((acertos / (acertos + erros)) * 100) || 0;
    const medalha = percentual >= 80 ? '🏆' : percentual >= 60 ? '🥈' : percentual >= 40 ? '🥉' : '💪';

    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-8 text-center">
            <div className="text-7xl mb-4">{medalha}</div>
            <h2 className="text-2xl font-black text-white mb-2">Exercícios Concluídos!</h2>
            <p className="text-blue-100 mb-6">Aula {aula.numero}: {aula.titulo}</p>
            
            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="bg-white/10 rounded-xl p-4">
                <p className="text-3xl font-bold text-white">{acertos}</p>
                <p className="text-blue-100 text-sm">Acertos</p>
              </div>
              <div className="bg-white/10 rounded-xl p-4">
                <p className="text-3xl font-bold text-white">{erros}</p>
                <p className="text-blue-100 text-sm">Erros</p>
              </div>
              <div className="bg-white/10 rounded-xl p-4">
                <p className="text-3xl font-bold text-white">{percentual}%</p>
                <p className="text-blue-100 text-sm">Taxa</p>
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={handleReiniciar}
                className="w-full py-3 rounded-xl bg-white/20 text-white font-medium hover:bg-white/30 flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-5 h-5" />
                Refazer Exercícios
              </button>
              <Link
                href={`/plataforma/enem/modulo/${moduloId}`}
                className="w-full py-3 rounded-xl bg-white text-blue-600 font-bold hover:bg-blue-50 flex items-center justify-center gap-2"
              >
                <Trophy className="w-5 h-5" />
                Voltar ao Módulo
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const progresso = ((questaoAtual + 1) / questoes.length) * 100;
  const alternativas = [
    { letra: 'A', texto: questao.alternativa_a },
    { letra: 'B', texto: questao.alternativa_b },
    { letra: 'C', texto: questao.alternativa_c },
    { letra: 'D', texto: questao.alternativa_d },
    { letra: 'E', texto: questao.alternativa_e },
  ].filter(a => a.texto);

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <header className="bg-slate-900/80 backdrop-blur-xl border-b border-slate-800/50 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <Link href={`/plataforma/enem/modulo/${moduloId}`} className="flex items-center gap-2 text-slate-400 hover:text-white">
              <ArrowLeft className="w-5 h-5" />
              <span className="hidden sm:inline">Voltar</span>
            </Link>
            
            <div className="text-center">
              <p className="text-sm text-slate-500">Aula {aula.numero}: {aula.titulo}</p>
              <p className="font-semibold text-white">Exercícios</p>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 text-emerald-400">
                <CheckCircle className="w-4 h-4" />
                <span className="font-medium">{acertos}</span>
              </div>
              <div className="flex items-center gap-1 text-red-400">
                <XCircle className="w-4 h-4" />
                <span className="font-medium">{erros}</span>
              </div>
            </div>
          </div>

          {/* Barra de progresso */}
          <div className="mt-3">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
              <span>Questão {questaoAtual + 1} de {questoes.length}</span>
              <span>{Math.round(progresso)}%</span>
            </div>
            <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-300"
                style={{ width: `${progresso}%` }}
              ></div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* Card da questão */}
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl overflow-hidden">
          {/* Tags */}
          <div className="px-6 py-4 bg-slate-800/50 border-b border-slate-700/50 flex items-center justify-between">
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getCorDificuldade(questao.dificuldade)}`}>
              {getNomeDificuldade(questao.dificuldade)}
            </span>
            <span className="text-sm text-slate-500">Questão {questao.numero}</span>
          </div>

          {/* Enunciado */}
          <div className="p-6">
            <p className="text-slate-200 text-lg leading-relaxed whitespace-pre-line">
              {questao.enunciado}
            </p>
          </div>

          {/* Alternativas */}
          <div className="px-6 pb-6 space-y-3">
            {alternativas.map(({ letra, texto }) => {
              const isSelected = respostaSelecionada === letra;
              const isCorreta = questao.resposta_correta === letra;
              const isErrada = respondida && isSelected && !isCorreta;

              let classes = 'border-slate-700/50 bg-slate-800/30 hover:bg-slate-700/50';
              if (respondida) {
                if (isCorreta) classes = 'border-emerald-500 bg-emerald-500/20';
                else if (isErrada) classes = 'border-red-500 bg-red-500/20';
              } else if (isSelected) {
                classes = 'border-blue-500 bg-blue-500/20';
              }

              return (
                <button
                  key={letra}
                  onClick={() => handleSelecionarResposta(letra)}
                  disabled={respondida}
                  className={`w-full p-4 rounded-xl border-2 text-left transition-all ${classes}`}
                >
                  <div className="flex items-start gap-3">
                    <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold shrink-0 ${
                      respondida && isCorreta 
                        ? 'bg-emerald-500 text-white' 
                        : respondida && isErrada 
                          ? 'bg-red-500 text-white'
                          : isSelected 
                            ? 'bg-blue-500 text-white' 
                            : 'bg-slate-700/50 text-slate-400'
                    }`}>
                      {respondida && isCorreta ? <CheckCircle className="w-5 h-5" /> : 
                       respondida && isErrada ? <XCircle className="w-5 h-5" /> : letra}
                    </span>
                    <span className="text-slate-300 pt-0.5">{texto}</span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Botão confirmar */}
          {!respondida && (
            <div className="px-6 pb-6">
              <button
                onClick={handleConfirmarResposta}
                disabled={!respostaSelecionada}
                className={`w-full py-4 rounded-xl font-bold text-white transition-all ${
                  respostaSelecionada 
                    ? 'bg-gradient-to-r from-blue-500 to-indigo-600 hover:opacity-90' 
                    : 'bg-slate-700/50 text-slate-500 cursor-not-allowed'
                }`}
              >
                Confirmar Resposta
              </button>
            </div>
          )}

          {/* Feedback */}
          {respondida && (
            <div className={`px-6 py-4 ${respostaSelecionada === questao.resposta_correta ? 'bg-emerald-500/10' : 'bg-red-500/10'}`}>
              <div className="flex items-center gap-3">
                {respostaSelecionada === questao.resposta_correta ? (
                  <>
                    <CheckCircle className="w-8 h-8 text-emerald-400" />
                    <div>
                      <p className="font-bold text-emerald-400">Parabéns! Você acertou! 🎉</p>
                    </div>
                  </>
                ) : (
                  <>
                    <XCircle className="w-8 h-8 text-red-400" />
                    <div>
                      <p className="font-bold text-red-400">Resposta incorreta</p>
                      <p className="text-red-300 text-sm">A correta é: {questao.resposta_correta}</p>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Resolução */}
          {respondida && questao.explicacao && (
            <div className="px-6 py-4 border-t border-slate-700/50">
              <button
                onClick={() => setMostrarResolucao(!mostrarResolucao)}
                className="flex items-center gap-2 text-blue-400 hover:text-blue-300 font-medium"
              >
                <Lightbulb className="w-5 h-5" />
                {mostrarResolucao ? 'Ocultar resolução' : 'Ver resolução'}
              </button>
              
              {mostrarResolucao && (
                <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                  <div className="text-slate-300 whitespace-pre-line">
                    {questao.explicacao}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Navegação */}
        <div className="flex items-center justify-between mt-6">
          <button
            onClick={handleQuestaoAnterior}
            disabled={questaoAtual === 0}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl ${
              questaoAtual === 0 
                ? 'text-slate-600 cursor-not-allowed' 
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <ArrowLeft className="w-5 h-5" />
            Anterior
          </button>

          {respondida && (
            <button
              onClick={handleProximaQuestao}
              className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold bg-blue-600 text-white hover:bg-blue-700"
            >
              {questaoAtual < questoes.length - 1 ? 'Próxima' : 'Finalizar'}
              <ArrowRight className="w-5 h-5" />
            </button>
          )}
        </div>
      </main>
    </div>
  );
}
