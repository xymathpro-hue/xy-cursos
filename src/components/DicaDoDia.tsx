
'use client';

import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Lightbulb, RefreshCw, X } from 'lucide-react';

interface Dica {
  id: string;
  titulo: string;
  conteudo: string;
  categoria: string;
  icone: string;
}

export default function DicaDoDia() {
  const supabase = createClientComponentClient();
  const [dica, setDica] = useState<Dica | null>(null);
  const [loading, setLoading] = useState(true);
  const [minimizado, setMinimizado] = useState(false);

  const fetchDica = async () => {
    setLoading(true);
    
    // Usar o dia do ano como seed para ter uma dica "fixa" por dia
    const hoje = new Date();
    const inicioAno = new Date(hoje.getFullYear(), 0, 0);
    const diff = hoje.getTime() - inicioAno.getTime();
    const diaDoAno = Math.floor(diff / (1000 * 60 * 60 * 24));

    // Buscar todas as dicas
    const { data: dicas } = await supabase
      .from('dicas')
      .select('*')
      .eq('ativo', true);

    if (dicas && dicas.length > 0) {
      // Selecionar dica baseada no dia do ano
      const indiceDica = diaDoAno % dicas.length;
      setDica(dicas[indiceDica]);
    }

    setLoading(false);
  };

  const fetchDicaAleatoria = async () => {
    setLoading(true);
    
    const { data: dicas } = await supabase
      .from('dicas')
      .select('*')
      .eq('ativo', true);

    if (dicas && dicas.length > 0) {
      const indiceAleatorio = Math.floor(Math.random() * dicas.length);
      setDica(dicas[indiceAleatorio]);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchDica();
  }, []);

  const getCategoriaCor = (categoria: string) => {
    switch (categoria) {
      case 'aritmetica': return 'bg-blue-100 text-blue-700';
      case 'algebra': return 'bg-purple-100 text-purple-700';
      case 'geometria': return 'bg-emerald-100 text-emerald-700';
      case 'estatistica': return 'bg-amber-100 text-amber-700';
      case 'financeira': return 'bg-green-100 text-green-700';
      case 'funcoes': return 'bg-indigo-100 text-indigo-700';
      case 'sequencias': return 'bg-pink-100 text-pink-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getCategoriaNome = (categoria: string) => {
    switch (categoria) {
      case 'aritmetica': return 'Aritmética';
      case 'algebra': return 'Álgebra';
      case 'geometria': return 'Geometria';
      case 'estatistica': return 'Estatística';
      case 'financeira': return 'Mat. Financeira';
      case 'funcoes': return 'Funções';
      case 'sequencias': return 'Sequências';
      default: return 'Dica Geral';
    }
  };

  if (loading) {
    return (
      <div className="bg-gradient-to-r from-amber-50 to-yellow-50 rounded-2xl p-5 border border-amber-200 animate-pulse">
        <div className="h-6 bg-amber-200 rounded w-1/3 mb-3"></div>
        <div className="h-4 bg-amber-100 rounded w-full mb-2"></div>
        <div className="h-4 bg-amber-100 rounded w-2/3"></div>
      </div>
    );
  }

  if (!dica) return null;

  if (minimizado) {
    return (
      <button
        onClick={() => setMinimizado(false)}
        className="bg-gradient-to-r from-amber-50 to-yellow-50 rounded-2xl p-4 border border-amber-200 hover:border-amber-300 transition-all w-full text-left"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center text-xl">
            💡
          </div>
          <div>
            <p className="font-bold text-gray-900">Dica do Dia</p>
            <p className="text-sm text-gray-500">Clique para expandir</p>
          </div>
        </div>
      </button>
    );
  }

  return (
    <div className="bg-gradient-to-r from-amber-50 to-yellow-50 rounded-2xl p-5 border border-amber-200 relative">
      {/* Botões de ação */}
      <div className="absolute top-3 right-3 flex items-center gap-1">
        <button
          onClick={fetchDicaAleatoria}
          className="p-2 text-amber-600 hover:bg-amber-100 rounded-lg transition-all"
          title="Outra dica"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
        <button
          onClick={() => setMinimizado(true)}
          className="p-2 text-amber-600 hover:bg-amber-100 rounded-lg transition-all"
          title="Minimizar"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Conteúdo */}
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center text-2xl shrink-0">
          {dica.icone}
        </div>
        <div className="flex-1 pr-16">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getCategoriaCor(dica.categoria)}`}>
              {getCategoriaNome(dica.categoria)}
            </span>
          </div>
          <h3 className="font-bold text-gray-900 mb-2">{dica.titulo}</h3>
          <p className="text-gray-700 text-sm leading-relaxed">{dica.conteudo}</p>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-4 pt-3 border-t border-amber-200 flex items-center justify-between">
        <div className="flex items-center gap-2 text-amber-600 text-sm">
          <Lightbulb className="w-4 h-4" />
          <span>Dica do Dia</span>
        </div>
        <p className="text-amber-500 text-xs">
          {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
      </div>
    </div>
  );
}
