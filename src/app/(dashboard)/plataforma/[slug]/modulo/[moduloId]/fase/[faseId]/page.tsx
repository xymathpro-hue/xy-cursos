'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { getPlataformaBySlug, type PlataformaSlug } from '@/lib/constants/plataformas';

interface FasePageProps {
  params: {
    slug: PlataformaSlug;
    moduloId: string;
    faseId: string;
  };
}

// Questões mockadas
const questoesMock = [
  {
    id: '1',
    numero: 1,
    enunciado: 'Qual é o resultado de 2³ + 3²?',
    alternativa_a: '12',
    alternativa_b: '15',
    alternativa_c: '17',
    alternativa_d: '14',
    resposta_correta: 'C' as const,
    explicacao: '2³ = 8 e 3² = 9. Portanto, 8 + 9 = 17.',
  },
  {
    id: '2',
    numero: 2,
    enunciado: 'Se x + 5 = 12, qual é o valor de x?',
    alternativa_a: '5',
    alternativa_b: '6',
    alternativa_c: '7',
    alternativa_d: '8',
    resposta_correta: 'C' as const,
    explicacao: 'x + 5 = 12 → x = 12 - 5 → x = 7',
  },
  {
    id: '3',
    numero: 3,
    enunciado: 'Qual é a área de um quadrado com lado 5 cm?',
    alternativa_a: '20 cm²',
    alternativa_b: '25 cm²',
    alternativa_c: '10 cm²',
    alternativa_d: '15 cm²',
    resposta_correta: 'B' as const,
    explicacao: 'Área do quadrado = lado². Portanto, 5² = 25 cm².',
  },
];

