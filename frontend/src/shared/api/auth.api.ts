import { apiClient } from './client'
import { API_ENDPOINTS } from '../config/api'
import type { User } from '../types'

export interface LoginRequest { email: string; password: string }
export interface RegisterRequest {
  email: string
  password: string
  firstName: string
  lastName: string
  role: string
  createClub?: { name: string; city?: string; country?: string }
}
export interface CreateUserRequest { email: string; password: string; firstName: string; lastName: string; role: string; phone?: string }
export interface UpdateUserRequest { firstName?: string; lastName?: string; phone?: string; role?: string; password?: string; isActive?: boolean }
export interface AuthResponse { user: User; accessToken: string }

export const authApi = {
  login: (data: LoginRequest) =>
    apiClient.post<AuthResponse>(API_ENDPOINTS.AUTH.LOGIN, data).then((r) => r.data),

  register: (data: RegisterRequest) =>
    apiClient.post<AuthResponse>(API_ENDPOINTS.AUTH.REGISTER, data).then((r) => r.data),

  refresh: () =>
    apiClient.post<{ accessToken: string }>(API_ENDPOINTS.AUTH.REFRESH, {}, { withCredentials: true }).then((r) => r.data),

  logout: () =>
    apiClient.post(API_ENDPOINTS.AUTH.LOGOUT).then((r) => r.data),

  getMe: () =>
    apiClient.get<User>(API_ENDPOINTS.AUTH.ME).then((r) => r.data),

  /** Admin: users in the caller's club, filtered by role (e.g. `coach`). */
  listUsers: async (params: { role: string; page?: number; limit?: number }) => {
    const { data } = await apiClient.get<User[] | { message?: string }>(API_ENDPOINTS.USERS.BASE, { params })
    if (!Array.isArray(data)) {
      const hint =
        typeof data === 'object' && data !== null && 'message' in data && typeof data.message === 'string'
          ? data.message
          : JSON.stringify(data)
      throw new Error(hint || 'users API must return a JSON array')
    }
    return data
  },

  /** Admin: create a user inside the admin's club. */
  createUser: (data: CreateUserRequest) =>
    apiClient.post<User>(API_ENDPOINTS.USERS.BASE, data).then((r) => r.data),

  /** Admin: update a user inside the admin's club. */
  updateUser: (id: string, data: UpdateUserRequest) =>
    apiClient.patch<User>(API_ENDPOINTS.USERS.DETAIL(id), data).then((r) => r.data),
}
