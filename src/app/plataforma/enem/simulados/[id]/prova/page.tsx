'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

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
  dificuldade: string;
  assunto: string;
}

interface Simulado {
  id: string;
  numero: number;
  titulo: string;
  tempo_minutos: number;
}

export default function ProvaSimuladoPage() {
  const router = useRouter();
  const params = useParams();
  const supabase = createClientComponentClient();
  const simuladoId = params.id as string;

  const [simulado, setSimulado] = useState<Simulado | null>(null);
  const [questoes, setQuestoes] = useState<Questao[]>([]);
  const [respostas, setRespostas] = useState<{ [key: string]: string }>({});
  const [questaoAtual, setQuestaoAtual] = useState(0);
  const [tempoRestante, setTempoRestante] = useState(0);
  const [loading, setLoading] = useState(true);
  const [finalizando, setFinalizando] = useState(false);
  const [showConfirmacao, setShowConfirmacao] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    loadProva();
  }, [simuladoId]);

  useEffect(() => {
    if (tempoRestante <= 0) return;

    const interval = setInterval(() => {
      setTempoRestante(prev => {
        if (prev <= 1) {
          finalizarSimulado();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [tempoRestante]);

  useEffect(() => {
    if (Object.keys(respostas).length > 0) {
      localStorage.setItem(`respostas_simulado_${simuladoId}`, JSON.stringify(respostas));
    }
  }, [respostas, simuladoId]);

  async function loadProva() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }
      setUserId(user.id);

      const dadosSimulado = localStorage.getItem('simulado_em_andamento');
      if (!dadosSimulado) {
        router.push(`/plataforma/enem/simulados/${simuladoId}`);
        return;
      }

      const { simuladoId: savedId, inicioTimestamp, tempoMinutos } = JSON.parse(dadosSimulado);
      
      if (savedId !== simuladoId) {
        router.push(`/plataforma/enem/simulados/${simuladoId}`);
        return;
      }

      const tempoDecorrido = Math.floor((Date.now() - inicioTimestamp) / 1000);
      const tempoTotal = tempoMinutos * 60;
      const tempoRest = Math.max(0, tempoTotal - tempoDecorrido);
      
      if (tempoRest <= 0) {
        router.push(`/plataforma/enem/simulados/${simuladoId}/resultado`);
        return;
      }
      
      setTempoRestante(tempoRest);

      const { data: simuladoData } = await supabase
        .from('simulados_gerais')
        .select('*')
        .eq('id', simuladoId)
        .single();

      if (simuladoData) {
        setSimulado(simuladoData);
      }

      const { data: questoesData } = await supabase
        .from('questoes')
        .select('*')
        .eq('simulado_geral_id', simuladoId)
        .eq('ativo', true)
        .order('numero');

      if (questoesData) {
        setQuestoes(questoesData);
      }

      const respostasSalvas = localStorage.getItem(`respostas_simulado_${simuladoId}`);
      if (respostasSalvas) {
        setRespostas(JSON.parse(respostasSalvas));
      }

    } catch (error) {
      console.error('Erro ao carregar prova:', error);
    } finally {
      setLoading(false);
    }
  }

  function formatarTempo(segundos: number): string {
    const horas = Math.floor(segundos / 3600);
    const minutos = Math.floor((segundos % 3600) / 60);
    const segs = segundos % 60;
    
    if (horas > 0) {
      return `${horas}:${minutos.toString().padStart(2, '0')}:${segs.toString().padStart(2, '0')}`;
    }
    return `${minutos}:${segs.toString().padStart(2, '0')}`;
  }

  function getCorTempo(): string {
    if (tempoRestante <= 300) return 'text-red-500 animate-pulse';
    if (tempoRestante <= 600) return 'text-orange-500';
    if (tempoRestante <= 1800) return 'text-yellow-500';
    return 'text-white';
  }

  function selecionarResposta(questaoId: string, alternativa: string) {
    setRespostas(prev => ({ ...prev, [questaoId]: alternativa }));
  }

  function irParaQuestao(index: number) {
    if (index >= 0 && index < questoes.length) {
      setQuestaoAtual(index);
    }
  }

  async function finalizarSimulado() {
    if (finalizando) return;
    setFinalizando(true);

    try {
      let acertos = 0;
      const erros: string[] = [];
      const detalhesQuestoes: any[] = [];

      questoes.forEach(questao => {
        const respostaUsuario = respostas[questao.id] || '';
        const acertou = respostaUsuario.toUpperCase() === questao.resposta_correta.toUpperCase();
        
        if (acertou) {
          acertos++;
        } else {
          erros.push(questao.id);
        }

        detalhesQuestoes.push({
          questao_id: questao.id,
          numero: questao.numero,
          resposta_usuario: respostaUsuario,
          resposta_correta: questao.resposta_correta,
          acertou,
          assunto: questao.assunto,
          dificuldade: questao.dificuldade
        });
      });

      // Cálculo TRI simplificado
      const percentual = acertos / questoes.length;
      const notaTRI = Math.round(400 + (percentual * 600));

      const { data: resultadoData } = await supabase
        .from('resultado_simulados_gerais')
        .insert({
          user_id: userId,
          simulado_geral_id: simuladoId,
          acertos,
          total_questoes: questoes.length,
          nota_tri: notaTRI,
          tempo_gasto: (simulado?.tempo_minutos || 180) * 60 - tempoRestante,
          respostas: respostas,
          detalhes: detalhesQuestoes
        })
        .select()
        .single();

      if (erros.length > 0 && userId) {
        const errosParaInserir = erros.map(questaoId => ({
          user_id: userId,
          questao_id: questaoId,
          origem: `Simulado ENEM ${simulado?.numero || ''}`,
          resposta_errada: respostas[questaoId] || '',
          data_erro: new Date().toISOString()
        }));

        await supabase
          .from('caderno_erros')
          .upsert(errosParaInserir, { onConflict: 'user_id,questao_id' });
      }

      localStorage.removeItem('simulado_em_andamento');
      localStorage.removeItem(`respostas_simulado_${simuladoId}`);

      localStorage.setItem(`resultado_simulado_${simuladoId}`, JSON.stringify({
        resultadoId: resultadoData?.id,
        acertos,
        total: questoes.length,
        notaTRI,
        erros: erros.length,
        detalhes: detalhesQuestoes
      }));

      router.push(`/plataforma/enem/simulados/${simuladoId}/resultado`);

    } catch (error) {
      console.error('Erro ao finalizar simulado:', error);
      setFinalizando(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-dark-400">Carregando prova...</p>
        </div>
      </div>
    );
  }

  const questaoAtualObj = questoes[questaoAtual];
  const questoesRespondidas = Object.keys(respostas).length;

  return (
    <div className="min-h-screen bg-dark-900 flex flex-col">
      <header className="bg-dark-800 border-b border-dark-700 px-4 py-3 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="font-bold text-white text-sm sm:text-base">{simulado?.titulo}</h1>
            <span className="text-dark-400 text-sm hidden sm:block">
              {questoesRespondidas}/{questoes.length} respondidas
            </span>
          </div>
          
          <div className="flex items-center gap-4">
            <div className={`font-mono text-xl font-bold ${getCorTempo()}`}>
              ⏱️ {formatarTempo(tempoRestante)}
            </div>
            <button
              onClick={() => setShowConfirmacao(true)}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              Finalizar
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 flex flex-col lg:flex-row">
        <main className="flex-1 p-4 lg:p-6 overflow-y-auto">
          <div className="max-w-3xl mx-auto">
            {questaoAtualObj && (
              <div className="bg-dark-800 rounded-xl border border-dark-700 p-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                    Questão {questaoAtual + 1} de {questoes.length}
                  </span>
                  <span className="text-dark-400 text-sm">{questaoAtualObj.assunto}</span>
                </div>

                <div className="prose prose-invert max-w-none mb-6">
                  <p className="text-white text-lg leading-relaxed whitespace-pre-wrap">
                    {questaoAtualObj.enunciado}
                  </p>
                </div>

                <div className="space-y-3">
                  {['A', 'B', 'C', 'D', 'E'].map((letra) => {
                    const alternativa = questaoAtualObj[`alternativa_${letra.toLowerCase()}` as keyof Questao] as string;
                    const selecionada = respostas[questaoAtualObj.id] === letra;
                    
                    return (
                      <button
                        key={letra}
                        onClick={() => selecionarResposta(questaoAtualObj.id, letra)}
                        className={`w-full p-4 rounded-lg border text-left transition-all ${
                          selecionada
                            ? 'bg-blue-500/20 border-blue-500 text-white'
                            : 'bg-dark-700 border-dark-600 text-dark-200 hover:border-dark-500'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold flex-shrink-0 ${
                            selecionada ? 'bg-blue-500 text-white' : 'bg-dark-600 text-dark-300'
                          }`}>
                            {letra}
                          </span>
                          <span className="flex-1 pt-1">{alternativa}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="flex items-center justify-between mt-6 pt-6 border-t border-dark-700">
                  <button
                    onClick={() => irParaQuestao(questaoAtual - 1)}
                    disabled={questaoAtual === 0}
                    className="px-4 py-2 bg-dark-700 hover:bg-dark-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    ← Anterior
                  </button>
                  
                  <span className="text-dark-400 text-sm">{questaoAtual + 1} / {questoes.length}</span>
                  
                  <button
                    onClick={() => irParaQuestao(questaoAtual + 1)}
                    disabled={questaoAtual === questoes.length - 1}
                    className="px-4 py-2 bg-dark-700 hover:bg-dark-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Próxima →
                  </button>
                </div>
              </div>
            )}
          </div>
        </main>

        <aside className="w-full lg:w-80 bg-dark-800 border-t lg:border-t-0 lg:border-l border-dark-700 p-4 lg:p-6">
          <h3 className="font-bold text-white mb-4 text-center lg:text-left">Navegação Rápida</h3>
          
          <div className="grid grid-cols-9 lg:grid-cols-5 gap-2">
            {questoes.map((questao, index) => {
              const respondida = respostas[questao.id];
              const atual = index === questaoAtual;
              
              return (
                <button
                  key={questao.id}
                  onClick={() => irParaQuestao(index)}
                  className={`w-8 h-8 rounded-lg text-sm font-medium transition-all ${
                    atual
                      ? 'bg-blue-500 text-white ring-2 ring-blue-400'
                      : respondida
                        ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                        : 'bg-dark-700 text-dark-400 hover:bg-dark-600'
                  }`}
                >
                  {index + 1}
                </button>
              );
            })}
          </div>

          <div className="mt-6 space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-blue-500"></div>
              <span className="text-dark-400">Questão atual</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-green-500/20 border border-green-500/30"></div>
              <span className="text-dark-400">Respondida</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-dark-700"></div>
              <span className="text-dark-400">Não respondida</span>
            </div>
          </div>

          <div className="mt-6 p-4 bg-dark-700 rounded-lg">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-dark-400">Respondidas:</span>
              <span className="text-green-400 font-bold">{questoesRespondidas}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-dark-400">Não respondidas:</span>
              <span className="text-red-400 font-bold">{questoes.length - questoesRespondidas}</span>
            </div>
          </div>

          <button
            onClick={() => setShowConfirmacao(true)}
            className="w-full mt-4 py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-lg font-bold transition-all lg:hidden"
          >
            Finalizar Simulado
          </button>
        </aside>
      </div>

      {showConfirmacao && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-dark-800 rounded-xl border border-dark-700 p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-white mb-4">⚠️ Finalizar Simulado?</h3>
            
            <p className="text-dark-300 mb-4">Você está prestes a finalizar o simulado.</p>

            {questoes.length - questoesRespondidas > 0 && (
              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 mb-4">
                <p className="text-yellow-400 text-sm">
                  ⚠️ Atenção: Você tem <strong>{questoes.length - questoesRespondidas} questões</strong> não respondidas!
                </p>
              </div>
            )}

            <p className="text-dark-400 text-sm mb-6">
              Após finalizar, você verá seu resultado com a correção TRI.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirmacao(false)}
                className="flex-1 py-3 bg-dark-700 hover:bg-dark-600 text-white rounded-lg font-medium transition-colors"
              >
                Continuar Prova
              </button>
              <button
                onClick={finalizarSimulado}
                disabled={finalizando}
                className="flex-1 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                {finalizando ? 'Finalizando...' : 'Finalizar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
