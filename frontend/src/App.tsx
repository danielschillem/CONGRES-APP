import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import type { AxiosResponse } from 'axios'

import { Layout } from '@/components/Layout'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { useAuthStore } from '@/stores/authStore'
import { authApi } from '@/lib/api'

import { LoginPage } from '@/pages/auth/LoginPage'
import { RegisterPage } from '@/pages/auth/RegisterPage'
import { HomePage } from '@/pages/HomePage'
import { CongressDetailPage } from '@/pages/CongressDetailPage'
import { PublicProgramPage } from '@/pages/PublicProgramPage'
import { PublicProceedingsPage } from '@/pages/PublicProceedingsPage'

import { DashboardPage } from '@/pages/user/DashboardPage'
import { SoumissionFormPage } from '@/pages/user/SoumissionFormPage'
import { SoumissionViewPage } from '@/pages/user/SoumissionViewPage'
import { ProfilePage } from '@/pages/user/ProfilePage'
import { NotificationsPage } from '@/pages/user/NotificationsPage'

import { AdminDashboardPage } from '@/pages/admin/AdminDashboardPage'
import { AdminInscriptionsPage } from '@/pages/admin/AdminInscriptionsPage'
import { AdminUsersPage } from '@/pages/admin/AdminUsersPage'
import { SoumissionDetailPage } from '@/pages/admin/SoumissionDetailPage'
import { AdminProfilePage } from '@/pages/admin/AdminProfilePage'
import { AdminFinancesPage } from '@/pages/admin/AdminFinancesPage'
import { AdminBadgesPage } from '@/pages/admin/AdminBadgesPage'
import { AdminAttestationsPage } from '@/pages/admin/AdminAttestationsPage'
import { SuperCongressesPage } from '@/pages/admin/SuperCongressesPage'
import { AdminCongressSettingsPage } from '@/pages/admin/AdminCongressSettingsPage'
import { AdminActorsPage } from '@/pages/admin/AdminActorsPage'
import { AdminReviewGridsPage } from '@/pages/admin/AdminReviewGridsPage'
import { AdminReviewerInvitationsPage } from '@/pages/admin/AdminReviewerInvitationsPage'
import { AdminBroadcastPage } from '@/pages/admin/AdminBroadcastPage'

import { InscriptionPage } from '@/pages/InscriptionPage'
import { VirtualLobby } from '@/pages/VirtualLobby'
import { VirtualRoom } from '@/pages/VirtualRoom'
import { VirtualSessionsPage } from '@/pages/user/VirtualSessionsPage'
import { AdminVirtualSessions } from '@/pages/admin/AdminVirtualSessions'
import { ReviewerDashboardPage } from '@/pages/reviewer/ReviewerDashboardPage'
import { ReviewerInvitationAcceptPage } from '@/pages/reviewer/ReviewerInvitationAcceptPage'
import { AdminProgramPage } from '@/pages/admin/AdminProgramPage'
import { AdminProceedingsPage } from '@/pages/admin/AdminProceedingsPage'
import { User } from '@/types'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30000,
    },
  },
})

function App() {
  const [initializing, setInitializing] = useState(true)
  const { isAuthenticated, setUser, logout } = useAuthStore()

  useEffect(() => {
    let mounted = true

    if (isAuthenticated) {
      Promise.race<AxiosResponse>([
        authApi.me(),
        new Promise((_, reject) => {
          window.setTimeout(() => reject(new Error('Session initialization timeout')), 10000)
        }),
      ])
        .then((res) => setUser(res.data.data as User))
        .catch(() => logout())
        .finally(() => {
          if (mounted) setInitializing(false)
        })
    } else {
      setInitializing(false)
    }

    return () => {
      mounted = false
    }
  }, [])

  if (initializing) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ink-950 text-white">
        <div className="flex flex-col items-center gap-4 rounded-lg border border-white/10 bg-white/10 px-8 py-7 text-center shadow-2xl backdrop-blur">
          <Loader2 className="h-8 w-8 animate-spin text-primary-200" />
          <div>
            <p className="font-semibold">Initialisation de la plateforme</p>
            <p className="mt-1 text-sm text-ink-300">Vérification de la session en cours...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/reviewer/invitations/accept" element={<ReviewerInvitationAcceptPage />} />

          {/* User protected routes */}
          <Route element={<ProtectedRoute requiredRole="user" />}>
            <Route element={<Layout />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/congress/:id/virtual" element={<VirtualLobby />} />
              <Route path="/soumission/nouveau" element={<SoumissionFormPage />} />
              <Route path="/soumission/:id/modifier" element={<SoumissionFormPage />} />
              <Route path="/soumission/:id" element={<SoumissionViewPage />} />
              <Route path="/inscription" element={<InscriptionPage />} />
              <Route path="/notifications" element={<NotificationsPage />} />
              <Route path="/virtual/sessions" element={<VirtualSessionsPage />} />
              <Route path="/virtual/session/:id" element={<VirtualRoom />} />
              <Route path="/profile" element={<ProfilePage />} />
            </Route>
          </Route>

          {/* Reviewer protected routes */}
          <Route element={<ProtectedRoute requiredRole={['reviewer', 'super_admin', 'congress_admin']} />}>
            <Route element={<Layout />}>
              <Route path="/reviewer/dashboard" element={<ReviewerDashboardPage />} />
            </Route>
          </Route>

          {/* Admin protected routes */}
          <Route element={<ProtectedRoute requiredRole={['super_admin', 'congress_admin']} />}>
            <Route element={<Layout />}>
              <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
              <Route path="/admin/soumissions" element={<AdminDashboardPage />} />
              <Route path="/admin/soumissions/:id" element={<SoumissionDetailPage />} />
              <Route path="/admin/inscriptions" element={<AdminInscriptionsPage />} />
              <Route path="/admin/utilisateurs" element={<AdminUsersPage />} />
              <Route path="/admin/finances" element={<AdminFinancesPage />} />
              <Route path="/admin/badges" element={<AdminBadgesPage />} />
              <Route path="/admin/attestations" element={<AdminAttestationsPage />} />
              <Route path="/admin/congres" element={<AdminCongressSettingsPage />} />
              <Route path="/admin/virtual/sessions" element={<AdminVirtualSessions />} />
              <Route path="/admin/program" element={<AdminProgramPage />} />
              <Route path="/admin/actes" element={<AdminProceedingsPage />} />
              <Route path="/admin/acteurs" element={<AdminActorsPage />} />
              <Route path="/admin/grilles-relecture" element={<AdminReviewGridsPage />} />
              <Route path="/admin/invitations-relecteurs" element={<AdminReviewerInvitationsPage />} />
              <Route path="/admin/diffusion" element={<AdminBroadcastPage />} />
              <Route path="/admin/profile" element={<AdminProfilePage />} />
            </Route>
          </Route>

          <Route element={<ProtectedRoute requiredRole="super_admin" />}>
            <Route element={<Layout />}>
              <Route path="/super/congres" element={<SuperCongressesPage />} />
              <Route path="/super/acteurs" element={<AdminActorsPage />} />
            </Route>
          </Route>

          {/* Public pages */}
          <Route path="/" element={<HomePage />} />
          <Route path="/congress/:id" element={<CongressDetailPage />} />
          <Route path="/congress/:id/program" element={<PublicProgramPage />} />
          <Route path="/congress/:id/proceedings" element={<PublicProceedingsPage />} />

          {/* Default redirect */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

export default App
