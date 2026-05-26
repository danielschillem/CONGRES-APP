import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  FilePlus,
  UserCircle,
  LogOut,
  ClipboardList,
  Clock,
  CheckCircle2,
  XCircle,
  Users,
  X,
  DollarSign,
  BadgeCheck,
  Award,
  Bell,
  CalendarDays,
  Settings,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'

interface SidebarProps {
  open: boolean
  onClose: () => void
}

interface NavItem {
  label: string
  href: string
  icon: React.ReactNode
  exact?: boolean
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const { user, logout, isAdmin } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const userNavItems: NavItem[] = [
    {
      label: 'Tableau de bord',
      href: '/dashboard',
      icon: <LayoutDashboard className="h-4 w-4" />,
      exact: true,
    },
    {
      label: 'Nouvelle soumission',
      href: '/soumission/nouveau',
      icon: <FilePlus className="h-4 w-4" />,
    },
    {
      label: 'Inscription',
      href: '/inscription',
      icon: <Users className="h-4 w-4" />,
    },
    {
      label: 'Notifications',
      href: '/notifications',
      icon: <Bell className="h-4 w-4" />,
    },
    {
      label: 'Mon profil',
      href: '/profile',
      icon: <UserCircle className="h-4 w-4" />,
    },
  ]

  const adminNavItems: NavItem[] = [
    ...(user?.role === 'super_admin'
      ? [
          {
            label: 'Congrès',
            href: '/super/congres',
            icon: <CalendarDays className="h-4 w-4" />,
            exact: true,
          },
          {
            label: 'Acteurs',
            href: '/super/acteurs',
            icon: <Users className="h-4 w-4" />,
            exact: true,
          },
        ]
      : [
          {
            label: 'Mon congrès',
            href: '/admin/congres',
            icon: <Settings className="h-4 w-4" />,
            exact: true,
          },
          {
            label: 'Acteurs',
            href: '/admin/acteurs',
            icon: <Users className="h-4 w-4" />,
            exact: true,
          },
        ]),
    {
      label: 'Tableau de bord',
      href: '/admin/dashboard',
      icon: <LayoutDashboard className="h-4 w-4" />,
      exact: true,
    },
    {
      label: 'Toutes les soumissions',
      href: '/admin/soumissions',
      icon: <ClipboardList className="h-4 w-4" />,
    },
    {
      label: 'Inscriptions',
      href: '/admin/inscriptions',
      icon: <Users className="h-4 w-4" />,
    },
    {
      label: 'En attente',
      href: '/admin/soumissions?statut=En+attente',
      icon: <Clock className="h-4 w-4" />,
    },
    {
      label: 'Approuvées',
      href: '/admin/soumissions?statut=Approuv%C3%A9e',
      icon: <CheckCircle2 className="h-4 w-4" />,
    },
    {
      label: 'Rejetées',
      href: '/admin/soumissions?statut=Rejet%C3%A9e',
      icon: <XCircle className="h-4 w-4" />,
    },
    {
      label: 'Utilisateurs',
      href: '/admin/utilisateurs',
      icon: <Users className="h-4 w-4" />,
    },
    {
      label: 'Finances',
      href: '/admin/finances',
      icon: <DollarSign className="h-4 w-4" />,
    },
    {
      label: 'Badges',
      href: '/admin/badges',
      icon: <BadgeCheck className="h-4 w-4" />,
    },
    {
      label: 'Attestations',
      href: '/admin/attestations',
      icon: <Award className="h-4 w-4" />,
    },
    {
      label: 'Mon profil',
      href: '/admin/profile',
      icon: <UserCircle className="h-4 w-4" />,
    },
  ]

  const navItems = isAdmin ? adminNavItems : userNavItems

  const isNavItemActive = (item: NavItem) => {
    const itemUrl = new URL(item.href, window.location.origin)
    const itemStatut = itemUrl.searchParams.get('statut')
    const currentStatut = new URLSearchParams(location.search).get('statut')

    if (location.pathname !== itemUrl.pathname) {
      return false
    }

    if (itemUrl.pathname === '/admin/soumissions') {
      return itemStatut ? currentStatut === itemStatut : currentStatut === null
    }

    return item.exact ? location.pathname === itemUrl.pathname : true
  }

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-20 bg-black/40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 z-30 flex h-full w-64 flex-col bg-white border-r border-gray-200 shadow-lg transition-transform duration-300 lg:relative lg:translate-x-0 lg:shadow-none',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Logo / Brand */}
        <div className="flex h-16 items-center justify-between px-5 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-600 text-white font-bold text-sm">
              CS
            </div>
            <span className="font-semibold text-gray-900 text-sm">Congrès Sci.</span>
          </div>
          <button
            type="button"
            title="Fermer le menu"
            onClick={onClose}
            className="lg:hidden rounded-md p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* User info */}
        <div className="px-4 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-100 text-primary-700 font-semibold text-sm shrink-0">
              {user?.prenom?.[0]?.toUpperCase()}{user?.nom?.[0]?.toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user?.civilite} {user?.prenom} {user?.nom}
              </p>
              <p className="text-xs text-gray-500 truncate">{user?.email}</p>
            </div>
          </div>
          {isAdmin && (
            <span className="mt-2 inline-flex items-center rounded-full bg-primary-100 px-2.5 py-0.5 text-xs font-semibold text-primary-700">
              Administrateur
            </span>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
          {navItems.map((item) => {
            const isActive = isNavItemActive(item)

            return (
              <Link
                key={item.href}
                to={item.href}
                onClick={onClose}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary-50 text-primary-700 border border-primary-100'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                )}
              >
                <span className="shrink-0">{item.icon}</span>
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* Logout */}
        <div className="px-3 py-4 border-t border-gray-100">
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 text-red-600 hover:bg-red-50 hover:text-red-700"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4" />
            Déconnexion
          </Button>
        </div>
      </aside>
    </>
  )
}
