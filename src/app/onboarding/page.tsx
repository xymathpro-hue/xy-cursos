'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Target, Clock, Calendar, Brain, ChevronRight, ChevronLeft, Sparkles } from 'lucide-react';

const etapas = [
  { id: 1, titulo: 'Meta de Pontuação', icone: Target },
  { id: 2, titulo: 'Tempo de Estudo', icone: Clock },
  { id: 3, titulo: 'Dias Disponíveis', icone: Calendar },
  { id: 4, titulo: 'Seu Nível', icone: Brain },
];

const metas = [
  { valor: 500, label: '500-600', desc: 'Começando agora', cor: 'blue' },
  { valor: 600, label: '600-700', desc: 'Nível intermediário', cor: 'emerald' },
  { valor: 700, label: '700-800', desc: 'Objetivo alto', cor: 'amber' },
  { valor: 800, label: '800+', desc: 'Nota de excelência', cor: 'purple' },
];

const horasOpcoes = [
  { valor: '2-4h', label: '2-4 horas', desc: 'Ritmo leve' },
  { valor: '5-7h', label: '5-7 horas', desc: 'Ritmo moderado' },
  { valor: '8-10h', label: '8-10 horas', desc: 'Ritmo intenso' },
  { valor: '10+h', label: '10+ horas', desc: 'Dedicação total' },
];

const diasSemana = [
  { valor: 'segunda', label: 'Seg' },
  { valor: 'terca', label: 'Ter' },
  { valor: 'quarta', label: 'Qua' },
  { valor: 'quinta', label: 'Qui' },
  { valor: 'sexta', label: 'Sex' },
  { valor: 'sabado', label: 'Sáb' },
  { valor: 'domingo', label: 'Dom' },
];

const niveis = [
  { valor: 'basico', label: 'Básico', desc: 'Estou começando do zero', emoji: '🌱' },
  { valor: 'intermediario', label: 'Intermediário', desc: 'Sei o básico mas preciso praticar', emoji: '📚' },
  { valor: 'avancado', label: 'Avançado', desc: 'Domino a maioria dos conteúdos', emoji: '🚀' },
  { valor: 'expert', label: 'Expert', desc: 'Quero aperfeiçoar detalhes', emoji: '🏆' },
];

