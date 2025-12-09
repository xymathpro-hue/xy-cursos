'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { ArrowLeft, BookOpen, CheckCircle, Trash2, RotateCcw } from 'lucide-react';
import MathText from '@/components/MathText';

interface ErroItem {
  id: string;
  questao_id: string;
  resposta_usuario: string;
  resposta_correta: string;
  revisado: boolean;
  created_at: string;
  questao: {
    enunciado: string;
    alternativa_a: string;
    alternativa_b: string;
    alternativa_c: string;
    alternativa_d: string;
    alternativa_e: string;
    explicacao: string;
  };
}

export default function CadernoErrosPage() {
  const router = useRouter();
  const supabase = createClientComponentClient();

  const [loading, setLoading] = useState(true);
  const [erros, setErros] = useState<ErroItem[]>([]);
  const [erroAberto, setErroAberto] = useState<string | null>(null);
  const [filtro, setFiltro] = useState<'todos' | 'pendentes' | 'revisados'>('pendentes');

  useEffect(() => {
    async function fetchData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      const { data } = await supabase
        .from('caderno_erros')
        .select(`
          id,
          questao_id,
          resposta_usuario,
          resposta_correta,
          revisado,
          created_at,
          questao:questoes (
            enunciado,
            alternativa_a,
            alternativa_b,
            alternativa_c,
            alternativa_d,
            alternativa_e,
            explicacao
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (data) {
        const errosFormatados = data.map(item => ({
          ...item,
          questao: Array.isArray(item.questao) ? item.questao[0] : item.questao
        })) as ErroItem[];
        setErros(errosFormatados);
      }

      setLoading(false);
    }

    fetchData();
  }, [supabase, router]);

  const marcarRevisado = async (id: string) => {
    await supabase
      .from('caderno_erros')
      .update({ revisado: true })
      .eq('id', id);

    setErros(prev => prev.map(e => e.id === id ? { ...e, revisado: true } : e));
  };

  const removerErro = async (id: string) => {
    await supabase
      .from('caderno_erros')
      .delete()
      .eq('id', id);

    setErros(prev => prev.filter(e => e.id !== id));
    setErroAberto(null);
  };

  const getLetraTexto = (erro: ErroItem, letra: string) => {
    const key = `alternativa_${letra}` as keyof typeof erro.questao;
    return erro.questao[key] || '';
  };

  const errosFiltrados = erros.filter(e => {
    if (filtro === 'pendentes') return !e.revisado;
    if (filtro === 'revisados') return e.revisado;
    return true;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-red-500/30 border-t-red-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="p-2 hover:bg-gray-100 rounded-lg">
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <BookOpen className="w-6 h-6 text-red-500" />
                Caderno de Erros
              </h1>
              <p className="text-sm text-gray-500">{erros.filter(e => !e.revisado).length} pendentes</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setFiltro('pendentes')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${filtro === 'pendentes' ? 'bg-red-500 text-white' : 'bg-white text-gray-600 border border-gray-200'}`}
          >
            Pendentes
          </button>
          <button
            onClick={() => setFiltro('revisados')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${filtro === 'revisados' ? 'bg-emerald-500 text-white' : 'bg-white text-gray-600 border border-gray-200'}`}
          >
            Revisados
          </button>
          <button
            onClick={() => setFiltro('todos')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${filtro === 'todos' ? 'bg-gray-700 text-white' : 'bg-white text-gray-600 border border-gray-200'}`}
          >
            Todos
          </button>
        </div>

        {errosFiltrados.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-500">
              {filtro === 'pendentes' ? 'Nenhum erro pendente!' : 'Nenhum erro encontrado.'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {errosFiltrados.map((erro) => (
              <div key={erro.id} className={`bg-white rounded-2xl border overflow-hidden ${erro.revisado ? 'border-emerald-200' : 'border-red-200'}`}>
                <button
                  onClick={() => setErroAberto(erroAberto === erro.id ? null : erro.id)}
                  className="w-full text-left p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <MathText text={erro.questao?.enunciado?.substring(0, 100) + '...' || 'Questão não encontrada'} className="text-gray-900" />
                      <div className="flex items-center gap-2 mt-2">
                        <span className={`text-xs px-2 py-1 rounded-full ${erro.revisado ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                          {erro.revisado ? 'Revisado' : 'Pendente'}
                        </span>
                        <span className="text-xs text-gray-400">
                          {new Date(erro.created_at).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                    </div>
                    <RotateCcw className={`w-5 h-5 text-gray-400 transition-transform ${erroAberto === erro.id ? 'rotate-180' : ''}`} />
                  </div>
                </button>

                {erroAberto === erro.id && erro.questao && (
                  <div className="px-4 pb-4 border-t border-gray-100 pt-4">
                    <div className="bg-gray-50 rounded-xl p-4 mb-4">
                      <MathText text={erro.questao.enunciado} className="text-gray-900" />
                    </div>

                    <div className="space-y-2 mb-4">
                      {['a', 'b', 'c', 'd', 'e'].map((letra) => {
                        const texto = getLetraTexto(erro, letra);
                        if (!texto) return null;
                        const isCorreta = letra === erro.resposta_correta;
                        const isErrada = letra === erro.resposta_usuario && !isCorreta;

                        return (
                          <div
                            key={letra}
                            className={`p-3 rounded-lg border-2 ${isCorreta ? 'border-emerald-500 bg-emerald-50' : isErrada ? 'border-red-500 bg-red-50' : 'border-gray-200'}`}
                          >
                            <div className="flex items-start gap-2">
                              <span className={`w-6 h-6 rounded flex items-center justify-center text-xs font-bold ${isCorreta ? 'bg-emerald-500 text-white' : isErrada ? 'bg-red-500 text-white' : 'bg-gray-200 text-gray-600'}`}>
                                {letra.toUpperCase()}
                              </span>
                              <MathText text={texto} className="flex-1 text-gray-700" />
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {erro.questao.explicacao && (
                      <div className="bg-blue-50 rounded-xl p-4 mb-4">
                        <p className="text-sm font-bold text-blue-700 mb-1">Explicação:</p>
                        <MathText text={erro.questao.explicacao} className="text-blue-600 text-sm" />
                      </div>
                    )}

                    <div className="flex gap-2">
                      {!erro.revisado && (
                        <button
                          onClick={() => marcarRevisado(erro.id)}
                          className="flex-1 bg-emerald-500 text-white font-bold py-2 rounded-lg hover:bg-emerald-600 transition-all flex items-center justify-center gap-2"
                        >
                          <CheckCircle className="w-4 h-4" />
                          Marcar como revisado
                        </button>
                      )}
                      <button
                        onClick={() => removerErro(erro.id)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all"
                      >
                        <Trash2 className="w-5 h-5" />
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
