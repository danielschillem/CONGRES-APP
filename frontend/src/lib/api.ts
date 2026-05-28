import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api'

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
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
        const response = await axios.post(
          `${API_BASE_URL}/auth/refresh`,
          { refresh_token: refreshToken },
          { timeout: 10000 }
        )

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

    if (!error.response) {
      console.error('[API] Network error:', error.message)
    } else if (error.response.status >= 500) {
      console.error('[API] Server error:', error.response.status, error.config?.url)
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

  // Utilisateur - sa propre soumission
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

  // Reviewer assignment
  assignReviewer: (id: string, reviewerId: string) =>
    api.post(`/admin/soumissions/${id}/assign-reviewer`, { reviewer_id: reviewerId }),

  getReviews: (id: string) =>
    api.get(`/admin/soumissions/${id}/reviews`),

  getReviewStats: (id: string) =>
    api.get(`/admin/soumissions/${id}/review-stats`),
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
// Review Grid endpoints
export const reviewGridApi = {
  list: () => api.get('/admin/review-grids'),
  create: (data: { name: string; is_active?: boolean }) =>
    api.post('/admin/review-grids', data),
  update: (id: string, data: Record<string, unknown>) =>
    api.patch(`/admin/review-grids/${id}`, data),
  delete: (id: string) => api.delete(`/admin/review-grids/${id}`),
  getActive: (params?: Record<string, unknown>) =>
    api.get('/admin/review-grids/active', { params }),
  listCriteria: (id: string) => api.get(`/admin/review-grids/${id}/criteria`),
  createCriterion: (id: string, data: Record<string, unknown>) =>
    api.post(`/admin/review-grids/${id}/criteria`, data),
  updateCriterion: (id: string, criterionId: string, data: Record<string, unknown>) =>
    api.patch(`/admin/review-grids/${id}/criteria/${criterionId}`, data),
  deleteCriterion: (id: string, criterionId: string) =>
    api.delete(`/admin/review-grids/${id}/criteria/${criterionId}`),
}

// Reviewer invitation endpoints
export const reviewerInvitationApi = {
  list: (params?: Record<string, unknown>) =>
    api.get('/admin/reviewer-invitations', { params }),
  invite: (data: Record<string, unknown>) =>
    api.post('/admin/reviewer-invitations', data),
  inviteBatch: (data: Record<string, unknown>) =>
    api.post('/admin/reviewer-invitations/batch', data),
  resend: (id: string) =>
    api.post(`/admin/reviewer-invitations/${id}/resend`),
  cancel: (id: string) =>
    api.post(`/admin/reviewer-invitations/${id}/cancel`),
  sendReminders: () =>
    api.post('/admin/reviewer-invitations/send-reminders'),
  getReviewersStats: () =>
    api.get('/admin/reviewers/stats'),

  accept: (token: string) =>
    api.post('/reviewer/invitations/accept', undefined, { params: { token } }),
}

// Thematic coordinator endpoints
export const thematicCoordinatorApi = {
  list: () => api.get('/admin/thematic-coordinators'),
  set: (data: Record<string, unknown>) =>
    api.post('/admin/thematic-coordinators', data),
  remove: (theme: string) =>
    api.delete(`/admin/thematic-coordinators?theme=${encodeURIComponent(theme)}`),
}

// Broadcast endpoints
export const broadcastApi = {
  list: () => api.get('/admin/broadcasts'),
  create: (data: Record<string, unknown>) =>
    api.post('/admin/broadcasts', data),
  createAndSend: (data: Record<string, unknown>) =>
    api.post('/admin/broadcasts/create-and-send', data),
  send: (id: string) =>
    api.post(`/admin/broadcasts/${id}/send`),
  get: (id: string) => api.get(`/admin/broadcasts/${id}`),
  delete: (id: string) => api.delete(`/admin/broadcasts/${id}`),
  getStats: () => api.get('/admin/broadcasts/stats'),
  getTargets: () => api.get('/admin/broadcasts/targets'),
}

// Reviewer endpoints (for getActiveGrid from reviewer perspective)
export const reviewerApi = {
  getAssignments: (params?: Record<string, unknown>) =>
    api.get('/reviewer/assignments', { params }),
  startReview: (id: string) =>
    api.post(`/reviewer/assignments/${id}/start`),
  submitReview: (id: string, data: { scores: { criterion_id: string; score: number }[]; comment: string }) =>
    api.post(`/reviewer/assignments/${id}/submit`, data),
  getActiveReviewGrid: (params?: Record<string, unknown>) =>
    api.get('/reviewer/review-grid/active', { params }),
}

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
  toggleAttestations: () =>
    api.post('/admin/congress/toggle-attestations'),
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

  getAll: (params?: Record<string, unknown>) =>
    api.get('/inscriptions', { params }),

  getMy: (params?: Record<string, unknown>) =>
    api.get('/inscriptions/me', { params }),

  getOne: (id: number) =>
    api.get(`/inscriptions/${id}`),

  downloadReceipt: (params?: Record<string, unknown>) =>
    api.get('/inscriptions/receipt', { params, responseType: 'blob' }),

  downloadBadge: (params?: Record<string, unknown>) =>
    api.get('/inscriptions/badge', { params, responseType: 'blob' }),

  downloadAttestation: (params?: Record<string, unknown>) =>
    api.get('/inscriptions/attestation', { params, responseType: 'blob' }),

  downloadInscriptionReceipt: (id: number) =>
    api.get(`/inscriptions/${id}/receipt`, { responseType: 'blob' }),

  downloadInscriptionBadge: (id: number) =>
    api.get(`/inscriptions/${id}/badge`, { responseType: 'blob' }),

  downloadInscriptionAttestation: (id: number) =>
    api.get(`/inscriptions/${id}/attestation`, { responseType: 'blob' }),
}

