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
  '/admin/dashboard': 'Tableau de bord administrateur',
  '/admin/soumissions': 'Gestion des soumissions',
  '/admin/inscriptions': 'Gestion des inscriptions',
  '/admin/utilisateurs': 'Gestion des utilisateurs',
  '/admin/finances': 'Finances',
  '/admin/badges': 'Badges participants',
  '/admin/attestations': 'Attestations de participation',
  '/admin/profile': 'Mon profil',
}

export function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()

  // Find a matching title (handle dynamic routes)
  const getTitle = () => {
    if (pageTitles[location.pathname]) {
      return pageTitles[location.pathname]
    }
    if (location.pathname.startsWith('/soumission/') && location.pathname !== '/soumission/nouveau') {
      return 'Modifier la soumission'
    }
    if (location.pathname.startsWith('/admin/soumissions/')) {
      return 'Détail de la soumission'
    }
    return 'Congrès Scientifique'
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex flex-1 flex-col overflow-hidden">
        <Navbar onMenuClick={() => setSidebarOpen(true)} title={getTitle()} />
        <main className="flex-1 overflow-y-auto">
          <div className="container mx-auto px-4 py-6 lg:px-6 max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
