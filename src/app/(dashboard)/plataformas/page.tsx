import Link from 'next/link';
import { PLATAFORMAS } from '@/lib/constants/plataformas';

export default function PlataformasPage() {
  return (
    <div className="space-y-8 pb-20 lg:pb-8">
      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-white mb-2">
          Plataformas 📚
        </h1>
        <p className="text-dark-400">
          Escolha uma plataforma para estudar.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {PLATAFORMAS.map((plataforma) => (
          <Link
            key={plataforma.slug}
            href={`/plataforma/${plataforma.slug}`}
            className="card-hover group relative overflow-hidden"
          >
            <div 
              className="absolute inset-0 opacity-5 group-hover:opacity-10 transition-opacity"
              style={{ backgroundColor: plataforma.cor }}
            />
            
            <div className="relative">
              <div className="flex items-start gap-4 mb-4">
                <div 
                  className="platform-icon shrink-0"
                  style={{ backgroundColor: `${plataforma.cor}20` }}
                >
                  {plataforma.icone}
                </div>
                <div className="flex-1">
                  <div 
                    className="text-xs font-semibold uppercase tracking-wider mb-1"
                    style={{ color: plataforma.cor }}
                  >
                    {plataforma.subtitulo}
                  </div>
                  <h2 className="font-display text-xl font-bold text-white">
                    {plataforma.nome}
                  </h2>
                </div>
              </div>

              <p className="text-dark-400 text-sm mb-4 line-clamp-2">
                {plataforma.descricao}
              </p>

              <div className="flex flex-wrap gap-2 mb-4">
                {plataforma.tags.slice(0, 3).map((tag, i) => (
                  <span
                    key={i}
                    className="badge"
                    style={{ backgroundColor: `${plataforma.cor}15`, color: plataforma.cor }}
                  >
                    {tag}
                  </span>
                ))}
              </div>

              <div className="flex items-center justify-between">
                <div className="flex gap-4 text-sm text-dark-400">
                  {plataforma.stats.slice(0, 2).map((stat, i) => (
                    <span key={i}>
                      <span className="font-bold text-white">{stat.valor}</span> {stat.label}
                    </span>
                  ))}
                </div>
                <div 
                  className="text-sm font-medium flex items-center gap-1 group-hover:gap-2 transition-all"
                  style={{ color: plataforma.cor }}
                >
                  Acessar
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
