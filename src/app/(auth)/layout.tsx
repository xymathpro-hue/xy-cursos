import Link from 'next/link';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex">
      {/* Left Side - Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 mb-10">
            <div className="w-12 h-12 bg-gradient-to-br from-accent-purple to-accent-blue rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-xl">XY</span>
            </div>
            <span className="font-display font-bold text-2xl text-white">
              XY Cursos
            </span>
          </Link>

          {children}
        </div>
      </div>

      {/* Right Side - Image/Info */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-accent-purple to-accent-blue relative overflow-hidden">
        {/* Pattern */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-10 left-10 text-6xl opacity-30">π</div>
          <div className="absolute top-1/4 right-20 text-5xl opacity-30">∑</div>
          <div className="absolute bottom-1/3 left-1/4 text-7xl opacity-30">∫</div>
          <div className="absolute bottom-20 right-1/4 text-5xl opacity-30">√</div>
        </div>
        
        {/* Content */}
        <div className="relative z-10 flex flex-col items-center justify-center p-12 text-center">
          <div className="text-8xl mb-8">📚</div>
          <h2 className="font-display text-3xl font-bold text-white mb-4">
            4 Plataformas em 1
          </h2>
          <p className="text-white/80 text-lg max-w-md">
            ENEM, Olimpíadas, Educação Financeira e IFPI. Tudo em um só lugar para sua aprovação.
          </p>

          {/* Stats */}
          <div className="flex items-center gap-8 mt-12">
            <div className="text-center">
              <div className="text-4xl font-bold text-white">10K+</div>
              <div className="text-white/60 text-sm">Questões</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-white">4</div>
              <div className="text-white/60 text-sm">Plataformas</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-white">100%</div>
              <div className="text-white/60 text-sm">Gratuito</div>
            </div>
          </div>
        </div>

        {/* Decorative circles */}
        <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-white/10 rounded-full" />
        <div className="absolute -top-10 -left-10 w-40 h-40 bg-white/10 rounded-full" />
      </div>
    </div>
  );
}
