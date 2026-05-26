import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import { Layout } from '@/components/Layout'
import { ProtectedRoute } from '@/components/ProtectedRoute'

import { LoginPage } from '@/pages/auth/LoginPage'
import { RegisterPage } from '@/pages/auth/RegisterPage'

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

import { InscriptionPage } from '@/pages/InscriptionPage'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30000,
    },
  },
})

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* User protected routes */}
          <Route element={<ProtectedRoute requiredRole="user" />}>
            <Route element={<Layout />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/soumission/nouveau" element={<SoumissionFormPage />} />
              <Route path="/soumission/:id/modifier" element={<SoumissionFormPage />} />
              <Route path="/soumission/:id" element={<SoumissionViewPage />} />
              <Route path="/inscription" element={<InscriptionPage />} />
              <Route path="/notifications" element={<NotificationsPage />} />
              <Route path="/profile" element={<ProfilePage />} />
            </Route>
          </Route>

          {/* Admin protected routes */}
          <Route element={<ProtectedRoute requiredRole="admin" />}>
            <Route element={<Layout />}>
              <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
              <Route path="/admin/soumissions" element={<AdminDashboardPage />} />
              <Route path="/admin/soumissions/:id" element={<SoumissionDetailPage />} />
              <Route path="/admin/inscriptions" element={<AdminInscriptionsPage />} />
              <Route path="/admin/utilisateurs" element={<AdminUsersPage />} />
              <Route path="/admin/finances" element={<AdminFinancesPage />} />
              <Route path="/admin/badges" element={<AdminBadgesPage />} />
              <Route path="/admin/attestations" element={<AdminAttestationsPage />} />
              <Route path="/admin/profile" element={<AdminProfilePage />} />
            </Route>
          </Route>

          {/* Default redirect */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

export default App
