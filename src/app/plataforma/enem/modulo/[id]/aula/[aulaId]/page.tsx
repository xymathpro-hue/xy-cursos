'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { ArrowLeft, ArrowRight, BookOpen, Lightbulb, Calculator, CheckCircle, Clock, FileText } from 'lucide-react';

declare global {
  interface Window {
    renderMathInElement?: (element: HTMLElement, options?: any) => void;
  }
}

interface Aula {
  id: string;
  numero: number;
  titulo: string;
  descricao: string;
  conteudo_teoria: string;
  formulas: string;
  dicas: string;
  exercicios_resolvidos: string;
  duracao_minutos: number;
  modulo_id: string;
}

interface Modulo {
  id: string;
  numero: number;
  titulo: string;
}

export default function AulaPage() {
  const params = useParams();
  const router = useRouter();
  const moduloId = params.id as string;
  const aulaId = params.aulaId as string;
  const supabase = createClientComponentClient();
  const contentRef = useRef<HTMLDivElement>(null);

  const [aula, setAula] = useState<Aula | null>(null);
  const [modulo, setModulo] = useState<Modulo | null>(null);
  const [todasAulas, setTodasAulas] = useState<Aula[]>([]);
  const [loading, setLoading] = useState(true);
  const [concluida, setConcluida] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [secaoAtiva, setSecaoAtiva] = useState<'teoria' | 'formulas' | 'dicas' | 'exercicios'>('teoria');

  useEffect(() => {
    async function fetchData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/login'); return; }
      setUserId(user.id);

      const { data: aulaData } = await supabase.from('aulas').select('*').eq('id', aulaId).single();
      if (aulaData) setAula(aulaData);

      const { data: moduloData } = await supabase.from('modulos').select('*').eq('id', moduloId).single();
      if (moduloData) setModulo(moduloData);

      const { data: aulasData } = await supabase.from('aulas').select('*').eq('modulo_id', moduloId).eq('ativo', true).order('ordem', { ascending: true });
      if (aulasData) setTodasAulas(aulasData);

      const { data: progressoData } = await supabase.from('progresso_aulas').select('concluida').eq('user_id', user.id).eq('aula_id', aulaId).single();
      if (progressoData) setConcluida(progressoData.concluida);

      setLoading(false);
    }
    if (aulaId && moduloId) fetchData();
  }, [aulaId, moduloId, supabase, router]);

  // Renderizar LaTeX quando o conteúdo mudar
  useEffect(() => {
    if (contentRef.current && window.renderMathInElement) {
      window.renderMathInElement(contentRef.current, {
        delimiters: [
          { left: '$$', right: '$$', display: true },
          { left: '$', right: '$', display: false },
          { left: '\\[', right: '\\]', display: true },
          { left: '\\(', right: '\\)', display: false }
        ],
        throwOnError: false
      });
    }
  }, [secaoAtiva, aula]);

  const marcarConcluida = async () => {
    if (!userId || !aulaId) return;
    const { error } = await supabase.from('progresso_aulas').upsert({ user_id: userId, aula_id: aulaId, concluida: true, updated_at: new Date().toISOString() }, { onConflict: 'user_id,aula_id' });
    if (!error) setConcluida(true);
  };

  const indiceAtual = todasAulas.findIndex(a => a.id === aulaId);
  const aulaAnterior = indiceAtual > 0 ? todasAulas[indiceAtual - 1] : null;
  const proximaAula = indiceAtual < todasAulas.length - 1 ? todasAulas[indiceAtual + 1] : null;

  if (loading) return (<div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div></div>);
  if (!aula || !modulo) return (<div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center"><p className="text-gray-500 mb-4">Aula não encontrada.</p><Link href={`/plataforma/enem/modulo/${moduloId}`} className="text-blue-600 hover:underline">Voltar</Link></div>);

  const secoes = [
    { id: 'teoria', nome: 'Teoria', icone: BookOpen, conteudo: aula.conteudo_teoria },
    { id: 'formulas', nome: 'Fórmulas', icone: Calculator, conteudo: aula.formulas },
    { id: 'dicas', nome: 'Dicas', icone: Lightbulb, conteudo: aula.dicas },
    { id: 'exercicios', nome: 'Resolvidos', icone: FileText, conteudo: aula.exercicios_resolvidos },
  ].filter(s => s.conteudo);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href={`/plataforma/enem/modulo/${moduloId}`} className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
              <ArrowLeft className="w-5 h-5" /><span className="hidden sm:inline">Voltar</span>
            </Link>
            <div className="text-center">
              <p className="text-gray-500 text-sm">{modulo.titulo}</p>
              <p className="font-bold text-gray-900">Aula {aula.numero}: {aula.titulo}</p>
            </div>
            <div className="flex items-center gap-2 text-gray-500">
              <Clock className="w-4 h-4" /><span className="text-sm">{aula.duracao_minutos}min</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {concluida && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-6 flex items-center gap-3">
            <CheckCircle className="w-6 h-6 text-emerald-500" />
            <p className="text-emerald-700 font-medium">Você já concluiu esta aula!</p>
          </div>
        )}

        {secoes.length > 0 && (
          <div className="flex overflow-x-auto gap-2 mb-6 pb-2">
            {secoes.map((secao) => {
              const Icon = secao.icone;
              return (
                <button key={secao.id} onClick={() => setSecaoAtiva(secao.id as any)} className={`flex items-center gap-2 px-4 py-2 rounded-xl whitespace-nowrap font-medium transition-all ${secaoAtiva === secao.id ? 'bg-blue-500 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-blue-300'}`}>
                  <Icon className="w-4 h-4" />{secao.nome}
                </button>
              );
            })}
          </div>
        )}

        <div ref={contentRef} className="bg-white border border-gray-200 rounded-2xl p-6 mb-6">
          {secaoAtiva === 'teoria' && aula.conteudo_teoria && (
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center"><BookOpen className="w-5 h-5 text-blue-600" /></div>
                <h2 className="text-xl font-bold text-gray-900">Teoria</h2>
              </div>
              <div className="text-gray-700 whitespace-pre-line leading-relaxed">{aula.conteudo_teoria}</div>
            </div>
          )}

          {secaoAtiva === 'formulas' && aula.formulas && (
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center"><Calculator className="w-5 h-5 text-purple-600" /></div>
                <h2 className="text-xl font-bold text-gray-900">Fórmulas</h2>
              </div>
              <div className="space-y-4">
                <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-6 border border-purple-200">
                  <div className="text-gray-800 text-lg leading-relaxed whitespace-pre-line">{aula.formulas}</div>
                </div>
              </div>
            </div>
          )}

          {secaoAtiva === 'dicas' && aula.dicas && (
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center"><Lightbulb className="w-5 h-5 text-amber-600" /></div>
                <h2 className="text-xl font-bold text-gray-900">Dicas e Macetes</h2>
              </div>
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-6">
                <div className="text-gray-700 whitespace-pre-line leading-relaxed">{aula.dicas}</div>
              </div>
            </div>
          )}

          {secaoAtiva === 'exercicios' && aula.exercicios_resolvidos && (
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center"><FileText className="w-5 h-5 text-emerald-600" /></div>
                <h2 className="text-xl font-bold text-gray-900">Exercícios Resolvidos</h2>
              </div>
              <div className="text-gray-700 whitespace-pre-line leading-relaxed">{aula.exercicios_resolvidos}</div>
            </div>
          )}

          {secoes.length === 0 && (
            <div className="text-center py-12"><BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" /><p className="text-gray-500">Conteúdo em breve!</p></div>
          )}
        </div>

        {!concluida && (
          <button onClick={marcarConcluida} className="w-full py-4 rounded-xl bg-emerald-500 text-white font-bold hover:bg-emerald-600 transition-all flex items-center justify-center gap-2 mb-6">
            <CheckCircle className="w-5 h-5" />Marcar aula como concluída
          </button>
        )}

        <div className="flex items-center justify-between">
          {aulaAnterior ? (
            <Link href={`/plataforma/enem/modulo/${moduloId}/aula/${aulaAnterior.id}`} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-gray-200 text-gray-600 hover:border-blue-300">
              <ArrowLeft className="w-5 h-5" /><span className="hidden sm:inline">Anterior</span>
            </Link>
          ) : <div></div>}
          {proximaAula ? (
            <Link href={`/plataforma/enem/modulo/${moduloId}/aula/${proximaAula.id}`} className="flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-500 text-white font-medium hover:bg-blue-600">
              Próxima<ArrowRight className="w-5 h-5" />
            </Link>
          ) : (
            <Link href={`/plataforma/enem/modulo/${moduloId}`} className="flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-500 text-white font-medium hover:bg-emerald-600">
              <CheckCircle className="w-5 h-5" />Voltar ao módulo
            </Link>
          )}
        </div>
      </main>
    </div>
  );
}
