import type { Role } from '../types'
import { ROUTES } from './routes'

export const ROLE_DISPLAY_NAMES: Record<Role, string> = {
  admin: 'Administrator',
  coach: 'Coach',
  player: 'Player',
  parent: 'Parent',
  analyst: 'Analyst',
}

export const ROLE_COLORS: Record<Role, string> = {
  admin: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  coach: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
  player: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  parent: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  analyst: 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-200',
}

export const ROLE_DEFAULT_ROUTES: Record<Role, string> = {
  admin: ROUTES.ADMIN_CLUB,
  coach: ROUTES.COACH_COMMAND_CENTER,
  player: ROUTES.PLAYER_SCHEDULE,
  parent: ROUTES.PARENT_OVERVIEW,
  analyst: ROUTES.COACH_ANALYTICS,
}

export const ROUTE_ROLE_ACCESS: Record<string, Role[]> = {
  '/admin': ['admin'],
  '/coach': ['coach', 'analyst'],
  '/me': ['player'],
  '/parent': ['parent'],
}
