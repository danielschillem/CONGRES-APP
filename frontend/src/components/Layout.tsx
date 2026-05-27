import { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Sidebar } from '@/components/Sidebar'
import { Navbar } from '@/components/Navbar'

const pageTitles: Record<string, string> = {
  '/dashboard': 'Tableau de bord',
  '/soumission/nouveau': 'Nouvelle soumission',
  '/inscription': 'Inscription au congrès',
  '/notifications': 'Notifications',
  '/profile': 'Mon profil',
  '/virtual/sessions': 'Mes sessions virtuelles',
  '/admin/dashboard': 'Tableau de bord administrateur',
  '/admin/soumissions': 'Gestion des soumissions',
  '/admin/inscriptions': 'Gestion des inscriptions',
  '/admin/utilisateurs': 'Gestion des utilisateurs',
  '/admin/finances': 'Finances',
  '/admin/badges': 'Badges participants',
  '/admin/attestations': 'Attestations de participation',
  '/admin/congres': 'Paramètres du congrès',
  '/admin/acteurs': 'Acteurs du congrès',
  '/admin/virtual/sessions': 'Sessions virtuelles',
  '/admin/program': 'Programmation du congrès',
  '/admin/actes': 'Actes du congrès',
  '/admin/grilles-relecture': "Grilles d'évaluation",
  '/admin/invitations-relecteurs': 'Gestion des relecteurs',
  '/admin/diffusion': 'Diffusion & communication',
  '/admin/profile': 'Mon profil',
  '/super/congres': 'Gestion des congrès',
  '/super/acteurs': 'Acteurs tous congrès',
  '/reviewer/dashboard': 'Mes évaluations',
}

export function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()

  const getTitle = () => {
    if (pageTitles[location.pathname]) return pageTitles[location.pathname]
    if (location.pathname.startsWith('/soumission/') && location.pathname !== '/soumission/nouveau') {
      return 'Modifier la soumission'
    }
    if (location.pathname.startsWith('/admin/soumissions/')) return 'Détail de la soumission'
    if (location.pathname.startsWith('/virtual/session/')) return 'Session virtuelle'
    if (location.pathname.startsWith('/congress/') && location.pathname.endsWith('/virtual')) {
      return 'Sessions virtuelles du congrès'
    }
    return 'Congrès scientifique'
  }

  return (
    <div className="flex h-screen overflow-hidden bg-ink-50">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex flex-1 flex-col overflow-hidden">
        <Navbar onMenuClick={() => setSidebarOpen(true)} title={getTitle()} />
        <main className="flex-1 overflow-y-auto bg-[radial-gradient(circle_at_top_left,rgba(8,145,178,0.08),transparent_34%),linear-gradient(180deg,#f8fafc,#f1f5f9)]">
          <div className="container mx-auto max-w-7xl px-4 py-6 lg:px-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
