import Link from 'next/link';
import { PLATAFORMAS, STATS_GLOBAIS } from '@/lib/constants/plataformas';

export default function HomePage() {
  return (
    <main className="min-h-screen">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 glass">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-accent-purple to-accent-blue rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-lg">XY</span>
              </div>
              <span className="font-display font-bold text-xl text-white">
                XY Cursos
              </span>
            </div>

            {/* Nav Desktop */}
            <nav className="hidden md:flex items-center gap-8">
              <a href="#plataformas" className="text-dark-300 hover:text-white transition-colors text-sm">
                Plataformas
              </a>
              <a href="#sobre" className="text-dark-300 hover:text-white transition-colors text-sm">
                Sobre
              </a>
              <a href="#contato" className="text-dark-300 hover:text-white transition-colors text-sm">
                Contato
              </a>
            </nav>

            {/* Actions */}
            <div className="flex items-center gap-3">
              <Link
                href="/login"
                className="text-dark-300 hover:text-white transition-colors text-sm hidden sm:block"
              >
                Entrar
              </Link>
              <Link
                href="/cadastro"
                className="btn-primary text-sm px-4 py-2"
              >
                Começar Grátis
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-32 pb-16 overflow-hidden">
        {/* Glow effects */}
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-accent-purple/20 rounded-full blur-[120px]" />
        <div className="absolute top-40 right-1/4 w-80 h-80 bg-accent-blue/15 rounded-full blur-[100px]" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-dark-800/80 border border-dark-700/50 rounded-full mb-8 backdrop-blur-sm">
              <span className="text-lg">✨</span>
              <span className="text-dark-300 text-sm font-medium">
                Plataforma integrada de estudos
              </span>
            </div>

            {/* Title */}
            <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
              Sua aprovação começa{' '}
              <span className="text-gradient">aqui e agora</span>
            </h1>

            {/* Subtitle */}
            <p className="text-lg sm:text-xl text-dark-400 mb-12 max-w-2xl mx-auto leading-relaxed">
              Quatro plataformas especializadas para você conquistar seus objetivos: ENEM, Olimpíadas de Matemática, Educação Financeira e IFPI.
            </p>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
              {[
                { icon: '📚', valor: '10.000+', label: 'Questões' },
                { icon: '🎯', valor: '500+', label: 'Aprovados' },
                { icon: '✨', valor: '4', label: 'Plataformas' },
                { icon: '👥', valor: '5.000+', label: 'Alunos' },
              ].map((stat, index) => (
                <div key={index} className="stat-card">
                  <div className="text-2xl mb-2">{stat.icon}</div>
                  <div className="text-2xl sm:text-3xl font-bold text-white mb-1">
                    {stat.valor}
                  </div>
                  <div className="text-dark-400 text-sm">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Plataformas Section */}
      <section id="plataformas" className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-white mb-4">
              Escolha sua plataforma
            </h2>
            <p className="text-dark-400 text-lg max-w-2xl mx-auto">
              Cada plataforma possui banco de questões exclusivo e sistema de estudo personalizado
            </p>
          </div>

          {/* Platform Cards */}
          <div className="space-y-6">
            {PLATAFORMAS.map((plataforma) => (
              <Link
                key={plataforma.slug}
                href={`/plataforma/${plataforma.slug}`}
                className="card-platform block group"
              >
                <div className="flex flex-col lg:flex-row gap-6">
                  {/* Icon */}
                  <div 
                    className="platform-icon shrink-0"
                    style={{ backgroundColor: `${plataforma.cor}20` }}
                  >
                    <span style={{ filter: 'none' }}>{plataforma.icone}</span>
                  </div>

                  {/* Content */}
                  <div className="flex-1">
                    {/* Subtitle */}
                    <div 
                      className="text-xs font-semibold uppercase tracking-wider mb-2"
                      style={{ color: plataforma.cor }}
                    >
                      {plataforma.subtitulo}
                    </div>

                    {/* Title */}
                    <h3 className="font-display text-xl sm:text-2xl font-bold text-white mb-3 group-hover:text-white/90 transition-colors">
                      {plataforma.nome}
                    </h3>

                    {/* Description */}
                    <p className="text-dark-400 text-sm sm:text-base mb-4 leading-relaxed">
                      {plataforma.descricaoCompleta}
                    </p>

                    {/* Features */}
                    <div className="space-y-2 mb-5">
                      {plataforma.features.map((feature, index) => (
                        <div key={index} className="flex items-center gap-3 text-sm text-dark-300">
                          <span className="text-base">{feature.icone}</span>
                          <span>{feature.texto}</span>
                        </div>
                      ))}
                    </div>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-2 mb-5">
                      {plataforma.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="badge"
                          style={{ 
                            backgroundColor: `${plataforma.cor}15`,
                            color: plataforma.cor,
                          }}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>

                    {/* CTA */}
                    <div 
                      className="inline-flex items-center gap-2 font-semibold text-sm transition-all group-hover:gap-3"
                      style={{ color: plataforma.cor }}
                    >
                      Conhecer plataforma
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                    </div>
                  </div>

                  {/* Stats (desktop) */}
                  <div className="hidden xl:flex flex-col gap-3 min-w-[140px]">
                    {plataforma.stats.map((stat, index) => (
                      <div 
                        key={index}
                        className="text-center p-3 rounded-xl"
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
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="card-hover p-8 sm:p-12 relative overflow-hidden">
            {/* Glow */}
            <div className="absolute inset-0 bg-gradient-to-r from-accent-purple/10 to-accent-blue/10" />
            
            <div className="relative">
              <div className="text-5xl mb-6">🚀</div>
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-white mb-4">
                Pronto para começar sua jornada?
              </h2>
              <p className="text-dark-400 mb-8 max-w-lg mx-auto">
                Crie sua conta gratuita e tenha acesso a todas as plataformas.
                Estude no seu ritmo e alcance seus objetivos.
              </p>
              <Link href="/cadastro" className="btn-primary text-lg px-8 py-4">
                Criar Conta Grátis
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-dark-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-accent-purple to-accent-blue rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">XY</span>
              </div>
              <span className="font-display font-bold text-white">XY Cursos</span>
            </div>

            {/* Links */}
            <nav className="flex items-center gap-6 text-sm">
              <a href="#" className="text-dark-400 hover:text-white transition-colors">
                Termos de Uso
              </a>
              <a href="#" className="text-dark-400 hover:text-white transition-colors">
                Privacidade
              </a>
              <a href="#" className="text-dark-400 hover:text-white transition-colors">
                Contato
              </a>
            </nav>

            {/* Copyright */}
            <p className="text-dark-500 text-sm">
              © 2025 XY Cursos. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}