// Virtual sessions API
export const virtualApi = {
  // User endpoints
  listSessions: (congressId: string) =>
    api.get('/virtual/sessions', { params: { congress_id: congressId } }),

  getSession: (id: string) =>
    api.get(`/virtual/sessions/${id}`),

  joinSession: (id: string) =>
    api.post(`/virtual/sessions/${id}/join`),

  leaveSession: (id: string) =>
    api.post(`/virtual/sessions/${id}/leave`),

  getMyUpcomingSessions: () =>
    api.get('/virtual/my-sessions'),

  // Admin endpoints
  adminListSessions: () =>
    api.get('/admin/virtual/sessions'),

  adminGetSession: (id: string) =>
    api.get(`/admin/virtual/sessions/${id}`),

  adminCreateSession: (data: object) =>
    api.post('/admin/virtual/sessions', data),

  adminUpdateSession: (id: string, data: object) =>
    api.patch(`/admin/virtual/sessions/${id}`, data),

  adminDeleteSession: (id: string) =>
    api.delete(`/admin/virtual/sessions/${id}`),

  adminStartSession: (id: string) =>
    api.post(`/admin/virtual/sessions/${id}/start`),

  adminEndSession: (id: string) =>
    api.post(`/admin/virtual/sessions/${id}/end`),

  adminGetAttendance: (id: string) =>
    api.get(`/admin/virtual/sessions/${id}/attendance`),
}

// Program endpoints
export const programApi = {
  // Admin
  adminListSlots: () =>
    api.get('/admin/program/slots'),

  adminGetSlot: (id: string) =>
    api.get(`/admin/program/slots/${id}`),

  adminCreateSlot: (data: Record<string, unknown>) =>
    api.post('/admin/program/slots', data),

  adminUpdateSlot: (id: string, data: Record<string, unknown>) =>
    api.patch(`/admin/program/slots/${id}`, data),

  adminDeleteSlot: (id: string) =>
    api.delete(`/admin/program/slots/${id}`),

  adminListAvailableSoumissions: () =>
    api.get('/admin/program/available-soumissions'),

  adminListDates: () =>
    api.get('/admin/program/dates'),

  // Public
  publicListProgram: (congressId: string, params?: Record<string, unknown>) =>
    api.get(`/congresses/${congressId}/program`, { params }),

  publicListDates: (congressId: string) =>
    api.get(`/congresses/${congressId}/program/dates`),
}

// Proceeding endpoints
export const proceedingApi = {
  // Admin
  adminList: () =>
    api.get('/admin/proceedings'),

  adminGet: (id: string) =>
    api.get(`/admin/proceedings/${id}`),

  adminCreate: (data: Record<string, unknown>) =>
    api.post('/admin/proceedings', data),

  adminUpdate: (id: string, data: Record<string, unknown>) =>
    api.patch(`/admin/proceedings/${id}`, data),

  adminDelete: (id: string) =>
    api.delete(`/admin/proceedings/${id}`),

  adminAddSubmission: (id: string, data: Record<string, unknown>) =>
    api.post(`/admin/proceedings/${id}/submissions`, data),

  adminRemoveSubmission: (id: string, soumissionId: string) =>
    api.delete(`/admin/proceedings/${id}/submissions/${soumissionId}`),

  // Public
  publicListByCongress: (congressId: string) =>
    api.get(`/congresses/${congressId}/proceedings`),

  publicGet: (id: string) =>
    api.get(`/proceedings/${id}`),
}
