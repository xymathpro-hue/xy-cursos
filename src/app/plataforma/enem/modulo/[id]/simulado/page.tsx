
'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { ArrowLeft, Clock, Trophy, Target, TrendingUp, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
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
  dificuldade: string;
  pontuacao_tri: number;
}

interface Resposta {
  questaoId: string;
  respostaUsuario: string;
  correta: boolean;
  dificuldade: string;
  pontuacaoTri: number;
}

export default function SimuladoPage() {
  const params = useParams();
  const router = useRouter();
  const supabase = createClientComponentClient();

  const moduloId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [fase, setFase] = useState<'inicio' | 'jogando' | 'resultado'>('inicio');
  const [questoes, setQuestoes] = useState<Questao[]>([]);
  const [questaoAtual, setQuestaoAtual] = useState(0);
  const [respostas, setRespostas] = useState<Resposta[]>([]);
  const [respondida, setRespondida] = useState(false);
  const [respostaSelecionada, setRespostaSelecionada] = useState<string | null>(null);
  const [tempoRestante, setTempoRestante] = useState(45 * 60); // 45 minutos
  const [moduloNome, setModuloNome] = useState('');
  const [userId, setUserId] = useState<string | null>(null);
  const [notaTRI, setNotaTRI] = useState(0);
  const [analise, setAnalise] = useState({ facil: { total: 0, acertos: 0 }, medio: { total: 0, acertos: 0 }, dificil: { total: 0, acertos: 0 } });

  useEffect(() => {
    async function checkAuth() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }
      setUserId(user.id);

      // Buscar nome do módulo
      const { data: moduloData } = await supabase
        .from('modulos')
        .select('titulo')
        .eq('id', moduloId)
        .single();

      if (moduloData) {
        setModuloNome(moduloData.titulo);
      }

      setLoading(false);
    }
    checkAuth();
  }, [supabase, router, moduloId]);

  // Timer
  useEffect(() => {
    if (fase !== 'jogando' || tempoRestante <= 0) return;

    const timer = setInterval(() => {
      setTempoRestante(prev => {
        if (prev <= 1) {
          finalizarSimulado();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [fase, tempoRestante]);

  const formatarTempo = (segundos: number) => {
    const min = Math.floor(segundos / 60);
    const seg = segundos % 60;
    return `${min.toString().padStart(2, '0')}:${seg.toString().padStart(2, '0')}`;
  };

  const carregarQuestoes = async () => {
    // Buscar aulas do módulo
    const { data: aulas } = await supabase
      .from('aulas')
      .select('id')
      .eq('modulo_id', moduloId);

    if (!aulas || aulas.length === 0) return;

    const aulasIds = aulas.map(a => a.id);

    // Buscar questões de todas as aulas do módulo
    const { data: questoesData } = await supabase
      .from('questoes')
      .select('*')
      .in('aula_id', aulasIds)
      .eq('ativo', true);

    if (questoesData && questoesData.length > 0) {
      // Separar por dificuldade
      const faceis = questoesData.filter(q => q.dificuldade === 'facil');
      const medias = questoesData.filter(q => q.dificuldade === 'medio');
      const dificeis = questoesData.filter(q => q.dificuldade === 'dificil');

      // Embaralhar cada grupo
      const shuffle = (arr: any[]) => arr.sort(() => Math.random() - 0.5);

      // Pegar 10 de cada (ou o máximo disponível)
      const selecionadas = [
        ...shuffle(faceis).slice(0, 10),
        ...shuffle(medias).slice(0, 10),
        ...shuffle(dificeis).slice(0, 10)
      ];

      // Embaralhar todas juntas
      setQuestoes(shuffle(selecionadas));
    }
  };

  const iniciarSimulado = async () => {
    await carregarQuestoes();
    setFase('jogando');
    setQuestaoAtual(0);
    setRespostas([]);
    setTempoRestante(45 * 60);
  };

  const responderQuestao = async (letra: string) => {
    if (respondida) return;

    const questao = questoes[questaoAtual];
    const correta = letra.toUpperCase() === questao.resposta_correta.toUpperCase();

    setRespondida(true);
    setRespostaSelecionada(letra);

    const novaResposta: Resposta = {
      questaoId: questao.id,
      respostaUsuario: letra,
      correta,
      dificuldade: questao.dificuldade || 'medio',
      pontuacaoTri: questao.pontuacao_tri || 500
    };

    setRespostas(prev => [...prev, novaResposta]);
  };

  const proximaQuestao = () => {
    if (questaoAtual < questoes.length - 1) {
      setQuestaoAtual(prev => prev + 1);
      setRespondida(false);
      setRespostaSelecionada(null);
    } else {
      finalizarSimulado();
    }
  };

  const calcularNotaTRI = useCallback((todasRespostas: Resposta[]) => {
    // Análise por dificuldade
    const analiseTemp = {
      facil: { total: 0, acertos: 0 },
      medio: { total: 0, acertos: 0 },
      dificil: { total: 0, acertos: 0 }
    };

    todasRespostas.forEach(r => {
      const dif = r.dificuldade as 'facil' | 'medio' | 'dificil';
      if (analiseTemp[dif]) {
        analiseTemp[dif].total++;
        if (r.correta) analiseTemp[dif].acertos++;
      }
    });

    setAnalise(analiseTemp);

    // Cálculo TRI simplificado
    // Base: 400 pontos
    // Fáceis: +15 pontos cada acerto
    // Médias: +35 pontos cada acerto
    // Difíceis: +50 pontos cada acerto
    let nota = 400;
    nota += analiseTemp.facil.acertos * 15;
    nota += analiseTemp.medio.acertos * 35;
    nota += analiseTemp.dificil.acertos * 50;

    // Penalidade por incoerência (errar fácil e acertar difícil)
    const taxaFacil = analiseTemp.facil.total > 0 ? analiseTemp.facil.acertos / analiseTemp.facil.total : 0;
    const taxaDificil = analiseTemp.dificil.total > 0 ? analiseTemp.dificil.acertos / analiseTemp.dificil.total : 0;
    
    if (taxaDificil > taxaFacil + 0.3) {
      nota -= 30; // Penalidade por incoerência
    }

    // Limitar entre 400 e 900
    nota = Math.max(400, Math.min(900, nota));

    return Math.round(nota);
  }, []);

  const finalizarSimulado = useCallback(async () => {
    if (!userId) return;

    const nota = calcularNotaTRI(respostas);
    setNotaTRI(nota);

    // Calcular XP baseado na nota
    let xp = 50; // Base
    if (nota >= 700) xp = 150;
    else if (nota >= 600) xp = 100;
    else if (nota >= 500) xp = 75;

    await adicionarXP(supabase, userId, xp, `Simulado: ${moduloNome}`);

    // Salvar resultado do simulado
    await supabase.from('simulado_resultados').insert({
      user_id: userId,
      modulo_id: moduloId,
      nota_tri: nota,
      total_questoes: questoes.length,
      total_acertos: respostas.filter(r => r.correta).length,
      tempo_usado: (45 * 60) - tempoRestante
    }).select();

    setFase('resultado');
  }, [userId, respostas, questoes, tempoRestante, moduloId, moduloNome, calcularNotaTRI, supabase]);

  const getNivelNota = (nota: number) => {
    if (nota >= 800) return { nivel: 'Elite', cor: 'text-purple-600', bg: 'bg-purple-100', emoji: '👑' };
    if (nota >= 700) return { nivel: 'Avançado', cor: 'text-red-600', bg: 'bg-red-100', emoji: '🔥' };
    if (nota >= 600) return { nivel: 'Intermediário', cor: 'text-yellow-600', bg: 'bg-yellow-100', emoji: '⭐' };
    if (nota >= 500) return { nivel: 'Básico', cor: 'text-blue-600', bg: 'bg-blue-100', emoji: '📚' };
    return { nivel: 'Iniciante', cor: 'text-gray-600', bg: 'bg-gray-100', emoji: '🌱' };
  };

  const getAlternativaCor = (letra: string) => {
    if (!respondida) {
      return 'border-gray-200 hover:border-yellow-300 hover:bg-yellow-50';
    }
    const questao = questoes[questaoAtual];
    if (letra.toUpperCase() === questao.resposta_correta.toUpperCase()) {
      return 'border-emerald-500 bg-emerald-50';
    }
    if (letra.toUpperCase() === respostaSelecionada?.toUpperCase()) {
      return 'border-red-500 bg-red-50';
    }
    return 'border-gray-200 opacity-50';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-yellow-500/30 border-t-yellow-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Tela Inicial
  if (fase === 'inicio') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-yellow-500 to-orange-500">
        <header className="px-4 py-4">
          <Link href={`/plataforma/enem/modulo/${moduloId}`} className="inline-flex items-center gap-2 text-white/80 hover:text-white">
            <ArrowLeft className="w-5 h-5" />
            <span>Voltar</span>
          </Link>
        </header>
        <main className="px-4 py-8 text-center text-white">
          <div className="w-24 h-24 bg-white/20 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <Trophy className="w-12 h-12" />
          </div>
          <h1 className="text-4xl font-black mb-2">Simulado</h1>
          <p className="text-white/80 text-lg mb-8">{moduloNome}</p>
          
          <div className="bg-white/10 rounded-2xl p-6 mb-8 max-w-sm mx-auto">
            <ul className="text-left space-y-3 text-white/90">
              <li className="flex items-center gap-3">
                <Target className="w-5 h-5" />
                <span>30 questões mistas</span>
              </li>
              <li className="flex items-center gap-3">
                <Clock className="w-5 h-5" />
                <span>45 minutos de prova</span>
              </li>
              <li className="flex items-center gap-3">
                <TrendingUp className="w-5 h-5" />
                <span>Nota TRI simulada</span>
              </li>
              <li className="flex items-center gap-3">
                <Trophy className="w-5 h-5" />
                <span>Ganhe até 150 XP</span>
              </li>
            </ul>
          </div>

          <div className="bg-white/10 rounded-2xl p-4 mb-8 max-w-sm mx-auto">
            <p className="text-white/70 text-sm">⚠️ Ao iniciar, o tempo começa a contar. Boa prova!</p>
          </div>

          <button
            onClick={iniciarSimulado}
            className="bg-white text-orange-600 font-bold text-xl px-12 py-4 rounded-2xl hover:bg-orange-50 transition-all"
          >
            🚀 Iniciar Simulado
          </button>
        </main>
      </div>
    );
  }

  // Tela de Resultado
  if (fase === 'resultado') {
    const acertos = respostas.filter(r => r.correta).length;
    const nivelInfo = getNivelNota(notaTRI);

    return (
      <div className="min-h-screen bg-gradient-to-b from-yellow-500 to-orange-500">
        <main className="px-4 py-8 text-white">
          <div className="max-w-lg mx-auto">
            {/* Nota TRI */}
            <div className="text-center mb-8">
              <div className="w-24 h-24 bg-white/20 rounded-3xl flex items-center justify-center mx-auto mb-4">
                <span className="text-5xl">{nivelInfo.emoji}</span>
              </div>
              <h1 className="text-3xl font-black mb-2">Simulado Concluído!</h1>
              <p className="text-white/80">{moduloNome}</p>
            </div>

            {/* Card Nota */}
            <div className="bg-white rounded-3xl p-6 mb-6 text-gray-900">
              <div className="text-center mb-6">
                <p className="text-sm text-gray-500 mb-1">Sua Nota TRI Estimada</p>
                <p className="text-6xl font-black text-orange-500">{notaTRI}</p>
                <span className={`inline-block mt-2 px-4 py-1 rounded-full text-sm font-bold ${nivelInfo.bg} ${nivelInfo.cor}`}>
                  {nivelInfo.nivel}
                </span>
              </div>

              {/* Barra visual */}
              <div className="mb-6">
                <div className="flex justify-between text-xs text-gray-400 mb-1">
                  <span>400</span>
                  <span>900</span>
                </div>
                <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-yellow-400 to-orange-500 transition-all"
                    style={{ width: `${((notaTRI - 400) / 500) * 100}%` }}
                  />
                </div>
              </div>

              {/* Resumo */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-50 rounded-xl p-4 text-center">
                  <p className="text-3xl font-black text-gray-900">{acertos}/{questoes.length}</p>
                  <p className="text-xs text-gray-500">Acertos</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4 text-center">
                  <p className="text-3xl font-black text-gray-900">{formatarTempo((45 * 60) - tempoRestante)}</p>
                  <p className="text-xs text-gray-500">Tempo usado</p>
                </div>
              </div>

              {/* Análise por dificuldade */}
              <div className="space-y-3">
                <p className="font-bold text-gray-700">📊 Desempenho por Nível</p>
                
                <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-xl">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🟢</span>
                    <span className="font-medium text-gray-700">Fáceis</span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-emerald-600">{analise.facil.acertos}/{analise.facil.total}</span>
                    <span className="text-gray-400 text-sm ml-2">
                      ({analise.facil.total > 0 ? Math.round((analise.facil.acertos / analise.facil.total) * 100) : 0}%)
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-xl">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🟡</span>
                    <span className="font-medium text-gray-700">Médias</span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-yellow-600">{analise.medio.acertos}/{analise.medio.total}</span>
                    <span className="text-gray-400 text-sm ml-2">
                      ({analise.medio.total > 0 ? Math.round((analise.medio.acertos / analise.medio.total) * 100) : 0}%)
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-red-50 rounded-xl">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🔴</span>
                    <span className="font-medium text-gray-700">Difíceis</span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-red-600">{analise.dificil.acertos}/{analise.dificil.total}</span>
                    <span className="text-gray-400 text-sm ml-2">
                      ({analise.dificil.total > 0 ? Math.round((analise.dificil.acertos / analise.dificil.total) * 100) : 0}%)
                    </span>
                  </div>
                </div>
              </div>

              {/* Dica */}
              <div className="mt-6 p-4 bg-blue-50 rounded-xl">
                <p className="text-sm text-blue-700">
                  {notaTRI >= 700 
                    ? '🎉 Excelente! Você está pronto para gabaritar no ENEM!'
                    : notaTRI >= 600
                      ? '⭐ Muito bom! Continue praticando para subir ainda mais!'
                      : notaTRI >= 500
                        ? '📚 Bom progresso! Foque nas questões médias e difíceis.'
                        : '🌱 Continue estudando! Revise a teoria e refaça os exercícios.'
                  }
                </p>
              </div>
            </div>

            {/* Botões */}
            <div className="flex gap-4">
              <button
                onClick={() => {
                  setFase('inicio');
                  setRespostas([]);
                  setQuestaoAtual(0);
                }}
                className="flex-1 bg-white/20 text-white font-bold py-4 rounded-xl hover:bg-white/30 transition-all"
              >
                Refazer
              </button>
              <Link
                href={`/plataforma/enem/modulo/${moduloId}`}
                className="flex-1 bg-white text-orange-600 font-bold py-4 rounded-xl hover:bg-orange-50 transition-all text-center"
              >
                Voltar
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Tela de Questões
  const questao = questoes[questaoAtual];
  if (!questao) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Carregando questões...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header com Timer */}
      <header className="bg-white border-b-4 border-yellow-500 px-4 py-3 sticky top-0 z-10">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-500" />
            <span className="font-bold text-gray-900">
              {questaoAtual + 1}/{questoes.length}
            </span>
          </div>
          
          {/* Timer */}
          <div className={`flex items-center gap-2 px-4 py-2 rounded-full font-mono font-bold ${
            tempoRestante <= 300 ? 'bg-red-100 text-red-600' : 'bg-yellow-100 text-yellow-700'
          }`}>
            <Clock className="w-4 h-4" />
            {formatarTempo(tempoRestante)}
          </div>
        </div>
      </header>

      {/* Barra de progresso */}
      <div className="h-2 bg-gray-200">
        <div 
          className="h-full bg-yellow-500 transition-all"
          style={{ width: `${((questaoAtual + 1) / questoes.length) * 100}%` }}
        />
      </div>

      <main className="max-w-2xl mx-auto px-4 py-6">
        {/* Badge de dificuldade */}
        <div className="flex items-center gap-2 mb-4">
          <span className={`px-3 py-1 rounded-full text-xs font-bold ${
            questao.dificuldade === 'facil' ? 'bg-emerald-100 text-emerald-700' :
            questao.dificuldade === 'medio' ? 'bg-yellow-100 text-yellow-700' :
            'bg-red-100 text-red-700'
          }`}>
            {questao.dificuldade === 'facil' ? '🟢 Fácil' :
             questao.dificuldade === 'medio' ? '🟡 Média' : '🔴 Difícil'}
          </span>
        </div>

        {/* Enunciado */}
        <div className="bg-white rounded-2xl p-6 mb-6 border border-gray-100">
          <MathText text={questao.enunciado} className="text-gray-900" />
        </div>

        {/* Alternativas */}
        <div className="space-y-3">
          {['a', 'b', 'c', 'd', 'e'].map((letra) => {
            const texto = questao[`alternativa_${letra}` as keyof Questao] as string;
            if (!texto) return null;

            return (
              <button
                key={letra}
                onClick={() => responderQuestao(letra)}
                disabled={respondida}
                className={`w-full text-left p-4 rounded-xl border-2 transition-all ${getAlternativaCor(letra)}`}
              >
                <div className="flex items-start gap-3">
                  <span className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm shrink-0 ${
                    respondida && letra.toUpperCase() === questao.resposta_correta.toUpperCase()
                      ? 'bg-emerald-500 text-white'
                      : respondida && letra.toUpperCase() === respostaSelecionada?.toUpperCase()
                        ? 'bg-red-500 text-white'
                        : 'bg-gray-100 text-gray-600'
                  }`}>
                    {letra.toUpperCase()}
                  </span>
                  <MathText text={texto} className="text-gray-700 flex-1" />
                </div>
              </button>
            );
          })}
        </div>

        {/* Feedback */}
        {respondida && (
          <div className={`mt-6 p-4 rounded-xl ${
            respostaSelecionada?.toUpperCase() === questao.resposta_correta.toUpperCase()
              ? 'bg-emerald-100 border border-emerald-300'
              : 'bg-red-100 border border-red-300'
          }`}>
            <div className="flex items-center gap-2 mb-2">
              {respostaSelecionada?.toUpperCase() === questao.resposta_correta.toUpperCase() ? (
                <>
                  <CheckCircle className="w-5 h-5 text-emerald-600" />
                  <span className="font-bold text-emerald-700">Correto!</span>
                </>
              ) : (
                <>
                  <XCircle className="w-5 h-5 text-red-600" />
                  <span className="font-bold text-red-700">Incorreto</span>
                </>
              )}
            </div>
            {questao.explicacao && (
              <MathText text={questao.explicacao} className="text-gray-600 text-sm" />
            )}
          </div>
        )}

        {/* Botão próxima */}
        {respondida && (
          <button
            onClick={proximaQuestao}
            className="w-full mt-6 bg-yellow-500 text-white font-bold py-4 rounded-xl hover:bg-yellow-600 transition-all flex items-center justify-center gap-2"
          >
            {questaoAtual < questoes.length - 1 ? (
              <>Próxima Questão</>
            ) : (
              <>Ver Resultado</>
            )}
          </button>
        )}
      </main>
    </div>
  );
}
