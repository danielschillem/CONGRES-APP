import { useQuery } from '@tanstack/react-query'
import { CalendarDays, ChevronRight, Clock, MapPin, Ticket } from 'lucide-react'
import { Link } from 'react-router-dom'
import { congressesApi } from '@/lib/api'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { EmptyState } from '@/components/Interface'
import { formatDate, getPricingOptions } from '@/lib/utils'
import type { Congress } from '@/types'

type InscriptionStatus = {
  open: boolean
  label: string
  urgent: boolean
}

function getInscriptionStatus(congress: Congress): InscriptionStatus {
  const config = congress.config ?? {}
  const deadlines = (config.deadlines ?? {}) as { inscription?: string }
  const deadline = deadlines.inscription ? new Date(deadlines.inscription) : new Date(congress.end_date)
  const daysLeft = Math.ceil((deadline.getTime() - Date.now()) / 86400000)

  if (daysLeft <= 0) return { open: false, label: 'Inscriptions fermées', urgent: false }
  if (daysLeft <= 7) return { open: true, label: `Clôture dans ${daysLeft}j`, urgent: true }
  return { open: true, label: 'Inscriptions ouvertes', urgent: false }
}

function CongressCard({ congress }: { congress: Congress }) {
  const status = getInscriptionStatus(congress)
  const pricingEntries = getPricingOptions(congress.config)
  const minPrice = pricingEntries.length > 0 ? Math.min(...pricingEntries.map((p) => p.amount)) : null

  return (
    <Card className="flex h-full flex-col overflow-hidden border-ink-200 transition hover:-translate-y-0.5 hover:shadow-lg">
      <CardHeader className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            {congress.edition && <p className="page-kicker mb-2">{congress.edition}</p>}
            <CardTitle className="line-clamp-2 text-lg leading-snug text-ink-950">{congress.title}</CardTitle>
          </div>
          <Badge variant={status.open ? 'success' : 'secondary'} className="shrink-0">
            {status.label}
          </Badge>
        </div>
        {congress.subtitle && <p className="line-clamp-2 text-sm leading-6 text-ink-500">{congress.subtitle}</p>}
      </CardHeader>

      <CardContent className="flex-1 space-y-4">
        <div className="grid gap-2 text-sm text-ink-600">
          <span className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-primary-700" />
            {formatDate(congress.start_date)} - {formatDate(congress.end_date)}
          </span>
          <span className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-primary-700" />
            {[congress.location, congress.city, congress.country].filter(Boolean).join(', ')}
          </span>
        </div>

        {minPrice !== null && (
          <div className="rounded-lg border border-ink-200 bg-ink-50 p-3">
            <div className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-2 text-sm font-medium text-ink-700">
                <Ticket className="h-4 w-4 text-accent" />
                Tarif dès
              </span>
              <span className="text-base font-semibold text-ink-950">
                {minPrice.toLocaleString('fr-FR')} FCFA
              </span>
            </div>
          </div>
        )}

        {status.open && (
          <p className={`flex items-center gap-1.5 text-xs font-medium ${status.urgent ? 'text-amber-700' : 'text-emerald-700'}`}>
            <Clock className="h-3.5 w-3.5" />
            {status.label}
          </p>
        )}
      </CardContent>

      <CardFooter>
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
    <div className="app-surface space-y-4 p-5">
      <div className="h-5 w-3/4 animate-pulse rounded bg-ink-200" />
      <div className="h-4 w-full animate-pulse rounded bg-ink-200" />
      <div className="h-4 w-2/3 animate-pulse rounded bg-ink-200" />
      <div className="h-24 animate-pulse rounded-lg bg-ink-100" />
    </div>
  )
}

export function HomePage() {
  const { data, isLoading } = useQuery({
    queryKey: ['active-congresses'],
    queryFn: async () => (await congressesApi.getActive()).data,
  })

  const congresses: Congress[] = data?.data ?? []

  return (
    <div className="min-h-screen bg-ink-50">
      <header className="sticky top-0 z-10 border-b border-white/10 bg-ink-950/90 text-white backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-400 text-sm font-bold text-ink-950">
              CS
            </div>
            <span className="hidden text-sm font-semibold sm:block">Congrès Scientifiques</span>
          </Link>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="text-white hover:bg-white/10 hover:text-white" asChild>
              <Link to="/login">Connexion</Link>
            </Button>
            <Button size="sm" asChild>
              <Link to="/register">Créer un compte</Link>
            </Button>
          </div>
        </div>
      </header>

      <section className="hero-media text-white">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-wide text-primary-100">Plateforme de congrès scientifique</p>
            <h1 className="mt-4 text-4xl font-semibold leading-tight sm:text-6xl">
              Piloter les inscriptions, soumissions et sessions scientifiques.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-cyan-50">
              Un espace unique pour organiser les congrès, suivre les paiements, gérer les relectures et publier le programme officiel.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button size="lg" asChild>
                <a href="#congresses">Voir les congrès actifs</a>
              </Button>
              <Button size="lg" variant="outline" className="border-white/40 bg-white/10 text-white hover:bg-white/20" asChild>
                <Link to="/login">Accéder à mon espace</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <main id="congresses" className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="page-kicker">Inscriptions ouvertes</p>
            <h2 className="mt-2 text-2xl font-semibold text-ink-950">Congrès actifs</h2>
          </div>
          <p className="max-w-xl text-sm leading-6 text-ink-500">
            Sélectionnez un congrès pour consulter les dates, tarifs, programme, actes et options d'inscription.
          </p>
        </div>

        {isLoading ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
          </div>
        ) : congresses.length === 0 ? (
          <EmptyState
            icon={<CalendarDays className="h-7 w-7" />}
            title="Aucun congrès actif"
            description="Les prochains événements apparaîtront ici dès leur publication."
          />
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {congresses.map((congress) => <CongressCard key={congress.id} congress={congress} />)}
          </div>
        )}
      </main>

      <footer className="border-t border-ink-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-6 text-center text-sm text-ink-500 sm:px-6 lg:px-8">
          © {new Date().getFullYear()} Congrès Scientifiques. Tous droits réservés.
        </div>
      </footer>
    </div>
  )
}
