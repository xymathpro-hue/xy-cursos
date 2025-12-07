import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PLATAFORMAS, getPlataformaBySlug, type PlataformaSlug } from '@/lib/constants/plataformas';

interface PlataformaPageProps {
  params: {
    slug: PlataformaSlug;
  };
}

export function generateStaticParams() {
  return PLATAFORMAS.map((p) => ({ slug: p.slug }));
}

export default function PlataformaPage({ params }: PlataformaPageProps) {
  const plataforma = getPlataformaBySlug(params.slug);

  if (!plataforma) {
    notFound();
  }

  // Dados mockados (substituir por Supabase)
  const progressoModulos = plataforma.modulos.map((modulo, index) => ({
    ...modulo,
    fasesConcluidas: index === 0 ? 2 : 0,
    progresso: index === 0 ? 50 : 0,
    bloqueado: index > 1,
  }));

  const totalFases = plataforma.modulos.reduce((acc, m) => acc + m.fases.length, 0);
  const fasesConcluidas = progressoModulos.reduce((acc, m) => acc + m.fasesConcluidas, 0);
  const progressoGeral = Math.round((fasesConcluidas / totalFases) * 100);

  return (
    <div className="space-y-8 pb-20 lg:pb-8">
      {/* Header */}
      <div className="card relative overflow-hidden">
        {/* Background */}
        <div 
          className="absolute inset-0 opacity-10"
          style={{ 
            background: `linear-gradient(135deg, ${plataforma.cor}, ${plataforma.corSecundaria})` 
          }}
        />
        
        <div className="relative flex flex-col sm:flex-row gap-6">
          {/* Icon */}
          <div 
            className="w-20 h-20 rounded-2xl flex items-center justify-center text-4xl shrink-0"
            style={{ backgroundColor: `${plataforma.cor}20` }}
          >
            {plataforma.icone}
          </div>

          {/* Content */}
          <div className="flex-1">
            <div 
              className="text-xs font-semibold uppercase tracking-wider mb-1"
              style={{ color: plataforma.cor }}
            >
              {plataforma.subtitulo}
            </div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-white mb-2">
              {plataforma.nome}
            </h1>
            <p className="text-dark-400 text-sm mb-4">
              {plataforma.descricao}
            </p>

            {/* Progress */}
            <div className="max-w-md">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-dark-400">
                  {fasesConcluidas}/{totalFases} fases completas
                </span>
                <span style={{ color: plataforma.cor }}>
                  {progressoGeral}%
                </span>
              </div>
              <div className="progress-bar h-3">
                <div 
                  className="progress-fill"
                  style={{ 
                    width: `${progressoGeral}%`,
                    backgroundColor: plataforma.cor,
                  }}
                />
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="flex sm:flex-col gap-4">
            {plataforma.stats.map((stat, index) => (
              <div 
                key={index}
                className="text-center px-4 py-2 rounded-xl"
                style={{ backgroundColor: `${plataforma.cor}10` }}
              >
                <div 
                  className="text-xl font-bold"
                  style={{ color: plataforma.cor }}
                >
                  {stat.valor}
                </div>
                <div className="text-dark-400 text-xs">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Módulos */}
      <div>
        <h2 className="font-display text-xl font-semibold text-white mb-4">
          Módulos
        </h2>

        <div className="space-y-4">
          {progressoModulos.map((modulo) => (
            <Link
              key={modulo.numero}
              href={modulo.bloqueado ? '#' : `/plataforma/${params.slug}/modulo/${modulo.numero}`}
              className={`card-hover block ${modulo.bloqueado ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <div className="flex items-center gap-4">
                {/* Number/Icon */}
                <div 
                  className={`w-14 h-14 rounded-xl flex items-center justify-center text-2xl shrink-0 ${
                    modulo.bloqueado ? 'bg-dark-700' : ''
                  }`}
                  style={!modulo.bloqueado ? { backgroundColor: `${plataforma.cor}20` } : {}}
                >
                  {modulo.bloqueado ? '🔒' : modulo.icone}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-dark-500 text-xs">Módulo {modulo.numero}</span>
                    {modulo.progresso === 100 && (
                      <span 
                        className="badge text-xs"
                        style={{ backgroundColor: `${plataforma.cor}20`, color: plataforma.cor }}
                      >
                        Completo ✓
                      </span>
                    )}
                  </div>
                  <h3 className="font-display font-semibold text-white mb-1">
                    {modulo.titulo}
                  </h3>
                  <p className="text-dark-400 text-sm line-clamp-1">
                    {modulo.descricao}
                  </p>
                </div>

                {/* Stats */}
                <div className="hidden sm:flex items-center gap-6 text-sm">
                  <div className="text-center">
                    <div className="text-white font-medium">{modulo.fases.length}</div>
                    <div className="text-dark-500 text-xs">fases</div>
                  </div>
                  <div className="text-center min-w-[60px]">
                    <div style={{ color: plataforma.cor }} className="font-medium">
                      {modulo.progresso}%
                    </div>
                    <div className="text-dark-500 text-xs">completo</div>
                  </div>
                </div>

                {/* Arrow */}
                <div className="text-dark-500">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>

              {/* Progress bar mobile */}
              <div className="mt-4 sm:hidden">
                <div className="progress-bar">
                  <div 
                    className="progress-fill"
                    style={{ 
                      width: `${modulo.progresso}%`,
                      backgroundColor: plataforma.cor,
                    }}
                  />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Features */}
      <div className="card" style={{ borderColor: `${plataforma.cor}30` }}>
        <h3 className="font-display font-semibold text-white mb-4">
          Recursos desta plataforma
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {plataforma.features.map((feature, index) => (
            <div key={index} className="flex items-center gap-3 text-sm">
              <span className="text-lg">{feature.icone}</span>
              <span className="text-dark-300">{feature.texto}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
