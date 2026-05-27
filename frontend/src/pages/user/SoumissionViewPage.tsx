import { useNavigate, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  ArrowLeft,
  Calendar,
  User,
  Tag,
  FileText,
  RefreshCw,
  Pencil,
} from 'lucide-react'
import { soumissionsApi } from '@/lib/api'
import { Soumission } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatDateTime } from '@/lib/utils'

function statutBadge(statut: Soumission['statut']) {
  const map = {
    'En attente': <Badge variant="warning" className="text-sm px-3 py-1">En attente</Badge>,
    'En révision': <Badge className="bg-blue-100 text-blue-800 text-sm px-3 py-1">En révision</Badge>,
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

export function SoumissionViewPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const { data, isLoading, error } = useQuery({
    queryKey: ['soumission', id],
    queryFn: async () => {
      const response = await soumissionsApi.getOne(id!)
      return response.data.data as Soumission
    },
    enabled: Boolean(id),
  })

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

  const canEdit = data.statut === 'En attente'

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
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
        {canEdit && (
          <Button onClick={() => navigate(`/soumission/${id}/modifier`)}>
            <Pencil className="h-4 w-4 mr-2" />
            Modifier
          </Button>
        )}
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
          {data.file_path && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Fichier</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <FileText className="h-4 w-4 text-gray-400" />
                  {data.file_path.split('/').pop()}
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm font-medium text-gray-600">Statut</p>
                <div className="mt-2">{statutBadge(data.statut)}</div>
                {data.updated_at !== data.created_at && (
                  <p className="text-xs text-gray-400 mt-2">
                    Mis à jour le {formatDateTime(data.updated_at)}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
