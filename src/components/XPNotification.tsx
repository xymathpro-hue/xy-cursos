
'use client';

import { useEffect, useState } from 'react';
import { Star, TrendingUp, Flame } from 'lucide-react';

interface XPNotificationProps {
  xpGanho: number;
  streak?: number;
  subiuNivel?: boolean;
  novoNivel?: string;
  onClose: () => void;
}

export default function XPNotification({ 
  xpGanho, 
  streak, 
  subiuNivel, 
  novoNivel, 
  onClose 
}: XPNotificationProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onClose, 300);
    }, 3000);

    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div 
      className={`fixed top-4 right-4 z-50 transition-all duration-300 ${
        visible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-full'
      }`}
    >
      <div className="bg-white rounded-2xl shadow-2xl border border-amber-200 p-4 min-w-[200px]">
        {subiuNivel ? (
          <div className="text-center">
            <div className="text-4xl mb-2">🎉</div>
            <p className="text-lg font-bold text-gray-900">Subiu de Nível!</p>
            <p className="text-amber-600 font-medium">{novoNivel}</p>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
              <Star className="w-6 h-6 text-amber-500" />
            </div>
            <div>
              <p className="text-xl font-bold text-amber-600">+{xpGanho} XP</p>
              {streak && streak > 1 && (
                <div className="flex items-center gap-1 text-orange-500 text-sm">
                  <Flame className="w-4 h-4" />
                  <span>{streak} dias seguidos!</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
