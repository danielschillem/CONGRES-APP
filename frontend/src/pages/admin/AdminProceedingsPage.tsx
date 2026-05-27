import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { proceedingApi, soumissionsApi } from '@/lib/api'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { BookOpen, Plus, Trash2, Send } from 'lucide-react'
import type { Proceeding, ProceedingDetail, Soumission } from '@/types'
import { EmptyState, LoadingState, PageHeader } from '@/components/Interface'

export function AdminProceedingsPage() {
  const queryClient = useQueryClient()
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [viewingId, setViewingId] = useState<string | null>(null)
  const [newTitle, setNewTitle] = useState('')
  const [newSubtitle, setNewSubtitle] = useState('')
  const [newDescription, setNewDescription] = useState('')
  const [addSubDialogOpen, setAddSubDialogOpen] = useState(false)
  const [selectedSoumissionId, setSelectedSoumissionId] = useState('')
  const [sectionTitle, setSectionTitle] = useState('')
  const [subOrder, setSubOrder] = useState(0)

  const { data: proceedingsData, isLoading } = useQuery({
    queryKey: ['admin-proceedings'],
    queryFn: () => proceedingApi.adminList(),
  })

  const { data: detailData } = useQuery({
    queryKey: ['admin-proceeding', viewingId],
    queryFn: () => proceedingApi.adminGet(viewingId!),
    enabled: !!viewingId,
  })

  const { data: approvedData } = useQuery({
    queryKey: ['approved-soumissions'],
    queryFn: () => soumissionsApi.getAll({ statut: 'Approuvée' }),
  })

  const createMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => proceedingApi.adminCreate(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-proceedings'] })
      setCreateDialogOpen(false)
      setNewTitle('')
      setNewSubtitle('')
      setNewDescription('')
    },
  })

  const publishMutation = useMutation({
    mutationFn: (id: string) => proceedingApi.adminUpdate(id, { status: 'published' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-proceedings'] })
      queryClient.invalidateQueries({ queryKey: ['admin-proceeding', viewingId] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => proceedingApi.adminDelete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-proceedings'] })
      setViewingId(null)
    },
  })

  const addSubMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => proceedingApi.adminAddSubmission(viewingId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-proceeding', viewingId] })
      setAddSubDialogOpen(false)
      setSelectedSoumissionId('')
      setSectionTitle('')
      setSubOrder(0)
    },
  })

  const removeSubMutation = useMutation({
    mutationFn: (soumissionId: string) => proceedingApi.adminRemoveSubmission(viewingId!, soumissionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-proceeding', viewingId] })
    },
  })

  const proceedings: Proceeding[] = proceedingsData?.data?.data ?? []
  const detail: ProceedingDetail | null = detailData?.data?.data ?? null
  const approvedSoumissions: Soumission[] = approvedData?.data?.data ?? []

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Publication scientifique"
        title="Actes du congrès"
        description="Composez les volumes d'actes, ajoutez les communications validées et publiez les contenus accessibles au public."
        actions={
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-1" />
              Nouveaux actes
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Créer un volume d'actes</DialogTitle>
            </DialogHeader>
            <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate({ title: newTitle, subtitle: newSubtitle, description: newDescription }) }} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Titre *</label>
                <Input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sous-titre</label>
                <Input value={newSubtitle} onChange={(e) => setNewSubtitle(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <Textarea value={newDescription} onChange={(e) => setNewDescription(e.target.value)} rows={3} />
              </div>
              <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => setCreateDialogOpen(false)}>Annuler</Button>
                <Button type="submit" disabled={createMutation.isPending}>Créer</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
        }
      />

      {isLoading ? (
        <LoadingState />
      ) : proceedings.length === 0 ? (
        <EmptyState
          icon={<BookOpen className="h-7 w-7" />}
          title="Aucun acte créé"
          description="Créez un premier volume pour préparer la publication des communications acceptées."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {proceedings.map((p) => (
            <Card
              key={p.id}
              className={`cursor-pointer transition-colors ${viewingId === p.id ? 'ring-2 ring-primary-500' : ''}`}
              onClick={() => setViewingId(p.id)}
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base">{p.title}</CardTitle>
                    {p.subtitle && <p className="text-sm text-gray-500">{p.subtitle}</p>}
                  </div>
                  <Badge className={p.status === 'published' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                    {p.status === 'published' ? 'Publié' : 'Brouillon'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span>{p.created_at ? new Date(p.created_at).toLocaleDateString() : ''}</span>
                  {p.published_at && <span>Publié le {new Date(p.published_at).toLocaleDateString()}</span>}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {viewingId && detail && (
        <Card className="mt-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{detail.proceeding.title}</CardTitle>
                {detail.proceeding.subtitle && <p className="text-sm text-gray-500">{detail.proceeding.subtitle}</p>}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setAddSubDialogOpen(true)}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Ajouter une communication
                </Button>
                {detail.proceeding.status === 'draft' && (
                  <Button
                    size="sm"
                    onClick={() => publishMutation.mutate(viewingId)}
                    disabled={publishMutation.isPending}
                  >
                    <Send className="h-4 w-4 mr-1" />
                    Publier
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-red-500"
                  onClick={() => deleteMutation.mutate(viewingId)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {detail.proceeding.description && (
              <p className="text-sm text-gray-600 mb-4">{detail.proceeding.description}</p>
            )}
            <h4 className="font-medium text-sm text-gray-700 mb-2">Communications ({detail.submissions.length})</h4>
            {detail.submissions.length === 0 ? (
              <p className="text-sm text-gray-400 italic">Aucune communication ajoutée</p>
            ) : (
              <div className="space-y-2">
                {detail.submissions.map((sub) => (
                  <div key={sub.id} className="flex items-center justify-between bg-gray-50 rounded-md p-3">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-gray-400 w-6">{sub.order}</span>
                      <div>
                        <p className="text-sm font-medium">{sub.soumission?.document_title}</p>
                        <p className="text-xs text-gray-500">{sub.soumission?.author_name}</p>
                        {sub.section_title && <p className="text-xs text-gray-400">{sub.section_title}</p>}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-red-400 h-8 w-8"
                      onClick={() => removeSubMutation.mutate(sub.soumission_id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Add submission dialog */}
      <Dialog open={addSubDialogOpen} onOpenChange={setAddSubDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajouter une communication aux actes</DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => {
            e.preventDefault()
            addSubMutation.mutate({
              soumission_id: selectedSoumissionId,
              section_title: sectionTitle,
              order: subOrder,
            })
          }} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Communication *</label>
              <Select value={selectedSoumissionId} onValueChange={setSelectedSoumissionId}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner..." />
                </SelectTrigger>
                <SelectContent>
                  {approvedSoumissions.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.document_title} - {s.author_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Section</label>
              <Input value={sectionTitle} onChange={(e) => setSectionTitle(e.target.value)} placeholder="ex: Communications orales" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ordre</label>
              <Input type="number" value={subOrder} onChange={(e) => setSubOrder(parseInt(e.target.value) || 0)} />
            </div>
            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setAddSubDialogOpen(false)}>Annuler</Button>
              <Button type="submit" disabled={!selectedSoumissionId || addSubMutation.isPending}>Ajouter</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
