'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { 
  FileQuestion, 
  Search, 
  Filter,
  AlertCircle,
  CheckCircle,
  XCircle,
  ChevronLeft,
  ChevronRight,
  BookOpen
} from 'lucide-react'

interface Questao {
  id: string
  enunciado: string
  dificuldade: string
  aula_titulo: string
  modulo_titulo: string
  total_respostas: number
  total_acertos: number
  taxa_acerto: number
}

interface Modulo {
  id: string
  titulo: string
}

export default function QuestoesPage() {
  const supabase = createClientComponentClient()
  const [loading, setLoading] = useState(true)
  const [questoes, setQuestoes] = useState<Questao[]>([])
  const [filteredQuestoes, setFilteredQuestoes] = useState<Questao[]>([])
  const [modulos, setModulos] = useState<Modulo[]>([])
  const [search, setSearch] = useState('')
  const [filterModulo, setFilterModulo] = useState('')
  const [filterDificuldade, setFilterDificuldade] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 15

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    let filtered = questoes

    if (search) {
      filtered = filtered.filter(q => 
        q.enunciado?.toLowerCase().includes(search.toLowerCase())
      )
    }

    if (filterModulo) {
      filtered = filtered.filter(q => q.modulo_titulo === filterModulo)
    }

    if (filterDificuldade) {
      filtered = filtered.filter(q => q.dificuldade === filterDificuldade)
    }

    setFilteredQuestoes(filtered)
    setCurrentPage(1)
  }, [search, filterModulo, filterDificuldade, questoes])

  async function fetchData() {
    // Buscar módulos
    const { data: modulosData } = await supabase
      .from('modulos')
      .select('id, titulo')
      .eq('ativo', true)
      .order('numero')

    if (modulosData) {
      setModulos(modulosData)
    }

    // Buscar questões com estatísticas
    const { data: questoesData } = await supabase
      .from('questoes')
      .select(`
        id,
        enunciado,
        dificuldade,
        aulas(titulo, modulos(titulo))
      `)
      .eq('ativo', true)
      .order('created_at', { ascending: false })

    if (questoesData) {
      // Buscar estatísticas de respostas
      const { data: respostasData } = await supabase
        .from('respostas_questoes')
        .select('questao_id, correta')

      const statsMap: Record<string, { total: number, acertos: number }> = {}
      
      if (respostasData) {
        respostasData.forEach((r: any) => {
          if (!statsMap[r.questao_id]) {
            statsMap[r.questao_id] = { total: 0, acertos: 0 }
          }
          statsMap[r.questao_id].total++
          if (r.correta) statsMap[r.questao_id].acertos++
        })
      }

      const questoesFormatadas = questoesData.map((q: any) => {
        const stats = statsMap[q.id] || { total: 0, acertos: 0 }
        return {
          id: q.id,
          enunciado: q.enunciado || 'Sem enunciado',
          dificuldade: q.dificuldade || 'medio',
          aula_titulo: q.aulas?.titulo || 'Sem aula',
          modulo_titulo: q.aulas?.modulos?.titulo || 'Sem módulo',
          total_respostas: stats.total,
          total_acertos: stats.acertos,
          taxa_acerto: stats.total > 0 ? Math.round((stats.acertos / stats.total) * 100) : 0
        }
      })

      setQuestoes(questoesFormatadas)
      setFilteredQuestoes(questoesFormatadas)
    }

    setLoading(false)
  }

  const getDificuldadeColor = (dif: string) => {
    switch (dif) {
      case 'facil': return 'bg-green-100 text-green-700'
      case 'medio': return 'bg-yellow-100 text-yellow-700'
      case 'dificil': return 'bg-red-100 text-red-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const getDificuldadeLabel = (dif: string) => {
    switch (dif) {
      case 'facil': return 'Fácil'
      case 'medio': return 'Médio'
      case 'dificil': return 'Difícil'
      default: return dif
    }
  }

  const getTaxaColor = (taxa: number) => {
    if (taxa >= 70) return 'text-green-600'
    if (taxa >= 40) return 'text-yellow-600'
    return 'text-red-600'
  }

  // Pagination
  const totalPages = Math.ceil(filteredQuestoes.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedQuestoes = filteredQuestoes.slice(startIndex, startIndex + itemsPerPage)

  // Stats
  const totalQuestoes = questoes.length
  const questoesFaceis = questoes.filter(q => q.dificuldade === 'facil').length
  const questoesMedias = questoes.filter(q => q.dificuldade === 'medio').length
  const questoesDificeis = questoes.filter(q => q.dificuldade === 'dificil').length

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
        <h1 className="text-2xl font-bold text-gray-900">Questões</h1>
        <p className="text-gray-500">Gerencie e analise as questões da plataforma</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <p className="text-gray-500 text-sm">Total</p>
          <p className="text-2xl font-bold text-gray-900">{totalQuestoes}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <p className="text-gray-500 text-sm">Fáceis</p>
          <p className="text-2xl font-bold text-green-600">{questoesFaceis}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <p className="text-gray-500 text-sm">Médias</p>
          <p className="text-2xl font-bold text-yellow-600">{questoesMedias}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <p className="text-gray-500 text-sm">Difíceis</p>
          <p className="text-2xl font-bold text-red-600">{questoesDificeis}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar no enunciado..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-xl w-full focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Filter Módulo */}
          <select
            value={filterModulo}
            onChange={(e) => setFilterModulo(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Todos os módulos</option>
            {modulos.map(m => (
              <option key={m.id} value={m.titulo}>{m.titulo}</option>
            ))}
          </select>

          {/* Filter Dificuldade */}
          <select
            value={filterDificuldade}
            onChange={(e) => setFilterDificuldade(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Todas as dificuldades</option>
            <option value="facil">Fácil</option>
            <option value="medio">Médio</option>
            <option value="dificil">Difícil</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-900">Enunciado</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-900">Aula</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-900">Dificuldade</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-900">Respostas</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-900">Taxa de Acerto</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginatedQuestoes.map((questao) => (
                <tr key={questao.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <p className="text-gray-900 line-clamp-2 max-w-md">{questao.enunciado}</p>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-gray-900 text-sm">{questao.aula_titulo}</p>
                      <p className="text-gray-500 text-xs">{questao.modulo_titulo}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getDificuldadeColor(questao.dificuldade)}`}>
                      {getDificuldadeLabel(questao.dificuldade)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-900">
                    {questao.total_respostas}
                  </td>
                  <td className="px-6 py-4">
                    {questao.total_respostas > 0 ? (
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${
                              questao.taxa_acerto >= 70 ? 'bg-green-500' :
                              questao.taxa_acerto >= 40 ? 'bg-yellow-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${questao.taxa_acerto}%` }}
                          />
                        </div>
                        <span className={`font-medium ${getTaxaColor(questao.taxa_acerto)}`}>
                          {questao.taxa_acerto}%
                        </span>
                      </div>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
            <p className="text-sm text-gray-500">
              Mostrando {startIndex + 1} a {Math.min(startIndex + itemsPerPage, filteredQuestoes.length)} de {filteredQuestoes.length}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg border border-gray-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="px-4 py-2 text-sm text-gray-600">
                Página {currentPage} de {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg border border-gray-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
