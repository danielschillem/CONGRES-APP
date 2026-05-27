import { useQuery } from '@tanstack/react-query'
import { useParams, Link } from 'react-router-dom'
import { CalendarDays, Clock, Monitor, Play, Video, VideoOff } from 'lucide-react'
import { virtualApi } from '@/lib/api'
import { VirtualSession } from '@/types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
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

const statusColors: Record<string, string> = {
  scheduled: 'bg-blue-100 text-blue-700',
  live: 'bg-green-100 text-green-700 animate-pulse',
  ended: 'bg-gray-100 text-gray-500',
  cancelled: 'bg-red-100 text-red-700',
}

const statusLabels: Record<string, string> = {
  scheduled: 'Planifiée',
  live: 'En direct',
  ended: 'Terminée',
  cancelled: 'Annulée',
}

function SessionCard({ session }: { session: VirtualSession }) {
  const isLive = session.status === 'live'
  const isUpcoming = session.status === 'scheduled'

  return (
    <Card className={`border-l-4 ${isLive ? 'border-l-green-500' : isUpcoming ? 'border-l-blue-500' : 'border-l-gray-300'}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-gray-500">{typeIcons[session.session_type]}</span>
              <span className="text-xs font-medium text-gray-500 uppercase">
                {typeLabels[session.session_type] || session.session_type}
              </span>
              <Badge className={statusColors[session.status]}>
                {statusLabels[session.status]}
              </Badge>
            </div>
            <h3 className="font-semibold text-gray-900 truncate">{session.title}</h3>
            {session.description && (
              <p className="text-sm text-gray-500 mt-1 line-clamp-2">{session.description}</p>
            )}
            <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
              <span className="flex items-center gap-1">
                <CalendarDays className="h-3.5 w-3.5" />
                {formatDate(session.start_time)}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {new Date(session.start_time).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                {' - '}
                {new Date(session.end_time).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
          <div className="shrink-0">
            {isLive ? (
              <Button asChild size="sm" className="bg-green-600 hover:bg-green-700">
                <Link to={`/virtual/session/${session.id}`}>Rejoindre</Link>
              </Button>
            ) : isUpcoming ? (
              <Button asChild variant="outline" size="sm">
                <Link to={`/virtual/session/${session.id}`}>Détails</Link>
              </Button>
            ) : (
              <Button asChild variant="ghost" size="sm" disabled>
                <Link to={`/virtual/session/${session.id}`}>Voir</Link>
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function VirtualLobby() {
  const { id: congressId } = useParams<{ id: string }>()
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  const { data: sessionsData, isLoading } = useQuery({
    queryKey: ['virtual-sessions', congressId],
    queryFn: () => virtualApi.listSessions(congressId!),
    enabled: !!congressId,
  })

  const sessions: VirtualSession[] = sessionsData?.data?.data ?? []

  const liveSessions = sessions.filter((s) => s.status === 'live')
  const upcomingSessions = sessions.filter((s) => s.status === 'scheduled')
  const endedSessions = sessions.filter((s) => s.status === 'ended' || s.status === 'cancelled')

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-primary-600 border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sessions virtuelles</h1>
          <p className="text-gray-500 mt-1">Accédez aux sessions en direct et planifiées</p>
        </div>
        {!isAuthenticated && (
          <Button asChild variant="outline">
            <Link to={`/congress/${congressId}`}>Retour au congrès</Link>
          </Button>
        )}
      </div>

      {sessions.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-12">
            <Video className="h-12 w-12 text-gray-300 mb-4" />
            <p className="text-gray-500 font-medium">Aucune session virtuelle pour le moment</p>
            <p className="text-gray-400 text-sm mt-1">Les sessions programmées apparaîtront ici</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {liveSessions.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold text-green-700 mb-3 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                En direct ({liveSessions.length})
              </h2>
              <div className="space-y-3">
                {liveSessions.map((s) => <SessionCard key={s.id} session={s} />)}
              </div>
            </section>
          )}

          {upcomingSessions.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold text-blue-700 mb-3">
                À venir ({upcomingSessions.length})
              </h2>
              <div className="space-y-3">
                {upcomingSessions.map((s) => <SessionCard key={s.id} session={s} />)}
              </div>
            </section>
          )}

          {endedSessions.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold text-gray-500 mb-3">
                Terminées ({endedSessions.length})
              </h2>
              <div className="space-y-3">
                {endedSessions.map((s) => <SessionCard key={s.id} session={s} />)}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  )
}
