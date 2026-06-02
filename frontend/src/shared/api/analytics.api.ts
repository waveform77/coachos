import { apiClient } from './client'
import { API_ENDPOINTS } from '../config/api'
import type { AttendanceRecord, CoachDashboard, PlayerAnalytics, AttendanceStat, TrainingLoad, PlayerAssessment } from '../types'

type AttendanceAnalyticsApiResponse = {
  teamId?: string
  overallRate?: number
  players?: AttendanceStat[]
}

type WeeklyLoadPointApi = { weekStart: string; load: number; sessions: number }

type TrainingLoadApiResponse = {
  teamId?: string
  weeklyLoad?: WeeklyLoadPointApi[]
  overloadWarning?: boolean
  currentLoad?: number
  threshold?: number
}

function mapWeeklyLoadToTrainingLoad(rows: WeeklyLoadPointApi[]): TrainingLoad[] {
  return rows.map((w) => ({
    weekLabel: new Date(w.weekStart).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
    loadScore: w.load,
    sessionCount: w.sessions,
    avgIntensity: '',
  }))
}

type TimelinePoint = {
  assessedAt?: string
  technical?: number
  physical?: number
  tactical?: number
  discipline?: number
  teamwork?: number
}

function mapAssessmentTimeline(raw: Record<string, unknown>): PlayerAssessment[] {
  const rows = (raw.assessmentTimeline ?? raw.assessmentHistory) as TimelinePoint[] | undefined
  if (!rows?.length) return []
  return rows.map((row, i) => {
    const at = row.assessedAt
    const assessedAt =
      typeof at === 'string' ? at : at != null ? new Date(at as unknown as Date).toISOString() : new Date(0).toISOString()
    return {
      id: `timeline-${i}`,
      playerID: '',
      coachID: '',
      assessedAt,
      technical: Math.round(Number(row.technical ?? 0)),
      physical: Math.round(Number(row.physical ?? 0)),
      tactical: Math.round(Number(row.tactical ?? 0)),
      discipline: Math.round(Number(row.discipline ?? 0)),
      teamwork: Math.round(Number(row.teamwork ?? 0)),
    }
  })
}

function mapDevIndexHistory(raw: Record<string, unknown>): PlayerAnalytics['devIndexHistory'] {
  const rows = raw.devIndexHistory as Array<{ date?: string; value?: number }> | undefined
  if (!rows?.length) return []
  return rows.map((p) => ({
    date: typeof p.date === 'string' ? p.date : new Date(p.date as unknown as Date).toISOString(),
    value: Number(p.value ?? 0),
  }))
}

function normalizePlayerAnalytics(raw: Record<string, unknown>): PlayerAnalytics {
  const rows = (raw.attendanceHistory as Record<string, unknown>[] | undefined) ?? []
  const attendanceHistory: AttendanceRecord[] = rows.map((r) => ({
    id: String(r.id ?? ''),
    sessionID: String(r.sessionId ?? r.sessionID ?? ''),
    playerID: String(r.playerId ?? r.playerID ?? ''),
    status: r.status as AttendanceRecord['status'],
    reason: r.reason ? String(r.reason) : undefined,
    markedAt: typeof r.markedAt === 'string' ? r.markedAt : new Date(r.markedAt as string).toISOString(),
  }))
  return {
    assessmentHistory: mapAssessmentTimeline(raw),
    attendanceHistory,
    goalsProgress: (raw.goalsProgress as PlayerAnalytics['goalsProgress']) ?? [],
    devIndexHistory: mapDevIndexHistory(raw),
  }
}

export type MatchStats = {
  goals: number
  assists: number
  yellowCards: number
  redCards: number
  minutesPlayed: number
  matchesPlayed: number
}

export type PlayerForm = {
  form: string
  label: string
  trend: string
  avgScore: number
  attendance: number
  matchCount: number
}

export type MyReportsResponse = {
  analytics: PlayerAnalytics
  matchStats: MatchStats
  form: PlayerForm
}

export const analyticsApi = {
  getCoachDashboard: () =>
    apiClient.get<CoachDashboard>(API_ENDPOINTS.ANALYTICS.COACH_DASHBOARD).then((r) => r.data),

  getTeamAnalytics: (teamId: string, params?: { from?: string; to?: string }) =>
    apiClient.get(API_ENDPOINTS.ANALYTICS.TEAM(teamId), { params }).then((r) => r.data),

  getPlayerAnalytics: (playerId: string) =>
    apiClient
      .get<Record<string, unknown>>(API_ENDPOINTS.ANALYTICS.PLAYER(playerId))
      .then((r) => normalizePlayerAnalytics(r.data)),

  getAttendanceAnalytics: (params?: { teamId?: string; from?: string; to?: string }) =>
    apiClient
      .get<AttendanceAnalyticsApiResponse>(API_ENDPOINTS.ANALYTICS.ATTENDANCE, { params })
      .then((r) => r.data.players ?? []),

  getTrainingLoad: (params?: { teamId?: string; weeks?: number }) =>
    apiClient
      .get<TrainingLoadApiResponse>(API_ENDPOINTS.ANALYTICS.TRAINING_LOAD, { params })
      .then((r) => mapWeeklyLoadToTrainingLoad(r.data.weeklyLoad ?? [])),

  getPlayerMatchStats: (playerId: string) =>
    apiClient.get<MatchStats>(`${API_ENDPOINTS.ANALYTICS.PLAYER(playerId)}/match-stats`).then((r) => r.data),

  getPlayerForm: (playerId: string) =>
    apiClient.get<PlayerForm>(`${API_ENDPOINTS.ANALYTICS.PLAYER(playerId)}/form`).then((r) => r.data),

  getMyReports: () =>
    apiClient.get<MyReportsResponse>(API_ENDPOINTS.ME.REPORTS).then((r) => r.data),
}
