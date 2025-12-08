'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Lightbulb, ChevronLeft, ChevronRight, Bookmark, BookmarkCheck, Share2, Sparkles, RefreshCcw } from 'lucide-react';

interface Dica {
  id: string;
  titulo: string;
  conteudo: string;
  categoria: string;
  plataforma: string;
}

interface DicaDoDiaProps {
  userId: string;
}

const dicasFallback: Dica[] = [
  { id: 'fb1', titulo: 'Regra de Três em Segundos', conteudo: 'Para regra de três simples, lembre: "Quem está em cima, multiplica em cruz". Se A está para B, assim como C está para X, então X = (B × C) / A.', categoria: 'macete', plataforma: 'enem' },
  { id: 'fb2', titulo: 'Fatoração Rápida', conteudo: 'Para fatorar x² - a², lembre: é sempre (x+a)(x-a). Exemplo: x² - 9 = (x+3)(x-3). Essas fórmulas resolvem 80% das questões!', categoria: 'formula', plataforma: 'enem' },
  { id: 'fb3', titulo: 'Geometria Analítica', conteudo: 'Distância entre dois pontos: d = √[(x₂-x₁)² + (y₂-y₁)²]. Ponto médio: M = ((x₁+x₂)/2, (y₁+y₂)/2). Grave essas duas!', categoria: 'formula', plataforma: 'enem' },
  { id: 'fb4', titulo: 'Gestão do Tempo ENEM', conteudo: 'São 45 questões em 5 horas = 6 a 7 minutos por questão. Se passar de 10 min numa questão, pule e volte depois!', categoria: 'estrategia', plataforma: 'enem' },
  { id: 'fb5', titulo: 'Elimine Alternativas', conteudo: 'Não sabe a resposta? Elimine as absurdas. Se sobrar 2, você tem 50% de chance. Melhor que chutar entre 5!', categoria: 'estrategia', plataforma: 'enem' },
  { id: 'fb6', titulo: 'Porcentagem Mental', conteudo: 'Para calcular 15% de algo: calcule 10% (divide por 10) + metade desse valor (5%). Exemplo: 15% de 200 = 20 + 10 = 30.', categoria: 'dica-rapida', plataforma: 'enem' },
];

const categoriaEmojis: Record<string, string> = { 'dica-rapida': '⚡', 'conceito': '📚', 'macete': '🧠', 'curiosidade': '🤔', 'pratica': '✍️', 'formula': '📐', 'estrategia': '🎯' };

