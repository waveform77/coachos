export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  DASHBOARD: '/dashboard',
  PROFILE: '/profile',
  SETTINGS: '/settings',
  NOTIFICATIONS: '/notifications',

  // Admin
  ADMIN_CLUB: '/admin/club',
  ADMIN_COACHES: '/admin/coaches',
  ADMIN_ANALYTICS: '/admin/analytics',

  // Coach
  COACH_COMMAND_CENTER: '/coach',
  COACH_TEAMS: '/coach/teams',
  COACH_TEAM_DETAIL: '/coach/teams/:teamId',
  COACH_PLAYERS: '/coach/players',
  COACH_PLAYER_DETAIL: '/coach/players/:playerId',
  COACH_CALENDAR: '/coach/calendar',
  COACH_SESSIONS: '/coach/sessions',
  COACH_SESSION_DETAIL: '/coach/sessions/:sessionId',
  COACH_EXERCISES: '/coach/exercises',
  COACH_ATTENDANCE: '/coach/attendance',
  COACH_ASSESSMENTS: '/coach/assessments',
  COACH_MATCHES: '/coach/matches',
  COACH_MATCH_DETAIL: '/coach/matches/:matchId',
  COACH_ANALYTICS: '/coach/analytics',
  COACH_AI_ASSISTANT: '/coach/ai',

  // Player
  PLAYER_SCHEDULE: '/me/schedule',
  PLAYER_PROGRESS: '/me/progress',
  PLAYER_GOALS: '/me/goals',
  PLAYER_REPORTS: '/me/reports',

  // Parent
  PARENT_OVERVIEW: '/parent/overview',
  PARENT_SCHEDULE: '/parent/schedule',
  PARENT_ATTENDANCE: '/parent/attendance',
  PARENT_PROGRESS: '/parent/progress',
} as const

export type RouteKey = keyof typeof ROUTES
