import { FormEvent, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ChevronLeft, ChevronRight, Plus, RefreshCw, Trash2, Users } from 'lucide-react'
import { adminApi, superApi } from '@/lib/api'
import { ActorPayload, Congress, User } from '@/types'
import { useAuth } from '@/hooks/useAuth'
import { formatDate } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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

const PAGE_SIZE = 10

const emptyForm: ActorPayload = {
  civilite: 'M.',
  nom: '',
  prenom: '',
  sexe: 'M',
  telephone: '',
  email: '',
  password: '',
  role: 'reviewer',
}

function roleBadge(role: User['role']) {
  const labels: Record<string, string> = {
    congress_admin: 'Admin congrès',
    reviewer: 'Reviewer',
    finance_manager: 'Finances',
    support: 'Support',
  }
  return <Badge variant={role === 'congress_admin' ? 'secondary' : 'outline'}>{labels[role] ?? role}</Badge>
}

export function AdminActorsPage() {
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const isSuperAdmin = user?.role === 'super_admin'
  const [page, setPage] = useState(1)
  const [roleFilter, setRoleFilter] = useState('all')
  const [congressFilter, setCongressFilter] = useState('all')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [form, setForm] = useState<ActorPayload>(emptyForm)

  const congressesQuery = useQuery({
    queryKey: ['super-congresses-select'],
    queryFn: async () => (await superApi.getCongresses({ limit: 1000 })).data.data as Congress[],
    enabled: isSuperAdmin,
  })

  const params = useMemo(() => {
    const next: Record<string, unknown> = isSuperAdmin ? { page, limit: PAGE_SIZE } : {}
    if (roleFilter !== 'all') next.role = roleFilter
    if (isSuperAdmin && congressFilter !== 'all') next.congress_id = congressFilter
    return next
  }, [congressFilter, isSuperAdmin, page, roleFilter])

  const actorsQuery = useQuery({
    queryKey: [isSuperAdmin ? 'super-actors' : 'admin-actors', params],
    queryFn: async () => {
      const response = isSuperAdmin ? await superApi.getActors(params) : await adminApi.getActors(params)
      return response.data
    },
  })

  const createMutation = useMutation({
    mutationFn: (payload: ActorPayload) => {
      const queryParams = isSuperAdmin && congressFilter !== 'all' ? { congress_id: congressFilter } : undefined
      return adminApi.createActor(payload, queryParams)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [isSuperAdmin ? 'super-actors' : 'admin-actors'] })
      setDialogOpen(false)
      setForm(emptyForm)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.deleteActor(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [isSuperAdmin ? 'super-actors' : 'admin-actors'] })
    },
  })

  const actors: User[] = actorsQuery.data?.data ?? []
  const total: number = isSuperAdmin ? actorsQuery.data?.total ?? 0 : actors.length
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const congresses = congressesQuery.data ?? []
  const selectedCongressRequired = isSuperAdmin && congressFilter === 'all'

  const submit = (event: FormEvent) => {
    event.preventDefault()
    createMutation.mutate(form)
  }

  const updateField = (field: keyof ActorPayload, value: string) => {
    setForm((current) => ({ ...current, [field]: value }))
  }

  const congressName = (id?: string) => congresses.find((congress) => congress.id === id)?.title ?? '-'

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Acteurs</h1>
          <p className="text-gray-500 text-sm mt-1">Comptes reviewer, finances et support</p>
        </div>
        <Button onClick={() => setDialogOpen(true)} disabled={selectedCongressRequired}>
          <Plus className="h-4 w-4 mr-2" />
          Nouvel acteur
        </Button>
      </div>

      <div className="flex flex-wrap items-end gap-3 bg-white rounded-xl border border-gray-200 p-4">
        {isSuperAdmin && (
          <div className="w-72 space-y-1.5">
            <Label>Congrès</Label>
            <Select value={congressFilter} onValueChange={(value) => { setCongressFilter(value); setPage(1) }}>
              <SelectTrigger><SelectValue placeholder="Tous les congrès" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les congrès</SelectItem>
                {congresses.map((congress) => (
                  <SelectItem key={congress.id} value={congress.id}>{congress.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        <div className="w-56 space-y-1.5">
          <Label>Rôle</Label>
          <Select value={roleFilter} onValueChange={(value) => { setRoleFilter(value); setPage(1) }}>
            <SelectTrigger><SelectValue placeholder="Tous les rôles" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les rôles</SelectItem>
              {isSuperAdmin && <SelectItem value="congress_admin">Admin congrès</SelectItem>}
              <SelectItem value="reviewer">Reviewer</SelectItem>
              <SelectItem value="finance_manager">Finances</SelectItem>
              <SelectItem value="support">Support</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {selectedCongressRequired && (
        <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-800">
          Sélectionnez un congrès pour créer un acteur rattaché à ce congrès.
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {actorsQuery.isLoading ? (
          <div className="flex items-center justify-center py-16 text-gray-400">
            <RefreshCw className="h-6 w-6 animate-spin mr-2" />
            Chargement...
          </div>
        ) : actors.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <Users className="h-12 w-12 mb-3 text-gray-300" />
            <p className="font-medium text-gray-500">Aucun acteur trouvé</p>
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Utilisateur</TableHead>
                  <TableHead>Rôle</TableHead>
                  {isSuperAdmin && <TableHead>Congrès</TableHead>}
                  <TableHead>Créé le</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {actors.map((actor) => (
                  <TableRow key={actor.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium text-sm text-gray-900">{actor.prenom} {actor.nom}</p>
                        <p className="text-xs text-gray-400">{actor.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>{roleBadge(actor.role)}</TableCell>
                    {isSuperAdmin && <TableCell className="text-sm text-gray-600">{congressName(actor.congress_id)}</TableCell>}
                    <TableCell className="text-sm text-gray-500 whitespace-nowrap">{formatDate(actor.created_at)}</TableCell>
                    <TableCell>
                      <Badge variant={actor.active !== false ? 'success' : 'destructive'}>
                        {actor.active !== false ? 'Actif' : 'Inactif'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {actor.role !== 'congress_admin' && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-red-600 hover:bg-red-50 hover:text-red-700"
                          loading={deleteMutation.isPending && deleteMutation.variables === actor.id}
                          onClick={() => {
                            if (window.confirm('Supprimer cet acteur ?')) {
                              deleteMutation.mutate(actor.id)
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {isSuperAdmin && (
              <div className="flex items-center justify-between border-t border-gray-100 px-4 py-3">
                <p className="text-sm text-gray-500">
                  {total} résultat{total !== 1 ? 's' : ''} - Page {page} / {totalPages}
                </p>
                <div className="flex items-center gap-1">
                  <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
                    <ChevronLeft className="h-4 w-4" />
                    Précédent
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>
                    Suivant
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <form onSubmit={submit} className="space-y-5">
            <DialogHeader>
              <DialogTitle>Créer un acteur</DialogTitle>
              <DialogDescription>Le compte sera rattaché au congrès sélectionné.</DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Civilité</Label>
                <Select value={form.civilite} onValueChange={(value) => updateField('civilite', value)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="M.">M.</SelectItem>
                    <SelectItem value="Mme">Mme</SelectItem>
                    <SelectItem value="Dr">Dr</SelectItem>
                    <SelectItem value="Pr">Pr</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Rôle</Label>
                <Select value={form.role} onValueChange={(value) => updateField('role', value)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="reviewer">Reviewer</SelectItem>
                    <SelectItem value="finance_manager">Finances</SelectItem>
                    <SelectItem value="support">Support</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Prénom *</Label>
                <Input value={form.prenom} onChange={(event) => updateField('prenom', event.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <Label>Nom *</Label>
                <Input value={form.nom} onChange={(event) => updateField('nom', event.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <Label>Sexe</Label>
                <Select value={form.sexe} onValueChange={(value) => updateField('sexe', value)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="M">Masculin</SelectItem>
                    <SelectItem value="F">Féminin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Téléphone *</Label>
                <Input value={form.telephone} onChange={(event) => updateField('telephone', event.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <Label>Email *</Label>
                <Input type="email" value={form.email} onChange={(event) => updateField('email', event.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <Label>Mot de passe *</Label>
                <Input type="password" value={form.password} onChange={(event) => updateField('password', event.target.value)} minLength={8} required />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Annuler</Button>
              <Button type="submit" loading={createMutation.isPending}>Créer</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
