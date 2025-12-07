'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { getPlataformaBySlug, type PlataformaSlug } from '@/lib/constants/plataformas';

interface ResultadoPageProps {
  params: {
    slug: PlataformaSlug;
  };
}

export default function ResultadoPage({ params }: ResultadoPageProps) {
  const searchParams = useSearchParams();
  const plataforma = getPlataformaBySlug(params.slug);
  
  const acertos = parseInt(searchParams.get('acertos') || '0');
  const total = parseInt(searchParams.get('total') || '0');
  const tempoSegundos = parseInt(searchParams.get('tempo') || '0');
  const moduloId = searchParams.get('modulo') || '1';
  const faseId = searchParams.get('fase') || '1';

  const nota = total > 0 ? Math.round((acertos / total) * 100) : 0;
  const erros = total - acertos;
  const xpGanho = Math.round(100 * (nota / 100) * 1.5);

  const minutos = Math.floor(tempoSegundos / 60);
  const segundos = tempoSegundos % 60;
  const tempoFormatado = `${minutos}:${segundos.toString().padStart(2, '0')}`;

  const getMensagem = () => {
    if (nota === 100) return { emoji: '🏆', titulo: 'Perfeito!', subtitulo: 'Você gabaritou!' };
    if (nota >= 80) return { emoji: '🎉', titulo: 'Excelente!', subtitulo: 'Muito bem!' };
    if (nota >= 60) return { emoji: '👍', titulo: 'Bom trabalho!', subtitulo: 'Continue assim!' };
    if (nota >= 40) return { emoji: '💪', titulo: 'Quase lá!', subtitulo: 'Tente novamente!' };
    return { emoji: '📚', titulo: 'Continue estudando!', subtitulo: 'Revise o conteúdo.' };
  };

  const mensagem = getMensagem();

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="card text-center relative overflow-hidden">
          {nota >= 60 && (
            <div 
              className="absolute inset-0 opacity-10"
              style={{ backgroundColor: plataforma?.cor }}
            />
          )}

          <div className="relative">
            <div className="text-6xl mb-4">{mensagem.emoji}</div>
            <h1 className="font-display text-3xl font-bold text-white mb-2">
              {mensagem.titulo}
            </h1>
            <p className="text-dark-400 mb-6">{mensagem.subtitulo}</p>

            <div 
              className={cn(
                'text-6xl font-bold mb-2',
                nota >= 80 ? 'text-green-500' : nota >= 60 ? '' : 'text-orange-500'
              )}
              style={nota >= 60 && nota < 80 ? { color: plataforma?.cor } : {}}
            >
              {nota}%
            </div>
            <div className="text-dark-400 mb-8">
              {acertos} de {total} questões
            </div>

            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="card bg-dark-800/50 p-3">
                <div className="text-green-500 text-xl font-bold">{acertos}</div>
                <div className="text-dark-500 text-xs">Acertos</div>
              </div>
              <div className="card bg-dark-800/50 p-3">
                <div className="text-red-500 text-xl font-bold">{erros}</div>
                <div className="text-dark-500 text-xs">Erros</div>
              </div>
              <div className="card bg-dark-800/50 p-3">
                <div className="text-white text-xl font-bold">{tempoFormatado}</div>
                <div className="text-dark-500 text-xs">Tempo</div>
              </div>
            </div>

            <div 
              className="card p-4 mb-6"
              style={{ backgroundColor: `${plataforma?.cor}10`, borderColor: `${plataforma?.cor}30` }}
            >
              <div className="flex items-center justify-center gap-3">
                <span className="text-2xl">⭐</span>
                <div>
                  <div style={{ color: plataforma?.cor }} className="font-bold text-xl">
                    +{xpGanho} XP
                  </div>
                  <div className="text-dark-400 text-sm">Conquistado</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-3 mt-6">
          {nota < 100 && (
            <Link
              href={`/plataforma/${params.slug}/modulo/${moduloId}/fase/${faseId}`}
              className="btn-secondary w-full py-4 justify-center"
            >
              🔄 Tentar Novamente
            </Link>
          )}
          
          <Link
            href={`/plataforma/${params.slug}/modulo/${moduloId}`}
            className="btn-primary w-full py-4 justify-center"
            style={{ 
              background: `linear-gradient(135deg, ${plataforma?.cor}, ${plataforma?.corSecundaria})`
            }}
          >
            Continuar →
          </Link>
          
          <Link
            href="/dashboard"
            className="btn-ghost w-full py-3 justify-center text-dark-400"
          >
            Voltar ao Início
          </Link>
        </div>
      </div>
    </div>
  );
}
