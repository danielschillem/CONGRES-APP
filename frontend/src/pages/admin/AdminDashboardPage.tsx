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
  Users,
  CreditCard,
  DollarSign,
  BadgeCheck,
  Award,
  ArrowRight,
} from 'lucide-react'
import { soumissionsApi, adminApi } from '@/lib/api'
import { Soumission } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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

// ─── Donut Chart ──────────────────────────────────────────────────────────────

interface DonutSegment {
  label: string
  value: number
  color: string
}

function DonutChart({
  segments,
  size = 120,
  strokeWidth = 22,
}: {
  segments: DonutSegment[]
  size?: number
  strokeWidth?: number
}) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const total = segments.reduce((s, seg) => s + seg.value, 0)
  let cumulativePercent = 0

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {total === 0 ? (
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth={strokeWidth}
        />
      ) : (
        segments.map((seg, i) => {
          const pct = seg.value / total
          if (pct === 0) return null
          const dashLength = pct * circumference
          const rotationDeg = cumulativePercent * 360 - 90
          cumulativePercent += pct
          return (
            <circle
              key={i}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={seg.color}
              strokeWidth={strokeWidth}
              strokeDasharray={`${dashLength} ${circumference - dashLength}`}
              transform={`rotate(${rotationDeg} ${size / 2} ${size / 2})`}
            />
          )
        })
      )}
      <text
        x={size / 2}
        y={size / 2}
        dominantBaseline="middle"
        textAnchor="middle"
        style={{ fontSize: 18, fontWeight: 700, fill: '#1f2937' }}
      >
        {total}
      </text>
    </svg>
  )
}

