'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { 
  ArrowLeft, 
  BookOpen, 
  Lock, 
  CheckCircle, 
  Lightbulb, 
  Calculator, 
  FileText, 
  Clock,
  Play,
  Target,
  Trophy
} from 'lucide-react'

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

interface ContagemQuestoes {
  facil: number
  medio: number
  dificil: number
}

interface ProgressoExercicios {
  facil: { total: number; acertos: number; percentual: number }
  medio: { total: number; acertos: number; percentual: number }
  dificil: { total: number; acertos: number; percentual: number }
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
  const [contagemQuestoes, setContagemQuestoes] = useState<ContagemQuestoes>({ facil: 0, medio: 0, dificil: 0 })
  const [progressoExercicios, setProgressoExercicios] = useState<ProgressoExercicios>({
    facil: { total: 0, acertos: 0, percentual: 0 },
    medio: { total: 0, acertos: 0, percentual: 0 },
    dificil: { total: 0, acertos: 0, percentual: 0 }
  })

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

      // Contar questões por dificuldade
      const { data: questoesData } = await supabase
        .from('questoes')
        .select('id, dificuldade')
        .eq('aula_id', aulaId)
        .eq('ativo', true)

      if (questoesData) {
        const contagem = { facil: 0, medio: 0, dificil: 0 }
        questoesData.forEach(q => {
          if (q.dificuldade === 'facil') contagem.facil++
          else if (q.dificuldade === 'medio') contagem.medio++
          else if (q.dificuldade === 'dificil') contagem.dificil++
        })
        setContagemQuestoes(contagem)

        // Buscar progresso do usuário nos exercícios
        const questaoIds = questoesData.map(q => q.id)
        
        if (questaoIds.length > 0) {
          const { data: respostasData } = await supabase
            .from('respostas_questoes')
            .select('questao_id, correta')
            .eq('user_id', user.id)
            .in('questao_id', questaoIds)

          if (respostasData) {
            const progresso: ProgressoExercicios = {
              facil: { total: 0, acertos: 0, percentual: 0 },
              medio: { total: 0, acertos: 0, percentual: 0 },
              dificil: { total: 0, acertos: 0, percentual: 0 }
            }

            respostasData.forEach(r => {
              const questao = questoesData.find(q => q.id === r.questao_id)
              if (questao) {
                const dif = questao.dificuldade as 'facil' | 'medio' | 'dificil'
                progresso[dif].total++
                if (r.correta) progresso[dif].acertos++
              }
            })

            // Calcular percentuais
            if (progresso.facil.total > 0) {
              progresso.facil.percentual = (progresso.facil.acertos / progresso.facil.total) * 100
            }
            if (progresso.medio.total > 0) {
              progresso.medio.percentual = (progresso.medio.acertos / progresso.medio.total) * 100
            }
            if (progresso.dificil.total > 0) {
              progresso.dificil.percentual = (progresso.dificil.acertos / progresso.dificil.total) * 100
            }

            setProgressoExercicios(progresso)
          }
        }
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

  // Verificar liberação dos níveis (70% para liberar próximo)
  const PERCENTUAL_LIBERACAO = 70
  const medioLiberado = progressoExercicios.facil.total >= contagemQuestoes.facil && 
                        progressoExercicios.facil.percentual >= PERCENTUAL_LIBERACAO
  const dificilLiberado = medioLiberado && 
                          progressoExercicios.medio.total >= contagemQuestoes.medio && 
                          progressoExercicios.medio.percentual >= PERCENTUAL_LIBERACAO

  // Verificar se completou todos os exercícios
  const todosCompletos = progressoExercicios.facil.total >= contagemQuestoes.facil &&
                         progressoExercicios.medio.total >= contagemQuestoes.medio &&
                         progressoExercicios.dificil.total >= contagemQuestoes.dificil

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
                <Target className="w-6 h-6 text-green-500" />
                Pratique Exercícios
              </h2>
              <p className="text-gray-600 mb-6">
                Complete cada nível com 70% de acertos para liberar o próximo!
              </p>

              {/* 3 Blocos de Exercícios */}
              <div className="space-y-4">
                
                {/* Bloco FÁCIL - Sempre liberado */}
                <Link
                  href={`/plataforma/enem/modulo/${moduloId}/aula/${aulaId}/exercicios/facil`}
                  className="block bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-5 hover:border-green-400 hover:shadow-md transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-green-500 rounded-xl flex items-center justify-center">
                        <span className="text-2xl">🟢</span>
                      </div>
                      <div>
                        <h3 className="font-bold text-green-800 text-lg">Nível Fácil</h3>
                        <p className="text-green-600 text-sm">{contagemQuestoes.facil} questões</p>
                      </div>
                    </div>
                    <div className="text-right">
                      {progressoExercicios.facil.total > 0 ? (
                        <div>
                          <p className={`text-2xl font-bold ${progressoExercicios.facil.percentual >= 70 ? 'text-green-600' : 'text-orange-500'}`}>
                            {progressoExercicios.facil.percentual.toFixed(0)}%
                          </p>
                          <p className="text-xs text-gray-500">
                            {progressoExercicios.facil.acertos}/{progressoExercicios.facil.total} acertos
                          </p>
                        </div>
                      ) : (
                        <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                          <Play className="w-6 h-6 text-white" />
                        </div>
                      )}
                    </div>
                  </div>
                  {progressoExercicios.facil.total > 0 && (
                    <div className="mt-3">
                      <div className="h-2 bg-green-100 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all ${progressoExercicios.facil.percentual >= 70 ? 'bg-green-500' : 'bg-orange-400'}`}
                          style={{ width: `${progressoExercicios.facil.percentual}%` }}
                        />
                      </div>
                    </div>
                  )}
                </Link>

                {/* Bloco MÉDIO */}
                {medioLiberado ? (
                  <Link
                    href={`/plataforma/enem/modulo/${moduloId}/aula/${aulaId}/exercicios/medio`}
                    className="block bg-gradient-to-r from-yellow-50 to-amber-50 border-2 border-yellow-200 rounded-xl p-5 hover:border-yellow-400 hover:shadow-md transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-yellow-500 rounded-xl flex items-center justify-center">
                          <span className="text-2xl">🟡</span>
                        </div>
                        <div>
                          <h3 className="font-bold text-yellow-800 text-lg">Nível Médio</h3>
                          <p className="text-yellow-600 text-sm">{contagemQuestoes.medio} questões</p>
                        </div>
                      </div>
                      <div className="text-right">
                        {progressoExercicios.medio.total > 0 ? (
                          <div>
                            <p className={`text-2xl font-bold ${progressoExercicios.medio.percentual >= 70 ? 'text-green-600' : 'text-orange-500'}`}>
                              {progressoExercicios.medio.percentual.toFixed(0)}%
                            </p>
                            <p className="text-xs text-gray-500">
                              {progressoExercicios.medio.acertos}/{progressoExercicios.medio.total} acertos
                            </p>
                          </div>
                        ) : (
                          <div className="w-12 h-12 bg-yellow-500 rounded-full flex items-center justify-center">
                            <Play className="w-6 h-6 text-white" />
                          </div>
                        )}
                      </div>
                    </div>
                    {progressoExercicios.medio.total > 0 && (
                      <div className="mt-3">
                        <div className="h-2 bg-yellow-100 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all ${progressoExercicios.medio.percentual >= 70 ? 'bg-green-500' : 'bg-orange-400'}`}
                            style={{ width: `${progressoExercicios.medio.percentual}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </Link>
                ) : (
                  <div className="bg-gray-100 border-2 border-dashed border-gray-300 rounded-xl p-5 opacity-60">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-gray-300 rounded-xl flex items-center justify-center">
                          <Lock className="w-7 h-7 text-gray-500" />
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-500 text-lg">Nível Médio</h3>
                          <p className="text-gray-400 text-sm">Complete 70% do Fácil para liberar</p>
                        </div>
                      </div>
                      <div className="text-gray-400">
                        🔒
                      </div>
                    </div>
                  </div>
                )}

                {/* Bloco DIFÍCIL */}
                {dificilLiberado ? (
                  <Link
                    href={`/plataforma/enem/modulo/${moduloId}/aula/${aulaId}/exercicios/dificil`}
                    className="block bg-gradient-to-r from-red-50 to-rose-50 border-2 border-red-200 rounded-xl p-5 hover:border-red-400 hover:shadow-md transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-red-500 rounded-xl flex items-center justify-center">
                          <span className="text-2xl">🔴</span>
                        </div>
                        <div>
                          <h3 className="font-bold text-red-800 text-lg">Nível Difícil</h3>
                          <p className="text-red-600 text-sm">{contagemQuestoes.dificil} questões</p>
                        </div>
                      </div>
                      <div className="text-right">
                        {progressoExercicios.dificil.total > 0 ? (
                          <div>
                            <p className={`text-2xl font-bold ${progressoExercicios.dificil.percentual >= 70 ? 'text-green-600' : 'text-orange-500'}`}>
                              {progressoExercicios.dificil.percentual.toFixed(0)}%
                            </p>
                            <p className="text-xs text-gray-500">
                              {progressoExercicios.dificil.acertos}/{progressoExercicios.dificil.total} acertos
                            </p>
                          </div>
                        ) : (
                          <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center">
                            <Play className="w-6 h-6 text-white" />
                          </div>
                        )}
                      </div>
                    </div>
                    {progressoExercicios.dificil.total > 0 && (
                      <div className="mt-3">
                        <div className="h-2 bg-red-100 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all ${progressoExercicios.dificil.percentual >= 70 ? 'bg-green-500' : 'bg-orange-400'}`}
                            style={{ width: `${progressoExercicios.dificil.percentual}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </Link>
                ) : (
                  <div className="bg-gray-100 border-2 border-dashed border-gray-300 rounded-xl p-5 opacity-60">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-gray-300 rounded-xl flex items-center justify-center">
                          <Lock className="w-7 h-7 text-gray-500" />
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-500 text-lg">Nível Difícil</h3>
                          <p className="text-gray-400 text-sm">Complete 70% do Médio para liberar</p>
                        </div>
                      </div>
                      <div className="text-gray-400">
                        🔒
                      </div>
                    </div>
                  </div>
                )}

              </div>

              {/* Conquista ao completar tudo */}
              {todosCompletos && (
                <div className="mt-6 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-xl p-6 text-white text-center">
                  <Trophy className="w-12 h-12 mx-auto mb-2" />
                  <h3 className="text-xl font-bold">🎉 Parabéns!</h3>
                  <p className="text-purple-100">Você completou todos os exercícios desta aula!</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Botão Concluir - só aparece se não estiver na aba de exercícios */}
        {tab !== 'exercicios' && (
          <>
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
          </>
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
