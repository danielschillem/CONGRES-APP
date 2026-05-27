import type { ReactNode } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
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
  onClose: () => void
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

export function Sidebar({ open, onClose }: SidebarProps) {
  const { user, logout, isAdmin } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const isReviewer = user?.role === 'reviewer'

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const userNavSections: NavSection[] = [
    {
      items: [
        { label: 'Tableau de bord', href: '/dashboard', icon: <LayoutDashboard className="h-4 w-4" />, exact: true },
        { label: 'Nouvelle soumission', href: '/soumission/nouveau', icon: <FilePlus className="h-4 w-4" /> },
        { label: 'Inscription', href: '/inscription', icon: <Users className="h-4 w-4" /> },
        { label: 'Sessions virtuelles', href: '/virtual/sessions', icon: <Video className="h-4 w-4" /> },
        { label: 'Notifications', href: '/notifications', icon: <Bell className="h-4 w-4" /> },
        { label: 'Mon profil', href: '/profile', icon: <UserCircle className="h-4 w-4" /> },
      ],
    },
  ]

  const reviewerNavSections: NavSection[] = [
    {
      items: [
        { label: 'Mes évaluations', href: '/reviewer/dashboard', icon: <Star className="h-4 w-4" />, exact: true },
        { label: 'Notifications', href: '/notifications', icon: <Bell className="h-4 w-4" /> },
        { label: 'Mon profil', href: '/profile', icon: <UserCircle className="h-4 w-4" /> },
      ],
    },
  ]

  const adminNavSections: NavSection[] = [
    {
      title: "Vue d'ensemble",
      items: [
        ...(user?.role === 'super_admin'
          ? [
              { label: 'Congrès', href: '/super/congres', icon: <CalendarDays className="h-4 w-4" />, exact: true },
              { label: 'Acteurs', href: '/super/acteurs', icon: <Users className="h-4 w-4" />, exact: true },
            ]
          : [
              { label: 'Mon congrès', href: '/admin/congres', icon: <Settings className="h-4 w-4" />, exact: true },
              { label: 'Acteurs', href: '/admin/acteurs', icon: <Users className="h-4 w-4" />, exact: true },
            ]),
        { label: 'Tableau de bord', href: '/admin/dashboard', icon: <LayoutDashboard className="h-4 w-4" />, exact: true },
      ],
    },
    {
      title: 'Soumissions & évaluation',
      items: [
        { label: 'Toutes les soumissions', href: '/admin/soumissions', icon: <ClipboardList className="h-4 w-4" /> },
        { label: 'En attente', href: '/admin/soumissions?statut=En+attente', icon: <Clock className="h-4 w-4" /> },
        { label: 'Approuvées', href: '/admin/soumissions?statut=Approuv%C3%A9e', icon: <CheckCircle2 className="h-4 w-4" /> },
        { label: 'Rejetées', href: '/admin/soumissions?statut=Rejet%C3%A9e', icon: <XCircle className="h-4 w-4" /> },
        { label: 'Relecteurs', href: '/admin/invitations-relecteurs', icon: <Mail className="h-4 w-4" /> },
        { label: "Grilles d'évaluation", href: '/admin/grilles-relecture', icon: <ListChecks className="h-4 w-4" /> },
      ],
    },
    {
      title: 'Participants & finances',
      items: [
        { label: 'Inscriptions', href: '/admin/inscriptions', icon: <Users className="h-4 w-4" /> },
        { label: 'Utilisateurs', href: '/admin/utilisateurs', icon: <Users className="h-4 w-4" /> },
        { label: 'Finances', href: '/admin/finances', icon: <DollarSign className="h-4 w-4" /> },
      ],
    },
    {
      title: 'Programme & contenu',
      items: [
        { label: 'Programmation', href: '/admin/program', icon: <CalendarRange className="h-4 w-4" /> },
        { label: 'Actes du congrès', href: '/admin/actes', icon: <BookOpen className="h-4 w-4" /> },
        { label: 'Diffusion', href: '/admin/diffusion', icon: <Megaphone className="h-4 w-4" /> },
        { label: 'Sessions virtuelles', href: '/admin/virtual/sessions', icon: <Video className="h-4 w-4" /> },
      ],
    },
    {
      title: 'Documents',
      items: [
        { label: 'Badges', href: '/admin/badges', icon: <BadgeCheck className="h-4 w-4" /> },
        { label: 'Attestations', href: '/admin/attestations', icon: <Award className="h-4 w-4" /> },
      ],
    },
    {
      title: 'Compte',
      items: [{ label: 'Mon profil', href: '/admin/profile', icon: <UserCircle className="h-4 w-4" /> }],
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
          'fixed left-0 top-0 z-30 flex h-full w-72 flex-col border-r border-ink-800 bg-ink-950 text-white shadow-xl transition-transform duration-300 lg:relative lg:translate-x-0 lg:shadow-none',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex h-16 items-center justify-between border-b border-white/10 px-5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-400 text-sm font-bold text-ink-950">
              CS
            </div>
            <div>
              <span className="block text-sm font-semibold">Congrès Sci.</span>
              <span className="text-xs text-ink-400">Pilotage scientifique</span>
            </div>
          </div>
          <button
            type="button"
            title="Fermer le menu"
            onClick={onClose}
            className="rounded-md p-1 text-ink-400 hover:bg-white/10 hover:text-white lg:hidden"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="border-b border-white/10 px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/10 text-sm font-semibold text-primary-100">
              {user?.prenom?.[0]?.toUpperCase()}
              {user?.nom?.[0]?.toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-white">
                {user?.civilite} {user?.prenom} {user?.nom}
              </p>
              <p className="truncate text-xs text-ink-400">{user?.email}</p>
            </div>
          </div>
          {(isAdmin || isReviewer) && (
            <span className="mt-3 inline-flex items-center rounded-md border border-primary-300/30 bg-primary-300/10 px-2 py-1 text-xs font-medium text-primary-100">
              {isAdmin ? 'Administrateur' : 'Relecteur'}
            </span>
          )}
        </div>

        <nav className="scrollbar-thin flex-1 space-y-5 overflow-y-auto px-3 py-4">
          {navSections.map((section, sectionIndex) => (
            <div key={sectionIndex}>
              {section.title && (
                <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wide text-ink-500">
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
                      onClick={onClose}
                      className={cn(
                        'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition',
                        isActive
                          ? 'bg-primary-400 text-ink-950 shadow-sm'
                          : 'text-ink-300 hover:bg-white/10 hover:text-white'
                      )}
                    >
                      <span className="shrink-0">{item.icon}</span>
                      {item.label}
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="border-t border-white/10 px-3 py-4">
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 text-red-200 hover:bg-red-500/10 hover:text-red-100"
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
