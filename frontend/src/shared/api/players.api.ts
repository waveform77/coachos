import { apiClient } from './client'
import { API_ENDPOINTS } from '../config/api'
import type { Player, PlayerAnalytics, AttendanceRecord, PaginatedResponse } from '../types'

export const playersApi = {
  listPlayers: (params?: { clubId?: string; teamId?: string; position?: string; search?: string; page?: number; limit?: number }) =>
    apiClient.get<PaginatedResponse<Player>>(API_ENDPOINTS.PLAYERS.BASE, { params }).then((r) => r.data),

  getPlayer: (id: string) =>
    apiClient.get<Player>(API_ENDPOINTS.PLAYERS.DETAIL(id)).then((r) => r.data),

  createPlayer: (data: Partial<Player>) =>
    apiClient.post<Player>(API_ENDPOINTS.PLAYERS.BASE, data).then((r) => r.data),

  updatePlayer: (id: string, data: Partial<Player>) =>
    apiClient.patch<Player>(API_ENDPOINTS.PLAYERS.DETAIL(id), data).then((r) => r.data),

  deletePlayer: (id: string) =>
    apiClient.delete(API_ENDPOINTS.PLAYERS.DETAIL(id)).then((r) => r.data),

  uploadPlayerPhoto: (id: string, file: File) => {
    const formData = new FormData()
    formData.append('photo', file)
    return apiClient.post<{ playerId: string; photoURL: string; firstName: string; lastName: string }>(
      `${API_ENDPOINTS.PLAYERS.DETAIL(id)}/photo`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    ).then((r) => r.data)
  },

  getPlayerProfile: (id: string) =>
    apiClient.get(API_ENDPOINTS.PLAYERS.PROFILE(id)).then((r) => r.data),

  getPlayerProgress: (id: string) =>
    apiClient.get<PlayerAnalytics>(API_ENDPOINTS.PLAYERS.PROGRESS(id)).then((r) => r.data),

  getPlayerDevIndex: (id: string) =>
    apiClient.get<{ devIndex: number; history: Array<{ date: string; value: number }> }>(API_ENDPOINTS.PLAYERS.DEV_INDEX(id)).then((r) => r.data),

  getPlayerAttendance: (id: string, params?: { from?: string; to?: string }) =>
    apiClient.get<AttendanceRecord[]>(API_ENDPOINTS.PLAYERS.ATTENDANCE(id), { params }).then((r) => r.data),
}
