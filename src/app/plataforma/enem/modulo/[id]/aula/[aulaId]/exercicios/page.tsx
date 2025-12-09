'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
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
}

interface Resposta {
  questaoId: string;
  respostaUsuario: string;
  correta: boolean;
}

export default function ExerciciosPage() {
  const params = useParams();
  const router = useRouter();
  const supabase = createClientComponentClient();

  const aulaId = params.aulaId as string;

  const [loading, setLoading] = useState(true);
  const [questoes, setQuestoes] = useState<Questao[]>([]);
  const [questaoAtual, setQuestaoAtual] = useState(0);
  const [respostas, setRespostas] = useState<Resposta[]>([]);
  const [respondida, setRespondida] = useState(false);
  const [respostaSelecionada, setRespostaSelecionada] = useState<string | null>(null);
  const [finalizado, setFinalizado] = useState(false);
  const [xpGanho, setXpGanho] = useState(0);
  const [aulaNome, setAulaNome] = useState('');

  useEffect(() => {
    async function fetchData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      // Buscar nome da aula
      const { data: aulaData } = await supabase
        .from('aulas')
        .select('titulo')
        .eq('id', aulaId)
        .single();

      if (aulaData) {
        setAulaNome(aulaData.titulo);
      }

      // Buscar questões da aula
      const { data: questoesData } = await supabase
        .from('questoes')
        .select('*')
        .eq('aula_id', aulaId)
        .eq('ativo', true)
        .order('ordem');

      if (questoesData && questoesData.length > 0) {
        setQuestoes(questoesData);
      }

      setLoading(false);
    }

    fetchData();
  }, [supabase, router, aulaId]);

  const responderQuestao = async (letra: string) => {
    if (respondida) return;

    const questao = questoes[questaoAtual];
    const correta = letra === questao.resposta_correta;

    setRespondida(true);
    setRespostaSelecionada(letra);

    const novaResposta: Resposta = {
      questaoId: questao.id,
      respostaUsuario: letra,
      correta
    };

    setRespostas(prev => [...prev, novaResposta]);

    // Se errou, salvar no caderno de erros
    if (!correta) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('caderno_erros').insert({
          user_id: user.id,
          questao_id: questao.id,
          resposta_usuario: letra,
          resposta_correta: questao.resposta_correta
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
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const acertos = respostas.filter(r => r.correta).length;
    const xp = acertos * 10; // 10 XP por acerto

    setXpGanho(xp);

    // Salvar XP
    await adicionarXP(supabase, user.id, xp, `Exercícios: ${aulaNome}`);

    // Atualizar stats
    const { data: stats } = await supabase
      .from('user_stats')
      .select('questoes_respondidas, questoes_corretas')
      .eq('user_id', user.id)
      .single();

    if (stats) {
      await supabase
        .from('user_stats')
        .update({
          questoes_respondidas: stats.questoes_respondidas + questoes.length,
          questoes_corretas: stats.questoes_corretas + acertos,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);
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
    if (letra === questao.resposta_correta) {
      return 'border-emerald-500 bg-emerald-50';
    }
    if (letra === respostaSelecionada) {
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
          <Link href={`/plataforma/enem/modulo/${params.id}/aula/${aulaId}`} className="flex items-center gap-2 text-gray-600">
            <ArrowLeft className="w-5 h-5" />
            <span>Voltar</span>
          </Link>
        </header>
        <main className="max-w-2xl mx-auto px-4 py-12 text-center">
          <p className="text-gray-500">Nenhuma questão disponível para esta aula.</p>
        </main>
      </div>
    );
  }

  if (finalizado) {
    const acertos = respostas.filter(r => r.correta).length;
    const percentual = Math.round((acertos / questoes.length) * 100);

    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-500 to-indigo-600">
        <main className="max-w-lg mx-auto px-4 py-12 text-center text-white">
          <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Trophy className="w-10 h-10" />
          </div>

          <h1 className="text-3xl font-bold mb-2">Exercícios Concluídos!</h1>
          <p className="text-white/80 mb-8">{aulaNome}</p>

          <div className="bg-white/10 rounded-2xl p-6 mb-6">
            <p className="text-5xl font-black mb-2">{acertos}/{questoes.length}</p>
            <p className="text-white/70">questões corretas ({percentual}%)</p>
          </div>

          <div className="bg-white/10 rounded-2xl p-6 mb-8">
            <p className="text-3xl font-bold text-yellow-300">+{xpGanho} XP</p>
            <p className="text-white/70">Experiência ganha</p>
          </div>

          <div className="flex gap-4 justify-center">
            <button
              onClick={reiniciar}
              className="flex items-center gap-2 bg-white/20 text-white font-bold px-6 py-3 rounded-xl hover:bg-white/30 transition-all"
            >
              <RotateCcw className="w-5 h-5" />
              Refazer
            </button>
            <Link
              href="/dashboard"
              className="bg-white text-blue-600 font-bold px-6 py-3 rounded-xl hover:bg-blue-50 transition-all"
            >
              Voltar ao Dashboard
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const questao = questoes[questaoAtual];

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          <Link href={`/plataforma/enem/modulo/${params.id}/aula/${aulaId}`} className="flex items-center gap-2 text-gray-600">
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm">Voltar</span>
          </Link>
          <span className="font-bold text-gray-900">
            Questão {questaoAtual + 1}/{questoes.length}
          </span>
        </div>
      </header>

      {/* Barra de progresso */}
      <div className="h-1 bg-gray-200">
        <div 
          className="h-full bg-blue-500 transition-all"
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
                  <span className="font-bold text-emerald-700">Correto! +10 XP</span>
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
            className="w-full mt-6 bg-blue-500 text-white font-bold py-4 rounded-xl hover:bg-blue-600 transition-all flex items-center justify-center gap-2"
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