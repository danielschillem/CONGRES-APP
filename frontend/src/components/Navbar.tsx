import { Menu, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { NotificationBell } from '@/components/NotificationBell'
import { useAuth } from '@/hooks/useAuth'

interface NavbarProps {
  onMenuClick: () => void
  title?: string
}

export function Navbar({ onMenuClick, title }: NavbarProps) {
  const { user } = useAuth()

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-ink-200 bg-white/90 px-4 backdrop-blur lg:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <Button variant="ghost" size="icon" className="text-ink-500 lg:hidden" onClick={onMenuClick}>
          <Menu className="h-5 w-5" />
          <span className="sr-only">Ouvrir le menu</span>
        </Button>
        {title && <h1 className="hidden truncate text-base font-semibold text-ink-950 sm:block">{title}</h1>}
      </div>

      <div className="flex items-center gap-2">
        <div className="hidden h-9 min-w-[260px] items-center gap-2 rounded-lg border border-ink-200 bg-ink-50 px-3 text-sm text-ink-400 xl:flex">
          <Search className="h-4 w-4" />
          Recherche globale
        </div>
        <NotificationBell />
        <div className="flex items-center gap-2 border-l border-ink-200 pl-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-100 text-xs font-semibold text-primary-800">
            {user?.prenom?.[0]?.toUpperCase()}
            {user?.nom?.[0]?.toUpperCase()}
          </div>
          <span className="hidden text-sm font-medium text-ink-700 sm:block">
            {user?.prenom} {user?.nom}
          </span>
        </div>
      </div>
    </header>
  )
}
