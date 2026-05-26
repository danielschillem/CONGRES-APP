import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  BadgeCheck,
  Printer,
  Search,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Users,
} from 'lucide-react'
import { adminApi } from '@/lib/api'
import { Inscription } from '@/types'
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
import { formatDate } from '@/lib/utils'

const PAGE_SIZE = 20

const CONGRESS_NAME = 'Congrès Scientifique International 2025'
const CONGRESS_DATES = '15–18 Octobre 2025'
const CONGRESS_LOCATION = 'Kinshasa, RDC'

function badgeTypeColor(type: string) {
  const map: Record<string, string> = {
    'Présentiel': '#1e40af',
    'En ligne': '#0369a1',
    'Virtuel': '#6d28d9',
  }
  return map[type] ?? '#374151'
}

function openBadgePrintWindow(inscriptions: Inscription[]) {
  const pw = window.open('', '_blank', 'width=900,height=700')
  if (!pw) return

  const badgesHtml = inscriptions
    .map(
      (ins) => `
    <div class="badge">
      <div class="badge-header" style="background:${badgeTypeColor(ins.participation_type)}">
        ${CONGRESS_NAME}
      </div>
      <div class="badge-body">
        <div class="badge-name">${ins.prenom} ${ins.nom}</div>
        ${ins.organisme ? `<div class="badge-org">${ins.organisme}</div>` : ''}
        <div class="badge-type-row">
          <span class="badge-type-pill" style="background:${badgeTypeColor(ins.participation_type)}20; color:${badgeTypeColor(ins.participation_type)}; border:1px solid ${badgeTypeColor(ins.participation_type)}40">
            ${ins.participation_type}
          </span>
        </div>
      </div>
      <div class="badge-footer">
        <span>${CONGRESS_DATES} • ${CONGRESS_LOCATION}</span>
        <span>${ins.numero_facture}</span>
      </div>
    </div>
  `
    )
    .join('')

  pw.document.write(`
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8" />
      <title>Badges — ${CONGRESS_NAME}</title>
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
          font-family: Arial, Helvetica, sans-serif;
          background: #f3f4f6;
          padding: 20px;
        }
        .controls {
          text-align: center;
          margin-bottom: 20px;
        }
        .controls button {
          background: #1e40af;
          color: white;
          border: none;
          padding: 10px 24px;
          border-radius: 6px;
          font-size: 14px;
          cursor: pointer;
          margin: 0 6px;
        }
        .controls button.secondary {
          background: #6b7280;
        }
        .badges-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, 85mm);
          gap: 12px;
          justify-content: center;
        }
        .badge {
          width: 85mm;
          height: 54mm;
          background: white;
          border: 2px solid #d1d5db;
          border-radius: 8px;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          page-break-inside: avoid;
        }
        .badge-header {
          color: white;
          font-size: 7.5px;
          font-weight: bold;
          text-align: center;
          padding: 5px 8px;
          letter-spacing: 0.5px;
          text-transform: uppercase;
        }
        .badge-body {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 8px 12px;
          text-align: center;
        }
        .badge-name {
          font-size: 16px;
          font-weight: bold;
          color: #111827;
          line-height: 1.2;
        }
        .badge-org {
          font-size: 9px;
          color: #6b7280;
          margin-top: 3px;
        }
        .badge-type-row {
          margin-top: 8px;
        }
        .badge-type-pill {
          font-size: 9px;
          font-weight: bold;
          padding: 2px 10px;
          border-radius: 999px;
        }
        .badge-footer {
          display: flex;
          justify-content: space-between;
          font-size: 7px;
          color: #9ca3af;
          padding: 4px 8px;
          border-top: 1px solid #f3f4f6;
        }
        @media print {
          body { background: white; padding: 5mm; }
          .controls { display: none; }
          .badge { border-color: #9ca3af; }
        }
      </style>
    </head>
    <body>
      <div class="controls">
        <button onclick="window.print()">🖨️ Imprimer tous les badges</button>
        <button class="secondary" onclick="window.close()">Fermer</button>
      </div>
      <div class="badges-grid">
        ${badgesHtml}
      </div>
    </body>
    </html>
  `)
  pw.document.close()
}

