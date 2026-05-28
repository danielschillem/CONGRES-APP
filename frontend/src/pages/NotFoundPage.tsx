import { Link } from 'react-router-dom'
import { FileQuestion } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'

export function NotFoundPage() {
  const { t } = useTranslation()

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-ink-50 dark:bg-ink-950 px-4 text-center">
      <FileQuestion className="h-20 w-20 text-ink-300 dark:text-ink-600 mb-6" />
      <h1 className="text-6xl font-bold text-ink-900 dark:text-ink-50 mb-2">{t('notFound.code')}</h1>
      <p className="text-xl font-medium text-ink-600 dark:text-ink-400 mb-2">{t('notFound.title')}</p>
      <p className="text-sm text-ink-400 dark:text-ink-500 mb-8">{t('notFound.description')}</p>
      <div className="flex gap-3">
        <Button asChild>
          <Link to="/">{t('actions.home')}</Link>
        </Button>
        <Button variant="outline" onClick={() => window.history.back()}>
          {t('actions.back')}
        </Button>
      </div>
    </div>
  )
}
