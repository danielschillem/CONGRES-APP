import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQuery } from '@tanstack/react-query'
import { CheckCircle2, CreditCard, Smartphone, CalendarDays, MapPin, ChevronRight, Ticket } from 'lucide-react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { inscriptionsApi, congressesApi } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { formatDate, getPricingOptions, PricingEntry } from '@/lib/utils'
import { Congress } from '@/types'

const inscriptionSchema = z.object({
  nom: z.string().min(2, 'Le nom est requis'),
  prenom: z.string().min(2, 'Le prénom est requis'),
  email: z.string().email('Adresse email invalide'),
  telephone: z
    .string()
    .regex(/^[05-7]\d{7}$/, 'Numéro invalide (commence par 0, 5, 6 ou 7 - 8 chiffres)'),
  organisme: z.string().optional(),
  pays: z.string().min(2, 'Le pays est requis'),
  tariff_label: z.string().min(1, 'Veuillez sélectionner un tarif'),
  participation_type: z.enum(['Présentiel', 'En ligne'], {
    required_error: 'Veuillez sélectionner un type de participation',
  }),
  montant: z.number().positive('Le montant doit être positif'),
  methode_paiement: z.string().min(1, 'La méthode de paiement est requise'),
  code_otp: z.string().optional(),
  congress_id: z.string().min(1),
})

type InscriptionFormData = z.infer<typeof inscriptionSchema>