export function AdminBadgesPage() {
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [page, setPage] = useState(1)

  const queryParams: Record<string, unknown> = {
    page,
    limit: PAGE_SIZE,
    payment_status: 'confirmed',
  }
  if (typeFilter !== 'all') queryParams.participation_type = typeFilter

  const { data, isLoading } = useQuery({
    queryKey: ['admin-badges', queryParams],
    queryFn: async () => {
      const response = await adminApi.getInscriptions(queryParams)
      return response.data
    },
  })

  const { data: allConfirmedData } = useQuery({
    queryKey: ['admin-badges-all'],
    queryFn: async () => {
      const response = await adminApi.getInscriptions({ payment_status: 'confirmed', limit: 10000 })
      return (response.data.data ?? []) as Inscription[]
    },
  })

  const allInscriptions: Inscription[] = data?.data ?? []
  const total: number = data?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  const filtered = search
    ? allInscriptions.filter(
        (i) =>
          `${i.prenom} ${i.nom}`.toLowerCase().includes(search.toLowerCase()) ||
          i.email.toLowerCase().includes(search.toLowerCase()) ||
          (i.organisme ?? '').toLowerCase().includes(search.toLowerCase())
      )
    : allInscriptions

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Badges participants</h1>
          <p className="text-gray-500 text-sm mt-1">
            Génération et impression des badges pour les participants confirmés
          </p>
        </div>
        <Button
          onClick={() => allConfirmedData && openBadgePrintWindow(allConfirmedData)}
          disabled={!allConfirmedData?.length}
        >
          <Printer className="h-4 w-4 mr-2" />
          Imprimer tous ({allConfirmedData?.length ?? 0})
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-3 bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex-1 min-w-[200px] space-y-1.5">
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Recherche</label>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Nom, email, organisme..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
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

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16 text-gray-400">
            <RefreshCw className="h-6 w-6 animate-spin mr-2" />
            Chargement...
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <Users className="h-12 w-12 mb-3 text-gray-300" />
            <p className="font-medium text-gray-500">Aucun participant confirmé</p>
            <p className="text-sm mt-1">Les badges ne sont générés que pour les paiements confirmés.</p>
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Participant</TableHead>
                  <TableHead>Organisme</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Pays</TableHead>
                  <TableHead>N° Facture</TableHead>
                  <TableHead>Inscrit le</TableHead>
                  <TableHead className="text-right">Badge</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((ins) => (
                  <TableRow key={ins.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium text-sm text-gray-900">
                          {ins.prenom} {ins.nom}
                        </p>
                        <p className="text-xs text-gray-400">{ins.email}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">{ins.organisme ?? '—'}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{ins.participation_type}</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">{ins.pays}</TableCell>
                    <TableCell className="text-sm text-gray-600">{ins.numero_facture}</TableCell>
                    <TableCell className="text-gray-500 text-sm whitespace-nowrap">
                      {formatDate(ins.created_at)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openBadgePrintWindow([ins])}
                      >
                        <Printer className="h-3.5 w-3.5 mr-1.5" />
                        Imprimer
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <div className="flex items-center justify-between border-t border-gray-100 px-4 py-3">
              <p className="text-sm text-gray-500">
                {total} participant{total !== 1 ? 's' : ''} confirmé{total !== 1 ? 's' : ''} — Page{' '}
                {page} / {totalPages}
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

      <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
        <div className="flex items-start gap-3">
          <BadgeCheck className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
          <div className="text-sm text-blue-800">
            <p className="font-semibold">Format badge : 85 × 54 mm (carte de visite)</p>
            <p className="mt-1 text-blue-700">
              Seuls les participants dont le paiement est <strong>confirmé</strong> apparaissent ici.
              Utilisez du papier cartonné 250 g/m² pour un rendu optimal.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
