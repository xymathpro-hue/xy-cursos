'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { ArrowLeft, BookOpen, Trophy, Lock, CheckCircle, PlayCircle } from 'lucide-react';

interface Modulo {
  id: string;
  titulo: string;
  descricao: string;
  cor: string;
  icone: string;
}

interface Aula {
  id: string;
  titulo: string;
  descricao: string;
  ordem: number;
}

interface AulaProgresso {
  aula: Aula;
  totalQuestoes: number;
  questoesRespondidas: number;
  questoesCorretas: number;
  percentual: number;
}

export default function ModuloPage() {
  const params = useParams();
  const router = useRouter();
  const supabase = createClientComponentClient();

  const moduloId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [modulo, setModulo] = useState<Modulo | null>(null);
  const [aulasProgresso, setAulasProgresso] = useState<AulaProgresso[]>([]);
  const [progressoGeral, setProgressoGeral] = useState(0);

  useEffect(() => {
    async function fetchData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      // Buscar módulo
      const { data: moduloData } = await supabase
        .from('modulos')
        .select('*')
        .eq('id', moduloId)
        .single();

      if (moduloData) {
        setModulo(moduloData);
      }

      // Buscar aulas do módulo
      const { data: aulasData } = await supabase
        .from('aulas')
        .select('*')
        .eq('modulo_id', moduloId)
        .order('ordem');

      if (aulasData) {
        // Para cada aula, calcular progresso
        const aulasComProgresso: AulaProgresso[] = [];
        let totalCorretasGeral = 0;
        let totalQuestoesGeral = 0;

        for (const aula of aulasData) {
          // Buscar questões da aula
          const { data: questoes } = await supabase
            .from('questoes')
            .select('id')
            .eq('aula_id', aula.id)
            .eq('ativo', true);

          const totalQuestoes = questoes?.length || 0;

          // Buscar respostas do usuário
          const questoesIds = questoes?.map(q => q.id) || [];
          
          let questoesRespondidas = 0;
          let questoesCorretas = 0;

          if (questoesIds.length > 0) {
            const { data: respostas } = await supabase
              .from('user_respostas')
              .select('questao_id, correta')
              .eq('user_id', user.id)
              .in('questao_id', questoesIds);

            if (respostas) {
              questoesRespondidas = respostas.length;
              questoesCorretas = respostas.filter(r => r.correta).length;
            }
          }

          const percentual = totalQuestoes > 0 ? Math.round((questoesCorretas / totalQuestoes) * 100) : 0;

          totalCorretasGeral += questoesCorretas;
          totalQuestoesGeral += totalQuestoes;

          aulasComProgresso.push({
            aula,
            totalQuestoes,
            questoesRespondidas,
            questoesCorretas,
            percentual
          });
        }

        setAulasProgresso(aulasComProgresso);
        setProgressoGeral(totalQuestoesGeral > 0 ? Math.round((totalCorretasGeral / totalQuestoesGeral) * 100) : 0);
      }

      setLoading(false);
    }

    fetchData();
  }, [supabase, router, moduloId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <Link href="/plataforma/enem" className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-4">
            <ArrowLeft className="w-5 h-5" />
            <span>Voltar</span>
          </Link>
          
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center text-3xl">
              {modulo?.icone || '📚'}
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold">{modulo?.titulo || 'Módulo'}</h1>
              <p className="text-white/80">{modulo?.descricao}</p>
            </div>
          </div>

          {/* Barra de progresso geral */}
          <div className="mt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-white/80">Progresso do Módulo</span>
              <span className="text-sm font-bold">{progressoGeral}%</span>
            </div>
            <div className="h-3 bg-white/20 rounded-full overflow-hidden">
              <div 
                className="h-full bg-white transition-all"
                style={{ width: `${progressoGeral}%` }}
              />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">📚 Aulas do Módulo</h2>

        <div className="space-y-4">
          {aulasProgresso.map((item, index) => (
            <div 
              key={item.aula.id}
              className="bg-white rounded-2xl border border-gray-100 overflow-hidden"
            >
              <div className="p-5">
                <div className="flex items-center gap-4">
                  {/* Número da aula */}
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg ${
                    item.percentual >= 70 
                      ? 'bg-emerald-100 text-emerald-600' 
                      : item.percentual > 0 
                        ? 'bg-blue-100 text-blue-600'
                        : 'bg-gray-100 text-gray-500'
                  }`}>
                    {item.percentual >= 70 ? (
                      <CheckCircle className="w-6 h-6" />
                    ) : (
                      index + 1
                    )}
                  </div>

                  {/* Info da aula */}
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900">{item.aula.titulo}</h3>
                    <p className="text-sm text-gray-500">
                      {item.totalQuestoes} questões • {item.questoesCorretas} acertos
                    </p>
                  </div>

                  {/* Percentual */}
                  <div className="text-right">
                    <p className={`text-2xl font-black ${
                      item.percentual >= 70 
                        ? 'text-emerald-500' 
                        : item.percentual > 0 
                          ? 'text-blue-500'
                          : 'text-gray-300'
                    }`}>
                      {item.percentual}%
                    </p>
                  </div>
                </div>

                {/* Barra de progresso */}
                <div className="mt-4 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all ${
                      item.percentual >= 70 
                        ? 'bg-emerald-500' 
                        : 'bg-blue-500'
                    }`}
                    style={{ width: `${item.percentual}%` }}
                  />
                </div>

                {/* Botões */}
                <div className="mt-4 flex gap-3">
                  <Link
                    href={`/plataforma/enem/modulo/${moduloId}/aula/${item.aula.id}`}
                    className="flex-1 bg-gray-100 text-gray-700 font-medium py-3 rounded-xl hover:bg-gray-200 transition-all flex items-center justify-center gap-2"
                  >
                    <BookOpen className="w-5 h-5" />
                    Ver Teoria
                  </Link>
                  <Link
                    href={`/plataforma/enem/modulo/${moduloId}/aula/${item.aula.id}?tab=exercicios`}
                    className="flex-1 bg-blue-500 text-white font-medium py-3 rounded-xl hover:bg-blue-600 transition-all flex items-center justify-center gap-2"
                  >
                    <PlayCircle className="w-5 h-5" />
                    Exercícios
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Simulado do Módulo */}
        <div className="mt-8">
          <h2 className="text-lg font-bold text-gray-900 mb-4">🏆 Simulado do Módulo</h2>
          
          <div className={`bg-white rounded-2xl border-2 p-6 ${
            progressoGeral >= 50 ? 'border-yellow-300' : 'border-gray-200'
          }`}>
            <div className="flex items-center gap-4">
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${
                progressoGeral >= 50 ? 'bg-yellow-100' : 'bg-gray-100'
              }`}>
                {progressoGeral >= 50 ? (
                  <Trophy className="w-8 h-8 text-yellow-600" />
                ) : (
                  <Lock className="w-8 h-8 text-gray-400" />
                )}
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-gray-900">Simulado Final</h3>
                <p className="text-sm text-gray-500">
                  {progressoGeral >= 50 
                    ? '30 questões mistas • 45 minutos'
                    : `Complete ${50 - progressoGeral}% mais para desbloquear`
                  }
                </p>
              </div>
              {progressoGeral >= 50 ? (
                <Link
                  href={`/plataforma/enem/modulo/${moduloId}/simulado`}
                  className="bg-yellow-500 text-white font-bold px-6 py-3 rounded-xl hover:bg-yellow-600 transition-all"
                >
                  Iniciar
                </Link>
              ) : (
                <div className="text-gray-400 font-medium">
                  🔒 {progressoGeral}% / 50%
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