function CongressPicker() {
  const navigate = useNavigate()

  const { data, isLoading } = useQuery({
    queryKey: ['active-congresses-picker'],
    queryFn: async () => (await congressesApi.getActive()).data,
  })

  const congresses: Congress[] = data?.data ?? []

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Inscription au congrès</h1>
        <p className="text-gray-500 text-sm mt-1">
          Sélectionnez le congrès auquel vous souhaitez vous inscrire
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12 text-gray-400">
          <svg className="h-5 w-5 animate-spin mr-2" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Chargement des congrès…
        </div>
      ) : congresses.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-12 text-center">
            <CalendarDays className="h-12 w-12 text-gray-300 mb-4" />
            <p className="font-semibold text-gray-700">Aucun congrès actif</p>
            <p className="text-sm text-gray-400 mt-1 max-w-xs">
              Il n'y a pas de congrès disponibles pour l'inscription pour le moment.
            </p>
            <Button className="mt-4" variant="outline" onClick={() => navigate('/')}>
              Retour à l'accueil
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {congresses.map((c) => {
            const pricing = getPricingOptions(c.config)
            const minPrice = pricing.length > 0 ? Math.min(...pricing.map((p) => p.amount)) : null
            const deadline = (c.config?.deadlines as { inscription?: string } | undefined)?.inscription
            const isOpen = deadline ? new Date(deadline) > new Date() : new Date(c.end_date) > new Date()

            return (
              <button
                key={c.id}
                type="button"
                onClick={() => navigate(`/inscription?congress_id=${c.id}`)}
                className="w-full text-left rounded-xl border-2 border-gray-200 bg-white p-5 hover:border-primary-300 hover:shadow-md transition-all group"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant={isOpen ? 'success' : 'secondary'} className="text-xs">
                        {isOpen ? 'Inscriptions ouvertes' : 'Fermé'}
                      </Badge>
                      {c.edition && (
                        <span className="text-xs text-primary-600 font-medium">{c.edition}</span>
                      )}
                    </div>
                    <p className="font-semibold text-gray-900 group-hover:text-primary-700 transition-colors">
                      {c.title}
                    </p>
                    {c.subtitle && (
                      <p className="text-sm text-gray-500 mt-0.5">{c.subtitle}</p>
                    )}
                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <CalendarDays className="h-3.5 w-3.5 text-gray-400" />
                        {formatDate(c.start_date)} → {formatDate(c.end_date)}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5 text-gray-400" />
                        {[c.location, c.city].filter(Boolean).join(', ')}
                      </span>
                      {minPrice && (
                        <span className="flex items-center gap-1">
                          <Ticket className="h-3.5 w-3.5 text-gray-400" />
                          À partir de {minPrice.toLocaleString('fr-FR')} FCFA
                        </span>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-gray-300 group-hover:text-primary-500 transition-colors shrink-0 mt-0.5" />
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

export function InscriptionPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const congressId = searchParams.get('congress_id')
  const [success, setSuccess] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const [selectedPricing, setSelectedPricing] = useState<PricingEntry | null>(null)

  const { data: congressData, isLoading: congressLoading } = useQuery({
    queryKey: ['inscription-congress', congressId],
    queryFn: async () => (await congressesApi.getOne(congressId!)).data,
    enabled: !!congressId,
  })

  const congress: Congress | undefined = congressData?.data
  const pricingOptions = getPricingOptions(congress?.config ?? null)
  const paymentMethods = (congress?.config?.payment_methods as { method: string; active: boolean }[]) ?? []
  const activePaymentMethods = paymentMethods.filter((pm) => pm.active).map((pm) => pm.method)
  const hasOrangeMoney = activePaymentMethods.length === 0 || activePaymentMethods.includes('Orange Money')

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<InscriptionFormData>({
    resolver: zodResolver(inscriptionSchema),
    defaultValues: {
      congress_id: congressId ?? '',
    },
  })

  const mutation = useMutation({
    mutationFn: (data: InscriptionFormData) => inscriptionsApi.create(data as Record<string, unknown>),
    onSuccess: () => {
      setSuccess(true)
      setServerError(null)
    },
    onError: (err: unknown) => {
      const error = err as { response?: { data?: { message?: string; error?: string } } }
      setServerError(
        error?.response?.data?.message ||
          error?.response?.data?.error ||
          "Une erreur est survenue lors de l'inscription."
      )
    },
  })

  const handlePricingSelect = (option: PricingEntry) => {
    setSelectedPricing(option)
    setValue('tariff_label', option.label, { shouldValidate: true })
    setValue('montant', option.amount, { shouldValidate: true })
  }

  const onSubmit = (data: InscriptionFormData) => {
    setServerError(null)
    mutation.mutate(data)
  }

  if (!congressId) {
    return <CongressPicker />
  }

  if (success) {
    return (
      <div className="max-w-lg mx-auto">
        <Card className="text-center">
          <CardContent className="pt-12 pb-10">
            <div className="flex items-center justify-center mb-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Inscription confirmée !</h2>
            <p className="text-gray-500 text-sm leading-relaxed">
              Votre inscription au congrès a été enregistrée avec succès. Vous recevrez un email
              de confirmation avec les détails de votre participation.
            </p>
            <Button className="mt-6" onClick={() => navigate('/dashboard')}>
              Voir mes inscriptions
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Inscription au congrès</h1>
        <p className="text-gray-500 text-sm mt-1">
          Choisissez votre formule et remplissez vos informations
        </p>
      </div>

      {congressLoading ? (
        <Card>
          <CardContent className="py-6 text-center text-gray-400">Chargement du congrès...</CardContent>
        </Card>
      ) : congress && (
        <Card className="bg-primary-50 border-primary-200">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-100 text-primary-700 shrink-0">
                <CalendarDays className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-primary-900">{congress.title}</p>
                {congress.subtitle && <p className="text-sm text-primary-700">{congress.subtitle}</p>}
                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-xs text-primary-600">
                  <span className="flex items-center gap-1">
                    <CalendarDays className="h-3 w-3" />
                    Du {formatDate(congress.start_date)} au {formatDate(congress.end_date)}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {[congress.location, congress.city].filter(Boolean).join(', ')}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {serverError && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-3.5 text-sm text-red-700">
          {serverError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
        {/* Choix de la formule */}
        {pricingOptions.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Choisissez votre formule</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2">
                {pricingOptions.map((option, i) => {
                  const isSelected = selectedPricing?.label === option.label && selectedPricing?.amount === option.amount
                  return (
                    <button
                      type="button"
                      key={i}
                      onClick={() => handlePricingSelect(option)}
                      className={`text-left rounded-xl border-2 p-4 transition-all cursor-pointer ${
                        isSelected
                          ? 'border-primary-500 bg-primary-50 ring-2 ring-primary-200'
                          : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className={`font-semibold ${isSelected ? 'text-primary-900' : 'text-gray-900'}`}>
                          {option.label}
                        </p>
                        <span className={`shrink-0 text-xs font-medium px-2 py-0.5 rounded-full ${
                          true
                            ? 'bg-gray-100 text-gray-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}>
                          Tarif
                        </span>
                      </div>
                      <p className={`text-2xl font-bold mt-2 ${isSelected ? 'text-primary-700' : 'text-gray-900'}`}>
                        {option.amount.toLocaleString('fr-FR')}
                        <span className="text-sm font-normal text-gray-400 ml-1">FCFA</span>
                      </p>
                    </button>
                  )
                })}
              </div>
              {errors.tariff_label && (
                <p className="text-sm text-red-500 mt-2">{errors.tariff_label.message}</p>
              )}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Type de participation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1.5">
              <Label>Participation *</Label>
              <Select onValueChange={(value) => setValue('participation_type', value as 'Présentiel' | 'En ligne', { shouldValidate: true })}>
                <SelectTrigger error={errors.participation_type?.message}>
                  <SelectValue placeholder="Choisir Présentiel ou En ligne" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Présentiel">Présentiel</SelectItem>
                  <SelectItem value="En ligne">En ligne</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Personal Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Informations personnelles</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="prenom">Prénom *</Label>
                <Input
                  id="prenom"
                  placeholder="Jean"
                  error={errors.prenom?.message}
                  {...register('prenom')}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="nom">Nom *</Label>
                <Input
                  id="nom"
                  placeholder="Dupont"
                  error={errors.nom?.message}
                  {...register('nom')}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                placeholder="votre@email.com"
                error={errors.email?.message}
                {...register('email')}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="telephone">Téléphone *</Label>
              <Input
                id="telephone"
                type="tel"
                placeholder="06xxxxxx"
                error={errors.telephone?.message}
                {...register('telephone')}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="organisme">Organisme</Label>
                <Input
                  id="organisme"
                  placeholder="Université de..."
                  {...register('organisme')}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="pays">Pays *</Label>
                <Input
                  id="pays"
                  placeholder="Mali"
                  error={errors.pays?.message}
                  {...register('pays')}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-primary-600" />
              Paiement
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>Méthode de paiement *</Label>
              {(activePaymentMethods.length > 0 ? activePaymentMethods : ['Orange Money']).map((method) => (
                <label
                  key={method}
                  className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white px-4 py-3 cursor-pointer hover:border-primary-200 transition-colors"
                >
                  <input
                    type="radio"
                    name="methode_paiement"
                    value={method}
                    defaultChecked={method === 'Orange Money'}
                    onChange={() => setValue('methode_paiement', method, { shouldValidate: true })}
                    className="h-4 w-4 text-primary-600"
                  />
                  <Smartphone className="h-5 w-5 text-orange-500" />
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{method}</p>
                    <p className="text-xs text-gray-500">Paiement mobile sécurisé</p>
                  </div>
                </label>
              ))}
            </div>

            {selectedPricing && (
              <div className="rounded-lg bg-primary-50 border border-primary-100 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-primary-700">{selectedPricing.label}</p>
                    <p className="text-xs text-primary-500">Tarif sélectionné</p>
                  </div>
                  <span className="text-lg font-bold text-primary-700">
                    {selectedPricing.amount.toLocaleString('fr-FR')} FCFA
                  </span>
                </div>
              </div>
            )}

            {hasOrangeMoney && (
              <div className="space-y-1.5">
                <Label htmlFor="code_otp">Code OTP Orange Money *</Label>
                <Input
                  id="code_otp"
                  type="text"
                  inputMode="numeric"
                  placeholder="Saisissez votre code OTP"
                  maxLength={6}
                  error={errors.code_otp?.message}
                  {...register('code_otp')}
                />
                <p className="text-xs text-gray-400">
                  Envoyez #150*1*1*[votre numéro]# pour générer votre code OTP Orange Money.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex items-center justify-end gap-3">
          <Button type="submit" size="lg" loading={isSubmitting || mutation.isPending} disabled={!selectedPricing}>
            {isSubmitting || mutation.isPending ? "Traitement en cours..." : "Valider l'inscription"}
          </Button>
        </div>
      </form>
    </div>
  )
}
