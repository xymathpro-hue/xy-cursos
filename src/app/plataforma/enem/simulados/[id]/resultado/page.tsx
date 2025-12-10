'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import Link from 'next/link';

interface DetalheQuestao {
  questao_id: string;
  numero: number;
  resposta_usuario: string;
  resposta_correta: string;
  acertou: boolean;
  assunto: string;
  dificuldade: string;
}

interface Simulado {
  id: string;
  numero: number;
  titulo: string;
}

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
  explicacao: string;
  assunto: string;
  dificuldade: string;
}

export default function ResultadoSimuladoPage() {
  const router = useRouter();
  const params = useParams();
  const supabase = createClientComponentClient();
  const simuladoId = params.id as string;

  const [simulado, setSimulado] = useState<Simulado | null>(null);
  const [acertos, setAcertos] = useState(0);
  const [total, setTotal] = useState(0);
  const [notaTRI, setNotaTRI] = useState(0);
  const [erros, setErros] = useState(0);
  const [detalhes, setDetalhes] = useState<DetalheQuestao[]>([]);
  const [questoes, setQuestoes] = useState<{ [key: string]: Questao }>({});
  const [loading, setLoading] = useState(true);
  const [showDetalhes, setShowDetalhes] = useState(false);
  const [filtroDetalhes, setFiltroDetalhes] = useState<'todos' | 'acertos' | 'erros'>('todos');

  useEffect(() => {
    loadResultado();
  }, [simuladoId]);

  async function loadResultado() {
    try {
      const resultadoLocal = localStorage.getItem(`resultado_simulado_${simuladoId}`);
      
      if (resultadoLocal) {
        const dados = JSON.parse(resultadoLocal);
        setAcertos(dados.acertos);
        setTotal(dados.total);
        setNotaTRI(dados.notaTRI);
        setErros(dados.erros);
        setDetalhes(dados.detalhes || []);
        localStorage.removeItem(`resultado_simulado_${simuladoId}`);
      } else {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push('/login');
          return;
        }

        const { data: resultadoData } = await supabase
          .from('resultado_simulados_gerais')
          .select('*')
          .eq('user_id', user.id)
          .eq('simulado_geral_id', simuladoId)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (resultadoData) {
          setAcertos(resultadoData.acertos);
          setTotal(resultadoData.total_questoes);
          setNotaTRI(resultadoData.nota_tri);
          setErros(resultadoData.total_questoes - resultadoData.acertos);
          setDetalhes(resultadoData.detalhes || []);
        }
      }

      const { data: simuladoData } = await supabase
        .from('simulados_gerais')
        .select('*')
        .eq('id', simuladoId)
        .single();

      if (simuladoData) {
        setSimulado(simuladoData);
      }

      const { data: questoesData } = await supabase
        .from('questoes')
        .select('*')
        .eq('simulado_geral_id', simuladoId);

      if (questoesData) {
        const questoesMap: { [key: string]: Questao } = {};
        questoesData.forEach(q => { questoesMap[q.id] = q; });
        setQuestoes(questoesMap);
      }

    } catch (error) {
      console.error('Erro ao carregar resultado:', error);
    } finally {
      setLoading(false);
    }
  }

  function getCorNotaTRI(nota: number): string {
    if (nota >= 800) return 'from-green-500 to-green-600';
    if (nota >= 700) return 'from-blue-500 to-blue-600';
    if (nota >= 600) return 'from-yellow-500 to-yellow-600';
    if (nota >= 500) return 'from-orange-500 to-orange-600';
    return 'from-red-500 to-red-600';
  }

  function getMensagemNota(nota: number): string {
    if (nota >= 800) return '🏆 Excelente! Você está muito bem preparado!';
    if (nota >= 700) return '🌟 Muito bom! Continue assim!';
    if (nota >= 600) return '👍 Bom desempenho! Ainda há espaço para melhorar.';
    if (nota >= 500) return '📚 Regular. Revise os conteúdos que errou.';
    return '💪 Não desista! Estude mais e refaça o simulado.';
  }

  function getClassificacaoNota(nota: number): string {
    if (nota >= 800) return 'Excelente';
    if (nota >= 700) return 'Muito Bom';
    if (nota >= 600) return 'Bom';
    if (nota >= 500) return 'Regular';
    return 'Precisa Melhorar';
  }

  function getCorDificuldade(dificuldade: string): string {
    switch (dificuldade?.toLowerCase()) {
      case 'facil': return 'bg-green-500/20 text-green-400';
      case 'medio': return 'bg-yellow-500/20 text-yellow-400';
      case 'dificil': return 'bg-red-500/20 text-red-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  }

  const percentualAcerto = total > 0 ? Math.round((acertos / total) * 100) : 0;
  
  const detalhesFiltrados = detalhes.filter(d => {
    if (filtroDetalhes === 'acertos') return d.acertou;
    if (filtroDetalhes === 'erros') return !d.acertou;
    return true;
  });

  const errosPorAssunto = detalhes
    .filter(d => !d.acertou)
    .reduce((acc, d) => {
      acc[d.assunto] = (acc[d.assunto] || 0) + 1;
      return acc;
    }, {} as { [key: string]: number });

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-dark-400">Calculando resultado...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-900 pb-20 lg:pb-8">
      <div className={`bg-gradient-to-r ${getCorNotaTRI(notaTRI)} px-4 py-8`}>
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">📊 Resultado do Simulado</h1>
          <p className="text-white/80">{simulado?.titulo}</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="bg-dark-800 rounded-xl border border-dark-700 p-6 mb-6 text-center">
          <p className="text-dark-400 mb-2">Sua Nota TRI</p>
          <div className={`text-6xl sm:text-7xl font-bold bg-gradient-to-r ${getCorNotaTRI(notaTRI)} bg-clip-text text-transparent`}>
            {notaTRI}
          </div>
          <p className="text-dark-400 mt-2">pontos</p>
          
          <div className="mt-4">
            <span className={`inline-block px-4 py-2 rounded-full text-sm font-medium bg-gradient-to-r ${getCorNotaTRI(notaTRI)} text-white`}>
              {getClassificacaoNota(notaTRI)}
            </span>
          </div>
          
          <p className="text-dark-300 mt-4 text-lg">{getMensagemNota(notaTRI)}</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <div className="bg-dark-800 rounded-xl border border-dark-700 p-4 text-center">
            <div className="text-3xl font-bold text-green-400">{acertos}</div>
            <div className="text-dark-400 text-sm">Acertos</div>
          </div>
          <div className="bg-dark-800 rounded-xl border border-dark-700 p-4 text-center">
            <div className="text-3xl font-bold text-red-400">{erros}</div>
            <div className="text-dark-400 text-sm">Erros</div>
          </div>
          <div className="bg-dark-800 rounded-xl border border-dark-700 p-4 text-center">
            <div className="text-3xl font-bold text-blue-400">{total}</div>
            <div className="text-dark-400 text-sm">Total</div>
          </div>
          <div className="bg-dark-800 rounded-xl border border-dark-700 p-4 text-center">
            <div className="text-3xl font-bold text-yellow-400">{percentualAcerto}%</div>
            <div className="text-dark-400 text-sm">Aproveitamento</div>
          </div>
        </div>

        <div className="bg-dark-800 rounded-xl border border-dark-700 p-4 mb-6">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-green-400">✓ {acertos} acertos</span>
            <span className="text-red-400">✗ {erros} erros</span>
          </div>
          <div className="h-4 bg-dark-700 rounded-full overflow-hidden flex">
            <div className="h-full bg-gradient-to-r from-green-500 to-green-600" style={{ width: `${percentualAcerto}%` }} />
            <div className="h-full bg-gradient-to-r from-red-500 to-red-600" style={{ width: `${100 - percentualAcerto}%` }} />
          </div>
        </div>

        {Object.keys(errosPorAssunto).length > 0 && (
          <div className="bg-dark-800 rounded-xl border border-dark-700 p-6 mb-6">
            <h3 className="font-bold text-white mb-4 flex items-center gap-2">📚 Assuntos para Revisar</h3>
            <div className="space-y-2">
              {Object.entries(errosPorAssunto)
                .sort((a, b) => b[1] - a[1])
                .map(([assunto, quantidade]) => (
                  <div key={assunto} className="flex items-center justify-between p-3 bg-dark-700 rounded-lg">
                    <span className="text-dark-200">{assunto}</span>
                    <span className="text-red-400 font-bold">{quantidade} {quantidade === 1 ? 'erro' : 'erros'}</span>
                  </div>
                ))
              }
            </div>
          </div>
        )}

        {erros > 0 && (
          <div className="bg-gradient-to-r from-orange-500/10 to-red-500/10 border border-orange-500/20 rounded-xl p-6 mb-6">
            <div className="flex items-start gap-4">
              <div className="text-4xl">📓</div>
              <div className="flex-1">
                <h3 className="font-bold text-white text-lg mb-2">Caderno de Erros Atualizado!</h3>
                <p className="text-dark-300 mb-4">
                  As <strong className="text-orange-400">{erros} questões</strong> que você errou foram 
                  adicionadas ao seu <strong>Caderno de Erros</strong> com a tag 
                  "<strong className="text-white">Simulado ENEM {simulado?.numero}</strong>".
                </p>
                <p className="text-dark-400 text-sm mb-4">
                  💡 <strong>Dica:</strong> Revise essas questões antes de refazer o simulado. 
                  Entender seus erros é a melhor forma de evoluir!
                </p>
                <Link
                  href="/plataforma/enem/caderno-erros"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium transition-colors"
                >
                  📓 Ir para Caderno de Erros
                </Link>
              </div>
            </div>
          </div>
        )}

        <div className="bg-dark-800 rounded-xl border border-dark-700 overflow-hidden mb-6">
          <button
            onClick={() => setShowDetalhes(!showDetalhes)}
            className="w-full p-4 flex items-center justify-between hover:bg-dark-700 transition-colors"
          >
            <h3 className="font-bold text-white flex items-center gap-2">📋 Detalhes das Questões</h3>
            <span className="text-dark-400">{showDetalhes ? '▲' : '▼'}</span>
          </button>

          {showDetalhes && (
            <div className="border-t border-dark-700">
              <div className="p-4 border-b border-dark-700 flex gap-2">
                {(['todos', 'acertos', 'erros'] as const).map((filtro) => (
                  <button
                    key={filtro}
                    onClick={() => setFiltroDetalhes(filtro)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      filtroDetalhes === filtro
                        ? 'bg-blue-600 text-white'
                        : 'bg-dark-700 text-dark-300 hover:bg-dark-600'
                    }`}
                  >
                    {filtro === 'todos' ? 'Todas' : filtro === 'acertos' ? '✓ Acertos' : '✗ Erros'}
                  </button>
                ))}
              </div>

              <div className="max-h-96 overflow-y-auto">
                {detalhesFiltrados.map((detalhe) => {
                  const questao = questoes[detalhe.questao_id];
                  
                  return (
                    <div 
                      key={detalhe.questao_id}
                      className={`p-4 border-b border-dark-700 last:border-b-0 ${
                        detalhe.acertou ? 'bg-green-500/5' : 'bg-red-500/5'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold flex-shrink-0 ${
                          detalhe.acertou ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                        }`}>
                          {detalhe.acertou ? '✓' : '✗'}
                        </span>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className="font-bold text-white">Questão {detalhe.numero}</span>
                            <span className={`text-xs px-2 py-0.5 rounded ${getCorDificuldade(detalhe.dificuldade)}`}>
                              {detalhe.dificuldade}
                            </span>
                            <span className="text-dark-400 text-xs">{detalhe.assunto}</span>
                          </div>
                          
                          <div className="flex items-center gap-4 text-sm">
                            <span className="text-dark-400">
                              Sua resposta: 
                              <span className={`ml-1 font-bold ${detalhe.acertou ? 'text-green-400' : 'text-red-400'}`}>
                                {detalhe.resposta_usuario || '(em branco)'}
                              </span>
                            </span>
                            {!detalhe.acertou && (
                              <span className="text-dark-400">
                                Correta: <span className="ml-1 font-bold text-green-400">{detalhe.resposta_correta}</span>
                              </span>
                            )}
                          </div>

                          {!detalhe.acertou && questao?.explicacao && (
                            <div className="mt-2 p-3 bg-dark-700 rounded-lg">
                              <p className="text-dark-400 text-sm">
                                <strong className="text-white">Explicação:</strong> {questao.explicacao}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-6 mb-6">
          <h3 className="font-bold text-blue-400 mb-3 flex items-center gap-2">📊 Entenda sua Nota TRI</h3>
          <p className="text-dark-300 text-sm leading-relaxed mb-3">
            A <strong className="text-white">Teoria de Resposta ao Item (TRI)</strong> não conta apenas 
            quantas questões você acertou, mas também analisa a <strong className="text-white">coerência</strong> das respostas.
          </p>
          <p className="text-dark-300 text-sm leading-relaxed">
            Você acertou {acertos} de {total} questões ({percentualAcerto}%), sua nota TRI foi 
            <strong className={`ml-1 ${notaTRI >= 600 ? 'text-green-400' : 'text-yellow-400'}`}>{notaTRI} pontos</strong>. 
            {notaTRI >= 600 
              ? ' Isso indica que você teve um bom padrão de respostas!'
              : ' Para melhorar, foque nas questões mais básicas antes das difíceis.'
            }
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link
            href="/plataforma/enem/simulados"
            className="py-4 bg-dark-700 hover:bg-dark-600 text-white rounded-xl font-bold text-center transition-colors"
          >
            ← Voltar para Simulados
          </Link>
          <Link
            href={`/plataforma/enem/simulados/${simuladoId}`}
            className="py-4 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl font-bold text-center transition-colors"
          >
            🔄 Refazer Simulado
          </Link>
        </div>
      </div>
    </div>
  );
}
