import type { ReactNode } from 'react'
import { RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string
  title: string
  description?: string
  actions?: ReactNode
}) {
  return (
    <div className="flex flex-col gap-4 border-b border-ink-200 pb-5 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {eyebrow && <p className="page-kicker mb-2">{eyebrow}</p>}
        <h1 className="text-2xl font-semibold text-ink-950">{title}</h1>
        {description && <p className="mt-1 max-w-3xl text-sm leading-6 text-ink-500">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}

export function MetricCard({
  label,
  value,
  icon,
  tone = 'primary',
  helper,
}: {
  label: string
  value: ReactNode
  icon: ReactNode
  tone?: 'primary' | 'green' | 'amber' | 'blue' | 'slate'
  helper?: string
}) {
  const tones = {
    primary: 'bg-primary-50 text-primary-700 border-primary-100',
    green: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    amber: 'bg-amber-50 text-amber-700 border-amber-100',
    blue: 'bg-sky-50 text-sky-700 border-sky-100',
    slate: 'bg-ink-100 text-ink-700 border-ink-200',
  }

  return (
    <div className="app-surface p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-ink-500">{label}</p>
          <div className="mt-2 text-2xl font-semibold text-ink-950">{value}</div>
          {helper && <p className="mt-1 text-xs text-ink-500">{helper}</p>}
        </div>
        <div className={cn('flex h-10 w-10 items-center justify-center rounded-lg border', tones[tone])}>
          {icon}
        </div>
      </div>
    </div>
  )
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: ReactNode
  title: string
  description?: string
  action?: ReactNode
}) {
  return (
    <div className="app-panel flex flex-col items-center justify-center px-6 py-14 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-lg bg-ink-100 text-ink-400">
        {icon}
      </div>
      <p className="font-medium text-ink-800">{title}</p>
      {description && <p className="mt-1 max-w-md text-sm leading-6 text-ink-500">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

export function LoadingState({ label = 'Chargement...' }: { label?: string }) {
  return (
    <div className="app-panel flex items-center justify-center py-14 text-sm text-ink-500">
      <RefreshCw className="mr-2 h-5 w-5 animate-spin text-primary-600" />
      {label}
    </div>
  )
}
