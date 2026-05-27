import { FormEvent, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Copy,
  Edit,
  MapPin,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  X,
} from 'lucide-react'
import { superApi } from '@/lib/api'
import { Congress, CongressPayload, CongressStatus, CreateCongressResponse } from '@/types'
import { formatDate } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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

type PricingRow = {
  label: string
  amount: string
}

type CongressFormState = {
  title: string
  subtitle: string
  description: string
  edition: string
  start_date: string
  end_date: string
  location: string
  city: string
  country: string
  status: CongressStatus
  president: string
  secretariat: string
  themes: string
  submission_types: string
  pricing_items: PricingRow[]
  submission_deadline: string
  inscription_deadline: string
  badge_color: string
}

const emptyForm: CongressFormState = {
  title: '',
  subtitle: '',
  description: '',
  edition: '',
  start_date: '',
  end_date: '',
  location: '',
  city: '',
  country: '',
  status: 'draft',
  president: '',
  secretariat: '',
  themes: '',
  submission_types: 'Abstract, Poster, Communication',
  pricing_items: [
    { label: 'Médecin généraliste', amount: '50000' },
    { label: 'Médecin spécialiste', amount: '100000' },
  ],
  submission_deadline: '',
  inscription_deadline: '',
  badge_color: '#4f46e5',
}

function toDateInput(value?: string) {
  if (!value) return ''
  return new Date(value).toISOString().slice(0, 10)
}

