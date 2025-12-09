'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { ArrowLeft, Clock, Trophy, Target, TrendingUp, BookOpen, AlertCircle } from 'lucide-react';
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
  respostaCorreta: string;
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
  const [respostaSelecionada, setRespostaSelecionada] = useState<string | null>(null);
  const [tempoRestante, setTempoRestante] = useState(45 * 60);
  const [moduloNome, setModuloNome] = useState('');
  const [userId, setUserId] = useState<string | null>(null);
  const [notaTRI, setNotaTRI] = useState(0);
  const [analise, setAnalise] = useState({ facil: { total: 0, acertos: 0 }, medio: { total: 0, acertos: 0 }, dificil: { total: 0, acertos: 0 } });

  const calcularNotaTRI = useCallback((todasRespostas: Resposta[]) => {
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

    let nota = 400;
    nota += analiseTemp.facil.acertos * 15;
    nota += analiseTemp.medio.acertos * 35;
    nota += analiseTemp.dificil.acertos * 50;

    const taxaFacil = analiseTemp.facil.total > 0 ? analiseTemp.facil.acertos / analiseTemp.facil.total : 0;
    const taxaDificil = analiseTemp.dificil.total > 0 ? analiseTemp.dificil.acertos / analiseTemp.dificil.total : 0;
    
    if (taxaDificil > taxaFacil + 0.3) {
      nota -= 30;
    }

    nota = Math.max(400, Math.min(900, nota));

    return Math.round(nota);
  }, []);

  const finalizarSimulado = useCallback(async () => {
    if (!userId) return;

    const nota = calcularNotaTRI(respostas);
    setNotaTRI(nota);

    let xp = 50;
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

    // Salvar questões erradas no Caderno de Erros
    const erradas = respostas.filter(r => !r.correta);
    for (const errada of erradas) {
      // Verificar se já existe
      const { data: existente } = await supabase
        .from('caderno_erros')
        .select('id')
        .eq('user_id', userId)
        .eq('questao_id', errada.questaoId)
        .single();

      if (!existente) {
        await supabase.from('caderno_erros').insert({
          user_id: userId,
          questao_id: errada.questaoId,
          resposta_usuario: errada.respostaUsuario.toUpperCase(),
          resposta_correta: errada.respostaCorreta.toUpperCase(),
          revisado: false
        });
      }
    }

    setFase('resultado');
  }, [userId, respostas, questoes, tempoRestante, moduloId, moduloNome, calcularNotaTRI, supabase]);

  useEffect(() => {
    async function checkAuth() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }
      setUserId(user.id);

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
  }, [fase, tempoRestante, finalizarSimulado]);

  const formatarTempo = (segundos: number) => {
    const min = Math.floor(segundos / 60);
    const seg = segundos % 60;
    return `${min.toString().padStart(2, '0')}:${seg.toString().padStart(2, '0')}`;
  };

  const carregarQuestoes = async () => {
    const { data: questoesData } = await supabase
      .from('questoes')
      .select('*')
      .eq('tipo', 'simulado')
      .eq('ativo', true);

    if (questoesData && questoesData.length > 0) {
      const faceis = questoesData.filter(q => q.dificuldade === 'facil');
      const medias = questoesData.filter(q => q.dificuldade === 'medio');
      const dificeis = questoesData.filter(q => q.dificuldade === 'dificil');

      const shuffle = (arr: Questao[]) => arr.sort(() => Math.random() - 0.5);

      const selecionadas = [
        ...shuffle(faceis).slice(0, 10),
        ...shuffle(medias).slice(0, 10),
        ...shuffle(dificeis).slice(0, 10)
      ];

      setQuestoes(shuffle(selecionadas));
    }
  };

  const iniciarSimulado = async () => {
    await carregarQuestoes();
    setFase('jogando');
    setQuestaoAtual(0);
    setRespostas([]);
    setTempoRestante(45 * 60);
    setRespostaSelecionada(null);
  };

  const selecionarAlternativa = (letra: string) => {
    setRespostaSelecionada(letra);
  };

  const proximaQuestao = () => {
    if (!respostaSelecionada) return;

    const questao = questoes[questaoAtual];
    const correta = respostaSelecionada.toUpperCase() === questao.resposta_correta.toUpperCase();

    const novaResposta: Resposta = {
      questaoId: questao.id,
      respostaUsuario: respostaSelecionada,
      correta,
      dificuldade: questao.dificuldade || 'medio',
      pontuacaoTri: questao.pontuacao_tri || 500,
      respostaCorreta: questao.resposta_correta
    };

    setRespostas(prev => [...prev, novaResposta]);

    if (questaoAtual < questoes.length - 1) {
      setQuestaoAtual(prev => prev + 1);
      setRespostaSelecionada(null);
    } else {
      // Última questão - finalizar
      const todasRespostas = [...respostas, novaResposta];
      setRespostas(todasRespostas);
      setTimeout(() => finalizarSimulado(), 100);
    }
  };

  const getNivelNota = (nota: number) => {
    if (nota >= 800) return { nivel: 'Elite', cor: 'text-purple-600', bg: 'bg-purple-100', emoji: '👑' };
    if (nota >= 700) return { nivel: 'Avançado', cor: 'text-red-600', bg: 'bg-red-100', emoji: '🔥' };
    if (nota >= 600) return { nivel: 'Intermediário', cor: 'text-yellow-600', bg: 'bg-yellow-100', emoji: '⭐' };
    if (nota >= 500) return { nivel: 'Básico', cor: 'text-blue-600', bg: 'bg-blue-100', emoji: '📚' };
    return { nivel: 'Iniciante', cor: 'text-gray-600', bg: 'bg-gray-100', emoji: '🌱' };
  };

  const getDicaEstudo = () => {
    const erros = respostas.filter(r => !r.correta).length;
    const taxaAcerto = ((respostas.length - erros) / respostas.length) * 100;
    
    const errosFaceis = analise.facil.total - analise.facil.acertos;
    const errosMedios = analise.medio.total - analise.medio.acertos;
    const errosDificeis = analise.dificil.total - analise.dificil.acertos;

    if (taxaAcerto >= 90) {
      return {
        titulo: '🎉 Excelente desempenho!',
        mensagem: 'Você está muito bem preparado! Continue praticando para manter o nível.',
        acao: 'Tente o próximo módulo ou refaça para melhorar ainda mais.'
      };
    } else if (taxaAcerto >= 70) {
      return {
        titulo: '⭐ Muito bom!',
        mensagem: 'Você domina a maioria dos conceitos. Foque nos pontos que ainda precisam de atenção.',
        acao: errosDificeis > errosFaceis 
          ? 'Revise as questões difíceis no Caderno de Erros.' 
          : 'Pratique mais questões de nível médio.'
      };
    } else if (taxaAcerto >= 50) {
      return {
        titulo: '📚 Bom progresso!',
        mensagem: 'Você está no caminho certo, mas precisa reforçar alguns conceitos.',
        acao: errosFaceis > 3 
          ? 'Revise a teoria básica antes de continuar.' 
          : 'Foque nas questões médias e difíceis no Caderno de Erros.'
      };
    } else {
      return {
        titulo: '🌱 Continue estudando!',
        mensagem: 'Não desanime! Revise a teoria e refaça os exercícios básicos.',
        acao: 'Recomendamos revisar a teoria de cada aula antes de refazer o simulado.'
      };
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-yellow-500/30 border-t-yellow-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  // TELA INICIAL
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
                <span>30 questões exclusivas</span>
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
            <p className="text-white/70 text-sm">⚠️ Funciona como prova real: você só verá o resultado no final!</p>
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

  // TELA DE RESULTADO
  if (fase === 'resultado') {
    const acertos = respostas.filter(r => r.correta).length;
    const erros = respostas.length - acertos;
    const nivelInfo = getNivelNota(notaTRI);
    const dica = getDicaEstudo();

    return (
      <div className="min-h-screen bg-gradient-to-b from-yellow-500 to-orange-500">
        <main className="px-4 py-8 text-white">
          <div className="max-w-lg mx-auto">
            <div className="text-center mb-8">
              <div className="w-24 h-24 bg-white/20 rounded-3xl flex items-center justify-center mx-auto mb-4">
                <span className="text-5xl">{nivelInfo.emoji}</span>
              </div>
              <h1 className="text-3xl font-black mb-2">Simulado Concluído!</h1>
              <p className="text-white/80">{moduloNome}</p>
            </div>

            <div className="bg-white rounded-3xl p-6 mb-6 text-gray-900">
              {/* Nota TRI */}
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

              {/* Acertos e Erros */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-emerald-50 rounded-xl p-4 text-center">
                  <p className="text-3xl font-black text-emerald-600">{acertos}</p>
                  <p className="text-xs text-emerald-700">Acertos</p>
                </div>
                <div className="bg-red-50 rounded-xl p-4 text-center">
                  <p className="text-3xl font-black text-red-600">{erros}</p>
                  <p className="text-xs text-red-700">Erros</p>
                </div>
              </div>

              {/* Desempenho por Nível */}
              <div className="space-y-3 mb-6">
                <p className="font-bold text-gray-700">📊 Desempenho por Nível</p>
                
                <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-xl">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🟢</span>
                    <span className="font-medium text-gray-700">Fáceis</span>
                  </div>
                  <span className="font-bold text-emerald-600">{analise.facil.acertos}/{analise.facil.total}</span>
                </div>

                <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-xl">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🟡</span>
                    <span className="font-medium text-gray-700">Médias</span>
                  </div>
                  <span className="font-bold text-yellow-600">{analise.medio.acertos}/{analise.medio.total}</span>
                </div>

                <div className="flex items-center justify-between p-3 bg-red-50 rounded-xl">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🔴</span>
                    <span className="font-medium text-gray-700">Difíceis</span>
                  </div>
                  <span className="font-bold text-red-600">{analise.dificil.acertos}/{analise.dificil.total}</span>
                </div>
              </div>

              {/* Dica de Estudo */}
              <div className="bg-blue-50 rounded-xl p-4 mb-4">
                <h3 className="font-bold text-blue-800 mb-2">{dica.titulo}</h3>
                <p className="text-sm text-blue-700 mb-2">{dica.mensagem}</p>
                <p className="text-sm text-blue-600 font-medium">💡 {dica.acao}</p>
              </div>

              {/* Alerta Caderno de Erros */}
              {erros > 0 && (
                <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-orange-800">
                      {erros} {erros === 1 ? 'questão foi adicionada' : 'questões foram adicionadas'} ao Caderno de Erros
                    </p>
                    <p className="text-sm text-orange-600">Revise as questões para entender seus erros e ver as soluções.</p>
                  </div>
                </div>
              )}
            </div>

            {/* Botões */}
            <div className="space-y-3">
              {erros > 0 && (
                <Link
                  href="/plataforma/enem/caderno-erros"
                  className="w-full bg-white text-orange-600 font-bold py-4 rounded-xl hover:bg-orange-50 transition-all flex items-center justify-center gap-2"
                >
                  <BookOpen className="w-5 h-5" />
                  Revisar no Caderno de Erros
                </Link>
              )}
              
              <div className="flex gap-3">
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
                  className="flex-1 bg-white/20 text-white font-bold py-4 rounded-xl hover:bg-white/30 transition-all text-center"
                >
                  Voltar
                </Link>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // TELA DE QUESTÕES (sem feedback imediato)
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
      <header className="bg-white border-b-4 border-yellow-500 px-4 py-3 sticky top-0 z-10">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-500" />
            <span className="font-bold text-gray-900">
              {questaoAtual + 1}/{questoes.length}
            </span>
          </div>
          
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
        {/* Enunciado */}
        <div className="bg-white rounded-2xl p-6 mb-6 border border-gray-100">
          <MathText text={questao.enunciado} className="text-gray-900" />
        </div>

        {/* Alternativas */}
        <div className="space-y-3">
          {['a', 'b', 'c', 'd', 'e'].map((letra) => {
            const texto = questao[`alternativa_${letra}` as keyof Questao] as string;
            if (!texto) return null;

            const selecionada = respostaSelecionada?.toUpperCase() === letra.toUpperCase();

            return (
              <button
                key={letra}
                onClick={() => selecionarAlternativa(letra)}
                className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                  selecionada 
                    ? 'border-yellow-500 bg-yellow-50' 
                    : 'border-gray-200 hover:border-yellow-300 hover:bg-yellow-50'
                }`}
              >
                <div className="flex items-start gap-3">
                  <span className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm shrink-0 ${
                    selecionada 
                      ? 'bg-yellow-500 text-white' 
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

        {/* Botão Próxima/Finalizar */}
        <button
          onClick={proximaQuestao}
          disabled={!respostaSelecionada}
          className={`w-full mt-6 font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2 ${
            respostaSelecionada
              ? 'bg-yellow-500 text-white hover:bg-yellow-600'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          {questaoAtual < questoes.length - 1 ? 'Próxima Questão' : 'Finalizar Simulado'}
        </button>
      </main>
    </div>
  );
}
