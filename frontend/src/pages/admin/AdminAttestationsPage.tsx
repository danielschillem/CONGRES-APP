import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Award,
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
const ISSUE_DATE = new Date().toLocaleDateString('fr-FR', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})

function openAttestationPrintWindow(inscriptions: Inscription[]) {
  const pw = window.open('', '_blank', 'width=1000,height=800')
  if (!pw) return

  const pagesHtml = inscriptions
    .map(
      (ins) => `
    <div class="page">
      <div class="border-outer">
        <div class="border-inner">

          <div class="logo-area">
            <div class="logo-circle">CS</div>
            <div class="logo-text">${CONGRESS_NAME}</div>
          </div>

          <div class="title">ATTESTATION DE PARTICIPATION</div>

          <div class="body-text">
            <p class="line1">Nous soussignés, organisateurs du</p>
            <p class="congress-ref">${CONGRESS_NAME}</p>
            <p class="congress-dates">${CONGRESS_DATES} — ${CONGRESS_LOCATION}</p>
            <p class="line2">certifions que</p>
            <p class="participant-name">${ins.prenom} ${ins.nom}</p>
            ${ins.organisme ? `<p class="participant-org">${ins.organisme}</p>` : ''}
            <p class="line3">
              a participé à notre congrès en qualité de
              <strong>${ins.participation_type}</strong>
              et a satisfait à toutes les conditions de participation.
            </p>
          </div>

          <div class="footer">
            <div class="signature-block">
              <div class="sig-line"></div>
              <div class="sig-label">Le Président du Comité Organisateur</div>
            </div>
            <div class="attestation-info">
              <p>Délivrée le ${ISSUE_DATE}</p>
              <p>Réf : ${ins.numero_facture}</p>
            </div>
          </div>

        </div>
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
      <title>Attestations — ${CONGRESS_NAME}</title>
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
          font-family: 'Georgia', serif;
          background: #f3f4f6;
          padding: 20px;
        }
        .controls {
          text-align: center;
          margin-bottom: 24px;
        }
        .controls button {
          background: #1e40af;
          color: white;
          border: none;
          padding: 10px 28px;
          border-radius: 6px;
          font-size: 14px;
          cursor: pointer;
          margin: 0 6px;
        }
        .controls button.secondary {
          background: #6b7280;
        }
        .page {
          width: 210mm;
          min-height: 297mm;
          background: white;
          margin: 0 auto 24px;
          page-break-after: always;
        }
        .border-outer {
          width: 100%;
          min-height: 297mm;
          padding: 10mm;
          border: 6px double #1e40af;
        }
        .border-inner {
          width: 100%;
          min-height: calc(297mm - 20mm - 12px);
          padding: 12mm 16mm;
          border: 1.5px solid #bfdbfe;
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .logo-area {
          display: flex;
          flex-direction: column;
          align-items: center;
          margin-bottom: 12mm;
        }
        .logo-circle {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          background: #1e40af;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 22px;
          font-weight: bold;
          font-family: Arial, sans-serif;
          margin-bottom: 8px;
        }
        .logo-text {
          font-size: 11px;
          color: #1e40af;
          font-family: Arial, sans-serif;
          letter-spacing: 1px;
          text-transform: uppercase;
          text-align: center;
        }
        .title {
          font-size: 26px;
          font-weight: bold;
          color: #1e3a8a;
          letter-spacing: 2px;
          text-align: center;
          text-transform: uppercase;
          border-bottom: 2px solid #bfdbfe;
          padding-bottom: 8px;
          margin-bottom: 14mm;
          width: 100%;
        }
        .body-text {
          text-align: center;
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
        }
        .line1, .line2, .line3 {
          font-size: 14px;
          color: #374151;
          line-height: 1.6;
        }
        .line3 { max-width: 420px; margin-top: 10px; }
        .congress-ref {
          font-size: 16px;
          font-weight: bold;
          color: #1e40af;
          margin: 4px 0;
        }
        .congress-dates {
          font-size: 13px;
          color: #6b7280;
          font-style: italic;
          margin-bottom: 10px;
        }
        .participant-name {
          font-size: 28px;
          font-weight: bold;
          color: #1e3a8a;
          margin: 8px 0 4px;
          letter-spacing: 1px;
        }
        .participant-org {
          font-size: 14px;
          color: #6b7280;
          font-style: italic;
          margin-bottom: 6px;
        }
        .footer {
          width: 100%;
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          margin-top: 16mm;
          padding-top: 8mm;
          border-top: 1px dashed #d1d5db;
        }
        .signature-block {
          text-align: center;
        }
        .sig-line {
          width: 140px;
          height: 1px;
          background: #374151;
          margin: 0 auto 6px;
        }
        .sig-label {
          font-size: 11px;
          color: #374151;
        }
        .attestation-info {
          font-size: 11px;
          color: #9ca3af;
          text-align: right;
          line-height: 1.7;
        }
        @media print {
          body { background: white; padding: 0; }
          .controls { display: none; }
          .page { margin: 0; box-shadow: none; }
        }
      </style>
    </head>
    <body>
      <div class="controls">
        <button onclick="window.print()">🖨️ Imprimer toutes les attestations</button>
        <button class="secondary" onclick="window.close()">Fermer</button>
      </div>
      ${pagesHtml}
    </body>
    </html>
  `)
  pw.document.close()
}

export function AdminAttestationsPage() {
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
    queryKey: ['admin-attestations', queryParams],
    queryFn: async () => {
      const response = await adminApi.getInscriptions(queryParams)
      return response.data
    },
  })

  const { data: allConfirmedData } = useQuery({
    queryKey: ['admin-attestations-all'],
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
          <h1 className="text-2xl font-bold text-gray-900">Attestations de participation</h1>
          <p className="text-gray-500 text-sm mt-1">
            Génération et impression des attestations pour les participants confirmés
          </p>
        </div>
        <Button
          onClick={() => allConfirmedData && openAttestationPrintWindow(allConfirmedData)}
          disabled={!allConfirmedData?.length}
        >
          <Printer className="h-4 w-4 mr-2" />
          Imprimer toutes ({allConfirmedData?.length ?? 0})
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
            <p className="text-sm mt-1">
              Les attestations ne sont générées que pour les paiements confirmés.
            </p>
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
                  <TableHead className="text-right">Attestation</TableHead>
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
                        onClick={() => openAttestationPrintWindow([ins])}
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

      <div className="rounded-xl border border-amber-100 bg-amber-50 p-4">
        <div className="flex items-start gap-3">
          <Award className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
          <div className="text-sm text-amber-800">
            <p className="font-semibold">Format attestation : A4 portrait</p>
            <p className="mt-1 text-amber-700">
              Imprimez sur du papier blanc A4 de qualité (90 g/m²). Seuls les participants dont le
              paiement est <strong>confirmé</strong> peuvent recevoir une attestation officielle.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
