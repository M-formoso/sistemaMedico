import axios from 'axios'
import { useAuthStore } from '@/stores/authStore'

/**
 * Configuración de API - v2.0
 * IMPORTANTE: En producción SIEMPRE usar HTTPS
 */
const getApiBaseUrl = (): string => {
  // En el navegador, detectar el entorno
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname

    // Desarrollo local
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://localhost:8000/api/v1'
    }

    // Producción - Railway
    return 'https://backend-production-240c3.up.railway.app/api/v1'
  }

  // SSR fallback
  return 'https://backend-production-240c3.up.railway.app/api/v1'
}

const api = axios.create({
  baseURL: getApiBaseUrl(),
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
