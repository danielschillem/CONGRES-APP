import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, GraduationCap } from 'lucide-react'
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
import { authApi } from '@/lib/api'

const registerSchema = z
  .object({
    civilite: z.string().min(1, 'La civilité est requise'),
    nom: z.string().min(2, 'Le nom doit comporter au moins 2 caractères'),
    prenom: z.string().min(2, 'Le prénom doit comporter au moins 2 caractères'),
    sexe: z.string().min(1, 'Le sexe est requis'),
    telephone: z
      .string()
      .regex(/^[05-7]\d{7}$/, 'Numéro invalide (commence par 0, 5, 6 ou 7 — 8 chiffres)'),
    email: z.string().email('Adresse email invalide'),
    password: z.string().min(8, 'Le mot de passe doit comporter au moins 8 caractères'),
    password_confirmation: z.string().min(1, 'Veuillez confirmer votre mot de passe'),
    organisme: z.string().optional(),
    profession: z.string().optional(),
    adresse: z.string().optional(),
    biographie: z.string().optional(),
  })
  .refine((data) => data.password === data.password_confirmation, {
    message: 'Les mots de passe ne correspondent pas',
    path: ['password_confirmation'],
  })

type RegisterFormData = z.infer<typeof registerSchema>

export function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const navigate = useNavigate()

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  })

  const onSubmit = async (data: RegisterFormData) => {
    setServerError(null)
    try {
      await authApi.register(data as Record<string, unknown>)
      navigate('/login', { state: { registered: true } })
    } catch (err: unknown) {
      const error = err as {
        response?: { data?: { message?: string; error?: string; errors?: Record<string, string[]> } }
      }
      const errorData = error?.response?.data
      if (errorData?.errors) {
        const firstError = Object.values(errorData.errors)[0]?.[0]
        setServerError(firstError ?? 'Une erreur est survenue lors de l\'inscription.')
      } else {
        setServerError(
          errorData?.message || errorData?.error || 'Une erreur est survenue lors de l\'inscription.'
        )
      }
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-indigo-50 px-4 py-12">
      <div className="w-full max-w-2xl">
        {/* Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-primary-600 text-white mb-4 shadow-lg">
            <GraduationCap className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Congrès Scientifique</h1>
          <p className="text-gray-500 mt-1 text-sm">Créez votre compte chercheur</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Créer un compte</h2>
            <p className="text-sm text-gray-500 mt-1">Remplissez le formulaire ci-dessous</p>
          </div>

          {serverError && (
            <div className="mb-5 rounded-lg bg-red-50 border border-red-200 p-3.5 text-sm text-red-700">
              {serverError}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
            {/* Row: Civilité + Sexe */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="civilite">Civilité *</Label>
                <Controller
                  name="civilite"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger error={errors.civilite?.message}>
                        <SelectValue placeholder="Sélectionner" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="M.">M.</SelectItem>
                        <SelectItem value="Mme">Mme</SelectItem>
                        <SelectItem value="Dr">Dr</SelectItem>
                        <SelectItem value="Pr">Pr</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="sexe">Sexe *</Label>
                <Controller
                  name="sexe"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger error={errors.sexe?.message}>
                        <SelectValue placeholder="Sélectionner" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Homme">Homme</SelectItem>
                        <SelectItem value="Femme">Femme</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>

            {/* Row: Nom + Prénom */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="nom">Nom *</Label>
                <Input
                  id="nom"
                  placeholder="Dupont"
                  error={errors.nom?.message}
                  {...register('nom')}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="prenom">Prénom *</Label>
                <Input
                  id="prenom"
                  placeholder="Jean"
                  error={errors.prenom?.message}
                  {...register('prenom')}
                />
              </div>
            </div>

            {/* Téléphone */}
            <div className="space-y-1.5">
              <Label htmlFor="telephone">Téléphone *</Label>
              <Input
                id="telephone"
                type="tel"
                placeholder="06xxxxxx (8 chiffres)"
                error={errors.telephone?.message}
                {...register('telephone')}
              />
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <Label htmlFor="email">Adresse email *</Label>
              <Input
                id="email"
                type="email"
                placeholder="votre@email.com"
                autoComplete="email"
                error={errors.email?.message}
                {...register('email')}
              />
            </div>

            {/* Passwords */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="password">Mot de passe *</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Min. 8 caractères"
                    autoComplete="new-password"
                    error={errors.password?.message}
                    className="pr-10"
                    {...register('password')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password_confirmation">Confirmation *</Label>
                <div className="relative">
                  <Input
                    id="password_confirmation"
                    type={showConfirm ? 'text' : 'password'}
                    placeholder="Répéter le mot de passe"
                    autoComplete="new-password"
                    error={errors.password_confirmation?.message}
                    className="pr-10"
                    {...register('password_confirmation')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                    tabIndex={-1}
                  >
                    {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Divider: optional fields */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-3 text-gray-400 font-medium">Informations optionnelles</span>
              </div>
            </div>

            {/* Organisme + Profession */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="organisme">Organisme / Institution</Label>
                <Input
                  id="organisme"
                  placeholder="Université de..."
                  {...register('organisme')}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="profession">Profession</Label>
                <Input
                  id="profession"
                  placeholder="Chercheur, Professeur..."
                  {...register('profession')}
                />
              </div>
            </div>

            {/* Adresse */}
            <div className="space-y-1.5">
              <Label htmlFor="adresse">Adresse</Label>
              <Input
                id="adresse"
                placeholder="123 rue de la Science..."
                {...register('adresse')}
              />
            </div>

            {/* Biographie */}
            <div className="space-y-1.5">
              <Label htmlFor="biographie">Biographie</Label>
              <Textarea
                id="biographie"
                placeholder="Quelques mots sur vous..."
                rows={3}
                {...register('biographie')}
              />
            </div>

            <Button type="submit" className="w-full" size="lg" loading={isSubmitting}>
              {isSubmitting ? 'Création du compte...' : 'Créer mon compte'}
            </Button>
          </form>
        </div>

        <p className="text-center text-sm text-gray-600 mt-6">
          Déjà un compte ?{' '}
          <Link
            to="/login"
            className="font-medium text-primary-600 hover:text-primary-700 hover:underline"
          >
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  )
}
