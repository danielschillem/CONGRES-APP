import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft,
  Download,
  CheckCircle2,
  XCircle,
  Calendar,
  User,
  Tag,
  FileText,
  RefreshCw,
  Building2,
  Briefcase,
} from 'lucide-react'
import { soumissionsApi } from '@/lib/api'
import { Soumission } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { formatDateTime } from '@/lib/utils'

function statutBadge(statut: Soumission['statut']) {
  const map = {
    'En attente': <Badge variant="warning" className="text-sm px-3 py-1">En attente</Badge>,
    'Approuvée': <Badge variant="success" className="text-sm px-3 py-1">Approuvée</Badge>,
    'Rejetée': <Badge variant="destructive" className="text-sm px-3 py-1">Rejetée</Badge>,
  }
  return map[statut]
}

function InfoRow({ label, value, icon }: { label: string; value?: string | null; icon?: React.ReactNode }) {
  if (!value) return null
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-gray-50 last:border-0">
      {icon && <span className="text-gray-400 mt-0.5 shrink-0">{icon}</span>}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">{label}</p>
        <p className="text-sm text-gray-900 mt-0.5 break-words">{value}</p>
      </div>
    </div>
  )
}

export function SoumissionDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [approveDialogOpen, setApproveDialogOpen] = useState(false)
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false)
  const [raisonRejet, setRaisonRejet] = useState('')
  const [raisonError, setRaisonError] = useState<string | null>(null)

  const { data, isLoading, error } = useQuery({
    queryKey: ['soumission-admin', id],
    queryFn: async () => {
      const response = await soumissionsApi.getOne(id!)
      return response.data.data as Soumission
    },
    enabled: Boolean(id),
  })

  const approveMutation = useMutation({
    mutationFn: () => soumissionsApi.approve(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['soumission-admin', id] })
      queryClient.invalidateQueries({ queryKey: ['admin-soumissions'] })
      queryClient.invalidateQueries({ queryKey: ['admin-soumissions-stats'] })
      setApproveDialogOpen(false)
    },
  })

  const rejectMutation = useMutation({
    mutationFn: () => soumissionsApi.reject(id!, raisonRejet),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['soumission-admin', id] })
      queryClient.invalidateQueries({ queryKey: ['admin-soumissions'] })
      queryClient.invalidateQueries({ queryKey: ['admin-soumissions-stats'] })
      setRejectDialogOpen(false)
      setRaisonRejet('')
    },
  })

  const handleReject = () => {
    if (!raisonRejet.trim()) {
      setRaisonError('Veuillez saisir une raison de rejet.')
      return
    }
    setRaisonError(null)
    rejectMutation.mutate()
  }

  const handleDownload = async () => {
    if (!data) return
    try {
      const response = await soumissionsApi.download(data.id)
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.download = `${data.document_title.replace(/\s+/g, '_')}.pdf`
      link.click()
      window.URL.revokeObjectURL(url)
    } catch {
      // handle silently
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16 text-gray-400">
        <RefreshCw className="h-6 w-6 animate-spin mr-2" />
        Chargement...
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="py-16 text-center text-red-500">
        Soumission introuvable.
      </div>
    )
  }

  const keywords =
    Array.isArray(data.keywords)
      ? data.keywords
      : (() => {
          try { return JSON.parse(data.keywords as unknown as string) } catch { return [] }
        })()

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{data.document_title}</h1>
            <div className="flex items-center gap-3 mt-2">
              {statutBadge(data.statut)}
              <Badge variant="secondary">{data.submission_type}</Badge>
              <span className="text-sm text-gray-400 flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                {formatDateTime(data.created_at)}
              </span>
            </div>
          </div>
        </div>
        <Button variant="outline" onClick={handleDownload}>
          <Download className="h-4 w-4 mr-2" />
          Télécharger PDF
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main details */}
        <div className="lg:col-span-2 space-y-5">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Informations sur le document</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <InfoRow label="Thème" value={data.theme} icon={<FileText className="h-4 w-4" />} />
              <InfoRow label="Topics / Sujets" value={data.topics} icon={<Tag className="h-4 w-4" />} />
              <InfoRow label="Nom de l'auteur" value={data.author_name} icon={<User className="h-4 w-4" />} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Résumé</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{data.resume}</p>
            </CardContent>
          </Card>

          {keywords.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Mots-clés</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex flex-wrap gap-2">
                  {keywords.map((kw: string, i: number) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1 rounded-full bg-primary-100 px-3 py-1 text-xs font-medium text-primary-700"
                    >
                      <Tag className="h-3 w-3" />
                      {kw}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {data.statut === 'Rejetée' && data.raison_rejet && (
            <Card className="border-red-200">
              <CardHeader>
                <CardTitle className="text-base text-red-600">Raison du rejet</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-sm text-gray-700 leading-relaxed">{data.raison_rejet}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-5">
          {/* Submitter info */}
          {data.user && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Soumis par</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 text-primary-700 font-semibold text-sm shrink-0">
                    {data.user.prenom?.[0]?.toUpperCase()}{data.user.nom?.[0]?.toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      {data.user.civilite} {data.user.prenom} {data.user.nom}
                    </p>
                    <p className="text-xs text-gray-500">{data.user.email}</p>
                  </div>
                </div>
                {data.user.organisme && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Building2 className="h-3.5 w-3.5 text-gray-400" />
                    {data.user.organisme}
                  </div>
                )}
                {data.user.profession && (
                  <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                    <Briefcase className="h-3.5 w-3.5 text-gray-400" />
                    {data.user.profession}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          {data.statut === 'En attente' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Actions</CardTitle>
              </CardHeader>
              <CardContent className="pt-0 space-y-3">
                <Button
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                  onClick={() => setApproveDialogOpen(true)}
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Approuver
                </Button>
                <Button
                  variant="destructive"
                  className="w-full"
                  onClick={() => setRejectDialogOpen(true)}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Rejeter
                </Button>
              </CardContent>
            </Card>
          )}

          {data.statut !== 'En attente' && (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-600">Statut final</p>
                  <div className="mt-2">{statutBadge(data.statut)}</div>
                  {data.updated_at !== data.created_at && (
                    <p className="text-xs text-gray-400 mt-2">
                      Mis à jour le {formatDateTime(data.updated_at)}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Approve Dialog */}
      <Dialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approuver la soumission</DialogTitle>
            <DialogDescription>
              Confirmez-vous l'approbation de cette soumission ? L'auteur sera notifié.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setApproveDialogOpen(false)}>
              Annuler
            </Button>
            <Button
              className="bg-green-600 hover:bg-green-700 text-white"
              loading={approveMutation.isPending}
              onClick={() => approveMutation.mutate()}
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Confirmer l'approbation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog
        open={rejectDialogOpen}
        onOpenChange={(open) => {
          setRejectDialogOpen(open)
          if (!open) {
            setRaisonRejet('')
            setRaisonError(null)
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rejeter la soumission</DialogTitle>
            <DialogDescription>
              Veuillez indiquer la raison du rejet. L'auteur sera notifié avec ce message.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="raison_rejet">Raison du rejet *</Label>
            <Textarea
              id="raison_rejet"
              placeholder="Ex: Le résumé ne respecte pas les critères de longueur..."
              rows={4}
              value={raisonRejet}
              onChange={(e) => {
                setRaisonRejet(e.target.value)
                setRaisonError(null)
              }}
              error={raisonError ?? undefined}
            />
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setRejectDialogOpen(false)
                setRaisonRejet('')
                setRaisonError(null)
              }}
            >
              Annuler
            </Button>
            <Button
              variant="destructive"
              loading={rejectMutation.isPending}
              onClick={handleReject}
            >
              <XCircle className="h-4 w-4 mr-2" />
              Confirmer le rejet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
