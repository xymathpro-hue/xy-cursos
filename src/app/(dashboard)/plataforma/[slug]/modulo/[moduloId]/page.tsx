import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PLATAFORMAS, getPlataformaBySlug, type PlataformaSlug } from '@/lib/constants/plataformas';

interface ModuloPageProps {
  params: {
    slug: PlataformaSlug;
    moduloId: string;
  };
}

export default function ModuloPage({ params }: ModuloPageProps) {
  const plataforma = getPlataformaBySlug(params.slug);
  const moduloNumero = parseInt(params.moduloId);
  const modulo = plataforma?.modulos.find(m => m.numero === moduloNumero);

  if (!plataforma || !modulo) {
    notFound();
  }

  // Dados mockados
  const fasesComProgresso = modulo.fases.map((fase, index) => ({
    ...fase,
    concluida: index < 2,
    nota: index < 2 ? (index === 0 ? 85 : 100) : null,
    bloqueada: index > 2,
  }));

  const fasesConcluidas = fasesComProgresso.filter(f => f.concluida).length;
  const progresso = Math.round((fasesConcluidas / modulo.fases.length) * 100);

  return (
    <div className="space-y-8 pb-20 lg:pb-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm">
        <Link 
          href={`/plataforma/${params.slug}`} 
          className="text-dark-400 hover:text-white"
        >
          {plataforma.nome}
        </Link>
        <span className="text-dark-600">/</span>
        <span className="text-white">Módulo {modulo.numero}</span>
      </nav>

      {/* Header */}
      <div className="card relative overflow-hidden">
        <div 
          className="absolute inset-0 opacity-10"
          style={{ backgroundColor: plataforma.cor }}
        />
        
        <div className="relative flex items-start gap-4">
          <div 
            className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shrink-0"
            style={{ backgroundColor: `${plataforma.cor}20` }}
          >
            {modulo.icone}
          </div>

          <div className="flex-1">
            <div className="text-dark-400 text-sm mb-1">Módulo {modulo.numero}</div>
            <h1 className="font-display text-2xl font-bold text-white mb-2">
              {modulo.titulo}
            </h1>
            <p className="text-dark-400 mb-4">{modulo.descricao}</p>

            <div className="max-w-sm">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-dark-400">
                  {fasesConcluidas}/{modulo.fases.length} fases
                </span>
                <span style={{ color: plataforma.cor }}>{progresso}%</span>
              </div>
              <div className="progress-bar h-2">
                <div 
                  className="progress-fill"
                  style={{ width: `${progresso}%`, backgroundColor: plataforma.cor }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Fases */}
      <div>
        <h2 className="font-display text-xl font-semibold text-white mb-4">
          Fases
        </h2>

        <div className="space-y-3">
          {fasesComProgresso.map((fase) => (
            <Link
              key={fase.numero}
              href={fase.bloqueada ? '#' : `/plataforma/${params.slug}/modulo/${params.moduloId}/fase/${fase.numero}`}
              className={`card-hover flex items-center gap-4 ${
                fase.bloqueada ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {/* Status */}
              <div 
                className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold shrink-0 ${
                  fase.concluida 
                    ? 'bg-green-500/20 text-green-500' 
                    : fase.bloqueada 
                      ? 'bg-dark-700 text-dark-500'
                      : ''
                }`}
                style={!fase.concluida && !fase.bloqueada ? { 
                  backgroundColor: `${plataforma.cor}20`, 
                  color: plataforma.cor 
                } : {}}
              >
                {fase.concluida ? '✓' : fase.bloqueada ? '🔒' : fase.numero}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-white">{fase.titulo}</h3>
                  {fase.nota === 100 && (
                    <span 
                      className="badge text-xs"
                      style={{ backgroundColor: `${plataforma.cor}20`, color: plataforma.cor }}
                    >
                      Perfeito!
                    </span>
                  )}
                </div>
                <p className="text-dark-400 text-sm">{fase.descricao}</p>
              </div>

              {/* Stats */}
              <div className="hidden sm:flex items-center gap-6 text-sm">
                <div className="text-center">
                  <div className="text-white">{fase.totalQuestoes}</div>
                  <div className="text-dark-500 text-xs">questões</div>
                </div>
                <div className="text-center">
                  <div style={{ color: plataforma.cor }}>+{fase.xpRecompensa}</div>
                  <div className="text-dark-500 text-xs">XP</div>
                </div>
                {fase.nota !== null && (
                  <div className="text-center">
                    <div className="text-green-500">{fase.nota}%</div>
                    <div className="text-dark-500 text-xs">nota</div>
                  </div>
                )}
              </div>

              <svg className="w-5 h-5 text-dark-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          ))}
        </div>
      </div>

      {/* XP Info */}
      <div 
        className="card border-2"
        style={{ borderColor: `${plataforma.cor}30` }}
      >
        <div className="flex items-center gap-4">
          <div 
            className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
            style={{ backgroundColor: `${plataforma.cor}20` }}
          >
            ⭐
          </div>
          <div>
            <h3 className="font-medium text-white">
              XP disponível: {modulo.fases.reduce((acc, f) => acc + f.xpRecompensa, 0)} XP
            </h3>
            <p className="text-dark-400 text-sm">
              Complete todas as fases para ganhar XP e desbloquear o próximo módulo!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
