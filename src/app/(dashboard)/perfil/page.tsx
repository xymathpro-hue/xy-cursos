'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { PLATAFORMAS } from '@/lib/constants/plataformas';

export default function PerfilPage() {
  const [activeTab, setActiveTab] = useState<'estatisticas' | 'badges' | 'config'>('estatisticas');

  const user = {
    nome: 'Estudante',
    email: 'estudante@email.com',
    xpTotal: 850,
    nivel: 2,
    streak: 5,
    fasesConcluidas: 12,
    questoesRespondidas: 96,
    acertos: 78,
  };

  const badges = [
    { id: 1, nome: 'Primeiro Passo', icone: '🎯', conquistado: true },
    { id: 2, nome: 'Sequência de 3', icone: '🔥', conquistado: true },
    { id: 3, nome: 'Primeira Fase', icone: '✅', conquistado: true },
    { id: 4, nome: 'Sequência de 7', icone: '🔥', conquistado: false },
    { id: 5, nome: 'Perfeição', icone: '💯', conquistado: false },
    { id: 6, nome: 'Mestre ENEM', icone: '🎓', conquistado: false },
  ];

  const precisao = user.questoesRespondidas > 0 
    ? Math.round((user.acertos / user.questoesRespondidas) * 100) 
    : 0;

  return (
    <div className="space-y-8 pb-20 lg:pb-8">
      {/* Header */}
      <div className="card-hover relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-accent-purple/10 to-accent-blue/10" />
        
        <div className="relative flex flex-col sm:flex-row items-center gap-6">
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-accent-purple/20 flex items-center justify-center text-4xl">
              👤
            </div>
            <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-full bg-accent-purple flex items-center justify-center text-lg">
              {user.nivel}
            </div>
          </div>

          <div className="flex-1 text-center sm:text-left">
            <h1 className="font-display text-2xl font-bold text-white mb-1">{user.nome}</h1>
            <p className="text-dark-400 mb-4">{user.email}</p>
            <div className="flex flex-wrap justify-center sm:justify-start gap-3">
              <span className="badge bg-accent-purple/20 text-accent-purple">
                Nível {user.nivel}
              </span>
              <span className="badge bg-orange-500/20 text-orange-400">
                🔥 {user.streak} dias
              </span>
            </div>
          </div>

          <div className="card bg-dark-800/50 p-4 min-w-[160px] text-center">
            <div className="text-3xl font-bold text-accent-purple">{user.xpTotal}</div>
            <div className="text-dark-500 text-sm">XP Total</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {[
          { id: 'estatisticas', label: 'Estatísticas', icon: '📊' },
          { id: 'badges', label: 'Badges', icon: '🏅' },
          { id: 'config', label: 'Configurações', icon: '⚙️' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={cn(
              'px-4 py-2 rounded-lg font-medium transition-colors text-sm',
              activeTab === tab.id
                ? 'bg-accent-purple/20 text-accent-purple'
                : 'text-dark-400 hover:text-white hover:bg-dark-800'
            )}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Estatísticas */}
      {activeTab === 'estatisticas' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="card-hover text-center">
              <div className="text-3xl font-bold text-white">{user.fasesConcluidas}</div>
              <div className="text-dark-400 text-sm">Fases</div>
            </div>
            <div className="card-hover text-center">
              <div className="text-3xl font-bold text-white">{user.questoesRespondidas}</div>
              <div className="text-dark-400 text-sm">Questões</div>
            </div>
            <div className="card-hover text-center">
              <div className="text-3xl font-bold text-green-500">{precisao}%</div>
              <div className="text-dark-400 text-sm">Precisão</div>
            </div>
            <div className="card-hover text-center">
              <div className="text-3xl font-bold text-white">{user.streak}</div>
              <div className="text-dark-400 text-sm">Melhor Streak</div>
            </div>
          </div>

          <div className="card">
            <h3 className="font-semibold text-white mb-4">Progresso por Plataforma</h3>
            <div className="space-y-4">
              {PLATAFORMAS.map((p) => (
                <div key={p.slug}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-dark-300">{p.icone} {p.nome}</span>
                    <span style={{ color: p.cor }}>15%</span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: '15%', backgroundColor: p.cor }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Badges */}
      {activeTab === 'badges' && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {badges.map((badge) => (
            <div 
              key={badge.id}
              className={cn('card text-center', !badge.conquistado && 'opacity-50')}
            >
              <div className="text-4xl mb-2">{badge.conquistado ? badge.icone : '🔒'}</div>
              <h3 className="font-medium text-white text-sm">{badge.nome}</h3>
              <p className="text-dark-500 text-xs mt-1">
                {badge.conquistado ? 'Conquistado' : 'Bloqueado'}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Config */}
      {activeTab === 'config' && (
        <div className="space-y-6">
          <div className="card">
            <h3 className="font-semibold text-white mb-4">Dados da Conta</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-dark-400 mb-2">Nome</label>
                <input type="text" defaultValue={user.nome} className="input" />
              </div>
              <div>
                <label className="block text-sm text-dark-400 mb-2">Email</label>
                <input type="email" defaultValue={user.email} className="input" disabled />
              </div>
              <button className="btn-primary">Salvar</button>
            </div>
          </div>

          <div className="card border-red-500/20">
            <h3 className="font-semibold text-white mb-4">Zona de Perigo</h3>
            <button className="btn-secondary text-red-500 border-red-500/20 hover:bg-red-500/10">
              Excluir Conta
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
