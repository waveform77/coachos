export const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8080/api/v1'

export const API_TIMEOUT = 15000

export const API_ENDPOINTS = {
  USERS: {
    BASE: '/users',
  },
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    REFRESH: '/auth/refresh',
    LOGOUT: '/auth/logout',
    ME: '/auth/me',
  },
  CLUBS: {
    BASE: '/clubs',
    DASHBOARD: (id: string) => `/clubs/${id}/dashboard`,
  },
  TEAMS: {
    BASE: '/teams',
    DETAIL: (id: string) => `/teams/${id}`,
    MEMBERS: (id: string) => `/teams/${id}/members`,
    MEMBER: (teamId: string, playerId: string) => `/teams/${teamId}/members/${playerId}`,
    DASHBOARD: (id: string) => `/teams/${id}/dashboard`,
  },
  PLAYERS: {
    BASE: '/players',
    DETAIL: (id: string) => `/players/${id}`,
    PROFILE: (id: string) => `/players/${id}/profile`,
    PROGRESS: (id: string) => `/players/${id}/progress`,
    DEV_INDEX: (id: string) => `/players/${id}/dev-index`,
    ATTENDANCE: (id: string) => `/players/${id}/attendance`,
  },
  EXERCISES: {
    BASE: '/exercises',
    DETAIL: (id: string) => `/exercises/${id}`,
  },
  SESSIONS: {
    BASE: '/sessions',
    DETAIL: (id: string) => `/sessions/${id}`,
    BLOCKS: (id: string) => `/sessions/${id}/blocks`,
    BLOCK_EXERCISES: (sessionId: string, blockId: string) => `/sessions/${sessionId}/blocks/${blockId}/exercises`,
    ATTENDANCE: (id: string) => `/sessions/${id}/attendance`,
    COMPLETE: (id: string) => `/sessions/${id}/complete`,
  },
  ASSESSMENTS: {
    BASE: '/assessments',
    PLAYER: (playerId: string) => `/players/${playerId}/assessments`,
    TEAM_SUMMARY: (teamId: string) => `/teams/${teamId}/assessments/summary`,
  },
  MATCHES: {
    BASE: '/matches',
    DETAIL: (id: string) => `/matches/${id}`,
    LINEUP: (id: string) => `/matches/${id}/lineup`,
    EVENTS: (id: string) => `/matches/${id}/events`,
    SUMMARY: (id: string) => `/matches/${id}/summary`,
    MY_MATCHES: '/me/matches',
  },
  ANALYTICS: {
    COACH_DASHBOARD: '/analytics/coach-dashboard',
    TEAM: (id: string) => `/analytics/team/${id}`,
    PLAYER: (id: string) => `/analytics/player/${id}`,
    ATTENDANCE: '/analytics/attendance',
    TRAINING_LOAD: '/analytics/training-load',
  },
  AI: {
    TRAINING_PLAN: '/ai/training-plan',
    RECOMMEND_EXERCISES: '/ai/recommend-exercises',
    ANALYZE_PLAYER: '/ai/analyze-player',
    SUMMARIZE_PROGRESS: '/ai/summarize-progress',
  },
  NOTIFICATIONS: {
    BASE: '/notifications',
    MARK_READ: (id: string) => `/notifications/${id}/read`,
    MARK_ALL_READ: '/notifications/read-all',
  },
  PARENT: {
    CHILDREN: '/parent/children',
    ACCEPT_INVITATION: '/parent/accept-invitation',  // Вариант A: принять приглашение
    USE_LINK_CODE: '/parent/use-link-code',           // Вариант C: использовать код
  },
  COACH: {
    PARENT_INVITATIONS: '/coach/parent-invitations',  // Вариант A: приглашения
    LINK_CODES: '/coach/link-codes',                 // Вариант C: коды доступа
    NOTES: '/coach/notes',
  },
  MEDICAL: {
    RECORDS: '/medical-records',
  },
} as const