export function DicaDoDia({ userId }: DicaDoDiaProps) {
  const [dica, setDica] = useState<Dica | null>(null);
  const [todasDicas, setTodasDicas] = useState<Dica[]>([]);
  const [indiceDica, setIndiceDica] = useState(0);
  const [loading, setLoading] = useState(true);
  const [salva, setSalva] = useState(false);
  const [animacao, setAnimacao] = useState(false);
  const supabase = createClientComponentClient();

  useEffect(() => { fetchDicas(); }, []);
  useEffect(() => { verificarDicaSalva(); }, [dica, userId]);

  const fetchDicas = async () => {
    try {
      const { data } = await supabase.from('dicas').select('*').eq('ativa', true).eq('plataforma', 'enem');
      let dicasDisponiveis = data && data.length > 0 ? data : dicasFallback;
      setTodasDicas(dicasDisponiveis);
      const hoje = new Date();
      const diaDoAno = Math.floor((hoje.getTime() - new Date(hoje.getFullYear(), 0, 0).getTime()) / 86400000);
      const indice = diaDoAno % dicasDisponiveis.length;
      setIndiceDica(indice);
      setDica(dicasDisponiveis[indice] || null);
    } catch (error) {
      setTodasDicas(dicasFallback);
      setDica(dicasFallback[0]);
    } finally { setLoading(false); }
  };

  const verificarDicaSalva = async () => {
    if (!dica || !userId) return;
    try {
      const { data } = await supabase.from('dicas_salvas').select('id').eq('user_id', userId).eq('dica_id', dica.id).single();
      setSalva(!!data);
    } catch { setSalva(false); }
  };

  const alternarSalvar = async () => {
    if (!dica || !userId) return;
    try {
      if (salva) { await supabase.from('dicas_salvas').delete().eq('user_id', userId).eq('dica_id', dica.id); setSalva(false); }
      else { await supabase.from('dicas_salvas').insert({ user_id: userId, dica_id: dica.id }); setSalva(true); }
    } catch (error) { console.error('Erro:', error); }
  };

  const navegarDica = (direcao: 'anterior' | 'proxima') => {
    setAnimacao(true);
    setTimeout(() => {
      let novoIndice = direcao === 'anterior' ? (indiceDica === 0 ? todasDicas.length - 1 : indiceDica - 1) : (indiceDica === todasDicas.length - 1 ? 0 : indiceDica + 1);
      setIndiceDica(novoIndice);
      setDica(todasDicas[novoIndice]);
      setAnimacao(false);
    }, 150);
  };

  const dicaAleatoria = () => {
    setAnimacao(true);
    setTimeout(() => {
      const indiceAleatorio = Math.floor(Math.random() * todasDicas.length);
      setIndiceDica(indiceAleatorio);
      setDica(todasDicas[indiceAleatorio]);
      setAnimacao(false);
    }, 150);
  };

  const compartilhar = async () => {
    if (!dica) return;
    const texto = `💡 Dica do XY Cursos\n\n${dica.titulo}\n\n${dica.conteudo}\n\n📚 Estude mais em xy-cursos.vercel.app`;
    if (navigator.share) { try { await navigator.share({ text: texto }); } catch {} }
    else { await navigator.clipboard.writeText(texto); alert('Dica copiada!'); }
  };

  if (loading) return <div className="animate-pulse"><div className="h-64 bg-slate-800/50 rounded-3xl"></div></div>;
  if (!dica) return <div className="rounded-3xl bg-slate-800/50 border border-slate-700/50 p-8 text-center"><Lightbulb className="w-12 h-12 text-slate-600 mx-auto mb-4" /><p className="text-slate-400">Nenhuma dica disponível.</p></div>;

  const categoriaEmoji = categoriaEmojis[dica.categoria] || '💡';

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-slate-700/50">
      <div className="absolute inset-0 opacity-5"><div className="absolute inset-0" style={{ backgroundImage: `radial-gradient(circle at 20px 20px, white 1px, transparent 0)`, backgroundSize: '40px 40px' }}></div></div>
      <div className="absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full blur-3xl opacity-20"></div>
      <div className="relative z-10 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg"><Lightbulb className="w-6 h-6 text-white" /></div>
            <div>
              <p className="text-slate-400 text-xs uppercase tracking-wider font-medium">Dica do Dia</p>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gradient-to-r from-blue-500 to-indigo-600 text-white">🎓 ENEM</span>
                <span className="text-slate-500 text-xs">{categoriaEmoji} {dica.categoria}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={alternarSalvar} className={`p-2 rounded-xl transition-all ${salva ? 'bg-yellow-500/20 text-yellow-400' : 'bg-slate-700/50 text-slate-400 hover:text-yellow-400'}`}>{salva ? <BookmarkCheck className="w-5 h-5" /> : <Bookmark className="w-5 h-5" />}</button>
            <button onClick={compartilhar} className="p-2 rounded-xl bg-slate-700/50 text-slate-400 hover:text-white transition-all"><Share2 className="w-5 h-5" /></button>
          </div>
        </div>
        <div className={`transition-all duration-150 ${animacao ? 'opacity-0 translate-y-2' : 'opacity-100 translate-y-0'}`}>
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2"><Sparkles className="w-5 h-5 text-yellow-400" />{dica.titulo}</h3>
          <div className="rounded-2xl bg-slate-800/50 border border-slate-700/50 p-5 mb-6"><p className="text-slate-300 leading-relaxed">{dica.conteudo}</p></div>
        </div>
        <div className="flex items-center justify-between pt-4 border-t border-slate-700/50">
          <div className="flex items-center gap-2">
            <button onClick={() => navegarDica('anterior')} className="p-2 rounded-xl bg-slate-700/50 text-slate-400 hover:text-white hover:bg-slate-600/50 transition-all"><ChevronLeft className="w-5 h-5" /></button>
            <button onClick={() => navegarDica('proxima')} className="p-2 rounded-xl bg-slate-700/50 text-slate-400 hover:text-white hover:bg-slate-600/50 transition-all"><ChevronRight className="w-5 h-5" /></button>
          </div>
          <span className="text-slate-500 text-sm">{indiceDica + 1} / {todasDicas.length}</span>
          <button onClick={dicaAleatoria} className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-sm font-medium hover:opacity-90 transition-all flex items-center gap-2"><RefreshCcw className="w-4 h-4" />Outra</button>
        </div>
      </div>
    </div>
  );
}
