import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  FileText,
  FilePlus,
  Presentation,
  BookOpen,
  Eye,
  Pencil,
  Trash2,
  RefreshCw,
} from 'lucide-react'
import { soumissionsApi } from '@/lib/api'
import { Soumission, SoumissionStats } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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

export function DashboardPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const { data, isLoading, error } = useQuery({
    queryKey: ['my-soumissions'],
    queryFn: async () => {
      const response = await soumissionsApi.getMy()
      return response.data
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => soumissionsApi.deleteMy(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-soumissions'] })
      setDeleteId(null)
    },
  })

  const soumissions: Soumission[] = data?.data ?? []

  const stats: SoumissionStats = {
    total: soumissions.length,
    abstracts: soumissions.filter((s) => s.submission_type === 'Abstract').length,
    posters: soumissions.filter((s) => s.submission_type === 'Poster').length,
    communications: soumissions.filter((s) => s.submission_type === 'Communication').length,
    enAttente: soumissions.filter((s) => s.statut === 'En attente').length,
    approuvees: soumissions.filter((s) => s.statut === 'Approuvée').length,
    rejetees: soumissions.filter((s) => s.statut === 'Rejetée').length,
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mes soumissions</h1>
          <p className="text-gray-500 text-sm mt-1">
            Gérez vos articles, posters et communications
          </p>
        </div>
        <Button onClick={() => navigate('/soumission/nouveau')} className="gap-2">
          <FilePlus className="h-4 w-4" />
          Nouvelle soumission
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard
          title="Total"
          value={stats.total}
          icon={<FileText className="h-6 w-6 text-primary-600" />}
          color="bg-primary-50"
        />
        <StatCard
          title="Articles"
          value={stats.abstracts}
          icon={<BookOpen className="h-6 w-6 text-blue-600" />}
          color="bg-blue-50"
        />
        <StatCard
          title="Posters"
          value={stats.posters}
          icon={<Presentation className="h-6 w-6 text-violet-600" />}
          color="bg-violet-50"
        />
        <StatCard
          title="Communications"
          value={stats.communications}
          icon={<FileText className="h-6 w-6 text-teal-600" />}
          color="bg-teal-50"
        />
      </div>

      {/* Table */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base">Liste de vos soumissions</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-16 text-gray-400">
              <RefreshCw className="h-6 w-6 animate-spin mr-2" />
              Chargement...
            </div>
          ) : error ? (
            <div className="py-16 text-center text-red-500">
              Erreur lors du chargement des soumissions.
            </div>
          ) : soumissions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <FileText className="h-12 w-12 mb-3 text-gray-300" />
              <p className="font-medium text-gray-500">Aucune soumission pour l'instant</p>
              <p className="text-sm mt-1">Commencez par soumettre un article ou un poster.</p>
              <Button
                className="mt-4"
                onClick={() => navigate('/soumission/nouveau')}
              >
                <FilePlus className="h-4 w-4 mr-2" />
                Nouvelle soumission
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Titre</TableHead>
                  <TableHead>Thème</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {soumissions.map((soumission) => (
                  <TableRow key={soumission.id}>
                    <TableCell>
                      <Badge variant="secondary">{soumission.submission_type}</Badge>
                    </TableCell>
                    <TableCell className="font-medium max-w-[200px]">
                      {truncate(soumission.document_title, 50)}
                    </TableCell>
                    <TableCell className="text-gray-500 max-w-[150px]">
                      {truncate(soumission.theme, 30)}
                    </TableCell>
                    <TableCell>{statutBadge(soumission.statut)}</TableCell>
                    <TableCell className="text-gray-500 whitespace-nowrap">
                      {formatDate(soumission.created_at)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link to={`/soumission/${soumission.id}`}>
                          <Button variant="ghost" size="icon" title="Voir">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                        {soumission.statut === 'En attente' && (
                          <Link to={`/soumission/${soumission.id}/modifier`}>
                            <Button variant="ghost" size="icon" title="Modifier">
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </Link>
                        )}
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
          )}
        </CardContent>
      </Card>

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
