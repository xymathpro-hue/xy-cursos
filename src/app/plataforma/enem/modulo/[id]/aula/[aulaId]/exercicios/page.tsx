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
  ChevronUp,
  BookOpen,
  Zap,
  Target,
  Flame
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

interface ContagemNivel {
  facil: number;
  medio: number;
  dificil: number;
}

export default function ExerciciosPage() {
  const params = useParams();
  const router = useRouter();
  const moduloId = params.id as string;
  const aulaId = params.aulaId as string;
  const supabase = createClientComponentClient();

  const [aula, setAula] = useState<Aula | null>(null);
  const [todasQuestoes, setTodasQuestoes] = useState<Questao[]>([]);
  const [questoes, setQuestoes] = useState<Questao[]>([]);
  const [questaoAtual, setQuestaoAtual] = useState(0);
  const [respostas, setRespostas] = useState<Resposta[]>([]);
  const [finalizado, setFinalizado] = useState(false);
  const [mostrarRevisao, setMostrarRevisao] = useState(false);
  const [questaoRevisao, setQuestaoRevisao] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [salvandoErros, setSalvandoErros] = useState(false);
  const [nivelSelecionado, setNivelSelecionado] = useState<string | null>(null);
  const [contagem, setContagem] = useState<ContagemNivel>({ facil: 0, medio: 0, dificil: 0 });

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
        setTodasQuestoes(questoesData);
        
        // Contar questões por nível
        const contar = {
          facil: questoesData.filter(q => q.dificuldade === 'facil').length,
          medio: questoesData.filter(q => q.dificuldade === 'medio').length,
          dificil: questoesData.filter(q => q.dificuldade === 'dificil').length
        };
        setContagem(contar);
      }

      setLoading(false);
    }

    if (moduloId && aulaId) {
      fetchData();
    }
  }, [moduloId, aulaId, supabase, router]);

  const handleSelecionarNivel = (nivel: string) => {
    const questoesFiltradas = todasQuestoes
      .filter(q => q.dificuldade === nivel)
      .slice(0, 10);
    
    setQuestoes(questoesFiltradas);
    setNivelSelecionado(nivel);
  };

  const questao = questoes[questaoAtual];

  const getRespostaAtual = () => {
    const resp = respostas.find(r => r.
