import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, CalendarDays, Clock, MapPin, Presentation, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { programApi, congressesApi } from '@/lib/api'
import { formatDate } from '@/lib/utils'
import type { Congress, ProgramSlot } from '@/types'
import { EmptyState, LoadingState } from '@/components/Interface'

const sessionTypeLabels: Record<string, string> = {
  plenary: 'Plénière',
  parallel: 'Session parallèle',
  poster: 'Poster',
  workshop: 'Atelier',
  presentation: 'Présentation',
}

export function PublicProgramPage() {
  const { id } = useParams<{ id: string }>()
  const [dateFilter, setDateFilter] = useState('')

  const { data: congressData } = useQuery({
    queryKey: ['public-congress', id],
    queryFn: async () => (await congressesApi.getOne(id!)).data.data as Congress,
    enabled: !!id,
  })

  const { data: datesData } = useQuery({
    queryKey: ['public-program-dates', id],
    queryFn: async () => (await programApi.publicListDates(id!)).data.data as string[],
    enabled: !!id,
  })

  const { data: programData, isLoading, refetch } = useQuery({
    queryKey: ['public-program', id, dateFilter],
    queryFn: async () => (await programApi.publicListProgram(id!, dateFilter ? { date: dateFilter } : undefined)).data.data as ProgramSlot[],
    enabled: !!id,
  })

  const slots = programData ?? []
  const dates = datesData ?? []
  const grouped = useMemo(() => {
    return slots.reduce<Record<string, ProgramSlot[]>>((acc, slot) => {
      acc[slot.date] = [...(acc[slot.date] ?? []), slot]
      return acc
    }, {})
  }, [slots])

  return (
    <div className="min-h-screen bg-ink-50">
      <header className="sticky top-0 z-10 border-b border-ink-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <Button variant="ghost" size="sm" asChild>
            <Link to={id ? `/congress/${id}` : '/'}>
              <ArrowLeft className="mr-1 h-4 w-4" />
              Congrès
            </Link>
          </Button>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Actualiser
          </Button>
        </div>
      </header>

      <section className="hero-media text-white">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <p className="text-sm font-semibold uppercase tracking-wide text-primary-100">Programme scientifique</p>
          <h1 className="mt-3 max-w-3xl text-3xl font-semibold leading-tight sm:text-5xl">
            {congressData?.title ?? 'Programme du congrès'}
          </h1>
          {congressData && (
            <p className="mt-4 flex flex-wrap items-center gap-3 text-sm text-cyan-50">
              <span className="flex items-center gap-1.5">
                <CalendarDays className="h-4 w-4" />
                {formatDate(congressData.start_date)} - {formatDate(congressData.end_date)}
              </span>
              <span className="flex items-center gap-1.5">
                <MapPin className="h-4 w-4" />
                {[congressData.location, congressData.city, congressData.country].filter(Boolean).join(', ')}
              </span>
            </p>
          )}
        </div>
      </section>

      <main className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6">
        {dates.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <Button variant={dateFilter === '' ? 'default' : 'outline'} size="sm" onClick={() => setDateFilter('')}>
              Toutes les dates
            </Button>
            {dates.map((date) => (
              <Button
                key={date}
                variant={dateFilter === date ? 'default' : 'outline'}
                size="sm"
                onClick={() => setDateFilter(date)}
              >
                {formatDate(date)}
              </Button>
            ))}
          </div>
        )}

        {isLoading ? (
          <LoadingState />
        ) : slots.length === 0 ? (
          <EmptyState
            icon={<Presentation className="h-7 w-7" />}
            title="Aucun créneau publié"
            description="Le programme détaillé sera disponible dès validation par l'organisation."
          />
        ) : (
          <div className="space-y-6">
            {Object.entries(grouped).map(([date, daySlots]) => (
              <section key={date} className="app-surface overflow-hidden">
                <div className="border-b border-ink-200 bg-ink-50 px-5 py-4">
                  <h2 className="font-semibold text-ink-950">{formatDate(date)}</h2>
                </div>
                <div className="divide-y divide-ink-100">
                  {daySlots.map((slot) => (
                    <article key={slot.id} className="grid gap-4 px-5 py-4 md:grid-cols-[150px_1fr_auto] md:items-center">
                      <div className="flex items-center gap-2 text-sm font-medium text-primary-800">
                        <Clock className="h-4 w-4" />
                        {slot.start_time} - {slot.end_time}
                      </div>
                      <div>
                        <h3 className="font-semibold text-ink-950">{slot.title}</h3>
                        {slot.soumission && (
                          <p className="mt-1 text-sm text-ink-500">
                            {slot.soumission.document_title} · {slot.soumission.author_name}
                          </p>
                        )}
                        {slot.location && (
                          <p className="mt-1 flex items-center gap-1.5 text-sm text-ink-500">
                            <MapPin className="h-3.5 w-3.5" />
                            {slot.location}
                          </p>
                        )}
                      </div>
                      <Badge variant="secondary" className="w-fit">
                        {sessionTypeLabels[slot.session_type] ?? slot.session_type}
                      </Badge>
                    </article>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
