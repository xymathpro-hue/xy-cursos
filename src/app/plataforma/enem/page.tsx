'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { ArrowLeft, BookOpen, CheckCircle, Lock, Play, Trophy } from 'lucide-react'

interface Modulo {
  id: string
  numero: number
  titulo: string
  descricao: string
  icone: string
  total_fases: number
}

interface Fase {
  id: string
  modulo_id: string
  total_questoes: number
}

const ICONES_MODULOS: Record<number, string> = {
  1: '🔢', // Aritmética
  2: '📈', // Funções
  3: '🎲', // Combinatória
  4: '📊', // Estatística
  5: '📦', // Geometria Espacial
  6: '📐', // Geometria Plana
  7: '💰', // Mat. Financeira
  8: '🧠', // Raciocínio Lógico
  9: '📏', // Trigonometria
  10: '🔗', // Integração
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

export default function PlataformaEnem() {
  const [modulos, setModulos] = useState<Modulo[]>([])
  const [fases, setFases] = useState<Record<string, Fase>>({})
  const [loading, setLoading] = useState(true)
  const supabase = createClientComponentClient()

  useEffect(() => {
    async function fetchData() {
      // Buscar módulos do ENEM
      const { data: modulosData, error: modulosError } = await supabase
        .from('modulos')
        .select('*')
        .eq('plataforma', 'enem')
        .eq('ativo', true)
        .order('numero', { ascending: true })

      if (modulosError) {
        console.error('Erro ao buscar módulos:', modulosError)
        return
      }

      setModulos(modulosData || [])

      // Buscar fases para contar questões
      if (modulosData && modulosData.length > 0) {
        const moduloIds = modulosData.map(m => m.id)
        const { data: fasesData } = await supabase
          .from('fases')
          .select('*')
          .in('modulo_id', moduloIds)

        if (fasesData) {
          const fasesMap: Record<string, Fase> = {}
          fasesData.forEach(f => {
            fasesMap[f.modulo_id] = f
          })
          setFases(fasesMap)
        }
      }

      setLoading(false)
    }

    fetchData()
  }, [supabase])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const totalQuestoes = Object.values(fases).reduce((acc, f) => acc + (f.total_questoes || 0), 0)

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
            <ArrowLeft className="w-5 h-5" />
            <span>Voltar</span>
          </Link>
          <div className="flex items-center gap-2">
            <span className="text-2xl">🎯</span>
            <span className="font-bold text-xl text-blue-600">XY Matemática ENEM</span>
          </div>
          <div className="w-20"></div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Banner */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-8 mb-8 text-white">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center text-3xl">
              🎯
            </div>
            <div>
              <h1 className="text-3xl font-bold">Matemática ENEM</h1>
              <p className="text-blue-100">Domine os 10 módulos e conquiste sua vaga!</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4 mt-6">
            <div className="bg-white/10 rounded-xl p-4 text-center">
              <p className="text-3xl font-bold">{modulos.length}</p>
              <p className="text-sm text-blue-100">Módulos</p>
            </div>
            <div className="bg-white/10 rounded-xl p-4 text-center">
              <p className="text-3xl font-bold">{totalQuestoes.toLocaleString()}</p>
              <p className="text-sm text-blue-100">Questões</p>
            </div>
            <div className="bg-white/10 rounded-xl p-4 text-center">
              <p className="text-3xl font-bold">750+</p>
              <p className="text-sm text-blue-100">Meta TRI</p>
            </div>
          </div>
        </div>

        {/* Card Simulados ENEM */}
        <Link 
          href="/plataforma/enem/simulados"
          className="block bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl p-6 mb-8 text-white hover:from-orange-600 hover:to-red-600 transition-all shadow-lg hover:shadow-xl"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center text-3xl">
                🎯
              </div>
              <div>
                <h2 className="text-2xl font-bold">Simulados ENEM</h2>
                <p className="text-orange-100">6 simulados completos com correção TRI</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-2xl font-bold">275</p>
                <p className="text-sm text-orange-100">questões</p>
              </div>
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <Play className="w-6 h-6" />
              </div>
            </div>
          </div>
        </Link>

        {/* Módulos */}
        <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
          <BookOpen className="w-6 h-6" />
          Módulos de Estudo
        </h2>

        <div className="grid md:grid-cols-2 gap-4">
          {modulos.map((modulo) => {
            const fase = fases[modulo.id]
            const questoes = fase?.total_questoes || 0
            const icone = ICONES_MODULOS[modulo.numero] || '📚'
            const cor = CORES_MODULOS[modulo.numero] || 'from-gray-500 to-gray-600'

            return (
              <Link
                key={modulo.id}
                href={`/plataforma/enem/modulo/${modulo.id}`}
                className="group bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden border border-gray-100"
              >
                <div className="flex">
                  {/* Ícone colorido */}
                  <div className={`w-24 bg-gradient-to-br ${cor} flex items-center justify-center text-4xl`}>
                    {icone}
                  </div>
                  
                  {/* Conteúdo */}
                  <div className="flex-1 p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-gray-400 uppercase">
                        Módulo {modulo.numero}
                      </span>
                      <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-full">
                        {questoes} questões
                      </span>
                    </div>
                    <h3 className="font-bold text-gray-800 group-hover:text-blue-600 transition-colors">
                      {modulo.titulo}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1 line-clamp-1">
                      {modulo.descricao}
                    </p>
                    
                    {/* Barra de progresso (placeholder) */}
                    <div className="mt-3">
                      <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
                        <span>Progresso</span>
                        <span>0%</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-green-400 to-green-500 w-0"></div>
                      </div>
                    </div>
                  </div>

                  {/* Botão */}
                  <div className="flex items-center px-4">
                    <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
                      <Play className="w-5 h-5" />
                    </div>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>

        {/* Legenda de níveis */}
        <div className="mt-8 bg-white rounded-xl p-6 shadow-sm">
          <h3 className="font-bold text-gray-800 mb-4">Níveis de Dificuldade</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 rounded-full bg-green-500"></div>
              <div>
                <p className="font-medium text-gray-700">Fácil</p>
                <p className="text-xs text-gray-400">~420 pontos TRI</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 rounded-full bg-yellow-500"></div>
              <div>
                <p className="font-medium text-gray-700">Médio</p>
                <p className="text-xs text-gray-400">~620 pontos TRI</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 rounded-full bg-red-500"></div>
              <div>
                <p className="font-medium text-gray-700">Difícil</p>
                <p className="text-xs text-gray-400">~750 pontos TRI</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
