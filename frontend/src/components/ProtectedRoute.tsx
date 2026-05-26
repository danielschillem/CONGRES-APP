import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'

interface ProtectedRouteProps {
  requiredRole?: 'admin' | 'user'
}

export function ProtectedRoute({ requiredRole }: ProtectedRouteProps) {
  const { isAuthenticated, user } = useAuthStore()

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />
  }

  if (requiredRole && user.role !== requiredRole) {
    // Redirect to appropriate dashboard
    if (user.role === 'admin') {
      return <Navigate to="/admin/dashboard" replace />
    }
    return <Navigate to="/dashboard" replace />
  }

  return <Outlet />
}
