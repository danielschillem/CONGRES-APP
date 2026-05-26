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
  BadgeCheck,
  Download,
  Clock,
} from 'lucide-react'
import { soumissionsApi, inscriptionsApi } from '@/lib/api'
import { Soumission, SoumissionStats, Inscription } from '@/types'
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

function openBadgeWindow(ins: Inscription) {
  const pw = window.open('', '_blank', 'width=900,height=700')
  if (!pw) return
  const color = badgeTypeColor(ins.participation_type)
  pw.document.write(`
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8" />
      <title>Mon badge — ${CONGRESS_NAME}</title>
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: Arial, Helvetica, sans-serif; background: #f3f4f6; display: flex; flex-direction: column; align-items: center; padding: 40px 20px; }
        .controls { margin-bottom: 24px; display: flex; gap: 12px; }
        .controls button { padding: 10px 24px; border: none; border-radius: 6px; font-size: 14px; cursor: pointer; }
        .btn-primary { background: #1e40af; color: white; }
        .btn-secondary { background: #6b7280; color: white; }
        .badge {
          width: 85mm; height: 54mm;
          background: white; border: 2px solid #d1d5db; border-radius: 8px;
          overflow: hidden; display: flex; flex-direction: column;
        }
        .badge-header { background: ${color}; color: white; font-size: 7.5px; font-weight: bold; text-align: center; padding: 5px 8px; letter-spacing: 0.5px; text-transform: uppercase; }
        .badge-body { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 8px 12px; text-align: center; }
        .badge-name { font-size: 16px; font-weight: bold; color: #111827; line-height: 1.2; }
        .badge-org { font-size: 9px; color: #6b7280; margin-top: 3px; }
        .badge-type-row { margin-top: 8px; }
        .badge-type-pill { font-size: 9px; font-weight: bold; padding: 2px 10px; border-radius: 999px; background: ${color}20; color: ${color}; border: 1px solid ${color}40; }
        .badge-footer { display: flex; justify-content: space-between; font-size: 7px; color: #9ca3af; padding: 4px 8px; border-top: 1px solid #f3f4f6; }
        @media print { body { background: white; padding: 5mm; } .controls { display: none; } }
      </style>
    </head>
    <body>
      <div class="controls">
        <button class="btn-primary" onclick="window.print()">Imprimer / Télécharger</button>
        <button class="btn-secondary" onclick="window.close()">Fermer</button>
      </div>
      <div class="badge">
        <div class="badge-header">${CONGRESS_NAME}</div>
        <div class="badge-body">
          <div class="badge-name">${ins.prenom} ${ins.nom}</div>
          ${ins.organisme ? `<div class="badge-org">${ins.organisme}</div>` : ''}
          <div class="badge-type-row">
            <span class="badge-type-pill">${ins.participation_type}</span>
          </div>
        </div>
        <div class="badge-footer">
          <span>${CONGRESS_DATES} • ${CONGRESS_LOCATION}</span>
          <span>${ins.numero_facture}</span>
        </div>
      </div>
    </body>
    </html>
  `)
  pw.document.close()
}

function openBadgeInNewWindow(html: string) {
  const pw = window.open('', '_blank', 'width=900,height=700')
  if (!pw) return
  pw.document.write(html)
  pw.document.close()
}

