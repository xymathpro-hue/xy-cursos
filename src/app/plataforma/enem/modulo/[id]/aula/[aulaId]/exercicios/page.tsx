'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { ArrowLeft, CheckCircle, XCircle, ChevronRight, Trophy, RotateCcw } from 'lucide-react';
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
  const [questoes, setQuestoes] = useState<Questao[]>([]);
  const [questaoAtual, setQuestaoAtual] = useState(0);
  const [respostas, setRespostas] = useState<Resposta[]>([]);
  const [respondida, setRespondida] = useState(false);
  const [respostaSelecionada, setRespostaSelecionada] = useState<string | null>(null);
  const [finalizado, setFinalizado] = useState(false);
  const [xpGanho, setXpGanho] = useState(0);
  const [aulaNome, setAulaNome] = useState('');
  const [userId, setUserId] = useState<string | null>(null);

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

  const responderQuestao = async (letra: string) => {
    if (respondida || !userId) return;

    const questao = questoes[questaoAtual];
    const correta = letra.toUpperCase() === questao.resposta_correta.toUpperCase();

    setRespondida(true);
    setRespostaSelecionada(letra);

    const novaResposta: Resposta = {
      questaoId: questao.id,
      respostaUsuario: letra,
      correta
    };

    setRespostas(prev => [...prev, novaResposta]);

    // Salvar resposta no banco
    await supabase.from('user_respostas').insert({
      user_id: userId,
      questao_id: questao.id,
      resposta: letra.toUpperCase(),
      correta,
      tempo_resposta: 0
    });

    // Se errou, salvar no caderno de erros
    if (!correta) {
      // Verificar se já existe no caderno
      const { data: existente } = await supabase
        .from('caderno_erros')
        .select('id')
        .eq('user_id', userId)
        .eq('questao_id', questao.id)
        .single();

      if (!existente) {
        await supabase.from('caderno_erros').insert({
          user_id: userId,
          questao_id: questao.id,
          resposta_usuario: letra.toUpperCase(),
          resposta_correta: questao.resposta_correta.toUpperCase(),
          revisado: false
        });
      }
    }
  };

  const proximaQuestao = () => {
    if (questaoAtual < questoes.length - 1) {
      setQuestaoAtual(prev => prev + 1);
      setRespondida(false);
      setRespostaSelecionada(null);
    } else {
      finalizarExercicios();
    }
  };

  const finalizarExercicios = async () => {
    if (!userId) return;

    const acertos = respostas.filter(r => r.correta).length;
    const xp = acertos * nivelInfo.xpBase;

    setXpGanho(xp);

    // Salvar XP
    await adicionarXP(supabase, userId, xp, `${aulaNome} - Nível ${nivelInfo.nome}`);

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
          questoes_respondidas: stats.questoes_respondidas + questoes.length,
          questoes_corretas: stats.questoes_corretas + acertos,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);
    }

    setFinalizado(true);
  };

  const reiniciar = () => {
    setQuestaoAtual(0);
    setRespostas([]);
    setRespondida(false);
    setRespostaSelecionada(null);
    setFinalizado(false);
    setXpGanho(0);
  };

  const getAlternativaCor = (letra: string) => {
    if (!respondida) {
      return 'border-gray-200 hover:border-blue-300 hover:bg-blue-50';
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

  if (finalizado) {
    const acertos = respostas.filter(r => r.correta).length;
    const percentual = Math.round((acertos / questoes.length) * 100);

    return (
      <div className={`min-h-screen bg-gradient-to-b ${
        nivel === 'facil' ? 'from-emerald-500 to-emerald-600' :
        nivel === 'medio' ? 'from-yellow-500 to-yellow-600' :
        'from-red-500 to-red-600'
      }`}>
        <main className="max-w-lg mx-auto px-4 py-12 text-center text-white">
          <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Trophy className="w-10 h-10" />
          </div>

          <h1 className="text-3xl font-bold mb-2">Nível {nivelInfo.nome} Completo!</h1>
          <p className="text-white/80 mb-8">{aulaNome}</p>

          <div className="bg-white/10 rounded-2xl p-6 mb-6">
            <p className="text-5xl font-black mb-2">{acertos}/{questoes.length}</p>
            <p className="text-white/70">questões corretas ({percentual}%)</p>
          </div>

          <div className="bg-white/10 rounded-2xl p-6 mb-8">
            <p className="text-3xl font-bold text-yellow-300">+{xpGanho} XP</p>
            <p className="text-white/70">Experiência ganha</p>
          </div>

          {respostas.filter(r => !r.correta).length > 0 && (
            <div className="bg-white/10 rounded-2xl p-4 mb-6">
              <p className="text-white/80 text-sm">
                📚 {respostas.filter(r => !r.correta).length} questão(ões) adicionada(s) ao Caderno de Erros
              </p>
            </div>
          )}

          <div className="flex gap-4 justify-center">
            <button
              onClick={reiniciar}
              className="flex items-center gap-2 bg-white/20 text-white font-bold px-6 py-3 rounded-xl hover:bg-white/30 transition-all"
            >
              <RotateCcw className="w-5 h-5" />
              Refazer
            </button>
            <Link
              href={`/plataforma/enem/modulo/${moduloId}/aula/${aulaId}`}
              className="bg-white text-gray-800 font-bold px-6 py-3 rounded-xl hover:bg-gray-100 transition-all"
            >
              Voltar para Aula
            </Link>
          </div>
        </main>
      </div>
    );
  }

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
        {/* Enunciado */}
        <div className="bg-white rounded-2xl p-6 mb-6 border border-gray-100">
          <div className="flex items-center gap-2 mb-4">
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${
              nivel === 'facil' ? 'bg-emerald-100 text-emerald-700' :
              nivel === 'medio' ? 'bg-yellow-100 text-yellow-700' :
              'bg-red-100 text-red-700'
            }`}>
              {nivelInfo.emoji} Nível {nivelInfo.nome}
            </span>
          </div>
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
                  <MathText text={textoAlternativa} className="text-gray-700 flex-1" />
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
                  <span className="font-bold text-emerald-700">Correto! +{nivelInfo.xpBase} XP</span>
                </>
              ) : (
                <>
                  <XCircle className="w-5 h-5 text-red-600" />
                  <span className="font-bold text-red-700">Incorreto - Adicionado ao Caderno de Erros</span>
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
            className={`w-full mt-6 font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2 ${
              nivel === 'facil' ? 'bg-emerald-500 hover:bg-emerald-600' :
              nivel === 'medio' ? 'bg-yellow-500 hover:bg-yellow-600' :
              'bg-red-500 hover:bg-red-600'
            } text-white`}
          >
            {questaoAtual < questoes.length - 1 ? (
              <>
                Próxima Questão
                <ChevronRight className="w-5 h-5" />
              </>
            ) : (
              <>
                Ver Resultado
                <Trophy className="w-5 h-5" />
              </>
            )}
          </button>
        )}
      </main>
    </div>
  );
}
