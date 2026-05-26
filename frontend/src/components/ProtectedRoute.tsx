import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'

type UserRole = 'user' | 'super_admin' | 'congress_admin' | 'reviewer' | 'finance_manager' | 'support'

interface ProtectedRouteProps {
  requiredRole?: UserRole | UserRole[]
}

const adminRoles: UserRole[] = ['super_admin', 'congress_admin']

export function ProtectedRoute({ requiredRole }: ProtectedRouteProps) {
  const { isAuthenticated, user } = useAuthStore()

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />
  }

  if (requiredRole) {
    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole]
    if (!roles.includes(user.role as UserRole)) {
      if (adminRoles.includes(user.role as UserRole)) {
        return <Navigate to="/admin/dashboard" replace />
      }
      return <Navigate to="/dashboard" replace />
    }
  }

  return <Outlet />
}
