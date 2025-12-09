'use client';

import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Target, Flame, CheckCircle, Settings, X, Save } from 'lucide-react';
import { getOrCreateUserMeta, getProgressoDiario, atualizarMetaUsuario, UserMeta, ProgressoDiario } from '@/lib/metas-system';

export default function MetaDiaria() {
  const supabase = createClientComponentClient();
  
  const [loading, setLoading] = useState(true);
  const [meta, setMeta] = useState<UserMeta | null>(null);
  const [progresso, setProgresso] = useState<ProgressoDiario | null>(null);
  const [editando, setEditando] = useState(false);
  const [novaMetaXP, setNovaMetaXP] = useState(50);
  const [novaMetaQuestoes, setNovaMetaQuestoes] = useState(10);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    async function fetchData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const userMeta = await getOrCreateUserMeta(supabase, user.id);
      const progressoDia = await getProgressoDiario(supabase, user.id);

      if (userMeta) {
        setMeta(userMeta);
        setNovaMetaXP(userMeta.meta_xp_diario);
        setNovaMetaQuestoes(userMeta.meta_questoes_diario);
      }
      
      if (progressoDia) {
        setProgresso(progressoDia);
      }

      setLoading(false);
    }

    fetchData();
  }, [supabase]);

  const handleSalvarMeta = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    setSalvando(true);
    const sucesso = await atualizarMetaUsuario(supabase, user.id, novaMetaXP, novaMetaQuestoes);
    
    if (sucesso) {
      setMeta(prev => prev ? { ...prev, meta_xp_diario: novaMetaXP, meta_questoes_diario: novaMetaQuestoes } : null);
      setEditando(false);
    }
    setSalvando(false);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-5 border border-gray-100 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="h-4 bg-gray-100 rounded w-full mb-2"></div>
        <div className="h-4 bg-gray-100 rounded w-2/3"></div>
      </div>
    );
  }

  if (!meta || !progresso) return null;

  const progressoXP = Math.min((progresso.xp_ganho / meta.meta_xp_diario) * 100, 100);
  const progressoQuestoes = Math.min((progresso.questoes_respondidas / meta.meta_questoes_diario) * 100, 100);
  const metasCumpridas = (progresso.meta_xp_cumprida ? 1 : 0) + (progresso.meta_questoes_cumprida ? 1 : 0);
  const todasCumpridas = metasCumpridas === 2;

  if (editando) {
    return (
      <div className="bg-white rounded-2xl p-5 border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-gray-900 flex items-center gap-2">
            <Settings className="w-5 h-5 text-gray-500" />
            Configurar Metas
          </h3>
          <button onClick={() => setEditando(false)} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Meta de XP Diário</label>
            <select
              value={novaMetaXP}
              onChange={(e) => setNovaMetaXP(Number(e.target.value))}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-violet-500"
            >
              <option value={25}>25 XP (Fácil)</option>
              <option value={50}>50 XP (Normal)</option>
              <option value={100}>100 XP (Desafiador)</option>
              <option value={150}>150 XP (Hardcore)</option>
              <option value={200}>200 XP (Insano)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Meta de Questões Diárias</label>
            <select
              value={novaMetaQuestoes}
              onChange={(e) => setNovaMetaQuestoes(Number(e.target.value))}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-violet-500"
            >
              <option value={5}>5 questões (Fácil)</option>
              <option value={10}>10 questões (Normal)</option>
              <option value={20}>20 questões (Desafiador)</option>
              <option value={30}>30 questões (Hardcore)</option>
              <option value={50}>50 questões (Insano)</option>
            </select>
          </div>

          <button
            onClick={handleSalvarMeta}
            disabled={salvando}
            className="w-full bg-violet-500 text-white font-bold py-3 rounded-xl hover:bg-violet-600 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Save className="w-5 h-5" />
            {salvando ? 'Salvando...' : 'Salvar Metas'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-2xl p-5 border-2 transition-all ${todasCumpridas ? 'bg-emerald-50 border-emerald-300' : 'bg-white border-gray-100'}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-gray-900 flex items-center gap-2">
          <Target className={`w-5 h-5 ${todasCumpridas ? 'text-emerald-500' : 'text-violet-500'}`} />
          Meta Diária
          {todasCumpridas && (
            <span className="bg-emerald-500 text-white text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
              <CheckCircle className="w-3 h-3" /> Completa!
            </span>
          )}
        </h3>
        <button 
          onClick={() => setEditando(true)}
          className="p-2 hover:bg-gray-100 rounded-lg"
        >
          <Settings className="w-4 h-4 text-gray-400" />
        </button>
      </div>

      <div className="space-y-4">
        {/* Meta de XP */}
        <div>
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="text-gray-600 flex items-center gap-1">
              <Flame className="w-4 h-4 text-amber-500" />
              XP do Dia
            </span>
            <span className={`font-bold ${progresso.meta_xp_cumprida ? 'text-emerald-600' : 'text-gray-900'}`}>
              {progresso.xp_ganho}/{meta.meta_xp_diario}
              {progresso.meta_xp_cumprida && <CheckCircle className="w-4 h-4 inline ml-1 text-emerald-500" />}
            </span>
          </div>
          <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-500 ${progresso.meta_xp_cumprida ? 'bg-emerald-500' : 'bg-amber-500'}`}
              style={{ width: `${progressoXP}%` }}
            />
          </div>
        </div>

        {/* Meta de Questões */}
        <div>
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="text-gray-600 flex items-center gap-1">
              <Target className="w-4 h-4 text-blue-500" />
              Questões do Dia
            </span>
            <span className={`font-bold ${progresso.meta_questoes_cumprida ? 'text-emerald-600' : 'text-gray-900'}`}>
              {progresso.questoes_respondidas}/{meta.meta_questoes_diario}
              {progresso.meta_questoes_cumprida && <CheckCircle className="w-4 h-4 inline ml-1 text-emerald-500" />}
            </span>
          </div>
          <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-500 ${progresso.meta_questoes_cumprida ? 'bg-emerald-500' : 'bg-blue-500'}`}
              style={{ width: `${progressoQuestoes}%` }}
            />
          </div>
        </div>
      </div>

      {/* Mensagem motivacional */}
      <div className="mt-4 pt-3 border-t border-gray-100">
        {todasCumpridas ? (
          <p className="text-emerald-600 text-sm font-medium text-center">
            🎉 Parabéns! Você cumpriu todas as metas de hoje!
          </p>
        ) : metasCumpridas === 1 ? (
          <p className="text-amber-600 text-sm text-center">
            💪 Quase lá! Falta só uma meta!
          </p>
        ) : (
          <p className="text-gray-500 text-sm text-center">
            📚 Continue estudando para bater suas metas!
          </p>
        )}
      </div>
    </div>
  );
}
