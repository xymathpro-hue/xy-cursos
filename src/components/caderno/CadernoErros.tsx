'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { BookX, Filter, CheckCircle2, XCircle, RefreshCcw, ChevronDown, ChevronUp, Trash2, BookOpen, Lightbulb, TrendingDown, Search } from 'lucide-react';

interface CadernoErrosProps {
  userId: string;
}

export function CadernoErros({ userId }: CadernoErrosProps) {
  const [erros, setErros] = useState<any[]>([]);
  const [errosFiltrados, setErrosFiltrados] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroStatus, setFiltroStatus] = useState<'todos' | 'pendentes' | 'revisados'>('todos');
  const [expandido, setExpandido] = useState<string | null>(null);
  const [modoRevisao, setModoRevisao] = useState(false);
  const [questaoRevisao, setQuestaoRevisao] = useState<any | null>(null);
  const [respostaSelecionada, setRespostaSelecionada] = useState<string | null>(null);
  const [mostrarResultado, setMostrarResultado] = useState(false);
  const supabase = createClientComponentClient();

  useEffect(() => { fetchErros(); }, [userId]);
  useEffect(() => { filtrarErros(); }, [erros, filtroStatus]);

  const fetchErros = async () => {
    try {
      const { data } = await supabase.from('erros').select(`id, questao_id, created_at, resposta_usuario, revisada, questao:questoes(id, enunciado, alternativa_a, alternativa_b, alternativa_c, alternativa_d, alternativa_e, resposta_correta, explicacao, assunto)`).eq('user_id', userId).order('created_at', { ascending: false });
      const errosFormatados = (data || []).map((e: any) => ({ ...e, questao: Array.isArray(e.questao) ? e.questao[0] : e.questao }));
      setErros(errosFormatados);
    } catch (error) { console.error('Erro:', error); }
    finally { setLoading(false); }
  };

  const filtrarErros = () => {
    let filtrados = [...erros];
    if (filtroStatus === 'pendentes') filtrados = filtrados.filter(e => !e.revisada);
    else if (filtroStatus === 'revisados') filtrados = filtrados.filter(e => e.revisada);
    setErrosFiltrados(filtrados);
  };

  const marcarRevisada = async (erroId: string) => {
    await supabase.from('erros').update({ revisada: true }).eq('id', erroId);
    setErros(prev => prev.map(e => e.id === erroId ? { ...e, revisada: true } : e));
  };

  const removerErro = async (erroId: string) => {
    await supabase.from('erros').delete().eq('id', erroId);
    setErros(prev => prev.filter(e => e.id !== erroId));
    if (modoRevisao) fecharRevisao();
  };

  const iniciarRevisao = (erro: any) => { setQuestaoRevisao(erro); setModoRevisao(true); setRespostaSelecionada(null); setMostrarResultado(false); };
  const confirmarRevisao = () => { setMostrarResultado(true); if (questaoRevisao && respostaSelecionada === questaoRevisao.questao?.resposta_correta) marcarRevisada(questaoRevisao.id); };
  const fecharRevisao = () => { setModoRevisao(false); setQuestaoRevisao(null); setRespostaSelecionada(null); setMostrarResultado(false); };

  const estatisticas = { total: erros.length, pendentes: erros.filter(e => !e.revisada).length, revisados: erros.filter(e => e.revisada).length };

  if (loading) return <div className="space-y-4"><div className="h-32 bg-slate-800/50 rounded-2xl animate-pulse"></div></div>;

  if (modoRevisao && questaoRevisao?.questao) {
    const questao = questaoRevisao.questao;
    const alternativas = [{ letra: 'A', texto: questao.alternativa_a }, { letra: 'B', texto: questao.alternativa_b }, { letra: 'C', texto: questao.alternativa_c }, { letra: 'D', texto: questao.alternativa_d }, ...(questao.alternativa_e ? [{ letra: 'E', texto: questao.alternativa_e }] : [])];
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-slate-900 rounded-3xl border border-slate-700/50 p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center"><BookOpen className="w-5 h-5 text-white" /></div>
              <div><p className="text-slate-400 text-xs">Revisão</p><p className="text-white font-bold">{questao.assunto || 'Matemática'}</p></div>
            </div>
            <button onClick={fecharRevisao} className="text-slate-400 hover:text-white text-2xl">×</button>
          </div>
          <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30"><p className="text-red-400 text-sm flex items-center gap-2"><XCircle className="w-4 h-4" />Resposta anterior: <strong>{questaoRevisao.resposta_usuario}</strong></p></div>
          <div className="rounded-2xl bg-slate-800/50 border border-slate-700/50 p-5 mb-6"><p className="text-white">{questao.enunciado}</p></div>
          <div className="space-y-3 mb-6">
            {alternativas.map(({ letra, texto }) => {
              const selecionada = respostaSelecionada === letra;
              const correta = questao.resposta_correta === letra;
              let classes = 'border-slate-700/50 bg-slate-800/30 hover:bg-slate-700/50';
              if (mostrarResultado) { if (correta) classes = 'border-emerald-500 bg-emerald-500/20'; else if (selecionada) classes = 'border-red-500 bg-red-500/20'; }
              else if (selecionada) classes = 'border-blue-500 bg-blue-500/20';
              return (
                <button key={letra} onClick={() => !mostrarResultado && setRespostaSelecionada(letra)} disabled={mostrarResultado} className={`w-full p-4 rounded-xl border-2 text-left ${classes}`}>
                  <div className="flex items-start gap-4">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold ${mostrarResultado && correta ? 'bg-emerald-500 text-white' : mostrarResultado && selecionada ? 'bg-red-500 text-white' : selecionada ? 'bg-blue-500 text-white' : 'bg-slate-700/50 text-slate-400'}`}>
                      {mostrarResultado && correta ? <CheckCircle2 className="w-5 h-5" /> : mostrarResultado && selecionada ? <XCircle className="w-5 h-5" /> : letra}
                    </div>
                    <span className={`text-sm ${mostrarResultado && correta ? 'text-emerald-300' : mostrarResultado && selecionada ? 'text-red-300' : 'text-slate-300'}`}>{texto}</span>
                  </div>
                </button>
              );
            })}
          </div>
          {mostrarResultado && questao.explicacao && <div className="mb-6 p-4 rounded-xl bg-blue-500/10 border border-blue-500/30"><div className="flex items-start gap-3"><Lightbulb className="w-5 h-5 text-blue-400" /><div><p className="text-blue-400 font-medium mb-1">Explicação</p><p className="text-slate-300 text-sm">{questao.explicacao}</p></div></div></div>}
          <div className="flex gap-4">
            {!mostrarResultado ? <button onClick={confirmarRevisao} disabled={!respostaSelecionada} className={`flex-1 py-4 rounded-xl font-bold text-white ${respostaSelecionada ? 'bg-gradient-to-r from-blue-500 to-indigo-600' : 'bg-slate-700/50 text-slate-500 cursor-not-allowed'}`}>Confirmar</button> : (
              <><button onClick={fecharRevisao} className="flex-1 py-4 rounded-xl bg-slate-700/50 text-slate-300">Voltar</button>
              {respostaSelecionada === questao.resposta_correta && <button onClick={() => removerErro(questaoRevisao.id)} className="px-6 py-4 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center gap-2"><CheckCircle2 className="w-5 h-5" />Dominei!</button>}</>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-slate-700/50 p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-14 h-14 rounded-2xl bg-red-500/20 border border-red-500/30 flex items-center justify-center"><BookX className="w-7 h-7 text-red-400" /></div>
          <div><h2 className="text-2xl font-bold text-white">Caderno de Erros</h2><p className="text-slate-400 text-sm">Revise as questões que você errou</p></div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-slate-800/50 text-center"><p className="text-3xl font-bold text-white">{estatisticas.total}</p><p className="text-slate-400 text-xs">Total</p></div>
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-center"><p className="text-3xl font-bold text-red-400">{estatisticas.pendentes}</p><p className="text-slate-400 text-xs">Pendentes</p></div>
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-center"><p className="text-3xl font-bold text-emerald-400">{estatisticas.revisados}</p><p className="text-slate-400 text-xs">Revisados</p></div>
        </div>
      </div>
      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-800/50 border border-slate-700/50"><Filter className="w-4 h-4 text-slate-400" /><span className="text-slate-400 text-sm">Filtrar:</span></div>
        <div className="flex rounded-xl overflow-hidden border border-slate-700/50">
          {(['todos', 'pendentes', 'revisados'] as const).map((status) => (
            <button key={status} onClick={() => setFiltroStatus(status)} className={`px-4 py-2 text-sm font-medium ${filtroStatus === status ? 'bg-blue-600 text-white' : 'bg-slate-800/50 text-slate-400 hover:text-white'}`}>{status.charAt(0).toUpperCase() + status.slice(1)}</button>
          ))}
        </div>
      </div>
      {errosFiltrados.length === 0 ? (
        <div className="text-center py-16"><div className="w-20 h-20 mx-auto rounded-full bg-slate-800/50 flex items-center justify-center mb-4"><Search className="w-10 h-10 text-slate-600" /></div><p className="text-slate-400">{erros.length === 0 ? 'Nenhuma questão errada!' : 'Nenhuma com esse filtro.'}</p></div>
      ) : (
        <div className="space-y-3">
          {errosFiltrados.map((erro) => erro.questao && (
            <div key={erro.id} className={`rounded-2xl border ${erro.revisada ? 'bg-slate-800/30 border-slate-700/30' : 'bg-slate-800/50 border-slate-700/50'}`}>
              <div className="p-4 cursor-pointer" onClick={() => setExpandido(expandido === erro.id ? null : erro.id)}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center"><TrendingDown className="w-5 h-5 text-white" /></div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {erro.questao.assunto && <span className="px-2 py-0.5 rounded-full text-xs bg-blue-500/20 text-blue-400">{erro.questao.assunto}</span>}
                        {erro.revisada && <span className="px-2 py-0.5 rounded-full text-xs bg-emerald-500/20 text-emerald-400">✓</span>}
                      </div>
                      <p className="text-slate-300 text-sm line-clamp-2">{erro.questao.enunciado}</p>
                    </div>
                  </div>
                  {expandido === erro.id ? <ChevronUp className="w-5 h-5 text-slate-500" /> : <ChevronDown className="w-5 h-5 text-slate-500" />}
                </div>
              </div>
              {expandido === erro.id && (
                <div className="px-4 pb-4 border-t border-slate-700/50 pt-4 space-y-4">
                  <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30"><p className="text-red-400 text-sm flex items-center gap-2"><XCircle className="w-4 h-4" />Você: <strong>{erro.resposta_usuario}</strong></p></div>
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30"><p className="text-emerald-400 text-sm flex items-center gap-2"><CheckCircle2 className="w-4 h-4" />Correta: <strong>{erro.questao.resposta_correta}</strong></p></div>
                  <div className="flex gap-3">
                    <button onClick={() => iniciarRevisao(erro)} className="flex-1 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-medium flex items-center justify-center gap-2"><RefreshCcw className="w-4 h-4" />Revisar</button>
                    <button onClick={() => removerErro(erro.id)} className="px-4 py-3 rounded-xl bg-slate-700/50 text-slate-400 hover:text-red-400"><Trash2 className="w-5 h-5" /></button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
