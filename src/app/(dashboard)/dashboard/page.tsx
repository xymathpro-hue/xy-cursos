import Link from 'next/link';
import { PLATAFORMAS } from '@/lib/constants/plataformas';

export default function DashboardPage() {
  // Dados mockados (substituir por dados do Supabase)
  const user = {
    nome: 'Estudante',
    xpTotal: 450,
    nivel: 2,
    streak: 3,
  };

  const progressoPorPlataforma = {
    enem: { progresso: 15, fasesConcluidas: 3, totalFases: 42 },
    olimpico: { progresso: 0, fasesConcluidas: 0, totalFases: 31 },
    financeiro: { progresso: 25, fasesConcluidas: 6, totalFases: 26 },
    ifpi: { progresso: 10, fasesConcluidas: 1, totalFases: 12 },
  };

  return (
    <div className="space-y-8 pb-20 lg:pb-8">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-white mb-2">
          Olá, {user.nome}! 👋
        </h1>
        <p className="text-dark-400">
          Continue seus estudos e conquiste seus objetivos.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="stat-card">
          <div className="text-2xl mb-2">⭐</div>
          <div className="text-2xl font-bold text-white">{user.xpTotal}</div>
          <div className="text-dark-400 text-sm">XP Total</div>
        </div>
        <div className="stat-card">
          <div className="text-2xl mb-2">🏅</div>
          <div className="text-2xl font-bold text-white">Nível {user.nivel}</div>
          <div className="text-dark-400 text-sm">Seu nível</div>
        </div>
        <div className="stat-card">
          <div className="text-2xl mb-2">🔥</div>
          <div className="text-2xl font-bold text-white">{user.streak} dias</div>
          <div className="text-dark-400 text-sm">Sequência</div>
        </div>
        <div className="stat-card">
          <div className="text-2xl mb-2">📚</div>
          <div className="text-2xl font-bold text-white">
            {Object.values(progressoPorPlataforma).reduce((a, b) => a + b.fasesConcluidas, 0)}
          </div>
          <div className="text-dark-400 text-sm">Fases completas</div>
        </div>
      </div>

      {/* Plataformas */}
      <div>
        <h2 className="font-display text-xl font-semibold text-white mb-4">
          Suas Plataformas
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {PLATAFORMAS.map((plataforma) => {
            const progresso = progressoPorPlataforma[plataforma.slug];
            
            return (
              <Link
                key={plataforma.slug}
                href={`/plataforma/${plataforma.slug}`}
                className="card-hover group"
              >
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div 
                    className="platform-icon shrink-0"
                    style={{ backgroundColor: `${plataforma.cor}20` }}
                  >
                    {plataforma.icone}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div 
                      className="text-xs font-semibold uppercase tracking-wider mb-1"
                      style={{ color: plataforma.cor }}
                    >
                      {plataforma.subtitulo}
                    </div>
                    <h3 className="font-display font-semibold text-white mb-2 truncate">
                      {plataforma.nome}
                    </h3>

                    {/* Progress */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-dark-400">
                          {progresso.fasesConcluidas}/{progresso.totalFases} fases
                        </span>
                        <span style={{ color: plataforma.cor }}>
                          {progresso.progresso}%
                        </span>
                      </div>
                      <div className="progress-bar">
                        <div 
                          className="progress-fill"
                          style={{ 
                            width: `${progresso.progresso}%`,
                            backgroundColor: plataforma.cor,
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Arrow */}
                  <div className="text-dark-500 group-hover:text-white transition-colors">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="font-display text-xl font-semibold text-white mb-4">
          Ações Rápidas
        </h2>
        
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Link href="/plataforma/enem" className="card-hover group flex items-center gap-3">
            <div className="w-10 h-10 bg-enem-500/20 rounded-xl flex items-center justify-center text-xl">
              🎓
            </div>
            <div>
              <h3 className="font-medium text-white text-sm">Estudar ENEM</h3>
              <p className="text-dark-400 text-xs">Continuar módulo</p>
            </div>
          </Link>

          <Link href="/plataforma/olimpico" className="card-hover group flex items-center gap-3">
            <div className="w-10 h-10 bg-olimpico-500/20 rounded-xl flex items-center justify-center text-xl">
              🏆
            </div>
            <div>
              <h3 className="font-medium text-white text-sm">Olimpíadas</h3>
              <p className="text-dark-400 text-xs">Resolver problemas</p>
            </div>
          </Link>

          <Link href="/plataforma/financeiro" className="card-hover group flex items-center gap-3">
            <div className="w-10 h-10 bg-financeiro-500/20 rounded-xl flex items-center justify-center text-xl">
              💰
            </div>
            <div>
              <h3 className="font-medium text-white text-sm">Finanças</h3>
              <p className="text-dark-400 text-xs">Próxima fase</p>
            </div>
          </Link>

          <Link href="/plataforma/ifpi" className="card-hover group flex items-center gap-3">
            <div className="w-10 h-10 bg-ifpi-500/20 rounded-xl flex items-center justify-center text-xl">
              🎯
            </div>
            <div>
              <h3 className="font-medium text-white text-sm">IFPI</h3>
              <p className="text-dark-400 text-xs">Fazer simulado</p>
            </div>
          </Link>
        </div>
      </div>

      {/* Tip Card */}
      <div className="card bg-gradient-to-r from-accent-purple/10 to-accent-blue/10 border-accent-purple/20">
        <div className="flex items-start gap-4">
          <div className="text-3xl">💡</div>
          <div>
            <h3 className="font-medium text-white mb-1">Dica do dia</h3>
            <p className="text-dark-300 text-sm">
              Estude um pouco todos os dias para manter sua sequência e fixar o conteúdo. 
              Apenas 15 minutos diários fazem uma grande diferença!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
