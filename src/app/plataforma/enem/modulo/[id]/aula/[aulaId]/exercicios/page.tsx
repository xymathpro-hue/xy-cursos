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
  ChevronUp,
  BookOpen,
  Zap,
  Target,
  Flame
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

interface ContagemNivel {
  facil: number;
  medio: number;
  dificil: number;
}

export default function ExerciciosPage() {
  const params = useParams();
  const router = useRouter();
  const moduloId = params.id as string;
  const aulaId = params.aulaId as string;
  const supabase = createClientComponentClient();

  const [aula, setAula] = useState<Aula | null>(null);
  const [todasQuestoes, setTodasQuestoes] = useState<Questao[]>([]);
  const [questoes, setQuestoes] = useState<Questao[]>([]);
  const [questaoAtual, setQuestaoAtual] = useState(0);
  const [respostas, setRespostas] = useState<Resposta[]>([]);
  const [finalizado, setFinalizado] = useState(false);
  const [mostrarRevisao, setMostrarRevisao] = useState(false);
  const [questaoRevisao, setQuestaoRevisao] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [salvandoErros, setSalvandoErros] = useState(false);
  const [nivelSelecionado, setNivelSelecionado] = useState<string | null>(null);
  const [contagem, setContagem] = useState<ContagemNivel>({ facil: 0, medio: 0, dificil: 0 });

  useEffect(() => {
    async function fetchData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }
      setUserId(user.id);

      const { data: aulaData } = await supabase
        .from('aulas')
        .select('*')
        .eq('id', aulaId)
        .single();

      if (aulaData) {
        setAula(aulaData);
      }

      const { data: questoesData } = await supabase
        .from('questoes')
        .select('*')
        .eq('aula_id', aulaId)
        .eq('ativo', true)
        .order('numero', { ascending: true });

      if (questoesData && questoesData.length > 0) {
        setTodasQuestoes(questoesData);
        
        // Contar questões por nível
        const contar = {
          facil: questoesData.filter(q => q.dificuldade === 'facil').length,
          medio: questoesData.filter(q => q.dificuldade === 'medio').length,
          dificil: questoesData.filter(q => q.dificuldade === 'dificil').length
        };
        setContagem(contar);
      }

      setLoading(false);
    }

    if (moduloId && aulaId) {
      fetchData();
    }
  }, [moduloId, aulaId, supabase, router]);

  const handleSelecionarNivel = (nivel: string) => {
    const questoesFiltradas = todasQuestoes
      .filter(q => q.dificuldade === nivel)
      .slice(0, 10);
    
    setQuestoes(questoesFiltradas);
    setNivelSelecionado(nivel);
  };

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

    for (const resp of respostas) {
      const q = questoes.find(quest => quest.id === resp.questaoId);
      if (q && resp.letra !== q.resposta_correta) {
        try {
          await supabase
            .from('caderno_erros')
            .upsert({
              user_id: userId,
              questao_id: resp.questaoId,
              resposta_usuario: resp.letra,
              revisado: false,
              updated_at: new Date().toISOString()
            }, {
              onConflict: 'user_id,questao_id'
            });
        } catch (e) {
          console.error('Erro ao salvar no caderno:', e);
        }
      }
    }

    for (const resp of respostas) {
      const q = questoes.find(quest => quest.id === resp.questaoId);
      if (q) {
        try {
          await supabase
            .from('respostas_usuario')
            .upsert({
              user_id: userId,
              questao_id: resp.questaoId,
              resposta_selecionada: resp.letra,
              correta: resp.letra === q.resposta_correta
            }, {
              onConflict: 'user_id,questao_id'
            });
        } catch (e) {
          console.error('Erro ao salvar resposta:', e);
        }
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

  const handleVoltarNiveis = () => {
    setNivelSelecionado(null);
    setQuestoes([]);
    setQuestaoAtual(0);
    setRespostas([]);
    setFinalizado(false);
    setMostrarRevisao(false);
  };

  const calcularResultado = () => {
    let acertos = 0;
    let errosCount = 0;
    
    questoes.forEach(q => {
      const resposta = respostas.find(r => r.questaoId === q.id);
      if (resposta) {
        if (resposta.letra === q.resposta_correta) {
          acertos++;
        } else {
          errosCount++;
        }
      }
    });

    return { acertos, erros: errosCount, total: questoes.length };
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

  const getNomeNivel = (nivel: string) => {
    switch (nivel) {
      case 'facil': return 'Nível 1 - Fácil';
      case 'medio': return 'Nível 2 - Médio';
      case 'dificil': return 'Nível 3 - Difícil';
      default: return nivel;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (todasQuestoes.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <BookOpen className="w-16 h-16 text-gray-300 mb-4" />
        <p className="text-gray-500 mb-4">Nenhuma questão encontrada para esta aula.</p>
        <Link href={`/plataforma/enem/modulo/${moduloId}/aula/${aulaId}`} className="text-blue-500 hover:underline">
          Voltar à aula
        </Link>
      </div>
    );
  }

  // ==================== TELA DE SELEÇÃO DE NÍVEL ====================
  if (!nivelSelecionado) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <Link href={`/plataforma/enem/modulo/${moduloId}/aula/${aulaId}`} className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div className="text-center">
                <p className="text-sm text-gray-500">Exercícios</p>
                <p className="font-semibold text-gray-900">Aula {aula?.numero}: {aula?.titulo}</p>
              </div>
              <div className="w-10"></div>
            </div>
          </div>
        </header>

        <main className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Escolha seu Nível</h2>
            <p className="text-gray-500">Cada nível tem até 10 questões</p>
          </div>

          <div className="grid gap-4">
            {/* Nível Fácil */}
            <button
              onClick={() => handleSelecionarNivel('facil')}
              disabled={contagem.facil === 0}
              className={`p-6 rounded-2xl border-2 text-left transition-all ${
                contagem.facil > 0 
                  ? 'border-emerald-200 bg-white hover:border-emerald-400 hover:shadow-lg' 
                  : 'border-gray-200 bg-gray-100 cursor-not-allowed opacity-50'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-emerald-100 flex items-center justify-center">
                  <Zap className="w-8 h-8 text-emerald-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900">Nível 1 - Fácil</h3>
                  <p className="text-gray-500">Questões introdutórias para fixar conceitos básicos</p>
                  <p className="text-emerald-600 font-medium mt-1">{Math.min(contagem.facil, 10)} questões disponíveis</p>
                </div>
                <div className="text-4xl">🟢</div>
              </div>
            </button>

            {/* Nível Médio */}
            <button
              onClick={() => handleSelecionarNivel('medio')}
              disabled={contagem.medio === 0}
              className={`p-6 rounded-2xl border-2 text-left transition-all ${
                contagem.medio > 0 
                  ? 'border-amber-200 bg-white hover:border-amber-400 hover:shadow-lg' 
                  : 'border-gray-200 bg-gray-100 cursor-not-allowed opacity-50'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-amber-100 flex items-center justify-center">
                  <Target className="w-8 h-8 text-amber-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900">Nível 2 - Médio</h3>
                  <p className="text-gray-500">Questões intermediárias no estilo ENEM</p>
                  <p className="text-amber-600 font-medium mt-1">{Math.min(contagem.medio, 10)} questões disponíveis</p>
                </div>
                <div className="text-4xl">🟡</div>
              </div>
            </button>

            {/* Nível Difícil */}
            <button
              onClick={() => handleSelecionarNivel('dificil')}
              disabled={contagem.dificil === 0}
              className={`p-6 rounded-2xl border-2 text-left transition-all ${
                contagem.dificil > 0 
                  ? 'border-red-200 bg-white hover:border-red-400 hover:shadow-lg' 
                  : 'border-gray-200 bg-gray-100 cursor-not-allowed opacity-50'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-red-100 flex items-center justify-center">
                  <Flame className="w-8 h-8 text-red-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900">Nível 3 - Difícil</h3>
                  <p className="text-gray-500">Desafios avançados para testar seu domínio</p>
                  <p className="text-red-600 font-medium mt-1">{Math.min(contagem.dificil, 10)} questões disponíveis</p>
                </div>
                <div className="text-4xl">🔴</div>
              </div>
            </button>
          </div>

          <div className="mt-8 text-center">
            <p className="text-gray-400 text-sm">
              Total: {todasQuestoes.length} questões nesta aula
            </p>
          </div>
        </main>
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
          <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center mb-6">
            <div className="text-7xl mb-4">{medalha}</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Exercícios Concluídos!</h2>
            <p className="text-gray-500 mb-1">Aula {aula?.numero}: {aula?.titulo}</p>
            <p className="text-sm text-gray-400 mb-6">{getNomeNivel(nivelSelecionado)}</p>
            
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
              <Link 
                href="/caderno-erros"
                className="inline-flex items-center gap-2 text-amber-600 hover:text-amber-700 mb-6"
              >
                <BookOpen className="w-5 h-5" />
                <span>📚 {erros} {erros === 1 ? 'questão adicionada' : 'questões adicionadas'} ao Caderno de Erros → Revisar agora</span>
              </Link>
            )}

            <div className="flex flex-col sm:flex-row gap-3 justify-center mt-6">
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
              <button
                onClick={handleVoltarNiveis}
                className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-blue-500 text-white font-bold hover:bg-blue-600"
              >
                <Trophy className="w-5 h-5" />
                Outro Nível
              </button>
            </div>
          </div>

          {mostrarRevisao && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-gray-900">Revisão das Questões</h3>
              
              {questoes.map((q, index) => {
                const resposta = respostas.find(r => r.questaoId === q.id);
                const acertou = resposta?.letra === q.resposta_correta;
                const expandida = questaoRevisao === index;

                return (
                  <div key={q.id} className={`bg-white rounded-xl border-2 overflow-hidden ${acertou ? 'border-emerald-200' : 'border-red-200'}`}>
                    <button
                      onClick={() => setQuestaoRevisao(expandida ? null : index)}
                      className="w-full p-4 flex items-center justify-between hover:bg-gray-50"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${acertou ? 'bg-emerald-100' : 'bg-red-100'}`}>
                          {acertou ? <CheckCircle className="w-5 h-5 text-emerald-600" /> : <XCircle className="w-5 h-5 text-red-600" />}
                        </div>
                        <div className="text-left">
                          <p className="font-medium text-gray-900">Questão {index + 1}</p>
                          <p className="text-sm text-gray-500">Sua: {resposta?.letra || '-'} | Correta: {q.resposta_correta}</p>
                        </div>
                      </div>
                      {expandida ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                    </button>

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
                              <div key={letra} className={`p-3 rounded-xl border ${isCorreta ? 'bg-emerald-50 border-emerald-300' : isErrada ? 'bg-red-50 border-red-300' : 'bg-white border-gray-200'}`}>
                                <span className={`font-bold mr-2 ${isCorreta ? 'text-emerald-700' : isErrada ? 'text-red-700' : 'text-gray-700'}`}>{letra})</span>
                                <span className={isCorreta ? 'text-emerald-700' : isErrada ? 'text-red-700' : 'text-gray-700'}>{texto}</span>
                                {isCorreta && <span className="ml-2 text-emerald-600 font-medium">✓</span>}
                                {isErrada && <span className="ml-2 text-red-600 font-medium">✗</span>}
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
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <button onClick={handleVoltarNiveis} className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="text-center">
              <p className="text-sm text-gray-500">{getNomeNivel(nivelSelecionado)}</p>
              <p className="font-semibold text-gray-900">Aula {aula?.numero}: {aula?.titulo}</p>
            </div>
            <div className="text-sm text-gray-500">{respostas.length}/{questoes.length}</div>
          </div>

          <div className="mt-3">
            <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
              <span>Questão {questaoAtual + 1} de {questoes.length}</span>
              <span>{Math.round(progresso)}%</span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 transition-all duration-300" style={{ width: `${progresso}%` }}></div>
            </div>
          </div>

          <div className="mt-3 flex gap-1 overflow-x-auto pb-2">
            {questoes.map((q, index) => {
              const respondida = respostas.some(r => r.questaoId === q.id);
              const isAtual = index === questaoAtual;
              return (
                <button
                  key={q.id}
                  onClick={() => handleIrParaQuestao(index)}
                  className={`w-8 h-8 rounded-lg text-sm font-medium flex-shrink-0 transition-all ${isAtual ? 'bg-blue-500 text-white' : respondida ? 'bg-emerald-100 text-emerald-700 border border-emerald-300' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                >
                  {index + 1}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getDificuldadeCor(questao.dificuldade)}`}>{getNomeDificuldade(questao.dificuldade)}</span>
            <span className="text-sm text-gray-500">Questão {questaoAtual + 1}</span>
          </div>

          <div className="p-6">
            <p className="text-gray-800 text-lg leading-relaxed whitespace-pre-line">{questao.enunciado}</p>
          </div>

          <div className="px-6 pb-6 space-y-3">
            {['A', 'B', 'C', 'D', 'E'].map(letra => {
              const texto = questao[`alternativa_${letra.toLowerCase()}` as keyof Questao] as string;
              if (!texto) return null;
              const isSelected = respostaAtual === letra;
              return (
                <button
                  key={letra}
                  onClick={() => handleSelecionarResposta(letra)}
                  className={`w-full p-4 rounded-xl border-2 text-left transition-all ${isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'}`}
                >
                  <div className="flex items-start gap-3">
                    <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold shrink-0 ${isSelected ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600'}`}>{letra}</span>
                    <span className="text-gray-700 pt-0.5">{texto}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex items-center justify-between mt-6">
          <button onClick={handleQuestaoAnterior} disabled={questaoAtual === 0} className={`flex items-center gap-2 px-4 py-2 rounded-xl ${questaoAtual === 0 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:text-gray-900 hover:bg-white'}`}>
            <ArrowLeft className="w-5 h-5" />
            Anterior
          </button>

          {questaoAtual < questoes.length - 1 ? (
            <button onClick={handleProximaQuestao} className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold bg-blue-500 text-white hover:bg-blue-600">
              Próxima
              <ArrowRight className="w-5 h-5" />
            </button>
          ) : (
            <button onClick={handleFinalizar} disabled={salvandoErros} className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold ${todasRespondidas ? 'bg-emerald-500 text-white hover:bg-emerald-600' : 'bg-amber-500 text-white hover:bg-amber-600'}`}>
              {salvandoErros ? 'Salvando...' : todasRespondidas ? 'Finalizar' : `Finalizar (${respostas.length}/${questoes.length})`}
              <CheckCircle className="w-5 h-5" />
            </button>
          )}
        </div>

        {questaoAtual === questoes.length - 1 && !todasRespondidas && (
          <p className="text-amber-600 text-sm text-center mt-4">⚠️ Você tem {questoes.length - respostas.length} questão(ões) não respondida(s)</p>
        )}
      </main>
    </div>
  );
}
