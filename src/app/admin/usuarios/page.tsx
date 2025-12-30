'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { 
  Users, 
  Search, 
  Shield, 
  ShieldOff,
  Trophy,
  Flame,
  Mail,
  Calendar,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'

interface Usuario {
  id: string
  nome_completo: string
  email: string
  xp_total: number
  nivel: number
  streak_atual: number
  role: string
  created_at: string
  ultimo_acesso: string
}

export default function UsuariosPage() {
  const supabase = createClientComponentClient()
  const [loading, setLoading] = useState(true)
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [filteredUsuarios, setFilteredUsuarios] = useState<Usuario[]>([])
  const [search, setSearch] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalUsuarios, setTotalUsuarios] = useState(0)
  const itemsPerPage = 10

  useEffect(() => {
    fetchUsuarios()
  }, [])

  useEffect(() => {
    if (search) {
      const filtered = usuarios.filter(u => 
        u.nome_completo?.toLowerCase().includes(search.toLowerCase()) ||
        u.email?.toLowerCase().includes(search.toLowerCase())
      )
      setFilteredUsuarios(filtered)
    } else {
      setFilteredUsuarios(usuarios)
    }
    setCurrentPage(1)
  }, [search, usuarios])

  async function fetchUsuarios() {
    const { data, count } = await supabase
      .from('profiles')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })

    if (data) {
      setUsuarios(data.map(u => ({
        id: u.id,
        nome_completo: u.nome_completo || 'Sem nome',
        email: u.email || '',
        xp_total: u.xp_total || 0,
        nivel: u.nivel || 1,
        streak_atual: u.streak_atual || 0,
        role: u.role || 'student',
        created_at: u.created_at,
        ultimo_acesso: u.ultimo_acesso
      })))
      setFilteredUsuarios(data)
      setTotalUsuarios(count || 0)
    }
    setLoading(false)
  }

  async function toggleAdmin(userId: string, currentRole: string) {
    const newRole = currentRole === 'admin' ? 'student' : 'admin'
    
    const { error } = await supabase
      .from('profiles')
      .update({ role: newRole })
      .eq('id', userId)

    if (!error) {
      setUsuarios(usuarios.map(u => 
        u.id === userId ? { ...u, role: newRole } : u
      ))
    }
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Nunca'
    const date = new Date(dateString)
    return date.toLocaleDateString('pt-BR', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatDateShort = (dateString: string) => {
    if (!dateString) return 'Nunca'
    const date = new Date(dateString)
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
  }

  // Pagination
  const totalPages = Math.ceil(filteredUsuarios.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedUsuarios = filteredUsuarios.slice(startIndex, startIndex + itemsPerPage)

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
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Usuários</h1>
          <p className="text-gray-500">{totalUsuarios} usuários cadastrados</p>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nome ou email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-xl w-full md:w-80 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-900">Usuário</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-900">XP / Nível</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-900">Streak</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-900">Cadastro</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-900">Último Acesso</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-900">Role</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-900">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginatedUsuarios.map((usuario) => (
                <tr key={usuario.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${
                        usuario.role === 'admin' 
                          ? 'bg-gradient-to-br from-purple-500 to-pink-600' 
                          : 'bg-gradient-to-br from-blue-500 to-cyan-600'
                      }`}>
                        {usuario.nome_completo.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{usuario.nome_completo}</p>
                        <p className="text-sm text-gray-500">{usuario.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Trophy className="w-4 h-4 text-amber-500" />
                      <span className="font-medium text-gray-900">{usuario.xp_total} XP</span>
                      <span className="text-gray-400">•</span>
                      <span className="text-gray-500">Nível {usuario.nivel}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1">
                      <Flame className={`w-4 h-4 ${usuario.streak_atual > 0 ? 'text-orange-500' : 'text-gray-300'}`} />
                      <span className={usuario.streak_atual > 0 ? 'text-gray-900' : 'text-gray-400'}>
                        {usuario.streak_atual} dias
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {formatDateShort(usuario.created_at)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {formatDateShort(usuario.ultimo_acesso)}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      usuario.role === 'admin'
                        ? 'bg-purple-100 text-purple-700'
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {usuario.role === 'admin' ? 'Admin' : 'Estudante'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => toggleAdmin(usuario.id, usuario.role)}
                      className={`p-2 rounded-lg transition-colors ${
                        usuario.role === 'admin'
                          ? 'text-purple-600 hover:bg-purple-50'
                          : 'text-gray-400 hover:bg-gray-100'
                      }`}
                      title={usuario.role === 'admin' ? 'Remover admin' : 'Tornar admin'}
                    >
                      {usuario.role === 'admin' ? (
                        <Shield className="w-5 h-5" />
                      ) : (
                        <ShieldOff className="w-5 h-5" />
                      )}
                    </button>
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
              Mostrando {startIndex + 1} a {Math.min(startIndex + itemsPerPage, filteredUsuarios.length)} de {filteredUsuarios.length}
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
