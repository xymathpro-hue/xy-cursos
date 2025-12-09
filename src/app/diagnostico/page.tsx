'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { ArrowLeft, Target, CheckCircle, XCircle, Trophy, Lock } from 'lucide-react';
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
  dificuldade: string;
  competencia: string;
}

interface Resposta {
  questaoId: string;
  respostaUsuario: string;
  correta: boolean;
  dificuldade: string;
  competencia: string;
}

interface ResultadoDiagnostico {
  nivel: string;
  nota_tri: number;
  percentual_geral: number;
  created_at: string;
}

export default function DiagnosticoPage() {
  const router = useRouter();
  const supabase = createClientComponentClient();

  const [loading, setLoading] = useState(true);
  const [questoes, setQuestoes] = useState<Questao[]>([]);
  const [questaoAtual, setQuestaoAtual] = useState(0);
  const [respostas, setRespostas] = useState<Resposta[]>([]);
  const [respondida, setRespondida] = useState(false);
  const [respostaSelecionada, setRespostaSelecionada] = useState<string | null>(null);
  const [fase, setFase] = useState<'verificando' | 'bloqueado' | 'inicio' | 'jogando' | 'resultado'>('verificando');
  const [diasRestantes, setDiasRestantes] = useState(0);
  const [resultadoAnterior, setResultadoAnterior] = useState<ResultadoDiagnostico | null>(null);

  useEffect(() => {
    async function checkAuth() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      const { data: resultado } = await supabase
        .from('diagnostico_resultados')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (resultado) {
        const dataResultado = new Date(resultado.created_at);
        const hoje = new Date();
        const diffDias = Math.floor((hoje.getTime() - dataResultado.getTime()) / (1000 * 60 * 60 * 24));
        
        if (diffDias < 30) {
          setDiasRestantes(30 - diffDias);
          setResultadoAnterior(resultado);
          setFase('bloqueado');
        } else {
          setFase('inicio');
        }
      } else {
        setFase('inicio');
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
      .limit(100);

    if (data && data.length >= 15) {
      const shuffled = data.sort(() => Math.random() - 0.5);
      setQuestoes(shuffled.slice(0, 15));
    }
  };

  const iniciarDiagnostico = async () => {
    await carregarQuestoes();
    setFase('jogando');
    setQuestaoAtual(0);
    setRespostas([]);
  };

  const processarResposta = useCallback((resposta: string) => {
    if (respondida || questoes.length === 0) return;

    const questao = questoes[questaoAtual];
    const correta = resposta === questao.resposta_correta;

    setRespondida(true);
    setRespostaSelecionada(resposta);

    const novaResposta: Resposta = {
      questaoId: questao.id,
      respostaUsuario: resposta,
      correta,
      dificuldade: questao.dificuldade || 'medio',
      competencia: questao.competencia || 'geral'
    };

    setRespostas(prev => [...prev, novaResposta]);

    setTimeout(() => {
      if (questaoAtual < questoes.length - 1) {
        setQuestaoAtual(prev => prev + 1);
        setRespondida(false);
        setRespostaSelecionada(null);
      } else {
        finalizarDiagnostico([...respostas, novaResposta]);
      }
    }, 1500);
  }, [respondida, questoes, questaoAtual, respostas]);

  const finalizarDiagnostico = async (todasRespostas: Resposta[]) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const acertos = todasRespostas.filter(r => r.correta).length;
    const percentual = Math.round((acertos / todasRespostas.length) * 100);

    let notaTRI = 400 + (percentual * 5);
    notaTRI = Math.min(Math.max(notaTRI, 300), 900);

    let nivel = 'Iniciante';
    if (notaTRI >= 750) nivel = 'Avançado';
    else if (notaTRI >= 600) nivel = 'Intermediário';
    else if (notaTRI >= 450) nivel = 'Básico';

    await supabase.from('diagnostico_resultados').insert({
      user_id: user.id,
      nivel,
      nota_tri: Math.round(notaTRI),
      percentual_geral: percentual,
      total_questoes: todasRespostas.length,
      total_acertos: acertos
    });

    await adicionarXP(supabase, user.id, 100, 'Diagnóstico Completo');

    setResultadoAnterior({
      nivel,
      nota_tri: Math.round(notaTRI),
      percentual_geral: percentual,
      created_at: new Date().toISOString()
    });

    setFase('resultado');
  };

  const getAlternativaCor = (letra: string) => {
    if (!respondida) {
      return 'border-gray-200 hover:border-violet-300 hover:bg-violet-50';
    }
    const questao = questoes[questaoAtual];
    if (letra === questao.resposta_correta) {
      return 'border-emerald-500 bg-emerald-50';
    }
    if (letra === respostaSelecionada) {
      return 'border-red-500 bg-red-50';
    }
    return 'border-gray-200 opacity-50';
  };

  if (loading || fase === 'verificando') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-violet-500/30 border-t-violet-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (fase === 'bloqueado') {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white border-b border-gray-200 px-4 py-4">
          <Link href="/dashboard" className="flex items-center gap-2 text-gray-600">
            <ArrowLeft className="w-5 h-5" />
            <span>Voltar</span>
          </Link>
        </header>
        <main className="max-w-lg mx-auto px-4 py-12 text-center">
          <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
            <Lock className="w-10 h-10 text-gray-400" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Diagnóstico Bloqueado</h1>
          <p className="text-gray-600 mb-6">Você pode refazer o diagnóstico em <strong>{diasRestantes} dias</strong>.</p>
          {resultadoAnterior && (
            <div className="bg-violet-50 rounded-2xl p-6 text-left">
              <h3 className="font-bold text-violet-900 mb-3">Seu último resultado:</h3>
              <p className="text-violet-700">Nível: <strong>{resultadoAnterior.nivel}</strong></p>
              <p className="text-violet-700">Nota TRI: <strong>{resultadoAnterior.nota_tri}</strong></p>
              <p className="text-violet-700">Acertos: <strong>{resultadoAnterior.percentual_geral}%</strong></p>
            </div>
          )}
        </main>
      </div>
    );
  }

  if (fase === 'inicio') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-violet-500 to-purple-600">
        <header className="px-4 py-4">
          <Link href="/dashboard" className="inline-flex items-center gap-2 text-white/80 hover:text-white">
            <ArrowLeft className="w-5 h-5" />
            <span>Voltar</span>
          </Link>
        </header>
        <main className="px-4 py-12 text-center text-white">
          <div className="w-24 h-24 bg-white/20 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <Target className="w-12 h-12" />
          </div>
          <h1 className="text-4xl font-black mb-4">Diagnóstico</h1>
          <p className="text-white/80 text-lg mb-8">Descubra seu nível em matemática</p>
          <div className="bg-white/10 rounded-2xl p-6 mb-8 max-w-sm mx-auto">
            <ul className="text-left space-y-2 text-white/90">
              <li>📝 15 questões de múltipla escolha</li>
              <li>⏱️ Sem limite de tempo</li>
              <li>📊 Resultado com nota TRI simulada</li>
              <li>🔒 Pode refazer após 30 dias</li>
              <li>⭐ Ganhe 100 XP ao completar</li>
            </ul>
          </div>
          <button onClick={iniciarDiagnostico} className="bg-white text-violet-600 font-bold text-xl px-12 py-4 rounded-2xl hover:bg-violet-50 transition-all">
            🎯 Iniciar Diagnóstico
          </button>
        </main>
      </div>
    );
  }

  if (fase === 'resultado' && resultadoAnterior) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-violet-500 to-purple-600">
        <main className="px-4 py-12 text-center text-white">
          <div className="w-24 h-24 bg-white/20 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <Trophy className="w-12 h-12" />
          </div>
          <h1 className="text-4xl font-black mb-2">Diagnóstico Completo!</h1>
          <p className="text-white/80 mb-8">+100 XP</p>
          <div className="bg-white/10 rounded-2xl p-6 mb-6 max-w-sm mx-auto">
            <p className="text-white/70 mb-1">Seu nível</p>
            <p className="text-4xl font-black mb-4">{resultadoAnterior.nivel}</p>
            <p className="text-white/70 mb-1">Nota TRI estimada</p>
            <p className="text-5xl font-black text-yellow-300">{resultadoAnterior.nota_tri}</p>
          </div>
          <div className="bg-white/10 rounded-2xl p-4 mb-8 max-w-sm mx-auto">
            <p className="text-white/70">Taxa de acerto</p>
            <p className="text-2xl font-bold">{resultadoAnterior.percentual_geral}%</p>
          </div>
          <Link href="/dashboard" className="inline-block bg-white text-violet-600 font-bold px-8 py-3 rounded-xl hover:bg-violet-50 transition-all">
            Voltar ao Dashboard
          </Link>
        </main>
      </div>
    );
  }

  const questao = questoes[questaoAtual];
  if (!questao) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-violet-500" />
            <span className="font-bold text-gray-900">Questão {questaoAtual + 1}/15</span>
          </div>
        </div>
      </header>
      <div className="h-1 bg-gray-200">
        <div className="h-full bg-violet-500 transition-all" style={{ width: `${((questaoAtual + 1) / 15) * 100}%` }} />
      </div>
      <main className="max-w-2xl mx-auto px-4 py-6">
        <div className="bg-white rounded-2xl p-6 mb-6 border border-gray-100">
          <MathText text={questao.enunciado} className="text-gray-900" />
        </div>
        <div className="space-y-3">
          {['a', 'b', 'c', 'd', 'e'].map((letra) => {
            const texto = questao[`alternativa_${letra}` as keyof Questao] as string;
            if (!texto) return null;
            return (
              <button key={letra} onClick={() => !respondida && processarResposta(letra)} disabled={respondida} className={`w-full text-left p-4 rounded-xl border-2 transition-all ${getAlternativaCor(letra)}`}>
                <div className="flex items-start gap-3">
                  <span className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm shrink-0 ${respondida && letra === questao.resposta_correta ? 'bg-emerald-500 text-white' : respondida && letra === respostaSelecionada ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-600'}`}>
                    {letra.toUpperCase()}
                  </span>
                  <MathText text={texto} className="text-gray-700 flex-1" />
                </div>
              </button>
            );
          })}
        </div>
        {respondida && (
          <div className={`mt-6 p-4 rounded-xl ${respostaSelecionada === questao.resposta_correta ? 'bg-emerald-100 border border-emerald-300' : 'bg-red-100 border border-red-300'}`}>
            <div className="flex items-center gap-2">
              {respostaSelecionada === questao.resposta_correta ? (
                <><CheckCircle className="w-5 h-5 text-emerald-600" /><span className="font-bold text-emerald-700">Correto!</span></>
              ) : (
                <><XCircle className="w-5 h-5 text-red-600" /><span className="font-bold text-red-700">Incorreto</span></>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
