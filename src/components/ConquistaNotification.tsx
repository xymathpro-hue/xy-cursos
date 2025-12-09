
'use client';

import { useEffect, useState } from 'react';
import { Trophy } from 'lucide-react';

interface Conquista {
  id: string;
  titulo: string;
  descricao: string;
  icone: string;
  xp_bonus: number;
}

interface ConquistaNotificationProps {
  conquista: Conquista;
  onClose: () => void;
}

export default function ConquistaNotification({ conquista, onClose }: ConquistaNotificationProps) {
  const [visible, setVisible] = useState(false);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    // Animação de entrada
    setTimeout(() => setVisible(true), 100);

    // Fechar após 4 segundos
    const timer = setTimeout(() => {
      setExiting(true);
      setTimeout(onClose, 500);
    }, 4000);

    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div 
      className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 transition-all duration-500 ${
        visible && !exiting 
          ? 'opacity-100 translate-y-0' 
          : 'opacity-0 -translate-y-4'
      }`}
    >
      <div className="bg-gradient-to-r from-amber-500 to-yellow-500 rounded-2xl p-1 shadow-2xl">
        <div className="bg-white rounded-xl p-4">
          <div className="flex items-center gap-4">
            {/* Ícone animado */}
            <div className="relative">
              <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center text-3xl animate-bounce">
                {conquista.icone}
              </div>
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center">
                <Trophy className="w-4 h-4 text-white" />
              </div>
            </div>

            {/* Texto */}
            <div>
              <p className="text-amber-600 text-sm font-medium">🎉 Nova Conquista!</p>
              <p className="text-xl font-black text-gray-900">{conquista.titulo}</p>
              <p className="text-gray-500 text-sm">{conquista.descricao}</p>
              {conquista.xp_bonus > 0 && (
                <p className="text-amber-600 text-sm font-bold mt-1">+{conquista.xp_bonus} XP</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
