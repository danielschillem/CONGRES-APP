import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios'

const API_BASE_URL = 'http://localhost:8080/api'

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

    if (error.response?.status === 401 && !originalRequest._retry) {
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

  logout: () => api.post('/auth/logout'),

  me: () => api.get('/auth/me'),

  refresh: (refresh_token: string) =>
    api.post('/auth/refresh', { refresh_token }),
}

// Soumissions endpoints
export const soumissionsApi = {
  getAll: (params?: Record<string, unknown>) =>
    api.get('/soumissions', { params }),

  getMy: (params?: Record<string, unknown>) =>
    api.get('/soumissions/my', { params }),

  getOne: (id: string) => api.get(`/soumissions/${id}`),

  create: (data: FormData) =>
    api.post('/soumissions', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  update: (id: string, data: FormData) =>
    api.post(`/soumissions/${id}`, data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  approve: (id: string) => api.post(`/soumissions/${id}/approve`),

  reject: (id: string, raison: string) =>
    api.post(`/soumissions/${id}/reject`, { raison_rejet: raison }),

  delete: (id: string) => api.delete(`/soumissions/${id}`),

  download: (id: string) =>
    api.get(`/soumissions/${id}/download`, { responseType: 'blob' }),
}

// Notifications endpoints
export const notificationsApi = {
  getAll: () => api.get('/notifications'),

  markAsRead: (id: string) => api.post(`/notifications/${id}/read`),

  markAllAsRead: () => api.post('/notifications/read-all'),

  getUnreadCount: () => api.get('/notifications/unread-count'),
}

// User endpoints
export const usersApi = {
  updateProfile: (data: Record<string, unknown>) =>
    api.put('/user/profile', data),

  changePassword: (data: Record<string, unknown>) =>
    api.put('/user/password', data),

  deleteAccount: () => api.delete('/user/account'),
}

// Inscriptions endpoints
export const inscriptionsApi = {
  create: (data: Record<string, unknown>) =>
    api.post('/inscriptions', data),
}
