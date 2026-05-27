import { useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation } from '@tanstack/react-query'
import { Eye, EyeOff, Save, Trash2, UserCircle } from 'lucide-react'
import { usersApi } from '@/lib/api'
import { useAuth } from '@/hooks/useAuth'
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

const profileSchema = z.object({
  civilite: z.string().min(1, 'La civilité est requise'),
  nom: z.string().min(2, 'Le nom est requis'),
  prenom: z.string().min(2, 'Le prénom est requis'),
  sexe: z.string().min(1, 'Le sexe est requis'),
  telephone: z
    .string()
    .regex(/^[05-7]\d{7}$/, 'Numéro invalide (commence par 0, 5, 6 ou 7 - 8 chiffres)'),
  email: z.string().email('Adresse email invalide'),
  organisme: z.string().optional(),
  profession: z.string().optional(),
  adresse: z.string().optional(),
  biographie: z.string().optional(),
})

const passwordSchema = z
  .object({
    current_password: z.string().min(1, 'Le mot de passe actuel est requis'),
    new_password: z.string().min(8, 'Min. 8 caractères'),
    new_password_confirmation: z.string().min(1, 'Confirmation requise'),
  })
  .refine((d) => d.new_password === d.new_password_confirmation, {
    message: 'Les mots de passe ne correspondent pas',
    path: ['new_password_confirmation'],
  })

type ProfileFormData = z.infer<typeof profileSchema>
type PasswordFormData = z.infer<typeof passwordSchema>

