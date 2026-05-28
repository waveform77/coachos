export const queryKeys = {
  auth: {
    me: () => ['auth', 'me'] as const,
  },
  users: {
    list: (params: { role: string; clubId?: string }) => ['users', 'list', params] as const,
  },
  clubs: {
    all: () => ['clubs'] as const,
    detail: (id: string) => ['clubs', id] as const,
    dashboard: (id: string) => ['clubs', id, 'dashboard'] as const,
  },
  teams: {
    all: (params?: object) => ['teams', params] as const,
    detail: (id: string) => ['teams', id] as const,
    members: (id: string) => ['teams', id, 'members'] as const,
    dashboard: (id: string) => ['teams', id, 'dashboard'] as const,
  },
  players: {
    all: (params?: object) => ['players', params] as const,
    detail: (id: string) => ['players', id] as const,
    profile: (id: string) => ['players', id, 'profile'] as const,
    progress: (id: string) => ['players', id, 'progress'] as const,
    devIndex: (id: string) => ['players', id, 'dev-index'] as const,
    attendance: (id: string, params?: object) => ['players', id, 'attendance', params] as const,
  },
  exercises: {
    all: (params?: object) => ['exercises', params] as const,
    detail: (id: string) => ['exercises', id] as const,
  },
  sessions: {
    all: (params?: object) => ['sessions', params] as const,
    detail: (id: string) => ['sessions', id] as const,
    attendance: (id: string) => ['sessions', id, 'attendance'] as const,
  },
  assessments: {
    player: (playerId: string) => ['assessments', 'player', playerId] as const,
    teamSummary: (teamId: string) => ['assessments', 'team', teamId, 'summary'] as const,
  },
  matches: {
    all: (params?: object) => ['matches', params] as const,
    my: () => ['matches', 'my'] as const,
    detail: (id: string) => ['matches', id] as const,
    lineup: (id: string) => ['matches', id, 'lineup'] as const,
    events: (id: string) => ['matches', id, 'events'] as const,
    summary: (id: string) => ['matches', id, 'summary'] as const,
  },
  analytics: {
    coachDashboard: () => ['analytics', 'coach', 'dashboard'] as const,
    team: (id: string, params?: object) => ['analytics', 'teams', id, params] as const,
    player: (id: string) => ['analytics', 'players', id] as const,
    attendance: (params?: object) => ['analytics', 'attendance', params] as const,
    trainingLoad: (params?: object) => ['analytics', 'training-load', params] as const,
  },
  notifications: {
    all: (params?: object) => ['notifications', params] as const,
  },
  parent: {
    children: () => ['parent', 'children'] as const,
  },
  coach: {
    invitations: (playerId: string) => ['coach', 'invitations', playerId] as const,
    linkCodes: (playerId: string) => ['coach', 'link-codes', playerId] as const,
  },
  coachNotes: {
    player: (playerId: string) => ['coach-notes', 'player', playerId] as const,
  },
  medical: {
    player: (playerId: string) => ['medical', 'player', playerId] as const,
  },
} as const
