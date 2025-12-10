'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { 
  ArrowLeft, 
  BookOpen, 
  CheckCircle, 
  Lock, 
  Play, 
  Clock,
  Trophy
} from 'lucide-react'

interface Modulo {
  id: string
  numero: number
  titulo: string
  descricao: string
}

interface Aula {
  id: string
  numero: number
  titulo: string
  descricao: string
  duracao_minutos: number
  ordem: number
}

interface SimuladoModulo {
  id: string
  titulo: string
  total_questoes: number
  tempo_minutos: number
  percentual_liberacao: number
  percentual_aprovacao: number
}

interface ProgressoAula {
  aula_id: string
  concluida: boolean
}

interface UltimaTentativa {
  id: string
  percentual_acertos: number
  aprovado: boolean
  created_at: string
}

export default function ModuloPage() {
  const params = useParams()
  const router = useRouter()
  const moduloId = params.id as string
  
  const [modulo, setModulo] = useState<Modulo | null>(null)
  const [aulas, setAulas] = useState<Aula[]>([])
  const [simulado, setSimulado] = useState<SimuladoModulo | null>(null)
  const [progresso, setProgresso] = useState<Record<string, boolean>>({})
  const [ultimaTentativa, setUltimaTentativa] = useState<UltimaTentativa | null>(null)
  const [loading, setLoading] = useState(true)
  
  const supabase = createClientComponentClient()

  useEffect(() => {
    async function fetchData() {
      const { data: { user } } = await supabase.auth.getUser()

      // Buscar módulo
      const { data: moduloData } = await supabase
        .from('modulos')
        .select('*')
        .eq('id', moduloId)
        .single()

      if (!moduloData) {
        router.push('/plataforma/enem')
        return
      }
      setModulo(moduloData)

      // Buscar aulas do módulo
      const { data: aulasData } = await supabase
        .from('aulas')
        .select('*')
        .eq('modulo_id', moduloId)
        .eq('ativo', true)
        .order('numero', { ascending: true })

      setAulas(aulasData || [])

      // Buscar simulado do módulo
      const { data: simuladoData } = await supabase
        .from('simulados_modulo')
        .select('*')
        .eq('modulo_id', moduloId)
        .single()

      if (simuladoData) {
        setSimulado(simuladoData)
      }

      // Buscar progresso do usuário nas aulas
      if (user && aulasData) {
        const { data: progressoData } = await supabase
          .from('progresso_aulas')
          .select('aula_id, concluida')
          .eq('user_id', user.id)
          .in('aula_id', aulasData.map(a => a.id))

        if (progressoData) {
          const progressoMap: Record<string, boolean> = {}
          progressoData.forEach(p => {
            progressoMap[p.aula_id] = p.concluida
          })
          setProgresso(progressoMap)
        }

        // Buscar última tentativa do simulado
        if (simuladoData) {
          const { data: tentativaData } = await supabase
            .from('tentativas_simulado_modulo')
            .select('*')
            .eq('user_id', user.id)
            .eq('simulado_modulo_id', simuladoData.id)
            .eq('status', 'finalizado')
            .order('created_at', { ascending: false })
            .limit(1)
            .single()

          if (tentativaData) {
            setUltimaTentativa(tentativaData)
          }
        }
      }

      setLoading(false)
    }

    fetchData()
  }, [moduloId, router, supabase])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!modulo) {
    return null
  }

  const aulasConcluidas = Object.values(progresso).filter(Boolean).length
  const totalAulas = aulas.length
  const percentualConcluido = totalAulas > 0 ? (aulasConcluidas / totalAulas) * 100 : 0
  const simuladoLiberado = percentualConcluido >= (simulado?.percentual_liberacao || 80)

  const ICONES_MODULOS: Record<number, string> = {
    1: '🔢', 2: '📈', 3: '🎲', 4: '📊', 5: '📦',
    6: '📐', 7: '💰', 8: '🧠', 9: '📏', 10: '🔗',
  }

  const CORES_MODULOS: Record<number, string> = {
    1: 'from-blue-500 to-blue-600',
    2: 'from-purple-500 to-purple-600',
    3: 'from-pink-500 to-pink-600',
    4: 'from-green-500 to-green-600',
    5: 'from-orange-500 to-orange-600',
    6: 'from-teal-500 to-teal-600',
    7: 'from-yellow-500 to-yellow-600',
    8: 'from-red-500 to-red-600',
    9: 'from-indigo-500 to-indigo-600',
    10: 'from-cyan-500 to-cyan-600',
  }

  const icone = ICONES_MODULOS[modulo.numero] || '📚'
  const cor = CORES_MODULOS[modulo.numero] || 'from-gray-500 to-gray-600'

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/plataforma/enem" className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
            <ArrowLeft className="w-5 h-5" />
            <span>Voltar</span>
          </Link>
          <div className="flex items-center gap-2">
            <span className="text-2xl">{icone}</span>
            <span className="font-bold text-gray-800">Módulo {modulo.numero}</span>
          </div>
          <div className="w-20"></div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Banner do Módulo */}
        <div className={`bg-gradient-to-r ${cor} rounded-2xl p-8 mb-8 text-white`}>
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center text-4xl">
              {icone}
            </div>
            <div>
              <p className="text-white/80 text-sm">Módulo {modulo.numero}</p>
              <h1 className="text-2xl font-bold">{modulo.titulo}</h1>
            </div>
          </div>
          <p className="text-white/80 mb-6">{modulo.descricao}</p>
          
          {/* Progresso */}
          <div className="bg-white/10 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm">Progresso do Módulo</span>
              <span className="font-bold">{percentualConcluido.toFixed(0)}%</span>
            </div>
            <div className="h-3 bg-white/20 rounded-full overflow-hidden">
              <div 
                className="h-full bg-white rounded-full transition-all duration-500"
                style={{ width: `${percentualConcluido}%` }}
              />
            </div>
            <p className="text-sm text-white/80 mt-2">
              {aulasConcluidas} de {totalAulas} aulas concluídas
            </p>
          </div>
        </div>

        {/* Card Simulado Final */}
        {simulado && (
          <div className={`rounded-2xl p-6 mb-8 ${
            simuladoLiberado 
              ? 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white cursor-pointer hover:from-purple-600 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl'
              : 'bg-gray-100 border-2 border-dashed border-gray-300'
          }`}>
            {simuladoLiberado ? (
              <Link href={`/plataforma/enem/modulo/${moduloId}/simulado`} className="block">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
                      <Trophy className="w-7 h-7" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold">🏆 Simulado Final</h2>
                      <p className="text-purple-100">
                        {simulado.total_questoes} questões • {simulado.tempo_minutos} min • {simulado.percentual_aprovacao}% para aprovar
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {ultimaTentativa && (
                      <div className={`text-right px-3 py-1 rounded-lg ${
                        ultimaTentativa.aprovado ? 'bg-green-400/30' : 'bg-red-400/30'
                      }`}>
                        <p className="text-sm font-medium">
                          {ultimaTentativa.aprovado ? '✅ Aprovado' : '❌ Não aprovado'}
                        </p>
                        <p className="text-xs text-white/80">
                          {Number(ultimaTentativa.percentual_acertos).toFixed(0)}%
                        </p>
                      </div>
                    )}
                    <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                      <Play className="w-6 h-6" />
                    </div>
                  </div>
                </div>
              </Link>
            ) : (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-gray-200 rounded-xl flex items-center justify-center">
                    <Lock className="w-7 h-7 text-gray-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-400">🔒 Simulado Final</h2>
                    <p className="text-gray-500">
                      Complete {simulado.percentual_liberacao}% das aulas para liberar
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-gray-400">{percentualConcluido.toFixed(0)}%</p>
                  <p className="text-sm text-gray-500">de {simulado.percentual_liberacao}%</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Lista de Aulas */}
        <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <BookOpen className="w-5 h-5" />
          Aulas do Módulo
        </h2>

        <div className="space-y-3 mb-8">
          {aulas.map((aula) => {
            const concluida = progresso[aula.id]
            
            return (
              <Link
                key={aula.id}
                href={`/plataforma/enem/modulo/${moduloId}/aula/${aula.id}`}
                className="block bg-white rounded-xl shadow-sm hover:shadow-md transition-all overflow-hidden border border-gray-100"
              >
                <div className="flex items-center p-4">
                  {/* Número/Status */}
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 mr-4 ${
                    concluida 
                      ? 'bg-green-100 text-green-600' 
                      : 'bg-gray-100 text-gray-500'
                  }`}>
                    {concluida ? (
                      <CheckCircle className="w-6 h-6" />
                    ) : (
                      <span className="font-bold">{aula.numero}</span>
                    )}
                  </div>
                  
                  {/* Conteúdo */}
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-800">{aula.titulo}</h3>
                    <p className="text-sm text-gray-500 line-clamp-1">{aula.descricao}</p>
                  </div>
                  
                  {/* Duração */}
                  <div className="flex items-center gap-1 text-gray-400 text-sm mr-4">
                    <Clock className="w-4 h-4" />
                    <span>{aula.duracao_minutos} min</span>
                  </div>
                  
                  {/* Botão */}
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    concluida 
                      ? 'bg-green-100 text-green-600' 
                      : 'bg-blue-100 text-blue-600'
                  }`}>
                    {concluida ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : (
                      <Play className="w-5 h-5" />
                    )}
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </main>
    </div>
  )
}
