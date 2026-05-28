import type { ReactNode } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  Award,
  BadgeCheck,
  Bell,
  BookOpen,
  CalendarDays,
  CalendarRange,
  CheckCircle2,
  ClipboardList,
  Clock,
  DollarSign,
  FilePlus,
  LayoutDashboard,
  ListChecks,
  LogOut,
  Mail,
  Megaphone,
  Settings,
  Star,
  UserCircle,
  Users,
  Video,
  X,
  XCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'

interface SidebarProps {
  open: boolean
  collapsed: boolean
  onClose: () => void
  onToggleCollapsed: () => void
}

interface NavItem {
  label: string
  href: string
  icon: ReactNode
  exact?: boolean
}

interface NavSection {
  title?: string
  items: NavItem[]
}

export function Sidebar({ open, collapsed, onClose, onToggleCollapsed }: SidebarProps) {
  const { user, logout, isAdmin } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const { t } = useTranslation()
  const isReviewer = user?.role === 'reviewer'

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const userNavSections: NavSection[] = [
    {
      items: [
        { label: t('nav.dashboard'), href: '/dashboard', icon: <LayoutDashboard className="h-4 w-4" />, exact: true },
        { label: t('nav.newSubmission'), href: '/soumission/nouveau', icon: <FilePlus className="h-4 w-4" /> },
        { label: t('nav.registration'), href: '/inscription', icon: <Users className="h-4 w-4" /> },
        { label: t('nav.virtualSessions'), href: '/virtual/sessions', icon: <Video className="h-4 w-4" /> },
        { label: t('nav.notifications'), href: '/notifications', icon: <Bell className="h-4 w-4" /> },
        { label: t('nav.myProfile'), href: '/profile', icon: <UserCircle className="h-4 w-4" /> },
      ],
    },
  ]

  const reviewerNavSections: NavSection[] = [
    {
      items: [
        { label: t('nav.myEvaluations'), href: '/reviewer/dashboard', icon: <Star className="h-4 w-4" />, exact: true },
        { label: t('nav.notifications'), href: '/notifications', icon: <Bell className="h-4 w-4" /> },
        { label: t('nav.myProfile'), href: '/profile', icon: <UserCircle className="h-4 w-4" /> },
      ],
    },
  ]

  const adminNavSections: NavSection[] = [
    {
      title: t('sections.overview'),
      items: [
        ...(user?.role === 'super_admin'
          ? [
              { label: t('nav.congresses'), href: '/super/congres', icon: <CalendarDays className="h-4 w-4" />, exact: true },
              { label: t('nav.actors'), href: '/super/acteurs', icon: <Users className="h-4 w-4" />, exact: true },
            ]
          : [
              { label: t('nav.myCongress'), href: '/admin/congres', icon: <Settings className="h-4 w-4" />, exact: true },
              { label: t('nav.actors'), href: '/admin/acteurs', icon: <Users className="h-4 w-4" />, exact: true },
            ]),
        { label: t('nav.dashboard'), href: '/admin/dashboard', icon: <LayoutDashboard className="h-4 w-4" />, exact: true },
      ],
    },
    {
      title: t('sections.submissionsEvaluation'),
      items: [
        { label: t('nav.allSubmissions'), href: '/admin/soumissions', icon: <ClipboardList className="h-4 w-4" /> },
        { label: t('nav.pending'), href: '/admin/soumissions?statut=En+attente', icon: <Clock className="h-4 w-4" /> },
        { label: t('nav.approved'), href: '/admin/soumissions?statut=Approuv%C3%A9e', icon: <CheckCircle2 className="h-4 w-4" /> },
        { label: t('nav.rejected'), href: '/admin/soumissions?statut=Rejet%C3%A9e', icon: <XCircle className="h-4 w-4" /> },
        { label: t('nav.reviewers'), href: '/admin/invitations-relecteurs', icon: <Mail className="h-4 w-4" /> },
        { label: t('nav.reviewGrids'), href: '/admin/grilles-relecture', icon: <ListChecks className="h-4 w-4" /> },
      ],
    },
    {
      title: t('sections.participantsFinances'),
      items: [
        { label: t('nav.registrations'), href: '/admin/inscriptions', icon: <Users className="h-4 w-4" /> },
        { label: t('nav.users'), href: '/admin/utilisateurs', icon: <Users className="h-4 w-4" /> },
        { label: t('nav.finances'), href: '/admin/finances', icon: <DollarSign className="h-4 w-4" /> },
      ],
    },
    {
      title: t('sections.programContent'),
      items: [
        { label: t('nav.program'), href: '/admin/program', icon: <CalendarRange className="h-4 w-4" /> },
        { label: t('nav.proceedings'), href: '/admin/actes', icon: <BookOpen className="h-4 w-4" /> },
        { label: t('nav.broadcast'), href: '/admin/diffusion', icon: <Megaphone className="h-4 w-4" /> },
        { label: t('nav.virtualSessions'), href: '/admin/virtual/sessions', icon: <Video className="h-4 w-4" /> },
      ],
    },
    {
      title: t('sections.documents'),
      items: [
        { label: t('nav.badges'), href: '/admin/badges', icon: <BadgeCheck className="h-4 w-4" /> },
        { label: t('nav.attestations'), href: '/admin/attestations', icon: <Award className="h-4 w-4" /> },
      ],
    },
    {
      title: t('nav.account'),
      items: [{ label: t('nav.myProfile'), href: '/admin/profile', icon: <UserCircle className="h-4 w-4" /> }],
    },
  ]

  const navSections = isAdmin ? adminNavSections : isReviewer ? reviewerNavSections : userNavSections

  const isNavItemActive = (item: NavItem) => {
    const itemUrl = new URL(item.href, window.location.origin)
    const itemStatut = itemUrl.searchParams.get('statut')
    const currentStatut = new URLSearchParams(location.search).get('statut')
    if (location.pathname !== itemUrl.pathname) return false
    if (itemUrl.pathname === '/admin/soumissions') {
      return itemStatut ? currentStatut === itemStatut : currentStatut === null
    }
    return item.exact ? location.pathname === itemUrl.pathname : true
  }

  return (
    <>
      {open && <div className="fixed inset-0 z-20 bg-ink-950/45 lg:hidden" onClick={onClose} />}

      <aside
        className={cn(
          'fixed left-0 top-0 z-30 flex h-full w-72 flex-col border-r border-ink-200 bg-white text-ink-900 shadow-xl transition-[transform,width] duration-300 dark:border-ink-800 dark:bg-ink-950 dark:text-white lg:relative lg:translate-x-0 lg:shadow-none',
          collapsed ? 'lg:w-20' : 'lg:w-72',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className={cn('flex h-16 items-center border-b border-ink-200 px-5 dark:border-white/10', collapsed ? 'lg:justify-center lg:px-3' : 'justify-between')}>
          <button
            type="button"
            onClick={onToggleCollapsed}
            title={collapsed ? 'Afficher le menu' : 'Réduire le menu'}
            className="hidden items-center gap-3 rounded-lg lg:flex"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-500 text-sm font-bold text-white">
              CS
            </div>
            <div className={cn('text-left', collapsed && 'lg:hidden')}>
              <span className="block text-sm font-semibold text-ink-950 dark:text-white">{t('app.name')}</span>
              <span className="text-xs text-ink-500 dark:text-ink-400">{t('app.tagline')}</span>
            </div>
          </button>

          <div className="flex items-center gap-3 lg:hidden">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-500 text-sm font-bold text-white">
              CS
            </div>
            <div>
              <span className="block text-sm font-semibold text-ink-950 dark:text-white">{t('app.name')}</span>
              <span className="text-xs text-ink-500 dark:text-ink-400">{t('app.tagline')}</span>
            </div>
          </div>

          <button
            type="button"
            title={t('actions.closeMenu')}
            onClick={onClose}
            className="rounded-md p-1 text-ink-500 hover:bg-ink-100 hover:text-ink-900 dark:text-ink-400 dark:hover:bg-white/10 dark:hover:text-white lg:hidden"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className={cn('border-b border-ink-200 px-4 py-4 dark:border-white/10', collapsed && 'lg:px-3')}>
          <div className={cn('flex items-center gap-3', collapsed && 'lg:justify-center')}>
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-sm font-semibold text-primary-800 dark:bg-white/10 dark:text-primary-100">
              {user?.prenom?.[0]?.toUpperCase()}
              {user?.nom?.[0]?.toUpperCase()}
            </div>
            <div className={cn('min-w-0 flex-1', collapsed && 'lg:hidden')}>
              <p className="truncate text-sm font-medium text-ink-950 dark:text-white">
                {user?.civilite} {user?.prenom} {user?.nom}
              </p>
              <p className="truncate text-xs text-ink-500 dark:text-ink-400">{user?.email}</p>
            </div>
          </div>
          {(isAdmin || isReviewer) && (
            <span className={cn('mt-3 inline-flex items-center rounded-md border border-primary-200 bg-primary-50 px-2 py-1 text-xs font-medium text-primary-800 dark:border-primary-300/30 dark:bg-primary-300/10 dark:text-primary-100', collapsed && 'lg:hidden')}>
              {isAdmin ? t('roles.administrator') : t('roles.reviewer')}
            </span>
          )}
        </div>

        <nav className="scrollbar-thin flex-1 space-y-5 overflow-y-auto px-3 py-4">
          {navSections.map((section, sectionIndex) => (
            <div key={sectionIndex}>
              {section.title && (
                <p className={cn('mb-2 px-3 text-[11px] font-semibold uppercase tracking-wide text-ink-400 dark:text-ink-500', collapsed && 'lg:hidden')}>
                  {section.title}
                </p>
              )}
              <div className="space-y-1">
                {section.items.map((item) => {
                  const isActive = isNavItemActive(item)
                  return (
                    <Link
                      key={item.href}
                      to={item.href}
                      title={collapsed ? item.label : undefined}
                      onClick={onClose}
                      className={cn(
                        'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition',
                        collapsed && 'lg:justify-center lg:px-2',
                        isActive
                          ? 'bg-primary-500 text-white shadow-sm'
                          : 'text-ink-600 hover:bg-ink-100 hover:text-ink-950 dark:text-ink-300 dark:hover:bg-white/10 dark:hover:text-white'
                      )}
                    >
                      <span className="shrink-0">{item.icon}</span>
                      <span className={cn(collapsed && 'lg:hidden')}>{item.label}</span>
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="border-t border-ink-200 px-3 py-4 dark:border-white/10">
          <Button
            variant="ghost"
            title={collapsed ? t('nav.logout') : undefined}
            className={cn(
              'w-full justify-start gap-3 text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-200 dark:hover:bg-red-500/10 dark:hover:text-red-100',
              collapsed && 'lg:justify-center lg:px-2'
            )}
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4" />
            <span className={cn(collapsed && 'lg:hidden')}>{t('nav.logout')}</span>
          </Button>
        </div>
      </aside>
    </>
  )
}
