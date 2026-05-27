import { useEffect } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Link, useSearchParams } from 'react-router-dom'
import { CheckCircle2, Loader2, MailCheck, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { reviewerInvitationApi } from '@/lib/api'

export function ReviewerInvitationAcceptPage() {
  const [params] = useSearchParams()
  const token = params.get('token') ?? ''

  const acceptMutation = useMutation({
    mutationFn: (value: string) => reviewerInvitationApi.accept(value),
  })

  useEffect(() => {
    if (token && acceptMutation.isIdle) acceptMutation.mutate(token)
  }, [token, acceptMutation])

  const success = acceptMutation.isSuccess
  const failed = !token || acceptMutation.isError

  return (
    <div className="hero-media flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-lg rounded-lg border border-white/20 bg-white p-8 shadow-2xl">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-lg bg-primary-50 text-primary-700">
          {success ? (
            <CheckCircle2 className="h-8 w-8" />
          ) : failed ? (
            <XCircle className="h-8 w-8 text-red-600" />
          ) : (
            <Loader2 className="h-8 w-8 animate-spin" />
          )}
        </div>

        <div className="text-center">
          <p className="page-kicker">Invitation relecteur</p>
          <h1 className="mt-2 text-2xl font-semibold text-ink-950">
            {success ? 'Invitation acceptée' : failed ? 'Invitation indisponible' : 'Validation en cours'}
          </h1>
          <p className="mt-3 text-sm leading-6 text-ink-600">
            {success
              ? 'Votre compte relecteur est activé. Si un mot de passe temporaire a été créé, il vous a été envoyé par email.'
              : failed
                ? "Le lien est invalide, expiré ou a déjà été utilisé. Contactez l'organisation du congrès."
                : 'Nous vérifions votre invitation et préparons votre accès relecteur.'}
          </p>
        </div>

        <div className="mt-7 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Button asChild>
            <Link to="/login">
              <MailCheck className="mr-2 h-4 w-4" />
              Se connecter
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/">Retour accueil</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
