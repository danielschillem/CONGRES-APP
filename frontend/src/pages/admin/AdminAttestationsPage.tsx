import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Award,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Printer,
  RefreshCw,
  Search,
  Users,
} from 'lucide-react'
import { adminApi, superApi } from '@/lib/api'
import { useAuth } from '@/hooks/useAuth'
import { Congress, Inscription } from '@/types'
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

const ISSUE_DATE = new Date().toLocaleDateString('fr-FR', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})

function getCongressTitle(inscription: Inscription, fallback?: Congress) {
  return inscription.congress?.title ?? fallback?.title ?? 'Congrès scientifique'
}

function getCongressDates(inscription: Inscription, fallback?: Congress) {
  const congress = inscription.congress ?? fallback
  if (!congress) return ''
  return `${formatDate(congress.start_date)} - ${formatDate(congress.end_date)}`
}

function getCongressLocation(inscription: Inscription, fallback?: Congress) {
  const congress = inscription.congress ?? fallback
  if (!congress) return ''
  return [congress.location, congress.city, congress.country].filter(Boolean).join(', ')
}

function getPresident(congress?: Congress) {
  const org = congress?.organisational_structure ?? {}
  return typeof org.president === 'string' && org.president.trim() ? org.president : 'Le Président du Comité Organisateur'
}

