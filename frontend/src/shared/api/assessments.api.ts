import { apiClient } from './client'
import { API_ENDPOINTS } from '../config/api'
import type { PaginatedResponse, PlayerAssessment } from '../types'

export const assessmentsApi = {
  createAssessment: (data: Partial<PlayerAssessment>) =>
    apiClient.post<PlayerAssessment>(API_ENDPOINTS.ASSESSMENTS.BASE, data).then((r) => r.data),

  getPlayerAssessments: (playerId: string) =>
    apiClient
      .get<PaginatedResponse<PlayerAssessment>>(API_ENDPOINTS.ASSESSMENTS.PLAYER(playerId))
      .then((r) => r.data.data),

  getTeamAssessmentSummary: (teamId: string) =>
    apiClient.get(API_ENDPOINTS.ASSESSMENTS.TEAM_SUMMARY(teamId)).then((r) => r.data),
}
