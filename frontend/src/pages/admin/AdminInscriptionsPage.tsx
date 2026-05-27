import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Users,
  Globe,
  FileDown,
  CheckCircle2,
} from 'lucide-react'
import { adminApi } from '@/lib/api'
import { Inscription } from '@/types'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
import { formatDateTime } from '@/lib/utils'

const PAGE_SIZE = 10

function paymentBadge(status: string) {
  const map: Record<string, React.ReactNode> = {
    confirmed: <Badge variant="success">Confirmé</Badge>,
    pending: <Badge variant="warning">En attente</Badge>,
    failed: <Badge variant="destructive">Échoué</Badge>,
  }
  return map[status] ?? <Badge variant="secondary">{status}</Badge>
}

export function AdminInscriptionsPage() {
  const queryClient = useQueryClient()
  const [typeFilter, setTypeFilter] = useState('all')
  const [paymentFilter, setPaymentFilter] = useState('all')
  const [page, setPage] = useState(1)

  const confirmMutation = useMutation({
    mutationFn: (id: number) => adminApi.confirmPayment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-inscriptions'] })
    },
  })

  const queryParams: Record<string, unknown> = { page, limit: PAGE_SIZE }
  if (typeFilter !== 'all') queryParams.participation_type = typeFilter
  if (paymentFilter !== 'all') queryParams.payment_status = paymentFilter

  const { data, isLoading } = useQuery({
    queryKey: ['admin-inscriptions', queryParams],
    queryFn: async () => {
      const response = await adminApi.getInscriptions(queryParams)
      return response.data
    },
  })

  const inscriptions: Inscription[] = data?.data ?? []
  const total: number = data?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  const handleExportCSV = async () => {
    try {
      const exportParams: Record<string, unknown> = {}
      if (typeFilter !== 'all') exportParams.participation_type = typeFilter
      if (paymentFilter !== 'all') exportParams.payment_status = paymentFilter
      const response = await adminApi.exportInscriptionsCSV(exportParams)
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.download = `inscriptions_${new Date().toISOString().slice(0, 10)}.csv`
      link.click()
      window.URL.revokeObjectURL(url)
    } catch {
      // handle silently
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Inscriptions</h1>
        <p className="text-gray-500 text-sm mt-1">Gestion des inscriptions au congrès</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-3 bg-white rounded-xl border border-gray-200 p-4">
        <div className="w-44 space-y-1.5">
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Type</label>
          <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v); setPage(1) }}>
            <SelectTrigger>
              <SelectValue placeholder="Tous" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous</SelectItem>
              <SelectItem value="Présentiel">Présentiel</SelectItem>
              <SelectItem value="En ligne">En ligne</SelectItem>
              <SelectItem value="Virtuel">Virtuel</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="w-44 space-y-1.5">
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Paiement</label>
          <Select value={paymentFilter} onValueChange={(v) => { setPaymentFilter(v); setPage(1) }}>
            <SelectTrigger>
              <SelectValue placeholder="Tous" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous</SelectItem>
              <SelectItem value="confirmed">Confirmé</SelectItem>
              <SelectItem value="pending">En attente</SelectItem>
              <SelectItem value="failed">Échoué</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button variant="outline" onClick={handleExportCSV}>
          <FileDown className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16 text-gray-400">
            <RefreshCw className="h-6 w-6 animate-spin mr-2" />
            Chargement...
          </div>
        ) : inscriptions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <Users className="h-12 w-12 mb-3 text-gray-300" />
            <p className="font-medium text-gray-500">Aucune inscription trouvée</p>
            <p className="text-sm mt-1">Essayez de modifier vos critères de filtre.</p>
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Inscrit</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Pays</TableHead>
                  <TableHead>Facture</TableHead>
                  <TableHead>Paiement</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inscriptions.map((ins) => (
                  <TableRow key={ins.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium text-sm text-gray-900">
                          {ins.prenom} {ins.nom}
                        </p>
                        <p className="text-xs text-gray-400">{ins.email}</p>
                        <p className="text-xs text-gray-400">{ins.telephone}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{ins.participation_type}</Badge>
                    </TableCell>
                    <TableCell>
                      <span className="flex items-center gap-1 text-sm text-gray-600">
                        <Globe className="h-3.5 w-3.5 text-gray-400" />
                        {ins.pays}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-gray-600">{ins.numero_facture}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        {paymentBadge(ins.payment_status)}
                        <span className="text-xs text-gray-400">
                          {ins.montant.toLocaleString('fr-FR')} FCFA
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-gray-500 whitespace-nowrap text-sm">
                      {formatDateTime(ins.created_at)}
                    </TableCell>
                    <TableCell className="text-right">
                      {ins.payment_status === 'confirmed' ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-green-700">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Confirmé
                        </span>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-green-700 border-green-200 hover:bg-green-50"
                          loading={confirmMutation.isPending && confirmMutation.variables === ins.id}
                          onClick={() => confirmMutation.mutate(ins.id)}
                        >
                          <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
                          Confirmer
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
