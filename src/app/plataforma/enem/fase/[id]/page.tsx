'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { 
  ArrowLeft, 
  CheckCircle, 
  XCircle,
  ChevronRight,
  ChevronLeft,
  Target,
  Trophy,
  RotateCcw,
  Home
} from 'lucide-react'

interface Fase {
  id: string
  titulo: string
  total_questoes: number
  modulo_id: string
}

interface Modulo {
  id: string
  numero: number
  titulo: string
}

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

export default function FasePage() {
  const params = useParams()
  const router = useRouter()
  const faseId = params.id as string
  
  const [fase, setFase] = useState<Fase | null>(null)
  const [modulo, setModulo] = useState<Modulo | null>(null)
  const [questoes, setQuestoes] = useState<Questao[]>([])
  const [questaoAtual, setQuestaoAtual] = useState(0)
  const [respostaSelecionada, setRespostaSelecionada] = useState<string | null>(null)
  const [respostaConfirmada, setRespostaConfirmada] = useState(false)
  const [respostas, setRespostas] = useState<Record<number, { resposta: string; correta: boolean }>>({})
  const [loading, setLoading] = useState(true)
  const [modoResultado, setModoResultado] = useState(false)
  
  const supabase = createClientComponentClient()

  useEffect(() => {
    async function fetchData() {
      // Buscar fase
      const { data: faseData, error: faseError } = await supabase
        .from('fases')
        .select('*')
        .eq('id', faseId)
        .single()

      if (faseError || !faseData) {
        console.error('Erro ao buscar fase:', faseError)
        router.push('/plataforma/enem')
        return
      }
      setFase(faseData)

      // Buscar módulo
      const { data: moduloData } = await supabase
        .from('modulos')
        .select('*')
        .eq('id', faseData.modulo_id)
        .single()

      if (moduloData) {
        setModulo(moduloData)
      }

      // Buscar questões da fase
      const { data: questoesData, error: questoesError } = await supabase
        .from('questoes')
        .select('*')
        .eq('fase_id', faseId)
        .eq('ativo', true)
        .order('numero', { ascending: true })

      if (questoesError) {
        console.error('Erro ao buscar questões:', questoesError)
      }

      setQuestoes(questoesData || [])
      setLoading(false)
    }

    fetchData()
  }, [faseId, router, supabase])

  const handleSelecionarResposta = (alternativa: string) => {
    if (!respostaConfirmada) {
      setRespostaSelecionada(alternativa)
    }
  }

  const handleConfirmarResposta = () => {
    if (!respostaSelecionada) return

    const questao = questoes[questaoAtual]
    const correta = respostaSelecionada === questao.resposta_correta

    setRespostas({
      ...respostas,
      [questaoAtual]: { resposta: respostaSelecionada, correta }
    })
    setRespostaConfirmada(true)
  }

  const handleProximaQuestao = () => {
    if (questaoAtual < questoes.length - 1) {
      setQuestaoAtual(questaoAtual + 1)
      setRespostaSelecionada(null)
      setRespostaConfirmada(false)
    } else {
      setModoResultado(true)
    }
  }

  const handleQuestaoAnterior = () => {
    if (questaoAtual > 0) {
      setQuestaoAtual(questaoAtual - 1)
      const respostaAnterior = respostas[questaoAtual - 1]
      if (respostaAnterior) {
        setRespostaSelecionada(respostaAnterior.resposta)
        setRespostaConfirmada(true)
      } else {
        setRespostaSelecionada(null)
        setRespostaConfirmada(false)
      }
    }
  }

  const handleReiniciar = () => {
    setQuestaoAtual(0)
    setRespostaSelecionada(null)
    setRespostaConfirmada(false)
    setRespostas({})
    setModoResultado(false)
  }

  const irParaQuestao = (index: number) => {
    setQuestaoAtual(index)
    const resposta = respostas[index]
    if (resposta) {
      setRespostaSelecionada(resposta.resposta)
      setRespostaConfirmada(true)
    } else {
      setRespostaSelecionada(null)
      setRespostaConfirmada(false)
    }
    setModoResultado(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!fase || questoes.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Nenhuma questão disponível nesta fase.</p>
          <Link href="/plataforma/enem" className="text-blue-600 hover:underline">
            Voltar para os módulos
          </Link>
        </div>
      </div>
    )
  }

  // Calcular resultados
  const totalRespondidas = Object.keys(respostas).length
  const acertos = Object.values(respostas).filter(r => r.correta).length
  const percentualAcertos = totalRespondidas > 0 ? (acertos / totalRespondidas) * 100 : 0

  // Modo Resultado
  if (modoResultado) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <header className="bg-white shadow-sm sticky top-0 z-10">
          <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
            <Link 
              href={modulo ? `/plataforma/enem/modulo/${modulo.id}` : '/plataforma/enem'} 
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Voltar</span>
            </Link>
            <span className="font-bold text-gray-800">Resultado</span>
            <div className="w-20"></div>
          </div>
        </header>

        <main className="max-w-4xl mx-auto px-4 py-8">
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center">
              <Trophy className="w-10 h-10 text-white" />
            </div>
            
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Prática Concluída!</h1>
            <p className="text-gray-600 mb-6">{fase.titulo}</p>

            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="bg-blue-50 rounded-xl p-4">
                <p className="text-3xl font-bold text-blue-600">{totalRespondidas}</p>
                <p className="text-sm text-gray-600">Respondidas</p>
              </div>
              <div className="bg-green-50 rounded-xl p-4">
                <p className="text-3xl font-bold text-green-600">{acertos}</p>
                <p className="text-sm text-gray-600">Acertos</p>
              </div>
              <div className="bg-purple-50 rounded-xl p-4">
                <p className="text-3xl font-bold text-purple-600">{percentualAcertos.toFixed(0)}%</p>
                <p className="text-sm text-gray-600">Aproveitamento</p>
              </div>
            </div>

            {/* Lista de questões para revisão */}
            <div className="mb-8">
              <h3 className="font-semibold text-gray-700 mb-4">Revise suas respostas:</h3>
              <div className="flex flex-wrap gap-2 justify-center">
                {questoes.map((_, index) => {
                  const resposta = respostas[index]
                  return (
                    <button
                      key={index}
                      onClick={() => irParaQuestao(index)}
                      className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-medium transition-all ${
                        resposta
                          ? resposta.correta
                            ? 'bg-green-100 text-green-700 hover:bg-green-200'
                            : 'bg-red-100 text-red-700 hover:bg-red-200'
                          : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                      }`}
                    >
                      {index + 1}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="flex gap-4 justify-center">
              <button
                onClick={handleReiniciar}
                className="flex items-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors"
              >
                <RotateCcw className="w-5 h-5" />
                Refazer
              </button>
              <Link
                href={modulo ? `/plataforma/enem/modulo/${modulo.id}` : '/plataforma/enem'}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
              >
                <Home className="w-5 h-5" />
                Voltar ao Módulo
              </Link>
            </div>
          </div>
        </main>
      </div>
    )
  }

  // Questão atual
  const questao = questoes[questaoAtual]
  const alternativas = [
    { letra: 'A', texto: questao.alternativa_a },
    { letra: 'B', texto: questao.alternativa_b },
    { letra: 'C', texto: questao.alternativa_c },
    { letra: 'D', texto: questao.alternativa_d },
    { letra: 'E', texto: questao.alternativa_e },
  ].filter(alt => alt.texto) // Remove alternativas vazias

  const corDificuldade = {
    facil: 'bg-green-100 text-green-700',
    medio: 'bg-yellow-100 text-yellow-700',
    dificil: 'bg-red-100 text-red-700',
  }[questao.dificuldade] || 'bg-gray-100 text-gray-700'

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link 
            href={modulo ? `/plataforma/enem/modulo/${modulo.id}` : '/plataforma/enem'} 
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Voltar</span>
          </Link>
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-blue-600" />
            <span className="font-bold text-gray-800">
              Questão {questaoAtual + 1} de {questoes.length}
            </span>
          </div>
          <div className="text-sm text-gray-500">
            {acertos}/{totalRespondidas} ✓
          </div>
        </div>
        
        {/* Barra de progresso */}
        <div className="h-1 bg-gray-100">
          <div 
            className="h-full bg-blue-600 transition-all duration-300"
            style={{ width: `${((questaoAtual + 1) / questoes.length) * 100}%` }}
          />
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* Card da Questão */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-4">
          {/* Header da questão */}
          <div className="bg-gray-50 px-6 py-4 flex items-center justify-between border-b">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-gray-500">
                {modulo?.titulo}
              </span>
              <span className={`text-xs px-2 py-1 rounded-full ${corDificuldade}`}>
                {questao.dificuldade}
              </span>
            </div>
          </div>

          {/* Enunciado */}
          <div className="p-6">
            <p className="text-gray-800 text-lg leading-relaxed whitespace-pre-wrap">
              {questao.enunciado}
            </p>
          </div>

          {/* Alternativas */}
          <div className="px-6 pb-6 space-y-3">
            {alternativas.map((alt) => {
              const selecionada = respostaSelecionada === alt.letra
              const correta = questao.resposta_correta === alt.letra
              
              let estilo = 'border-gray-200 hover:border-blue-400 hover:bg-blue-50'
              
              if (respostaConfirmada) {
                if (correta) {
                  estilo = 'border-green-500 bg-green-50'
                } else if (selecionada && !correta) {
                  estilo = 'border-red-500 bg-red-50'
                } else {
                  estilo = 'border-gray-200 opacity-60'
                }
              } else if (selecionada) {
                estilo = 'border-blue-500 bg-blue-50'
              }

              return (
                <button
                  key={alt.letra}
                  onClick={() => handleSelecionarResposta(alt.letra)}
                  disabled={respostaConfirmada}
                  className={`w-full flex items-start gap-4 p-4 border-2 rounded-xl transition-all text-left ${estilo}`}
                >
                  <span className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 font-bold text-sm ${
                    respostaConfirmada && correta
                      ? 'bg-green-500 text-white'
                      : respostaConfirmada && selecionada && !correta
                        ? 'bg-red-500 text-white'
                        : selecionada
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-100 text-gray-600'
                  }`}>
                    {respostaConfirmada && correta ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : respostaConfirmada && selecionada && !correta ? (
                      <XCircle className="w-5 h-5" />
                    ) : (
                      alt.letra
                    )}
                  </span>
                  <span className="text-gray-700 pt-1">{alt.texto}</span>
                </button>
              )
            })}
          </div>

          {/* Explicação (após confirmar) */}
          {respostaConfirmada && questao.explicacao && (
            <div className="px-6 pb-6">
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <h4 className="font-semibold text-blue-800 mb-2">💡 Explicação:</h4>
                <p className="text-blue-700 text-sm whitespace-pre-wrap">{questao.explicacao}</p>
              </div>
            </div>
          )}
        </div>

        {/* Navegação */}
        <div className="flex items-center justify-between">
          <button
            onClick={handleQuestaoAnterior}
            disabled={questaoAtual === 0}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-colors ${
              questaoAtual === 0
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-white text-gray-700 hover:bg-gray-50 shadow-sm'
            }`}
          >
            <ChevronLeft className="w-5 h-5" />
            Anterior
          </button>

          {!respostaConfirmada ? (
            <button
              onClick={handleConfirmarResposta}
              disabled={!respostaSelecionada}
              className={`px-8 py-3 rounded-xl font-semibold transition-colors ${
                respostaSelecionada
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              Confirmar
            </button>
          ) : (
            <button
              onClick={handleProximaQuestao}
              className="flex items-center gap-2 px-8 py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition-colors"
            >
              {questaoAtual < questoes.length - 1 ? 'Próxima' : 'Ver Resultado'}
              <ChevronRight className="w-5 h-5" />
            </button>
          )}

          <button
            onClick={() => setModoResultado(true)}
            className="flex items-center gap-2 px-4 py-2 bg-white text-gray-700 rounded-xl hover:bg-gray-50 shadow-sm transition-colors"
          >
            Finalizar
          </button>
        </div>

        {/* Indicadores de questões */}
        <div className="mt-6 bg-white rounded-xl p-4 shadow-sm">
          <div className="flex flex-wrap gap-2 justify-center">
            {questoes.map((_, index) => {
              const resposta = respostas[index]
              const atual = index === questaoAtual
              
              return (
                <button
                  key={index}
                  onClick={() => irParaQuestao(index)}
                  className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-medium transition-all ${
                    atual
                      ? 'bg-blue-600 text-white ring-2 ring-blue-300'
                      : resposta
                        ? resposta.correta
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                        : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  }`}
                >
                  {index + 1}
                </button>
              )
            })}
          </div>
        </div>
      </main>
    </div>
  )
}