function openReceiptWindow(ins: Inscription) {
  const pw = window.open('', '_blank', 'width=600,height=800')
  if (!pw) return
  pw.document.write(`
    <!DOCTYPE html>
    <html lang="fr">
    <head><meta charset="UTF-8"><title>Reçu — ${ins.numero_facture}</title>
    <style>
      *{margin:0;padding:0;box-sizing:border-box}
      body{font-family:'Courier New',monospace;background:#f3f4f6;display:flex;justify-content:center;padding:40px 20px}
      .receipt{max-width:400px;width:100%;background:white;border:2px solid #d1d5db;border-radius:12px;padding:32px}
      h1{font-size:18px;text-align:center;margin-bottom:4px;color:#111827}
      .subtitle{text-align:center;font-size:11px;color:#6b7280;margin-bottom:24px}
      .header{text-align:center;margin-bottom:24px}
      .header .amount{font-size:28px;font-weight:bold;color:#059669}
      .header .label{font-size:11px;color:#6b7280;text-transform:uppercase;letter-spacing:1px}
      hr{border:none;border-top:1px dashed #d1d5db;margin:16px 0}
      .row{display:flex;justify-content:space-between;font-size:13px;padding:4px 0}
      .row .lbl{color:#6b7280}.row .val{color:#111827;font-weight:500;text-align:right}
      .status{text-align:center;margin-top:16px;padding:8px;background:#ecfdf5;border-radius:8px;font-size:13px;font-weight:bold;color:#059669}
      .footer{text-align:center;margin-top:16px;font-size:10px;color:#9ca3af}
      @media print{body{background:white;padding:0}.receipt{border:none;box-shadow:none}}
    </style></head>
    <body>
    <div class="receipt">
      <h1>Reçu de paiement</h1>
      <p class="subtitle">Congrès Scientifique</p>
      <hr>
      <div class="header"><p class="label">Montant payé</p><p class="amount">${ins.montant.toLocaleString()} FCFA</p></div>
      <hr>
      <div class="row"><span class="lbl">N° Facture</span><span class="val">${ins.numero_facture}</span></div>
      <div class="row"><span class="lbl">Participant</span><span class="val">${ins.prenom} ${ins.nom}</span></div>
      <div class="row"><span class="lbl">Email</span><span class="val">${ins.email}</span></div>
      <div class="row"><span class="lbl">Téléphone</span><span class="val">${ins.telephone}</span></div>
      <div class="row"><span class="lbl">Type</span><span class="val">${ins.participation_type}</span></div>
      <div class="row"><span class="lbl">Pays</span><span class="val">${ins.pays}</span></div>
      <div class="row"><span class="lbl">Organisme</span><span class="val">${ins.organisme ?? '—'}</span></div>
      <div class="row"><span class="lbl">Méthode</span><span class="val">${ins.methode_paiement}</span></div>
      <hr>
      <div class="status">Paiement confirmé</div>
      <div class="footer">Reçu généré le ${new Date().toLocaleDateString('fr-FR')}</div>
    </div>
    <script>window.print()</script>
    </body>
    </html>
  `)
  pw.document.close()
}

function InscriptionDocuments() {
  const { data, isLoading } = useQuery({
    queryKey: ['my-inscription'],
    queryFn: async () => {
      const res = await inscriptionsApi.getMy()
      return res.data.data as Inscription | null
    },
  })

  if (isLoading) return null
  if (!data) return null

  const confirmed = data.payment_status === 'confirmed'

  return (
    <div className="space-y-3">
      {/* Badge section */}
      <div className={`rounded-xl border p-5 flex items-start gap-4 ${confirmed ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}>
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${confirmed ? 'bg-green-100' : 'bg-yellow-100'}`}>
          {confirmed
            ? <BadgeCheck className="h-5 w-5 text-green-700" />
            : <Clock className="h-5 w-5 text-yellow-700" />
          }
        </div>
        <div className="flex-1 min-w-0">
          <p className={`font-semibold text-sm ${confirmed ? 'text-green-900' : 'text-yellow-900'}`}>
            {confirmed ? 'Votre badge est disponible' : 'Paiement en attente de confirmation'}
          </p>
          <p className={`text-xs mt-0.5 ${confirmed ? 'text-green-700' : 'text-yellow-700'}`}>
            {confirmed
              ? `Inscription confirmée — ${data.participation_type} • N° ${data.numero_facture}`
              : `Inscription enregistrée — ${data.participation_type} • En attente de validation du paiement`
            }
          </p>
        </div>
        {confirmed && (
          <button
            onClick={() => openBadgeWindow(data)}
            className="flex items-center gap-2 rounded-lg bg-green-700 px-4 py-2 text-sm font-medium text-white hover:bg-green-800 transition-colors shrink-0"
          >
            <Download className="h-4 w-4" />
            Mon badge
          </button>
        )}
      </div>

      {/* Receipt + Attestation — only when confirmed */}
      {confirmed && (
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Mes documents</h3>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => openReceiptWindow(data)}
              className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Download className="h-4 w-4 text-primary-600" />
              Reçu de paiement
            </button>
            <button
              onClick={async () => {
                try {
                  const res = await inscriptionsApi.downloadAttestation()
                  openBadgeInNewWindow(await res.data.text())
                } catch {
                  alert("L'attestation n'est pas encore disponible.")
                }
              }}
              className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Download className="h-4 w-4 text-violet-600" />
              Attestation
            </button>
          </div>
        </div>
      )}
    </div>
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
    total_inscriptions: 0,
    inscriptions_presentiel: 0,
    inscriptions_en_ligne: 0,
    inscriptions_virtuel: 0,
    inscriptions_confirmees: 0,
    inscriptions_en_attente: 0,
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

      {/* Badge + Documents */}
      <InscriptionDocuments />

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
