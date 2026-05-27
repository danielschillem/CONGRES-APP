import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Search,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Users,
  UserCheck,
  UserX,
  Mail,
  Phone,
  Shield,
  Calendar,
} from 'lucide-react'
import { adminApi } from '@/lib/api'
import { User } from '@/types'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatDate } from '@/lib/utils'

const PAGE_SIZE = 10

export function AdminUsersPage() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  const queryParams: Record<string, unknown> = { page, limit: PAGE_SIZE }
  if (search) queryParams.search = search

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', queryParams],
    queryFn: async () => {
      const response = await adminApi.getUsers(queryParams)
      return response.data
    },
  })

  const deactivateMutation = useMutation({
    mutationFn: (userId: string) => adminApi.deactivateUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
    },
  })

  const users: User[] = data?.data ?? []
  const total: number = data?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Utilisateurs</h1>
        <p className="text-gray-500 text-sm mt-1">Gestion des comptes utilisateurs</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-3 bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex-1 min-w-[200px] space-y-1.5">
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Recherche</label>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Nom, prénom, email..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              className="pl-9"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16 text-gray-400">
            <RefreshCw className="h-6 w-6 animate-spin mr-2" />
            Chargement...
          </div>
        ) : users.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <Users className="h-12 w-12 mb-3 text-gray-300" />
            <p className="font-medium text-gray-500">Aucun utilisateur trouvé</p>
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Utilisateur</TableHead>
                  <TableHead>Rôle</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Inscrit le</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-100 text-primary-700 font-semibold text-sm shrink-0">
                          {user.prenom?.[0]?.toUpperCase()}{user.nom?.[0]?.toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-sm text-gray-900">
                            {user.civilite} {user.prenom} {user.nom}
                          </p>
                          {user.organisme && (
                            <p className="text-xs text-gray-400">{user.organisme}</p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {user.role === 'super_admin' ? (
                        <Badge variant="secondary" className="flex items-center gap-1 w-fit">
                          <Shield className="h-3 w-3" /> Super Admin
                        </Badge>
                      ) : user.role === 'congress_admin' ? (
                        <Badge variant="secondary" className="flex items-center gap-1 w-fit">
                          <Shield className="h-3 w-3" /> Congrès Admin
                        </Badge>
                      ) : user.role === 'reviewer' ? (
                        <Badge variant="outline" className="flex items-center gap-1 w-fit">
                          Reviewer
                        </Badge>
                      ) : user.role === 'finance_manager' ? (
                        <Badge variant="outline" className="flex items-center gap-1 w-fit">
                          Finances
                        </Badge>
                      ) : user.role === 'support' ? (
                        <Badge variant="outline" className="flex items-center gap-1 w-fit">
                          Support
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="w-fit">Utilisateur</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-0.5">
                        <span className="flex items-center gap-1 text-sm text-gray-600">
                          <Mail className="h-3.5 w-3.5 text-gray-400" />
                          {user.email}
                        </span>
                        <span className="flex items-center gap-1 text-sm text-gray-600">
                          <Phone className="h-3.5 w-3.5 text-gray-400" />
                          {user.telephone}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-gray-500 whitespace-nowrap text-sm">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5 text-gray-400" />
                        {formatDate(user.created_at)}
                      </span>
                    </TableCell>
                    <TableCell>
                      {user.active !== false ? (
                        <Badge variant="success" className="flex items-center gap-1 w-fit">
                          <UserCheck className="h-3 w-3" /> Actif
                        </Badge>
                      ) : (
                        <Badge variant="destructive" className="flex items-center gap-1 w-fit">
                          <UserX className="h-3 w-3" /> Inactif
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {user.role !== 'super_admin' && (
                        <Button
                          variant={user.active !== false ? "outline" : "default"}
                          size="sm"
                          loading={deactivateMutation.isPending}
                          onClick={() => deactivateMutation.mutate(user.id)}
                        >
                          {user.active !== false ? 'Désactiver' : 'Réactiver'}
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* Pagination */}
            <div className="flex items-center justify-between border-t border-gray-100 px-4 py-3">
              <p className="text-sm text-gray-500">
                {total} résultat{total !== 1 ? 's' : ''} - Page {page} / {totalPages}
              </p>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Précédent
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                >
                  Suivant
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
