import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import {
  CalendarDays,
  Clock,
  Monitor,
  Play,
  Users,
  Video,
  VideoOff,
  RefreshCw,
  ArrowRight,
} from 'lucide-react'
import { virtualApi } from '@/lib/api'
import { VirtualSession } from '@/types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatDate } from '@/lib/utils'
import { useAuthStore } from '@/stores/authStore'

const typeIcons: Record<string, React.ReactNode> = {
  plenary: <Monitor className="h-4 w-4" />,
  workshop: <Play className="h-4 w-4" />,
  presentation: <Video className="h-4 w-4" />,
  breakout: <VideoOff className="h-4 w-4" />,
}

const typeLabels: Record<string, string> = {
  plenary: 'Plénière',
  workshop: 'Atelier',
  presentation: 'Présentation',
  breakout: 'Breakout',
}

const statusConfig: Record<string, { label: string; className: string }> = {
  scheduled: { label: 'Planifiée', className: 'bg-blue-100 text-blue-700' },
  live: { label: 'En direct', className: 'bg-green-100 text-green-700 animate-pulse' },
  ended: { label: 'Terminée', className: 'bg-gray-100 text-gray-500' },
  cancelled: { label: 'Annulée', className: 'bg-red-100 text-red-700' },
}

function SessionCard({ session }: { session: VirtualSession }) {
  const queryClient = useQueryClient()
  const isLive = session.status === 'live'
  const isUpcoming = session.status === 'scheduled'
  const navigate = useNavigate()
  const cfg = statusConfig[session.status] ?? { label: session.status, className: 'bg-gray-100 text-gray-500' }

  const joinMutation = useMutation({
    mutationFn: () => virtualApi.joinSession(session.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-virtual-sessions'] })
      navigate(`/virtual/session/${session.id}`)
    },
  })

  return (
    <Card
      className={`border-l-4 transition-shadow hover:shadow-md ${
        isLive
          ? 'border-l-green-500 bg-green-50/30'
          : isUpcoming
          ? 'border-l-blue-400'
          : 'border-l-gray-200'
      }`}
    >
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="text-gray-400">{typeIcons[session.session_type]}</span>
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                {typeLabels[session.session_type] ?? session.session_type}
              </span>
              <Badge className={cfg.className}>{cfg.label}</Badge>
              {session.recording_enabled && (
                <span className="text-xs text-red-500 flex items-center gap-1 font-medium">
                  <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                  Enreg.
                </span>
              )}
            </div>

            <h3 className="font-semibold text-gray-900 text-sm leading-snug">{session.title}</h3>
            {session.description && (
              <p className="text-xs text-gray-500 mt-1 line-clamp-2">{session.description}</p>
            )}
            {session.congress && (
              <p className="text-xs text-primary-600 font-medium mt-1">{session.congress.title}</p>
            )}

            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-gray-400">
              <span className="flex items-center gap-1">
                <CalendarDays className="h-3.5 w-3.5" />
                {formatDate(session.start_time)}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {new Date(session.start_time).toLocaleTimeString('fr-FR', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
                {' – '}
                {new Date(session.end_time).toLocaleTimeString('fr-FR', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
              <span className="flex items-center gap-1">
                <Users className="h-3.5 w-3.5" />
                Max {session.max_participants}
              </span>
            </div>
          </div>

          <div className="shrink-0">
            {isLive ? (
              <Button
                size="sm"
                className="bg-green-600 hover:bg-green-700 gap-1.5"
                onClick={() => joinMutation.mutate()}
                loading={joinMutation.isPending}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                Rejoindre
              </Button>
            ) : isUpcoming ? (
              <Button asChild size="sm" variant="outline" className="gap-1.5">
                <Link to={`/virtual/session/${session.id}`}>
                  Voir
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            ) : (
              <Button asChild size="sm" variant="ghost" className="text-gray-400">
                <Link to={`/virtual/session/${session.id}`}>Voir</Link>
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function EmptyState() {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-16 text-center">
        <div className="h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
          <Video className="h-8 w-8 text-gray-300" />
        </div>
        <p className="font-semibold text-gray-700 text-lg">Aucune session virtuelle</p>
        <p className="text-sm text-gray-400 mt-2 max-w-sm">
          Vous n'êtes inscrit à aucune session virtuelle. Les sessions apparaîtront ici une fois
          que vous serez inscrit à un congrès proposant des sessions en ligne.
        </p>
        <Button className="mt-6" asChild>
          <Link to="/">Voir les congrès actifs</Link>
        </Button>
      </CardContent>
    </Card>
  )
}

export function VirtualSessionsPage() {
  const user = useAuthStore((s) => s.user)

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['my-virtual-sessions'],
    queryFn: async () => {
      const res = await virtualApi.getMyUpcomingSessions()
      return (res.data?.data ?? []) as VirtualSession[]
    },
  })

  const sessions: VirtualSession[] = data ?? []
  const live = sessions.filter((s) => s.status === 'live')
  const upcoming = sessions.filter((s) => s.status === 'scheduled')
  const ended = sessions.filter((s) => s.status === 'ended' || s.status === 'cancelled')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sessions virtuelles</h1>
          <p className="text-gray-500 text-sm mt-1">
            {user?.prenom ? `Bonjour ${user.prenom} — ` : ''}
            Vos sessions planifiées et passées
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Actualiser
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16 text-gray-400">
          <RefreshCw className="h-6 w-6 animate-spin mr-2" />
          Chargement…
        </div>
      ) : sessions.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="space-y-8">
          {live.length > 0 && (
            <section>
              <Card className="bg-green-50 border-green-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base text-green-800 flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                    Sessions en direct ({live.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 pt-0">
                  {live.map((s) => (
                    <SessionCard key={s.id} session={s} />
                  ))}
                </CardContent>
              </Card>
            </section>
          )}

          {upcoming.length > 0 && (
            <section>
              <h2 className="text-base font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-blue-500" />
                À venir ({upcoming.length})
              </h2>
              <div className="space-y-3">
                {upcoming.map((s) => (
                  <SessionCard key={s.id} session={s} />
                ))}
              </div>
            </section>
          )}

          {ended.length > 0 && (
            <section>
              <h2 className="text-base font-semibold text-gray-500 mb-3">
                Historique ({ended.length})
              </h2>
              <div className="space-y-3">
                {ended.map((s) => (
                  <SessionCard key={s.id} session={s} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  )
}
