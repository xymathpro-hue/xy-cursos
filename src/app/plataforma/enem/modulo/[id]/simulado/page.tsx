'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { ArrowLeft, Clock, FileText, AlertTriangle, CheckCircle, XCircle, BookOpen } from 'lucide-react'

interface SimuladoModulo {
  id: string
  titulo: string
  descricao: string
  total_questoes: number
  tempo_minutos: number
  tentativas_por_dia: number
  percentual_aprovacao: number
  percentual_liberacao: number
}

interface Modulo {
  id: string
  numero: number
  titulo: string
}

export default function SimuladoModuloInstrucoes() {
  const params = useParams()
  const router = useRouter()
  const moduloId = params.id as string
  
  const [modulo, setModulo] = useState<Modulo | null>(null)
  const [simulado, setSimulado] = useState<SimuladoModulo | null>(null)
  const [loading, setLoading] = useState(true)
  const [podeFazer, setPodeFazer] = useState(false)
  const [motivoBloqueio, setMotivoBloqueio] = useState('')
  const [tentativaHoje, setTentativaHoje] = useState(false)
  const [ultimaTentativa, setUltimaTentativa] = useState<any>(null)
  
  const supabase = createClientComponentClient()

  useEffect(() => {
    async function fetchData() {
      // Buscar usuário
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

      if (!moduloData) {
        router.push('/plataforma/enem')
        return
      }
      setModulo(moduloData)

      // Buscar simulado do módulo
      const { data: simuladoData } = await supabase
        .from('simulados_modulo')
        .select('*')
        .eq('modulo_id', moduloId)
        .single()

      if (!simuladoData) {
        setMotivoBloqueio('Simulado não encontrado para este módulo.')
        setLoading(false)
        return
      }
      setSimulado(simuladoData)

      // Verificar se já fez tentativa hoje
      const hoje = new Date()
      hoje.setHours(0, 0, 0, 0)
      
      const { data: tentativasHoje } = await supabase
        .from('tentativas_simulado_modulo')
        .select('*')
        .eq('user_id', user.id)
        .eq('simulado_modulo_id', simuladoData.id)
        .gte('created_at', hoje.toISOString())
        .order('created_at', { ascending: false })

      if (tentativasHoje && tentativasHoje.length > 0) {
        setTentativaHoje(true)
        setUltimaTentativa(tentativasHoje[0])
        
        if (tentativasHoje[0].status === 'em_andamento') {
          // Tem tentativa em andamento, redirecionar
          router.push(`/plataforma/enem/modulo/${moduloId}/simulado/prova`)
          return
        }
        
        setMotivoBloqueio('Você já realizou sua tentativa de hoje. Volte amanhã!')
        setPodeFazer(false)
      } else {
        // Verificar progresso nas aulas (80% liberação)
        const { data: aulas } = await supabase
          .from('aulas')
          .select('id')
          .eq('modulo_id', moduloId)
          .eq('ativo', true)

        const totalAulas = aulas?.length || 0

        const { data: progresso } = await supabase
          .from('progresso_aulas')
          .select('aula_id')
          .eq('user_id', user.id)
          .eq('concluida', true)
          .in('aula_id', aulas?.map(a => a.id) || [])

        const aulasConcluidas = progresso?.length || 0
        const percentualConcluido = totalAulas > 0 ? (aulasConcluidas / totalAulas) * 100 : 0

        if (percentualConcluido >= simuladoData.percentual_liberacao) {
          setPodeFazer(true)
        } else {
          setMotivoBloqueio(`Complete ${simuladoData.percentual_liberacao}% das aulas para liberar o simulado. Progresso atual: ${percentualConcluido.toFixed(0)}%`)
          setPodeFazer(false)
        }
      }

      // Buscar última tentativa finalizada
      const { data: ultimaTentativaData } = await supabase
        .from('tentativas_simulado_modulo')
        .select('*')
        .eq('user_id', user.id)
        .eq('simulado_modulo_id', simuladoData.id)
        .eq('status', 'finalizado')
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (ultimaTentativaData) {
        setUltimaTentativa(ultimaTentativaData)
      }

      setLoading(false)
    }

    fetchData()
  }, [moduloId, router, supabase])

  const iniciarSimulado = async () => {
    if (!simulado) return

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Criar nova tentativa
    const { data: novaTentativa, error } = await supabase
      .from('tentativas_simulado_modulo')
      .insert({
        user_id: user.id,
        simulado_modulo_id: simulado.id,
        total_questoes: simulado.total_questoes,
        status: 'em_andamento'
      })
      .select()
      .single()

    if (error) {
      console.error('Erro ao criar tentativa:', error)
      alert('Erro ao iniciar simulado. Tente novamente.')
      return
    }

    router.push(`/plataforma/enem/modulo/${moduloId}/simulado/prova`)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

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
        {/* Título */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl p-8 mb-8 text-white">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center">
              <FileText className="w-8 h-8" />
            </div>
            <div>
              <p className="text-purple-200 text-sm">Módulo {modulo?.numero}</p>
              <h1 className="text-2xl font-bold">{simulado?.titulo}</h1>
            </div>
          </div>
          <p className="text-purple-100">{simulado?.descricao}</p>
        </div>

        {/* Última tentativa */}
        {ultimaTentativa && ultimaTentativa.status === 'finalizado' && (
          <div className={`rounded-xl p-6 mb-6 ${ultimaTentativa.aprovado ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
            <div className="flex items-center gap-3 mb-3">
              {ultimaTentativa.aprovado ? (
                <CheckCircle className="w-6 h-6 text-green-600" />
              ) : (
                <XCircle className="w-6 h-6 text-red-600" />
              )}
              <h3 className={`font-bold ${ultimaTentativa.aprovado ? 'text-green-800' : 'text-red-800'}`}>
                Última Tentativa: {ultimaTentativa.aprovado ? 'APROVADO!' : 'NÃO APROVADO'}
              </h3>
            </div>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-gray-800">{ultimaTentativa.total_acertos}/{ultimaTentativa.total_questoes}</p>
                <p className="text-sm text-gray-500">Acertos</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-800">{Number(ultimaTentativa.percentual_acertos).toFixed(0)}%</p>
                <p className="text-sm text-gray-500">Aproveitamento</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-800">{Math.floor((ultimaTentativa.tempo_gasto_segundos || 0) / 60)} min</p>
                <p className="text-sm text-gray-500">Tempo</p>
              </div>
            </div>
            <Link 
              href={`/plataforma/enem/modulo/${moduloId}/simulado/resultado/${ultimaTentativa.id}`}
              className="block mt-4 text-center text-blue-600 hover:underline"
            >
              Ver detalhes da última tentativa →
            </Link>
          </div>
        )}

        {/* Instruções */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            Instruções do Simulado
          </h2>
          
          <div className="space-y-4 text-gray-600">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold shrink-0">1</div>
              <div>
                <p className="font-medium text-gray-800">Quantidade de questões</p>
                <p>O simulado contém <strong>{simulado?.total_questoes} questões</strong> sobre {modulo?.titulo}.</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold shrink-0">2</div>
              <div>
                <p className="font-medium text-gray-800">Tempo limite</p>
                <p>Você terá <strong>{simulado?.tempo_minutos} minutos</strong> para completar o simulado.</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold shrink-0">3</div>
              <div>
                <p className="font-medium text-gray-800">Sem feedback durante a prova</p>
                <p>Você <strong>NÃO</strong> verá se acertou ou errou durante o simulado. O resultado só aparece ao final.</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold shrink-0">4</div>
              <div>
                <p className="font-medium text-gray-800">Aprovação</p>
                <p>Você precisa de <strong>{simulado?.percentual_aprovacao}% de acertos</strong> ({Math.ceil((simulado?.total_questoes || 25) * (simulado?.percentual_aprovacao || 80) / 100)} questões) para ser aprovado.</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold shrink-0">5</div>
              <div>
                <p className="font-medium text-gray-800">Tentativas</p>
                <p>Você pode fazer <strong>1 tentativa por dia</strong>. Se não passar, volte amanhã!</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold shrink-0">6</div>
              <div>
                <p className="font-medium text-gray-800">Caderno de Erros</p>
                <p>As questões que você errar serão <strong>salvas automaticamente</strong> no seu Caderno de Erros para revisão.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Aviso */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-yellow-800">Atenção!</p>
              <p className="text-yellow-700 text-sm">Ao iniciar o simulado, o cronômetro começará imediatamente. Certifique-se de ter tempo disponível e uma conexão estável.</p>
            </div>
          </div>
        </div>

        {/* Resumo */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="p-4 bg-blue-50 rounded-xl">
              <FileText className="w-6 h-6 text-blue-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-800">{simulado?.total_questoes}</p>
              <p className="text-sm text-gray-500">Questões</p>
            </div>
            <div className="p-4 bg-purple-50 rounded-xl">
              <Clock className="w-6 h-6 text-purple-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-800">{simulado?.tempo_minutos}</p>
              <p className="text-sm text-gray-500">Minutos</p>
            </div>
            <div className="p-4 bg-green-50 rounded-xl">
              <CheckCircle className="w-6 h-6 text-green-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-800">{simulado?.percentual_aprovacao}%</p>
              <p className="text-sm text-gray-500">Para aprovar</p>
            </div>
          </div>
        </div>

        {/* Botão */}
        {podeFazer ? (
          <button
            onClick={iniciarSimulado}
            className="w-full py-4 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold rounded-xl text-lg transition-all shadow-lg hover:shadow-xl"
          >
            🚀 Iniciar Simulado
          </button>
        ) : (
          <div className="text-center">
            <div className="py-4 bg-gray-200 text-gray-500 font-bold rounded-xl text-lg mb-2">
              🔒 Simulado Bloqueado
            </div>
            <p className="text-gray-600">{motivoBloqueio}</p>
            {tentativaHoje && ultimaTentativa && (
              <Link 
                href={`/plataforma/enem/modulo/${moduloId}/simulado/resultado/${ultimaTentativa.id}`}
                className="inline-block mt-4 text-blue-600 hover:underline"
              >
                Ver resultado da tentativa de hoje →
              </Link>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
