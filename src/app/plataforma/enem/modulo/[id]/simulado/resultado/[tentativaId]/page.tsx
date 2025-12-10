'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { ArrowLeft, CheckCircle, XCircle, Clock, Target, BookOpen, AlertTriangle, Trophy, RefreshCw } from 'lucide-react'

interface Tentativa {
  id: string
  simulado_modulo_id: string
  iniciado_em: string
  finalizado_em: string
  tempo_gasto_segundos: number
  total_questoes: number
  total_acertos: number
  total_erros: number
  percentual_acertos: number
  aprovado: boolean
  status: string
}

interface Modulo {
  id: string
  numero: number
  titulo: string
}

interface SimuladoModulo {
  id: string
  titulo: string
  percentual_aprovacao: number
}

export default function ResultadoSimuladoModulo() {
  const params = useParams()
  const router = useRouter()
  const moduloId = params.id as string
  const tentativaId = params.tentativaId as string
  
  const [tentativa, setTentativa] = useState<Tentativa | null>(null)
  const [modulo, setModulo] = useState<Modulo | null>(null)
  const [simulado, setSimulado] = useState<SimuladoModulo | null>(null)
  const [loading, setLoading] = useState(true)
  const [totalErrosCaderno, setTotalErrosCaderno] = useState(0)
  
  const supabase = createClientComponentClient()

  useEffect(() => {
    async function fetchData() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      // Buscar tentativa
      const { data: tentativaData } = await supabase
        .from('tentativas_simulado_modulo')
        .select('*')
        .eq('id', tentativaId)
        .eq('user_id', user.id)
        .single()

      if (!tentativaData) {
        router.push(`/plataforma/enem/modulo/${moduloId}`)
        return
      }
      setTentativa(tentativaData)

      // Buscar módulo
      const { data: moduloData } = await supabase
        .from('modulos')
        .select('*')
        .eq('id', moduloId)
        .single()

      if (moduloData) {
        setModulo(moduloData)
      }

      // Buscar simulado
      const { data: simuladoData } = await supabase
        .from('simulados_modulo')
        .select('*')
        .eq('id', tentativaData.simulado_modulo_id)
        .single()

      if (simuladoData) {
        setSimulado(simuladoData)
      }

      // Contar erros no caderno de erros
      const { count } = await supabase
        .from('caderno_erros')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('revisado', false)

      setTotalErrosCaderno(count || 0)

      setLoading(false)
    }

    fetchData()
  }, [tentativaId, moduloId, router, supabase])

  const formatarTempo = (segundos: number) => {
    const min = Math.floor(segundos / 60)
    const seg = segundos % 60
    return `${min}min ${seg}s`
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!tentativa) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <p>Tentativa não encontrada.</p>
      </div>
    )
  }

  const aprovado = tentativa.aprovado
  const percentual = Number(tentativa.percentual_acertos).toFixed(0)

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href={`/plataforma/enem/modulo/${moduloId}`} className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
            <ArrowLeft className="w-5 h-5" />
            <span>Voltar ao Módulo</span>
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Resultado Principal */}
        <div className={`rounded-2xl p-8 mb-8 text-white ${
          aprovado 
            ? 'bg-gradient-to-r from-green-500 to-emerald-600' 
            : 'bg-gradient-to-r from-red-500 to-rose-600'
        }`}>
          <div className="text-center">
            <div className="w-24 h-24 mx-auto mb-4 bg-white/20 rounded-full flex items-center justify-center">
              {aprovado ? (
                <Trophy className="w-12 h-12" />
              ) : (
                <RefreshCw className="w-12 h-12" />
              )}
            </div>
            
            <h1 className="text-3xl font-bold mb-2">
              {aprovado ? '🎉 PARABÉNS! APROVADO!' : '😔 NÃO FOI DESSA VEZ...'}
            </h1>
            
            <p className="text-white/80 mb-6">
              {aprovado 
                ? `Você dominou o módulo ${modulo?.titulo}!`
                : 'Continue estudando e tente novamente amanhã!'
              }
            </p>

            <div className="text-6xl font-bold mb-2">{percentual}%</div>
            <p className="text-white/80">de aproveitamento</p>
          </div>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl p-4 text-center shadow-sm">
            <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-800">{tentativa.total_acertos}</p>
            <p className="text-sm text-gray-500">Acertos</p>
          </div>
          
          <div className="bg-white rounded-xl p-4 text-center shadow-sm">
            <XCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-800">{tentativa.total_erros}</p>
            <p className="text-sm text-gray-500">Erros</p>
          </div>
          
          <div className="bg-white rounded-xl p-4 text-center shadow-sm">
            <Target className="w-8 h-8 text-blue-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-800">{tentativa.total_questoes}</p>
            <p className="text-sm text-gray-500">Questões</p>
          </div>
          
          <div className="bg-white rounded-xl p-4 text-center shadow-sm">
            <Clock className="w-8 h-8 text-purple-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-800">{formatarTempo(tentativa.tempo_gasto_segundos || 0)}</p>
            <p className="text-sm text-gray-500">Tempo</p>
          </div>
        </div>

        {/* Barra de progresso */}
        <div className="bg-white rounded-xl p-6 mb-8 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="font-medium text-gray-700">Seu resultado</span>
            <span className="font-bold text-gray-800">{percentual}%</span>
          </div>
          <div className="h-4 bg-gray-200 rounded-full overflow-hidden mb-4">
            <div 
              className={`h-full transition-all duration-1000 ${aprovado ? 'bg-green-500' : 'bg-red-500'}`}
              style={{ width: `${percentual}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">0%</span>
            <span className={`font-medium ${aprovado ? 'text-green-600' : 'text-red-600'}`}>
              Meta: {simulado?.percentual_aprovacao || 80}%
            </span>
            <span className="text-gray-500">100%</span>
          </div>
        </div>

        {/* Caderno de Erros - DESTAQUE */}
        {tentativa.total_erros > 0 && (
          <div className="bg-yellow-50 border-2 border-yellow-300 rounded-xl p-6 mb-8">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-yellow-200 rounded-xl flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6 text-yellow-700" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-yellow-800 text-lg mb-2">
                  📓 Revise seus erros no Caderno de Erros!
                </h3>
                <p className="text-yellow-700 mb-4">
                  Você errou <strong>{tentativa.total_erros} questões</strong> neste simulado. 
                  Elas foram salvas automaticamente no seu Caderno de Erros. 
                  Revisar seus erros é a melhor forma de aprender!
                </p>
                <Link
                  href="/plataforma/enem/caderno-erros"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white font-medium rounded-lg transition-colors"
                >
                  <BookOpen className="w-5 h-5" />
                  Abrir Caderno de Erros ({totalErrosCaderno} questões)
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Instruções */}
        <div className="bg-white rounded-xl p-6 mb-8 shadow-sm">
          <h3 className="font-bold text-gray-800 text-lg mb-4 flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            {aprovado ? 'Próximos Passos' : 'Como melhorar?'}
          </h3>
          
          {aprovado ? (
            <div className="space-y-3 text-gray-600">
              <div className="flex items-start gap-3">
                <span className="text-green-500">✓</span>
                <p>Você completou o módulo <strong>{modulo?.titulo}</strong> com sucesso!</p>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-green-500">✓</span>
                <p>Continue para o próximo módulo e mantenha o ritmo de estudos.</p>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-green-500">✓</span>
                <p>Mesmo aprovado, revise as questões que errou para fixar o conteúdo.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-3 text-gray-600">
              <div className="flex items-start gap-3">
                <span className="text-blue-500">1.</span>
                <p><strong>Revise o Caderno de Erros:</strong> Analise cada questão que errou e entenda o porquê.</p>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-blue-500">2.</span>
                <p><strong>Estude a teoria:</strong> Volte às aulas do módulo e revise os conceitos.</p>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-blue-500">3.</span>
                <p><strong>Pratique mais:</strong> Faça exercícios das fases para fixar o conteúdo.</p>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-blue-500">4.</span>
                <p><strong>Tente novamente:</strong> Você pode fazer uma nova tentativa amanhã!</p>
              </div>
            </div>
          )}
        </div>

        {/* Botões de ação */}
        <div className="grid md:grid-cols-2 gap-4">
          <Link
            href={`/plataforma/enem/modulo/${moduloId}`}
            className="flex items-center justify-center gap-2 py-4 bg-white border-2 border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Voltar ao Módulo
          </Link>
          
          {tentativa.total_erros > 0 ? (
            <Link
              href="/plataforma/enem/caderno-erros"
              className="flex items-center justify-center gap-2 py-4 bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-bold rounded-xl hover:from-yellow-600 hover:to-orange-600 transition-all"
            >
              <BookOpen className="w-5 h-5" />
              Revisar Erros
            </Link>
          ) : (
            <Link
              href="/plataforma/enem"
              className="flex items-center justify-center gap-2 py-4 bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-bold rounded-xl hover:from-blue-600 hover:to-indigo-600 transition-all"
            >
              <Target className="w-5 h-5" />
              Ver Outros Módulos
            </Link>
          )}
        </div>
      </main>
    </div>
  )
}
