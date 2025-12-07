import Link from 'next/link';
import { PLATAFORMAS } from '@/lib/constants/plataformas';

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
              <a href="#cursos" className="text-dark-300 hover:text-white transition-colors text-sm">
                Cursos
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
                className="text-dark-300 hover:text-white transition-colors text-sm"
              >
                Já tenho conta
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
              <span className="text-lg">🎓</span>
              <span className="text-dark-300 text-sm font-medium">
                100% Gratuito em 2025 - Fase de Testes
              </span>
            </div>

            {/* Title */}
            <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
              Escolha seu curso e{' '}
              <span className="text-gradient">comece agora</span>
            </h1>

            {/* Subtitle */}
            <p className="text-lg sm:text-xl text-dark-400 mb-12 max-w-2xl mx-auto leading-relaxed">
              Quatro cursos especializados para públicos diferentes. 
              Inscreva-se apenas nos cursos que você precisa.
            </p>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
              {[
                { icon: '📚', valor: '4', label: 'Cursos' },
                { icon: '🎯', valor: '2.400+', label: 'Questões' },
                { icon: '✨', valor: '111', label: 'Fases' },
                { icon: '🆓', valor: 'Grátis', label: 'em 2025' },
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

      {/* Cursos Section */}
      <section id="cursos" className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-white mb-4">
              Escolha seu curso
            </h2>
            <p className="text-dark-400 text-lg max-w-2xl mx-auto">
              Cada curso é independente. Inscreva-se apenas naqueles que fazem sentido para você.
            </p>
          </div>

          {/* Course Cards */}
          <div className="grid md:grid-cols-2 gap-6">
            {PLATAFORMAS.map((plataforma) => (
              <div
                key={plataforma.slug}
                className="card-hover group relative overflow-hidden"
              >
                {/* Glow on hover */}
                <div 
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{ 
                    background: `radial-gradient(circle at center, ${plataforma.cor}15 0%, transparent 70%)` 
                  }}
                />

                <div className="relative p-6">
                  {/* Header */}
                  <div className="flex items-start gap-4 mb-4">
                    <div 
                      className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl shrink-0"
                      style={{ backgroundColor: `${plataforma.cor}20` }}
                    >
                      {plataforma.icone}
                    </div>
                    <div>
                      <div 
                        className="text-xs font-semibold uppercase tracking-wider mb-1"
                        style={{ color: plataforma.cor }}
                      >
                        {plataforma.subtitulo}
                      </div>
                      <h3 className="font-display text-xl font-bold text-white">
                        {plataforma.nome}
                      </h3>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-dark-400 text-sm mb-4 leading-relaxed">
                    {plataforma.descricaoCompleta}
                  </p>

                  {/* Features */}
                  <div className="grid grid-cols-2 gap-2 mb-5">
                    {plataforma.features.slice(0, 4).map((feature, index) => (
                      <div key={index} className="flex items-center gap-2 text-xs text-dark-300">
                        <span className="text-sm">{feature.icone}</span>
                        <span>{feature.texto}</span>
                      </div>
                    ))}
                  </div>

                  {/* Stats */}
                  <div className="flex gap-4 mb-6">
                    {plataforma.stats.map((stat, index) => (
                      <div 
                        key={index}
                        className="text-center px-3 py-2 rounded-lg"
                        style={{ backgroundColor: `${plataforma.cor}10` }}
                      >
                        <div 
                          className="text-lg font-bold"
                          style={{ color: plataforma.cor }}
                        >
                          {stat.valor}
                        </div>
                        <div className="text-dark-400 text-xs">{stat.label}</div>
                      </div>
                    ))}
                  </div>

                  {/* CTA Button */}
                  <Link
                    href={`/curso/${plataforma.slug}/entrar`}
                    className="w-full py-3 rounded-xl font-semibold text-white text-center block transition-all hover:scale-[1.02] hover:shadow-lg"
                    style={{ 
                      background: `linear-gradient(135deg, ${plataforma.cor} 0%, ${plataforma.cor}cc 100%)`,
                    }}
                  >
                    Inscrever-se Grátis
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Como funciona */}
      <section id="sobre" className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-white mb-4">
              Como funciona
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { 
                numero: '1', 
                titulo: 'Escolha o curso', 
                descricao: 'Selecione o curso que combina com seu objetivo' 
              },
              { 
                numero: '2', 
                titulo: 'Crie sua conta', 
                descricao: 'Cadastro rápido com email e senha' 
              },
              { 
                numero: '3', 
                titulo: 'Comece a estudar', 
                descricao: 'Acesse o conteúdo e acompanhe seu progresso' 
              },
            ].map((passo, index) => (
              <div key={index} className="card-hover p-6 text-center">
                <div className="w-12 h-12 bg-gradient-to-br from-accent-purple to-accent-blue rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-white font-bold text-lg">{passo.numero}</span>
                </div>
                <h3 className="font-display text-lg font-bold text-white mb-2">
                  {passo.titulo}
                </h3>
                <p className="text-dark-400 text-sm">
                  {passo.descricao}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/20 rounded-full">
              <span className="text-green-400 text-sm font-medium">
                💡 Quer mais de um curso? Use a mesma conta e inscreva-se em quantos quiser!
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="contato" className="py-12 border-t border-dark-800">
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
