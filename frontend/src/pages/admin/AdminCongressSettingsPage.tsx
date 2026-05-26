import { FormEvent, useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { CalendarDays, RefreshCw, Save } from 'lucide-react'
import { adminApi } from '@/lib/api'
import { Congress, CongressPayload } from '@/types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

type SettingsForm = {
  title: string
  subtitle: string
  description: string
  edition: string
  start_date: string
  end_date: string
  location: string
  city: string
  country: string
  president: string
  themes: string
  submission_types: string
  presentiel_price: string
  online_price: string
  virtual_price: string
  badge_color: string
}

const emptyForm: SettingsForm = {
  title: '',
  subtitle: '',
  description: '',
  edition: '',
  start_date: '',
  end_date: '',
  location: '',
  city: '',
  country: '',
  president: '',
  themes: '',
  submission_types: '',
  presentiel_price: '',
  online_price: '',
  virtual_price: '',
  badge_color: '#4f46e5',
}

function toDateInput(value?: string) {
  return value ? new Date(value).toISOString().slice(0, 10) : ''
}

function csvToList(value: string) {
  return value.split(',').map((item) => item.trim()).filter(Boolean)
}

function congressToForm(congress: Congress): SettingsForm {
  const org = congress.organisational_structure ?? {}
  const config = congress.config ?? {}
  const badge = congress.badge_config ?? {}
  const pricing = (config.pricing ?? {}) as Record<string, unknown>

  return {
    title: congress.title ?? '',
    subtitle: congress.subtitle ?? '',
    description: congress.description ?? '',
    edition: congress.edition ?? '',
    start_date: toDateInput(congress.start_date),
    end_date: toDateInput(congress.end_date),
    location: congress.location ?? '',
    city: congress.city ?? '',
    country: congress.country ?? '',
    president: String(org.president ?? ''),
    themes: Array.isArray(config.themes) ? config.themes.join(', ') : '',
    submission_types: Array.isArray(config.submission_types) ? config.submission_types.join(', ') : '',
    presentiel_price: String(pricing.presentiel ?? ''),
    online_price: String(pricing.en_ligne ?? ''),
    virtual_price: String(pricing.virtuel ?? ''),
    badge_color: String(badge.primary_color ?? '#4f46e5'),
  }
}

function formToPayload(form: SettingsForm): CongressPayload {
  return {
    title: form.title,
    subtitle: form.subtitle || undefined,
    description: form.description || undefined,
    edition: form.edition || undefined,
    start_date: form.start_date,
    end_date: form.end_date,
    location: form.location,
    city: form.city || undefined,
    country: form.country || undefined,
    organisational_structure: {
      president: form.president,
    },
    config: {
      themes: csvToList(form.themes),
      submission_types: csvToList(form.submission_types),
      pricing: {
        presentiel: Number(form.presentiel_price || 0),
        en_ligne: Number(form.online_price || 0),
        virtuel: Number(form.virtual_price || 0),
      },
    },
    badge_config: {
      primary_color: form.badge_color,
      fields: ['prenom', 'nom', 'organisme', 'participation_type'],
    },
  }
}

export function AdminCongressSettingsPage() {
  const queryClient = useQueryClient()
  const [form, setForm] = useState<SettingsForm>(emptyForm)
  const [saved, setSaved] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['admin-current-congress'],
    queryFn: async () => (await adminApi.getCurrentCongress()).data.data as Congress,
  })

  useEffect(() => {
    if (data) {
      setForm(congressToForm(data))
    }
  }, [data])

  const updateMutation = useMutation({
    mutationFn: (payload: CongressPayload) => adminApi.updateCurrentCongress(payload),
    onSuccess: () => {
      setSaved(true)
      queryClient.invalidateQueries({ queryKey: ['admin-current-congress'] })
      setTimeout(() => setSaved(false), 3000)
    },
  })

  const updateField = (field: keyof SettingsForm, value: string) => {
    setForm((current) => ({ ...current, [field]: value }))
  }

  const submit = (event: FormEvent) => {
    event.preventDefault()
    updateMutation.mutate(formToPayload(form))
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16 text-gray-400">
        <RefreshCw className="h-6 w-6 animate-spin mr-2" />
        Chargement...
      </div>
    )
  }

  if (!data) {
    return (
      <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-6 text-yellow-800">
        Aucun congrès n'est associé à ce compte.
      </div>
    )
  }

  return (
    <form onSubmit={submit} className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-900">Paramètres du congrès</h1>
            <Badge variant={data.status === 'active' ? 'success' : 'secondary'}>{data.status}</Badge>
          </div>
          <p className="text-gray-500 text-sm mt-1">Configuration générale, tarifs et badges</p>
        </div>
        <Button type="submit" loading={updateMutation.isPending}>
          <Save className="h-4 w-4 mr-2" />
          Enregistrer
        </Button>
      </div>

      {saved && (
        <div className="rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-800">
          Paramètres enregistrés.
        </div>
      )}

      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-gray-700">
          <CalendarDays className="h-4 w-4 text-primary-600" />
          Informations générales
        </div>
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
          <div className="space-y-1.5 md:col-span-2">
            <Label>Description</Label>
            <Textarea rows={3} value={form.description} onChange={(event) => updateField('description', event.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Lieu *</Label>
            <Input value={form.location} onChange={(event) => updateField('location', event.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <Label>Ville</Label>
            <Input value={form.city} onChange={(event) => updateField('city', event.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Pays</Label>
            <Input value={form.country} onChange={(event) => updateField('country', event.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Président du comité</Label>
            <Input value={form.president} onChange={(event) => updateField('president', event.target.value)} />
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-1.5 md:col-span-2">
            <Label>Thèmes</Label>
            <Textarea rows={3} value={form.themes} onChange={(event) => updateField('themes', event.target.value)} />
          </div>
          <div className="space-y-1.5 md:col-span-2">
            <Label>Types de soumission</Label>
            <Input value={form.submission_types} onChange={(event) => updateField('submission_types', event.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Tarif présentiel</Label>
            <Input type="number" value={form.presentiel_price} onChange={(event) => updateField('presentiel_price', event.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Tarif en ligne</Label>
            <Input type="number" value={form.online_price} onChange={(event) => updateField('online_price', event.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Tarif virtuel</Label>
            <Input type="number" value={form.virtual_price} onChange={(event) => updateField('virtual_price', event.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Couleur badge</Label>
            <Input type="color" value={form.badge_color} onChange={(event) => updateField('badge_color', event.target.value)} />
          </div>
        </div>
      </div>
    </form>
  )
}
