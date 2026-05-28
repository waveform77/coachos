import { apiClient } from './client'
import { API_ENDPOINTS } from '../config/api'

export interface CoachNote {
  id: string
  playerId: string
  coachId: string
  category: 'technique' | 'tactics' | 'physical' | 'behavior' | 'medical'
  content: string
  isPrivate: boolean
  createdAt: string
}

export interface CreateCoachNoteRequest {
  playerId: string
  category: CoachNote['category']
  content: string
  isPrivate: boolean
}

export const coachNotesApi = {
  listByPlayer: (playerId: string) =>
    apiClient.get<{ data: CoachNote[]; meta: { total: number } }>(`${API_ENDPOINTS.PLAYERS.DETAIL(playerId)}/notes`).then((r) => r.data),

  create: (data: CreateCoachNoteRequest) =>
    apiClient.post<CoachNote>(API_ENDPOINTS.COACH.NOTES, data).then((r) => r.data),

  update: (id: string, data: CreateCoachNoteRequest) =>
    apiClient.patch<CoachNote>(`${API_ENDPOINTS.COACH.NOTES}/${id}`, data).then((r) => r.data),

  delete: (id: string) =>
    apiClient.delete(`${API_ENDPOINTS.COACH.NOTES}/${id}`).then((r) => r.data),
}