function csvToList(value: string) {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

function formToPayload(form: CongressFormState): CongressPayload {
  return {
    title: form.title.trim(),
    subtitle: form.subtitle.trim() || undefined,
    description: form.description.trim() || undefined,
    edition: form.edition.trim() || undefined,
    start_date: form.start_date,
    end_date: form.end_date,
    location: form.location.trim(),
    city: form.city.trim() || undefined,
    country: form.country.trim() || undefined,
    status: form.status,
    organisational_structure: {
      president: form.president.trim(),
      secretariat: csvToList(form.secretariat),
    },
    config: {
      themes: csvToList(form.themes),
      submission_types: csvToList(form.submission_types),
      pricing: form.pricing_items
        .filter((item) => item.label.trim() && item.amount)
        .map((item) => ({
          label: item.label.trim(),
          amount: Number(item.amount),
        })),
      deadlines: {
        submission: form.submission_deadline || null,
        inscription: form.inscription_deadline || null,
      },
    },
    badge_config: {
      primary_color: form.badge_color,
      fields: ['prenom', 'nom', 'organisme', 'participation_type'],
    },
  }
}

function congressToForm(congress: Congress): CongressFormState {
  const org = congress.organisational_structure ?? {}
  const config = congress.config ?? {}
  const badge = congress.badge_config ?? {}
  const pricingRaw = (config.pricing ?? []) as unknown
  const deadlines = (config.deadlines ?? {}) as Record<string, unknown>

  let pricing_items: PricingRow[]
  if (Array.isArray(pricingRaw)) {
    pricing_items = (pricingRaw as { label: string; amount: number }[]).map((p) => ({
      label: p.label ?? '',
      amount: String(p.amount ?? ''),
    }))
  } else {
    const old = pricingRaw as { presentiel?: number; en_ligne?: number; virtuel?: number }
    pricing_items = []
    if (old.presentiel) pricing_items.push({ label: 'Présentiel', amount: String(old.presentiel) })
    if (old.en_ligne) pricing_items.push({ label: 'En ligne', amount: String(old.en_ligne) })
    if (old.virtuel) pricing_items.push({ label: 'Virtuel', amount: String(old.virtuel) })
  }

  return {
    ...emptyForm,
    title: congress.title ?? '',
    subtitle: congress.subtitle ?? '',
    description: congress.description ?? '',
    edition: congress.edition ?? '',
    start_date: toDateInput(congress.start_date),
    end_date: toDateInput(congress.end_date),
    location: congress.location ?? '',
    city: congress.city ?? '',
    country: congress.country ?? '',
    status: congress.status,
    president: String(org.president ?? ''),
    secretariat: Array.isArray(org.secretariat) ? org.secretariat.join(', ') : '',
    themes: Array.isArray(config.themes) ? config.themes.join(', ') : '',
    submission_types: Array.isArray(config.submission_types)
      ? config.submission_types.join(', ')
      : emptyForm.submission_types,
    pricing_items,
    submission_deadline: String(deadlines.submission ?? ''),
    inscription_deadline: String(deadlines.inscription ?? ''),
    badge_color: String(badge.primary_color ?? emptyForm.badge_color),
  }
}

function statusBadge(status: CongressStatus) {
  const map: Record<CongressStatus, React.ReactNode> = {
    draft: <Badge variant="secondary">Brouillon</Badge>,
    active: <Badge variant="success">Actif</Badge>,
    completed: <Badge variant="outline">Terminé</Badge>,
    cancelled: <Badge variant="destructive">Annulé</Badge>,
  }
  return map[status]
}

export function SuperCongressesPage() {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Congress | null>(null)
  const [form, setForm] = useState<CongressFormState>(emptyForm)
  const [createdCredentials, setCreatedCredentials] = useState<CreateCongressResponse | null>(null)

  const params = useMemo(() => ({ page, limit: PAGE_SIZE }), [page])
  const { data, isLoading } = useQuery({
    queryKey: ['super-congresses', params],
    queryFn: async () => (await superApi.getCongresses(params)).data,
  })

  const createMutation = useMutation({
    mutationFn: (payload: CongressPayload) => superApi.createCongress(payload),
    onSuccess: (response) => {
      setCreatedCredentials(response.data.data as CreateCongressResponse)
      queryClient.invalidateQueries({ queryKey: ['super-congresses'] })
      setDialogOpen(false)
      setForm(emptyForm)
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: CongressPayload }) =>
      superApi.updateCongress(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['super-congresses'] })
      setDialogOpen(false)
      setEditing(null)
      setForm(emptyForm)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => superApi.deleteCongress(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['super-congresses'] })
    },
  })

  const congresses: Congress[] = data?.data ?? []
  const total: number = data?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const filteredCongresses = search
    ? congresses.filter((congress) =>
        `${congress.title} ${congress.city} ${congress.country} ${congress.location}`
          .toLowerCase()
          .includes(search.toLowerCase())
      )
    : congresses

  const openCreateDialog = () => {
    setEditing(null)
    setForm(emptyForm)
    setDialogOpen(true)
  }

  const openEditDialog = (congress: Congress) => {
    setEditing(congress)
    setForm(congressToForm(congress))
    setDialogOpen(true)
  }

  const submitForm = (event: FormEvent) => {
    event.preventDefault()
    const payload = formToPayload(form)
    if (editing) {
      updateMutation.mutate({ id: editing.id, payload })
    } else {
      createMutation.mutate(payload)
    }
  }

  const updateField = (field: keyof CongressFormState, value: string) => {
    setForm((current) => ({ ...current, [field]: value }))
  }

  const updatePricingItem = (index: number, field: keyof PricingRow, value: string) => {
    setForm((current) => {
      const items = [...current.pricing_items]
      items[index] = { ...items[index], [field]: value }
      return { ...current, pricing_items: items }
    })
  }

  const addPricingItem = () => {
    setForm((current) => ({
      ...current,
      pricing_items: [...current.pricing_items, { label: '', amount: '' }],
    }))
  }

  const removePricingItem = (index: number) => {
    setForm((current) => ({
      ...current,
      pricing_items: current.pricing_items.filter((_, i) => i !== index),
    }))
  }

  const copyCredentials = () => {
    if (!createdCredentials) return
    navigator.clipboard.writeText(
      `Email: ${createdCredentials.admin_email}\nMot de passe: ${createdCredentials.admin_password}`
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Congrès</h1>
          <p className="text-gray-500 text-sm mt-1">Administration des congrès et comptes dédiés</p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="h-4 w-4 mr-2" />
          Nouveau congrès
        </Button>
      </div>

      {createdCredentials && (
        <div className="rounded-xl border border-green-200 bg-green-50 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-green-900">Compte admin créé</p>
              <p className="text-sm text-green-800">
                {createdCredentials.admin_email} / {createdCredentials.admin_password}
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={copyCredentials}>
              <Copy className="h-4 w-4 mr-2" />
              Copier
            </Button>
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-end gap-3 bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex-1 min-w-[220px] space-y-1.5">
          <Label>Recherche</Label>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Titre, ville, pays..."
              className="pl-9"
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16 text-gray-400">
            <RefreshCw className="h-6 w-6 animate-spin mr-2" />
            Chargement...
          </div>
        ) : filteredCongresses.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <CalendarDays className="h-12 w-12 mb-3 text-gray-300" />
            <p className="font-medium text-gray-500">Aucun congrès trouvé</p>
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Congrès</TableHead>
                  <TableHead>Dates</TableHead>
                  <TableHead>Lieu</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCongresses.map((congress) => (
                  <TableRow key={congress.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium text-sm text-gray-900">{congress.title}</p>
                        <p className="text-xs text-gray-400">{congress.edition || congress.subtitle}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-gray-600 whitespace-nowrap">
                      {formatDate(congress.start_date)} - {formatDate(congress.end_date)}
                    </TableCell>
                    <TableCell>
                      <span className="flex items-center gap-1 text-sm text-gray-600">
                        <MapPin className="h-3.5 w-3.5 text-gray-400" />
                        {[congress.location, congress.city, congress.country].filter(Boolean).join(', ')}
                      </span>
                    </TableCell>
                    <TableCell>{statusBadge(congress.status)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" title="Modifier" onClick={() => openEditDialog(congress)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Supprimer"
                          className="text-red-600 hover:bg-red-50 hover:text-red-700"
                          loading={deleteMutation.isPending && deleteMutation.variables === congress.id}
                          onClick={() => {
                            if (window.confirm('Supprimer ce congrès ?')) {
                              deleteMutation.mutate(congress.id)
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
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
          </>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
          <form onSubmit={submitForm} className="space-y-5">
            <DialogHeader>
              <DialogTitle>{editing ? 'Modifier le congrès' : 'Créer un congrès'}</DialogTitle>
              <DialogDescription>Les champs de configuration alimentent les espaces admin, badges et inscriptions.</DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-1.5 md:col-span-2">
                <Label>Titre *</Label>
                <Input value={form.title} onChange={(event) => updateField('title', event.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <Label>Sous-titre</Label>
                <Input value={form.subtitle} onChange={(event) => updateField('subtitle', event.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Edition</Label>
                <Input value={form.edition} onChange={(event) => updateField('edition', event.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Date de début *</Label>
                <Input type="date" value={form.start_date} onChange={(event) => updateField('start_date', event.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <Label>Date de fin *</Label>
                <Input type="date" value={form.end_date} onChange={(event) => updateField('end_date', event.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <Label>Lieu *</Label>
                <Input value={form.location} onChange={(event) => updateField('location', event.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <Label>Statut</Label>
                <Select value={form.status} onValueChange={(value) => updateField('status', value)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Brouillon</SelectItem>
                    <SelectItem value="active">Actif</SelectItem>
                    <SelectItem value="completed">Terminé</SelectItem>
                    <SelectItem value="cancelled">Annulé</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Ville</Label>
                <Input value={form.city} onChange={(event) => updateField('city', event.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Pays</Label>
                <Input value={form.country} onChange={(event) => updateField('country', event.target.value)} />
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <Label>Description</Label>
                <Textarea value={form.description} onChange={(event) => updateField('description', event.target.value)} rows={3} />
              </div>
              <div className="space-y-1.5">
                <Label>Président du comité</Label>
                <Input value={form.president} onChange={(event) => updateField('president', event.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Secrétariat</Label>
                <Input value={form.secretariat} onChange={(event) => updateField('secretariat', event.target.value)} placeholder="Nom 1, Nom 2" />
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <Label>Thèmes</Label>
                <Textarea value={form.themes} onChange={(event) => updateField('themes', event.target.value)} placeholder="Santé publique, Innovation, Recherche clinique" />
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <Label>Types de soumission</Label>
                <Input value={form.submission_types} onChange={(event) => updateField('submission_types', event.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Couleur badge</Label>
                <Input type="color" value={form.badge_color} onChange={(event) => updateField('badge_color', event.target.value)} />
              </div>

              {/* Tarifs dynamiques */}
              <div className="md:col-span-2 space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Tarifs d'inscription</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addPricingItem}>
                    <Plus className="h-3.5 w-3.5 mr-1" />
                    Ajouter un libellé
                  </Button>
                </div>
                <div className="space-y-2">
                  {form.pricing_items.map((item, index) => (
                    <div key={index} className="grid gap-2 md:grid-cols-[1fr_180px_40px] md:items-end">
                      <div className="flex-1 space-y-1">
                        <Label className="text-xs">Libellé</Label>
                        <Input
                          value={item.label}
                          onChange={(e) => updatePricingItem(index, 'label', e.target.value)}
                          placeholder="Ex: Médecin généraliste"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Prix du libellé</Label>
                        <Input
                          type="number"
                          value={item.amount}
                          onChange={(e) => updatePricingItem(index, 'amount', e.target.value)}
                          placeholder="50000"
                        />
                      </div>
                      <div className="hidden">
                        <Label className="text-xs">Mode</Label>
                        <Select value="presentiel" onValueChange={() => undefined}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="presentiel">Présentiel</SelectItem>
                            <SelectItem value="en_ligne">En ligne</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="text-red-500 hover:text-red-700 hover:bg-red-50 shrink-0"
                        onClick={() => removePricingItem(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Clôture inscriptions</Label>
                <Input type="date" value={form.inscription_deadline} onChange={(event) => updateField('inscription_deadline', event.target.value)} />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Annuler
              </Button>
              <Button type="submit" loading={createMutation.isPending || updateMutation.isPending}>
                {editing ? 'Enregistrer' : 'Créer'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
