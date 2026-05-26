import { useQuery } from '@tanstack/react-query'
import { CalendarDays, Clock, MapPin, Users } from 'lucide-react'
import { Link } from 'react-router-dom'
import { congressesApi } from '@/lib/api'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { formatDate } from '@/lib/utils'
import { Congress } from '@/types'

function CongressCard({ congress }: { congress: Congress }) {
  const config = congress.config ?? {}
  const pricing = (config.pricing ?? {}) as { presentiel?: number; en_ligne?: number; virtuel?: number }

  return (
    <Card className="flex flex-col hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle className="text-xl">{congress.title}</CardTitle>
            {congress.subtitle && (
              <CardDescription className="mt-1">{congress.subtitle}</CardDescription>
            )}
          </div>
          <Badge variant="success">Actif</Badge>
        </div>
        {congress.edition && (
          <p className="text-sm font-medium text-primary-600">{congress.edition}</p>
        )}
      </CardHeader>
      <CardContent className="flex-1 space-y-3">
        {congress.description && (
          <p className="text-sm text-gray-600 line-clamp-3">{congress.description}</p>
        )}
        <div className="space-y-2 text-sm text-gray-500">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-gray-400" />
            <span>Du {formatDate(congress.start_date)} au {formatDate(congress.end_date)}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-gray-400" />
            <span>{[congress.location, congress.city, congress.country].filter(Boolean).join(', ')}</span>
          </div>
          {pricing.presentiel && (
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-gray-400" />
              <span>À partir de {Number(pricing.presentiel).toLocaleString('fr-FR')} FCFA</span>
            </div>
          )}
          {congress.end_date && new Date(congress.end_date) > new Date() && (
            <div className="flex items-center gap-2 text-green-600">
              <Clock className="h-4 w-4" />
              <span>Inscriptions ouvertes</span>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter>
        <Button asChild className="w-full">
          <Link to={`/congress/${congress.id}`}>
            Accéder au congrès
          </Link>
        </Button>
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
    <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white">
      <header className="border-b border-gray-200 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-600 text-white font-bold text-lg">
              C
            </div>
            <span className="text-lg font-semibold text-gray-900">Congrès Scientifiques</span>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" asChild>
              <Link to="/login">Connexion</Link>
            </Button>
            <Button asChild>
              <Link to="/register">Inscription</Link>
            </Button>
          </div>
        </div>
      </header>

      <main>
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
            Bienvenue aux Congrès Scientifiques
          </h1>
          <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
            Découvrez et participez aux congrès en cours. Soumettez vos communications, inscrivez-vous et accédez à vos attestations.
          </p>
        </section>

        <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">Congrès actifs</h2>

          {isLoading ? (
            <div className="flex items-center justify-center py-16 text-gray-400">
              <svg className="h-6 w-6 animate-spin mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Chargement...
            </div>
          ) : congresses.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <CalendarDays className="h-16 w-16 mb-4 text-gray-300" />
              <p className="font-medium text-gray-500 text-lg">Aucun congrès actif pour le moment</p>
              <p className="text-sm text-gray-400 mt-1">Revenez plus tard pour découvrir les prochains congrès.</p>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {congresses.map((congress) => (
                <CongressCard key={congress.id} congress={congress} />
              ))}
            </div>
          )}
        </section>
      </main>

      <footer className="border-t border-gray-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 text-center text-sm text-gray-400">
          &copy; {new Date().getFullYear()} Congrès Scientifiques. Tous droits réservés.
        </div>
      </footer>
    </div>
  )
}
