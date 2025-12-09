'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { ArrowLeft, Trophy, Target, BookOpen, AlertCircle, RotateCcw } from 'lucide-react';
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
}

interface Resposta {
  questaoId: string;
  respostaUsuario: string;
  correta: boolean;
  respostaCorreta: string;
}

export default function ExerciciosPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClientComponentClient();

  const moduloId = params.id as string;
  const aulaId = params.aulaId as string;
  const nivel = searchParams.get('nivel') || 'facil';

  const [loading, setLoading] = useState(true);
  const [fase, setFase] = useState<'jogando' | 'resultado'>('jogando');
  const [questoes, setQuestoes] = useState<Questao[]>([]);
  const [questaoAtual, setQuestaoAtual] = useState(0);
  const [respostas, setRespostas] = useState<Resposta[]>([]);
  const [respostaSelecionada, setRespostaSelecionada] = useState<string | null>(null);
  const [aulaNome, setAulaNome] = useState('');
  const [userId, setUserId] = useState<string | null>(null);
  const [xpGanho, setXpGanho] = useState(0);

  const getNivelInfo = () => {
    switch (nivel) {
      case 'facil':
        return { nome: 'Fácil', cor: 'emerald', emoji: '🟢', xpBase: 5 };
      case 'medio':
        return { nome: 'Médio', cor: 'yellow', emoji: '🟡', xpBase: 10 };
      case 'dificil':
        return { nome: 'Difícil', cor: 'red', emoji: '🔴', xpBase: 15 };
      default:
        return { nome: 'Fácil', cor: 'emerald', emoji: '🟢', xpBase: 5 };
    }
  };

  const nivelInfo = getNivelInfo();

  useEffect(() => {
    async function fetchData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }
      setUserId(user.id);

      // Buscar nome da aula
      const { data: aulaData } = await supabase
        .from('aulas')
        .select('titulo')
        .eq('id', aulaId)
        .single();

      if (aulaData) {
        setAulaNome(aulaData.titulo);
      }

      // Buscar questões da aula filtradas por nível
      const { data: questoesData } = await supabase
        .from('questoes')
        .select('*')
        .eq('aula_id', aulaId)
        .eq('dificuldade', nivel)
        .eq('ativo', true)
        .order('ordem');

      if (questoesData && questoesData.length > 0) {
        setQuestoes(questoesData);
      }

      setLoading(false);
    }

    fetchData();
  }, [supabase, router, aulaId, nivel]);

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
      respostaCorreta: questao.resposta_correta
    };

    const novasRespostas = [...respostas, novaResposta];
    setRespostas(novasRespostas);

    if (questaoAtual < questoes.length - 1) {
      setQuestaoAtual(prev => prev + 1);
      setRespostaSelecionada(null);
    } else {
      // Última questão - finalizar
      finalizarExercicios(novasRespostas);
    }
  };

  const finalizarExercicios = async (todasRespostas: Resposta[]) => {
    if (!userId) return;

    const acertos = todasRespostas.filter(r => r.correta).length;
    const xp = acertos * nivelInfo.xpBase;
    setXpGanho(xp);

    // Salvar XP
    await adicionarXP(supabase, userId, xp, `${aulaNome} - Nível ${nivelInfo.nome}`);

    // Salvar respostas no banco
    for (const resposta of todasRespostas) {
      await supabase.from('user_respostas').insert({
        user_id: userId,
        questao_id: resposta.questaoId,
        resposta: resposta.respostaUsuario.toUpperCase(),
        correta: resposta.correta,
        tempo_resposta: 0
      });

      // Se errou, salvar no caderno de erros
      if (!resposta.correta) {
        const { data: existente } = await supabase
          .from('caderno_erros')
          .select('id')
          .eq('user_id', userId)
          .eq('questao_id', resposta.questaoId)
          .single();

        if (!existente) {
          await supabase.from('caderno_erros').insert({
            user_id: userId,
            questao_id: resposta.questaoId,
            resposta_usuario: resposta.respostaUsuario.toUpperCase(),
            resposta_correta: resposta.respostaCorreta.toUpperCase(),
            revisado: false
          });
        }
      }
    }

    // Atualizar stats
    const { data: stats } = await supabase
      .from('user_stats')
      .select('questoes_respondidas, questoes_corretas')
      .eq('user_id', userId)
      .single();

    if (stats) {
      await supabase
        .from('user_stats')
        .update({
          questoes_respondidas: stats.questoes_respondidas + todasRespostas.length,
          questoes_corretas: stats.questoes_corretas + acertos,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);
    }

    setFase('resultado');
  };

  const reiniciar = () => {
    setQuestaoAtual(0);
    setRespostas([]);
    setRespostaSelecionada(null);
    setFase('jogando');
    setXpGanho(0);
  };

  const getDicaEstudo = () => {
    const erros = respostas.filter(r => !r.correta).length;
    const taxaAcerto = ((respostas.length - erros) / respostas.length) * 100;

    if (taxaAcerto >= 90) {
      return {
        titulo: '🎉 Excelente!',
        mensagem: 'Você domina este nível! Avance para o próximo desafio.',
        proximoNivel: nivel === 'facil' ? 'medio' : nivel === 'medio' ? 'dificil' : null
      };
    } else if (taxaAcerto >= 70) {
      return {
        titulo: '⭐ Muito bom!',
        mensagem: 'Ótimo progresso! Revise os erros e tente novamente para dominar.',
        proximoNivel: null
      };
    } else if (taxaAcerto >= 50) {
      return {
        titulo: '📚 Continue praticando!',
        mensagem: 'Você está evoluindo. Revise a teoria e refaça os exercícios.',
        proximoNivel: null
      };
    } else {
      return {
        titulo: '🌱 Não desista!',
        mensagem: 'Revise a teoria com atenção antes de tentar novamente.',
        proximoNivel: null
      };
    }
  };

  const getCorClasse = () => {
    switch (nivel) {
      case 'facil': return { bg: 'from-emerald-500 to-emerald-600', btn: 'bg-emerald-500 hover:bg-emerald-600', light: 'bg-emerald-100 text-emerald-700' };
      case 'medio': return { bg: 'from-yellow-500 to-yellow-600', btn: 'bg-yellow-500 hover:bg-yellow-600', light: 'bg-yellow-100 text-yellow-700' };
      case 'dificil': return { bg: 'from-red-500 to-red-600', btn: 'bg-red-500 hover:bg-red-600', light: 'bg-red-100 text-red-700' };
      default: return { bg: 'from-emerald-500 to-emerald-600', btn: 'bg-emerald-500 hover:bg-emerald-600', light: 'bg-emerald-100 text-emerald-700' };
    }
  };

  const cores = getCorClasse();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (questoes.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white border-b border-gray-200 px-4 py-4">
          <Link href={`/plataforma/enem/modulo/${moduloId}/aula/${aulaId}`} className="flex items-center gap-2 text-gray-600">
            <ArrowLeft className="w-5 h-5" />
            <span>Voltar</span>
          </Link>
        </header>
        <main className="max-w-2xl mx-auto px-4 py-12 text-center">
          <p className="text-gray-500">Nenhuma questão disponível para este nível.</p>
          <Link
            href={`/plataforma/enem/modulo/${moduloId}/aula/${aulaId}`}
            className="inline-block mt-4 bg-blue-500 text-white px-6 py-2 rounded-lg"
          >
            Voltar para Aula
          </Link>
        </main>
      </div>
    );
  }

  // TELA DE RESULTADO
  if (fase === 'resultado') {
    const acertos = respostas.filter(r => r.correta).length;
    const erros = respostas.length - acertos;
    const percentual = Math.round((acertos / respostas.length) * 100);
    const dica = getDicaEstudo();

    return (
      <div className={`min-h-screen bg-gradient-to-b ${cores.bg}`}>
        <main className="max-w-lg mx-auto px-4 py-8 text-white">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trophy className="w-10 h-10" />
            </div>
            <h1 className="text-3xl font-bold mb-1">Nível {nivelInfo.nome} Completo!</h1>
            <p className="text-white/80">{aulaNome}</p>
          </div>

          {/* Card de Resultado */}
          <div className="bg-white rounded-3xl p-6 mb-6 text-gray-900">
            {/* Acertos e Erros */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-emerald-50 rounded-xl p-4 text-center">
                <p className="text-4xl font-black text-emerald-600">{acertos}</p>
                <p className="text-sm text-emerald-700">Acertos</p>
              </div>
              <div className="bg-red-50 rounded-xl p-4 text-center">
                <p className="text-4xl font-black text-red-600">{erros}</p>
                <p className="text-sm text-red-700">Erros</p>
              </div>
            </div>

            {/* Percentual */}
            <div className="text-center mb-6">
              <p className="text-5xl font-black text-gray-900">{percentual}%</p>
              <p className="text-gray-500">de aproveitamento</p>
            </div>

            {/* XP Ganho */}
            <div className="bg-yellow-50 rounded-xl p-4 text-center mb-6">
              <p className="text-3xl font-bold text-yellow-600">+{xpGanho} XP</p>
              <p className="text-sm text-yellow-700">Experiência ganha</p>
            </div>

            {/* Dica de Estudo */}
            <div className="bg-blue-50 rounded-xl p-4 mb-4">
              <h3 className="font-bold text-blue-800 mb-1">{dica.titulo}</h3>
              <p className="text-sm text-blue-700">{dica.mensagem}</p>
            </div>

            {/* Alerta Caderno de Erros */}
            {erros > 0 && (
              <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-orange-800">
                    {erros} {erros === 1 ? 'questão adicionada' : 'questões adicionadas'} ao Caderno de Erros
                  </p>
                  <p className="text-sm text-orange-600">Revise para entender seus erros.</p>
                </div>
              </div>
            )}
          </div>

          {/* Botões */}
          <div className="space-y-3">
            {erros > 0 && (
              <Link
                href="/plataforma/enem/caderno-erros"
                className="w-full bg-white text-gray-800 font-bold py-4 rounded-xl hover:bg-gray-100 transition-all flex items-center justify-center gap-2"
              >
                <BookOpen className="w-5 h-5" />
                Revisar no Caderno de Erros
              </Link>
            )}

            {dica.proximoNivel && percentual >= 70 && (
              <Link
                href={`/plataforma/enem/modulo/${moduloId}/aula/${aulaId}/exercicios?nivel=${dica.proximoNivel}`}
                className="w-full bg-white text-gray-800 font-bold py-4 rounded-xl hover:bg-gray-100 transition-all flex items-center justify-center gap-2"
              >
                <Target className="w-5 h-5" />
                Avançar para Nível {dica.proximoNivel === 'medio' ? 'Médio' : 'Difícil'}
              </Link>
            )}

            <div className="flex gap-3">
              <button
                onClick={reiniciar}
                className="flex-1 bg-white/20 text-white font-bold py-4 rounded-xl hover:bg-white/30 transition-all flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-5 h-5" />
                Refazer
              </button>
              <Link
                href={`/plataforma/enem/modulo/${moduloId}/aula/${aulaId}`}
                className="flex-1 bg-white/20 text-white font-bold py-4 rounded-xl hover:bg-white/30 transition-all text-center"
              >
                Voltar
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // TELA DE QUESTÕES (sem feedback imediato)
  const questao = questoes[questaoAtual];

  return (
    <div className="min-h-screen bg-gray-50">
      <header className={`bg-white border-b-4 ${
        nivel === 'facil' ? 'border-emerald-500' :
        nivel === 'medio' ? 'border-yellow-500' :
        'border-red-500'
      } px-4 py-3`}>
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          <Link href={`/plataforma/enem/modulo/${moduloId}/aula/${aulaId}`} className="flex items-center gap-2 text-gray-600">
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm">Voltar</span>
          </Link>
          <div className="flex items-center gap-2">
            <span className="text-xl">{nivelInfo.emoji}</span>
            <span className="font-bold text-gray-900">
              {questaoAtual + 1}/{questoes.length}
            </span>
          </div>
        </div>
      </header>

      {/* Barra de progresso */}
      <div className="h-2 bg-gray-200">
        <div 
          className={`h-full transition-all ${
            nivel === 'facil' ? 'bg-emerald-500' :
            nivel === 'medio' ? 'bg-yellow-500' :
            'bg-red-500'
          }`}
          style={{ width: `${((questaoAtual + 1) / questoes.length) * 100}%` }}
        />
      </div>

      <main className="max-w-2xl mx-auto px-4 py-6">
        {/* Badge de nível */}
        <div className="flex items-center gap-2 mb-4">
          <span className={`px-3 py-1 rounded-full text-xs font-bold ${cores.light}`}>
            {nivelInfo.emoji} Nível {nivelInfo.nome}
          </span>
        </div>

        {/* Enunciado */}
        <div className="bg-white rounded-2xl p-6 mb-6 border border-gray-100">
          <MathText text={questao.enunciado} className="text-gray-900" />
        </div>

        {/* Alternativas */}
        <div className="space-y-3">
          {['a', 'b', 'c', 'd', 'e'].map((letra) => {
            const textoAlternativa = questao[`alternativa_${letra}` as keyof Questao] as string;
            if (!textoAlternativa) return null;

            const selecionada = respostaSelecionada?.toUpperCase() === letra.toUpperCase();

            return (
              <button
                key={letra}
                onClick={() => selecionarAlternativa(letra)}
                className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                  selecionada 
                    ? nivel === 'facil' ? 'border-emerald-500 bg-emerald-50' :
                      nivel === 'medio' ? 'border-yellow-500 bg-yellow-50' :
                      'border-red-500 bg-red-50'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-start gap-3">
                  <span className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm shrink-0 ${
                    selecionada 
                      ? nivel === 'facil' ? 'bg-emerald-500 text-white' :
                        nivel === 'medio' ? 'bg-yellow-500 text-white' :
                        'bg-red-500 text-white'
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

        {/* Botão próxima */}
        <button
          onClick={proximaQuestao}
          disabled={!respostaSelecionada}
          className={`w-full mt-6 font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2 ${
            respostaSelecionada
              ? `${cores.btn} text-white`
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          {questaoAtual < questoes.length - 1 ? 'Próxima Questão' : 'Ver Resultado'}
        </button>
      </main>
    </div>
  );
}
