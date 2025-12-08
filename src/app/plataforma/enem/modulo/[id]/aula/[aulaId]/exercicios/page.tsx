'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { 
  ArrowLeft, 
  ArrowRight, 
  CheckCircle, 
  XCircle, 
  Eye,
  EyeOff,
  Trophy,
  RotateCcw,
  Home,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface Questao {
  id: string;
  numero: number;
  enunciado: string;
  alternativa_a: string;
  alternativa_b: string;
  alternativa_c: string;
  alternativa_d: string;
  alternativa_e: string;
  resposta_correta: string;
  explicacao: string;
  dificuldade: string;
}

interface Aula {
  id: string;
  numero: number;
  titulo: string;
  modulo_id: string;
}

interface Resposta {
  questaoId: string;
  letra: string;
}

export default function ExerciciosPage() {
  const params = useParams();
  const router = useRouter();
  const moduloId = params.id as string;
  const aulaId = params.aulaId as string;
  const supabase = createClientComponentClient();

  const [aula, setAula] = useState<Aula | null>(null);
  const [questoes, setQuestoes] = useState<Questao[]>([]);
  const [questaoAtual, setQuestaoAtual] = useState(0);
  const [respostas, setRespostas] = useState<Resposta[]>([]);
  const [finalizado, setFinalizado] = useState(false);
  const [mostrarRevisao, setMostrarRevisao] = useState(false);
  const [questaoRevisao, setQuestaoRevisao] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [salvandoErros, setSalvandoErros] = useState(false);

  useEffect(() => {
    async function fetchData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }
      setUserId(user.id);

      const { data: aulaData } = await supabase
        .from('aulas')
        .select('*')
        .eq('id', aulaId)
        .single();

      if (aulaData) {
        setAula(aulaData);
      }

      const { data: questoesData } = await supabase
        .from('questoes')
        .select('*')
        .eq('aula_id', aulaId)
        .eq('ativo', true)
        .order('numero', { ascending: true });

      if (questoesData && questoesData.length > 0) {
        setQuestoes(questoesData);
      } else {
        const { data: faseData } = await supabase
          .from('fases')
          .select('id')
          .eq('modulo_id', moduloId)
          .single();

        if (faseData) {
          const { data: questoesFase } = await supabase
            .from('questoes')
            .select('*')
            .eq('fase_id', faseData.id)
            .eq('ativo', true)
            .order('numero', { ascending: true });

          if (questoesFase) {
            setQuestoes(questoesFase);
          }
        }
      }

      setLoading(false);
    }

    if (moduloId && aulaId) {
      fetchData();
    }
  }, [moduloId, aulaId, supabase, router]);

  const questao = questoes[questaoAtual];

  const getRespostaAtual = () => {
    const resp = respostas.find(r => r.questaoId === questao?.id);
    return resp?.letra || null;
  };

  const handleSelecionarResposta = (letra: string) => {
    if (finalizado) return;
    
    setRespostas(prev => {
      const outras = prev.filter(r => r.questaoId !== questao.id);
      return [...outras, { questaoId: questao.id, letra }];
    });
  };

  const handleProximaQuestao = () => {
    if (questaoAtual < questoes.length - 1) {
      setQuestaoAtual(prev => prev + 1);
    }
  };

  const handleQuestaoAnterior = () => {
    if (questaoAtual > 0) {
      setQuestaoAtual(prev => prev - 1);
    }
  };

  const handleIrParaQuestao = (index: number) => {
    setQuestaoAtual(index);
  };

  const handleFinalizar = async () => {
    if (!userId) return;
    setSalvandoErros(true);

    const erros: { questaoId: string; resposta: string }[] = [];
    
    questoes.forEach(q => {
      const resposta = respostas.find(r => r.questaoId === q.id);
      if (resposta && resposta.letra !== q.resposta_correta) {
        erros.push({ questaoId: q.id, resposta: resposta.letra });
      }
    });

    for (const erro of erros) {
      await supabase
        .from('caderno_erros')
        .upsert({
          user_id: userId,
          questao_id: erro.questaoId,
          resposta_usuario: erro.resposta,
          revisado: false,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,questao_id'
        });
    }

    for (const resposta of respostas) {
      const q = questoes.find(quest => quest.id === resposta.questaoId);
      if (q) {
        await supabase
          .from('respostas_usuario')
          .upsert({
            user_id: userId,
            questao_id: resposta.questaoId,
            resposta: resposta.letra,
            correta: resposta.letra === q.resposta_correta,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'user_id,questao_id'
          });
      }
    }

    setSalvandoErros(false);
    setFinalizado(true);
  };

  const handleReiniciar = () => {
    setQuestaoAtual(0);
    setRespostas([]);
    setFinalizado(false);
    setMostrarRevisao(false);
    setQuestaoRevisao(null);
  };

  const calcularResultado = () => {
    let acertos = 0;
    let errosCount = 0;
    
    questoes.forEach(q => {
      const resposta = respostas.find(r => r.questaoId === q.id);
      if (resposta) {
        if (resposta.letra === q.resposta_correta) {
          acertos++;
        } else {
          errosCount++;
        }
      }
    });

    return { acertos, erros: errosCount, total: questoes.length };
  };

  const getDificuldadeCor = (dif: string) => {
    switch (dif) {
      case 'facil': return 'bg-emerald-100 text-emerald-700';
      case 'dificil': return 'bg-red-100 text-red-700';
      default: return 'bg-amber-100 text-amber-700';
    }
  };

  const getNomeDificuldade = (dif: string) => {
    switch (dif) {
      case 'facil': return 'Fácil';
      case 'dificil': return 'Difícil';
      default: return 'Médio';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (questoes.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <p className="text-gray-500 mb-4">Nenhuma questão encontrada para esta aula.</p>
        <Link href={`/plataforma/enem/modulo/${moduloId}/aula/${aulaId}`} className="text-blue-500 hover:underline">
          Voltar à aula
        </Link>
      </div>
    );
  }
