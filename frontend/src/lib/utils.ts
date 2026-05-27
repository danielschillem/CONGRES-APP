import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date)
}

export function formatDateTime(dateString: string): string {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

export interface PricingEntry {
  label: string
  amount: number
}

export function getPricingOptions(config: Record<string, unknown> | null | undefined): PricingEntry[] {
  const raw = (config?.pricing ?? []) as unknown
  if (Array.isArray(raw)) {
    return (raw as { label: string; amount: number }[])
      .filter((p) => p.label && p.amount)
      .map((p) => ({
        label: p.label,
        amount: p.amount,
      }))
  }
  const old = raw as { presentiel?: number; en_ligne?: number; virtuel?: number }
  const result: PricingEntry[] = []
  if (old.presentiel) result.push({ label: 'Présentiel', amount: old.presentiel })
  if (old.en_ligne) result.push({ label: 'En ligne', amount: old.en_ligne })
  if (old.virtuel) result.push({ label: 'Virtuel', amount: old.virtuel })
  return result
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str
  return str.slice(0, length) + '...'
}
