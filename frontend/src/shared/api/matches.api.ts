import { apiClient } from './client'
import { API_ENDPOINTS } from '../config/api'
import type { Match, MatchLineup, MatchEvent, PaginatedResponse } from '../types'

export const matchesApi = {
  listMatches: (params?: { teamId?: string; status?: string; page?: number; limit?: number }) =>
    apiClient.get<PaginatedResponse<Match>>(API_ENDPOINTS.MATCHES.BASE, { params }).then((r) => r.data),

  getMatch: (id: string) =>
    apiClient.get<Match>(API_ENDPOINTS.MATCHES.DETAIL(id)).then((r) => r.data),

  createMatch: (data: Partial<Match>) =>
    apiClient.post<Match>(API_ENDPOINTS.MATCHES.BASE, data).then((r) => r.data),

  updateMatch: (id: string, data: Partial<Match>) =>
    apiClient.patch<Match>(API_ENDPOINTS.MATCHES.DETAIL(id), data).then((r) => r.data),

  deleteMatch: (id: string) =>
    apiClient.delete(API_ENDPOINTS.MATCHES.DETAIL(id)).then((r) => r.data),

  getLineup: (matchId: string) =>
    apiClient.get<Match>(API_ENDPOINTS.MATCHES.DETAIL(matchId)).then((r) => r.data.lineup ?? []),

  setLineup: (matchId: string, lineup: Partial<MatchLineup>[]) =>
    apiClient.post<MatchLineup[]>(API_ENDPOINTS.MATCHES.LINEUP(matchId), { players: lineup }).then((r) => r.data),

  getMatchEvents: (matchId: string) =>
    apiClient.get<Match>(API_ENDPOINTS.MATCHES.DETAIL(matchId)).then((r) => r.data.events ?? []),

  addMatchEvent: (matchId: string, data: Partial<MatchEvent>) =>
    apiClient.post<MatchEvent>(API_ENDPOINTS.MATCHES.EVENTS(matchId), data).then((r) => r.data),

  getMatchSummary: (matchId: string) =>
    apiClient.get(API_ENDPOINTS.MATCHES.SUMMARY(matchId)).then((r) => r.data),

  getMyMatches: (params?: { page?: number; limit?: number }) =>
    apiClient.get<PaginatedResponse<Match>>(API_ENDPOINTS.MATCHES.MY_MATCHES, { params }).then((r) => r.data),
}
