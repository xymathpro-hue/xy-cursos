'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Clock, ChevronLeft, ChevronRight, Flag } from 'lucide-react'

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
}

interface Tentativa {
  id: string
  simulado_modulo_id: string
  iniciado_em: string
  total_questoes: number
}

interface SimuladoModulo {
  id: string
  modulo_id: string
  tempo_minutos: number
}

export default function ProvaSimuladoModulo() {
  const params = useParams()
  const router = useRouter()
  const moduloId = params.id as string
  
  const [questoes, setQuestoes] = useState<Questao[]>([])
  const [questaoAtual, setQuestaoAtual] = useState(0)
  const [respostas, setRespostas] = useState<Record<string, string>>({})
  const [tentativa, setTentativa] = useState<Tentativa | null>(null)
  const [simulado, setSimulado] = useState<SimuladoModulo | null>(null)
  const [tempoRestante, setTempoRestante] = useState(3600) // 60 min default
  const [loading, setLoading] = useState(true)
  const [finalizando, setFinalizando] = useState(false)
  
  const supabase = createClientComponentClient()

  // Finalizar simulado
  const finalizarSimulado = useCallback(async (forcarFim = false) => {
    if (finalizando || !tentativa || !simulado) return
    setFinalizando(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Calcular resultados
    let acertos = 0
    let erros = 0
    const questoesErradas: string[] = []

    for (const questao of questoes) {
      const respostaUsuario = respostas[questao.id]
      if (respostaUsuario === questao.resposta_correta) {
        acertos++
      } else {
        erros++
        if (respostaUsuario) {
          questoesErradas.push(questao.id)
        }
      }

      // Salvar resposta
      await supabase
        .from('respostas_simulado_modulo')
        .upsert({
          tentativa_id: tentativa.id,
          questao_id: questao.id,
          resposta_usuario: respostaUsuario || null,
          correta: respostaUsuario === questao.resposta_correta,
          ordem: questao.numero,
          respondida_em: respostaUsuario ? new Date().toISOString() : null
        }, {
          onConflict: 'tentativa_id,questao_id'
        })
    }

    const tempoInicio = new Date(tentativa.iniciado_em).getTime()
    const tempoGasto = Math.floor((Date.now() - tempoInicio) / 1000)
    const percentual = (acertos / questoes.length) * 100
    const aprovado = percentual >= 80

    // Atualizar tentativa
    await supabase
      .from('tentativas_simulado_modulo')
      .update({
        finalizado_em: new Date().toISOString(),
        tempo_gasto_segundos: tempoGasto,
        total_acertos: acertos,
        total_erros: erros,
        percentual_acertos: percentual,
        aprovado: aprovado,
        status: 'finalizado'
      })
      .eq('id', tentativa.id)

    // Salvar erros no caderno de erros
    for (const questaoId of questoesErradas) {
      const questao = questoes.find(q => q.id === questaoId)
      if (!questao) continue

      // Verificar se já existe no caderno
      const { data: existente } = await supabase
        .from('caderno_erros')
        .select('id')
        .eq('user_id', user.id)
        .eq('questao_id', questaoId)
        .single()

      if (!existente) {
        await supabase
          .from('caderno_erros')
          .insert({
            user_id: user.id,
            questao_id: questaoId,
            resposta_errada: respostas[questaoId],
            origem: `Simulado Módulo`,
            revisado: false
          })
      }
    }

    router.push(`/plataforma/enem/modulo/${moduloId}/simulado/resultado/${tentativa.id}`)
  }, [finalizando, tentativa, simulado, questoes, respostas, supabase, router, moduloId])

  useEffect(() => {
    async function fetchData() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      // Buscar simulado do módulo
      const { data: simuladoData } = await supabase
        .from('simulados_modulo')
        .select('*')
        .eq('modulo_id', moduloId)
        .single()

      if (!simuladoData) {
        router.push(`/plataforma/enem/modulo/${moduloId}`)
        return
      }
      setSimulado(simuladoData)

      // Buscar tentativa em andamento
      const { data: tentativaData } = await supabase
        .from('tentativas_simulado_modulo')
        .select('*')
        .eq('user_id', user.id)
        .eq('simulado_modulo_id', simuladoData.id)
        .eq('status', 'em_andamento')
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (!tentativaData) {
        router.push(`/plataforma/enem/modulo/${moduloId}/simulado`)
        return
      }
      setTentativa(tentativaData)

      // Calcular tempo restante
      const tempoInicio = new Date(tentativaData.iniciado_em).getTime()
      const tempoLimite = simuladoData.tempo_minutos * 60 * 1000
      const tempoPassado = Date.now() - tempoInicio
      const tempoRestanteCalc = Math.max(0, Math.floor((tempoLimite - tempoPassado) / 1000))
      setTempoRestante(tempoRestanteCalc)

      // Buscar questões do módulo (fase correspondente)
      const { data: faseData } = await supabase
        .from('fases')
        .select('id')
        .eq('modulo_id', moduloId)
        .limit(1)
        .single()

      if (faseData) {
        const { data: questoesData } = await supabase
          .from('questoes')
          .select('*')
          .eq('fase_id', faseData.id)
          .eq('ativo', true)
          .limit(simuladoData.total_questoes)

        if (questoesData && questoesData.length > 0) {
          // Embaralhar e numerar
          const embaralhadas = questoesData
            .sort(() => Math.random() - 0.5)
            .slice(0, simuladoData.total_questoes)
            .map((q, i) => ({ ...q, numero: i + 1 }))
          setQuestoes(embaralhadas)
        }
      }

      // Buscar respostas já salvas
      const { data: respostasData } = await supabase
        .from('respostas_simulado_modulo')
        .select('questao_id, resposta_usuario')
        .eq('tentativa_id', tentativaData.id)

      if (respostasData) {
        const respostasMap: Record<string, string> = {}
        respostasData.forEach(r => {
          if (r.resposta_usuario) {
            respostasMap[r.questao_id] = r.resposta_usuario
          }
        })
        setRespostas(respostasMap)
      }

      setLoading(false)
    }

    fetchData()
  }, [moduloId, router, supabase])

  // Cronômetro
  useEffect(() => {
    if (loading || tempoRestante <= 0) return

    const timer = setInterval(() => {
      setTempoRestante(prev => {
        if (prev <= 1) {
          clearInterval(timer)
          finalizarSimulado(true)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [loading, tempoRestante, finalizarSimulado])

  // Auto-save respostas
  useEffect(() => {
    if (!tentativa || Object.keys(respostas).length === 0) return

    const saveTimeout = setTimeout(async () => {
      for (const [questaoId, resposta] of Object.entries(respostas)) {
        await supabase
          .from('respostas_simulado_modulo')
          .upsert({
            tentativa_id: tentativa.id,
            questao_id: questaoId,
            resposta_usuario: resposta,
            respondida_em: new Date().toISOString()
          }, {
            onConflict: 'tentativa_id,questao_id'
          })
      }
    }, 1000)

    return () => clearTimeout(saveTimeout)
  }, [respostas, tentativa, supabase])

  const formatarTempo = (segundos: number) => {
    const min = Math.floor(segundos / 60)
    const seg = segundos % 60
    return `${min.toString().padStart(2, '0')}:${seg.toString().padStart(2, '0')}`
  }

  const selecionarResposta = (questaoId: string, alternativa: string) => {
    setRespostas(prev => ({ ...prev, [questaoId]: alternativa }))
  }

  const questaoAtualData = questoes[questaoAtual]
  const respondidas = Object.keys(respostas).length
  const tempoUrgente = tempoRestante < 300 // menos de 5 min

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando questões...</p>
        </div>
      </div>
    )
  }

  if (!questaoAtualData) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Nenhuma questão encontrada.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Header fixo */}
      <header className={`sticky top-0 z-20 shadow-md ${tempoUrgente ? 'bg-red-600' : 'bg-gradient-to-r from-purple-600 to-indigo-600'} text-white`}>
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="font-medium">Simulado do Módulo</span>
              <span className="bg-white/20 px-3 py-1 rounded-full text-sm">
                {respondidas}/{questoes.length} respondidas
              </span>
            </div>
            
            <div className={`flex items-center gap-2 ${tempoUrgente ? 'animate-pulse' : ''}`}>
              <Clock className="w-5 h-5" />
              <span className="font-mono text-xl font-bold">{formatarTempo(tempoRestante)}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Navegação rápida */}
      <div className="bg-white border-b shadow-sm sticky top-14 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex gap-2 overflow-x-auto pb-2">
            {questoes.map((q, idx) => (
              <button
                key={q.id}
                onClick={() => setQuestaoAtual(idx)}
                className={`w-10 h-10 rounded-lg font-medium text-sm shrink-0 transition-all ${
                  idx === questaoAtual
                    ? 'bg-purple-600 text-white'
                    : respostas[q.id]
                    ? 'bg-green-100 text-green-700 border-2 border-green-300'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {q.numero}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Questão */}
      <main className="flex-1 max-w-4xl mx-auto px-4 py-6 w-full">
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm font-medium">
              Questão {questaoAtualData.numero} de {questoes.length}
            </span>
          </div>

          <div className="prose max-w-none mb-6">
            <p className="text-gray-800 text-lg leading-relaxed whitespace-pre-wrap">
              {questaoAtualData.enunciado}
            </p>
          </div>

          <div className="space-y-3">
            {['A', 'B', 'C', 'D', 'E'].map((letra) => {
              const alternativa = questaoAtualData[`alternativa_${letra.toLowerCase()}` as keyof Questao] as string
              if (!alternativa) return null
              
              const selecionada = respostas[questaoAtualData.id] === letra

              return (
                <button
                  key={letra}
                  onClick={() => selecionarResposta(questaoAtualData.id, letra)}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                    selecionada
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-200 hover:border-purple-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold shrink-0 ${
                      selecionada
                        ? 'bg-purple-500 text-white'
                        : 'bg-gray-200 text-gray-600'
                    }`}>
                      {letra}
                    </span>
                    <span className="text-gray-700 pt-1">{alternativa}</span>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Navegação */}
        <div className="flex items-center justify-between gap-4">
          <button
            onClick={() => setQuestaoAtual(prev => Math.max(0, prev - 1))}
            disabled={questaoAtual === 0}
            className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
            Anterior
          </button>

          {questaoAtual === questoes.length - 1 ? (
            <button
              onClick={() => finalizarSimulado()}
              disabled={finalizando}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white font-bold rounded-lg hover:from-green-600 hover:to-green-700 transition-all disabled:opacity-50"
            >
              <Flag className="w-5 h-5" />
              {finalizando ? 'Finalizando...' : 'Finalizar Simulado'}
            </button>
          ) : (
            <button
              onClick={() => setQuestaoAtual(prev => Math.min(questoes.length - 1, prev + 1))}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              Próxima
              <ChevronRight className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Botão finalizar sempre visível */}
        {questaoAtual !== questoes.length - 1 && (
          <div className="mt-6 text-center">
            <button
              onClick={() => finalizarSimulado()}
              disabled={finalizando}
              className="text-gray-500 hover:text-red-600 underline text-sm"
            >
              Finalizar simulado antecipadamente
            </button>
          </div>
        )}
      </main>
    </div>
  )
}
