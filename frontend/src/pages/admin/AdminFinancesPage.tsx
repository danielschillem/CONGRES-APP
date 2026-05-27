import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  DollarSign,
  TrendingUp,
  Clock,
  Download,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
} from 'lucide-react'
import { adminApi } from '@/lib/api'
import { Inscription } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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

function formatAmount(amount: number) {
  return new Intl.NumberFormat('fr-FR').format(amount) + ' FCFA'
}

function HBarChart({
  items,
}: {
  items: Array<{ label: string; value: number; max: number; color: string; displayValue: string }>
}) {
  return (
    <div className="space-y-4">
      {items.map((item) => (
        <div key={item.label}>
          <div className="flex justify-between text-sm mb-1.5">
            <span className="text-gray-600">{item.label}</span>
            <span className="font-semibold text-gray-900">{item.displayValue}</span>
          </div>
          <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${item.color}`}
              style={{ width: `${item.max > 0 ? Math.round((item.value / item.max) * 100) : 0}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

export function AdminFinancesPage() {
  const [paymentFilter, setPaymentFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [page, setPage] = useState(1)

  const { data: allData } = useQuery({
    queryKey: ['admin-inscriptions-all'],
    queryFn: async () => {
      const response = await adminApi.getInscriptions({ limit: 10000 })
      return (response.data.data ?? []) as Inscription[]
    },
  })

  const queryParams: Record<string, unknown> = { page, limit: PAGE_SIZE }
  if (paymentFilter !== 'all') queryParams.payment_status = paymentFilter
  if (typeFilter !== 'all') queryParams.participation_type = typeFilter

  const { data, isLoading } = useQuery({
    queryKey: ['admin-inscriptions-finances', queryParams],
    queryFn: async () => {
      const response = await adminApi.getInscriptions(queryParams)
      return response.data
    },
  })

  const inscriptions: Inscription[] = data?.data ?? []
  const total: number = data?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const all: Inscription[] = allData ?? []

  const revenueTotal = all.reduce((s, i) => s + i.montant, 0)
  const revenueConfirmed = all
    .filter((i) => i.payment_status === 'confirmed')
    .reduce((s, i) => s + i.montant, 0)
  const revenuePending = all
    .filter((i) => i.payment_status === 'pending')
    .reduce((s, i) => s + i.montant, 0)

  const byType = ['Présentiel', 'En ligne', 'Virtuel'].map((type) => ({
    type,
    count: all.filter((i) => i.participation_type === type).length,
    revenue: all.filter((i) => i.participation_type === type).reduce((s, i) => s + i.montant, 0),
  }))

  const exportCSV = () => {
    const headers = [
      'Nom', 'Prénom', 'Email', 'Téléphone', 'Organisme', 'Pays',
      'Type participation', 'Montant (FCFA)', 'Méthode paiement',
      'N° Facture', 'Transaction ID', 'Statut paiement', 'Date inscription',
    ]
    const rows = all.map((i) => [
      i.nom, i.prenom, i.email, i.telephone, i.organisme ?? '',
      i.pays, i.participation_type, i.montant, i.methode_paiement,
      i.numero_facture, i.transaction_id ?? '', i.payment_status,
      new Date(i.created_at).toLocaleDateString('fr-FR'),
    ])
    const csv = [headers, ...rows]
      .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','))
      .join('\n')
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `finances_congres_${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const paymentBadge = (status: string) => {
    const map: Record<string, React.ReactNode> = {
      confirmed: <Badge variant="success">Confirmé</Badge>,
      pending: <Badge variant="warning">En attente</Badge>,
      failed: <Badge variant="destructive">Échoué</Badge>,
    }
    return map[status] ?? <Badge variant="secondary">{status}</Badge>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Finances</h1>
          <p className="text-gray-500 text-sm mt-1">Suivi des revenus et transactions</p>
        </div>
        <Button onClick={exportCSV} variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Exporter CSV
        </Button>
      </div>

      {/* Revenue cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Revenus totaux</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{formatAmount(revenueTotal)}</p>
                <p className="text-xs text-gray-400 mt-0.5">{all.length} inscriptions</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-50">
                <DollarSign className="h-5 w-5 text-primary-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Revenus confirmés</p>
                <p className="text-2xl font-bold text-green-700 mt-1">{formatAmount(revenueConfirmed)}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {all.filter((i) => i.payment_status === 'confirmed').length} paiements
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-50">
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Revenus en attente</p>
                <p className="text-2xl font-bold text-yellow-700 mt-1">{formatAmount(revenuePending)}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {all.filter((i) => i.payment_status === 'pending').length} paiements
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-yellow-50">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Revenue by type */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Revenus par type de participation</CardTitle>
        </CardHeader>
        <CardContent>
          <HBarChart
            items={byType.map((t) => ({
              label: `${t.type} - ${t.count} inscrit${t.count !== 1 ? 's' : ''}`,
              value: t.revenue,
              max: revenueTotal,
              color:
                t.type === 'Présentiel'
                  ? 'bg-primary-500'
                  : t.type === 'En ligne'
                  ? 'bg-blue-500'
                  : 'bg-violet-500',
              displayValue: formatAmount(t.revenue),
            }))}
          />
        </CardContent>
      </Card>

      {/* Transactions table */}
      <div>
        <div className="flex flex-wrap items-end gap-3 bg-white rounded-t-xl border border-gray-200 border-b-0 p-4">
          <div className="w-44 space-y-1.5">
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Statut</label>
            <Select value={paymentFilter} onValueChange={(v) => { setPaymentFilter(v); setPage(1) }}>
              <SelectTrigger><SelectValue placeholder="Tous" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                <SelectItem value="confirmed">Confirmé</SelectItem>
                <SelectItem value="pending">En attente</SelectItem>
                <SelectItem value="failed">Échoué</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="w-44 space-y-1.5">
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Type</label>
            <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v); setPage(1) }}>
              <SelectTrigger><SelectValue placeholder="Tous" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                <SelectItem value="Présentiel">Présentiel</SelectItem>
                <SelectItem value="En ligne">En ligne</SelectItem>
                <SelectItem value="Virtuel">Virtuel</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="bg-white rounded-b-xl border border-gray-200 overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-16 text-gray-400">
              <RefreshCw className="h-6 w-6 animate-spin mr-2" />
              Chargement...
            </div>
          ) : inscriptions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <DollarSign className="h-12 w-12 mb-3 text-gray-300" />
              <p className="font-medium text-gray-500">Aucune transaction trouvée</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Participant</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Méthode</TableHead>
                    <TableHead>N° Facture</TableHead>
                    <TableHead className="text-right">Montant</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Date</TableHead>
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
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{ins.participation_type}</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">{ins.methode_paiement}</TableCell>
                      <TableCell className="text-sm text-gray-600">{ins.numero_facture}</TableCell>
                      <TableCell className="text-right font-semibold text-gray-900">
                        {formatAmount(ins.montant)}
                      </TableCell>
                      <TableCell>{paymentBadge(ins.payment_status)}</TableCell>
                      <TableCell className="text-gray-500 whitespace-nowrap text-sm">
                        {formatDateTime(ins.created_at)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

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
    </div>
  )
}
