'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { 
  Users, 
  FileQuestion, 
  CheckCircle, 
  TrendingUp,
  Trophy,
  Target,
  Clock,
  AlertCircle
} from 'lucide-react'

interface Stats {
  totalUsuarios: number
  usuariosAtivos: number
  totalQuestoes: number
  questoesRespondidas: number
  taxaAcertoGeral: number
  totalModulos: number
  totalAulas: number
  totalSimulados: number
}

interface UsuarioRecente {
  id: string
  nome: string
  email: string
  xp_total: number
  nivel: number
  created_at: string
}

interface QuestaoErrada {
  id: string
  enunciado: string
  total_erros: number
  aula_titulo: string
}

export default function AdminDashboard() {
  const supabase = createClientComponentClient()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<Stats>({
    totalUsuarios: 0,
    usuariosAtivos: 0,
    totalQuestoes: 0,
    questoesRespondidas: 0,
    taxaAcertoGeral: 0,
    totalModulos: 0,
    totalAulas: 0,
    totalSimulados: 0
  })
  const [usuariosRecentes, setUsuariosRecentes] = useState<UsuarioRecente[]>([])
  const [questoesErradas, setQuestoesErradas] = useState<QuestaoErrada[]>([])

  useEffect(() => {
    async function fetchStats() {
      // Total de usuários
      const { count: totalUsuarios } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })

      // Usuários ativos (últimos 7 dias)
      const seteDiasAtras = new Date()
      seteDiasAtras.setDate(seteDiasAtras.getDate() - 7)
      const { count: usuariosAtivos } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gte('ultimo_acesso', seteDiasAtras.toISOString())

      // Total de questões
      const { count: totalQuestoes } = await supabase
        .from('questoes')
        .select('*', { count: 'exact', head: true })
        .eq('ativo', true)

      // Questões respondidas
      const { count: questoesRespondidas } = await supabase
        .from('respostas_questoes')
        .select('*', { count: 'exact', head: true })

      // Taxa de acerto geral
      const { count: totalCorretas } = await supabase
        .from('respostas_questoes')
        .select('*', { count: 'exact', head: true })
        .eq('correta', true)

      const taxaAcertoGeral = questoesRespondidas && questoesRespondidas > 0
        ? Math.round((totalCorretas || 0) / questoesRespondidas * 100)
        : 0

      // Total de módulos
      const { count: totalModulos } = await supabase
        .from('modulos')
        .select('*', { count: 'exact', head: true })
        .eq('ativo', true)

      // Total de aulas
      const { count: totalAulas } = await supabase
        .from('aulas')
        .select('*', { count: 'exact', head: true })
        .eq('ativo', true)

      // Total de simulados
      const { count: totalSimulados } = await supabase
        .from('simulados')
        .select('*', { count: 'exact', head: true })

      setStats({
        totalUsuarios: totalUsuarios || 0,
        usuariosAtivos: usuariosAtivos || 0,
        totalQuestoes: totalQuestoes || 0,
        questoesRespondidas: questoesRespondidas || 0,
        taxaAcertoGeral,
        totalModulos: totalModulos || 0,
        totalAulas: totalAulas || 0,
        totalSimulados: totalSimulados || 0
      })

      // Usuários recentes
      const { data: usuarios } = await supabase
        .from('profiles')
        .select('id, nome_completo, email, xp_total, nivel, created_at')
        .order('created_at', { ascending: false })
        .limit(5)

      if (usuarios) {
        setUsuariosRecentes(usuarios.map(u => ({
          id: u.id,
          nome: u.nome_completo || u.email?.split('@')[0] || 'Usuário',
          email: u.email || '',
          xp_total: u.xp_total || 0,
          nivel: u.nivel || 1,
          created_at: u.created_at
        })))
      }

      // Questões mais erradas
      const { data: erros } = await supabase
        .from('caderno_erros')
        .select('questao_id, questoes(id, enunciado, aulas(titulo))')
        .limit(100)

      if (erros) {
        const contagemErros: Record<string, { questao: any, count: number }> = {}
        erros.forEach((e: any) => {
          if (e.questoes) {
            const id = e.questao_id
            if (!contagemErros[id]) {
              contagemErros[id] = { questao: e.questoes, count: 0 }
            }
            contagemErros[id].count++
          }
        })

        const topErradas = Object.entries(contagemErros)
          .sort((a, b) => b[1].count - a[1].count)
          .slice(0, 5)
          .map(([id, data]) => ({
            id,
            enunciado: data.questao.enunciado?.substring(0, 100) + '...' || 'Sem enunciado',
            total_erros: data.count,
            aula_titulo: data.questao.aulas?.titulo || 'Sem aula'
          }))

        setQuestoesErradas(topErradas)
      }

      setLoading(false)
    }

    fetchStats()
  }, [supabase])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
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
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500">Visão geral da plataforma XY Cursos</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Total de Usuários</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{stats.totalUsuarios}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <p className="text-sm text-green-600 mt-2">
            {stats.usuariosAtivos} ativos esta semana
          </p>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Questões Respondidas</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{stats.questoesRespondidas}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-2">
            de {stats.totalQuestoes} disponíveis
          </p>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Taxa de Acerto</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{stats.taxaAcertoGeral}%</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <Target className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-2">
            média geral dos alunos
          </p>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Conteúdo</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{stats.totalAulas}</p>
            </div>
            <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
              <FileQuestion className="w-6 h-6 text-amber-600" />
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-2">
            aulas em {stats.totalModulos} módulos
          </p>
        </div>
      </div>

      {/* Two Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Usuários Recentes */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-500" />
              Usuários Recentes
            </h2>
          </div>
          <div className="divide-y divide-gray-100">
            {usuariosRecentes.length > 0 ? (
              usuariosRecentes.map((usuario) => (
                <div key={usuario.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                      {usuario.nome.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{usuario.nome}</p>
                      <p className="text-sm text-gray-500">{usuario.email}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900">{usuario.xp_total} XP</p>
                    <p className="text-sm text-gray-500">Nível {usuario.nivel}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-gray-500">
                Nenhum usuário cadastrado ainda
              </div>
            )}
          </div>
        </div>

        {/* Questões Mais Erradas */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-500" />
              Questões Mais Erradas
            </h2>
          </div>
          <div className="divide-y divide-gray-100">
            {questoesErradas.length > 0 ? (
              questoesErradas.map((questao, index) => (
                <div key={questao.id} className="p-4 hover:bg-gray-50">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <p className="text-sm text-gray-900 line-clamp-2">{questao.enunciado}</p>
                      <p className="text-xs text-gray-500 mt-1">{questao.aula_titulo}</p>
                    </div>
                    <div className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm font-medium whitespace-nowrap">
                      {questao.total_erros} erros
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-gray-500">
                Nenhum erro registrado ainda
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Resumo do Conteúdo</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-gray-50 rounded-xl">
            <p className="text-3xl font-bold text-blue-600">{stats.totalModulos}</p>
            <p className="text-gray-500 text-sm">Módulos</p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-xl">
            <p className="text-3xl font-bold text-green-600">{stats.totalAulas}</p>
            <p className="text-gray-500 text-sm">Aulas</p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-xl">
            <p className="text-3xl font-bold text-purple-600">{stats.totalQuestoes}</p>
            <p className="text-gray-500 text-sm">Questões</p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-xl">
            <p className="text-3xl font-bold text-amber-600">{stats.totalSimulados}</p>
            <p className="text-gray-500 text-sm">Simulados</p>
          </div>
        </div>
      </div>
    </div>
  )
}
