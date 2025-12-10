'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { ArrowLeft, BookOpen, Trophy, Lock, CheckCircle, Star, Lightbulb, Calculator, FileText, Clock } from 'lucide-react'

interface Aula {
  id: string
  numero: number
  titulo: string
  descricao: string
  conteudo_teoria: string
  formulas: string
  dicas: string
  exercicios_resolvidos: string
  imagem_url: string
  imagem_descricao: string
  duracao_minutos: number
  ordem: number
}

interface Modulo {
  id: string
  numero: number
  titulo: string
}

export default function AulaPage() {
  const params = useParams()
  const router = useRouter()
  const supabase = createClientComponentClient()

  const moduloId = params.id as string
  const aulaId = params.aulaId as string

  const [loading, setLoading] = useState(true)
  const [aula, setAula] = useState<Aula | null>(null)
  const [modulo, setModulo] = useState<Modulo | null>(null)
  const [tab, setTab] = useState<'teoria' | 'formulas' | 'dicas' | 'exercicios'>('teoria')
  const [concluida, setConcluida] = useState(false)

  useEffect(() => {
    async function fetchData() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      // Buscar módulo
      const { data: moduloData } = await supabase
        .from('modulos')
        .select('*')
        .eq('id', moduloId)
        .single()

      if (moduloData) {
        setModulo(moduloData)
      }

      // Buscar aula
      const { data: aulaData } = await supabase
        .from('aulas')
        .select('*')
        .eq('id', aulaId)
        .single()

      if (aulaData) {
        setAula(aulaData)
      }

      // Verificar se já concluiu
      const { data: progressoData } = await supabase
        .from('progresso_aulas')
        .select('concluida')
        .eq('user_id', user.id)
        .eq('aula_id', aulaId)
        .single()

      if (progressoData) {
        setConcluida(progressoData.concluida)
      }

      setLoading(false)
    }

    fetchData()
  }, [supabase, router, aulaId, moduloId])

  const marcarConcluida = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase
      .from('progresso_aulas')
      .upsert({
        user_id: user.id,
        aula_id: aulaId,
        concluida: true,
        concluida_em: new Date().toISOString()
      }, {
        onConflict: 'user_id,aula_id'
      })

    if (!error) {
      setConcluida(true)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
      </div>
    )
  }

  if (!aula) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p>Aula não encontrada.</p>
      </div>
    )
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

  const cor = CORES_MODULOS[modulo?.numero || 1] || 'from-blue-500 to-blue-600'

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className={`bg-gradient-to-r ${cor} text-white sticky top-0 z-10`}>
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <Link href={`/plataforma/enem/modulo/${moduloId}`} className="p-2 hover:bg-white/20 rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex-1">
              <p className="text-sm text-white/80">Módulo {modulo?.numero} • Aula {aula.numero}</p>
              <h1 className="text-lg font-bold">{aula.titulo}</h1>
            </div>
            <div className="flex items-center gap-2 text-white/80">
              <Clock className="w-4 h-4" />
              <span className="text-sm">{aula.duracao_minutos} min</span>
            </div>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200 sticky top-16 z-10">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex gap-1 overflow-x-auto">
            <button
              onClick={() => setTab('teoria')}
              className={`py-3 px-4 font-medium border-b-2 transition-all whitespace-nowrap ${
                tab === 'teoria'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <BookOpen className="w-4 h-4 inline mr-2" />
              Teoria
            </button>
            <button
              onClick={() => setTab('formulas')}
              className={`py-3 px-4 font-medium border-b-2 transition-all whitespace-nowrap ${
                tab === 'formulas'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Calculator className="w-4 h-4 inline mr-2" />
              Fórmulas
            </button>
            <button
              onClick={() => setTab('dicas')}
              className={`py-3 px-4 font-medium border-b-2 transition-all whitespace-nowrap ${
                tab === 'dicas'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Lightbulb className="w-4 h-4 inline mr-2" />
              Dicas
            </button>
            <button
              onClick={() => setTab('exercicios')}
              className={`py-3 px-4 font-medium border-b-2 transition-all whitespace-nowrap ${
                tab === 'exercicios'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <FileText className="w-4 h-4 inline mr-2" />
              Exercícios
            </button>
          </div>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* Imagem da aula */}
        {aula.imagem_url && tab === 'teoria' && (
          <div className="mb-6 bg-white rounded-xl p-4 border border-gray-100">
            <img 
              src={aula.imagem_url} 
              alt={aula.imagem_descricao || aula.titulo}
              className="max-w-full h-auto mx-auto rounded-lg max-h-64 object-contain"
            />
            {aula.imagem_descricao && (
              <p className="text-sm text-gray-500 text-center mt-2">{aula.imagem_descricao}</p>
            )}
          </div>
        )}

        {/* Conteúdo */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 mb-6">
          {tab === 'teoria' && (
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <BookOpen className="w-6 h-6 text-blue-500" />
                {aula.titulo}
              </h2>
              <div className="prose max-w-none">
                <pre className="whitespace-pre-wrap font-sans text-gray-700 leading-relaxed bg-transparent p-0 m-0 overflow-visible">
                  {aula.conteudo_teoria || 'Conteúdo em breve...'}
                </pre>
              </div>
            </div>
          )}

          {tab === 'formulas' && (
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Calculator className="w-6 h-6 text-purple-500" />
                Fórmulas
              </h2>
              <div className="prose max-w-none">
                <pre className="whitespace-pre-wrap font-sans text-gray-700 leading-relaxed bg-gray-50 p-4 rounded-xl">
                  {aula.formulas || 'Fórmulas em breve...'}
                </pre>
              </div>
            </div>
          )}

          {tab === 'dicas' && (
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Lightbulb className="w-6 h-6 text-yellow-500" />
                Dicas e Macetes
              </h2>
              <div className="prose max-w-none">
                <pre className="whitespace-pre-wrap font-sans text-gray-700 leading-relaxed bg-yellow-50 p-4 rounded-xl">
                  {aula.dicas || 'Dicas em breve...'}
                </pre>
              </div>
            </div>
          )}

          {tab === 'exercicios' && (
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <FileText className="w-6 h-6 text-green-500" />
                Exercícios Resolvidos
              </h2>
              <div className="prose max-w-none">
                <pre className="whitespace-pre-wrap font-sans text-gray-700 leading-relaxed bg-green-50 p-4 rounded-xl">
                  {aula.exercicios_resolvidos || 'Exercícios em breve...'}
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* Botão Concluir */}
        {!concluida ? (
          <button
            onClick={marcarConcluida}
            className={`w-full py-4 bg-gradient-to-r ${cor} text-white font-bold rounded-xl hover:opacity-90 transition-all flex items-center justify-center gap-2`}
          >
            <CheckCircle className="w-5 h-5" />
            Marcar aula como concluída
          </button>
        ) : (
          <div className="w-full py-4 bg-green-100 text-green-700 font-bold rounded-xl flex items-center justify-center gap-2">
            <CheckCircle className="w-5 h-5" />
            ✅ Aula concluída!
          </div>
        )}

        {/* Navegação */}
        <div className="mt-4 flex justify-between">
          <Link
            href={`/plataforma/enem/modulo/${moduloId}`}
            className="text-gray-500 hover:text-gray-700 flex items-center gap-1"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar ao módulo
          </Link>
        </div>
      </main>
    </div>
  )
}