export default function OnboardingPage() {
  const router = useRouter();
  const supabase = createClientComponentClient();
  
  const [etapaAtual, setEtapaAtual] = useState(1);
  const [loading, setLoading] = useState(false);
  
  // Dados do formulário
  const [metaPontuacao, setMetaPontuacao] = useState<number | null>(null);
  const [horasSemana, setHorasSemana] = useState<string>('');
  const [diasEstudo, setDiasEstudo] = useState<string[]>([]);
  const [dataEnem, setDataEnem] = useState<string>('');
  const [nivelAutoavaliado, setNivelAutoavaliado] = useState<string>('');

  const toggleDia = (dia: string) => {
    if (diasEstudo.includes(dia)) {
      setDiasEstudo(diasEstudo.filter(d => d !== dia));
    } else {
      setDiasEstudo([...diasEstudo, dia]);
    }
  };

  const podeAvancar = () => {
    switch (etapaAtual) {
      case 1: return metaPontuacao !== null;
      case 2: return horasSemana !== '';
      case 3: return diasEstudo.length > 0;
      case 4: return nivelAutoavaliado !== '';
      default: return false;
    }
  };

  const avancar = () => {
    if (etapaAtual < 4) {
      setEtapaAtual(etapaAtual + 1);
    } else {
      finalizar();
    }
  };

  const voltar = () => {
    if (etapaAtual > 1) {
      setEtapaAtual(etapaAtual - 1);
    }
  };

  const finalizar = async () => {
    setLoading(true);
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/login');
      return;
    }

    const { error } = await supabase
      .from('profiles')
      .update({
        meta_pontuacao: metaPontuacao,
        horas_semana: horasSemana,
        dias_estudo: diasEstudo,
        data_enem: dataEnem || null,
        nivel_autoavaliado: nivelAutoavaliado,
        onboarding_completo: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (error) {
      console.error('Erro ao salvar:', error);
      alert('Erro ao salvar. Tente novamente.');
      setLoading(false);
      return;
    }

    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Card Principal */}
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">XY</span>
                </div>
                <span className="font-bold text-gray-900">Configuração Inicial</span>
              </div>
              <span className="text-sm text-gray-500">{etapaAtual}/4</span>
            </div>
            
            {/* Progress bar */}
            <div className="flex gap-1">
              {etapas.map((etapa) => (
                <div
                  key={etapa.id}
                  className={`h-1.5 flex-1 rounded-full transition-all ${
                    etapa.id <= etapaAtual ? 'bg-blue-500' : 'bg-gray-200'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Conteúdo */}
          <div className="p-6">
            {/* Etapa 1: Meta de Pontuação */}
            {etapaAtual === 1 && (
              <div>
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Target className="w-8 h-8 text-blue-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Qual sua meta no ENEM?</h2>
                  <p className="text-gray-500">Escolha a faixa de pontuação que deseja alcançar</p>
                </div>
                
                <div className="space-y-3">
                  {metas.map((meta) => (
                    <button
                      key={meta.valor}
                      onClick={() => setMetaPontuacao(meta.valor)}
                      className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                        metaPontuacao === meta.valor
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-blue-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-bold text-gray-900 text-lg">{meta.label} pontos</p>
                          <p className="text-gray-500 text-sm">{meta.desc}</p>
                        </div>
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                          metaPontuacao === meta.valor
                            ? 'border-blue-500 bg-blue-500'
                            : 'border-gray-300'
                        }`}>
                          {metaPontuacao === meta.valor && (
                            <div className="w-2 h-2 bg-white rounded-full" />
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Etapa 2: Tempo de Estudo */}
            {etapaAtual === 2 && (
              <div>
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Clock className="w-8 h-8 text-emerald-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Quanto tempo por semana?</h2>
                  <p className="text-gray-500">Quantas horas você pode dedicar aos estudos</p>
                </div>
                
                <div className="space-y-3">
                  {horasOpcoes.map((opcao) => (
                    <button
                      key={opcao.valor}
                      onClick={() => setHorasSemana(opcao.valor)}
                      className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                        horasSemana === opcao.valor
                          ? 'border-emerald-500 bg-emerald-50'
                          : 'border-gray-200 hover:border-emerald-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-bold text-gray-900">{opcao.label}</p>
                          <p className="text-gray-500 text-sm">{opcao.desc}</p>
                        </div>
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                          horasSemana === opcao.valor
                            ? 'border-emerald-500 bg-emerald-500'
                            : 'border-gray-300'
                        }`}>
                          {horasSemana === opcao.valor && (
                            <div className="w-2 h-2 bg-white rounded-full" />
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Etapa 3: Dias Disponíveis */}
            {etapaAtual === 3 && (
              <div>
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Calendar className="w-8 h-8 text-amber-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Quais dias você estuda?</h2>
                  <p className="text-gray-500">Selecione os dias disponíveis para estudar</p>
                </div>
                
                <div className="flex flex-wrap justify-center gap-2 mb-6">
                  {diasSemana.map((dia) => (
                    <button
                      key={dia.valor}
                      onClick={() => toggleDia(dia.valor)}
                      className={`w-14 h-14 rounded-xl font-bold transition-all ${
                        diasEstudo.includes(dia.valor)
                          ? 'bg-amber-500 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {dia.label}
                    </button>
                  ))}
                </div>

                <div className="bg-gray-50 rounded-xl p-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Data do ENEM (opcional)
                  </label>
                  <input
                    type="date"
                    value={dataEnem}
                    onChange={(e) => setDataEnem(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none"
                  />
                </div>
              </div>
            )}

            {/* Etapa 4: Nível */}
            {etapaAtual === 4 && (
              <div>
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Brain className="w-8 h-8 text-purple-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Como você se avalia?</h2>
                  <p className="text-gray-500">Seu nível atual em matemática</p>
                </div>
                
                <div className="space-y-3">
                  {niveis.map((nivel) => (
                    <button
                      key={nivel.valor}
                      onClick={() => setNivelAutoavaliado(nivel.valor)}
                      className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                        nivelAutoavaliado === nivel.valor
                          ? 'border-purple-500 bg-purple-50'
                          : 'border-gray-200 hover:border-purple-300'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <span className="text-3xl">{nivel.emoji}</span>
                        <div className="flex-1">
                          <p className="font-bold text-gray-900">{nivel.label}</p>
                          <p className="text-gray-500 text-sm">{nivel.desc}</p>
                        </div>
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                          nivelAutoavaliado === nivel.valor
                            ? 'border-purple-500 bg-purple-500'
                            : 'border-gray-300'
                        }`}>
                          {nivelAutoavaliado === nivel.valor && (
                            <div className="w-2 h-2 bg-white rounded-full" />
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer com botões */}
          <div className="px-6 pb-6">
            <div className="flex gap-3">
              {etapaAtual > 1 && (
                <button
                  onClick={voltar}
                  className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-all"
                >
                  <ChevronLeft className="w-5 h-5" />
                  Voltar
                </button>
              )}
              <button
                onClick={avancar}
                disabled={!podeAvancar() || loading}
                className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${
                  podeAvancar() && !loading
                    ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:opacity-90'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                {loading ? (
                  'Salvando...'
                ) : etapaAtual === 4 ? (
                  <>
                    <Sparkles className="w-5 h-5" />
                    Começar a estudar!
                  </>
                ) : (
                  <>
                    Continuar
                    <ChevronRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Texto abaixo */}
        <p className="text-center text-white/70 text-sm mt-6">
          Você pode alterar essas configurações depois nas configurações do perfil.
        </p>
      </div>
    </div>
  );
}
