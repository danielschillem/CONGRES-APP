import { useQuery } from '@tanstack/react-query'
import { CalendarDays, Clock, MapPin, ChevronRight, Ticket } from 'lucide-react'
import { Link } from 'react-router-dom'
import { congressesApi } from '@/lib/api'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { formatDate, getPricingOptions } from '@/lib/utils'
import { Congress } from '@/types'

type InscriptionStatus = {
  open: boolean
  label: string
  urgent: boolean
}

function getInscriptionStatus(congress: Congress): InscriptionStatus {
  const config = congress.config ?? {}
  const deadlines = (config.deadlines ?? {}) as { inscription?: string }
  const deadline = deadlines.inscription
    ? new Date(deadlines.inscription)
    : new Date(congress.end_date)

  const now = new Date()
  const daysLeft = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

  if (daysLeft <= 0) return { open: false, label: 'Inscriptions fermées', urgent: false }
  if (daysLeft <= 7) return { open: true, label: `Clôture dans ${daysLeft}j`, urgent: true }
  return { open: true, label: 'Inscriptions ouvertes', urgent: false }
}

function CongressCard({ congress }: { congress: Congress }) {
  const status = getInscriptionStatus(congress)
  const pricingEntries = getPricingOptions(congress.config)

  return (
    <Card className="flex flex-col hover:shadow-lg transition-shadow duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg leading-snug">{congress.title}</CardTitle>
            {congress.subtitle && (
              <CardDescription className="mt-1 line-clamp-2">{congress.subtitle}</CardDescription>
            )}
          </div>
          <Badge
            variant={status.open ? 'success' : 'secondary'}
            className="shrink-0 text-xs whitespace-nowrap"
          >
            {status.label}
          </Badge>
        </div>
        {congress.edition && (
          <span className="inline-block text-xs font-semibold uppercase tracking-wide text-primary-600 bg-primary-50 px-2 py-0.5 rounded mt-1 w-fit">
            {congress.edition}
          </span>
        )}
      </CardHeader>

      <CardContent className="flex-1 space-y-4">
        {congress.description && (
          <p className="text-sm text-gray-600 line-clamp-2">{congress.description}</p>
        )}

        <div className="space-y-2">
          <div className="flex items-start gap-2 text-sm text-gray-600">
            <CalendarDays className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
            <span>
              <span className="font-medium text-gray-800">{formatDate(congress.start_date)}</span>
              <span className="text-gray-400 mx-1.5">→</span>
              <span className="font-medium text-gray-800">{formatDate(congress.end_date)}</span>
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <MapPin className="h-4 w-4 text-gray-400 shrink-0" />
            <span className="line-clamp-1">
              {[congress.location, congress.city, congress.country].filter(Boolean).join(', ')}
            </span>
          </div>
        </div>

        {pricingEntries.length > 0 && (
          <div>
            <div className="flex items-center gap-1.5 text-xs font-medium text-gray-500 mb-2">
              <Ticket className="h-3.5 w-3.5" />
              Tarifs d'inscription
            </div>
            <div className="space-y-1.5">
              {pricingEntries.map((p, i) => (
                <div key={i} className="flex items-center justify-between bg-gray-50 border border-gray-100 rounded-md px-3 py-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-sm font-medium text-gray-900 truncate">{p.label}</span>
                  </div>
                  <span className="text-sm font-bold text-gray-900 shrink-0 ml-2">
                    {p.amount.toLocaleString('fr-FR')} <span className="text-xs font-normal text-gray-400">FCFA</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {status.open && (
          <div
            className={`flex items-center gap-1.5 text-xs font-medium ${
              status.urgent ? 'text-amber-600' : 'text-green-600'
            }`}
          >
            <Clock className="h-3.5 w-3.5" />
            {status.label}
          </div>
        )}
      </CardContent>

      <CardFooter className="pt-3">
        <Button asChild className="w-full gap-2">
          <Link to={`/congress/${congress.id}`}>
            Accéder au congrès
            <ChevronRight className="h-4 w-4" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  )
}

function SkeletonCard() {
  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-3">
        <div className="h-5 bg-gray-200 rounded animate-pulse w-3/4" />
        <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2 mt-2" />
      </CardHeader>
      <CardContent className="flex-1 space-y-4">
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 rounded animate-pulse" />
          <div className="h-4 bg-gray-200 rounded animate-pulse w-4/5" />
        </div>
        <div className="grid grid-cols-3 gap-1.5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 bg-gray-200 rounded animate-pulse" />
          ))}
        </div>
      </CardContent>
      <CardFooter>
        <div className="h-10 bg-gray-200 rounded animate-pulse w-full" />
      </CardFooter>
    </Card>
  )
}

export function HomePage() {
  const { data, isLoading } = useQuery({
    queryKey: ['active-congresses'],
    queryFn: async () => (await congressesApi.getActive()).data,
  })

  const congresses: Congress[] = data?.data ?? []

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white sticky top-0 z-10 shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-600 text-white font-bold text-base">
              C
            </div>
            <span className="text-base font-semibold text-gray-900 hidden sm:block">
              Congrès Scientifiques
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/login">Connexion</Link>
            </Button>
            <Button size="sm" asChild>
              <Link to="/register">S'inscrire</Link>
            </Button>
          </div>
        </div>
      </header>

      <section className="bg-gradient-to-br from-primary-700 via-primary-600 to-primary-500 text-white">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl leading-tight">
              Congrès Scientifiques
            </h1>
            <p className="mt-4 text-lg text-primary-100 max-w-xl">
              Découvrez les congrès actifs, soumettez vos travaux de recherche et gérez vos inscriptions en ligne.
            </p>
            {!isLoading && congresses.length > 0 && (
              <div className="mt-6 inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-1.5 text-sm text-primary-100">
                <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
                {congresses.length} congrès actif{congresses.length > 1 ? 's' : ''} en ce moment
              </div>
            )}
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Congrès actifs</h2>

        {isLoading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : congresses.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="h-20 w-20 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <CalendarDays className="h-10 w-10 text-gray-300" />
            </div>
            <p className="text-lg font-semibold text-gray-700">Aucun congrès actif</p>
            <p className="text-sm text-gray-400 mt-2 max-w-sm">
              Il n'y a pas de congrès actifs pour le moment. Revenez bientôt pour découvrir les
              prochains événements.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {congresses.map((congress) => (
              <CongressCard key={congress.id} congress={congress} />
            ))}
          </div>
        )}
      </main>

      <footer className="border-t border-gray-200 bg-white mt-12">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 text-center text-sm text-gray-400">
          &copy; {new Date().getFullYear()} Congrès Scientifiques. Tous droits réservés.
        </div>
      </footer>
    </div>
  )
}
