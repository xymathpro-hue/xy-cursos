'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { 
  ArrowLeft, 
  Clock, 
  Zap, 
  CheckCircle, 
  XCircle,
  Trophy,
  Star,
  Flame
} from 'lucide-react';
import { adicionarXP } from '@/lib/xp-system';
import MathText from '@/components/MathText';

interface Questao {
  id: string;
  enunciado: string;
  alternativa_a: string;
  alternativa_b: string;
  alternativa_c: string;
  alternativa_d: string;
  alternativa_e: string;
  resposta_correta: string;
  explicacao: string;
}

interface Resposta {
  questaoId: string;
  respostaUsuario: string;
  correta: boolean;
  tempoGasto: number;
}

export default function BatalhaPage() {
  const router = useRouter();
  const supabase = createClientComponentClient();

  const [loading, setLoading] = useState(true);
  const [questoes, setQuestoes] = useState<Questao[]>([]);
  const [questaoAtual, setQuestaoAtual] = useState(0);
  const [tempo, setTempo] = useState(30);
  const [respostas, setRespostas] = useState<Resposta[]>([]);
  const [respondida, setRespondida] = useState(false);
  const [respostaSelecionada, setRespostaSelecionada] = useState<string | null>(null);
  const [fase, setFase] = useState<'inicio' | 'jogando' | 'resultado'>('inicio');
  const [xpGanho, setXpGanho] = useState(0);
  const [tempoInicio, setTempoInicio] = useState<number>(0);

  useEffect(() => {
    async function checkAuth() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }
      setLoading(false);
    }
    checkAuth();
  }, [supabase, router]);

  const carregarQuestoes = async () => {
    const { data } = await supabase
      .from('questoes')
      .select('*')
      .eq('ativo', true)
      .limit(50);

    if (data && data.length >= 5) {
      const shuffled = data.sort(() => Math.random() - 0.5);
      setQuestoes(shuffled.slice(0, 5));
    }
  };

  const iniciarBatalha = async () => {
    await carregarQuestoes();
    setFase('jogando');
    setQuestaoAtual(0);
    setRespostas([]);
    setTempo(30);
    setTempoInicio(Date.now());
  };

  const processarResposta = useCallback((resposta: string | null) => {
    if (respondida || questoes.length === 0) return;

    const questao = questoes[questaoAtual];
    const correta = resposta === questao.resposta_correta;
    const tempoGasto = 30 - tempo;

    setRespondida(true);
    setRespostaSelecionada(resposta);

    const novaResposta: Resposta = {
      questaoId: questao.id,
      respostaUsuario: resposta || 'timeout',
      correta,
      tempoGasto
    };

    setRespostas(prev => [...prev, novaResposta]);

    setTimeout(() => {
      if (questaoAtual < 4) {
        setQuestaoAtual(prev => prev + 1);
        setTempo(30);
        setRespondida(false);
        setRespostaSelecionada(null);
        setTempoInicio(Date.now());
      } else {
        finalizarBatalha([...respostas, novaResposta]);
      }
    }, 1500);
  }, [respondida, questoes, questaoAtual, tempo, respostas]);

  const finalizarBatalha = async (todasRespostas: Resposta[]) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const acertos = todasRespostas.filter(r => r.correta).length;
    const perfeita = acertos === 5;

    // Calcular XP
    let xp = acertos * 20; // 20 XP por acerto
    if (perfeita) xp += 50; // Bônus perfeita

    // Bônus por tempo (média < 15s)
    const tempoMedio = todasRespostas.reduce((sum, r) => sum + r.tempoGasto, 0) / 5;
    if (tempoMedio < 15) xp += 20;

    setXpGanho(xp);

    // Salvar XP
    await adicionarXP(supabase, user.id, xp, 'Batalha Rápida');

    // Atualizar stats
    const { data: stats } = await supabase
      .from('user_stats')
      .select('batalhas_jogadas, batalhas_perfeitas, questoes_respondidas, questoes_corretas')
      .eq('user_id', user.id)
      .single();

    if (stats) {
      await supabase
        .from('user_stats')
        .update({
          batalhas_jogadas: stats.batalhas_jogadas + 1,
          batalhas_perfeitas: stats.batalhas_perfeitas + (perfeita ? 1 : 0),
          questoes_respondidas: stats.questoes_respondidas + 5,
          questoes_corretas: stats.questoes_corretas + acertos,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);
    }

    // Salvar erros no caderno
    for (const resposta of todasRespostas) {
      if (!resposta.correta) {
        const questao = questoes.find(q => q.id === resposta.questaoId);
        if (questao) {
          await supabase.from('caderno_erros').insert({
            user_id: user.id,
            questao_id: questao.id,
            resposta_usuario: resposta.respostaUsuario,
            resposta_correta: questao.resposta_correta
          });
        }
      }
    }

    setFase('resultado');
  };

  // Timer
  useEffect(() => {
    if (fase !== 'jogando' || respondida) return;

    const timer = setInterval(() => {
      setTempo(prev => {
        if (prev <= 1) {
          processarResposta(null);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [fase, respondida, processarResposta]);

  const getAlternativaCor = (letra: string) => {
    if (!respondida) {
      return respostaSelecionada === letra 
        ? 'border-blue-500 bg-blue-50' 
        : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50';
    }

    const questao = questoes[questaoAtual];
    if (letra === questao.resposta_correta) {
      return 'border-emerald-500 bg-emerald-50';
    }
    if (letra === respostaSelecionada && !questoes[questaoAtual]) {
      return 'border-red-500 bg-red-50';
    }
    if (letra === respostaSelecionada) {
      return 'border-red-500 bg-red-50';
    }
    return 'border-gray-200 opacity-50';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-amber-500/30 border-t-amber-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Tela de início
  if (fase === 'inicio') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-amber-500 to-orange-500">
        <header className="px-4 py-4">
          <Link href="/dashboard" className="inline-flex items-center gap-2 text-white/80 hover:text-white">
            <ArrowLeft className="w-5 h-5" />
            <span>Voltar</span>
          </Link>
        </header>

        <main className="px-4 py-12 text-center text-white">
          <div className="w-24 h-24 bg-white/20 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <Zap className="w-12 h-12" />
          </div>

          <h1 className="text-4xl font-black mb-4">Batalha Rápida</h1>
          <p className="text-white/80 text-lg mb-8">5 questões • 30 segundos cada</p>

          <div className="bg-white/10 rounded-2xl p-6 mb-8 max-w-sm mx-auto">
            <h3 className="font-bold mb-4">Como funciona:</h3>
            <ul className="text-left space-y-2 text-white/90">
              <li className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-emerald-300" />
                <span>20 XP por acerto</span>
              </li>
              <li className="flex items-center gap-2">
                <Star className="w-5 h-5 text-yellow-300" />
                <span>+50 XP se acertar todas</span>
              </li>
              <li className="flex items-center gap-2">
                <Flame className="w-5 h-5 text-orange-300" />
                <span>+20 XP se for rápido</span>
              </li>
            </ul>
          </div>

          <button
            onClick={iniciarBatalha}
            className="bg-white text-amber-600 font-bold text-xl px-12 py-4 rounded-2xl hover:bg-amber-50 transition-all transform hover:scale-105"
          >
            ⚡ Iniciar Batalha
          </button>
        </main>
      </div>
    );
  }

  // Tela de resultado
  if (fase === 'resultado') {
    const acertos = respostas.filter(r => r.correta).length;
    const perfeita = acertos === 5;

    return (
      <div className={`min-h-screen ${perfeita ? 'bg-gradient-to-b from-amber-500 to-yellow-500' : 'bg-gradient-to-b from-blue-500 to-indigo-500'}`}>
        <main className="px-4 py-12 text-center text-white">
          <div className="w-24 h-24 bg-white/20 rounded-3xl flex items-center justify-center mx-auto mb-6">
            {perfeita ? <Trophy className="w-12 h-12" /> : <Star className="w-12 h-12" />}
          </div>

          <h1 className="text-4xl font-black mb-2">
            {perfeita ? 'PERFEITO!' : 'Batalha Concluída!'}
          </h1>
          <p className="text-white/80 text-lg mb-8">
            {acertos}/5 acertos
          </p>

          <div className="bg-white/10 rounded-2xl p-6 mb-8 max-w-sm mx-auto">
            <p className="text-5xl font-black text-yellow-300 mb-2">+{xpGanho} XP</p>
            <p className="text-white/70">Experiência ganha</p>
          </div>

          <div className="space-y-3 max-w-sm mx-auto mb-8">
            {respostas.map((r, i) => (
              <div 
                key={i}
                className={`flex items-center justify-between p-3 rounded-xl ${
                  r.correta ? 'bg-emerald-500/30' : 'bg-red-500/30'
                }`}
              >
                <span>Questão {i + 1}</span>
                <div className="flex items-center gap-2">
                  <span className="text-white/70">{r.tempoGasto}s</span>
                  {r.correta ? (
                    <CheckCircle className="w-5 h-5 text-emerald-300" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-300" />
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-4 justify-center">
            <Link
              href="/dashboard"
              className="bg-white/20 text-white font-bold px-8 py-3 rounded-xl hover:bg-white/30 transition-all"
            >
              Voltar
            </Link>
            <button
              onClick={() => {
                setFase('inicio');
                setRespostas([]);
                setQuestaoAtual(0);
              }}
              className="bg-white text-blue-600 font-bold px-8 py-3 rounded-xl hover:bg-blue-50 transition-all"
            >
              Jogar Novamente
            </button>
          </div>
        </main>
      </div>
    );
  }

  // Tela do jogo
  const questao = questoes[questaoAtual];
  if (!questao) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-500" />
            <span className="font-bold text-gray-900">Questão {questaoAtual + 1}/5</span>
          </div>
          <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${
            tempo <= 10 ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600'
          }`}>
            <Clock className="w-4 h-4" />
            <span className="font-bold">{tempo}s</span>
          </div>
        </div>
      </header>

      {/* Barra de progresso */}
      <div className="h-1 bg-gray-200">
        <div 
          className="h-full bg-amber-500 transition-all duration-1000"
          style={{ width: `${(tempo / 30) * 100}%` }}
        />
      </div>

      <main className="max-w-2xl mx-auto px-4 py-6">
        {/* Enunciado */}
        <div className="bg-white rounded-2xl p-6 mb-6 border border-gray-100">
          <MathText text={questao.enunciado} className="text-gray-900" />
        </div>

        {/* Alternativas */}
        <div className="space-y-3">
          {['a', 'b', 'c', 'd', 'e'].map((letra) => {
            const textoAlternativa = questao[`alternativa_${letra}` as keyof Questao] as string;
            if (!textoAlternativa) return null;

            return (
              <button
                key={letra}
                onClick={() => !respondida && processarResposta(letra)}
                disabled={respondida}
                className={`w-full text-left p-4 rounded-xl border-2 transition-all ${getAlternativaCor(letra)}`}
              >
                <div className="flex items-start gap-3">
                  <span className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm shrink-0 ${
                    respondida && letra === questao.resposta_correta
                      ? 'bg-emerald-500 text-white'
                      : respondida && letra === respostaSelecionada
                        ? 'bg-red-500 text-white'
                        : 'bg-gray-100 text-gray-600'
                  }`}>
                    {letra.toUpperCase()}
                  </span>
                  <MathText text={textoAlternativa} className="text-gray-700 flex-1" />
                </div>
              </button>
            );
          })}
        </div>

        {/* Feedback */}
        {respondida && (
          <div className={`mt-6 p-4 rounded-xl ${
            respostaSelecionada === questao.resposta_correta
              ? 'bg-emerald-100 border border-emerald-300'
              : 'bg-red-100 border border-red-300'
          }`}>
            <div className="flex items-center gap-2 mb-2">
              {respostaSelecionada === questao.resposta_correta ? (
                <>
                  <CheckCircle className="w-5 h-5 text-emerald-600" />
                  <span className="font-bold text-emerald-700">Correto! +20 XP</span>
                </>
              ) : (
                <>
                  <XCircle className="w-5 h-5 text-red-600" />
                  <span className="font-bold text-red-700">
                    {respostaSelecionada ? 'Incorreto' : 'Tempo esgotado'}
                  </span>
                </>
              )}
            </div>
            {questao.explicacao && (
              <MathText text={questao.explicacao} className="text-gray-600 text-sm" />
            )}
          </div>
        )}
      </main>
    </div>
  );
}
