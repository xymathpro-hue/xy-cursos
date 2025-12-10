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

interface Modulo {
  id: string
  numero: number
  titulo: string
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
  const [modulo, setModulo] = useState<Modulo | null>(null)
  const [questoes, setQuestoes] = useState<Questao[]>([])
  const [questaoAtual, setQuestaoAtual] = useState(0)
  const [respostaSelecionada, setRespostaSelecionada] = useState<string | null>(null)
  const [respostaConfirmada, setRespostaConfirmada] = useState(false)
  const [respostas, setRespostas] = useState<Record<number, { resposta: string; correta: boolean }>>({})
  const [modoResultado, setModoResultado] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)

  const CORES_DIFICULDADE: Record<string, { cor: string; titulo: string; icone: string }> = {
    facil: { cor: 'from-green-500 to-green-600', titulo: 'Exercícios Fáceis', icone: '🟢' },
    medio: { cor: 'from-yellow-500 to-yellow-600', titulo: 'Exercícios Médios', icone: '🟡' },
    dificil: { cor: 'from-red-500 to-red-600', titulo: 'Exercícios Difíceis', icone: '🔴' }
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

      // Buscar módulo
      const { data: moduloData } = await supabase
        .from('modulos')
        .select('*')
        .eq('id', moduloId)
        .single()

      if (moduloData) setModulo(moduloData)

      // Buscar aula
      const { data: aulaData } = await supabase
        .from('aulas')
        .select('*')
        .eq('id', aulaId)
        .single()

      if (aulaData) setAula(aulaData)

      // Buscar questões da aula com a dificuldade específica
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

      // Buscar respostas anteriores do usuário
      if (questoesData && questoesData.length > 0) {
        const questaoIds = questoesData.map(q => q.id)
        const { data: respostasData } = await supabase
          .from('respostas_questoes')
          .select('questao_id, resposta, correta')
          .eq('user_id', user.id)
          .in('questao_id', questaoIds)

        if (respostasData) {
          const respostasMap: Record<number, { resposta: string; correta: boolean }> = {}
          respostasData.forEach((r: any) => {
            const index = questoesData.findIndex(q => q.id === r.questao_id)
            if (index !== -1) {
              respostasMap[index] = { resposta: r.resposta, correta: r.correta }
            }
          })
          setRespostas(respostasMap)
        }
      }

      setLoading(false)
    }

    fetchData()
  }, [supabase, router, moduloId, aulaId, dificuldade])

  const salvarResposta = async (questaoId: string, resposta: string, correta: boolean) => {
    if (!userId) return

    await supabase
      .from('respostas_questoes')
      .upsert({
        user_id: userId,
        questao_id: questaoId,
        resposta: resposta,
        correta: correta,
        respondida_em: new Date().toISOString()
      }, {
        onConflict: 'user_id,questao_id'
      })
  }

  const handleSelecionarResposta = (alternativa: string) => {
    if (!respostaConfirmada) {
      setRespostaSelecionada(alternativa)
    }
  }

  const handleConfirmarResposta = async () => {
    if (!respostaSelecionada) return

    const questao = questoes[questaoAtual]
    const correta = respostaSelecionada === questao.resposta_correta

    setRespostas({
      ...respostas,
      [questaoAtual]: { resposta: respostaSelecionada, correta }
    })
    setRespostaConfirmada(true)

    // Salvar no banco
    await salvarResposta(questao.id, respostaSelecionada, correta)
  }

  const handleProximaQuestao = () => {
    if (questaoAtual < questoes.length - 1) {
      setQuestaoAtual(questaoAtual + 1)
      const proximaResposta = respostas[questaoAtual + 1]
      if (proximaResposta) {
        setRespostaSelecionada(proximaResposta.resposta)
        setRespostaConfirmada(true)
      } else {
        setRespostaSelecionada(null)
        setRespostaConfirmada(false)
      }
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

  if (!aula || questoes.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-2xl shadow-lg">
          <p className="text-gray-600 mb-4">Nenhuma questão disponível neste nível.</p>
          <Link 
            href={`/plataforma/enem/modulo/${moduloId}/aula/${aulaId}`}
            className="text-blue-600 hover:underline"
          >
            Voltar para a aula
          </Link>
        </div>
      </div>
    )
  }

  // Calcular resultados
  const totalRespondidas = Object.keys(respostas).length
  const acertos = Object.values(respostas).filter(r => r.correta).length
  const percentualAcertos = totalRespondidas > 0 ? (acertos / totalRespondidas) * 100 : 0
  const aprovado = totalRespondidas >= 7 && percentualAcertos >= 70

  // Modo Resultado
  if (modoResultado) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <header className="bg-white shadow-sm sticky top-0 z-10">
          <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
            <Link 
              href={`/plataforma/enem/modulo/${moduloId}/aula/${aulaId}`}
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
            <div className={`w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-r ${config.cor} flex items-center justify-center`}>
              <Trophy className="w-10 h-10 text-white" />
            </div>
            
            <h1 className="text-2xl font-bold text-gray-800 mb-2">
              {aprovado ? '🎉 Parabéns!' : 'Continue Praticando!'}
            </h1>
            <p className="text-gray-600 mb-2">{config.icone} {config.titulo}</p>
            <p className="text-gray-500 mb-6">{aula.titulo}</p>

            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-blue-50 rounded-xl p-4">
                <p className="text-3xl font-bold text-blue-600">{totalRespondidas}</p>
                <p className="text-sm text-gray-600">Respondidas</p>
              </div>
              <div className="bg-green-50 rounded-xl p-4">
                <p className="text-3xl font-bold text-green-600">{acertos}</p>
                <p className="text-sm text-gray-600">Acertos</p>
              </div>
              <div className={`rounded-xl p-4 ${aprovado ? 'bg-green-50' : 'bg-yellow-50'}`}>
                <p className={`text-3xl font-bold ${aprovado ? 'text-green-600' : 'text-yellow-600'}`}>
                  {percentualAcertos.toFixed(0)}%
                </p>
                <p className="text-sm text-gray-600">Aproveitamento</p>
              </div>
            </div>

            {aprovado ? (
              <div className="bg-green-100 text-green-700 p-4 rounded-xl mb-6">
                <CheckCircle className="w-6 h-6 inline mr-2" />
                Nível concluído! Próximo nível desbloqueado!
              </div>
            ) : (
              <div className="bg-yellow-100 text-yellow-700 p-4 rounded-xl mb-6">
                Você precisa de 70% de acertos em pelo menos 7 questões para desbloquear o próximo nível.
              </div>
            )}

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
                href={`/plataforma/enem/modulo/${moduloId}/aula/${aulaId}`}
                className={`flex items-center gap-2 px-6 py-3 bg-gradient-to-r ${config.cor} text-white rounded-xl hover:opacity-90 transition-colors`}
              >
                <Home className="w-5 h-5" />
                Voltar à Aula
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
  ].filter(alt => alt.texto)

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link 
            href={`/plataforma/enem/modulo/${moduloId}/aula/${aulaId}`}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Voltar</span>
          </Link>
          <div className="flex items-center gap-2">
            <span className="text-xl">{config.icone}</span>
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
            className={`h-full bg-gradient-to-r ${config.cor} transition-all duration-300`}
            style={{ width: `${((questaoAtual + 1) / questoes.length) * 100}%` }}
          />
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* Card da Questão */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-4">
          {/* Header da questão */}
          <div className={`bg-gradient-to-r ${config.cor} px-6 py-3 text-white`}>
            <div className="flex items-center justify-between">
              <span className="font-medium">{aula.titulo}</span>
              <span className="text-sm opacity-80">{config.titulo}</span>
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
                  ? `bg-gradient-to-r ${config.cor} text-white hover:opacity-90`
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              Confirmar
            </button>
          ) : (
            <button
              onClick={handleProximaQuestao}
              className={`flex items-center gap-2 px-8 py-3 bg-gradient-to-r ${config.cor} text-white rounded-xl font-semibold hover:opacity-90 transition-colors`}
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
                      ? `bg-gradient-to-r ${config.cor} text-white ring-2 ring-offset-2`
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
