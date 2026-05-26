import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  FileText,
  BookOpen,
  Presentation,
  CheckCircle2,
  Clock,
  Search,
  Eye,
  Download,
  Trash2,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { soumissionsApi } from '@/lib/api'
import { Soumission } from '@/types'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { formatDate, truncate } from '@/lib/utils'

const PAGE_SIZE = 10

function StatCard({
  title,
  value,
  icon,
  color,
}: {
  title: string
  value: number
  icon: React.ReactNode
  color: string
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">{title}</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
          </div>
          <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${color}`}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function statutBadge(statut: Soumission['statut']) {
  const map = {
    'En attente': <Badge variant="warning">En attente</Badge>,
    'Approuvée': <Badge variant="success">Approuvée</Badge>,
    'Rejetée': <Badge variant="destructive">Rejetée</Badge>,
  }
  return map[statut]
}

export function AdminDashboardPage() {
  const queryClient = useQueryClient()
  const [searchParams, setSearchParams] = useSearchParams()

  const [search, setSearch] = useState(searchParams.get('search') ?? '')
  const [typeFilter, setTypeFilter] = useState(searchParams.get('type') ?? 'all')
  const [statutFilter, setStatutFilter] = useState(searchParams.get('statut') ?? 'all')
  const [page, setPage] = useState(1)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const queryParams: Record<string, unknown> = {
    page,
    limit: PAGE_SIZE,
  }
  if (search) queryParams.search = search
  if (typeFilter !== 'all') queryParams.submission_type = typeFilter
  if (statutFilter !== 'all') queryParams.statut = statutFilter

  const { data, isLoading } = useQuery({
    queryKey: ['admin-soumissions', queryParams],
    queryFn: async () => {
      const response = await soumissionsApi.getAll(queryParams)
      return response.data
    },
  })

  // Stats query (no filters)
  const { data: statsData } = useQuery({
    queryKey: ['admin-soumissions-stats'],
    queryFn: async () => {
      const response = await soumissionsApi.getAll({ limit: 9999 })
      return response.data
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => soumissionsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-soumissions'] })
      queryClient.invalidateQueries({ queryKey: ['admin-soumissions-stats'] })
      setDeleteId(null)
    },
  })

  const handleDownload = async (soumission: Soumission) => {
    try {
      const response = await soumissionsApi.download(soumission.id)
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.download = `${soumission.document_title.replace(/\s+/g, '_')}.pdf`
      link.click()
      window.URL.revokeObjectURL(url)
    } catch {
      // handle silently
    }
  }

  const handleSearch = () => {
    setPage(1)
    const params: Record<string, string> = {}
    if (search) params.search = search
    if (typeFilter !== 'all') params.type = typeFilter
    if (statutFilter !== 'all') params.statut = statutFilter
    setSearchParams(params)
  }

  const soumissions: Soumission[] = data?.data ?? []
  const total: number = data?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  const allSoumissions: Soumission[] = statsData?.data ?? []
  const stats = {
    total: statsData?.total ?? allSoumissions.length,
    abstracts: allSoumissions.filter((s) => s.submission_type === 'Abstract').length,
    posters: allSoumissions.filter((s) => s.submission_type === 'Poster').length,
    communications: allSoumissions.filter((s) => s.submission_type === 'Communication').length,
    enAttente: allSoumissions.filter((s) => s.statut === 'En attente').length,
    approuvees: allSoumissions.filter((s) => s.statut === 'Approuvée').length,
    rejetees: allSoumissions.filter((s) => s.statut === 'Rejetée').length,
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Tableau de bord</h1>
        <p className="text-gray-500 text-sm mt-1">Vue d'ensemble de toutes les soumissions</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard
          title="Total"
          value={stats.total}
          icon={<FileText className="h-5 w-5 text-primary-600" />}
          color="bg-primary-50"
        />
        <StatCard
          title="Abstracts"
          value={stats.abstracts}
          icon={<BookOpen className="h-5 w-5 text-blue-600" />}
          color="bg-blue-50"
        />
        <StatCard
          title="Posters"
          value={stats.posters}
          icon={<Presentation className="h-5 w-5 text-violet-600" />}
          color="bg-violet-50"
        />
        <StatCard
          title="Communic."
          value={stats.communications}
          icon={<FileText className="h-5 w-5 text-teal-600" />}
          color="bg-teal-50"
        />
        <StatCard
          title="En attente"
          value={stats.enAttente}
          icon={<Clock className="h-5 w-5 text-yellow-600" />}
          color="bg-yellow-50"
        />
        <StatCard
          title="Approuvées"
          value={stats.approuvees}
          icon={<CheckCircle2 className="h-5 w-5 text-green-600" />}
          color="bg-green-50"
        />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-3 bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex-1 min-w-[200px] space-y-1.5">
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Recherche</label>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Titre, auteur, thème..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="pl-9"
            />
          </div>
        </div>

        <div className="w-40 space-y-1.5">
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Type</label>
          <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v); setPage(1) }}>
            <SelectTrigger>
              <SelectValue placeholder="Tous les types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous</SelectItem>
              <SelectItem value="Abstract">Abstract</SelectItem>
              <SelectItem value="Poster">Poster</SelectItem>
              <SelectItem value="Communication">Communication</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="w-40 space-y-1.5">
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Statut</label>
          <Select value={statutFilter} onValueChange={(v) => { setStatutFilter(v); setPage(1) }}>
            <SelectTrigger>
              <SelectValue placeholder="Tous les statuts" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous</SelectItem>
              <SelectItem value="En attente">En attente</SelectItem>
              <SelectItem value="Approuvée">Approuvée</SelectItem>
              <SelectItem value="Rejetée">Rejetée</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button onClick={handleSearch}>
          <Search className="h-4 w-4 mr-2" />
          Filtrer
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            setSearch('')
            setTypeFilter('all')
            setStatutFilter('all')
            setPage(1)
            setSearchParams({})
          }}
        >
          Réinitialiser
        </Button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16 text-gray-400">
            <RefreshCw className="h-6 w-6 animate-spin mr-2" />
            Chargement...
          </div>
        ) : soumissions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <FileText className="h-12 w-12 mb-3 text-gray-300" />
            <p className="font-medium text-gray-500">Aucune soumission trouvée</p>
            <p className="text-sm mt-1">Essayez de modifier vos critères de filtre.</p>
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Auteur</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Titre</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {soumissions.map((soumission) => (
                  <TableRow key={soumission.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium text-sm text-gray-900">
                          {soumission.user
                            ? `${soumission.user.prenom} ${soumission.user.nom}`
                            : soumission.author_name}
                        </p>
                        {soumission.user && (
                          <p className="text-xs text-gray-400">{soumission.user.email}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{soumission.submission_type}</Badge>
                    </TableCell>
                    <TableCell className="max-w-[200px]">
                      <p className="text-sm font-medium text-gray-900">
                        {truncate(soumission.document_title, 40)}
                      </p>
                      <p className="text-xs text-gray-400">{truncate(soumission.theme, 30)}</p>
                    </TableCell>
                    <TableCell>{statutBadge(soumission.statut)}</TableCell>
                    <TableCell className="text-gray-500 whitespace-nowrap text-sm">
                      {formatDate(soumission.created_at)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link to={`/admin/soumissions/${soumission.id}`}>
                          <Button variant="ghost" size="icon" title="Voir">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Télécharger"
                          onClick={() => handleDownload(soumission)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          title="Supprimer"
                          onClick={() => setDeleteId(soumission.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* Pagination */}
            <div className="flex items-center justify-between border-t border-gray-100 px-4 py-3">
              <p className="text-sm text-gray-500">
                {total} résultat{total !== 1 ? 's' : ''} — Page {page} / {totalPages}
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

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteId !== null} onOpenChange={(open) => !open && setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmer la suppression</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer cette soumission ? Cette action est irréversible.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteId(null)}>
              Annuler
            </Button>
            <Button
              variant="destructive"
              loading={deleteMutation.isPending}
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
            >
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