function openAttestationPrintWindow(inscriptions: Inscription[], fallbackCongress?: Congress) {
  const pw = window.open('', '_blank', 'width=1000,height=800')
  if (!pw) return

  const title = fallbackCongress?.title ?? 'Attestations'
  const pagesHtml = inscriptions
    .map((ins) => {
      const congress = ins.congress ?? fallbackCongress
      const congressTitle = getCongressTitle(ins, fallbackCongress)
      const congressDates = getCongressDates(ins, fallbackCongress)
      const congressLocation = getCongressLocation(ins, fallbackCongress)

      return `
        <div class="page">
          <div class="border-outer">
            <div class="border-inner">
              <div class="logo-area">
                <div class="logo-circle">CS</div>
                <div class="logo-text">${congressTitle}</div>
              </div>

              <div class="title">ATTESTATION DE PARTICIPATION</div>

              <div class="body-text">
                <p class="line1">Nous soussignés, organisateurs du</p>
                <p class="congress-ref">${congressTitle}</p>
                <p class="congress-dates">${congressDates}${congressLocation ? ` - ${congressLocation}` : ''}</p>
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
                  <div class="sig-label">${getPresident(congress)}</div>
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
    })
    .join('')

  pw.document.write(`
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8" />
      <title>Attestations - ${title}</title>
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: Georgia, serif; background: #f3f4f6; padding: 20px; }
        .controls { text-align: center; margin-bottom: 24px; }
        .controls button {
          background: #1e40af; color: white; border: none; padding: 10px 28px;
          border-radius: 6px; font-size: 14px; cursor: pointer; margin: 0 6px;
        }
        .controls button.secondary { background: #6b7280; }
        .page {
          width: 210mm; min-height: 297mm; background: white;
          margin: 0 auto 24px; page-break-after: always;
        }
        .border-outer { width: 100%; min-height: 297mm; padding: 10mm; border: 6px double #1e40af; }
        .border-inner {
          width: 100%; min-height: calc(297mm - 20mm - 12px); padding: 12mm 16mm;
          border: 1.5px solid #bfdbfe; display: flex; flex-direction: column; align-items: center;
        }
        .logo-area { display: flex; flex-direction: column; align-items: center; margin-bottom: 12mm; }
        .logo-circle {
          width: 60px; height: 60px; border-radius: 50%; background: #1e40af; color: white;
          display: flex; align-items: center; justify-content: center;
          font-size: 22px; font-weight: bold; font-family: Arial, sans-serif; margin-bottom: 8px;
        }
        .logo-text {
          max-width: 160mm; font-size: 11px; color: #1e40af; font-family: Arial, sans-serif;
          letter-spacing: 1px; text-transform: uppercase; text-align: center;
        }
        .title {
          font-size: 26px; font-weight: bold; color: #1e3a8a; letter-spacing: 2px;
          text-align: center; text-transform: uppercase; border-bottom: 2px solid #bfdbfe;
          padding-bottom: 8px; margin-bottom: 14mm; width: 100%;
        }
        .body-text {
          text-align: center; flex: 1; display: flex; flex-direction: column;
          align-items: center; gap: 6px;
        }
        .line1, .line2, .line3 { font-size: 14px; color: #374151; line-height: 1.6; }
        .line3 { max-width: 420px; margin-top: 10px; }
        .congress-ref { font-size: 16px; font-weight: bold; color: #1e40af; margin: 4px 0; }
        .congress-dates { font-size: 13px; color: #6b7280; font-style: italic; margin-bottom: 10px; }
        .participant-name {
          font-size: 28px; font-weight: bold; color: #1e3a8a;
          margin: 8px 0 4px; letter-spacing: 1px;
        }
        .participant-org { font-size: 14px; color: #6b7280; font-style: italic; margin-bottom: 6px; }
        .footer {
          width: 100%; display: flex; justify-content: space-between; align-items: flex-end;
          margin-top: 16mm; padding-top: 8mm; border-top: 1px dashed #d1d5db;
        }
        .signature-block { text-align: center; }
        .sig-line { width: 140px; height: 1px; background: #374151; margin: 0 auto 6px; }
        .sig-label { font-size: 11px; color: #374151; max-width: 180px; }
        .attestation-info { font-size: 11px; color: #9ca3af; text-align: right; line-height: 1.7; }
        @media print {
          body { background: white; padding: 0; }
          .controls { display: none; }
          .page { margin: 0; box-shadow: none; }
        }
      </style>
    </head>
    <body>
      <div class="controls">
        <button onclick="window.print()">Imprimer toutes les attestations</button>
        <button class="secondary" onclick="window.close()">Fermer</button>
      </div>
      ${pagesHtml}
    </body>
    </html>
  `)
  pw.document.close()
}

export function AdminAttestationsPage() {
  const { user } = useAuth()
  const isSuperAdmin = user?.role === 'super_admin'
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [congressFilter, setCongressFilter] = useState('all')
  const [page, setPage] = useState(1)

  const congressQuery = useQuery({
    queryKey: ['admin-current-congress'],
    queryFn: async () => (await adminApi.getCurrentCongress()).data.data as Congress,
    enabled: !isSuperAdmin,
  })

  const congressesQuery = useQuery({
    queryKey: ['super-congresses-attestations'],
    queryFn: async () => (await superApi.getCongresses({ limit: 1000 })).data.data as Congress[],
    enabled: isSuperAdmin,
  })
  const currentCongress = isSuperAdmin
    ? congressesQuery.data?.find((congress) => congress.id === congressFilter)
    : congressQuery.data

  const queryParams = useMemo(() => {
    const params: Record<string, unknown> = {
      page,
      limit: PAGE_SIZE,
      payment_status: 'confirmed',
    }
    if (isSuperAdmin) {
      if (congressFilter !== 'all') params.congress_id = congressFilter
    } else if (currentCongress?.id) {
      params.congress_id = currentCongress.id
    }
    if (typeFilter !== 'all') params.participation_type = typeFilter
    return params
  }, [congressFilter, currentCongress?.id, isSuperAdmin, page, typeFilter])

  const { data, isLoading } = useQuery({
    queryKey: ['admin-attestations', queryParams],
    queryFn: async () => (await adminApi.getInscriptions(queryParams)).data,
    enabled: isSuperAdmin || !!currentCongress?.id,
  })

  const { data: allConfirmedData } = useQuery({
    queryKey: ['admin-attestations-all', currentCongress?.id, typeFilter],
    queryFn: async () => {
      const params: Record<string, unknown> = { payment_status: 'confirmed', limit: 10000 }
      if (isSuperAdmin) {
        if (congressFilter !== 'all') params.congress_id = congressFilter
      } else if (currentCongress?.id) {
        params.congress_id = currentCongress.id
      }
      if (typeFilter !== 'all') params.participation_type = typeFilter
      const response = await adminApi.getInscriptions(params)
      return (response.data.data ?? []) as Inscription[]
    },
    enabled: isSuperAdmin || !!currentCongress?.id,
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
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Attestations de participation</h1>
          <p className="text-gray-500 text-sm mt-1">
            Génération et impression des attestations pour les participants confirmés
          </p>
        </div>
        <Button
          onClick={() => allConfirmedData && openAttestationPrintWindow(allConfirmedData, currentCongress)}
          disabled={!allConfirmedData?.length}
        >
          <Printer className="h-4 w-4 mr-2" />
          Imprimer toutes ({allConfirmedData?.length ?? 0})
        </Button>
      </div>

      {currentCongress ? (
        <div className="rounded-xl border border-amber-100 bg-amber-50 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-semibold text-amber-900">{currentCongress.title}</p>
              {currentCongress.subtitle && <p className="text-sm text-amber-700">{currentCongress.subtitle}</p>}
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-amber-700">
              <span className="flex items-center gap-1">
                <CalendarDays className="h-4 w-4" />
                {formatDate(currentCongress.start_date)} - {formatDate(currentCongress.end_date)}
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                {[currentCongress.location, currentCongress.city].filter(Boolean).join(', ')}
              </span>
            </div>
          </div>
        </div>
      ) : isSuperAdmin ? (
        <div className="rounded-xl border border-gray-200 bg-white p-4 text-sm text-gray-600">
          Tous les congrès sont inclus. Sélectionnez un congrès pour filtrer l'impression.
        </div>
      ) : null}

      {isSuperAdmin && (
        <div className="flex flex-wrap items-end gap-3 bg-white rounded-xl border border-gray-200 p-4">
          <div className="w-full max-w-md space-y-1.5">
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Congrès</label>
            <Select value={congressFilter} onValueChange={(value) => { setCongressFilter(value); setPage(1) }}>
              <SelectTrigger><SelectValue placeholder="Tous les congrès" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les congrès</SelectItem>
                {(congressesQuery.data ?? []).map((congress) => (
                  <SelectItem key={congress.id} value={congress.id}>{congress.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {currentCongress && !currentCongress.attestations_available && (
        <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800">
          Les attestations ne sont pas encore activées pour ce congrès. Elles peuvent être imprimées en interne,
          mais les participants ne pourront pas les télécharger tant que l'option reste désactivée.
        </div>
      )}

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

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {isLoading || congressQuery.isLoading || congressesQuery.isLoading ? (
          <div className="flex items-center justify-center py-16 text-gray-400">
            <RefreshCw className="h-6 w-6 animate-spin mr-2" />
            Chargement...
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <Users className="h-12 w-12 mb-3 text-gray-300" />
            <p className="font-medium text-gray-500">Aucun participant confirmé</p>
            <p className="text-sm mt-1">Les attestations ne sont générées que pour les paiements confirmés.</p>
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
                    <TableCell className="text-sm text-gray-600">{ins.organisme ?? '-'}</TableCell>
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
                        onClick={() => openAttestationPrintWindow([ins], currentCongress)}
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
                {total} participant{total !== 1 ? 's' : ''} confirmé{total !== 1 ? 's' : ''} - Page {page} / {totalPages}
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
              Les informations du congrès courant et du participant sont injectées automatiquement dans le document.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
