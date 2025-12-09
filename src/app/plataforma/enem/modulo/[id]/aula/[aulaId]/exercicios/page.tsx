'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { 
  ArrowLeft, 
  CheckCircle, 
  XCircle,
  ArrowRight,
  Home,
  RotateCcw,
  Eye,
  EyeOff,
  Star,
  Flame
} from 'lucide-react';
import { registrarQuestaoRespondida } from '@/lib/xp-system';
import XPNotification from '@/components/XPNotification';

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

interface Resposta {
  questaoId: string;
  letra: string;
}

interface XPResult {
  xpGanho: number;
  xpTotal: number;
  nivelInfo: { nivel: number; titulo: string };
  streak: number;
  subiuNivel: boolean;
}

export default function ExerciciosNivelPage() {
  const router = useRouter();
  const params = useParams();
  const supabase = createClientComponentClient();

  const moduloId = params.moduloId as string;
  const aulaId = params.aulaId as string;
  const nivel = params.nivel as string;

  const [questoes, setQuestoes] = useState<Questao[]>([]);
  const [questaoAtual, setQuestaoAtual] = useState(0);
  const [respostas, setRespostas] = useState<Resposta[]>([]);
  const [loading, setLoading] = useState(true);
  const [finalizado, setFinalizado] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [mostrarResolucao, setMostrarResolucao] = useState<string | null>(null);
  const [xpTotal, setXpTotal] = useState(0);
  const [xpNotification, setXpNotification] = useState<XPResult | null>(null);
  const [showNotification, setShowNotification] = useState(false);

  const getNomeNivel = () => {
    switch (nivel) {
      case 'facil': return 'Fácil';
      case 'medio': return 'Médio';
      case 'dificil': return 'Difícil';
      default: return nivel;
    }
  };

  const getCorNivel = () => {
    switch (nivel) {
      case 'facil': return { bg: 'bg-emerald-500', light: 'bg-emerald-100', text: 'text-emerald-600' };
      case 'dificil': return { bg: 'bg-red-500', light: 'bg-red-100', text: 'text-red-600' };
      default: return { bg: 'bg-amber-500', light: 'bg-amber-100', text: 'text-amber-600' };
    }
  };

  useEffect(() => {
    async function fetchData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }
      setUserId(user.id);

      // Buscar fase do módulo e aula
      const { data: faseData } = await supabase
        .from('fases')
        .select('id')
        .eq('modulo_id', moduloId)
        .eq('aula_numero', parseInt(aulaId))
        .single();

      if (!faseData) {
        setLoading(false);
        return;
      }

      // Buscar questões da fase e nível
      const { data: questoesData } = await supabase
        .from('questoes')
        .select('*')
        .eq('fase_id', faseData.id)
        .eq('dificuldade', nivel)
        .eq('ativo', true)
        .order('numero');

      if (questoesData) {
        setQuestoes(questoesData);
      }

      setLoading(false);
    }

    fetchData();
  }, [supabase, router, moduloId, aulaId, nivel]);

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

  const handleProxima = () => {
    if (questaoAtual < questoes.length - 1) {
      setQuestaoAtual(prev => prev + 1);
    }
  };

  const handleAnterior = () => {
    if (questaoAtual > 0) {
      setQuestaoAtual(prev => prev - 1);
    }
  };

  const handleFinalizar = async () => {
    if (!userId) return;

    let xpGanhoTotal = 0;
    let ultimoXpResult: XPResult | null = null;

    // Salvar todas as respostas e calcular XP
    for (const resp of respostas) {
      const q = questoes.find(quest => quest.id === resp.questaoId);
      if (q) {
        const correta = resp.letra === q.resposta_correta;

        // Salvar resposta
        await supabase.from('respostas_usuario').upsert({
          user_id: userId,
          questao_id: resp.questaoId,
          resposta_selecionada: resp.letra,
          correta
        }, { onConflict: 'user_id,questao_id' });

        // Salvar erro se incorreto
        if (!correta) {
          await supabase.from('caderno_erros').upsert({
            user_id: userId,
            questao_id: resp.questaoId,
            resposta_usuario: resp.letra,
            revisado: false,
            updated_at: new Date().toISOString()
          }, { onConflict: 'user_id,questao_id' });
        }

        // Registrar XP
        const xpResult = await registrarQuestaoRespondida(supabase, userId, correta, q.dificuldade);
        if (xpResult) {
          xpGanhoTotal += xpResult.xpGanho;
          ultimoXpResult = xpResult;
        }
      }
    }

    setXpTotal(xpGanhoTotal);
    if (ultimoXpResult && xpGanhoTotal > 0) {
      setXpNotification({
        ...ultimoXpResult,
        xpGanho: xpGanhoTotal
      });
      setShowNotification(true);
    }

    setFinalizado(true);
  };

  const calcularResultado = () => {
    let acertos = 0;
    questoes.forEach(q => {
      const resp = respostas.find(r => r.questaoId === q.id);
      if (resp?.letra === q.resposta_correta) acertos++;
    });
    return {
      acertos,
      total: questoes.length,
      percentual: Math.round((acertos / questoes.length) * 100)
    };
  };

  const cores = getCorNivel();

  if (loading) {
    return (
      <div className={`min-h-screen ${cores.bg} flex items-center justify-center`}>
        <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
      </div>
    );
  }

  if (questoes.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-gray-500 mb-4">Nenhuma questão encontrada para este nível.</p>
          <Link href={`/plataforma/enem/modulo/${moduloId}`} className="text-blue-500 hover:underline">
            Voltar ao módulo
          </Link>
        </div>
      </div>
    );
  }

  // Tela de resultado
  if (finalizado) {
    const resultado = calcularResultado();
    const emoji = resultado.percentual === 100 ? '🏆' : resultado.percentual >= 70 ? '🎉' : resultado.percentual >= 50 ? '👍' : '💪';

    return (
      <div className={`min-h-screen ${cores.bg}`}>
        {showNotification && xpNotification && (
          <XPNotification
            xpGanho={xpNotification.xpGanho}
            streak={xpNotification.streak}
            subiuNivel={xpNotification.subiuNivel}
            novoNivel={xpNotification.nivelInfo.titulo}
            onClose={() => setShowNotification(false)}
          />
        )}

        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="max-w-md w-full">
            <div className="bg-white rounded-3xl p-8 text-center shadow-2xl">
              <div className="text-7xl mb-4">{emoji}</div>
              
              <h2 className="text-2xl font-black text-gray-900 mb-2">
                {resultado.percentual === 100 ? 'Perfeito!' : resultado.percentual >= 70 ? 'Muito Bem!' : 'Continue Praticando!'}
              </h2>
              <p className="text-gray-500 mb-6">Exercícios {getNomeNivel()} Concluídos</p>

              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-emerald-50 rounded-xl p-4">
                  <p className="text-2xl font-bold text-emerald-600">{resultado.acertos}</p>
                  <p className="text-emerald-700 text-sm">Acertos</p>
                </div>
                <div className="bg-red-50 rounded-xl p-4">
                  <p className="text-2xl font-bold text-red-600">{resultado.total - resultado.acertos}</p>
                  <p className="text-red-700 text-sm">Erros</p>
                </div>
                <div className="bg-blue-50 rounded-xl p-4">
                  <p className="text-2xl font-bold text-blue-600">{resultado.percentual}%</p>
                  <p className="text-blue-700 text-sm">Taxa</p>
                </div>
              </div>

              {/* XP Ganho */}
              {xpTotal > 0 && (
                <div className="bg-amber-50 rounded-xl p-4 mb-6">
                  <div className="flex items-center justify-center gap-2">
                    <Star className="w-6 h-6 text-amber-500" />
                    <p className="text-2xl font-bold text-amber-600">+{xpTotal} XP</p>
                  </div>
                  {xpNotification && xpNotification.streak > 1 && (
                    <div className="flex items-center justify-center gap-1 mt-2 text-orange-500 text-sm">
                      <Flame className="w-4 h-4" />
                      <span>{xpNotification.streak} dias de streak!</span>
                    </div>
                  )}
                </div>
              )}

              {/* Revisão das questões */}
              <div className="mb-6 max-h-60 overflow-y-auto">
                <p className="text-sm font-medium text-gray-700 mb-3">Revisão:</p>
                <div className="space-y-2">
                  {questoes.map((q, index) => {
                    const resp = respostas.find(r => r.questaoId === q.id);
                    const correta = resp?.letra === q.resposta_correta;
                    const isMostrandoResolucao = mostrarResolucao === q.id;

                    return (
                      <div key={q.id} className={`p-3 rounded-xl border ${correta ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {correta ? (
                              <CheckCircle className="w-5 h-5 text-emerald-600" />
                            ) : (
                              <XCircle className="w-5 h-5 text-red-600" />
                            )}
                            <span className="font-medium text-gray-900">Questão {index + 1}</span>
                          </div>
                          <div className="text-sm">
                            <span className={correta ? 'text-emerald-600' : 'text-red-600'}>
                              {resp?.letra || '-'}
                            </span>
                            {!correta && (
                              <span className="text-gray-400"> → </span>
                            )}
                            {!correta && (
                              <span className="text-emerald-600">{q.resposta_correta}</span>
                            )}
                          </div>
                        </div>

                        {!correta && q.explicacao && (
                          <div className="mt-2">
                            <button
                              onClick={() => setMostrarResolucao(isMostrandoResolucao ? null : q.id)}
                              className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                            >
                              {isMostrandoResolucao ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                              {isMostrandoResolucao ? 'Ocultar' : 'Ver resolução'}
                            </button>
                            {isMostrandoResolucao && (
                              <div className="mt-2 p-3 bg-blue-50 rounded-lg text-sm text-blue-700">
                                {q.explicacao}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-3">
                <Link
                  href={`/plataforma/enem/modulo/${moduloId}`}
                  className={`w-full py-3 rounded-xl ${cores.bg} text-white font-bold flex items-center justify-center gap-2`}
                >
                  <RotateCcw className="w-5 h-5" />
                  Voltar ao Módulo
                </Link>
                <Link
                  href="/dashboard"
                  className="w-full py-3 rounded-xl bg-gray-100 text-gray-700 font-medium hover:bg-gray-200 flex items-center justify-center gap-2"
                >
                  <Home className="w-5 h-5" />
                  Dashboard
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Tela de questão
  const respostaAtual = getRespostaAtual();
  const progresso = ((questaoAtual + 1) / questoes.length) * 100;
  const todasRespondidas = respostas.length === questoes.length;

  return (
    <div className={`min-h-screen ${cores.bg}`}>
      {/* Header */}
      <header className="bg-white/10 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <Link href={`/plataforma/enem/modulo/${moduloId}`} className="flex items-center gap-2 text-white">
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">Voltar</span>
            </Link>
            <div className={`px-4 py-1 rounded-full ${cores.light} ${cores.text} font-bold text-sm`}>
              {getNomeNivel()}
            </div>
          </div>

          <div className="mt-3">
            <div className="flex items-center justify-between text-sm text-white/80 mb-1">
              <span>Questão {questaoAtual + 1} de {questoes.length}</span>
              <span>{Math.round(progresso)}%</span>
            </div>
            <div className="h-2 bg-white/20 rounded-full overflow-hidden">
              <div 
                className="h-full bg-white transition-all duration-300"
                style={{ width: `${progresso}%` }}
              />
            </div>
          </div>
        </div>
      </header>

      {/* Questão */}
      <main className="px-4 py-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-3xl p-6 shadow-2xl">
            <p className="text-sm text-gray-400 mb-2">Questão {questaoAtual + 1}</p>
            <p className="text-gray-800 text-lg mb-6 leading-relaxed whitespace-pre-line">
              {questao.enunciado}
            </p>

            <div className="space-y-3">
              {['A', 'B', 'C', 'D', 'E'].map(letra => {
                const texto = questao[`alternativa_${letra.toLowerCase()}` as keyof Questao] as string;
                if (!texto) return null;
                const isSelected = respostaAtual === letra;

                return (
                  <button
                    key={`${questao.id}-${letra}`}
                    onClick={() => handleSelecionarResposta(letra)}
                    className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                      isSelected 
                        ? `${cores.bg} border-transparent text-white` 
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold shrink-0 ${
                        isSelected ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {letra}
                      </span>
                      <span className={isSelected ? 'text-white' : 'text-gray-700'}>{texto}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Navegação */}
          <div className="flex items-center justify-between mt-6">
            <button 
              onClick={handleAnterior}
              disabled={questaoAtual === 0}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl ${
                questaoAtual === 0 ? 'text-white/30' : 'text-white hover:bg-white/10'
              }`}
            >
              <ArrowLeft className="w-5 h-5" />
              Anterior
            </button>

            {questaoAtual < questoes.length - 1 ? (
              <button 
                onClick={handleProxima}
                className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold bg-white text-gray-800 hover:bg-white/90"
              >
                Próxima
                <ArrowRight className="w-5 h-5" />
              </button>
            ) : (
              <button 
                onClick={handleFinalizar}
                disabled={!todasRespondidas}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold ${
                  todasRespondidas 
                    ? 'bg-white text-gray-800 hover:bg-white/90' 
                    : 'bg-white/50 text-gray-500 cursor-not-allowed'
                }`}
              >
                Finalizar
                <CheckCircle className="w-5 h-5" />
              </button>
            )}
          </div>

          {questaoAtual === questoes.length - 1 && !todasRespondidas && (
            <p className="text-white/80 text-sm text-center mt-4">
              ⚠️ Responda todas as {questoes.length} questões para finalizar
            </p>
          )}
        </div>
      </main>
    </div>
  );
}
