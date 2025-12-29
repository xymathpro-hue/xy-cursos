'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { 
  ArrowLeft, 
  ChevronRight,
  Trophy,
  RotateCcw,
  BookOpen,
  AlertCircle,
  Target
} from 'lucide-react'
import MathText from '@/components/MathText'

interface Questao {
  id: string
  numero: number
  enunciado: string
  alternativa_a: string
  alternativa_b: string
  alternativa_c: string
  alternativa_d: string
  alternativa_e: string
  resposta_correta: string
  explicacao: string
  dificuldade: string
}

interface Aula {
  id: string
  numero: number
  titulo: string
}

interface Resposta {
  questaoId: string
  respostaUsuario: string
  correta: boolean
  respostaCorreta: string
}

export default function ExerciciosDificuldadePage() {
  const params = useParams()
  const router = useRouter()
  const supabase = createClientComponentClient()

  const moduloId = params.id as string
  const aulaId = params.aulaId as string
  const dificuldade = params.dificuldade as string

  const [loading, setLoading] = useState(true)
  const [aula, setAula] = useState<Aula | null>(null)
  const [questoes, setQuestoes] = useState<Questao[]>([])
  const [questaoAtual, setQuestaoAtual] = useState(0)
  const [respostaSelecionada, setRespostaSelecionada] = useState<string | null>(null)
  const [respostas, setRespostas] = useState<Resposta[]>([])
  const [fase, setFase] = useState<'jogando' | 'resultado'>('jogando')
  const [userId, setUserId] = useState<string | null>(null)

  const CORES_DIFICULDADE: Record<string, { cor: string; titulo: string; icone: string; xpBase: number; bgLight: string; textColor: string }> = {
    facil: { cor: 'from-green-500 to-green-600', titulo: 'Fácil', icone: '🟢', xpBase: 5, bgLight: 'bg-green-50', textColor: 'text-green-700' },
    medio: { cor: 'from-yellow-500 to-yellow-600', titulo: 'Médio', icone: '🟡', xpBase: 10, bgLight: 'bg-yellow-50', textColor: 'text-yellow-700' },
    dificil: { cor: 'from-red-500 to-red-600', titulo: 'Difícil', icone: '🔴', xpBase: 15, bgLight: 'bg-red-50', textColor: 'text-red-700' }
  }

  const config = CORES_DIFICULDADE[dificuldade] || CORES_DIFICULDADE['facil']

  useEffect(() => {
    async function fetchData() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      setUserId(user.id)

      const { data: aulaData } = await supabase
        .from('aulas')
        .select('*')
        .eq('id', aulaId)
        .single()

      if (aulaData) setAula(aulaData)

      const { data: questoesData } = await supabase
        .from('questoes')
        .select('*')
        .eq('aula_id', aulaId)
        .eq('dificuldade', dificuldade)
        .eq('ativo', true)
        .order('numero', { ascending: true })
        .limit(10)

      if (questoesData) {
        setQuestoes(questoesData)
      }

      setLoading(false)
    }

    fetchData()
  }, [supabase, router, aulaId, dificuldade])

  const selecionarAlternativa = (letra: string) => {
    setRespostaSelecionada(letra)
  }

  const proximaQuestao = () => {
    if (!respostaSelecionada) return

    const questao = questoes[questaoAtual]
    const correta = respostaSelecionada.toUpperCase() === questao.resposta_correta.toUpperCase()

    const novaResposta: Resposta = {
      questaoId: questao.id,
      respostaUsuario: respostaSelecionada,
      correta,
      respostaCorreta: questao.resposta_correta
    }

    const novasRespostas = [...respostas, novaResposta]
    setRespostas(novasRespostas)

    if (questaoAtual < questoes.length - 1) {
      setQuestaoAtual(prev => prev + 1)
      setRespostaSelecionada(null)
    } else {
      finalizarExercicios(novasRespostas)
    }
  }

  const finalizarExercicios = async (todasRespostas: Resposta[]) => {
    if (!userId) return

    // Salvar respostas no banco
    for (const resposta of todasRespostas) {
      await supabase
        .from('respostas_questoes')
        .upsert({
          user_id: userId,
          questao_id: resposta.questaoId,
          resposta: resposta.respostaUsuario.toUpperCase(),
          correta: resposta.correta,
          respondida_em: new Date().toISOString()
        }, {
          onConflict: 'user_id,questao_id'
        })

      // Se errou, salvar no caderno de erros
      if (!resposta.correta) {
        const { data: existente } = await supabase
          .from('caderno_erros')
          .select('id')
          .eq('user_id', userId)
          .eq('questao_id', resposta.questaoId)
          .single()

        if (!existente) {
          await supabase.from('caderno_erros').insert({
            user_id: userId,
            questao_id: resposta.questaoId,
            resposta_usuario: resposta.respostaUsuario.toUpperCase(),
            resposta_correta: resposta.respostaCorreta.toUpperCase(),
            revisado: false
          })
        }
      }
    }

    setFase('resultado')
  }

  const reiniciar = () => {
    setQuestaoAtual(0)
    setRespostas([])
    setRespostaSelecionada(null)
    setFase('jogando')
  }

  const getDicaEstudo = () => {
    const acertos = respostas.filter(r => r.correta).length
    const percentual = (acertos / respostas.length) * 100

    if (percentual >= 90) {
      return { titulo: '🎉 Excelente!', mensagem: 'Você domina este nível! Avance para o próximo desafio.', proximoNivel: dificuldade === 'facil' ? 'medio' : dificuldade === 'medio' ? 'dificil' : null }
    } else if (percentual >= 70) {
      return { titulo: '⭐ Muito bom!', mensagem: 'Ótimo progresso! Revise os erros no Caderno de Erros.', proximoNivel: dificuldade === 'facil' ? 'medio' : dificuldade === 'medio' ? 'dificil' : null }
    } else if (percentual >= 50) {
      return { titulo: '📚 Continue praticando!', mensagem: 'Revise a teoria e refaça os exercícios.', proximoNivel: null }
    } else {
      return { titulo: '🌱 Não desista!', mensagem: 'Revise a teoria com atenção antes de tentar novamente.', proximoNivel: null }
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
      </div>
    )
  }

  if (!aula || questoes.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-2xl shadow-lg">
          <p className="text-gray-600 mb-4">Nenhuma questão disponível neste nível.</p>
          <Link href={`/plataforma/enem/modulo/${moduloId}/aula/${aulaId}`} className="text-blue-600 hover:underline">
            Voltar para a aula
          </Link>
        </div>
      </div>
    )
  }

  // TELA DE RESULTADO
  if (fase === 'resultado') {
    const acertos = respostas.filter(r => r.correta).length
    const erros = respostas.length - acertos
    const percentual = Math.round((acertos / respostas.length) * 100)
    const dica = getDicaEstudo()
    const xpGanho = acertos * config.xpBase

    return (
      <div className={`min-h-screen bg-gradient-to-b ${config.cor}`}>
        <main className="max-w-lg mx-auto px-4 py-8 text-white">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trophy className="w-10 h-10" />
            </div>
            <h1 className="text-3xl font-bold mb-1">Nível {config.titulo} Completo!</h1>
            <p className="text-white/80">{aula.titulo}</p>
          </div>

          <div className="bg-white rounded-3xl p-6 mb-6 text-gray-900">
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-emerald-50 rounded-xl p-4 text-center">
                <p className="text-4xl font-black text-emerald-600">{acertos}</p>
                <p className="text-sm text-emerald-700">Acertos</p>
              </div>
              <div className="bg-red-50 rounded-xl p-4 text-center">
                <p className="text-4xl font-black text-red-600">{erros}</p>
                <p className="text-sm text-red-700">Erros</p>
              </div>
            </div>

            <div className="text-center mb-6">
              <p className="text-5xl font-black text-gray-900">{percentual}%</p>
              <p className="text-gray-500">de aproveitamento</p>
            </div>

            <div className="bg-yellow-50 rounded-xl p-4 text-center mb-6">
              <p className="text-3xl font-bold text-yellow-600">+{xpGanho} XP</p>
              <p className="text-sm text-yellow-700">Experiência ganha</p>
            </div>

            <div className="bg-blue-50 rounded-xl p-4 mb-4">
              <h3 className="font-bold text-blue-800 mb-1">{dica.titulo}</h3>
              <p className="text-sm text-blue-700">{dica.mensagem}</p>
            </div>

            {erros > 0 && (
              <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-orange-800">{erros} {erros === 1 ? 'questão adicionada' : 'questões adicionadas'} ao Caderno de Erros</p>
                  <p className="text-sm text-orange-600">Revise para entender seus erros.</p>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-3">
            {erros > 0 && (
              <Link href="/plataforma/enem/caderno-erros" className="w-full bg-white text-gray-800 font-bold py-4 rounded-xl hover:bg-gray-100 transition-all flex items-center justify-center gap-2">
                <BookOpen className="w-5 h-5" />
                Revisar no Caderno de Erros
              </Link>
            )}

            {dica.proximoNivel && percentual >= 70 && (
              <Link href={`/plataforma/enem/modulo/${moduloId}/aula/${aulaId}/exercicios/${dica.proximoNivel}`} className="w-full bg-white text-gray-800 font-bold py-4 rounded-xl hover:bg-gray-100 transition-all flex items-center justify-center gap-2">
                <Target className="w-5 h-5" />
                Avançar para Nível {dica.proximoNivel === 'medio' ? 'Médio' : 'Difícil'}
              </Link>
            )}

            <div className="flex gap-3">
              <button onClick={reiniciar} className="flex-1 bg-white/20 text-white font-bold py-4 rounded-xl hover:bg-white/30 transition-all flex items-center justify-center gap-2">
                <RotateCcw className="w-5 h-5" />
                Refazer
              </button>
              <Link href={`/plataforma/enem/modulo/${moduloId}/aula/${aulaId}`} className="flex-1 bg-white/20 text-white font-bold py-4 rounded-xl hover:bg-white/30 transition-all text-center">
                Voltar
              </Link>
            </div>
          </div>
        </main>
      </div>
    )
  }

  // TELA DE QUESTÕES - SEM FEEDBACK IMEDIATO
  const questao = questoes[questaoAtual]
  const alternativas = [
    { letra: 'A', texto: questao.alternativa_a },
    { letra: 'B', texto: questao.alternativa_b },
    { letra: 'C', texto: questao.alternativa_c },
    { letra: 'D', texto: questao.alternativa_d },
    { letra: 'E', texto: questao.alternativa_e },
  ].filter(alt => alt.texto)

  return (
    <div className="min-h-screen bg-gray-50">
      <header className={`bg-white border-b-4 ${
        dificuldade === 'facil' ? 'border-green-500' :
        dificuldade === 'medio' ? 'border-yellow-500' :
        'border-red-500'
      } px-4 py-3`}>
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          <Link href={`/plataforma/enem/modulo/${moduloId}/aula/${aulaId}`} className="flex items-center gap-2 text-gray-600">
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm">Voltar</span>
          </Link>
          <div className="flex items-center gap-2">
            <span className="text-xl">{config.icone}</span>
            <span className="font-bold text-gray-900">{questaoAtual + 1}/{questoes.length}</span>
          </div>
        </div>
      </header>

      <div className="h-2 bg-gray-200">
        <div className={`h-full transition-all bg-gradient-to-r ${config.cor}`} style={{ width: `${((questaoAtual + 1) / questoes.length) * 100}%` }} />
      </div>

      <main className="max-w-2xl mx-auto px-4 py-6">
        <div className="flex items-center gap-2 mb-4">
          <span className={`px-3 py-1 rounded-full text-xs font-bold ${config.bgLight} ${config.textColor}`}>
            {config.icone} Nível {config.titulo}
          </span>
        </div>

        <div className="bg-white rounded-2xl p-6 mb-6 border border-gray-100">
          <MathText text={questao.enunciado} className="text-gray-900" />
        </div>

        <div className="space-y-3">
          {alternativas.map((alt) => {
            const selecionada = respostaSelecionada?.toUpperCase() === alt.letra

            return (
              <button
                key={alt.letra}
                onClick={() => selecionarAlternativa(alt.letra)}
                className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                  selecionada
                    ? dificuldade === 'facil' ? 'border-green-500 bg-green-50' :
                      dificuldade === 'medio' ? 'border-yellow-500 bg-yellow-50' :
                      'border-red-500 bg-red-50'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-start gap-3">
                  <span className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm shrink-0 ${
                    selecionada
                      ? dificuldade === 'facil' ? 'bg-green-500 text-white' :
                        dificuldade === 'medio' ? 'bg-yellow-500 text-white' :
                        'bg-red-500 text-white'
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {alt.letra}
                  </span>
                  <MathText text={alt.texto} className="text-gray-700 flex-1" />
                </div>
              </button>
            )
          })}
        </div>

        <button
          onClick={proximaQuestao}
          disabled={!respostaSelecionada}
          className={`w-full mt-6 font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2 ${
            respostaSelecionada
              ? `bg-gradient-to-r ${config.cor} text-white hover:opacity-90`
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          {questaoAtual < questoes.length - 1 ? 'Próxima Questão' : 'Ver Resultado'}
          <ChevronRight className="w-5 h-5" />
        </button>
      </main>
    </div>
  )
}
