import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api'

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
})

let isRefreshing = false
let failedQueue: Array<{
  resolve: (value: string) => void
  reject: (reason: unknown) => void
}> = []

function processQueue(error: unknown, token: string | null = null) {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error)
    } else if (token) {
      resolve(token)
    }
  })
  failedQueue = []
}

// Request interceptor: add Authorization header
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('access_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor: auto-refresh on 401
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean
    }
    const requestUrl = originalRequest?.url ?? ''
    const isAuthRequest =
      requestUrl.includes('/auth/login') ||
      requestUrl.includes('/auth/register') ||
      requestUrl.includes('/auth/refresh')

    if (error.response?.status === 401 && !originalRequest._retry && !isAuthRequest) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        })
          .then((token) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`
            }
            return api(originalRequest)
          })
          .catch((err) => Promise.reject(err))
      }

      originalRequest._retry = true
      isRefreshing = true

      const refreshToken = localStorage.getItem('refresh_token')

      if (!refreshToken) {
        isRefreshing = false
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        window.location.href = '/login'
        return Promise.reject(error)
      }

      try {
        const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
          refresh_token: refreshToken,
        })

        const { access_token, refresh_token } = response.data.data

        localStorage.setItem('access_token', access_token)
        localStorage.setItem('refresh_token', refresh_token)

        api.defaults.headers.common.Authorization = `Bearer ${access_token}`
        processQueue(null, access_token)

        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${access_token}`
        }

        return api(originalRequest)
      } catch (refreshError) {
        processQueue(refreshError, null)
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        window.location.href = '/login'
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  }
)

// Auth endpoints
export const authApi = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),

  register: (data: Record<string, unknown>) =>
    api.post('/auth/register', data),

  logout: (refreshToken: string) =>
    api.post('/auth/logout', { refresh_token: refreshToken }),

  // Profile doubles as "me"
  me: () => api.get('/profile'),

  refresh: (refresh_token: string) =>
    api.post('/auth/refresh', { refresh_token }),
}

// Soumissions endpoints (utilisateur authentifié)
export const soumissionsApi = {
  // Admin: liste paginée avec filtres
  getAll: (params?: Record<string, unknown>) =>
    api.get('/admin/soumissions', { params }),

  // Utilisateur: ses propres soumissions
  getMy: (params?: Record<string, unknown>) =>
    api.get('/soumissions', { params }),

  // Utilisateur — sa propre soumission
  getOne: (id: string) => api.get(`/soumissions/${id}`),

  create: (data: FormData) =>
    api.post('/soumissions', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  update: (id: string, data: FormData) =>
    api.patch(`/soumissions/${id}`, data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  deleteMy: (id: string) => api.delete(`/soumissions/${id}`),

  // Admin actions
  getOneAdmin: (id: string) => api.get(`/admin/soumissions/${id}`),

  approve: (id: string) => api.post(`/admin/soumissions/${id}/approve`),

  reject: (id: string, raison: string) =>
    api.post(`/admin/soumissions/${id}/reject`, { raison }),

  delete: (id: string) => api.delete(`/admin/soumissions/${id}`),

  download: (id: string) =>
    api.get(`/admin/soumissions/${id}/download`, { responseType: 'blob' }),

  exportCSV: (params?: Record<string, unknown>) =>
    api.get('/admin/soumissions/export/csv', { params, responseType: 'blob' }),
}

// Notifications endpoints
export const notificationsApi = {
  getAll: (params?: Record<string, unknown>) =>
    api.get('/notifications', { params }),

  markAsRead: (id: string) => api.patch(`/notifications/${id}/read`),

  markAllAsRead: () => api.post('/notifications/read-all'),

  getUnreadCount: () => api.get('/notifications/unread-count'),
}

// Profile / compte utilisateur
export const profileApi = {
  get: () => api.get('/profile'),

  update: (data: Record<string, unknown>) =>
    api.patch('/profile', data),

  changePassword: (data: { current_password: string; new_password: string }) =>
    api.patch('/profile/password', data),

  deleteAccount: () => api.delete('/profile'),
}

// Ancien alias (compatibilité avec les pages existantes qui importent usersApi)
export const usersApi = {
  updateProfile: (data: Record<string, unknown>) =>
    api.patch('/profile', data),

  changePassword: (data: Record<string, unknown>) =>
    api.patch('/profile/password', data),

  deleteAccount: () => api.delete('/profile'),
}

// Admin endpoints
export const adminApi = {
  getStats: () => api.get('/admin/stats'),
  getUsers: (params?: Record<string, unknown>) =>
    api.get('/admin/users', { params }),
  deactivateUser: (id: string) =>
    api.patch(`/admin/users/${id}/deactivate`),
  getInscriptions: (params?: Record<string, unknown>) =>
    api.get('/admin/inscriptions', { params }),

  exportInscriptionsCSV: (params?: Record<string, unknown>) =>
    api.get('/admin/inscriptions/export/csv', { params, responseType: 'blob' }),

  confirmPayment: (id: number) =>
    api.patch(`/admin/inscriptions/${id}/confirm-payment`),

  getCurrentCongress: () => api.get('/admin/congress/current'),
  updateCurrentCongress: (data: object) =>
    api.patch('/admin/congress/current', data),
  getActors: (params?: Record<string, unknown>) =>
    api.get('/admin/congress/actors', { params }),
  createActor: (data: object, params?: Record<string, unknown>) =>
    api.post('/admin/congress/actors', data, { params }),
  deleteActor: (id: string) =>
    api.delete(`/admin/congress/actors/${id}`),
  generateBadgesCSV: () =>
    api.post('/admin/congress/badges', undefined, { responseType: 'blob' }),
}

// Super admin endpoints
export const superApi = {
  getCongresses: (params?: Record<string, unknown>) =>
    api.get('/super/congresses', { params }),
  getCongress: (id: string) =>
    api.get(`/super/congresses/${id}`),
  createCongress: (data: object) =>
    api.post('/super/congresses', data),
  updateCongress: (id: string, data: object) =>
    api.patch(`/super/congresses/${id}`, data),
  deleteCongress: (id: string) =>
    api.delete(`/super/congresses/${id}`),
  getActors: (params?: Record<string, unknown>) =>
    api.get('/super/actors', { params }),
}

// Public congresses endpoints
export const congressesApi = {
  getActive: () => api.get('/congresses'),
  getOne: (id: string) => api.get(`/congresses/${id}`),
}

// Inscriptions endpoints
export const inscriptionsApi = {
  create: (data: Record<string, unknown>) =>
    api.post('/inscriptions', data),

  getMy: () => api.get('/inscriptions/me'),

  downloadReceipt: () =>
    api.get('/inscriptions/receipt', { responseType: 'blob' }),

  downloadBadge: () =>
    api.get('/inscriptions/badge', { responseType: 'blob' }),

  downloadAttestation: () =>
    api.get('/inscriptions/attestation', { responseType: 'blob' }),
}
