import { Menu, Moon, PanelLeftClose, PanelLeftOpen, Sun } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { NotificationBell } from '@/components/NotificationBell'
import { useTheme } from '@/hooks/useTheme'

interface NavbarProps {
  onMenuClick: () => void
  onSidebarToggle: () => void
  sidebarCollapsed: boolean
  title?: string
}

export function Navbar({ onMenuClick, onSidebarToggle, sidebarCollapsed, title }: NavbarProps) {
  const { theme, toggle } = useTheme()
  const { t } = useTranslation()

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-ink-200 bg-white/95 px-4 backdrop-blur dark:border-ink-800 dark:bg-ink-900/95 lg:px-6">
      <div className="flex min-w-0 items-center gap-2">
        <Button variant="ghost" size="icon" className="text-ink-600 dark:text-ink-300 lg:hidden" onClick={onMenuClick}>
          <Menu className="h-5 w-5" />
          <span className="sr-only">{t('actions.openMenu')}</span>
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="hidden text-ink-600 dark:text-ink-300 lg:inline-flex"
          onClick={onSidebarToggle}
          title={sidebarCollapsed ? 'Afficher le menu' : 'Réduire le menu'}
        >
          {sidebarCollapsed ? <PanelLeftOpen className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
        </Button>

        {title && <h1 className="truncate text-base font-semibold text-ink-950 dark:text-ink-50">{title}</h1>}
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggle}
          title={theme === 'dark' ? t('actions.lightMode') : t('actions.darkMode')}
          className="text-ink-600 dark:text-ink-300"
        >
          {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>

        <NotificationBell />
      </div>
    </header>
  )
}