export function ProfilePage() {
  const { user, setUser, logout } = useAuth()
  const [profileSuccess, setProfileSuccess] = useState(false)
  const [profileError, setProfileError] = useState<string | null>(null)
  const [passwordSuccess, setPasswordSuccess] = useState(false)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  const {
    register: profileRegister,
    handleSubmit: handleProfileSubmit,
    control,
    formState: { errors: profileErrors, isSubmitting: profileSubmitting },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      civilite: user?.civilite ?? '',
      nom: user?.nom ?? '',
      prenom: user?.prenom ?? '',
      sexe: user?.sexe ?? '',
      telephone: user?.telephone ?? '',
      email: user?.email ?? '',
      organisme: user?.organisme ?? '',
      profession: user?.profession ?? '',
      adresse: user?.adresse ?? '',
      biographie: user?.biographie ?? '',
    },
  })

  const {
    register: passwordRegister,
    handleSubmit: handlePasswordSubmit,
    reset: resetPassword,
    formState: { errors: passwordErrors, isSubmitting: passwordSubmitting },
  } = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
  })

  const updateProfileMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => usersApi.updateProfile(data),
    onSuccess: (response) => {
      setUser(response.data.data)
      setProfileSuccess(true)
      setProfileError(null)
      setTimeout(() => setProfileSuccess(false), 3000)
    },
    onError: (err: unknown) => {
      const error = err as { response?: { data?: { message?: string } } }
      setProfileError(error?.response?.data?.message || 'Erreur lors de la mise à jour.')
    },
  })

  const changePasswordMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => usersApi.changePassword(data),
    onSuccess: () => {
      setPasswordSuccess(true)
      setPasswordError(null)
      resetPassword()
      setTimeout(() => setPasswordSuccess(false), 3000)
    },
    onError: (err: unknown) => {
      const error = err as { response?: { data?: { message?: string } } }
      setPasswordError(error?.response?.data?.message || 'Mot de passe actuel incorrect.')
    },
  })

  const deleteAccountMutation = useMutation({
    mutationFn: () => usersApi.deleteAccount(),
    onSuccess: () => {
      logout()
    },
  })

  const onProfileSubmit = (data: ProfileFormData) => {
    setProfileError(null)
    updateProfileMutation.mutate(data as Record<string, unknown>)
  }

  const onPasswordSubmit = (data: PasswordFormData) => {
    setPasswordError(null)
    changePasswordMutation.mutate(data as Record<string, unknown>)
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-100 text-primary-700 text-xl font-bold">
          {user?.prenom?.[0]?.toUpperCase()}{user?.nom?.[0]?.toUpperCase()}
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mon profil</h1>
          <p className="text-gray-500 text-sm">{user?.email}</p>
        </div>
      </div>

      {/* Profile Form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <UserCircle className="h-4 w-4 text-primary-600" />
            Informations personnelles
          </CardTitle>
        </CardHeader>
        <CardContent>
          {profileSuccess && (
            <div className="mb-4 rounded-lg bg-green-50 border border-green-200 p-3 text-sm text-green-700">
              Profil mis à jour avec succès !
            </div>
          )}
          {profileError && (
            <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
              {profileError}
            </div>
          )}

          <form onSubmit={handleProfileSubmit(onProfileSubmit)} className="space-y-4" noValidate>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Civilité *</Label>
                <Controller
                  name="civilite"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger error={profileErrors.civilite?.message}>
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
                <Label>Sexe *</Label>
                <Controller
                  name="sexe"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger error={profileErrors.sexe?.message}>
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

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="nom">Nom *</Label>
                <Input id="nom" error={profileErrors.nom?.message} {...profileRegister('nom')} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="prenom">Prénom *</Label>
                <Input id="prenom" error={profileErrors.prenom?.message} {...profileRegister('prenom')} />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="telephone">Téléphone *</Label>
              <Input id="telephone" error={profileErrors.telephone?.message} {...profileRegister('telephone')} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email">Email *</Label>
              <Input id="email" type="email" error={profileErrors.email?.message} {...profileRegister('email')} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="organisme">Organisme</Label>
                <Input id="organisme" {...profileRegister('organisme')} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="profession">Profession</Label>
                <Input id="profession" {...profileRegister('profession')} />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="adresse">Adresse</Label>
              <Input id="adresse" {...profileRegister('adresse')} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="biographie">Biographie</Label>
              <Textarea id="biographie" rows={3} {...profileRegister('biographie')} />
            </div>

            <div className="flex justify-end">
              <Button type="submit" loading={profileSubmitting || updateProfileMutation.isPending}>
                <Save className="h-4 w-4 mr-2" />
                Enregistrer
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Password Change */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Changer le mot de passe</CardTitle>
        </CardHeader>
        <CardContent>
          {passwordSuccess && (
            <div className="mb-4 rounded-lg bg-green-50 border border-green-200 p-3 text-sm text-green-700">
              Mot de passe modifié avec succès !
            </div>
          )}
          {passwordError && (
            <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
              {passwordError}
            </div>
          )}

          <form onSubmit={handlePasswordSubmit(onPasswordSubmit)} className="space-y-4" noValidate>
            <div className="space-y-1.5">
              <Label htmlFor="current_password">Mot de passe actuel</Label>
              <div className="relative">
                <Input
                  id="current_password"
                  type={showCurrent ? 'text' : 'password'}
                  className="pr-10"
                  error={passwordErrors.current_password?.message}
                  {...passwordRegister('current_password')}
                />
                <button type="button" onClick={() => setShowCurrent(!showCurrent)} className="absolute right-3 top-2.5 text-gray-400" tabIndex={-1}>
                  {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="new_password">Nouveau mot de passe</Label>
                <div className="relative">
                  <Input
                    id="new_password"
                    type={showNew ? 'text' : 'password'}
                    className="pr-10"
                    error={passwordErrors.new_password?.message}
                    {...passwordRegister('new_password')}
                  />
                  <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-3 top-2.5 text-gray-400" tabIndex={-1}>
                    {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="new_password_confirmation">Confirmation</Label>
                <div className="relative">
                  <Input
                    id="new_password_confirmation"
                    type={showConfirm ? 'text' : 'password'}
                    className="pr-10"
                    error={passwordErrors.new_password_confirmation?.message}
                    {...passwordRegister('new_password_confirmation')}
                  />
                  <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-2.5 text-gray-400" tabIndex={-1}>
                    {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <Button type="submit" loading={passwordSubmitting || changePasswordMutation.isPending}>
                Mettre à jour le mot de passe
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="text-base text-red-600">Zone de danger</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900">Supprimer mon compte</p>
              <p className="text-xs text-gray-500 mt-0.5">
                Cette action est irréversible. Toutes vos données seront supprimées.
              </p>
            </div>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setDeleteDialogOpen(true)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Supprimer
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer le compte</DialogTitle>
            <DialogDescription>
              Êtes-vous absolument sûr ? Cette action supprimera définitivement votre compte et
              toutes vos soumissions. Elle est irréversible.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Annuler
            </Button>
            <Button
              variant="destructive"
              loading={deleteAccountMutation.isPending}
              onClick={() => deleteAccountMutation.mutate()}
            >
              Oui, supprimer mon compte
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
