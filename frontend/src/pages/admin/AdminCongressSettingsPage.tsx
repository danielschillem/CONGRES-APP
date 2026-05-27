import { FormEvent, useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  CalendarDays, Plus, RefreshCw, Save, X, CreditCard,
  Receipt, ListChecks,
} from 'lucide-react'
import { adminApi } from '@/lib/api'
import { Congress, CongressPayload } from '@/types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

type PricingRow = {
  label: string
  amount: string
}

type PaymentMethodRow = {
  method: string
  active: boolean
}

type FormFieldRow = {
  name: string
  label: string
  type: string
  required: boolean
}

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
  secretariat: string
  themes: string
  submission_types: string
  pricing_items: PricingRow[]
  submission_deadline: string
  inscription_deadline: string
  registration_start: string
  registration_end: string
  badge_color: string
  payment_methods: PaymentMethodRow[]
  form_fields: FormFieldRow[]
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
  secretariat: '',
  themes: '',
  submission_types: 'Abstract, Poster, Communication',
  pricing_items: [
    { label: 'Médecin généraliste', amount: '50000' },
    { label: 'Médecin spécialiste', amount: '100000' },
  ],
  submission_deadline: '',
  inscription_deadline: '',
  registration_start: '',
  registration_end: '',
  badge_color: '#4f46e5',
  payment_methods: [
    { method: 'Orange Money', active: true },
  ],
  form_fields: [
    { name: 'nom', label: 'Nom', type: 'text', required: true },
    { name: 'prenom', label: 'Prénom', type: 'text', required: true },
    { name: 'email', label: 'Email', type: 'email', required: true },
    { name: 'telephone', label: 'Téléphone', type: 'tel', required: true },
    { name: 'organisme', label: 'Organisme', type: 'text', required: false },
    { name: 'pays', label: 'Pays', type: 'text', required: true },
  ],
}

function toDateInput(value?: string) {
  return value ? new Date(value).toISOString().slice(0, 10) : ''
}

function csvToList(value: string) {
  return value.split(',').map((item) => item.trim()).filter(Boolean)
}

function pricingToRows(raw: unknown): PricingRow[] {
  if (Array.isArray(raw)) {
    const rows = (raw as { label: string; amount: number }[])
      .filter((p) => p.label && p.amount)
      .map((p) => ({
        label: p.label,
        amount: String(p.amount),
      }))
    return rows.length > 0 ? rows : emptyForm.pricing_items
  }
  const old = raw as { presentiel?: number; en_ligne?: number; virtuel?: number }
  const rows: PricingRow[] = []
  if (old?.presentiel) rows.push({ label: 'Présentiel', amount: String(old.presentiel) })
  if (old?.en_ligne) rows.push({ label: 'En ligne', amount: String(old.en_ligne) })
  if (old?.virtuel) rows.push({ label: 'Virtuel', amount: String(old.virtuel) })
  return rows.length > 0 ? rows : emptyForm.pricing_items
}

function formFieldsFromConfig(config: Record<string, unknown>): FormFieldRow[] {
  const fields = config.form_fields as FormFieldRow[] | undefined
  if (fields && fields.length > 0) return fields
  return emptyForm.form_fields
}

function paymentMethodsFromConfig(config: Record<string, unknown>): PaymentMethodRow[] {
  const pm = config.payment_methods as PaymentMethodRow[] | undefined
  if (pm && pm.length > 0) return pm
  return emptyForm.payment_methods
}

function congressToForm(congress: Congress): SettingsForm {
  const org = congress.organisational_structure ?? {}
  const config = congress.config ?? {}
  const badge = congress.badge_config ?? {}
  const deadlines = (config.deadlines ?? {}) as Record<string, unknown>

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
    president: String(org.president ?? ''),
    secretariat: Array.isArray(org.secretariat) ? org.secretariat.join(', ') : '',
    themes: Array.isArray(config.themes) ? config.themes.join(', ') : '',
    submission_types: Array.isArray(config.submission_types)
      ? config.submission_types.join(', ')
      : emptyForm.submission_types,
    pricing_items: pricingToRows(config.pricing),
    submission_deadline: String(deadlines.submission ?? ''),
    inscription_deadline: String(deadlines.inscription ?? ''),
    registration_start: String(deadlines.registration_start ?? ''),
    registration_end: String(deadlines.registration_end ?? ''),
    badge_color: String(badge.primary_color ?? emptyForm.badge_color),
    payment_methods: paymentMethodsFromConfig(config),
    form_fields: formFieldsFromConfig(config),
  }
}

