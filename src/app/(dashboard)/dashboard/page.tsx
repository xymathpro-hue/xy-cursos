'use client';

import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import { DashboardStats } from '@/components/dashboard/DashboardStats';
import { BatalhaRapida } from '@/components/batalha/BatalhaRapida';
import { CadernoErros } from '@/components/caderno/CadernoErros';
import { DicaDoDia } from '@/components/dicas/DicaDoDia';
import { LayoutDashboard, Swords, BookX, Lightbulb } from 'lucide-react';

type TabType = 'visao-geral' | 'batalha' | 'erros' | 'dicas';

const tabs = [
  { id: 'visao-geral', nome: 'Visão Geral', icone: LayoutDashboard },
  { id: 'batalha', nome: 'Batalha Rápida', icone: Swords },
  { id: 'erros', nome: 'Caderno de Erros', icone: BookX },
  { id: 'dicas', nome: 'Dicas', icone: Lightbulb }
];

export default function DashboardPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [tabAtiva, setTabAtiva] = useState<TabType>('visao-geral');
  const supabase = createClientComponentClient();
  const router = useRouter();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/login'); return; }
      setUserId(user.id);
      const { data: profile } = await supabase.from('profiles').select('nome').eq('id', user.id).single();
      setUserName(profile?.nome || user.email?.split('@')[0] || 'Estudante');
      setLoading(false);
    };
    checkUser();
  }, [supabase, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!userId) return null;

  return (
    <div className="min-h-screen bg-slate-950">
      <header className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <span className="text-white font-black text-lg">XY</span>
              </div>
              <div>
                <p className="text-slate-400 text-sm">Olá,</p>
                <h1 className="text-xl font-bold text-white">{userName}</h1>
              </div>
            </div>
            <div className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-400 text-sm font-medium">🎓 ENEM</div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          <aside className="lg:w-64 shrink-0">
            <nav className="sticky top-24 space-y-2">
              {tabs.map((tab) => {
                const Icon = tab.icone;
                const isAtiva = tabAtiva === tab.id;
                return (
                  <button key={tab.id} onClick={() => setTabAtiva(tab.id as TabType)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isAtiva ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'}`}>
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{tab.nome}</span>
                  </button>
                );
              })}
            </nav>
          </aside>

          <main className="flex-1 min-w-0">
            {tabAtiva === 'visao-geral' && (
              <div className="space-y-6">
                <DashboardStats userId={userId} />
                <div className="grid md:grid-cols-2 gap-6">
                  <DicaDoDia userId={userId} />
                  <div className="rounded-2xl bg-slate-800/50 border border-slate-700/50 p-6">
                    <h3 className="text-lg font-bold text-white mb-4">Ações Rápidas</h3>
                    <div className="space-y-3">
                      <button onClick={() => setTabAtiva('batalha')} className="w-full p-4 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-medium hover:opacity-90 transition-all flex items-center justify-between">
                        <span className="flex items-center gap-3"><Swords className="w-5 h-5" />Iniciar Batalha Rápida</span><span>→</span>
                      </button>
                      <button onClick={() => setTabAtiva('erros')} className="w-full p-4 rounded-xl bg-slate-700/50 text-slate-300 font-medium hover:bg-slate-600/50 transition-all flex items-center justify-between">
                        <span className="flex items-center gap-3"><BookX className="w-5 h-5" />Revisar Erros</span><span>→</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {tabAtiva === 'batalha' && (
              <div>
                <div className="mb-6"><h2 className="text-2xl font-bold text-white">Batalha Rápida</h2><p className="text-slate-400">Teste seus conhecimentos com questões cronometradas</p></div>
                <BatalhaRapida userId={userId} />
              </div>
            )}
            {tabAtiva === 'erros' && (
              <div>
                <div className="mb-6"><h2 className="text-2xl font-bold text-white">Caderno de Erros</h2><p className="text-slate-400">Revise e domine as questões que você errou</p></div>
                <CadernoErros userId={userId} />
              </div>
            )}
            {tabAtiva === 'dicas' && (
              <div>
                <div className="mb-6"><h2 className="text-2xl font-bold text-white">Dicas de Estudo</h2><p className="text-slate-400">Macetes e estratégias para o ENEM</p></div>
                <DicaDoDia userId={userId} />
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
