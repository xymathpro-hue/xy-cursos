
'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { 
  Zap, 
  Clock, 
  Trophy,
  Home,
  RotateCcw,
  CheckCircle,
  XCircle,
  Flame,
  Star
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
  dificuldade: string;
}

interface Resultado {
  questaoId: string;
  resposta: string;
  correta: boolean;
  tempo: number;
}

export default function BatalhaRapidaPage() {
  const router = useRouter();
  const supabase = createClientComponentClient();

  const [questoes, setQuestoes] = useState<Questao[]>([]);
  const [questaoAtual, setQuestaoAtual] = useState(0);
  const [tempoRestante, setTempoRestante] = useState(30);
  const [resultados, setResultados] = useState<Resultado[]>([]);
  const [loading, setLoading] = useState(true);
  const [iniciado, setIniciado] = useState(false);
  const [finalizado, setFinalizado] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [tempoInicio, setTempoInicio] = useState<number>(0);

  useEffect(() => {
    async function fetchData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }
      setUserId(user.id);

      // Buscar 5 questões aleatórias
      const { data: questoesData } = await supabase
        .from('questoes')
        .select('*')
        .eq('ativo', true)
        .limit(50);

      if (questoesData && questoesData.length > 0) {
        // Embaralhar e pegar 5
        const embaralhadas = questoesData.sort(() => Math.random() - 0.5).slice(0, 5);
        setQuestoes(embaralhadas);
      }

      setLoading(false);
    }

    fetchData();
  }, [supabase, router]);

  // Timer
  useEffect(() => {
    if (!iniciado || finalizado || tempoRestante <= 0) return;

    const timer = setInterval(() => {
      setTempoRestante(prev => {
        if (prev <= 1) {
          // Tempo esgotado - registrar como errado
          handleTempoEsgotado();
          return 30;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [iniciado, finalizado, questaoAtual]);

  const handleTempoEsgotado = useCallback(() => {
    const questao = questoes[questaoAtual];
    if (!questao) return;

    setResultados(prev => [...prev, {
      questaoId: questao.id,
      resposta: '-',
      correta: false,
      tempo: 30
    }]);

    if (questaoAtual < questoes.length - 1) {
      setQuestaoAtual(prev => prev + 1);
      setTempoRestante(30);
      setTempoInicio(Date.now());
    } else {
      setFinalizado(true);
    }
  }, [questaoAtual, questoes]);

  const handleIniciar = () => {
    setIniciado(true);
    setTempoInicio(Date.now());
  };

  const handleResponder = async (letra: string) => {
    const questao = questoes[questaoAtual];
    const tempoGasto = Math.round((Date.now() - tempoInicio) / 1000);
    const correta = letra === questao.resposta_correta;

    // Salvar resultado
    setResultados(prev => [...prev, {
      questaoId: questao.id,
      resposta: letra,
      correta,
      tempo: tempoGasto
    }]);

    // Salvar no banco
    if (userId) {
      await supabase.from('respostas_usuario').upsert({
        user_id: userId,
        questao_id: questao.id,
        resposta_selecionada: letra,
        correta
      }, { onConflict: 'user_id,questao_id' });

      if (!correta) {
        await supabase.from('caderno_erros').upsert({
          user_id: userId,
          questao_id: questao.id,
          resposta_usuario: letra,
          revisado: false,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id,questao_id' });
      }
    }

    // Próxima questão ou finalizar
    if (questaoAtual < questoes.length - 1) {
      setQuestaoAtual(prev => prev + 1);
      setTempoRestante(30);
      setTempoInicio(Date.now());
    } else {
      setFinalizado(true);
    }
  };

  const handleReiniciar = () => {
    setQuestaoAtual(0);
    setTempoRestante(30);
    setResultados([]);
    setIniciado(false);
    setFinalizado(false);
    
    // Embaralhar novamente
    setQuestoes(prev => [...prev].sort(() => Math.random() - 0.5));
  };

  const calcularEstatisticas = () => {
    const acertos = resultados.filter(r => r.correta).length;
    const tempoTotal = resultados.reduce((acc, r) => acc + r.tempo, 0);
    const tempoMedio = Math.round(tempoTotal / resultados.length);
    const xpGanho = acertos * 20 + (acertos === 5 ? 50 : 0); // Bonus por perfeito
    
    return { acertos, tempoTotal, tempoMedio, xpGanho };
  };

  const getCorTempo = () => {
    if (tempoRestante > 20) return 'text-emerald-500';
    if (tempoRestante > 10) return 'text-amber-500';
    return 'text-red-500';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
      </div>
    );
  }

  // Tela inicial
  if (!iniciado) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-3xl p-8 text-center shadow-2xl">
            <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Zap className="w-10 h-10 text-amber-600" />
            </div>
            
            <h1 className="text-3xl font-black text-gray-900 mb-2">Batalha Rápida</h1>
            <p className="text-gray-500 mb-8">5 questões • 30 segundos cada</p>

            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="bg-gray-50 rounded-xl p-4">
                <Clock className="w-6 h-6 text-blue-500 mx-auto mb-2" />
                <p className="text-sm text-gray-600">30s</p>
                <p className="text-xs text-gray-400">por questão</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4">
                <Flame className="w-6 h-6 text-orange-500 mx-auto mb-2" />
                <p className="text-sm text-gray-600">5</p>
                <p className="text-xs text-gray-400">questões</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4">
                <Star className="w-6 h-6 text-amber-500 mx-auto mb-2" />
                <p className="text-sm text-gray-600">+XP</p>
                <p className="text-xs text-gray-400">bônus</p>
              </div>
            </div>

            <button
              onClick={handleIniciar}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold text-lg hover:from-amber-600 hover:to-orange-600 transition-all shadow-lg"
            >
              ⚡ INICIAR BATALHA
            </button>

            <Link href="/dashboard" className="block mt-4 text-gray-400 hover:text-gray-600">
              Voltar ao Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Tela de resultado
  if (finalizado) {
    const { acertos, tempoTotal, tempoMedio, xpGanho } = calcularEstatisticas();
    const percentual = (acertos / 5) * 100;
    const emoji = percentual === 100 ? '🏆' : percentual >= 80 ? '🔥' : percentual >= 60 ? '⚡' : percentual >= 40 ? '👍' : '💪';

    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-3xl p-8 text-center shadow-2xl">
            <div className="text-7xl mb-4">{emoji}</div>
            
            <h2 className="text-2xl font-black text-gray-900 mb-2">
              {percentual === 100 ? 'PERFEITO!' : percentual >= 60 ? 'Muito Bem!' : 'Continue Tentando!'}
            </h2>
            <p className="text-gray-500 mb-6">Batalha Rápida Concluída</p>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-emerald-50 rounded-xl p-4">
                <p className="text-3xl font-bold text-emerald-600">{acertos}/5</p>
                <p className="text-emerald-700 text-sm">Acertos</p>
              </div>
              <div className="bg-blue-50 rounded-xl p-4">
                <p className="text-3xl font-bold text-blue-600">{tempoMedio}s</p>
                <p className="text-blue-700 text-sm">Média</p>
              </div>
            </div>

            <div className="bg-amber-50 rounded-xl p-4 mb-6">
              <div className="flex items-center justify-center gap-2">
                <Star className="w-6 h-6 text-amber-500" />
                <p className="text-2xl font-bold text-amber-600">+{xpGanho} XP</p>
              </div>
              {acertos === 5 && <p className="text-amber-600 text-sm">🎉 Bônus de perfeição!</p>}
            </div>

            {/* Resumo das respostas */}
            <div className="flex justify-center gap-2 mb-6">
              {resultados.map((r, i) => (
                <div 
                  key={i}
                  className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    r.correta ? 'bg-emerald-100' : 'bg-red-100'
                  }`}
                >
                  {r.correta 
                    ? <CheckCircle className="w-5 h-5 text-emerald-600" />
                    : <XCircle className="w-5 h-5 text-red-600" />
                  }
                </div>
              ))}
            </div>

            <div className="space-y-3">
              <button
                onClick={handleReiniciar}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold hover:from-amber-600 hover:to-orange-600 flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-5 h-5" />
                Nova Batalha
              </button>
              <Link
                href="/dashboard"
                className="w-full py-3 rounded-xl bg-gray-100 text-gray-700 font-medium hover:bg-gray-200 flex items-center justify-center gap-2"
              >
                <Home className="w-5 h-5" />
                Voltar ao Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Tela de questão
  const questao = questoes[questaoAtual];

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-500 to-orange-600">
      {/* Header com timer */}
      <header className="p-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-6 h-6 text-white" />
            <span className="text-white font-bold">Batalha Rápida</span>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Progresso */}
            <div className="flex gap-1">
              {[0, 1, 2, 3, 4].map(i => (
                <div 
                  key={i}
                  className={`w-3 h-3 rounded-full ${
                    i < questaoAtual ? 'bg-white' : 
                    i === questaoAtual ? 'bg-white animate-pulse' : 
                    'bg-white/30'
                  }`}
                />
              ))}
            </div>

            {/* Timer */}
            <div className={`flex items-center gap-1 bg-white rounded-full px-4 py-2 ${tempoRestante <= 10 ? 'animate-pulse' : ''}`}>
              <Clock className={`w-5 h-5 ${getCorTempo()}`} />
              <span className={`text-xl font-bold ${getCorTempo()}`}>{tempoRestante}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Questão */}
      <main className="px-4 pb-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-3xl p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-gray-400">Questão {questaoAtual + 1} de 5</span>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                questao.dificuldade === 'facil' ? 'bg-emerald-100 text-emerald-700' :
                questao.dificuldade === 'dificil' ? 'bg-red-100 text-red-700' :
                'bg-amber-100 text-amber-700'
              }`}>
                {questao.dificuldade === 'facil' ? 'Fácil' : questao.dificuldade === 'dificil' ? 'Difícil' : 'Médio'}
              </span>
            </div>

            <p className="text-gray-800 text-lg mb-6 leading-relaxed">{questao.enunciado}</p>

            <div className="space-y-3">
              {['A', 'B', 'C', 'D', 'E'].map(letra => {
                const texto = questao[`alternativa_${letra.toLowerCase()}` as keyof Questao] as string;
                if (!texto) return null;

                return (
                  <button
                    key={letra}
                    onClick={() => handleResponder(letra)}
                    className="w-full p-4 rounded-xl border-2 border-gray-200 hover:border-amber-400 hover:bg-amber-50 text-left transition-all active:scale-98"
                  >
                    <div className="flex items-start gap-3">
                      <span className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-sm font-bold text-gray-600 shrink-0">
                        {letra}
                      </span>
                      <span className="text-gray-700">{texto}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Barra de tempo visual */}
          <div className="mt-4 h-2 bg-white/30 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-1000 ${
                tempoRestante > 20 ? 'bg-emerald-400' :
                tempoRestante > 10 ? 'bg-amber-400' :
                'bg-red-400'
              }`}
              style={{ width: `${(tempoRestante / 30) * 100}%` }}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
