
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { 
  Target,
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  Home,
  BookOpen,
  TrendingUp,
  Award,
  Zap,
  Flame
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

interface Resposta {
  questaoId: string;
  letra: string;
  dificuldade: string;
}

export default function DiagnosticoPage() {
  const router = useRouter();
  const supabase = createClientComponentClient();

  const [questoes, setQuestoes] = useState<Questao[]>([]);
  const [questaoAtual, setQuestaoAtual] = useState(0);
  const [respostas, setRespostas] = useState<Resposta[]>([]);
  const [loading, setLoading] = useState(true);
  const [iniciado, setIniciado] = useState(false);
  const [finalizado, setFinalizado] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    async function fetchData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }
      setUserId(user.id);

      // Buscar questões por dificuldade
      const { data: faceis } = await supabase
        .from('questoes')
        .select('*')
        .eq('ativo', true)
        .eq('dificuldade', 'facil')
        .limit(30);

      const { data: medias } = await supabase
        .from('questoes')
        .select('*')
        .eq('ativo', true)
        .eq('dificuldade', 'medio')
        .limit(30);

      const { data: dificeis } = await supabase
        .from('questoes')
        .select('*')
        .eq('ativo', true)
        .eq('dificuldade', 'dificil')
        .limit(30);

      // Embaralhar e pegar 10 de cada
      const shuffleArray = (arr: any[]) => arr.sort(() => Math.random() - 0.5);
      
      const questoesSelecionadas = [
        ...shuffleArray(faceis || []).slice(0, 10),
        ...shuffleArray(medias || []).slice(0, 10),
        ...shuffleArray(dificeis || []).slice(0, 10)
      ];

      // Embaralhar todas as questões
      setQuestoes(shuffleArray(questoesSelecionadas));
      setLoading(false);
    }

    fetchData();
  }, [supabase, router]);

  const questao = questoes[questaoAtual];

  const getRespostaAtual = () => {
    const resp = respostas.find(r => r.questaoId === questao?.id);
    return resp?.letra || null;
  };

  const handleSelecionarResposta = (letra: string) => {
    if (finalizado) return;
    
    setRespostas(prev => {
      const outras = prev.filter(r => r.questaoId !== questao.id);
      return [...outras, { questaoId: questao.id, letra, dificuldade: questao.dificuldade }];
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

  const handleIrParaQuestao = (index: number) => {
    setQuestaoAtual(index);
  };

  const handleFinalizar = async () => {
    if (!userId) return;
    setSalvando(true);

    // Salvar respostas
    for (const resp of respostas) {
      const q = questoes.find(quest => quest.id === resp.questaoId);
      if (q) {
        const correta = resp.letra === q.resposta_correta;
        
        await supabase.from('respostas_usuario').upsert({
          user_id: userId,
          questao_id: resp.questaoId,
          resposta_selecionada: resp.letra,
          correta
        }, { onConflict: 'user_id,questao_id' });

        if (!correta) {
          await supabase.from('caderno_erros').upsert({
            user_id: userId,
            questao_id: resp.questaoId,
            resposta_usuario: resp.letra,
            revisado: false,
            updated_at: new Date().toISOString()
          }, { onConflict: 'user_id,questao_id' });
        }
      }
    }

    setSalvando(false);
    setFinalizado(true);
  };

  const calcularResultado = () => {
    let acertosFacil = 0, acertosMedio = 0, acertosDificil = 0;
    let totalFacil = 0, totalMedio = 0, totalDificil = 0;

    questoes.forEach(q => {
      const resp = respostas.find(r => r.questaoId === q.id);
      const acertou = resp?.letra === q.resposta_correta;

      if (q.dificuldade === 'facil') {
        totalFacil++;
        if (acertou) acertosFacil++;
      } else if (q.dificuldade === 'medio') {
        totalMedio++;
        if (acertou) acertosMedio++;
      } else {
        totalDificil++;
        if (acertou) acertosDificil++;
      }
    });

    const totalAcertos = acertosFacil + acertosMedio + acertosDificil;
    const percentualGeral = Math.round((totalAcertos / questoes.length) * 100);
    const percentualFacil = totalFacil > 0 ? Math.round((acertosFacil / totalFacil) * 100) : 0;
    const percentualMedio = totalMedio > 0 ? Math.round((acertosMedio / totalMedio) * 100) : 0;
    const percentualDificil = totalDificil > 0 ? Math.round((acertosDificil / totalDificil) * 100) : 0;

    // Determinar nível
    let nivel = 'Iniciante';
    let nivelCor = 'text-amber-600';
    let nivelBg = 'bg-amber-100';
    let notaTRI = 0;

    if (percentualGeral >= 80) {
      nivel = 'Avançado';
      nivelCor = 'text-emerald-600';
      nivelBg = 'bg-emerald-100';
      notaTRI = 750 + (percentualGeral - 80) * 2.5;
    } else if (percentualGeral >= 60) {
      nivel = 'Intermediário';
      nivelCor = 'text-blue-600';
      nivelBg = 'bg-blue-100';
      notaTRI = 600 + (percentualGeral - 60) * 7.5;
    } else if (percentualGeral >= 40) {
      nivel = 'Básico';
      nivelCor = 'text-amber-600';
      nivelBg = 'bg-amber-100';
      notaTRI = 450 + (percentualGeral - 40) * 7.5;
    } else {
      nivel = 'Iniciante';
      nivelCor = 'text-red-600';
      nivelBg = 'bg-red-100';
      notaTRI = 300 + percentualGeral * 3.75;
    }

    return {
      totalAcertos,
      percentualGeral,
      acertosFacil,
      acertosMedio,
      acertosDificil,
      percentualFacil,
      percentualMedio,
      percentualDificil,
      nivel,
      nivelCor,
      nivelBg,
      notaTRI: Math.round(notaTRI)
    };
  };

  const getDificuldadeCor = (dif: string) => {
    switch (dif) {
      case 'facil': return 'bg-emerald-100 text-emerald-700';
      case 'dificil': return 'bg-red-100 text-red-700';
      default: return 'bg-amber-100 text-amber-700';
    }
  };

  const getNomeDificuldade = (dif: string) => {
    switch (dif) {
      case 'facil': return 'Fácil';
      case 'dificil': return 'Difícil';
      default: return 'Médio';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
      </div>
    );
  }

  // Tela inicial
  if (!iniciado) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-3xl p-8 text-center shadow-2xl">
            <div className="w-20 h-20 bg-violet-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Target className="w-10 h-10 text-violet-600" />
            </div>
            
            <h1 className="text-3xl font-black text-gray-900 mb-2">Diagnóstico</h1>
            <p className="text-gray-500 mb-8">Descubra seu nível em matemática</p>

            <div className="bg-violet-50 rounded-2xl p-6 mb-8">
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="text-center">
                  <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center mx-auto mb-2">
                    <Zap className="w-5 h-5 text-emerald-600" />
                  </div>
                  <p className="text-xs text-gray-500">10 Fáceis</p>
                </div>
                <div className="text-center">
                  <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center mx-auto mb-2">
                    <Target className="w-5 h-5 text-amber-600" />
                  </div>
                  <p className="text-xs text-gray-500">10 Médias</p>
                </div>
                <div className="text-center">
                  <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center mx-auto mb-2">
                    <Flame className="w-5 h-5 text-red-600" />
                  </div>
                  <p className="text-xs text-gray-500">10 Difíceis</p>
                </div>
              </div>
              <p className="text-violet-700 text-sm">
                30 questões para avaliar seu conhecimento e criar um plano de estudos personalizado
              </p>
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-3 text-left text-sm text-gray-600">
                <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
                <span>Sem limite de tempo</span>
              </div>
              <div className="flex items-center gap-3 text-left text-sm text-gray-600">
                <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
                <span>Navegue entre as questões livremente</span>
              </div>
              <div className="flex items-center gap-3 text-left text-sm text-gray-600">
                <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
                <span>Receba seu nível e nota TRI estimada</span>
              </div>
            </div>

            <button
              onClick={() => setIniciado(true)}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-violet-500 to-purple-500 text-white font-bold text-lg hover:from-violet-600 hover:to-purple-600 transition-all shadow-lg"
            >
              🎯 INICIAR DIAGNÓSTICO
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
    const resultado = calcularResultado();
    const erros = questoes.length - resultado.totalAcertos;

    return (
      <div className="min-h-screen bg-gradient-to-br from-violet-500 to-purple-600 p-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-3xl p-8 text-center shadow-2xl mb-4">
            <div className={`w-20 h-20 ${resultado.nivelBg} rounded-full flex items-center justify-center mx-auto mb-4`}>
              <Award className={`w-10 h-10 ${resultado.nivelCor}`} />
            </div>
            
            <h2 className="text-2xl font-black text-gray-900 mb-1">Diagnóstico Concluído!</h2>
            <p className="text-gray-500 mb-6">Seu perfil de aprendizagem</p>

            {/* Nível */}
            <div className={`${resultado.nivelBg} rounded-2xl p-6 mb-6`}>
              <p className="text-sm text-gray-500 mb-1">Seu Nível</p>
              <p className={`text-3xl font-black ${resultado.nivelCor}`}>{resultado.nivel}</p>
              <div className="mt-3 flex items-center justify-center gap-2">
                <TrendingUp className={`w-5 h-5 ${resultado.nivelCor}`} />
                <span className={`text-lg font-bold ${resultado.nivelCor}`}>
                  Nota TRI Estimada: {resultado.notaTRI}
                </span>
              </div>
            </div>

            {/* Resultado geral */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-emerald-50 rounded-xl p-4">
                <p className="text-2xl font-bold text-emerald-600">{resultado.totalAcertos}</p>
                <p className="text-emerald-700 text-sm">Acertos</p>
              </div>
              <div className="bg-red-50 rounded-xl p-4">
                <p className="text-2xl font-bold text-red-600">{erros}</p>
                <p className="text-red-700 text-sm">Erros</p>
              </div>
              <div className="bg-blue-50 rounded-xl p-4">
                <p className="text-2xl font-bold text-blue-600">{resultado.percentualGeral}%</p>
                <p className="text-blue-700 text-sm">Taxa</p>
              </div>
            </div>

            {/* Desempenho por nível */}
            <div className="bg-gray-50 rounded-2xl p-4 mb-6">
              <p className="text-sm font-medium text-gray-700 mb-4">Desempenho por Dificuldade</p>
              
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-emerald-700 font-medium">🟢 Fácil</span>
                    <span className="text-gray-600">{resultado.acertosFacil}/10 ({resultado.percentualFacil}%)</span>
                  </div>
                  <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-emerald-500 transition-all"
                      style={{ width: `${resultado.percentualFacil}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-amber-700 font-medium">🟡 Médio</span>
                    <span className="text-gray-600">{resultado.acertosMedio}/10 ({resultado.percentualMedio}%)</span>
                  </div>
                  <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-amber-500 transition-all"
                      style={{ width: `${resultado.percentualMedio}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-red-700 font-medium">🔴 Difícil</span>
                    <span className="text-gray-600">{resultado.acertosDificil}/10 ({resultado.percentualDificil}%)</span>
                  </div>
                  <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-red-500 transition-all"
                      style={{ width: `${resultado.percentualDificil}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Recomendações */}
            <div className="bg-violet-50 rounded-2xl p-4 mb-6 text-left">
              <p className="text-sm font-medium text-violet-800 mb-3">📋 Plano de Estudos Recomendado:</p>
              <ul className="space-y-2 text-sm text-violet-700">
                {resultado.percentualFacil < 80 && (
                  <li className="flex items-start gap-2">
                    <span>•</span>
                    <span>Reforce os conceitos básicos com questões de nível Fácil</span>
                  </li>
                )}
                {resultado.percentualMedio < 60 && (
                  <li className="flex items-start gap-2">
                    <span>•</span>
                    <span>Pratique mais questões de nível Médio para consolidar</span>
                  </li>
                )}
                {resultado.percentualDificil < 40 && (
                  <li className="flex items-start gap-2">
                    <span>•</span>
                    <span>Depois de dominar o básico, avance para questões Difíceis</span>
                  </li>
                )}
                {resultado.percentualGeral >= 70 && (
                  <li className="flex items-start gap-2">
                    <span>•</span>
                    <span>Ótimo desempenho! Foque nas Batalhas Rápidas para ganhar velocidade</span>
                  </li>
                )}
                <li className="flex items-start gap-2">
                  <span>•</span>
                  <span>Revise os {erros} erros no Caderno de Erros</span>
                </li>
              </ul>
            </div>

            <div className="space-y-3">
              {erros > 0 && (
                <Link
                  href="/caderno-erros"
                  className="w-full py-3 rounded-xl border-2 border-red-200 text-red-600 font-medium hover:bg-red-50 flex items-center justify-center gap-2"
                >
                  <BookOpen className="w-5 h-5" />
                  Revisar {erros} Erros
                </Link>
              )}
              <Link
                href="/dashboard"
                className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-500 to-purple-500 text-white font-bold hover:from-violet-600 hover:to-purple-600 flex items-center justify-center gap-2"
              >
                <Home className="w-5 h-5" />
                Ir para Dashboard
              </Link>
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
    <div className="min-h-screen bg-gradient-to-br from-violet-500 to-purple-600">
      <header className="bg-white/10 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="w-6 h-6 text-white" />
              <span className="text-white font-bold">Diagnóstico</span>
            </div>
            <div className="text-white text-sm">{respostas.length}/{questoes.length} respondidas</div>
          </div>

          <div className="mt-3">
            <div className="flex items-center justify-between text-xs text-white/70 mb-1">
              <span>Questão {questaoAtual + 1} de {questoes.length}</span>
              <span>{Math.round(progresso)}%</span>
            </div>
            <div className="h-2 bg-white/20 rounded-full overflow-hidden">
              <div className="h-full bg-white transition-all duration-300" style={{ width: `${progresso}%` }}></div>
            </div>
          </div>

          {/* Navegação por números */}
          <div className="mt-3 flex gap-1 overflow-x-auto pb-2">
            {questoes.map((q, index) => {
              const respondida = respostas.some(r => r.questaoId === q.id);
              const isAtual = index === questaoAtual;
              
              let bgColor = 'bg-white/20';
              if (isAtual) bgColor = 'bg-white';
              else if (respondida) bgColor = 'bg-emerald-400';

              return (
                <button
                  key={q.id}
                  onClick={() => handleIrParaQuestao(index)}
                  className={`w-7 h-7 rounded-lg text-xs font-medium flex-shrink-0 transition-all ${bgColor} ${isAtual ? 'text-violet-600' : 'text-white'}`}
                >
                  {index + 1}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      <main className="px-4 py-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-3xl p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <span className={`px-3 py-1 rounded-full text-xs fo
