'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import Link from 'next/link';

interface Simulado {
  id: string;
  numero: number;
  titulo: string;
  descricao: string;
  tempo_minutos: number;
  modulos_necessarios: number;
  nota_minima_anterior: number;
  ativo: boolean;
}

interface ResultadoSimulado {
  simulado_geral_id: string;
  nota_tri: number;
  acertos: number;
  total_questoes: number;
  created_at: string;
}

const REQUISITOS_DESBLOQUEIO: { [key: number]: { modulos: number; notaAnterior: number } } = {
  1: { modulos: 0, notaAnterior: 0 },
  2: { modulos: 2, notaAnterior: 40 },
  3: { modulos: 4, notaAnterior: 50 },
  4: { modulos: 6, notaAnterior: 55 },
  5: { modulos: 8, notaAnterior: 60 },
  6: { modulos: 10, notaAnterior: 65 },
};

export default function SimuladosENEMPage() {
  const router = useRouter();
  const supabase = createClientComponentClient();
  
  const [simulados, setSimulados] = useState<Simulado[]>([]);
  const [resultados, setResultados] = useState<ResultadoSimulado[]>([]);
  const [modulosConcluidos, setModulosConcluidos] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      const { data: simuladosData } = await supabase
        .from('simulados_gerais')
        .select('*')
        .eq('ativo', true)
        .order('numero');

      if (simuladosData) {
        setSimulados(simuladosData);
      }

      const { data: resultadosData } = await supabase
        .from('resultado_simulados_gerais')
        .select('*')
        .eq('user_id', user.id)
        .order('nota_tri', { ascending: false });

      if (resultadosData) {
        setResultados(resultadosData);
      }

      const { data: progressoData } = await supabase
        .from('progresso')
        .select('fase_id, percentual')
        .eq('user_id', user.id)
        .eq('percentual', 100);

      if (progressoData) {
        const modulosCompletos = new Set();
        progressoData.forEach((p: any) => {
          modulosCompletos.add(p.fase_id);
        });
        setModulosConcluidos(Math.min(modulosCompletos.size, 10));
      }

    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  }

  function getMelhorResultado(simuladoId: string): ResultadoSimulado | null {
    const resultadosSimulado = resultados.filter(r => r.simulado_geral_id === simuladoId);
    if (resultadosSimulado.length === 0) return null;
    return resultadosSimulado.reduce((melhor, atual) => 
      atual.nota_tri > melhor.nota_tri ? atual : melhor
    );
  }

  function verificarDesbloqueio(simulado: Simulado): { liberado: boolean; motivo: string } {
    const requisitos = REQUISITOS_DESBLOQUEIO[simulado.numero];
    
    if (simulado.numero === 1) {
      return { liberado: true, motivo: '' };
    }

    if (modulosConcluidos >= requisitos.modulos) {
      return { liberado: true, motivo: '' };
    }

    const simuladoAnterior = simulados.find(s => s.numero === simulado.numero - 1);
    if (simuladoAnterior) {
      const resultadoAnterior = getMelhorResultado(simuladoAnterior.id);
      if (resultadoAnterior) {
        const percentualAcerto = (resultadoAnterior.acertos / resultadoAnterior.total_questoes) * 100;
        if (percentualAcerto >= requisitos.notaAnterior) {
          return { liberado: true, motivo: '' };
        }
      }
    }

    return { 
      liberado: false, 
      motivo: `Complete ${requisitos.modulos} módulos OU ${requisitos.notaAnterior}% no Simulado ${simulado.numero - 1}`
    };
  }

  function getCorNotaTRI(nota: number): string {
    if (nota >= 800) return 'text-green-400';
    if (nota >= 700) return 'text-blue-400';
    if (nota >= 600) return 'text-yellow-400';
    if (nota >= 500) return 'text-orange-400';
    return 'text-red-400';
  }

  function getNivelSimulado(numero: number): { nome: string; cor: string } {
    const niveis: { [key: number]: { nome: string; cor: string } } = {
      1: { nome: 'Diagnóstico', cor: 'bg-green-500/20 text-green-400 border-green-500/30' },
      2: { nome: 'Básico', cor: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
      3: { nome: 'Básico+', cor: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' },
      4: { nome: 'Intermediário', cor: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
      5: { nome: 'Avançado', cor: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
      6: { nome: 'Pré-ENEM', cor: 'bg-red-500/20 text-red-400 border-red-500/30' },
    };
    return niveis[numero] || { nome: '', cor: 'bg-gray-500/20 text-gray-400' };
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-900 pb-20 lg:pb-8">
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Link 
            href="/plataforma/enem" 
            className="text-blue-200 hover:text-white mb-4 inline-flex items-center gap-2 text-sm"
          >
            ← Voltar para ENEM
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold text-white mt-2">
            🎯 Simulados ENEM
          </h1>
          <p className="text-blue-100 mt-2">
            Treine com simulados completos no estilo ENEM com correção TRI
          </p>
          
          <div className="mt-4 bg-white/10 rounded-lg p-4">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-blue-100">📚 Módulos concluídos:</span>
              <span className="text-white font-bold">{modulosConcluidos}/10</span>
            </div>
            <div className="h-3 bg-white/20 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-green-400 to-green-500 rounded-full transition-all duration-500"
                style={{ width: `${(modulosConcluidos / 10) * 100}%` }}
              />
            </div>
            <p className="text-blue-200 text-xs mt-2">
              Complete módulos para desbloquear mais simulados!
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="space-y-4">
          {simulados.map((simulado) => {
            const { liberado, motivo } = verificarDesbloqueio(simulado);
            const resultado = getMelhorResultado(simulado.id);
            const nivel = getNivelSimulado(simulado.numero);
            const tentativas = resultados.filter(r => r.simulado_geral_id === simulado.id).length;

            return (
              <div
                key={simulado.id}
                className={`bg-dark-800 rounded-xl border overflow-hidden transition-all ${
                  liberado 
                    ? 'border-dark-700 hover:border-blue-500/50' 
                    : 'border-dark-700 opacity-60'
                }`}
              >
                <div className="p-4 sm:p-6">
                  <div className="flex items-start gap-4">
                    <div className={`w-14 h-14 rounded-xl flex items-center justify-center font-bold text-xl flex-shrink-0 ${
                      liberado 
                        ? resultado 
                          ? 'bg-green-500 text-white' 
                          : 'bg-blue-500 text-white'
                        : 'bg-dark-600 text-dark-400'
                    }`}>
                      {liberado ? (
                        resultado ? '✓' : simulado.numero
                      ) : (
                        '🔒'
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h3 className="font-bold text-white text-lg">
                          {simulado.titulo}
                        </h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full border ${nivel.cor}`}>
                          {nivel.nome}
                        </span>
                      </div>

                      <p className="text-dark-400 text-sm mb-3">
                        {simulado.descricao}
                      </p>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
                        <span className="text-dark-400 flex items-center gap-1">
                          📝 45 questões
                        </span>
                        <span className="text-dark-400 flex items-center gap-1">
                          ⏱️ {simulado.tempo_minutos || 180} min
                        </span>
                        {tentativas > 0 && (
                          <span className="text-dark-400 flex items-center gap-1">
                            🔄 {tentativas} {tentativas === 1 ? 'tentativa' : 'tentativas'}
                          </span>
                        )}
                      </div>

                      {liberado ? (
                        resultado ? (
                          <div className="mt-3 p-3 bg-dark-700/50 rounded-lg">
                            <div className="flex items-center justify-between">
                              <div>
                                <span className="text-dark-400 text-sm">Melhor resultado:</span>
                                <div className="flex items-center gap-3 mt-1">
                                  <span className={`text-2xl font-bold ${getCorNotaTRI(resultado.nota_tri)}`}>
                                    {resultado.nota_tri?.toFixed(0)} pts
                                  </span>
                                  <span className="text-dark-400">
                                    ({resultado.acertos}/{resultado.total_questoes} acertos)
                                  </span>
                                </div>
                              </div>
                              <button
                                onClick={() => router.push(`/plataforma/enem/simulados/${simulado.id}`)}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                              >
                                Refazer
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => router.push(`/plataforma/enem/simulados/${simulado.id}`)}
                            className="mt-3 w-full sm:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                          >
                            Iniciar Simulado 🚀
                          </button>
                        )
                      ) : (
                        <div className="mt-3 p-3 bg-dark-700/50 rounded-lg border border-dark-600">
                          <div className="flex items-center gap-2 text-dark-400">
                            <span>🔒</span>
                            <span className="text-sm">{motivo}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-8 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
          <h4 className="font-bold text-blue-400 mb-2">💡 Dica</h4>
          <p className="text-dark-300 text-sm">
            Os simulados usam a correção pela <strong>Teoria de Resposta ao Item (TRI)</strong>, 
            o mesmo método usado no ENEM real. Questões difíceis valem mais pontos, mas só se você 
            também acertar as questões fáceis!
          </p>
        </div>
      </div>
    </div>
  );
}
