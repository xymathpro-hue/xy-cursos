'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { 
  ArrowLeft, 
  BookOpen, 
  CheckCircle, 
  XCircle,
  ChevronDown,
  ChevronUp,
  Trash2,
  Eye,
  EyeOff,
  Filter
} from 'lucide-react';

interface ErroItem {
  id: string;
  questao_id: string;
  resposta_usuario: string;
  revisado: boolean;
  created_at: string;
  questao: {
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
    dificuldade: string;
    aula_id: string;
  };
}

export default function CadernoErrosPage() {
  const router = useRouter();
  const supabase = createClientComponentClient();

  const [erros, setErros] = useState<ErroItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState<'todos' | 'pendentes' | 'revisados'>('pendentes');
  const [expandido, setExpandido] = useState<string | null>(null);
  const [mostrarResolucao, setMostrarResolucao] = useState<string | null>(null);

  useEffect(() => {
    fetchErros();
  }, []);

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
        resposta_usuario,
        revisado,
        created_at,
        questao:questoes (
          id,
          numero,
          enunciado,
          alternativa_a,
          alternativa_b,
          alternativa_c,
          alternativa_d,
          alternativa_e,
          resposta_correta,
          explicacao,
          dificuldade,
          aula_id
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao buscar erros:', error);
    }

    if (data) {
      // Filtrar itens que têm questão válida
      const errosValidos = data.filter(item => item.questao !== null) as ErroItem[];
      setErros(errosValidos);
    }

    setLoading(false);
  }

  const handleMarcarRevisado = async (id: string, revisado: boolean) => {
    await supabase
      .from('caderno_erros')
      .update({ revisado: !revisado, updated_at: new Date().toISOString() })
      .eq('id', id);

    setErros(prev => prev.map(e => 
      e.id === id ? { ...e, revisado: !revisado } : e
    ));
  };

  const handleRemover = async (id: string) => {
    await supabase
      .from('caderno_erros')
      .delete()
      .eq('id', id);

    setErros(prev => prev.filter(e => e.id !== id));
  };

  const errosFiltrados = erros.filter(e => {
    if (filtro === 'pendentes') return !e.revisado;
    if (filtro === 'revisados') return e.revisado;
    return true;
  });

  const totalPendentes = erros.filter(e => !e.revisado).length;
  const totalRevisados = erros.filter(e => e.revisado).length;

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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/dashboard" className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
              <ArrowLeft className="w-5 h-5" />
              <span>Voltar</span>
            </Link>
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-red-500" />
              <h1 className="font-bold text-gray-900">Caderno de Erros</h1>
            </div>
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
            <p className="text-3xl font-bold text-red-600">{totalPendentes}</p>
            <p className="text-gray-500 text-sm">Pendentes</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <p className="text-3xl font-bold text-emerald-600">{totalRevisados}</p>
            <p className="text-gray-500 text-sm">Revisados</p>
          </div>
        </div>

        {/* Filtros */}
        <div className="flex items-center gap-2 mb-6">
          <Filter className="w-5 h-5 text-gray-400" />
          <button
            onClick={() => setFiltro('pendentes')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              filtro === 'pendentes' 
                ? 'bg-red-500 text-white' 
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            Pendentes ({totalPendentes})
          </button>
          <button
            onClick={() => setFiltro('revisados')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              filtro === 'revisados' 
                ? 'bg-emerald-500 text-white' 
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            Revisados ({totalRevisados})
          </button>
          <button
            onClick={() => setFiltro('todos')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              filtro === 'todos' 
                ? 'bg-blue-500 text-white' 
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            Todos ({erros.length})
          </button>
        </div>

        {/* Lista de erros */}
        {errosFiltrados.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <XCircle className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Nenhum erro pendente!</h3>
            <p className="text-gray-500 mb-6">Você revisou todos os erros. Continue estudando!</p>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600"
            >
              Continuar Estudando
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {errosFiltrados.map((erro) => {
              const isExpandido = expandido === erro.id;
              const isMostrandoResolucao = mostrarResolucao === erro.id;
              const questao = erro.questao;

              return (
                <div 
                  key={erro.id} 
                  className={`bg-white rounded-xl border-2 overflow-hidden transition-all ${
                    erro.revisado ? 'border-emerald-200' : 'border-red-200'
                  }`}
                >
                  {/* Cabeçalho */}
                  <button
                    onClick={() => setExpandido(isExpandido ? null : erro.id)}
                    className="w-full p-4 flex items-center justify-between hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        erro.revisado ? 'bg-emerald-100' : 'bg-red-100'
                      }`}>
                        {erro.revisado 
                          ? <CheckCircle className="w-5 h-5 text-emerald-600" /> 
                          : <XCircle className="w-5 h-5 text-red-600" />
                        }
                      </div>
                      <div className="text-left">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-gray-900">Questão {questao.numero}</p>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getDificuldadeCor(questao.dificuldade)}`}>
                            {getNomeDificuldade(questao.dificuldade)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500">
                          Sua: <span className="text-red-600 font-medium">{erro.resposta_usuario}</span> | 
                          Correta: <span className="text-emerald-600 font-medium">{questao.resposta_correta}</span>
                        </p>
                      </div>
                    </div>
                    {isExpandido 
                      ? <ChevronUp className="w-5 h-5 text-gray-400" /> 
                      : <ChevronDown className="w-5 h-5 text-gray-400" />
                    }
                  </button>

                  {/* Conteúdo expandido */}
                  {isExpandido && (
                    <div className="p-4 border-t border-gray-100 bg-gray-50">
                      {/* Enunciado */}
                      <p className="text-gray-700 mb-4 whitespace-pre-line">{questao.enunciado}</p>

                      {/* Alternativas */}
                      <div className="space-y-2 mb-4">
                        {['A', 'B', 'C', 'D', 'E'].map(letra => {
                          const texto = questao[`alternativa_${letra.toLowerCase()}` as keyof typeof questao] as string;
                          if (!texto) return null;
                          
                          const isCorreta = letra === questao.resposta_correta;
                          const isErrada = letra === erro.resposta_usuario && !isCorreta;
                          
                          return (
                            <div 
                              key={letra} 
                              className={`p-3 rounded-xl border ${
                                isCorreta 
                                  ? 'bg-emerald-50 border-emerald-300' 
                                  : isErrada 
                                    ? 'bg-red-50 border-red-300' 
                                    : 'bg-white border-gray-200'
                              }`}
                            >
                              <span className={`font-bold mr-2 ${
                                isCorreta ? 'text-emerald-700' : isErrada ? 'text-red-700' : 'text-gray-700'
                              }`}>
                                {letra})
                              </span>
                              <span className={
                                isCorreta ? 'text-emerald-700' : isErrada ? 'text-red-700' : 'text-gray-700'
                              }>
                                {texto}
                              </span>
                              {isCorreta && <span className="ml-2 text-emerald-600 font-medium">✓ Correta</span>}
                              {isErrada && <span className="ml-2 text-red-600 font-medium">✗ Sua resposta</span>}
                            </div>
                          );
                        })}
                      </div>

                      {/* Botão de resolução */}
                      {questao.explicacao && (
                        <div className="mb-4">
                          <button
                            onClick={() => setMostrarResolucao(isMostrandoResolucao ? null : erro.id)}
                            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
                          >
                            {isMostrandoResolucao ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            {isMostrandoResolucao ? 'Ocultar resolução' : 'Ver resolução'}
                          </button>
                          
                          {isMostrandoResolucao && (
                            <div className="mt-3 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                              <p className="font-medium text-blue-800 mb-2">💡 Resolução:</p>
                              <p className="text-blue-700 whitespace-pre-line">{questao.explicacao}</p>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Ações */}
                      <div className="flex items-center gap-3 pt-3 border-t border-gray-200">
                        <button
                          onClick={() => handleMarcarRevisado(erro.id, erro.revisado)}
                          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                            erro.revisado
                              ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                              : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                          }`}
                        >
                          <CheckCircle className="w-4 h-4" />
                          {erro.revisado ? 'Marcar como pendente' : 'Marcar como revisado'}
                        </button>
                        <button
                          onClick={() => handleRemover(erro.id)}
                          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-red-100 text-red-700 hover:bg-red-200"
                        >
                          <Trash2 className="w-4 h-4" />
                          Remover
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
