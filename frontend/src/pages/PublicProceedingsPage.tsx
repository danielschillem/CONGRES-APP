import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, BookOpen, FileText, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { congressesApi, proceedingApi } from '@/lib/api'
import { formatDate } from '@/lib/utils'
import type { Congress, Proceeding, ProceedingDetail } from '@/types'
import { EmptyState, LoadingState } from '@/components/Interface'

export function PublicProceedingsPage() {
  const { id } = useParams<{ id: string }>()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  const { data: congressData } = useQuery({
    queryKey: ['public-congress', id],
    queryFn: async () => (await congressesApi.getOne(id!)).data.data as Congress,
    enabled: !!id,
  })

  const { data: listData, isLoading } = useQuery({
    queryKey: ['public-proceedings', id],
    queryFn: async () => (await proceedingApi.publicListByCongress(id!)).data.data as Proceeding[],
    enabled: !!id,
  })

  const proceedings = (listData ?? []).filter((p) =>
    `${p.title} ${p.subtitle ?? ''}`.toLowerCase().includes(search.toLowerCase())
  )
  const activeId = selectedId ?? proceedings[0]?.id

  const { data: detailData } = useQuery({
    queryKey: ['public-proceeding', activeId],
    queryFn: async () => (await proceedingApi.publicGet(activeId!)).data.data as ProceedingDetail,
    enabled: !!activeId,
  })

  const detail = detailData ?? null

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
        </div>
      </header>

      <section className="hero-media text-white">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <p className="text-sm font-semibold uppercase tracking-wide text-primary-100">Bibliothèque scientifique</p>
          <h1 className="mt-3 max-w-3xl text-3xl font-semibold leading-tight sm:text-5xl">
            Actes du congrès
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-cyan-50">
            {congressData?.title ?? 'Communications validées, posters et travaux publiés par le comité scientifique.'}
          </p>
        </div>
      </section>

      <main className="mx-auto grid max-w-6xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[360px_1fr]">
        <aside className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-ink-400" />
            <Input className="pl-9" placeholder="Rechercher un volume" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>

          {isLoading ? (
            <LoadingState />
          ) : proceedings.length === 0 ? (
            <EmptyState
              icon={<BookOpen className="h-7 w-7" />}
              title="Aucun acte publié"
              description="Les actes publics apparaîtront ici après publication."
            />
          ) : (
            <div className="space-y-2">
              {proceedings.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setSelectedId(p.id)}
                  className={`w-full rounded-lg border p-4 text-left transition ${
                    activeId === p.id
                      ? 'border-primary-300 bg-primary-50 text-primary-950'
                      : 'border-ink-200 bg-white hover:border-primary-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium">{p.title}</p>
                      {p.subtitle && <p className="mt-1 text-sm text-ink-500">{p.subtitle}</p>}
                    </div>
                    <Badge variant="success">Publié</Badge>
                  </div>
                  {p.published_at && <p className="mt-3 text-xs text-ink-500">Publié le {formatDate(p.published_at)}</p>}
                </button>
              ))}
            </div>
          )}
        </aside>

        <section className="app-surface min-h-[480px] p-5">
          {!detail ? (
            <EmptyState
              icon={<FileText className="h-7 w-7" />}
              title="Sélectionnez un volume"
              description="Les communications associées seront listées dans cette zone."
            />
          ) : (
            <div className="space-y-5">
              <div>
                <Badge variant="success">Actes publiés</Badge>
                <h2 className="mt-3 text-2xl font-semibold text-ink-950">{detail.proceeding.title}</h2>
                {detail.proceeding.description && (
                  <p className="mt-2 text-sm leading-6 text-ink-600">{detail.proceeding.description}</p>
                )}
              </div>

              <div className="divide-y divide-ink-100 rounded-lg border border-ink-200">
                {detail.submissions.length === 0 ? (
                  <p className="p-5 text-sm text-ink-500">Aucune communication dans ce volume.</p>
                ) : (
                  detail.submissions.map((sub, index) => (
                    <article key={sub.id} className="p-4">
                      <div className="flex items-start gap-3">
                        <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-ink-100 text-xs font-semibold text-ink-600">
                          {index + 1}
                        </span>
                        <div>
                          <h3 className="font-medium text-ink-950">{sub.soumission?.document_title ?? 'Communication'}</h3>
                          <p className="mt-1 text-sm text-ink-500">{sub.soumission?.author_name}</p>
                          {sub.section_title && <p className="mt-1 text-xs font-medium text-primary-700">{sub.section_title}</p>}
                        </div>
                      </div>
                    </article>
                  ))
                )}
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
