'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { 
  BarChart3, 
  TrendingUp,
  TrendingDown,
  Users,
  Target,
  Award,
  Calendar,
  BookOpen
} from 'lucide-react'

interface ModuloStats {
  titulo: string
  total_aulas: number
  total_questoes: number
  questoes_respondidas: number
  taxa_acerto: number
}

interface DificuldadeStats {
  dificuldade: string
  total: number
  respondidas: number
  acertos: number
  taxa: number
}

interface ProgressoSemanal {
  dia: string
  questoes: number
  usuarios_ativos: number
}

export default function RelatoriosPage() {
  const supabase = createClientComponentClient()
  const [loading, setLoading] = useState(true)
  const [modulosStats, setModulosStats] = useState<ModuloStats[]>([])
  const [dificuldadeStats, setDificuldadeStats] = useState<DificuldadeStats[]>([])
  const [totalStats, setTotalStats] = useState({
    questoesHoje: 0,
    questoesSemana: 0,
    mediaQuestoesDia: 0,
    usuariosAtivos: 0,
    novosCadastros: 0
  })

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    // Estatísticas por módulo
    const { data: modulos } = await supabase
      .from('modulos')
      .select(`
        id,
        titulo,
        aulas(
          id,
          questoes(id, dificuldade)
        )
      `)
      .eq('ativo', true)
      .order('numero')

    if (modulos) {
      // Buscar respostas
      const { data: respostas } = await supabase
        .from('respostas_questoes')
        .select('questao_id, correta')

      const respostasMap: Record<string, { total: number, acertos: number }> = {}
      if (respostas) {
        respostas.forEach((r: any) => {
          if (!respostasMap[r.questao_id]) {
            respostasMap[r.questao_id] = { total: 0, acertos: 0 }
          }
          respostasMap[r.questao_id].total++
          if (r.correta) respostasMap[r.questao_id].acertos++
        })
      }

      const modulosFormatados = modulos.map((m: any) => {
        const questoesIds: string[] = []
        m.aulas?.forEach((a: any) => {
          a.questoes?.forEach((q: any) => questoesIds.push(q.id))
        })

        let totalRespondidas = 0
        let totalAcertos = 0
        questoesIds.forEach(qId => {
          if (respostasMap[qId]) {
            totalRespondidas += respostasMap[qId].total
            totalAcertos += respostasMap[qId].acertos
          }
        })

        return {
          titulo: m.titulo,
          total_aulas: m.aulas?.length || 0,
          total_questoes: questoesIds.length,
          questoes_respondidas: totalRespondidas,
          taxa_acerto: totalRespondidas > 0 ? Math.round((totalAcertos / totalRespondidas) * 100) : 0
        }
      })

      setModulosStats(modulosFormatados)
    }

    // Estatísticas por dificuldade
    const { data: questoes } = await supabase
      .from('questoes')
      .select('id, dificuldade')
      .eq('ativo', true)

    const { data: respostasDif } = await supabase
      .from('respostas_questoes')
      .select('questao_id, correta, questoes(dificuldade)')

    if (questoes && respostasDif) {
      const difMap: Record<string, { total: number, respondidas: number, acertos: number }> = {
        facil: { total: 0, respondidas: 0, acertos: 0 },
        medio: { total: 0, respondidas: 0, acertos: 0 },
        dificil: { total: 0, respondidas: 0, acertos: 0 }
      }

      questoes.forEach((q: any) => {
        if (difMap[q.dificuldade]) {
          difMap[q.dificuldade].total++
        }
      })

      respostasDif.forEach((r: any) => {
        const dif = r.questoes?.dificuldade
        if (dif && difMap[dif]) {
          difMap[dif].respondidas++
          if (r.correta) difMap[dif].acertos++
        }
      })

      const difStats = Object.entries(difMap).map(([dif, stats]) => ({
        dificuldade: dif,
        total: stats.total,
        respondidas: stats.respondidas,
        acertos: stats.acertos,
        taxa: stats.respondidas > 0 ? Math.round((stats.acertos / stats.respondidas) * 100) : 0
      }))

      setDificuldadeStats(difStats)
    }

    // Estatísticas gerais
    const hoje = new Date()
    hoje.setHours(0, 0, 0, 0)
    
    const seteDiasAtras = new Date()
    seteDiasAtras.setDate(seteDiasAtras.getDate() - 7)

    const { count: questoesHoje } = await supabase
      .from('respostas_questoes')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', hoje.toISOString())

    const { count: questoesSemana } = await supabase
      .from('respostas_questoes')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', seteDiasAtras.toISOString())

    const { count: usuariosAtivos } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .gte('ultimo_acesso', seteDiasAtras.toISOString())

    const { count: novosCadastros } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', seteDiasAtras.toISOString())

    setTotalStats({
      questoesHoje: questoesHoje || 0,
      questoesSemana: questoesSemana || 0,
      mediaQuestoesDia: Math.round((questoesSemana || 0) / 7),
      usuariosAtivos: usuariosAtivos || 0,
      novosCadastros: novosCadastros || 0
    })

    setLoading(false)
  }

  const getDificuldadeLabel = (dif: string) => {
    switch (dif) {
      case 'facil': return 'Fácil'
      case 'medio': return 'Médio'
      case 'dificil': return 'Difícil'
      default: return dif
    }
  }

  const getDificuldadeColor = (dif: string) => {
    switch (dif) {
      case 'facil': return 'bg-green-500'
      case 'medio': return 'bg-yellow-500'
      case 'dificil': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Relatórios</h1>
        <p className="text-gray-500">Análise de desempenho da plataforma</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <Target className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-gray-500 text-sm">Questões Hoje</p>
          </div>
          <p className="text-3xl font-bold text-gray-900">{totalStats.questoesHoje}</p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-gray-500 text-sm">Questões Semana</p>
          </div>
          <p className="text-3xl font-bold text-gray-900">{totalStats.questoesSemana}</p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-purple-600" />
            </div>
            <p className="text-gray-500 text-sm">Média/Dia</p>
          </div>
          <p className="text-3xl font-bold text-gray-900">{totalStats.mediaQuestoesDia}</p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
              <Users className="w-5 h-5 text-amber-600" />
            </div>
            <p className="text-gray-500 text-sm">Usuários Ativos</p>
          </div>
          <p className="text-3xl font-bold text-gray-900">{totalStats.usuariosAtivos}</p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-pink-100 rounded-xl flex items-center justify-center">
              <Award className="w-5 h-5 text-pink-600" />
            </div>
            <p className="text-gray-500 text-sm">Novos Cadastros</p>
          </div>
          <p className="text-3xl font-bold text-gray-900">{totalStats.novosCadastros}</p>
        </div>
      </div>

      {/* Two Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Desempenho por Módulo */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-blue-500" />
              Desempenho por Módulo
            </h2>
          </div>
          <div className="p-6 space-y-4">
            {modulosStats.map((modulo, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-gray-900 text-sm">{modulo.titulo}</p>
                  <p className="text-sm text-gray-500">
                    {modulo.taxa_acerto}% acerto
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${
                        modulo.taxa_acerto >= 70 ? 'bg-green-500' :
                        modulo.taxa_acerto >= 40 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${modulo.taxa_acerto}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-400 w-24 text-right">
                    {modulo.questoes_respondidas} respostas
                  </p>
                </div>
              </div>
            ))}
            {modulosStats.length === 0 && (
              <p className="text-gray-500 text-center py-4">Nenhum dado disponível</p>
            )}
          </div>
        </div>

        {/* Desempenho por Dificuldade */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Target className="w-5 h-5 text-purple-500" />
              Desempenho por Dificuldade
            </h2>
          </div>
          <div className="p-6 space-y-6">
            {dificuldadeStats.map((dif, index) => (
              <div key={index} className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${getDificuldadeColor(dif.dificuldade)}`} />
                    <p className="font-medium text-gray-900">{getDificuldadeLabel(dif.dificuldade)}</p>
                  </div>
                  <p className="text-sm text-gray-500">
                    {dif.total} questões
                  </p>
                </div>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="bg-gray-50 rounded-xl p-3">
                    <p className="text-2xl font-bold text-gray-900">{dif.respondidas}</p>
                    <p className="text-xs text-gray-500">Respostas</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3">
                    <p className="text-2xl font-bold text-green-600">{dif.acertos}</p>
                    <p className="text-xs text-gray-500">Acertos</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3">
                    <p className={`text-2xl font-bold ${
                      dif.taxa >= 70 ? 'text-green-600' :
                      dif.taxa >= 40 ? 'text-yellow-600' : 'text-red-600'
                    }`}>{dif.taxa}%</p>
                    <p className="text-xs text-gray-500">Taxa</p>
                  </div>
                </div>
              </div>
            ))}
            {dificuldadeStats.length === 0 && (
              <p className="text-gray-500 text-center py-4">Nenhum dado disponível</p>
            )}
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <Calendar className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="font-bold text-blue-900">Período de Análise</h3>
            <p className="text-blue-700 text-sm mt-1">
              Os dados de "Usuários Ativos" e "Novos Cadastros" consideram os últimos 7 dias.
              As estatísticas de módulos e dificuldades consideram todo o histórico da plataforma.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
