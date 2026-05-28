import { apiClient } from './client'
import { API_ENDPOINTS } from '../config/api'
import type { Team, TeamMember, PaginatedResponse, TeamWithMembers, Player, Position } from '../types'

const POSITIONS: Position[] = ['goalkeeper', 'defender', 'midfielder', 'forward', 'universal']

function parsePosition(p?: string): Position | undefined {
  if (!p) return undefined
  return POSITIONS.includes(p as Position) ? (p as Position) : undefined
}

function normalizeTeamDetail(raw: TeamWithMembers): TeamWithMembers {
  return { ...raw }
}

/** Maps GET /teams/:id `members` into roster rows used by lineup / attendance / team detail. */
export function teamDetailToMembers(team: TeamWithMembers): TeamMember[] {
  return (team.members ?? []).map((m) => {
    const pos = parsePosition(m.position)
    const pid = (m as any).playerID || (m as any).playerId
    const player: Player = {
      id: pid,
      clubId: team.clubId ?? '',
      firstName: m.firstName,
      lastName: m.lastName,
      devIndex: m.devIndex ?? 0,
      position: pos,
    }
    return {
      teamID: team.id,
      playerID: pid,
      player,
      jerseyNumber: m.jerseyNumber,
      position: pos,
      isCaptain: m.isCaptain,
      joinedAt: '',
    }
  })
}

export const teamsApi = {
  listTeams: (params?: { clubId?: string; page?: number; limit?: number }) =>
    apiClient.get<PaginatedResponse<Team>>(API_ENDPOINTS.TEAMS.BASE, { params }).then((r) => r.data),

  getTeam: (id: string) =>
    apiClient.get<TeamWithMembers>(API_ENDPOINTS.TEAMS.DETAIL(id)).then((r) => normalizeTeamDetail(r.data)),

  createTeam: (data: Partial<Team>) =>
    apiClient.post<Team>(API_ENDPOINTS.TEAMS.BASE, data).then((r) => r.data),

  updateTeam: (id: string, data: Partial<Team>) =>
    apiClient.patch<Team>(API_ENDPOINTS.TEAMS.DETAIL(id), data).then((r) => r.data),

  deleteTeam: (id: string) =>
    apiClient.delete(API_ENDPOINTS.TEAMS.DETAIL(id)).then((r) => r.data),

  /** Backend has no GET /teams/:id/members; members are embedded in GET /teams/:id. */
  getTeamMembers: (teamId: string) =>
    teamsApi.getTeam(teamId).then(teamDetailToMembers),

  addMember: (teamId: string, data: { playerID: string; jerseyNumber?: number; position?: string }) =>
    apiClient.post<TeamMember>(API_ENDPOINTS.TEAMS.MEMBERS(teamId), data).then((r) => r.data),

  removeMember: (teamId: string, playerId: string) =>
    apiClient.delete(API_ENDPOINTS.TEAMS.MEMBER(teamId, playerId)).then((r) => r.data),

  getTeamDashboard: (teamId: string) =>
    apiClient.get(API_ENDPOINTS.TEAMS.DASHBOARD(teamId)).then((r) => r.data),
}
