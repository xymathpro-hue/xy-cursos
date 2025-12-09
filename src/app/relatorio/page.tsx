'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { 
  ArrowLeft,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Minus,
  Calendar,
  Flame,
  Star,
  Target,
  CheckCircle,
  Zap,
  Award,
  Trophy
} from 'lucide-react';

interface ProgressoDia {
  data: string;
  xp_ganho: number;
  questoes_respondidas: number;
  questoes_corretas: number;
}

interface ResumoSemanal {
  totalXP: number;
  totalQuestoes: number;
  totalAcertos: number;
  taxaAcerto: number;
  diasEstudados: number;
  melhorDia: ProgressoDia | null;
  mediaXPDiario: number;
  mediaQuestoesDiario: number;
}

export default function RelatorioPage() {
  const router = useRouter();
  const supabase = createClientComponentClient();

  const [loading, setLoading] = useState(true);
  const [progressoSemana, setProgressoSemana] = useState<ProgressoDia[]>([]);
  const [resumoAtual, setResumoAtual] = useState<ResumoSemanal | null>(null);
  const [resumoAnterior, setResumoAnterior] = useState<ResumoSemanal | null>(null);
  const [streakAtual, setStreakAtual] = useState(0);

  useEffect(() => {
    async function fetchData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      // Datas da semana atual (domingo a sábado)
      const hoje = new Date();
      const inicioSemana = new Date(hoje);
      inicioSemana.setDate(hoje.getDate() - hoje.getDay());
      inicioSemana.setHours(0, 0, 0, 0);

      const fimSemana = new Date(inicioSemana);
      fimSemana.setDate(inicioSemana.getDate() + 6);
      fimSemana.setHours(23, 59, 59, 999);

      // Datas da semana anterior
      const inicioSemanaAnterior = new Date(inicioSemana);
      inicioSemanaAnterior.setDate(inicioSemana.getDate() - 7);

      const fimSemanaAnterior = new Date(inicioSemana);
      fimSemanaAnterior.setDate(inicioSemana.getDate() - 1);

      // Buscar progresso da semana atual
      const { data: progressoAtual } = await supabase
        .from('progresso_diario')
        .select('data, xp_ganho, questoes_respondidas, questoes_corretas')
        .eq('user_id', user.id)
        .gte('data', inicioSemana.toISOString().split('T')[0])
        .lte('data', fimSemana.toISOString().split('T')[0])
        .order('data');

      // Buscar progresso da semana anterior
      const { data: progressoAnterior } = await supabase
        .from('progresso_diario')
        .select('data, xp_ganho, questoes_respondidas, questoes_corretas')
        .eq('user_id', user.id)
        .gte('data', inicioSemanaAnterior.toISOString().split('T')[0])
        .lte('data', fimSemanaAnterior.toISOString().split('T')[0]);

      // Buscar streak
      const { data: statsData } = await supabase
        .from('user_stats')
        .select('streak_atual')
        .eq('user_id', user.id)
        .single();

      if (statsData) {
        setStreakAtual(statsData.streak_atual);
      }

      // Preencher dias da semana (mesmo os sem dados)
      const diasSemana: ProgressoDia[] = [];
      for (let i = 0; i < 7; i++) {
        const dia = new Date(inicioSemana);
        dia.setDate(inicioSemana.getDate() + i);
        const dataStr = dia.toISOString().split('T')[0];
        
        const dadosDia = progressoAtual?.find(p => p.data === dataStr);
        diasSemana.push({
          data: dataStr,
          xp_ganho: dadosDia?.xp_ganho || 0,
          questoes_respondidas: dadosDia?.questoes_respondidas || 0,
          questoes_corretas: dadosDia?.questoes_corretas || 0
        });
      }

      setProgressoSemana(diasSemana);
      setResumoAtual(calcularResumo(diasSemana));
      
      if (progressoAnterior && progressoAnterior.length > 0) {
        setResumoAnterior(calcularResumo(progressoAnterior));
      }

      setLoading(false);
    }

    fetchData();
  }, [supabase, router]);

  const calcularResumo = (progresso: ProgressoDia[]): ResumoSemanal => {
    const totalXP = progresso.reduce((sum, p) => sum + p.xp_ganho, 0);
    const totalQuestoes = progresso.reduce((sum, p) => sum + p.questoes_respondidas, 0);
    const totalAcertos = progresso.reduce((sum, p) => sum + p.questoes_corretas, 0);
    const diasEstudados = progresso.filter(p => p.xp_ganho > 0 || p.questoes_respondidas > 0).length;
    
    const melhorDia = progresso.reduce((melhor, atual) => {
      if (!melhor || atual.xp_ganho > melhor.xp_ganho) return atual;
      return melhor;
    }, null as ProgressoDia | null);

    return {
      totalXP,
      totalQuestoes,
      totalAcertos,
      taxaAcerto: totalQuestoes > 0 ? Math.round((totalAcertos / totalQuestoes) * 100) : 0,
      diasEstudados,
      melhorDia: melhorDia?.xp_ganho > 0 ? melhorDia : null,
      mediaXPDiario: diasEstudados > 0 ? Math.round(totalXP / diasEstudados) : 0,
      mediaQuestoesDiario: diasEstudados > 0 ? Math.round(totalQuestoes / diasEstudados) : 0
    };
  };

  const calcularVariacao = (atual: number, anterior: number): { valor: number; tipo: 'up' | 'down' | 'same' } => {
    if (anterior === 0) return { valor: atual > 0 ? 100 : 0, tipo: atual > 0 ? 'up' : 'same' };
    const variacao = Math.round(((atual - anterior) / anterior) * 100);
    return {
      valor: Math.abs(variacao),
      tipo: variacao > 0 ? 'up' : variacao < 0 ? 'down' : 'same'
    };
  };

  const getDiaSemana = (dataStr: string) => {
    const dias = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const data = new Date(dataStr + 'T12:00:00');
    return dias[data.getDay()];
  };

  const formatarData = (dataStr: string) => {
    const data = new Date(dataStr + 'T12:00:00');
    return data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  };

  const getMaxXP = () => {
    return Math.max(...progressoSemana.map(p => p.xp_ganho), 50);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  const variacaoXP = resumoAnterior ? calcularVariacao(resumoAtual?.totalXP || 0, resumoAnterior.totalXP) : null;
  const variacaoQuestoes = resumoAnterior ? calcularVariacao(resumoAtual?.totalQuestoes || 0, resumoAnterior.totalQuestoes) : null;
  const variacaoTaxa = resumoAnterior ? calcularVariacao(resumoAtual?.taxaAcerto || 0, resumoAnterior.taxaAcerto) : null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="p-2 hover:bg-white/10 rounded-lg">
              <ArrowLeft className="w-6 h-6" />
            </Link>
            <div>
              <h1 className="text-xl font-bold flex items-center gap-2">
                <BarChart3 className="w-6 h-6" />
                Relatório Semanal
              </h1>
              <p className="text-white/80 text-sm">Seu desempenho esta semana</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Cards de Resumo */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* XP Total */}
          <div className="bg-white rounded-2xl p-4 border border-gray-100">
            <div className="flex items-center gap-2 mb-2">
              <Star className="w-5 h-5 text-amber-500" />
              <span className="text-gray-500 text-sm">XP Ganho</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{resumoAtual?.totalXP || 0}</p>
            {variacaoXP && (
              <div className={`flex items-center gap-1 text-xs mt-1 ${
                variacaoXP.tipo === 'up' ? 'text-emerald-600' : 
                variacaoXP.tipo === 'down' ? 'text-red-500' : 'text-gray-400'
              }`}>
                {variacaoXP.tipo === 'up' && <TrendingUp className="w-3 h-3" />}
                {variacaoXP.tipo === 'down' && <TrendingDown className="w-3 h-3" />}
                {variacaoXP.tipo === 'same' && <Minus className="w-3 h-3" />}
                <span>{variacaoXP.valor}% vs semana anterior</span>
              </div>
            )}
          </div>

          {/* Questões */}
          <div className="bg-white rounded-2xl p-4 border border-gray-100">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-5 h-5 text-emerald-500" />
              <span className="text-gray-500 text-sm">Questões</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{resumoAtual?.totalQuestoes || 0}</p>
            {variacaoQuestoes && (
              <div className={`flex items-center gap-1 text-xs mt-1 ${
                variacaoQuestoes.tipo === 'up' ? 'text-emerald-600' : 
                variacaoQuestoes.tipo === 'down' ? 'text-red-500' : 'text-gray-400'
              }`}>
                {variacaoQuestoes.tipo === 'up' && <TrendingUp className="w-3 h-3" />}
                {variacaoQuestoes.tipo === 'down' && <TrendingDown className="w-3 h-3" />}
                {variacaoQuestoes.tipo === 'same' && <Minus className="w-3 h-3" />}
                <span>{variacaoQuestoes.valor}% vs semana anterior</span>
              </div>
            )}
          </div>

          {/* Taxa de Acerto */}
          <div className="bg-white rounded-2xl p-4 border border-gray-100">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-5 h-5 text-blue-500" />
              <span className="text-gray-500 text-sm">Taxa Acerto</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{resumoAtual?.taxaAcerto || 0}%</p>
            {variacaoTaxa && (
              <div className={`flex items-center gap-1 text-xs mt-1 ${
                variacaoTaxa.tipo === 'up' ? 'text-emerald-600' : 
                variacaoTaxa.tipo === 'down' ? 'text-red-500' : 'text-gray-400'
              }`}>
                {variacaoTaxa.tipo === 'up' && <TrendingUp className="w-3 h-3" />}
                {variacaoTaxa.tipo === 'down' && <TrendingDown className="w-3 h-3" />}
                {variacaoTaxa.tipo === 'same' && <Minus className="w-3 h-3" />}
                <span>{variacaoTaxa.valor}% vs semana anterior</span>
              </div>
            )}
          </div>

          {/* Dias Estudados */}
          <div className="bg-white rounded-2xl p-4 border border-gray-100">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-5 h-5 text-violet-500" />
              <span className="text-gray-500 text-sm">Dias Ativos</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{resumoAtual?.diasEstudados || 0}/7</p>
            <p className="text-gray-400 text-xs mt-1">dias estudados</p>
          </div>
        </div>

        {/* Gráfico de XP por Dia */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100">
          <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-500" />
            XP por Dia
          </h3>

          <div className="flex items-end justify-between gap-2 h-40">
            {progressoSemana.map((dia, index) => {
              const altura = (dia.xp_ganho / getMaxXP()) * 100;
              const hoje = new Date().toISOString().split('T')[0] === dia.data;
              
              return (
                <div key={index} className="flex-1 flex flex-col items-center">
                  <span className="text-xs text-gray-500 mb-1">{dia.xp_ganho}</span>
                  <div 
                    className={`w-full rounded-t-lg transition-all ${
                      hoje ? 'bg-blue-500' : 
                      dia.xp_ganho > 0 ? 'bg-blue-300' : 'bg-gray-200'
                    }`}
                    style={{ height: `${Math.max(altura, 4)}%` }}
                  />
                  <span className={`text-xs mt-2 ${hoje ? 'font-bold text-blue-600' : 'text-gray-500'}`}>
                    {getDiaSemana(dia.data)}
                  </span>
                  <span className="text-xs text-gray-400">{formatarData(dia.data)}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Streak e Melhor Dia */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl p-5 text-white">
            <div className="flex items-center gap-2 mb-2">
              <Flame className="w-6 h-6" />
              <span className="text-white/80">Streak Atual</span>
            </div>
            <p className="text-4xl font-black">{streakAtual}</p>
            <p className="text-white/70 text-sm">dias seguidos</p>
          </div>

          {resumoAtual?.melhorDia && (
            <div className="bg-gradient-to-r from-amber-500 to-yellow-500 rounded-2xl p-5 text-white">
              <div className="flex items-center gap-2 mb-2">
                <Trophy className="w-6 h-6" />
                <span className="text-white/80">Melhor Dia</span>
              </div>
              <p className="text-4xl font-black">{resumoAtual.melhorDia.xp_ganho} XP</p>
              <p className="text-white/70 text-sm">
                {getDiaSemana(resumoAtual.melhorDia.data)}, {formatarData(resumoAtual.melhorDia.data)}
              </p>
            </div>
          )}
        </div>

        {/* Médias */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100">
          <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-500" />
            Médias Diárias
          </h3>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-amber-50 rounded-xl p-4 text-center">
              <Star className="w-8 h-8 text-amber-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-amber-600">{resumoAtual?.mediaXPDiario || 0}</p>
              <p className="text-amber-700 text-sm">XP/dia</p>
            </div>

            <div className="bg-blue-50 rounded-xl p-4 text-center">
              <CheckCircle className="w-8 h-8 text-blue-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-blue-600">{resumoAtual?.mediaQuestoesDiario || 0}</p>
              <p className="text-blue-700 text-sm">questões/dia</p>
            </div>
          </div>
        </div>

        {/* Detalhes por Dia */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100">
          <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-violet-500" />
            Detalhes da Semana
          </h3>

          <div className="space-y-2">
            {progressoSemana.map((dia, index) => {
              const hoje = new Date().toISOString().split('T')[0] === dia.data;
              const taxaDia = dia.questoes_respondidas > 0 
                ? Math.round((dia.questoes_corretas / dia.questoes_respondidas) * 100) 
                : 0;

              return (
                <div 
                  key={index}
                  className={`flex items-center justify-between p-3 rounded-xl ${
                    hoje ? 'bg-blue-50 border border-blue-200' : 
                    dia.xp_ganho > 0 ? 'bg-gray-50' : 'bg-gray-50 opacity-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      hoje ? 'bg-blue-500 text-white' : 
                      dia.xp_ganho > 0 ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-200 text-gray-400'
                    }`}>
                      {dia.xp_ganho > 0 ? <CheckCircle className="w-5 h-5" /> : <Minus className="w-5 h-5" />}
                    </div>
                    <div>
                      <p className={`font-medium ${hoje ? 'text-blue-700' : 'text-gray-900'}`}>
                        {getDiaSemana(dia.data)} {hoje && '(Hoje)'}
                      </p>
                      <p className="text-gray-400 text-xs">{formatarData(dia.data)}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-sm">
                    <div className="text-right">
                      <p className="font-bold text-amber-600">{dia.xp_ganho} XP</p>
                    </div>
                    <div className="text-right">
                      <p className="text-gray-600">{dia.questoes_respondidas} questões</p>
                      {dia.questoes_respondidas > 0 && (
                        <p className={`text-xs ${taxaDia >= 70 ? 'text-emerald-500' : taxaDia >= 50 ? 'text-amber-500' : 'text-red-500'}`}>
                          {taxaDia}% acerto
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Call to Action */}
        <div className="bg-gradient-to-r from-violet-500 to-purple-500 rounded-2xl p-6 text-white text-center">
          <Zap className="w-10 h-10 mx-auto mb-3" />
          <h3 className="text-xl font-bold mb-2">Continue Evoluindo!</h3>
          <p className="text-white/80 mb-4">Faça mais batalhas para melhorar suas estatísticas</p>
          <Link 
            href="/batalha"
            className="inline-block bg-white text-violet-600 font-bold px-6 py-3 rounded-xl hover:bg-violet-50 transition-all"
          >
            ⚡ Iniciar Batalha
          </Link>
        </div>
      </main>
    </div>
  );
}