export default function FasePage({ params }: FasePageProps) {
  const router = useRouter();
  const plataforma = getPlataformaBySlug(params.slug);
  
  const [questaoAtual, setQuestaoAtual] = useState(0);
  const [respostaSelecionada, setRespostaSelecionada] = useState<string | null>(null);
  const [respondida, setRespondida] = useState(false);
  const [respostas, setRespostas] = useState<{ questaoId: string; resposta: string; correta: boolean }[]>([]);
  const [tempoInicio] = useState(Date.now());

  const questao = questoesMock[questaoAtual];
  const totalQuestoes = questoesMock.length;
  const progresso = ((questaoAtual + 1) / totalQuestoes) * 100;

  const handleResponder = () => {
    if (!respostaSelecionada) return;

    const correta = respostaSelecionada === questao.resposta_correta;
    setRespostas([...respostas, { questaoId: questao.id, resposta: respostaSelecionada, correta }]);
    setRespondida(true);
  };

  const handleProxima = () => {
    if (questaoAtual < totalQuestoes - 1) {
      setQuestaoAtual(questaoAtual + 1);
      setRespostaSelecionada(null);
      setRespondida(false);
    } else {
      const tempoGasto = Math.round((Date.now() - tempoInicio) / 1000);
      const acertos = respostas.filter(r => r.correta).length + (respostaSelecionada === questao.resposta_correta ? 1 : 0);
      router.push(`/plataforma/${params.slug}/resultado?acertos=${acertos}&total=${totalQuestoes}&tempo=${tempoGasto}&modulo=${params.moduloId}&fase=${params.faseId}`);
    }
  };

  const alternativas = [
    { letra: 'A', texto: questao.alternativa_a },
    { letra: 'B', texto: questao.alternativa_b },
    { letra: 'C', texto: questao.alternativa_c },
    { letra: 'D', texto: questao.alternativa_d },
  ];

  return (
    <div className="min-h-screen pb-20 lg:pb-8">
      {/* Header */}
      <header className="sticky top-0 z-50 glass border-b border-dark-800 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto py-4">
          <div className="flex items-center justify-between mb-3">
            <Link 
              href={`/plataforma/${params.slug}/modulo/${params.moduloId}`}
              className="text-dark-400 hover:text-white flex items-center gap-2 text-sm"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Sair
            </Link>
            <span className="text-dark-400 text-sm">
              {questaoAtual + 1} de {totalQuestoes}
            </span>
          </div>
          
          <div className="progress-bar">
            <div 
              className="progress-fill transition-all duration-300"
              style={{ width: `${progresso}%`, backgroundColor: plataforma?.cor }}
            />
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-3xl mx-auto py-8">
        {/* Questão */}
        <div className="card mb-6">
          <div 
            className="text-sm font-medium mb-2"
            style={{ color: plataforma?.cor }}
          >
            Questão {questao.numero}
          </div>
          <h2 className="text-xl font-medium text-white leading-relaxed">
            {questao.enunciado}
          </h2>
        </div>

        {/* Alternativas */}
        <div className="space-y-3 mb-8">
          {alternativas.map((alt) => {
            const isSelected = respostaSelecionada === alt.letra;
            const isCorrect = alt.letra === questao.resposta_correta;
            const showResult = respondida;

            return (
              <button
                key={alt.letra}
                onClick={() => !respondida && setRespostaSelecionada(alt.letra)}
                disabled={respondida}
                className={cn(
                  'w-full p-4 rounded-xl border-2 text-left transition-all flex items-start gap-4',
                  !showResult && !isSelected && 'border-dark-700 hover:border-dark-500 bg-dark-800/50',
                  !showResult && isSelected && 'border-accent-purple bg-accent-purple/10',
                  showResult && isCorrect && 'border-green-500 bg-green-500/10',
                  showResult && !isCorrect && isSelected && 'border-red-500 bg-red-500/10',
                  showResult && !isCorrect && !isSelected && 'border-dark-700 bg-dark-800/30 opacity-50',
                )}
              >
                <div
                  className={cn(
                    'w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm shrink-0',
                    !showResult && !isSelected && 'bg-dark-700 text-dark-400',
                    !showResult && isSelected && 'bg-accent-purple text-white',
                    showResult && isCorrect && 'bg-green-500 text-white',
                    showResult && !isCorrect && isSelected && 'bg-red-500 text-white',
                    showResult && !isCorrect && !isSelected && 'bg-dark-700 text-dark-500',
                  )}
                >
                  {showResult && isCorrect ? '✓' : showResult && !isCorrect && isSelected ? '✗' : alt.letra}
                </div>
                <span className={cn(
                  'flex-1 pt-1',
                  !showResult && 'text-dark-200',
                  showResult && isCorrect && 'text-green-400',
                  showResult && !isCorrect && isSelected && 'text-red-400',
                  showResult && !isCorrect && !isSelected && 'text-dark-500',
                )}>
                  {alt.texto}
                </span>
              </button>
            );
          })}
        </div>

        {/* Explicação */}
        {respondida && (
          <div className={cn(
            'card mb-8 animate-in',
            respostaSelecionada === questao.resposta_correta 
              ? 'bg-green-500/10 border-green-500/20' 
              : 'bg-red-500/10 border-red-500/20'
          )}>
            <div className="flex items-start gap-3">
              <div className="text-2xl">
                {respostaSelecionada === questao.resposta_correta ? '🎉' : '💡'}
              </div>
              <div>
                <h3 className={cn(
                  'font-semibold mb-2',
                  respostaSelecionada === questao.resposta_correta ? 'text-green-400' : 'text-red-400'
                )}>
                  {respostaSelecionada === questao.resposta_correta ? 'Correto!' : 'Incorreto'}
                </h3>
                <p className="text-dark-300 text-sm">{questao.explicacao}</p>
              </div>
            </div>
          </div>
        )}

        {/* Botões */}
        <div className="flex justify-end">
          {!respondida ? (
            <button
              onClick={handleResponder}
              disabled={!respostaSelecionada}
              className="btn-primary px-8 py-4"
              style={{ 
                background: respostaSelecionada 
                  ? `linear-gradient(135deg, ${plataforma?.cor}, ${plataforma?.corSecundaria})`
                  : undefined
              }}
            >
              Confirmar
            </button>
          ) : (
            <button
              onClick={handleProxima}
              className="btn-primary px-8 py-4"
              style={{ 
                background: `linear-gradient(135deg, ${plataforma?.cor}, ${plataforma?.corSecundaria})`
              }}
            >
              {questaoAtual < totalQuestoes - 1 ? 'Próxima' : 'Ver Resultado'}
            </button>
          )}
        </div>
      </main>
    </div>
  );
}
