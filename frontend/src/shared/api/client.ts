import axios, { type AxiosInstance, type InternalAxiosRequestConfig, type AxiosResponse } from 'axios'
import { API_BASE_URL, API_TIMEOUT } from '../config/api'

// Token storage — avoids circular dependency with auth store
// The auth store calls setToken/clearToken; the client reads from here
let _accessToken: string | null = null
let _logoutFn: (() => void) | null = null

export function setClientToken(token: string | null) {
  _accessToken = token
}

export function setClientLogoutFn(fn: () => void) {
  _logoutFn = fn
}

let isRefreshing = false
let failedQueue: Array<{ resolve: (token: string) => void; reject: (err: unknown) => void }> = []

function processQueue(error: unknown, token: string | null) {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error)
    else resolve(token as string)
  })
  failedQueue = []
}

const ID_EXCEPTIONS = new Set(['id', 'clubId'])

function normalizeIds(obj: unknown): unknown {
  if (Array.isArray(obj)) {
    return obj.map(normalizeIds)
  }
  if (obj !== null && typeof obj === 'object') {
    const result: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(obj)) {
      const newKey = ID_EXCEPTIONS.has(key) ? key : key.replace(/Id$/, 'ID')
      result[newKey] = normalizeIds(value)
    }
    return result
  }
  return obj
}

function denormalizeIds(obj: unknown): unknown {
  if (Array.isArray(obj)) {
    return obj.map(denormalizeIds)
  }
  if (obj !== null && typeof obj === 'object' && obj.constructor === Object) {
    const result: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(obj)) {
      const newKey = ID_EXCEPTIONS.has(key) ? key : key.replace(/ID$/, 'Id')
      result[newKey] = denormalizeIds(value)
    }
    return result
  }
  return obj
}

export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: { 'Content-Type': 'application/json' },
})

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (_accessToken && config.headers) {
    config.headers.Authorization = `Bearer ${_accessToken}`
  }
  if (config.data && typeof config.data === 'object' && config.data.constructor === Object) {
    config.data = denormalizeIds(config.data)
  }
  return config
})

apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    if (response.data && typeof response.data === 'object') {
      response.data = normalizeIds(response.data)
    }
    return response
  },
  async (error) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean }

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        }).then((token) => {
          if (originalRequest.headers) originalRequest.headers.Authorization = `Bearer ${token}`
          return apiClient(originalRequest)
        })
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        const res = await axios.post(`${API_BASE_URL}/auth/refresh`, {}, { withCredentials: true })
        const newToken: string = res.data.accessToken
        setClientToken(newToken)
        processQueue(null, newToken)
        if (originalRequest.headers) originalRequest.headers.Authorization = `Bearer ${newToken}`
        return apiClient(originalRequest)
      } catch (refreshError) {
        processQueue(refreshError, null)
        _logoutFn?.()
        window.location.href = '/login'
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  }
)

export default apiClient
