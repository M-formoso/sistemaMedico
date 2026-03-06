import axios from 'axios'
import { useAuthStore } from '@/stores/authStore'

// Obtener URL base
const getBaseURL = (): string => {
  // Si hay variable de entorno, usarla
  let url = import.meta.env.VITE_API_URL as string | undefined

  // Si no hay URL o estamos en producción, construir dinámicamente
  if (!url || url.includes('localhost')) {
    // En producción, usar la URL del backend de Railway
    if (typeof window !== 'undefined' && !window.location.hostname.includes('localhost')) {
      // Detectar si es Railway y construir URL del backend
      if (window.location.hostname.includes('railway.app')) {
        url = 'https://backend-production-240c3.up.railway.app/api/v1'
      }
    }
  }

  // Fallback
  if (!url) {
    url = '/api/v1'
  }

  // Forzar HTTPS si el sitio está en HTTPS
  if (typeof window !== 'undefined' && window.location.protocol === 'https:' && url.startsWith('http://')) {
    url = url.replace('http://', 'https://')
  }

  return url
}

const api = axios.create({
  baseURL: getBaseURL(),
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor - agregar token
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor - manejar errores de auth
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    // Si es 401 y no es el endpoint de refresh, intentar refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      const refreshToken = useAuthStore.getState().refreshToken
      if (refreshToken) {
        try {
          const response = await axios.post('/api/v1/auth/refresh', {
            refresh_token: refreshToken,
          })

          const { access_token, refresh_token } = response.data
          useAuthStore.getState().setAuth(
            useAuthStore.getState().user!,
            access_token,
            refresh_token
          )

          originalRequest.headers.Authorization = `Bearer ${access_token}`
          return api(originalRequest)
        } catch (refreshError) {
          useAuthStore.getState().clearAuth()
          window.location.href = '/login'
          return Promise.reject(refreshError)
        }
      }

      useAuthStore.getState().clearAuth()
      window.location.href = '/login'
    }

    return Promise.reject(error)
  }
)

export default api
