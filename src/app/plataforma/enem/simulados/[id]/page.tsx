'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import Link from 'next/link';

interface Simulado {
  id: string;
  numero: number;
  titulo: string;
  descricao: string;
  tempo_minutos: number;
}

interface ResultadoAnterior {
  nota_tri: number;
  acertos: number;
  total_questoes: number;
  created_at: string;
}

export default function InstrucoesSimuladoPage() {
  const router = useRouter();
  const params = useParams();
  const supabase = createClientComponentClient();
  const simuladoId = params.id as string;

  const [simulado, setSimulado] = useState<Simulado | null>(null);
  const [totalQuestoes, setTotalQuestoes] = useState(0);
  const [resultadosAnteriores, setResultadosAnteriores] = useState<ResultadoAnterior[]>([]);
  const [loading, setLoading] = useState(true);
  const [iniciando, setIniciando] = useState(false);

  useEffect(() => {
    loadSimulado();
  }, [simuladoId]);

  async function loadSimulado() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      const { data: simuladoData } = await supabase
        .from('simulados_gerais')
        .select('*')
        .eq('id', simuladoId)
        .single();

      if (!simuladoData) {
        router.push('/plataforma/enem/simulados');
        return;
      }

      setSimulado(simuladoData);

      const { count } = await supabase
        .from('questoes')
        .select('*', { count: 'exact', head: true })
        .eq('simulado_geral_id', simuladoId)
        .eq('ativo', true);

      setTotalQuestoes(count || 45);

      const { data: resultadosData } = await supabase
        .from('resultado_simulados_gerais')
        .select('nota_tri, acertos, total_questoes, created_at')
        .eq('user_id', user.id)
        .eq('simulado_geral_id', simuladoId)
        .order('created_at', { ascending: false })
        .limit(5);

      if (resultadosData) {
        setResultadosAnteriores(resultadosData);
      }

    } catch (error) {
      console.error('Erro ao carregar simulado:', error);
    } finally {
      setLoading(false);
    }
  }

  function iniciarSimulado() {
    setIniciando(true);
    const dadosSimulado = {
      simuladoId,
      inicioTimestamp: Date.now(),
      tempoMinutos: simulado?.tempo_minutos || 180,
    };
    localStorage.setItem('simulado_em_andamento', JSON.stringify(dadosSimulado));
    router.push(`/plataforma/enem/simulados/${simuladoId}/prova`);
  }

  function formatarData(data: string): string {
    return new Date(data).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  function getCorNotaTRI(nota: number): string {
    if (nota >= 800) return 'text-green-400';
    if (nota >= 700) return 'text-blue-400';
    if (nota >= 600) return 'text-yellow-400';
    if (nota >= 500) return 'text-orange-400';
    return 'text-red-400';
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!simulado) return null;

  return (
    <div className="min-h-screen bg-dark-900 pb-20 lg:pb-8">
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <Link 
            href="/plataforma/enem/simulados" 
            className="text-blue-200 hover:text-white mb-4 inline-flex items-center gap-2 text-sm"
          >
            ← Voltar para Simulados
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold text-white mt-2">
            {simulado.titulo}
          </h1>
          <p className="text-blue-100 mt-2">{simulado.descricao}</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6">
        <div className="bg-dark-800 rounded-xl border border-dark-700 p-6 mb-6">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            📋 Informações do Simulado
          </h2>
          
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-dark-700 rounded-lg p-4 text-center">
              <div className="text-3xl mb-1">📝</div>
              <div className="text-2xl font-bold text-white">{totalQuestoes}</div>
              <div className="text-dark-400 text-sm">Questões</div>
            </div>
            <div className="bg-dark-700 rounded-lg p-4 text-center">
              <div className="text-3xl mb-1">⏱️</div>
              <div className="text-2xl font-bold text-white">{simulado.tempo_minutos || 180}</div>
              <div className="text-dark-400 text-sm">Minutos</div>
            </div>
            <div className="bg-dark-700 rounded-lg p-4 text-center">
              <div className="text-3xl mb-1">📊</div>
              <div className="text-2xl font-bold text-white">TRI</div>
              <div className="text-dark-400 text-sm">Correção</div>
            </div>
            <div className="bg-dark-700 rounded-lg p-4 text-center">
              <div className="text-3xl mb-1">🎯</div>
              <div className="text-2xl font-bold text-white">{resultadosAnteriores.length}</div>
              <div className="text-dark-400 text-sm">Tentativas</div>
            </div>
          </div>
        </div>

        <div className="bg-dark-800 rounded-xl border border-dark-700 p-6 mb-6">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            📖 Instruções
          </h2>
          
          <ul className="space-y-3 text-dark-300">
            <li className="flex items-start gap-3">
              <span className="text-blue-400 font-bold">1.</span>
              <span>O simulado possui <strong className="text-white">{totalQuestoes} questões</strong> de múltipla escolha (A, B, C, D, E).</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-blue-400 font-bold">2.</span>
              <span>Você terá <strong className="text-white">{simulado.tempo_minutos || 180} minutos</strong> para completar. O cronômetro inicia automaticamente.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-blue-400 font-bold">3.</span>
              <span>As respostas <strong className="text-yellow-400">NÃO serão mostradas</strong> durante a prova. Resultado apenas no final.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-blue-400 font-bold">4.</span>
              <span>Você pode navegar entre as questões e alterar respostas a qualquer momento.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-blue-400 font-bold">5.</span>
              <span>A correção usa a <strong className="text-white">Teoria de Resposta ao Item (TRI)</strong>, igual ao ENEM real.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-blue-400 font-bold">6.</span>
              <span>Questões erradas serão enviadas para o <strong className="text-white">Caderno de Erros</strong>.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-blue-400 font-bold">7.</span>
              <span>Ao finalizar, clique em <strong className="text-white">"Finalizar Simulado"</strong> para ver seu resultado.</span>
            </li>
          </ul>
        </div>

        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-6 mb-6">
          <h2 className="text-lg font-bold text-blue-400 mb-3 flex items-center gap-2">
            📊 Sobre a Correção TRI
          </h2>
          <p className="text-dark-300 text-sm leading-relaxed">
            A <strong className="text-white">Teoria de Resposta ao Item (TRI)</strong> é o método usado pelo ENEM. 
            Diferente de prova tradicional, a TRI analisa a <strong className="text-white">coerência das respostas</strong>.
          </p>
          <p className="text-dark-300 text-sm leading-relaxed mt-2">
            Se você acerta difíceis mas erra fáceis, o sistema entende como "chute" e a nota será menor. 
            Por isso, <strong className="text-yellow-400">responda todas com atenção</strong>, especialmente as fáceis!
          </p>
        </div>

        {resultadosAnteriores.length > 0 && (
          <div className="bg-dark-800 rounded-xl border border-dark-700 p-6 mb-6">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              📈 Seus Resultados Anteriores
            </h2>
            
            <div className="space-y-3">
              {resultadosAnteriores.map((resultado, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-dark-700 rounded-lg">
                  <span className="text-dark-400 text-sm">{formatarData(resultado.created_at)}</span>
                  <div className="flex items-center gap-4">
                    <span className="text-dark-400 text-sm">
                      {resultado.acertos}/{resultado.total_questoes} acertos
                    </span>
                    <span className={`font-bold text-lg ${getCorNotaTRI(resultado.nota_tri)}`}>
                      {resultado.nota_tri?.toFixed(0)} pts
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 mb-6">
          <p className="text-yellow-400 text-sm text-center">
            ⚠️ <strong>Atenção:</strong> Ao iniciar, o cronômetro começará imediatamente. 
            Certifique-se de ter tempo disponível.
          </p>
        </div>

        <button
          onClick={iniciarSimulado}
          disabled={iniciando}
          className="w-full py-4 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-xl font-bold text-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {iniciando ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
              Preparando...
            </>
          ) : (
            <>🚀 Iniciar Simulado</>
          )}
        </button>
      </div>
    </div>
  );
}
