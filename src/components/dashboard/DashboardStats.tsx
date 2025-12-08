'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Flame, Zap, Trophy, TrendingUp, Calendar, Target, Star } from 'lucide-react';

interface UserStats {
  xp_total: number;
  nivel: number;
  streak_dias: number;
  questoes_respondidas: number;
  acertos: number;
}

interface DashboardStatsProps {
  userId: string;
}

export function DashboardStats({ userId }: DashboardStatsProps) {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClientComponentClient();

  useEffect(() => {
    async function fetchStats() {
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('xp_total, nivel, streak_dias')
          .eq('id', userId)
          .single();

        const { data: pr
