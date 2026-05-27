import { useState, useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQuery } from '@tanstack/react-query'
import { CheckCircle2, CreditCard, Smartphone, CalendarDays, MapPin } from 'lucide-react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { inscriptionsApi, congressesApi } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatDate } from '@/lib/utils'
import { Congress } from '@/types'

const inscriptionSchema = z.object({
  nom: z.string().min(2, 'Le nom est requis'),
  prenom: z.string().min(2, 'Le prénom est requis'),
  email: z.string().email('Adresse email invalide'),
  telephone: z
    .string()
    .regex(/^[05-7]\d{7}$/, 'Numéro invalide (commence par 0, 5, 6 ou 7 — 8 chiffres)'),
  organisme: z.string().optional(),
  pays: z.string().min(2, 'Le pays est requis'),
  participation_type: z.enum(['Présentiel', 'En ligne', 'Virtuel'], {
    required_error: 'Le type de participation est requis',
  }),
  montant: z
    .string()
    .refine((v) => !isNaN(Number(v)) && Number(v) > 0, 'Le montant doit être un nombre positif'),
  methode_paiement: z.literal('Orange Money'),
  code_otp: z
    .string()
    .min(4, 'Le code OTP doit comporter au moins 4 chiffres')
    .regex(/^\d+$/, 'Le code OTP ne doit contenir que des chiffres'),
})

type InscriptionFormData = z.infer<typeof inscriptionSchema>

const DEFAULT_PRICES: Record<string, number> = {
  Présentiel: 50000,
  'En ligne': 25000,
  Virtuel: 15000,
}

export function InscriptionPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const congressId = searchParams.get('congress_id')
  const [success, setSuccess] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const [prices, setPrices] = useState<Record<string, number>>(DEFAULT_PRICES)

  const { data: congressData, isLoading: congressLoading } = useQuery({
    queryKey: ['inscription-congress', congressId],
    queryFn: async () => (await congressesApi.getOne(congressId!)).data,
    enabled: !!congressId,
  })

  const congress: Congress | undefined = congressData?.data

  useEffect(() => {
    if (congress?.config) {
      const config = congress.config
      const pricing = (config.pricing ?? {}) as { presentiel?: number; en_ligne?: number; virtuel?: number }
      if (pricing.presentiel || pricing.en_ligne || pricing.virtuel) {
        setPrices({
          Présentiel: pricing.presentiel ?? DEFAULT_PRICES['Présentiel'],
          'En ligne': pricing.en_ligne ?? DEFAULT_PRICES['En ligne'],
          Virtuel: pricing.virtuel ?? DEFAULT_PRICES['Virtuel'],
        })
      }
    }
  }, [congress])

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<InscriptionFormData>({
    resolver: zodResolver(inscriptionSchema),
    defaultValues: {
      methode_paiement: 'Orange Money',
      montant: '',
    },
  })

  const participationType = watch('participation_type')

  const handleParticipationChange = (value: string) => {
    setValue('participation_type', value as 'Présentiel' | 'En ligne' | 'Virtuel')
    if (prices[value]) {
      setValue('montant', prices[value].toString())
    }
  }

  const mutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => inscriptionsApi.create(data),
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

  const onSubmit = (data: InscriptionFormData) => {
    setServerError(null)
    mutation.mutate({
      ...data,
      montant: Number(data.montant),
      congress_id: congressId,
    } as Record<string, unknown>)
  }

  if (!congressId) {
    return (
      <div className="max-w-lg mx-auto text-center py-20">
        <CalendarDays className="h-16 w-16 text-gray-300 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-gray-900 mb-2">Aucun congrès sélectionné</h2>
        <p className="text-gray-500 mb-6">Veuillez choisir un congrès depuis la page d'accueil.</p>
        <Button onClick={() => navigate('/')}>Voir les congrès actifs</Button>
      </div>
    )
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
          Remplissez le formulaire pour vous inscrire à l'événement
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

        {/* Participation */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Type de participation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>Mode de participation *</Label>
              <Controller
                name="participation_type"
                control={control}
                render={({ field }) => (
                  <Select
                    onValueChange={(v) => {
                      field.onChange(v)
                      handleParticipationChange(v)
                    }}
                    value={field.value}
                  >
                    <SelectTrigger error={errors.participation_type?.message}>
                      <SelectValue placeholder="Sélectionner un mode" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Présentiel">
                        Présentiel — {prices['Présentiel'].toLocaleString('fr-FR')} FCFA
                      </SelectItem>
                      <SelectItem value="En ligne">
                        En ligne — {prices['En ligne'].toLocaleString('fr-FR')} FCFA
                      </SelectItem>
                      <SelectItem value="Virtuel">
                        Virtuel — {prices['Virtuel'].toLocaleString('fr-FR')} FCFA
                      </SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            {participationType && (
              <div className="rounded-lg bg-primary-50 border border-primary-100 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-primary-700">Montant à payer</span>
                  <span className="text-lg font-bold text-primary-700">
                    {prices[participationType]?.toLocaleString('fr-FR')} FCFA
                  </span>
                </div>
              </div>
            )}
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
              <div className="flex items-center gap-3 rounded-lg border border-primary-200 bg-primary-50 px-4 py-3">
                <Smartphone className="h-5 w-5 text-orange-500" />
                <div>
                  <p className="text-sm font-semibold text-gray-900">Orange Money</p>
                  <p className="text-xs text-gray-500">Paiement mobile sécurisé</p>
                </div>
                <div className="ml-auto">
                  <div className="h-4 w-4 rounded-full border-2 border-primary-600 bg-primary-600 flex items-center justify-center">
                    <div className="h-1.5 w-1.5 rounded-full bg-white" />
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="montant">Montant (FCFA) *</Label>
              <Input
                id="montant"
                type="number"
                placeholder="50000"
                error={errors.montant?.message}
                {...register('montant')}
              />
            </div>

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
          </CardContent>
        </Card>

        <div className="flex items-center justify-end gap-3">
          <Button type="submit" size="lg" loading={isSubmitting || mutation.isPending}>
            {isSubmitting || mutation.isPending ? "Traitement en cours..." : "Valider l'inscription"}
          </Button>
        </div>
      </form>
    </div>
  )
}
