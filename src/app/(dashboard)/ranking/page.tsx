'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';

export default function RankingPage() {
  const [periodo, setPeriodo] = useState<'semanal' | 'mensal' | 'geral'>('semanal');

  const ranking = [
    { id: '1', posicao: 1, nome: 'Maria Silva', xp: 4250, streak: 28 },
    { id: '2', posicao: 2, nome: 'João Santos', xp: 3890, streak: 21 },
    { id: '3', posicao: 3, nome: 'Ana Oliveira', xp: 3650, streak: 14 },
    { id: '4', posicao: 4, nome: 'Pedro Costa', xp: 3200, streak: 18 },
    { id: '5', posicao: 5, nome: 'Carla Souza', xp: 2980, streak: 12 },
    { id: '6', posicao: 6, nome: 'Lucas Lima', xp: 2750, streak: 9 },
    { id: '7', posicao: 7, nome: 'Fernanda Alves', xp: 2600, streak: 15 },
    { id: '8', posicao: 8, nome: 'Ricardo Ferreira', xp: 2450, streak: 7 },
    { id: '9', posicao: 9, nome: 'Juliana Martins', xp: 2300, streak: 11 },
    { id: '10', posicao: 10, nome: 'Bruno Rocha', xp: 2150, streak: 6 },
  ];

  const usuarioAtual = { posicao: 15, xp: 850, streak: 5 };

  return (
    <div className="space-y-8 pb-20 lg:pb-8">
      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-white mb-2">
          Ranking 🏆
        </h1>
        <p className="text-dark-400">Compare seu progresso com outros estudantes.</p>
      </div>

      <div className="flex gap-2">
        {[
          { id: 'semanal', label: 'Semana' },
          { id: 'mensal', label: 'Mês' },
          { id: 'geral', label: 'Geral' },
        ].map((p) => (
          <button
            key={p.id}
            onClick={() => setPeriodo(p.id as typeof periodo)}
            className={cn(
              'px-4 py-2 rounded-lg font-medium transition-colors text-sm',
              periodo === p.id
                ? 'bg-accent-purple/20 text-accent-purple'
                : 'text-dark-400 hover:text-white hover:bg-dark-800'
            )}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Top 3 */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card-hover text-center order-1 mt-8">
          <div className="text-3xl mb-2">🥈</div>
          <div className="w-14 h-14 mx-auto rounded-full bg-slate-400/20 flex items-center justify-center text-xl mb-2">👤</div>
          <h3 className="font-semibold text-white text-sm truncate">{ranking[1].nome}</h3>
          <div className="text-slate-300 font-bold">{ranking[1].xp.toLocaleString()}</div>
          <div className="text-dark-500 text-xs">🔥 {ranking[1].streak}</div>
        </div>

        <div className="card-hover text-center border-yellow-500/30 bg-yellow-500/5">
          <div className="text-4xl mb-2">🥇</div>
          <div className="w-16 h-16 mx-auto rounded-full bg-yellow-500/20 flex items-center justify-center text-2xl mb-2 ring-2 ring-yellow-500/50">👤</div>
          <h3 className="font-semibold text-white truncate">{ranking[0].nome}</h3>
          <div className="text-yellow-500 font-bold text-lg">{ranking[0].xp.toLocaleString()}</div>
          <div className="text-dark-400 text-sm">🔥 {ranking[0].streak}</div>
        </div>

        <div className="card-hover text-center order-2 mt-12">
          <div className="text-3xl mb-2">🥉</div>
          <div className="w-12 h-12 mx-auto rounded-full bg-orange-500/20 flex items-center justify-center text-lg mb-2">👤</div>
          <h3 className="font-semibold text-white text-sm truncate">{ranking[2].nome}</h3>
          <div className="text-orange-400 font-bold">{ranking[2].xp.toLocaleString()}</div>
          <div className="text-dark-500 text-xs">🔥 {ranking[2].streak}</div>
        </div>
      </div>

      {/* Sua Posição */}
      <div className="card bg-accent-purple/10 border-accent-purple/30">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-accent-purple/20 flex items-center justify-center font-bold text-accent-purple">
            #{usuarioAtual.posicao}
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-white">Sua Posição</h3>
            <p className="text-dark-400 text-sm">{usuarioAtual.xp.toLocaleString()} XP • 🔥 {usuarioAtual.streak} dias</p>
          </div>
        </div>
      </div>

      {/* Lista */}
      <div className="space-y-2">
        {ranking.slice(3).map((user) => (
          <div key={user.id} className="card flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-dark-700 flex items-center justify-center font-bold text-dark-400">
              {user.posicao}
            </div>
            <div className="w-10 h-10 rounded-full bg-dark-700 flex items-center justify-center">👤</div>
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-white truncate">{user.nome}</h3>
              <div className="text-dark-400 text-sm">🔥 {user.streak}</div>
            </div>
            <div className="text-right">
              <div className="font-bold text-white">{user.xp.toLocaleString()}</div>
              <div className="text-dark-500 text-xs">XP</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
