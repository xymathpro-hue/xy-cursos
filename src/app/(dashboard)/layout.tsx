'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { PLATAFORMAS, getPlataformaCor, type PlataformaSlug } from '@/lib/constants/plataformas';

const navItems = [
  { href: '/dashboard', label: 'Início', icon: '🏠' },
  { href: '/plataformas', label: 'Plataformas', icon: '📚' },
  { href: '/ranking', label: 'Ranking', icon: '🏆' },
  { href: '/perfil', label: 'Perfil', icon: '👤' },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Detectar plataforma atual pela URL
  const currentPlatform = PLATAFORMAS.find(p => pathname.includes(`/plataforma/${p.slug}`));

  return (
    <div className="min-h-screen">
      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 glass h-16 flex items-center justify-between px-4">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-accent-purple to-accent-blue rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">XY</span>
          </div>
          <span className="font-display font-bold text-white">
            {currentPlatform ? currentPlatform.nome : 'XY Cursos'}
          </span>
        </Link>
        
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 text-dark-400 hover:text-white"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </header>

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 w-72 bg-dark-900 border-r border-dark-800 transform transition-transform duration-300 lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Logo */}
        <div className="h-16 flex items-center gap-3 px-6 border-b border-dark-800">
          <div className="w-10 h-10 bg-gradient-to-br from-accent-purple to-accent-blue rounded-xl flex items-center justify-center">
            <span className="text-white font-bold text-lg">XY</span>
          </div>
          <span className="font-display font-bold text-xl text-white">XY Cursos</span>
        </div>

        {/* Plataformas */}
        <div className="p-4">
          <div className="text-xs font-semibold text-dark-500 uppercase tracking-wider mb-3 px-3">
            Plataformas
          </div>
          <nav className="space-y-1">
            {PLATAFORMAS.map((plataforma) => {
              const isActive = pathname.includes(`/plataforma/${plataforma.slug}`);
              
              return (
                <Link
                  key={plataforma.slug}
                  href={`/plataforma/${plataforma.slug}`}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all',
                    isActive
                      ? 'text-white'
                      : 'text-dark-400 hover:text-white hover:bg-dark-800'
                  )}
                  style={isActive ? { backgroundColor: `${plataforma.cor}20` } : {}}
                >
                  <div 
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-base"
                    style={{ backgroundColor: isActive ? `${plataforma.cor}30` : 'transparent' }}
                  >
                    {plataforma.icone}
                  </div>
                  <span className="text-sm font-medium truncate">{plataforma.nome}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Divider */}
        <div className="border-t border-dark-800 mx-4" />

        {/* Navigation */}
        <div className="p-4">
          <div className="text-xs font-semibold text-dark-500 uppercase tracking-wider mb-3 px-3">
            Menu
          </div>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors',
                    isActive
                      ? 'bg-dark-800 text-white'
                      : 'text-dark-400 hover:text-white hover:bg-dark-800'
                  )}
                >
                  <span className="text-lg">{item.icon}</span>
                  <span className="text-sm font-medium">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Card */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-dark-800">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-10 h-10 bg-accent-purple/20 rounded-full flex items-center justify-center">
              <span className="text-accent-purple">👤</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-white truncate">Usuário</div>
              <div className="text-xs text-dark-400">Nível 1 • 0 XP</div>
            </div>
            <Link href="/perfil" className="text-dark-400 hover:text-white">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </Link>
          </div>
        </div>
      </aside>

      {/* Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="lg:pl-72 pt-16 lg:pt-0 min-h-screen">
        <div className="p-4 sm:p-6 lg:p-8">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 glass border-t border-dark-800 safe-bottom">
        <div className="flex items-center justify-around h-16">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex flex-col items-center gap-1 p-2',
                  isActive ? 'text-accent-purple' : 'text-dark-400'
                )}
              >
                <span className="text-xl">{item.icon}</span>
                <span className="text-xs">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
