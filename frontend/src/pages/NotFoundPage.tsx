import { Link } from 'react-router-dom'
import { FileQuestion, Home, ArrowLeft } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { SEO } from '@/components/SEO'

export function NotFoundPage() {
  const { t } = useTranslation()

  return (
    <>
      <SEO title={t('notFound.title')} description="Page non trouvée" />
      <div className="flex min-h-screen flex-col items-center justify-center bg-ink-50 dark:bg-ink-950 px-4 text-center">
        <div className="animate-[bounce_1s_ease-in-out_infinite]">
          <FileQuestion className="h-24 w-24 text-ink-300 dark:text-ink-600 mb-4" />
        </div>
        <h1 className="text-7xl font-bold text-ink-900 dark:text-ink-50 mb-2">{t('notFound.code')}</h1>
        <p className="text-xl font-medium text-ink-600 dark:text-ink-400 mb-2">{t('notFound.title')}</p>
        <p className="text-sm text-ink-400 dark:text-ink-500 mb-8 max-w-md">{t('notFound.description')}</p>
        <div className="flex gap-3">
          <Button asChild>
            <Link to="/">
              <Home className="h-4 w-4 mr-2" />
              {t('actions.home')}
            </Link>
          </Button>
          <Button variant="outline" onClick={() => window.history.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t('actions.back')}
          </Button>
        </div>
      </div>
    </>
  )
}
