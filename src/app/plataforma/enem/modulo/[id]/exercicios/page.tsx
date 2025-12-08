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
  Eye,
  EyeOff,
  Trophy,
  RotateCcw,
  Home,
  ChevronDown,
  ChevronUp
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
  modulo_id: string;
}

interface Resposta {
  questaoId: string;
  letra: string;
}

export default function ExerciciosPage() {
  const params = useParams();
  const router = useRouter();
  const moduloId = params.id as string;
  const aulaId = params.aulaId as string;
  const supabase = createClientComponentClient();

  const [aula, setAula] = useState<Aula | null>(null);
  const [questoes, setQuestoes] = useState<Questao[]>([]);
  const [questaoAtual, setQuestaoAtual] = useState(0);
  const [respostas, setRespostas] = useState<Resposta[]>([]);
  const [finalizado, setFinalizado] = useState(false);
  const [mostrarRevisao, setMostrarRevisao] = useState(false);
  const [questaoRevisao, setQuestaoRevisao] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [salvandoErros, setSalvandoErros] = useState(false);

  useEffect(() => {
    async function fetchData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }
      setUserId(user.id);

      // Buscar aula
      const { data: aulaData } = await supabase
        .from('aulas')
        .select('*')
        .eq('id', aulaId)
        .single();

      if (aulaData) {
        setAula(aulaData);
      }

      // Buscar questões da aula
      const { data: questoesData } = await supabase
        .from('questoes')
        .select('*')
        .eq('aula_id', aulaId)
        .eq('ativo', true)
        .order('numero', { ascending: true });

      if (questoesData && questoesData.length > 0) {
        setQuestoes(questoesData);
      } else {
        // Fallback: buscar questões pela fase do módulo
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
            .order('numero', { ascending: true });

          if (questoesFase) {
            setQuestoes(questoesFase);
          }
        }
      }

      setLoading(false);
    }

    if (moduloId && aulaId) {
      fetchData();
    }
  }, [moduloId, aulaId, supabase, router]);

  const questao = questoes[questaoAtual];

  const getRespostaAtual = () => {
    const resp = respostas.find(r => r.questaoId === questao?.id);
    return resp?.letra || null;
  };

  const handleSelecionarResposta = (letra: string) => {
    if (finalizado) return;
    
    setRespostas(prev => {
      const outras = prev.filter(r => r.questaoId !== questao.id);
      return [...outras, { questaoId: questao.id, letra }];
    });
  };

  const handleProximaQuestao = () => {
    if (questaoAtual < questoes.length - 1) {
      setQuestaoAtual(prev => prev + 1);
    }
  };

  const handleQuestaoAnterior = () => {
    if (questaoAtual > 0) {
      setQuestaoAtual(prev => prev - 1);
    }
  };

  const handleIrParaQuestao = (index: number) => {
    setQuestaoAtual(index);
  };

  const handleFinalizar = async () => {
    if (!userId) return;
    setSalvandoErros(true);

    // Calcular erros e salvar no caderno
    const erros: { questaoId: string; resposta: string }[] = [];
    
    questoes.forEach(q => {
      const resposta = respostas.find(r => r.questaoId === q.id);
      if (resposta && resposta.letra !== q.resposta_correta) {
        erros.push({ questaoId: q.id, resposta: resposta.letra });
      }
    });

    // Salvar erros no caderno
    for (const erro of erros) {
      await supabase
        .from('caderno_erros')
        .upsert({
          user_id: userId,
          questao_id: erro.questaoId,
          resposta_usuario: erro.resposta,
          revisado: false,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,questao_id'
        });
    }

    // Registrar respostas
    for (const resposta of respostas) {
      const q = questoes.find(quest => quest.id === resposta.questaoId);
      if (q) {
        await supabase
          .from('respostas_usuario')
          .upsert({
            user_id: userId,
            questao_id: resposta.questaoId,
            resposta: resposta.letra,
            correta: resposta.letra === q.resposta_correta,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'user_id,questao_id'
          });
      }
    }

    setSalvandoErros(false);
    setFinalizado(true);
  };

  const handleReiniciar = () => {
    setQuestaoAtual(0);
    setRespostas([]);
    setFinalizado(false);
    setMostrarRevisao(false);
    setQuestaoRevisao(null);
  };

  const calcularResultado = () => {
    let acertos = 0;
    let erros = 0;
    
    questoes.forEach(q => {
      const resposta = respostas.find(r => r.questaoId === q.id);
      if (resposta) {
        if (resposta.letra === q.resposta_correta) {
          acertos++;
        } else {
          erros++;
        }
      }
    });

    return { acertos, erros, total: questoes.length };
  };

  const getDificuldadeCor = (dif: string) => {
    switch (dif) {
      case 'facil': return 'bg-emerald-100 text-emerald-700';
      case 'dificil': return 'bg-red-100 text-red-700';
      default: return 'bg-amber-100 text-amber-700';
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (questoes.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <p className="text-gray-500 mb-4">Nenhuma questão encontrada para esta aula.</p>
        <Link href={`/plataforma/enem/modulo/${moduloId}/aula/${aulaId}`} className="text-blue-500 hover:underline">
          Voltar à aula
        </Link>
      </div>
    );
  }

  // ==================== TELA DE RESULTADO ====================
  if (finalizado) {
    const { acertos, erros, total } = calcularResultado();
    const percentual = Math.round((acertos / total) * 100);
    const medalha = percentual >= 80 ? '🏆' : percentual >= 60 ? '🥈' : percentual >= 40 ? '🥉' : '💪';

    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <Link href="/dashboard" className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
                <Home className="w-5 h-5" />
              </Link>
              <h1 className="font-bold text-gray-900">Resultado</h1>
              <div className="w-10"></div>
            </div>
          </div>
        </header>

        <main className="max-w-4xl mx-auto px-4 py-8">
          {/* Card de Resultado */}
          <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center mb-6">
            <div className="text-7xl mb-4">{medalha}</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Exercícios Concluídos!</h2>
            <p className="text-gray-500 mb-6">Aula {aula?.numero}: {aula?.titulo}</p>
            
            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="bg-emerald-50 rounded-xl p-4">
                <p className="text-3xl font-bold text-emerald-600">{acertos}</p>
                <p className="text-emerald-700 text-sm">Acertos</p>
              </div>
              <div className="bg-red-50 rounded-xl p-4">
                <p className="text-3xl font-bold text-red-600">{erros}</p>
                <p className="text-red-700 text-sm">Erros</p>
              </div>
              <div className="bg-blue-50 rounded-xl p-4">
                <p className="text-3xl font-bold text-blue-600">{percentual}%</p>
                <p className="text-blue-700 text-sm">Taxa</p>
              </div>
            </div>

            {erros > 0 && (
              <p className="text-amber-600 text-sm mb-6">
                ⚠️ {erros} {erros === 1 ? 'questão foi adicionada' : 'questões foram adicionadas'} ao seu Caderno de Erros
              </p>
            )}

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => setMostrarRevisao(!mostrarRevisao)}
                className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl border-2 border-blue-200 text-blue-600 font-medium hover:bg-blue-50"
              >
                {mostrarRevisao ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                {mostrarRevisao ? 'Ocultar Revisão' : 'Revisar Questões'}
              </button>
              <button
                onClick={handleReiniciar}
                className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gray-100 text-gray-700 font-medium hover:bg-gray-200"
              >
                <RotateCcw className="w-5 h-5" />
                Refazer
              </button>
              <Link
                href={`/plataforma/enem/modulo/${moduloId}`}
                className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-blue-500 text-white font-bold hover:bg-blue-600"
              >
                <Trophy className="w-5 h-5" />
                Voltar ao Módulo
              </Link>
            </div>
          </div>

          {/* Revisão das Questões */}
          {mostrarRevisao && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-gray-900">Revisão das Questões</h3>
              
              {questoes.map((q, index) => {
                const resposta = respostas.find(r => r.questaoId === q.id);
                const acertou = resposta?.letra === q.resposta_correta;
                const expandida = questaoRevisao === index;

                return (
                  <div 
                    key={q.id} 
                    className={`bg-white rounded-xl border-2 overflow-hidden ${
                      acertou ? 'border-emerald-200' : 'border-red-200'
                    }`}
                  >
                    {/* Header da questão */}
                    <button
                      onClick={() => setQuestaoRevisao(expandida ? null : index)}
                      className="w-full p-4 flex items-center justify-between hover:bg-gray-50"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                          acertou ? 'bg-emerald-100' : 'bg-red-100'
                        }`}>
                          {acertou ? (
                            <CheckCircle className="w-5 h-5 text-emerald-600" />
                          ) : (
                            <XCircle className="w-5 h-5 text-red-600" />
                          )}
                        </div>
                        <div className="text-left">
                          <p className="font-medium text-gray-900">Questão {q.numero}</p>
                          <p className="text-sm text-gray-500">
                            Sua resposta: {resposta?.letra || 'Não respondida'} | Correta: {q.resposta_correta}
                          </p>
                        </div>
                      </div>
                      {expandida ? (
                        <ChevronUp className="w-5 h-5 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                      )}
                    </button>

                    {/* Conteúdo expandido */}
                    {expandida && (
                      <div className="p-4 border-t border-gray-100 bg-gray-50">
                        <p className="text-gray-700 mb-4">{q.enunciado}</p>
                        
                        <div className="space-y-2 mb-4">
                          {['A', 'B', 'C', 'D', 'E'].map(letra => {
                            const texto = q[`alternativa_${letra.toLowerCase()}` as keyof Questao] as string;
                            if (!texto) return null;
                            
                            const isCorreta = letra === q.resposta_correta;
                            const isErrada = letra === resposta?.letra && !isCorreta;
                            
                            return (
                              <div
                                key={letra}
                                className={`p-3 rounded-xl border ${
                                  isCorreta
                                    ? 'bg-emerald-50 border-emerald-300'
                                    : isErrada
                                      ? 'bg-red-50 border-red-300'
                                      : 'bg-white border-gray-200'
                                }`}
                              >
                                <span className={`font-bold mr-2 ${
                                  isCorreta ? 'text-emerald-700' : isErrada ? 'text-red-700' : 'text-gray-700'
                                }`}>
                                  {letra})
                                </span>
                                <span className={isCorreta ? 'text-emerald-700' : isErrada ? 'text-red-700' : 'text-gray-700'}>
                                  {texto}
                                </span>
                                {isCorreta && <span className="ml-2 text-emerald-600 font-medium">✓ Correta</span>}
                                {isErrada && <span className="ml-2 text-red-600 font-medium">✗ Sua resposta</span>}
                              </div>
                            );
                          })}
                        </div>

                        {q.explicacao && (
                          <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                            <p className="font-medium text-blue-800 mb-2">💡 Resolução:</p>
                            <p className="text-blue-700 whitespace-pre-line">{q.explicacao}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>
    );
  }

  // ==================== TELA DE EXERCÍCIOS ====================
  const respostaAtual = getRespostaAtual();
  const progresso = ((questaoAtual + 1) / questoes.length) * 100;
  const todasRespondidas = respostas.length === questoes.length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <Link 
              href={`/plataforma/enem/modulo/${moduloId}/aula/${aulaId}`} 
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="hidden sm:inline">Voltar</span>
            </Link>
            
            <div className="text-center">
              <p className="text-sm text-gray-500">Exercícios</p>
              <p className="font-semibold text-gray-900">Aula {aula?.numero}: {aula?.titulo}</p>
            </div>

            <div className="text-sm text-gray-500">
              {respostas.length}/{questoes.length}
            </div>
          </div>

          {/* Barra de progresso */}
          <div className="mt-3">
            <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
              <span>Questão {questaoAtual + 1} de {questoes.length}</span>
              <span>{Math.round(progresso)}%</span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-500 transition-all duration-300"
                style={{ width: `${progresso}%` }}
              ></div>
            </div>
          </div>

          {/* Navegação por questões */}
          <div className="mt-3 flex gap-1 overflow-x-auto pb-2">
            {questoes.map((q, index) => {
              const respondida = respostas.some(r => r.questaoId === q.id);
              const isAtual = index === questaoAtual;
              
              return (
                <button
                  key={q.id}
                  onClick={() => handleIrParaQuestao(index)}
                  className={`w-8 h-8 rounded-lg text-sm font-medium flex-shrink-0 transition-all ${
                    isAtual
                      ? 'bg-blue-500 text-white'
                      : respondida
                        ? 'bg-emerald-100 text-emerald-700 border border-emerald-300'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {index + 1}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* Card da questão */}
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
          {/* Tags */}
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getDificuldadeCor(questao.dificuldade)}`}>
              {getNomeDificuldade(questao.dificuldade)}
            </span>
            <span className="text-sm text-gray-500">Questão {questao.numero}</span>
          </div>

          {/* Enunciado */}
          <div className="p-6">
            <p className="text-gray-800 text-lg leading-relaxed whitespace-pre-line">
              {questao.enunciado}
            </p>
          </div>

          {/* Alternativas */}
          <div className="px-6 pb-6 space-y-3">
            {['A', 'B', 'C', 'D', 'E'].map(letra => {
              const texto = questao[`alternativa_${letra.toLowerCase()}` as keyof Questao] as string;
              if (!texto) return null;
              
              const isSelected = respostaAtual === letra;

              return (
                <button
                  key={letra}
                  onClick={() => handleSelecionarResposta(letra)}
                  className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold shrink-0 ${
                      isSelected 
                        ? 'bg-blue-500 text-white' 
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {letra}
                    </span>
                    <span className="text-gray-700 pt-0.5">{texto}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Navegação */}
        <div className="flex items-center justify-between mt-6">
          <button
            onClick={handleQuestaoAnterior}
            disabled={questaoAtual === 0}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl ${
              questaoAtual === 0 
                ? 'text-gray-300 cursor-not-allowed' 
                : 'text-gray-600 hover:text-gray-900 hover:bg-white'
            }`}
          >
            <ArrowLeft className="w-5 h-5" />
            Anterior
          </button>

          {questaoAtual < questoes.length - 1 ? (
            <button
              onClick={handleProximaQuestao}
              className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold bg-blue-500 text-white hover:bg-blue-600"
            >
              Próxima
              <ArrowRight className="w-5 h-5" />
            </button>
          ) : (
            <button
              onClick={handleFinalizar}
              disabled={salvandoErros}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold ${
                todasRespondidas
                  ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                  : 'bg-amber-500 text-white hover:bg-amber-600'
              }`}
            >
              {salvandoErros ? 'Salvando...' : todasRespondidas ? 'Finalizar' : `Finalizar (${respostas.length}/${questoes.length})`}
              <CheckCircle className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Aviso de questões não respondidas */}
        {questaoAtual === questoes.length - 1 && !todasRespondidas && (
          <p className="text-amber-600 text-sm text-center mt-4">
            ⚠️ Você tem {questoes.length - respostas.length} {questoes.length - respostas.length === 1 ? 'questão não respondida' : 'questões não respondidas'}
          </p>
        )}
      </main>
    </div>
  );
}