function DonutLegend({ segments }: { segments: DonutSegment[] }) {
  const total = segments.reduce((s, seg) => s + seg.value, 0)
  return (
    <div className="space-y-2">
      {segments.map((seg) => (
        <div key={seg.label} className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span
              className="inline-block h-2.5 w-2.5 rounded-full shrink-0"
              style={{ background: seg.color }}
            />
            <span className="text-xs text-gray-600">{seg.label}</span>
          </div>
          <span className="text-xs font-semibold text-gray-800">
            {seg.value}
            <span className="text-gray-400 font-normal ml-1">
              ({total > 0 ? Math.round((seg.value / total) * 100) : 0}%)
            </span>
          </span>
        </div>
      ))}
    </div>
  )
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

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

function ModuleCard({
  title,
  description,
  href,
  icon,
  color,
}: {
  title: string
  description: string
  href: string
  icon: React.ReactNode
  color: string
}) {
  return (
    <Link
      to={href}
      className="group block rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition hover:border-primary-200 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${color}`}>
            {icon}
          </div>
          <div>
            <h2 className="text-base font-semibold text-gray-900">{title}</h2>
            <p className="mt-1 text-sm leading-5 text-gray-500">{description}</p>
          </div>
        </div>
        <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-gray-400 transition group-hover:translate-x-0.5 group-hover:text-primary-600" />
      </div>
    </Link>
  )
}

function statutBadge(statut: Soumission['statut']) {
  const map = {
    'En attente': <Badge variant="warning">En attente</Badge>,
    Approuvée: <Badge variant="success">Approuvée</Badge>,
    Rejetée: <Badge variant="destructive">Rejetée</Badge>,
  }
  return map[statut]
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function AdminDashboardPage() {
  const queryClient = useQueryClient()
  const [searchParams, setSearchParams] = useSearchParams()

  const [search, setSearch] = useState(searchParams.get('search') ?? '')
  const [typeFilter, setTypeFilter] = useState(searchParams.get('type') ?? 'all')
  const [statutFilter, setStatutFilter] = useState(searchParams.get('statut') ?? 'all')
  const [page, setPage] = useState(1)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const queryParams: Record<string, unknown> = { page, limit: PAGE_SIZE }
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

  const { data: statsData } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const response = await adminApi.getStats()
      return response.data.data
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => soumissionsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-soumissions'] })
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] })
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

  const stats = {
    total: statsData?.total ?? 0,
    abstracts: statsData?.total_articles ?? 0,
    posters: statsData?.total_posters ?? 0,
    communications: statsData?.total_communications ?? 0,
    enAttente: statsData?.en_attente ?? 0,
    approuvees: statsData?.approuvees ?? 0,
    rejetees: statsData?.rejetees ?? 0,
    total_inscriptions: statsData?.total_inscriptions ?? 0,
    inscriptions_presentiel: statsData?.inscriptions_presentiel ?? 0,
    inscriptions_en_ligne: statsData?.inscriptions_en_ligne ?? 0,
    inscriptions_virtuel: statsData?.inscriptions_virtuel ?? 0,
    inscriptions_confirmees: statsData?.inscriptions_confirmees ?? 0,
    inscriptions_en_attente: statsData?.inscriptions_en_attente ?? 0,
  }

  const soumissionsSegments: DonutSegment[] = [
    { label: 'Abstracts', value: stats.abstracts, color: '#3b82f6' },
    { label: 'Posters', value: stats.posters, color: '#8b5cf6' },
    { label: 'Communications', value: stats.communications, color: '#14b8a6' },
  ]

  const statutSegments: DonutSegment[] = [
    { label: 'En attente', value: stats.enAttente, color: '#f59e0b' },
    { label: 'Approuvées', value: stats.approuvees, color: '#22c55e' },
    { label: 'Rejetées', value: stats.rejetees, color: '#ef4444' },
  ]

  const inscriptionsSegments: DonutSegment[] = [
    { label: 'Présentiel', value: stats.inscriptions_presentiel, color: '#6366f1' },
    { label: 'En ligne', value: stats.inscriptions_en_ligne, color: '#0ea5e9' },
    { label: 'Virtuel', value: stats.inscriptions_virtuel, color: '#a855f7' },
  ]

  const inscriptionsStatutSegments: DonutSegment[] = [
    { label: 'Confirmées', value: stats.inscriptions_confirmees, color: '#22c55e' },
    { label: 'En attente', value: stats.inscriptions_en_attente, color: '#f59e0b' },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Tableau de bord</h1>
        <p className="text-gray-500 text-sm mt-1">Vue d'ensemble du congrès</p>
      </div>

      {/* Modules de gestion */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <ModuleCard
          title="Gestion des finances"
          description="Suivre les revenus, les paiements confirmes et les transactions en attente."
          href="/admin/finances"
          icon={<DollarSign className="h-5 w-5 text-green-700" />}
          color="bg-green-50"
        />
        <ModuleCard
          title="Gestion des badges"
          description="Generer et imprimer les badges des participants dont le paiement est confirme."
          href="/admin/badges"
          icon={<BadgeCheck className="h-5 w-5 text-blue-700" />}
          color="bg-blue-50"
        />
        <ModuleCard
          title="Gestion des attestations"
          description="Preparer et imprimer les attestations de participation officielles."
          href="/admin/attestations"
          icon={<Award className="h-5 w-5 text-amber-700" />}
          color="bg-amber-50"
        />
      </div>

      {/* Stats — Soumissions */}
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

      {/* Stats — Inscriptions */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard
          title="Inscriptions"
          value={stats.total_inscriptions}
          icon={<Users className="h-5 w-5 text-primary-600" />}
          color="bg-primary-50"
        />
        <StatCard
          title="Présentiel"
          value={stats.inscriptions_presentiel}
          icon={<Users className="h-5 w-5 text-blue-600" />}
          color="bg-blue-50"
        />
        <StatCard
          title="En ligne"
          value={stats.inscriptions_en_ligne}
          icon={<Users className="h-5 w-5 text-violet-600" />}
          color="bg-violet-50"
        />
        <StatCard
          title="Virtuel"
          value={stats.inscriptions_virtuel}
          icon={<Users className="h-5 w-5 text-teal-600" />}
          color="bg-teal-50"
        />
        <StatCard
          title="En attente"
          value={stats.inscriptions_en_attente}
          icon={<Clock className="h-5 w-5 text-yellow-600" />}
          color="bg-yellow-50"
        />
        <StatCard
          title="Confirmées"
          value={stats.inscriptions_confirmees}
          icon={<CreditCard className="h-5 w-5 text-green-600" />}
          color="bg-green-50"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-gray-700">
              Soumissions par type
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-6">
              <DonutChart segments={soumissionsSegments} />
              <DonutLegend segments={soumissionsSegments} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-gray-700">
              Soumissions par statut
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-6">
              <DonutChart segments={statutSegments} />
              <DonutLegend segments={statutSegments} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-gray-700">
              Inscriptions par type
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-6">
              <DonutChart segments={inscriptionsSegments} />
              <DonutLegend segments={inscriptionsSegments} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-gray-700">
              Inscriptions — statut paiement
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-6">
              <DonutChart segments={inscriptionsStatutSegments} />
              <DonutLegend segments={inscriptionsStatutSegments} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-3 bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex-1 min-w-[200px] space-y-1.5">
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            Recherche
          </label>
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
          <Select
            value={typeFilter}
            onValueChange={(v) => {
              setTypeFilter(v)
              setPage(1)
            }}
          >
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
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            Statut
          </label>
          <Select
            value={statutFilter}
            onValueChange={(v) => {
              setStatutFilter(v)
              setPage(1)
            }}
          >
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
