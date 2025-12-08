'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { ArrowLeft, BookX, CheckCircle, Eye, EyeOff, RotateCcw, Filter, Trash2 } from 'lucide-react';

interface ErroItem {
  id: string;
  questao_id: string;
  revisado: boolean;
  created_at: string;
  questao: {
    id: string;
    enunciado: string;
    alternativas: string[];
    resposta_correta: number;
    explicacao: string;
    dificuldade: string;
    fase: {
      modulo: {
        titulo: string;
        icone: string;
      };
    };
  };
  resposta_usuario: string;
}

export default function CadernoErrosPage() {
  const router = useRouter();
  const supabase = createClientComponentClient();
  
  const [erros, setErros] = useState<ErroItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState<'todos' | 'pendentes' | 'revisados'>('pendentes');
  const [questaoExpandida, setQuestaoExpandida] = useState<string | null>(null);
  const [mostrarResolucao, setMostrarResolucao] = useState<string | null>(null);

  useEffect(() => {
    async function fetchErros() {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push('/login');
        return;
      }

      const { data, error } = await supabase
        .from('caderno_erros')
        .select(`
          id,
          questao_id,
          revisado,
          created_at,
          resposta_usuario,
          questoes (
            id,
            enunciado,
            alternativas,
            resposta_correta,
            explicacao,
            dificuldade,
            fases (
              modulos (
                titulo,
                icone
              )
            )
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (data) {
        const errosFormatados = data.map((item: any) => ({
          id: item.id,
          questao_id: item.questao_id,
          revisado: item.revisado,
          created_at: item.created_at,
          resposta_usuario: item.resposta_usuario,
          questao: {
            id: item.questoes?.id,
            enunciado: item.questoes?.enunciado,
            alternativas: item.questoes?.alternativas || [],
            resposta_correta: item.questoes?.resposta_correta,
            explicacao: item.questoes?.explicacao,
            dificuldade: item.questoes?.dificuldade,
            fase: {
              modulo: {
                titulo: item.questoes?.fases?.modulos?.titulo || 'Módulo',
                icone: item.questoes?.fases?.modulos?.icone || '📚',
              }
            }
          }
        }));
        setErros(errosFormatados);
      }

      setLoading(false);
    }

    fetchErros();
  }, [supabase, router]);

  const marcarRevisado = async (erroId: string, revisado: boolean) => {
    const { error } = await supabase
      .from('caderno_erros')
      .update({ revisado, updated_at: new Date().toISOString() })
      .eq('id', erroId);

    if (!error) {
      setErros(erros.map(e => e.id === erroId ? { ...e, revisado } : e));
    }
  };

  const removerDoCarderno = async (erroId: string) => {
    const { error } = await supabase
      .from('caderno_erros')
      .delete()
      .eq('id', erroId);

    if (!error) {
      setErros(erros.filter(e => e.id !== erroId));
    }
  };

  const errosFiltrados = erros.filter(e => {
    if (filtro === 'pendentes') return !e.revisado;
    if (filtro === 'revisados') return e.revisado;
    return true;
  });

  const totalPendentes = erros.filter(e => !e.revisado).length;
  const totalRevisados = erros.filter(e => e.revisado).length;

  const getDificuldadeCor = (dif: string) => {
    switch (dif?.toLowerCase()) {
      case 'facil': return 'bg-emerald-100 text-emerald-700';
      case 'medio': return 'bg-amber-100 text-amber-700';
      case 'dificil': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const letras = ['A', 'B', 'C', 'D', 'E'];

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
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/dashboard" className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
              <ArrowLeft className="w-5 h-5" />
              <span>Voltar</span>
            </Link>
            <h1 className="font-bold text-gray-900 flex items-center gap-2">
              <BookX className="w-5 h-5 text-red-500" />
              Caderno de Erros
            </h1>
            <div className="w-20"></div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* Estatísticas */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <p className="text-3xl font-bold text-gray-900">{erros.length}</p>
            <p className="text-gray-500 text-sm">Total</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <p className="text-3xl font-bold text-red-500">{totalPendentes}</p>
            <p className="text-gray-500 text-sm">Pendentes</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <p className="text-3xl font-bold text-emerald-500">{totalRevisados}</p>
            <p className="text-gray-500 text-sm">Revisados</p>
          </div>
        </div>

        {/* Filtros */}
        <div className="flex items-center gap-2 mb-6">
          <Filter className="w-5 h-5 text-gray-400" />
          <div className="flex gap-2">
            {[
              { id: 'pendentes', label: 'Pendentes', count: totalPendentes },
              { id: 'revisados', label: 'Revisados', count: totalRevisados },
              { id: 'todos', label: 'Todos', count: erros.length },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setFiltro(f.id as any)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  filtro === f.id
                    ? 'bg-blue-500 text-white'
                    : 'bg-white border border-gray-200 text-gray-600 hover:border-blue-300'
                }`}
              >
                {f.label} ({f.count})
              </button>
            ))}
          </div>
        </div>

        {/* Lista de Erros */}
        {errosFiltrados.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
            <BookX className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              {filtro === 'pendentes' ? 'Nenhum erro pendente!' : 'Nenhum erro encontrado'}
            </h3>
            <p className="text-gray-500 mb-6">
              {filtro === 'pendentes' 
                ? 'Você revisou todos os erros. Continue estudando!' 
                : 'Continue praticando para registrar seus erros aqui.'}
            </p>
            <Link
              href="/plataforma/enem"
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600"
            >
              Continuar Estudando
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {errosFiltrados.map((erro) => (
              <div
                key={erro.id}
                className={`bg-white rounded-2xl border overflow-hidden transition-all ${
                  erro.revisado ? 'border-emerald-200' : 'border-gray-200'
                }`}
              >
                {/* Cabeçalho da questão */}
                <div 
                  className="p-4 cursor-pointer hover:bg-gray-50"
                  onClick={() => setQuestaoExpandida(questaoExpandida === erro.id ? null : erro.id)}
                >
                  <div className="flex items-start gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl ${
                      erro.revisado ? 'bg-emerald-100' : 'bg-red-100'
                    }`}>
                      {erro.revisado ? '✓' : erro.questao.fase?.modulo?.icone || '📚'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-gray-500 text-sm">{erro.questao.fase?.modulo?.titulo}</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getDificuldadeCor(erro.questao.dificuldade)}`}>
                          {erro.questao.dificuldade || 'Médio'}
                        </span>
                        {erro.revisado && (
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                            ✓ Revisado
                          </span>
                        )}
                      </div>
                      <p className="text-gray-900 line-clamp-2">{erro.questao.enunciado}</p>
                    </div>
                  </div>
                </div>

                {/* Conteúdo expandido */}
                {questaoExpandida === erro.id && (
                  <div className="border-t border-gray-100 p-4 bg-gray-50">
                    {/* Enunciado completo */}
                    <p className="text-gray-700 mb-4">{erro.questao.enunciado}</p>

                    {/* Alternativas */}
                    <div className="space-y-2 mb-4">
                      {erro.questao.alternativas?.map((alt, idx) => {
                        const isCorreta = idx === erro.questao.resposta_correta;
                        const isErrada = erro.resposta_usuario === letras[idx] && !isCorreta;
                        
                        return (
                          <div
                            key={idx}
                            className={`p-3 rounded-xl border ${
                              isCorreta
                                ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                                : isErrada
                                  ? 'bg-red-50 border-red-300 text-red-800'
                                  : 'bg-white border-gray-200 text-gray-700'
                            }`}
                          >
                            <span className="font-bold mr-2">{letras[idx]})</span>
                            {alt}
                            {isCorreta && <span className="ml-2">✓ Correta</span>}
                            {isErrada && <span className="ml-2">✗ Sua resposta</span>}
                          </div>
                        );
                      })}
                    </div>

                    {/* Resolução */}
                    {erro.questao.explicacao && (
                      <div className="mb-4">
                        <button
                          onClick={() => setMostrarResolucao(mostrarResolucao === erro.id ? null : erro.id)}
                          className="flex items-center gap-2 text-blue-600 font-medium hover:underline"
                        >
                          {mostrarResolucao === erro.id ? (
                            <><EyeOff className="w-4 h-4" /> Ocultar resolução</>
                          ) : (
                            <><Eye className="w-4 h-4" /> Ver resolução</>
                          )}
                        </button>
                        
                        {mostrarResolucao === erro.id && (
                          <div className="mt-3 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                            <p className="text-blue-800 whitespace-pre-line">{erro.questao.explicacao}</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Ações */}
                    <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
                      <button
                        onClick={() => marcarRevisado(erro.id, !erro.revisado)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all ${
                          erro.revisado
                            ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            : 'bg-emerald-500 text-white hover:bg-emerald-600'
                        }`}
                      >
                        <CheckCircle className="w-4 h-4" />
                        {erro.revisado ? 'Marcar como pendente' : 'Marcar como revisado'}
                      </button>
                      
                      <button
                        onClick={() => removerDoCarderno(erro.id)}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl font-medium bg-white border border-red-200 text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                        Remover
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
