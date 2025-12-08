'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Swords, Timer, CheckCircle2, XCircle, Zap, Trophy, ArrowRight, RotateCcw, Sparkles } from 'lucide-react';

interface Questao {
  id: string;
  enunciado: string;
  alternativa_a: string;
  alternativa_b: string;
  alternativa_c: string;
  alternativa_d: string;
  alternativa_e?: string;
  resposta_correta: string;
}

interface BatalhaRapidaProps {
  userId: string;
}

const TEMPO_POR_QUESTAO = 60;
const QUESTOES_POR_BATALHA = 5;

export function BatalhaRapida({ userId }: BatalhaRapidaProps) {
  const [estado, setEstado] = useState<'inicio' | 'batalha' | 'resultado'>('inicio');
  const [questoes, setQuestoes] = useState<Questao[]>([]);
  const [questaoAtual, setQuestaoAtual] = useState(0);
  const [tempoRestante, setTempoRestante] = useState(TEMPO_POR_QUESTAO);
  const [respostaSelecionada, setRespostaSelecionada] = useState<string | null>(null);
  const [respostaConfirmada, setRespostaConfirmada] = useState(false);
  const [acertos, setAcertos] = useState(0);
  const [xpGanho, setXpGanho] = useState(0);
  const [loading, setLoading] = useState(false);
  const supabase = createClientComponentClient();

  useEffect(() => {
    if (estado !== 'batalha' || respostaConfirmada) return;
    const timer = setInterval(() => {
      setTempoRestante((prev) => {
        if (prev <= 1) { clearInterval(timer); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [estado, questaoAtual, respostaConfirmada]);

  const iniciarBatalha = async () => {
    setLoading(true);
    try {
      const { data } = await supabase.from('questoes').select('*').eq('ativo', true).limit(50);
      const questoesEmbaralhadas = (data || []).sort(() => Math.random() - 0.5).slice(0, QUESTOES_POR_BATALHA);
      setQuestoes(questoesEmbaralhadas);
      setEstado('batalha');
      setQuestaoAtual(0);
      setAcertos(0);
      setXpGanho(0);
      setTempoRestante(TEMPO_POR_QUESTAO);
      setRespostaSelecionada(null);
      setRespostaConfirmada(false);
    } catch (error) {
      console.error('Erro:', error);
    } finally {
      setLoading(false);
    }
  };

  const confirmarResposta = async () => {
    if (respostaConfirmada || !questoes[questaoAtual]) return;
    setRespostaConfirmada(true);
    const questao = questoes[questaoAtual];
    const acertou = respostaSelecionada === questao.resposta_correta;
    if (acertou) {
      setAcertos((prev) => prev + 1);
      const xpBase = 20;
      const bonusTempo = Math.floor(tempoRestante / 10) * 5;
      setXpGanho((prev) => prev + xpBase + bonusTempo);
    } else if (respostaSelecionada) {
      try {
        await supabase.rpc('registrar_erro', {
          p_user_id: userId,
          p_questao_id: questao.id,
          p_resposta_usuario: respostaSelecionada
        });
      } catch (e) { console.error(e); }
    }
  };

  const proximaQuestao = () => {
    if (questaoAtual < questoes.length - 1) {
      setQuestaoAtual((prev) => prev + 1);
      setTempoRestante(TEMPO_POR_QUESTAO);
      setRespostaSelecionada(null);
      setRespostaConfirmada(false);
    } else {
      finalizarBatalha();
    }
  };

  const finalizarBatalha = async () => {
    setEstado('resultado');
    try {
      await supabase.rpc('incrementar_xp', { p_user_id: userId, p_xp_amount: xpGanho });
      await supabase.from('batalhas').insert({ user_id: userId, plataforma: 'enem', questoes_total: QUESTOES_POR_BATALHA, acertos, xp_ganho: xpGanho });
    } catch (error) {
      console.error('Erro:', error);
    }
  };

  const reiniciar = () => { setEstado('inicio'); setQuestoes([]); setQuestaoAtual(0); setAcertos(0); setXpGanho(0); };

  if (estado === 'inicio') {
    return (
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-slate-700/50 p-8">
        <div className="absolute inset-0 opacity-10"><div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-500 to-indigo-600 blur-3xl"></div></div>
        <div className="relative z-10 text-center">
          <div className="w-24 h-24 mx-auto rounded-3xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-2xl mb-6"><Swords className="w-12 h-12 text-white" /></div>
          <h2 className="text-3xl font-black text-white mb-2">Batalha Rápida</h2>
          <p className="text-slate-400 mb-8 max-w-md mx-auto">{QUESTOES_POR_BATALHA} questões com {TEMPO_POR_QUESTAO}s cada. Quanto mais rápido, mais XP!</p>
          <div className="flex items-center justify-center gap-6 mb-8">
            <div className="text-center"><div className="w-16 h-16 rounded-2xl bg-slate-700/50 flex items-center justify-center mb-2"><Timer className="w-8 h-8 text-slate-300" /></div><p className="text-xs text-slate-500">{TEMPO_POR_QUESTAO}s</p></div>
            <div className="text-center"><div className="w-16 h-16 rounded-2xl bg-slate-700/50 flex items-center justify-center mb-2"><Zap className="w-8 h-8 text-yellow-400" /></div><p className="text-xs text-slate-500">XP bônus</p></div>
            <div className="text-center"><div className="w-16 h-16 rounded-2xl bg-slate-700/50 flex items-center justify-center mb-2"><Trophy className="w-8 h-8 text-amber-400" /></div><p className="text-xs text-slate-500">Ranking</p></div>
          </div>
          <button onClick={iniciarBatalha} disabled={loading} className="px-10 py-4 rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-bold text-lg shadow-lg hover:scale-105 transition-all disabled:opacity-50">
            {loading ? <span className="flex items-center gap-2"><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>Carregando...</span> : <span className="flex items-center gap-2"><Swords className="w-5 h-5" />Iniciar<Sparkles className="w-5 h-5" /></span>}
          </button>
        </div>
      </div>
    );
  }

  if (estado === 'batalha' && questoes.length > 0) {
    const questao = questoes[questaoAtual];
    const alternativas = [{ letra: 'A', texto: questao.alternativa_a }, { letra: 'B', texto: questao.alternativa_b }, { letra: 'C', texto: questao.alternativa_c }, { letra: 'D', texto: questao.alternativa_d }, ...(questao.alternativa_e ? [{ letra: 'E', texto: questao.alternativa_e }] : [])];
    const tempoPercentual = (tempoRestante / TEMPO_POR_QUESTAO) * 100;
    const tempoClasse = tempoRestante <= 10 ? 'text-red-400' : tempoRestante <= 20 ? 'text-yellow-400' : 'text-emerald-400';

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <span className="text-2xl font-bold text-white">{questaoAtual + 1}<span className="text-slate-500">/{QUESTOES_POR_BATALHA}</span></span>
          <div className="flex items-center gap-3"><Timer className={`w-6 h-6 ${tempoClasse}`} /><span className={`text-3xl font-mono font-bold ${tempoClasse}`}>{tempoRestante}s</span></div>
        </div>
        <div className="h-2 bg-slate-700/50 rounded-full overflow-hidden"><div className={`h-full ${tempoRestante <= 10 ? 'bg-red-500' : tempoRestante <= 20 ? 'bg-yellow-500' : 'bg-emerald-500'} rounded-full transition-all`} style={{ width: `${tempoPercentual}%` }}></div></div>
        <div className="rounded-2xl bg-slate-800/50 border border-slate-700/50 p-6"><p className="text-lg text-white">{questao.enunciado}</p></div>
        <div className="space-y-3">
          {alternativas.map(({ letra, texto }) => {
            const selecionada = respostaSelecionada === letra;
            const correta = questao.resposta_correta === letra;
            let classes = 'border-slate-700/50 bg-slate-800/30 hover:bg-slate-700/50';
            if (respostaConfirmada) { if (correta) classes = 'border-emerald-500 bg-emerald-500/20'; else if (selecionada) classes = 'border-red-500 bg-red-500/20'; }
            else if (selecionada) classes = 'border-blue-500 bg-blue-500/20';
            return (
              <button key={letra} onClick={() => !respostaConfirmada && setRespostaSelecionada(letra)} disabled={respostaConfirmada} className={`w-full p-4 rounded-xl border-2 text-left transition-all ${classes}`}>
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold ${respostaConfirmada && correta ? 'bg-emerald-500 text-white' : respostaConfirmada && selecionada ? 'bg-red-500 text-white' : selecionada ? 'bg-blue-500 text-white' : 'bg-slate-700/50 text-slate-400'}`}>
                    {respostaConfirmada && correta ? <CheckCircle2 className="w-5 h-5" /> : respostaConfirmada && selecionada ? <XCircle className="w-5 h-5" /> : letra}
                  </div>
                  <span className={`text-sm ${respostaConfirmada && correta ? 'text-emerald-300' : respostaConfirmada && selecionada ? 'text-red-300' : 'text-slate-300'}`}>{texto}</span>
                </div>
              </button>
            );
          })}
        </div>
        {!respostaConfirmada ? (
          <button onClick={confirmarResposta} disabled={!respostaSelecionada} className={`w-full py-4 rounded-xl font-bold text-white ${respostaSelecionada ? 'bg-gradient-to-r from-blue-500 to-indigo-600' : 'bg-slate-700/50 text-slate-500 cursor-not-allowed'}`}>Confirmar</button>
        ) : (
          <button onClick={proximaQuestao} className="w-full py-4 rounded-xl font-bold text-white bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center gap-2">
            {questaoAtual < questoes.length - 1 ? <>Próxima <ArrowRight className="w-5 h-5" /></> : <>Resultado <Trophy className="w-5 h-5" /></>}
          </button>
        )}
      </div>
    );
  }

  if (estado === 'resultado') {
    const percentual = Math.round((acertos / QUESTOES_POR_BATALHA) * 100);
    const medalha = percentual >= 80 ? '🏆' : percentual >= 60 ? '🥈' : percentual >= 40 ? '🥉' : '💪';
    return (
      <div className="rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-slate-700/50 p-8 text-center">
        <div className="text-7xl mb-4">{medalha}</div>
        <h2 className="text-3xl font-black text-white mb-2">Batalha Concluída!</h2>
        <div className="grid grid-cols-2 gap-6 max-w-sm mx-auto my-8">
          <div className="p-4 rounded-2xl bg-slate-800/50"><p className="text-4xl font-black text-white">{acertos}/{QUESTOES_POR_BATALHA}</p><p className="text-slate-400 text-sm">Acertos</p></div>
          <div className="p-4 rounded-2xl bg-slate-800/50"><p className="text-4xl font-black text-yellow-400">+{xpGanho}</p><p className="text-slate-400 text-sm">XP</p></div>
        </div>
        <button onClick={reiniciar} className="px-6 py-3 rounded-xl bg-slate-700/50 text-slate-300 font-medium hover:bg-slate-600/50 flex items-center gap-2 mx-auto"><RotateCcw className="w-5 h-5" />Nova Batalha</button>
      </div>
    );
  }

  return null;
}
