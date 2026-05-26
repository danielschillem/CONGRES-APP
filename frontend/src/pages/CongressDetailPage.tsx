import { useQuery } from '@tanstack/react-query'
import { CalendarDays, Clock, MapPin, Users, ArrowLeft, Building, FileText, Ticket } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { congressesApi } from '@/lib/api'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatDate } from '@/lib/utils'
import { Congress } from '@/types'

export function CongressDetailPage() {
  const { id } = useParams<{ id: string }>()

  const { data, isLoading } = useQuery({
    queryKey: ['public-congress', id],
    queryFn: async () => (await congressesApi.getOne(id!)).data,
    enabled: !!id,
  })

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white flex items-center justify-center">
        <div className="flex items-center gap-2 text-gray-400">
          <svg className="h-6 w-6 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Chargement...
        </div>
      </div>
    )
  }

  const congress: Congress | undefined = data?.data

  if (!congress) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white flex flex-col items-center justify-center gap-4">
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
  const org = congress.organisational_structure ?? {}
  const president = org.president as string | undefined

  const isOpen = congress.end_date ? new Date(congress.end_date) > new Date() : false

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white">
      <header className="border-b border-gray-200 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/">
                <ArrowLeft className="h-4 w-4 mr-1" />
                Accueil
              </Link>
            </Button>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/login">Connexion</Link>
            </Button>
            <Button size="sm" asChild>
              <Link to="/register">Inscription</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <div className="mb-8">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Badge variant="success" className="text-sm px-3 py-1">Actif</Badge>
                {congress.edition && (
                  <span className="text-sm font-medium text-primary-600">{congress.edition}</span>
                )}
              </div>
              <h1 className="text-3xl font-bold text-gray-900">{congress.title}</h1>
              {congress.subtitle && (
                <p className="mt-1 text-lg text-gray-500">{congress.subtitle}</p>
              )}
            </div>
          </div>
        </div>

        {congress.description && (
          <Card className="mb-6">
            <CardContent className="pt-6">
              <p className="text-gray-700 whitespace-pre-line">{congress.description}</p>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-6 sm:grid-cols-2 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <CalendarDays className="h-5 w-5 text-primary-600" />
                Dates
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-gray-600">
              <div className="flex justify-between">
                <span>Début</span>
                <span className="font-medium text-gray-900">{formatDate(congress.start_date)}</span>
              </div>
              <div className="flex justify-between">
                <span>Fin</span>
                <span className="font-medium text-gray-900">{formatDate(congress.end_date)}</span>
              </div>
              {deadlines.submission && (
                <div className="flex justify-between">
                  <span>Clôture soumissions</span>
                  <span className="font-medium text-gray-900">{formatDate(deadlines.submission as string)}</span>
                </div>
              )}
              {deadlines.inscription && (
                <div className="flex justify-between">
                  <span>Clôture inscriptions</span>
                  <span className="font-medium text-gray-900">{formatDate(deadlines.inscription as string)}</span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <MapPin className="h-5 w-5 text-primary-600" />
                Lieu
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-gray-600">
              <p className="font-medium text-gray-900">{congress.location}</p>
              {congress.city && <p>{congress.city}</p>}
              {congress.country && <p>{congress.country}</p>}
            </CardContent>
          </Card>

          {president && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Building className="h-5 w-5 text-primary-600" />
                  Président du comité
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm font-medium text-gray-900">{president}</p>
              </CardContent>
            </Card>
          )}

          {themes.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <FileText className="h-5 w-5 text-primary-600" />
                  Thématiques
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {themes.map((theme) => (
                    <Badge key={theme} variant="secondary">{theme}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {pricing.presentiel && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Ticket className="h-5 w-5 text-primary-600" />
                Tarifs d'inscription
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-lg border border-gray-200 p-4 text-center">
                  <p className="text-sm text-gray-500 mb-1">Présentiel</p>
                  <p className="text-xl font-bold text-gray-900">{Number(pricing.presentiel).toLocaleString('fr-FR')} FCFA</p>
                </div>
                {pricing.en_ligne && (
                  <div className="rounded-lg border border-gray-200 p-4 text-center">
                    <p className="text-sm text-gray-500 mb-1">En ligne</p>
                    <p className="text-xl font-bold text-gray-900">{Number(pricing.en_ligne).toLocaleString('fr-FR')} FCFA</p>
                  </div>
                )}
                {pricing.virtuel && (
                  <div className="rounded-lg border border-gray-200 p-4 text-center">
                    <p className="text-sm text-gray-500 mb-1">Virtuel</p>
                    <p className="text-xl font-bold text-gray-900">{Number(pricing.virtuel).toLocaleString('fr-FR')} FCFA</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex flex-wrap gap-4 justify-center">
          {isOpen && (
            <>
              <Button size="lg" className="min-w-[200px]" asChild>
                <a href={`/register?congress=${congress.id}`}>
                  <Users className="h-5 w-5 mr-2" />
                  S'inscrire au congrès
                </a>
              </Button>
              <Button size="lg" variant="outline" className="min-w-[200px]" asChild>
                <a href={`/login?congress=${congress.id}`}>
                  <FileText className="h-5 w-5 mr-2" />
                  Soumettre une communication
                </a>
              </Button>
            </>
          )}
          {!isOpen && (
            <div className="flex items-center gap-2 text-gray-500 bg-gray-100 rounded-lg px-6 py-3">
              <Clock className="h-5 w-5" />
              <span className="font-medium">Les inscriptions sont fermées pour ce congrès</span>
            </div>
          )}
        </div>
      </main>

      <footer className="border-t border-gray-200 bg-white mt-12">
        <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 text-center text-sm text-gray-400">
          &copy; {new Date().getFullYear()} Congrès Scientifiques. Tous droits réservés.
        </div>
      </footer>
    </div>
  )
}
