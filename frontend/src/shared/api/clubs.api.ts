import { apiClient } from './client'
import { API_ENDPOINTS } from '../config/api'
import type { Club, TeamStat, TrainingSession } from '../types'

/** Matches GET /clubs/:id/dashboard JSON. */
export interface ClubDashboard {
  club: Club
  teamCount: number
  playerCount: number
  coachCount: number
  teamStats: TeamStat[]
  recentSessions: TrainingSession[]
}

function normalizeClubDashboard(raw: Record<string, unknown>): ClubDashboard {
  return {
    club: raw.club as Club,
    teamCount: Number(raw.teamCount ?? 0),
    playerCount: Number(raw.playerCount ?? 0),
    coachCount: Number(raw.coachCount ?? 0),
    teamStats: (raw.teamStats as TeamStat[] | undefined) ?? [],
    recentSessions: (raw.recentSessions as TrainingSession[] | undefined) ?? [],
  }
}

export const clubsApi = {
  getClub: (id: string) =>
    apiClient.get<Club>(API_ENDPOINTS.CLUBS.BASE + `/${id}`).then((r) => r.data),

  createClub: (data: Partial<Club>) =>
    apiClient.post<Club>(API_ENDPOINTS.CLUBS.BASE, data).then((r) => r.data),

  updateClub: (id: string, data: Partial<Club>) =>
    apiClient.patch<Club>(API_ENDPOINTS.CLUBS.BASE + `/${id}`, data).then((r) => r.data),

  getClubDashboard: (id: string) =>
    apiClient.get<Record<string, unknown>>(API_ENDPOINTS.CLUBS.DASHBOARD(id)).then((r) => normalizeClubDashboard(r.data)),
}
