import { useQuery } from '@tanstack/react-query'
import {
  ArrowLeft,
  Building,
  CalendarDays,
  Clock,
  FileText,
  MapPin,
  Ticket,
  Users,
  BookOpen,
  AlertCircle,
  LogIn,
} from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { congressesApi } from '@/lib/api'
import { useAuthStore } from '@/stores/authStore'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatDate } from '@/lib/utils'
import { Congress } from '@/types'

function daysLeft(dateStr: string): number {
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000)
}

function DeadlineBadge({ days }: { days: number }) {
  if (days <= 0) return <span className="text-xs text-gray-400 font-medium">Clôturé</span>
  if (days <= 7)
    return (
      <span className="text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
        {days}j restants
      </span>
    )
  return (
    <span className="text-xs font-medium text-green-700 bg-green-50 px-2 py-0.5 rounded-full">
      {days}j restants
    </span>
  )
}

interface ActionSectionProps {
  congress: Congress
  inscriptionOpen: boolean
  submissionOpen: boolean
  inscriptionDays: number
  submissionDays: number
  isAuthenticated: boolean
}

function ActionSection({
  congress,
  inscriptionOpen,
  submissionOpen,
  inscriptionDays,
  submissionDays,
  isAuthenticated,
}: ActionSectionProps) {
  if (!inscriptionOpen && !submissionOpen) {
    return (
      <div className="flex flex-col items-center gap-3 py-6">
        <div className="flex items-center gap-2 text-gray-500 bg-gray-100 rounded-xl px-8 py-4">
          <Clock className="h-5 w-5 shrink-0" />
          <span className="font-medium">Les inscriptions et soumissions sont fermées pour ce congrès</span>
        </div>
        {isAuthenticated && (
          <Button variant="outline" asChild>
            <Link to="/dashboard">Accéder à mon espace</Link>
          </Button>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex flex-wrap gap-4 justify-center">
        {inscriptionOpen && (
          <div className="flex flex-col items-center gap-1">
            <Button size="lg" className="min-w-[220px] gap-2" asChild>
              {isAuthenticated ? (
                <Link to={`/inscription?congress_id=${congress.id}`}>
                  <Users className="h-5 w-5" />
                  S'inscrire à ce congrès
                </Link>
              ) : (
                <Link to={`/register?congress=${congress.id}`}>
                  <Users className="h-5 w-5" />
                  S'inscrire au congrès
                </Link>
              )}
            </Button>
            {inscriptionDays > 0 && inscriptionDays <= 30 && (
              <span className={`text-xs font-medium ${inscriptionDays <= 7 ? 'text-amber-600' : 'text-green-600'}`}>
                Clôture dans {inscriptionDays} jour{inscriptionDays > 1 ? 's' : ''}
              </span>
            )}
          </div>
        )}

        {submissionOpen && (
          <div className="flex flex-col items-center gap-1">
            <Button size="lg" variant="outline" className="min-w-[220px] gap-2" asChild>
              {isAuthenticated ? (
                <Link to="/soumission/nouveau">
                  <FileText className="h-5 w-5" />
                  Soumettre une communication
                </Link>
              ) : (
                <Link to="/login">
                  <LogIn className="h-5 w-5" />
                  Connexion pour soumettre
                </Link>
              )}
            </Button>
            {submissionDays > 0 && submissionDays <= 30 && (
              <span className={`text-xs font-medium ${submissionDays <= 7 ? 'text-amber-600' : 'text-blue-600'}`}>
                Clôture dans {submissionDays} jour{submissionDays > 1 ? 's' : ''}
              </span>
            )}
          </div>
        )}
      </div>

      {!isAuthenticated && submissionOpen && (
        <p className="text-xs text-gray-400 flex items-center gap-1">
          <AlertCircle className="h-3.5 w-3.5" />
          Une connexion est requise pour soumettre une communication
        </p>
      )}
    </div>
  )
}

export function CongressDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { isAuthenticated } = useAuthStore()

  const { data, isLoading } = useQuery({
    queryKey: ['public-congress', id],
    queryFn: async () => (await congressesApi.getOne(id!)).data,
    enabled: !!id,
  })

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center gap-2 text-gray-400">
          <svg
            className="h-6 w-6 animate-spin"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
          Chargement…
        </div>
      </div>
    )
  }

  const congress: Congress | undefined = data?.data

  if (!congress) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4">
        <FileText className="h-16 w-16 text-gray-300" />
        <p className="text-lg font-medium text-gray-500">Congrès introuvable</p>
        <Button asChild>
          <Link to="/">Retour à l'accueil</Link>
        </Button>
      </div>
    )
  }

  const config = congress.config ?? {}
  const pricing = (config.pricing ?? {}) as { presentiel?: number; en_ligne?: number; virtuel?: number }
  const deadlines = (config.deadlines ?? {}) as { submission?: string; inscription?: string }
  const themes = (config.themes ?? []) as string[]
  const submissionTypes = (config.submission_types ?? []) as string[]
  const org = (congress.organisational_structure ?? {}) as { president?: string; secretariat?: string | string[] }

  const now = new Date()
  const inscriptionDeadline = deadlines.inscription ? new Date(deadlines.inscription) : new Date(congress.end_date)
  const submissionDeadline = deadlines.submission ? new Date(deadlines.submission) : new Date(congress.end_date)
  const inscriptionOpen = now < inscriptionDeadline
  const submissionOpen = now < submissionDeadline
  const inscriptionDays = daysLeft(inscriptionDeadline.toISOString())
  const submissionDays = daysLeft(submissionDeadline.toISOString())

  const pricingEntries = [
    { label: 'Présentiel', value: pricing.presentiel },
    { label: 'En ligne', value: pricing.en_ligne },
    { label: 'Virtuel', value: pricing.virtuel },
  ].filter((p): p is { label: string; value: number } => !!p.value)

  const secretariat = org.secretariat
    ? Array.isArray(org.secretariat)
      ? org.secretariat
      : [org.secretariat]
    : []

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sticky header */}
      <header className="border-b border-gray-200 bg-white sticky top-0 z-10 shadow-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Accueil
            </Link>
          </Button>
          <div className="flex items-center gap-2">
            {isAuthenticated ? (
              <Button size="sm" asChild>
                <Link to="/dashboard">Mon espace</Link>
              </Button>
            ) : (
              <>
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/login">Connexion</Link>
                </Button>
                <Button size="sm" asChild>
                  <Link to="/register">S'inscrire</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <div className="bg-gradient-to-br from-primary-700 via-primary-600 to-primary-500 text-white">
        <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <Badge variant="success" className="text-sm px-3 py-1">
              Actif
            </Badge>
            {congress.edition && (
              <span className="text-sm font-semibold bg-white/15 px-3 py-1 rounded-full">
                {congress.edition}
              </span>
            )}
            {inscriptionOpen && (
              <span
                className={`text-sm font-medium px-3 py-1 rounded-full ${
                  inscriptionDays <= 7
                    ? 'bg-amber-400/20 text-amber-100'
                    : 'bg-green-400/20 text-green-100'
                }`}
              >
                <Clock className="h-3.5 w-3.5 inline mr-1" />
                {inscriptionDays <= 30
                  ? `Inscriptions — ${inscriptionDays}j restants`
                  : 'Inscriptions ouvertes'}
              </span>
            )}
          </div>

          <h1 className="text-3xl sm:text-4xl font-bold leading-tight">{congress.title}</h1>
          {congress.subtitle && (
            <p className="mt-2 text-lg text-primary-100">{congress.subtitle}</p>
          )}

          <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm text-primary-200">
            <span className="flex items-center gap-1.5">
              <CalendarDays className="h-4 w-4" />
              {formatDate(congress.start_date)} → {formatDate(congress.end_date)}
            </span>
            <span className="flex items-center gap-1.5">
              <MapPin className="h-4 w-4" />
              {[congress.location, congress.city, congress.country].filter(Boolean).join(', ')}
            </span>
            {pricingEntries.length > 0 && (
              <span className="flex items-center gap-1.5">
                <Ticket className="h-4 w-4" />À partir de{' '}
                {Math.min(...pricingEntries.map((p) => p.value)).toLocaleString('fr-FR')} FCFA
              </span>
            )}
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 space-y-6">
        {/* Description */}
        {congress.description && (
          <Card>
            <CardContent className="pt-6">
              <p className="text-gray-700 whitespace-pre-line leading-relaxed">{congress.description}</p>
            </CardContent>
          </Card>
        )}

        {/* Info grid */}
        <div className="grid gap-4 sm:grid-cols-2">
          {/* Dates & Échéances */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <CalendarDays className="h-5 w-5 text-primary-600" />
                Dates & Échéances
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Début du congrès</span>
                <span className="font-semibold text-gray-900">{formatDate(congress.start_date)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Fin du congrès</span>
                <span className="font-semibold text-gray-900">{formatDate(congress.end_date)}</span>
              </div>
              {deadlines.inscription && (
                <div className="flex justify-between items-center pt-1 border-t border-gray-100">
                  <span className="text-gray-500">Clôture inscriptions</span>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-800">
                      {formatDate(deadlines.inscription)}
                    </span>
                    <DeadlineBadge days={inscriptionDays} />
                  </div>
                </div>
              )}
              {deadlines.submission && (
                <div className="flex justify-between items-center border-t border-gray-100 pt-1">
                  <span className="text-gray-500">Clôture soumissions</span>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-800">
                      {formatDate(deadlines.submission)}
                    </span>
                    <DeadlineBadge days={submissionDays} />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Lieu */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <MapPin className="h-5 w-5 text-primary-600" />
                Lieu
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 text-sm text-gray-700">
              <p className="font-semibold text-gray-900 text-base">{congress.location}</p>
              {congress.city && <p className="text-gray-500">{congress.city}</p>}
              {congress.country && <p className="text-gray-400">{congress.country}</p>}
            </CardContent>
          </Card>

          {/* Comité d'organisation */}
          {(org.president || secretariat.length > 0) && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Building className="h-5 w-5 text-primary-600" />
                  Comité d'organisation
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {org.president && (
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wide font-medium mb-0.5">
                      Président
                    </p>
                    <p className="font-semibold text-gray-900">{org.president}</p>
                  </div>
                )}
                {secretariat.length > 0 && (
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wide font-medium mb-1">
                      Secrétariat
                    </p>
                    <ul className="space-y-0.5">
                      {secretariat.map((s) => (
                        <li key={s} className="text-gray-700">{s}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Types de soumission */}
          {submissionTypes.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <BookOpen className="h-5 w-5 text-primary-600" />
                  Types de soumission
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-1.5">
                  {submissionTypes.map((type) => (
                    <li key={type} className="flex items-center gap-2 text-sm text-gray-700">
                      <span className="h-1.5 w-1.5 rounded-full bg-primary-400 shrink-0" />
                      {type}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Thématiques */}
        {themes.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <FileText className="h-5 w-5 text-primary-600" />
                Thématiques
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {themes.map((theme) => (
                  <Badge key={theme} variant="secondary" className="text-sm py-1 px-3">
                    {theme}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tarifs */}
        {pricingEntries.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Ticket className="h-5 w-5 text-primary-600" />
                Tarifs d'inscription
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className={`grid gap-4 ${
                  pricingEntries.length === 1
                    ? 'grid-cols-1 max-w-xs'
                    : pricingEntries.length === 2
                    ? 'sm:grid-cols-2'
                    : 'sm:grid-cols-3'
                }`}
              >
                {pricingEntries.map((p, i) => (
                  <div
                    key={p.label}
                    className={`rounded-xl border-2 p-5 text-center ${
                      i === 0
                        ? 'border-primary-200 bg-primary-50'
                        : 'border-gray-100 bg-gray-50'
                    }`}
                  >
                    <p className="text-sm font-medium text-gray-600 mb-1">{p.label}</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {Number(p.value).toLocaleString('fr-FR')}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">FCFA</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        <div className="bg-white border border-gray-200 rounded-xl p-8 text-center shadow-sm">
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            {inscriptionOpen || submissionOpen ? 'Participer au congrès' : 'Congrès terminé'}
          </h2>
          {(inscriptionOpen || submissionOpen) && (
            <p className="text-sm text-gray-500 mb-6">
              {inscriptionOpen && submissionOpen
                ? 'Inscrivez-vous et soumettez vos travaux de recherche.'
                : inscriptionOpen
                ? 'Les inscriptions sont ouvertes. Rejoignez-nous !'
                : 'Soumettez vos communications avant la clôture.'}
            </p>
          )}
          <ActionSection
            congress={congress}
            inscriptionOpen={inscriptionOpen}
            submissionOpen={submissionOpen}
            inscriptionDays={inscriptionDays}
            submissionDays={submissionDays}
            isAuthenticated={isAuthenticated}
          />
        </div>
      </main>

      <footer className="border-t border-gray-200 bg-white mt-8">
        <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 text-center text-sm text-gray-400">
          &copy; {new Date().getFullYear()} Congrès Scientifiques. Tous droits réservés.
        </div>
      </footer>
    </div>
  )
}