function formToPayload(form: SettingsForm): CongressPayload {
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
    organisational_structure: {
      president: form.president.trim(),
      secretariat: csvToList(form.secretariat),
    },
    config: {
      themes: csvToList(form.themes),
      submission_types: csvToList(form.submission_types),
      pricing: form.pricing_items
        .filter((item) => item.label.trim() && Number(item.amount) > 0)
        .map((item) => ({
          label: item.label.trim(),
          amount: Number(item.amount),
        })),
      deadlines: {
        submission: form.submission_deadline || null,
        inscription: form.inscription_deadline || null,
        registration_start: form.registration_start || null,
        registration_end: form.registration_end || null,
      },
      payment_methods: form.payment_methods.filter((pm) => pm.method.trim()),
      form_fields: form.form_fields.filter((f) => f.name.trim()),
    },
    badge_config: {
      primary_color: form.badge_color,
      fields: ['prenom', 'nom', 'organisme', 'tariff_label', 'participation_type'],
    },
  }
}

export function AdminCongressSettingsPage() {
  const queryClient = useQueryClient()
  const [form, setForm] = useState<SettingsForm>(emptyForm)
  const [saved, setSaved] = useState(false)
  const [activeTab, setActiveTab] = useState<'general' | 'registration' | 'payment' | 'form'>('general')

  const { data, isLoading } = useQuery({
    queryKey: ['admin-current-congress'],
    queryFn: async () => (await adminApi.getCurrentCongress()).data.data as Congress,
  })

  useEffect(() => {
    if (data) setForm(congressToForm(data))
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

  const addPaymentMethod = () => {
    setForm((current) => ({
      ...current,
      payment_methods: [...current.payment_methods, { method: '', active: true }],
    }))
  }

  const updatePaymentMethod = (index: number, field: keyof PaymentMethodRow, value: unknown) => {
    setForm((current) => {
      const items = [...current.payment_methods]
      items[index] = { ...items[index], [field]: value }
      return { ...current, payment_methods: items }
    })
  }

  const removePaymentMethod = (index: number) => {
    setForm((current) => ({
      ...current,
      payment_methods: current.payment_methods.filter((_, i) => i !== index),
    }))
  }

  const addFormField = () => {
    setForm((current) => ({
      ...current,
      form_fields: [...current.form_fields, { name: '', label: '', type: 'text', required: true }],
    }))
  }

  const updateFormField = (index: number, field: keyof FormFieldRow, value: unknown) => {
    setForm((current) => {
      const items = [...current.form_fields]
      items[index] = { ...items[index], [field]: value }
      return { ...current, form_fields: items }
    })
  }

  const removeFormField = (index: number) => {
    setForm((current) => ({
      ...current,
      form_fields: current.form_fields.filter((_, i) => i !== index),
    }))
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

  const tabs = [
    { key: 'general', label: 'Général', icon: <CalendarDays className="h-4 w-4" /> },
    { key: 'registration', label: 'Inscriptions', icon: <Receipt className="h-4 w-4" /> },
    { key: 'payment', label: 'Paiements', icon: <CreditCard className="h-4 w-4" /> },
    { key: 'form', label: 'Formulaire', icon: <ListChecks className="h-4 w-4" /> },
  ]

  return (
    <form onSubmit={submit} className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-900">Paramètres du congrès</h1>
            <Badge variant={data.status === 'active' ? 'success' : 'secondary'}>{data.status}</Badge>
          </div>
          <p className="text-gray-500 text-sm mt-1">Configuration générale, inscriptions, paiements et formulaire</p>
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

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key as typeof activeTab)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab: General */}
      {activeTab === 'general' && (
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-gray-700">
            <CalendarDays className="h-4 w-4 text-primary-600" />
            Informations générales & contenu scientifique
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
              <Label>Édition</Label>
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
            <div className="space-y-1.5 md:col-span-2">
              <Label>Secrétariat</Label>
              <Input value={form.secretariat} onChange={(event) => updateField('secretariat', event.target.value)} placeholder="Nom 1, Nom 2" />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <Label>Thèmes</Label>
              <Textarea rows={3} value={form.themes} onChange={(event) => updateField('themes', event.target.value)} placeholder="Thème 1, Thème 2" />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <Label>Types de soumission</Label>
              <Input value={form.submission_types} onChange={(event) => updateField('submission_types', event.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Clôture soumissions</Label>
              <Input type="date" value={form.submission_deadline} onChange={(event) => updateField('submission_deadline', event.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Couleur badge</Label>
              <Input type="color" value={form.badge_color} onChange={(event) => updateField('badge_color', event.target.value)} />
            </div>
          </div>
        </div>
      )}

      {/* Tab: Registration */}
      {activeTab === 'registration' && (
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-gray-700">
            <Receipt className="h-4 w-4 text-primary-600" />
            Périodes d'inscription & tarifs
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Date d'ouverture des inscriptions</Label>
              <Input type="date" value={form.registration_start} onChange={(event) => updateField('registration_start', event.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Date de clôture des inscriptions</Label>
              <Input type="date" value={form.registration_end} onChange={(event) => updateField('registration_end', event.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Date de clôture des inscriptions (ancien)</Label>
              <Input type="date" value={form.inscription_deadline} onChange={(event) => updateField('inscription_deadline', event.target.value)} />
            </div>
            <div className="md:col-span-2 space-y-3">
              <div className="flex items-center justify-between">
                <Label>Tarifs d'inscription</Label>
                <Button type="button" variant="outline" size="sm" onClick={addPricingItem}>
                  <Plus className="h-3.5 w-3.5 mr-1" /> Ajouter
                </Button>
              </div>
              {form.pricing_items.map((item, index) => (
                <div key={index} className="grid gap-2 md:grid-cols-[1fr_180px_40px] md:items-end">
                  <div className="space-y-1">
                    <Label className="text-xs">Libellé</Label>
                    <Input value={item.label} onChange={(e) => updatePricingItem(index, 'label', e.target.value)} placeholder="Ex: Médecin généraliste" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Prix (FCFA)</Label>
                    <Input type="number" value={item.amount} onChange={(e) => updatePricingItem(index, 'amount', e.target.value)} placeholder="50000" />
                  </div>
                  <Button type="button" variant="ghost" size="icon" className="text-red-500" onClick={() => removePricingItem(index)} disabled={form.pricing_items.length === 1}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab: Payment */}
      {activeTab === 'payment' && (
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-gray-700">
            <CreditCard className="h-4 w-4 text-primary-600" />
            Configuration des paiements
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Moyens de paiement acceptés</Label>
              <Button type="button" variant="outline" size="sm" onClick={addPaymentMethod}>
                <Plus className="h-3.5 w-3.5 mr-1" /> Ajouter
              </Button>
            </div>
            {form.payment_methods.map((pm, index) => (
              <div key={index} className="grid gap-2 md:grid-cols-[1fr_150px_40px] items-end">
                <div className="space-y-1">
                  <Label className="text-xs">Méthode</Label>
                  <Input value={pm.method} onChange={(e) => updatePaymentMethod(index, 'method', e.target.value)} placeholder="Orange Money" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Actif</Label>
                  <Select value={pm.active ? 'true' : 'false'} onValueChange={(v) => updatePaymentMethod(index, 'active', v === 'true')}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">Oui</SelectItem>
                      <SelectItem value="false">Non</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button type="button" variant="ghost" size="icon" className="text-red-500" onClick={() => removePaymentMethod(index)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <p className="text-xs text-gray-400">
              Les méthodes de paiement sont affichées dans le formulaire d'inscription. Seules les méthodes actives sont proposées.
            </p>
          </div>
        </div>
      )}

      {/* Tab: Form */}
      {activeTab === 'form' && (
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-gray-700">
            <ListChecks className="h-4 w-4 text-primary-600" />
            Configuration du formulaire d'inscription
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Champs du formulaire</Label>
              <Button type="button" variant="outline" size="sm" onClick={addFormField}>
                <Plus className="h-3.5 w-3.5 mr-1" /> Ajouter un champ
              </Button>
            </div>
            {form.form_fields.map((field, index) => (
              <div key={index} className="grid gap-2 md:grid-cols-[120px_1fr_120px_80px_40px] items-end">
                <div className="space-y-1">
                  <Label className="text-xs">Nom technique</Label>
                  <Input value={field.name} onChange={(e) => updateFormField(index, 'name', e.target.value)} placeholder="nom" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Étiquette</Label>
                  <Input value={field.label} onChange={(e) => updateFormField(index, 'label', e.target.value)} placeholder="Nom" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Type</Label>
                  <Select value={field.type} onValueChange={(v) => updateFormField(index, 'type', v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="text">Texte</SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="tel">Téléphone</SelectItem>
                      <SelectItem value="select">Liste</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Requis</Label>
                  <Select value={field.required ? 'true' : 'false'} onValueChange={(v) => updateFormField(index, 'required', v === 'true')}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">Oui</SelectItem>
                      <SelectItem value="false">Non</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button type="button" variant="ghost" size="icon" className="text-red-500" onClick={() => removeFormField(index)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <p className="text-xs text-gray-400">
              Les champs marqués comme requis seront validés côté serveur. L'ordre d'affichage correspond à celui ci-dessus.
            </p>
          </div>
        </div>
      )}
    </form>
  )
}
