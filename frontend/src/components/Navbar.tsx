import { Menu } from 'lucide-react'
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
    <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-4 lg:px-6 sticky top-0 z-10">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden text-gray-500"
          onClick={onMenuClick}
        >
          <Menu className="h-5 w-5" />
          <span className="sr-only">Ouvrir le menu</span>
        </Button>
        {title && (
          <h1 className="text-base font-semibold text-gray-900 hidden sm:block">{title}</h1>
        )}
      </div>

      <div className="flex items-center gap-2">
        <NotificationBell />
        <div className="flex items-center gap-2 pl-2 border-l border-gray-200">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-primary-700 font-semibold text-xs">
            {user?.prenom?.[0]?.toUpperCase()}{user?.nom?.[0]?.toUpperCase()}
          </div>
          <span className="text-sm font-medium text-gray-700 hidden sm:block">
            {user?.prenom} {user?.nom}
          </span>
        </div>
      </div>
    </header>
  )
}
