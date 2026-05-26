import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { authApi } from '@/lib/api'
import { User } from '@/types'

export function useAuth() {
  const navigate = useNavigate()
  const { user, isAuthenticated, setAuth, setUser, logout: storeLogout } = useAuthStore()

  const login = async (email: string, password: string) => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    const response = await authApi.login(email, password)
    const { user, access_token, refresh_token } = response.data.data
    setAuth(user as User, access_token as string, refresh_token as string)

    // Redirect based on role
    if ((user as User).role === 'admin') {
      navigate('/admin/dashboard')
    } else {
      navigate('/dashboard')
    }
  }

  const logout = async () => {
    try {
      await authApi.logout()
    } catch {
      // Ignore errors on logout
    } finally {
      storeLogout()
      navigate('/login')
    }
  }

  const refreshUser = async () => {
    try {
      const response = await authApi.me()
      setUser(response.data.data as User)
    } catch {
      storeLogout()
      navigate('/login')
    }
  }

  return {
    user,
    isAuthenticated,
    login,
    logout,
    refreshUser,
    setUser,
    isAdmin: user?.role === 'admin',
  }
}
