'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { 
  ArrowLeft, 
  ArrowRight, 
  BookOpen, 
  Lightbulb, 
  Calculator, 
  CheckCircle,
  Clock,
  FileText
} from 'lucide-react';

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
      if (!user) {
        router.push('/login');
        return;
      }
      setUserId(user.id);

      // Buscar aula
      const { data: aulaData } = await supabase
        .from('aulas')
        .select('*')
        .eq('id', aulaId)
        .single();

      if (aulaData) {
        setAula(aulaData);
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

      // Buscar todas as aulas do módulo
      const { data: aulasData } = await supabase
        .from('aulas')
        .select('*')
        .eq('modulo_id', moduloId)
        .eq('ativo', true)
        .order('ordem', { ascending: true });

      if (aulasData) {
        setTodasAulas(aulasData);
      }

      // Verificar se aula foi concluída
      const { data: progressoData } = await supabase
        .from('progresso_aulas')
        .select('concluida')
        .eq('user_id', user.id)
        .eq('aula_id', aulaId)
        .single();

      if (progressoData) {
        setConcluida(progressoData.concluida);
      }

      setLoading(false);
    }

    if (aulaId && moduloId) {
      fetchData();
    }
  }, [aulaId, moduloId, supabase, router]);

  const marcarConcluida = async () => {
    if (!userId || !aulaId) return;

    const { error } = await supabase
      .from('progresso_aulas')
      .upsert({
        user_id: userId,
        aula_id: aulaId,
        concluida: true,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,aula_id'
      });

    if (!error) {
      setConcluida(true);
    }
  };

  const indiceAtual = todasAulas.findIndex(a => a.id === aulaId);
  const aulaAnterior = indiceAtual > 0 ? todasAulas[indiceAtual - 1] : null;
  const proximaAula = indiceAtual < todasAulas.length - 1 ? todasAulas[indiceAtual + 1] : null;

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!aula || !modulo) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center">
        <p className="text-slate-400 mb-4">Aula não encontrada.</p>
        <Link href={`/plataforma/enem/modulo/${moduloId}`} className="text-blue-400 hover:underline">
          Voltar ao módulo
        </Link>
      </div>
    );
  }

  const secoes = [
    { id: 'teoria', nome: 'Teoria', icone: BookOpen, conteudo: aula.conteudo_teoria },
    { id: 'formulas', nome: 'Fórmulas', icone: Calculator, conteudo: aula.formulas },
    { id: 'dicas', nome: 'Dicas', icone: Lightbulb, conteudo: aula.dicas },
    { id: 'exercicios', nome: 'Exercícios Resolvidos', icone: FileText, conteudo: aula.exercicios_resolvidos },
  ].filter(s => s.conteudo);

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <header className="bg-slate-900/80 backdrop-blur-xl border-b border-slate-800/50 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link 
              href={`/plataforma/enem/modulo/${moduloId}`} 
              className="flex items-center gap-2 text-slate-400 hover:text-white"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="hidden sm:inline">Voltar</span>
            </Link>
            <div className="text-center">
              <p className="text-slate-500 text-sm">{modulo.titulo}</p>
              <p className="font-bold text-white">Aula {aula.numero}: {aula.titulo}</p>
            </div>
            <div className="flex items-center gap-2 text-slate-400">
              <Clock className="w-4 h-4" />
              <span className="text-sm">{aula.duracao_minutos}min</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* Status da aula */}
        {concluida && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 mb-6 flex items-center gap-3">
            <CheckCircle className="w-6 h-6 text-emerald-400" />
            <p className="text-emerald-400 font-medium">Você já concluiu esta aula!</p>
          </div>
        )}

        {/* Navegação de Seções */}
        {secoes.length > 1 && (
          <div className="flex overflow-x-auto gap-2 mb-6 pb-2">
            {secoes.map((secao) => {
              const Icon = secao.icone;
              return (
                <button
                  key={secao.id}
                  onClick={() => setSecaoAtiva(secao.id as any)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl whitespace-nowrap transition-all ${
                    secaoAtiva === secao.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-800/50 text-slate-400 hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {secao.nome}
                </button>
              );
            })}
          </div>
        )}

        {/* Conteúdo */}
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6 mb-6">
          {secaoAtiva === 'teoria' && aula.conteudo_teoria && (
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-blue-400" />
                </div>
                <h2 className="text-xl font-bold text-white">Teoria</h2>
              </div>
              <div className="prose prose-invert max-w-none">
                <div className="text-slate-300 whitespace-pre-line leading-relaxed">
                  {aula.conteudo_teoria}
                </div>
              </div>
            </div>
          )}

          {secaoAtiva === 'formulas' && aula.formulas && (
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                  <Calculator className="w-5 h-5 text-purple-400" />
                </div>
                <h2 className="text-xl font-bold text-white">Fórmulas</h2>
              </div>
              <div className="bg-slate-900/50 rounded-xl p-4">
                <div className="text-slate-300 whitespace-pre-line font-mono">
                  {aula.formulas}
                </div>
              </div>
            </div>
          )}

          {secaoAtiva === 'dicas' && aula.dicas && (
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
                  <Lightbulb className="w-5 h-5 text-amber-400" />
                </div>
                <h2 className="text-xl font-bold text-white">Dicas</h2>
              </div>
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
                <div className="text-slate-300 whitespace-pre-line">
                  {aula.dicas}
                </div>
              </div>
            </div>
          )}

          {secaoAtiva === 'exercicios' && aula.exercicios_resolvidos && (
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-emerald-400" />
                </div>
                <h2 className="text-xl font-bold text-white">Exercícios Resolvidos</h2>
              </div>
              <div className="text-slate-300 whitespace-pre-line leading-relaxed">
                {aula.exercicios_resolvidos}
              </div>
            </div>
          )}

          {/* Conteúdo padrão se não tem nada cadastrado */}
          {!aula.conteudo_teoria && !aula.formulas && !aula.dicas && !aula.exercicios_resolvidos && (
            <div className="text-center py-12">
              <BookOpen className="w-16 h-16 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400">Conteúdo em breve!</p>
              <p className="text-slate-500 text-sm">Estamos preparando o material desta aula.</p>
            </div>
          )}
        </div>

        {/* Botão Marcar como Concluída */}
        {!concluida && (
          <button
            onClick={marcarConcluida}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-bold hover:opacity-90 transition-all flex items-center justify-center gap-2 mb-6"
          >
            <CheckCircle className="w-5 h-5" />
            Marcar aula como concluída
          </button>
        )}

        {/* Navegação entre aulas */}
        <div className="flex items-center justify-between">
          {aulaAnterior ? (
            <Link
              href={`/plataforma/enem/modulo/${moduloId}/aula/${aulaAnterior.id}`}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800/50 text-slate-400 hover:text-white"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="hidden sm:inline">Aula anterior</span>
            </Link>
          ) : (
            <div></div>
          )}

          {proximaAula ? (
            <Link
              href={`/plataforma/enem/modulo/${moduloId}/aula/${proximaAula.id}`}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700"
            >
              Próxima aula
              <ArrowRight className="w-5 h-5" />
            </Link>
          ) : (
            <Link
              href={`/plataforma/enem/modulo/${moduloId}`}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 text-white font-medium hover:bg-emerald-700"
            >
              <CheckCircle className="w-5 h-5" />
              Finalizar módulo
            </Link>
          )}
        </div>
      </main>
    </div>
  );
}
