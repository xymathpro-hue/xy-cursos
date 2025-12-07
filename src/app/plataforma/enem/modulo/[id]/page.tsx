'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { 
  ArrowLeft, 
  ArrowRight, 
  CheckCircle, 
  XCircle, 
  Lightbulb,
  Trophy,
  Target,
  Clock,
  RotateCcw
} from 'lucide-react'

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
  pontuacao_tri: number
}

interface Modulo {
  id: string
  numero: number
  titulo: string
}

export default function ModuloQuestoes() {
  const params = useParams()
  const router = useRouter()
  const moduloId = params.id as string
  const supabase = createClientComponentClient()

  const [modulo, setModulo] = useState<Modulo | null>(null)
  const [questoes, setQuestoes] = useState<Questao[]>([])
  const [questaoAtual, setQuestaoAtual] = useState(0)
  const [respostaSelecionada, setRespostaSelecionada] = useState<string | null>(null)
  const [respondida, setRespondida] = useState(false)
  const [mostrarResolucao, setMostrarResolucao] = useState(false)
  const [acertos, setAcertos] = useState(0)
  const [erros, setErros] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      // Buscar módulo
      const { data: moduloData } = await supabase
        .from('modulos')
        .select('*')
        .eq('id', moduloId)
        .single()

      if (moduloData) {
        setModulo(moduloData)
      }

      // Buscar fase do módulo
      const { data: faseData } = await supabase
        .from('fases')
        .select('id')
        .eq('modulo_id', moduloId)
        .single()

      if (faseData) {
        // Buscar questões da fase
        const { data: questoesData } = await supabase
          .from('questoes')
          .select('*')
          .eq('fase_id', faseData.id)
          .eq('ativo', true)
          .order('numero', { ascending: true })

        if (questoesData) {
          setQuestoes(questoesData)
        }
      }

      setLoading(false)
    }

    if (moduloId) {
      fetchData()
    }
  }, [moduloId, supabase])

  const questao = questoes[questaoAtual]

  const handleSelecionarResposta = (letra: string) => {
    if (respondida) return
    setRespostaSelecionada(letra)
  }

  const handleConfirmarResposta = () => {
    if (!respostaSelecionada || respondida) return
    
    setRespondida(true)
    
    if (respostaSelecionada === questao.resposta_correta) {
      setAcertos(prev => prev + 1)
    } else {
      setErros(prev => prev + 1)
    }
  }

  const handleProximaQuestao = () => {
    if (questaoAtual < questoes.length - 1) {
      setQuestaoAtual(prev => prev + 1)
      setRespostaSelecionada(null)
      setRespondida(false)
      setMostrarResolucao(false)
    }
  }

  const handleQuestaoAnterior = () => {
    if (questaoAtual > 0) {
      setQuestaoAtual(prev => prev - 1)
      setRespostaSelecionada(null)
      setRespondida(false)
      setMostrarResolucao(false)
    }
  }

  const handleReiniciar = () => {
    setQuestaoAtual(0)
    setRespostaSelecionada(null)
    setRespondida(false)
    setMostrarResolucao(false)
    setAcertos(0)
    setErros(0)
  }

  const getCorDificuldade = (dif: string) => {
    switch (dif) {
      case 'facil': return 'bg-green-100 text-green-700'
      case 'dificil': return 'bg-red-100 text-red-700'
      default: return 'bg-yellow-100 text-yellow-700'
    }
  }

  const getNomeDificuldade = (dif: string) => {
    switch (dif) {
      case 'facil': return 'Fácil'
      case 'dificil': return 'Difícil'
      default: return 'Médio'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!modulo || questoes.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
        <p className="text-gray-500 mb-4">Nenhuma questão encontrada para este módulo.</p>
        <Link href="/plataforma/enem" className="text-blue-600 hover:underline">
          Voltar aos módulos
        </Link>
      </div>
    )
  }

  const progresso = ((questaoAtual + 1) / questoes.length) * 100
  const alternativas = [
    { letra: 'A', texto: questao.alternativa_a },
    { letra: 'B', texto: questao.alternativa_b },
    { letra: 'C', texto: questao.alternativa_c },
    { letra: 'D', texto: questao.alternativa_d },
    { letra: 'E', texto: questao.alternativa_e },
  ].filter(a => a.texto)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header fixo */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <Link href="/plataforma/enem" className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
              <ArrowLeft className="w-5 h-5" />
              <span className="hidden sm:inline">Voltar</span>
            </Link>
            
            <div className="text-center">
              <p className="text-sm text-gray-500">Módulo {modulo.numero}</p>
              <p className="font-semibold text-gray-800">{modulo.titulo}</p>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 text-green-600">
                <CheckCircle className="w-4 h-4" />
                <span className="font-medium">{acertos}</span>
              </div>
              <div className="flex items-center gap-1 text-red-600">
                <XCircle className="w-4 h-4" />
                <span className="font-medium">{erros}</span>
              </div>
            </div>
          </div>

          {/* Barra de progresso */}
          <div className="mt-3">
            <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
              <span>Questão {questaoAtual + 1} de {questoes.length}</span>
              <span>{Math.round(progresso)}%</span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-300"
                style={{ width: `${progresso}%` }}
              ></div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* Card da questão */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          {/* Tags da questão */}
          <div className="px-6 py-4 bg-gray-50 border-b flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${getCorDificuldade(questao.dificuldade)}`}>
                {getNomeDificuldade(questao.dificuldade)}
              </span>
              {questao.pontuacao_tri && (
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                  ~{questao.pontuacao_tri} pts TRI
                </span>
              )}
            </div>
            <span className="text-sm text-gray-500">
              Questão {questao.numero}
            </span>
          </div>

          {/* Enunciado */}
          <div className="p-6">
            <p className="text-gray-800 text-lg leading-relaxed whitespace-pre-line">
              {questao.enunciado}
            </p>
          </div>

          {/* Alternativas */}
          <div className="px-6 pb-6 space-y-3">
            {alternativas.map(({ letra, texto }) => {
              const isSelected = respostaSelecionada === letra
              const isCorreta = questao.resposta_correta === letra
              const isErrada = respondida && isSelected && !isCorreta

              let bgClass = 'bg-gray-50 hover:bg-gray-100 border-gray-200'
              let borderClass = 'border-2'
              
              if (respondida) {
                if (isCorreta) {
                  bgClass = 'bg-green-50 border-green-500'
                } else if (isErrada) {
                  bgClass = 'bg-red-50 border-red-500'
                }
              } else if (isSelected) {
                bgClass = 'bg-blue-50 border-blue-500'
              }

              return (
                <button
                  key={letra}
                  onClick={() => handleSelecionarResposta(letra)}
                  disabled={respondida}
                  className={`w-full p-4 rounded-xl ${borderClass} ${bgClass} transition-all duration-200 text-left flex items-start gap-3 ${!respondida && 'cursor-pointer'}`}
                >
                  <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                    respondida && isCorreta 
                      ? 'bg-green-500 text-white' 
                      : respondida && isErrada 
                        ? 'bg-red-500 text-white'
                        : isSelected 
                          ? 'bg-blue-500 text-white' 
                          : 'bg-gray-200 text-gray-600'
                  }`}>
                    {respondida && isCorreta ? <CheckCircle className="w-5 h-5" /> : 
                     respondida && isErrada ? <XCircle className="w-5 h-5" /> : letra}
                  </span>
                  <span className="text-gray-700 pt-1">{texto}</span>
                </button>
              )
            })}
          </div>

          {/* Botão de confirmar */}
          {!respondida && (
            <div className="px-6 pb-6">
              <button
                onClick={handleConfirmarResposta}
                disabled={!respostaSelecionada}
                className={`w-full py-4 rounded-xl font-semibold text-white transition-all ${
                  respostaSelecionada 
                    ? 'bg-blue-600 hover:bg-blue-700' 
                    : 'bg-gray-300 cursor-not-allowed'
                }`}
              >
                Confirmar Resposta
              </button>
            </div>
          )}

          {/* Feedback após responder */}
          {respondida && (
            <div className={`px-6 py-4 ${respostaSelecionada === questao.resposta_correta ? 'bg-green-50' : 'bg-red-50'}`}>
              <div className="flex items-center gap-3">
                {respostaSelecionada === questao.resposta_correta ? (
                  <>
                    <CheckCircle className="w-8 h-8 text-green-600" />
                    <div>
                      <p className="font-bold text-green-800">Parabéns! Você acertou! 🎉</p>
                      <p className="text-green-600 text-sm">+{questao.pontuacao_tri || 10} pontos TRI estimados</p>
                    </div>
                  </>
                ) : (
                  <>
                    <XCircle className="w-8 h-8 text-red-600" />
                    <div>
                      <p className="font-bold text-red-800">Resposta incorreta</p>
                      <p className="text-red-600 text-sm">A resposta correta é a alternativa {questao.resposta_correta}</p>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Botão ver resolução */}
          {respondida && questao.explicacao && (
            <div className="px-6 py-4 border-t">
              <button
                onClick={() => setMostrarResolucao(!mostrarResolucao)}
                className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
              >
                <Lightbulb className="w-5 h-5" />
                {mostrarResolucao ? 'Ocultar resolução' : 'Ver resolução completa'}
              </button>
              
              {mostrarResolucao && (
                <div className="mt-4 p-4 bg-blue-50 rounded-xl">
                  <h4 className="font-bold text-blue-800 mb-2 flex items-center gap-2">
                    <Lightbulb className="w-5 h-5" />
                    Resolução
                  </h4>
                  <div className="text-gray-700 whitespace-pre-line">
                    {questao.explicacao}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Navegação */}
        <div className="flex items-center justify-between mt-6">
          <button
            onClick={handleQuestaoAnterior}
            disabled={questaoAtual === 0}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium ${
              questaoAtual === 0 
                ? 'text-gray-400 cursor-not-allowed' 
                : 'text-gray-600 hover:bg-gray-200'
            }`}
          >
            <ArrowLeft className="w-5 h-5" />
            Anterior
          </button>

          {respondida && questaoAtual < questoes.length - 1 && (
            <button
              onClick={handleProximaQuestao}
              className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold bg-blue-600 text-white hover:bg-blue-700"
            >
              Próxima Questão
              <ArrowRight className="w-5 h-5" />
            </button>
          )}

          {respondida && questaoAtual === questoes.length - 1 && (
            <div className="flex gap-2">
              <button
                onClick={handleReiniciar}
                className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-gray-600 hover:bg-gray-200"
              >
                <RotateCcw className="w-5 h-5" />
                Reiniciar
              </button>
              <Link
                href="/plataforma/enem"
                className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold bg-green-600 text-white hover:bg-green-700"
              >
                <Trophy className="w-5 h-5" />
                Finalizar
              </Link>
            </div>
          )}
        </div>

        {/* Resumo final */}
        {respondida && questaoAtual === questoes.length - 1 && (
          <div className="mt-6 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 text-white">
            <div className="flex items-center gap-3 mb-4">
              <Trophy className="w-8 h-8" />
              <h3 className="text-xl font-bold">Módulo Concluído!</h3>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white/10 rounded-xl p-4 text-center">
                <p className="text-3xl font-bold">{acertos}</p>
                <p className="text-sm text-blue-100">Acertos</p>
              </div>
              <div className="bg-white/10 rounded-xl p-4 text-center">
                <p className="text-3xl font-bold">{erros}</p>
                <p className="text-sm text-blue-100">Erros</p>
              </div>
              <div className="bg-white/10 rounded-xl p-4 text-center">
                <p className="text-3xl font-bold">
                  {Math.round((acertos / (acertos + erros)) * 100) || 0}%
                </p>
                <p className="text-sm text-blue-100">Aproveitamento</p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
