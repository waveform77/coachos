import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, formatDistanceToNow, differenceInYears, parseISO } from 'date-fns'
import type { Role, SessionStatus, SessionIntensity, AttendanceStatus, GoalStatus, MatchStatus } from '../types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(dateStr: string | undefined, fmt = 'MMM d, yyyy'): string {
  if (!dateStr) return '—'
  try {
    return format(parseISO(dateStr), fmt)
  } catch {
    return '—'
  }
}

export function formatDateTime(dateStr: string | undefined): string {
  return formatDate(dateStr, 'MMM d, yyyy HH:mm')
}

export function formatRelativeTime(dateStr: string | undefined): string {
  if (!dateStr) return '—'
  try {
    return formatDistanceToNow(parseISO(dateStr), { addSuffix: true })
  } catch {
    return '—'
  }
}

export function calculateAge(birthDate: string | undefined): number | null {
  if (!birthDate) return null
  try {
    return differenceInYears(new Date(), parseISO(birthDate))
  } catch {
    return null
  }
}

export function getInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
}

export function formatScore(goalsFor: number, goalsAgainst: number): string {
  return `${goalsFor} : ${goalsAgainst}`
}

export function getRoleColor(role: Role): string {
  const colors: Record<Role, string> = {
    admin: 'bg-purple-100 text-purple-800',
    coach: 'bg-emerald-100 text-emerald-800',
    player: 'bg-blue-100 text-blue-800',
    parent: 'bg-orange-100 text-orange-800',
    analyst: 'bg-slate-100 text-slate-800',
  }
  return colors[role] ?? 'bg-slate-100 text-slate-800'
}

export function getStatusColor(status: SessionStatus | MatchStatus | GoalStatus): string {
  const colors: Record<string, string> = {
    planned: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    in_progress: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    completed: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
    cancelled: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    scheduled: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    postponed: 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-200',
    active: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
    achieved: 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200',
    paused: 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-200',
  }
  return colors[status] ?? 'bg-slate-100 text-slate-800'
}

export function getIntensityColor(intensity: SessionIntensity): string {
  const colors: Record<SessionIntensity, string> = {
    low: 'text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-950',
    medium: 'text-yellow-600 bg-yellow-50 dark:text-yellow-400 dark:bg-yellow-950',
    high: 'text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-950',
  }
  return colors[intensity]
}

export function getAttendanceColor(status: AttendanceStatus): string {
  const colors: Record<AttendanceStatus, string> = {
    present: 'text-emerald-700 bg-emerald-50 border-emerald-200',
    absent: 'text-red-700 bg-red-50 border-red-200',
    late: 'text-yellow-700 bg-yellow-50 border-yellow-200',
    excused: 'text-blue-700 bg-blue-50 border-blue-200',
    injured: 'text-orange-700 bg-orange-50 border-orange-200',
  }
  return colors[status]
}

export function getDevIndexColor(value: number): string {
  if (value >= 70) return 'text-emerald-600'
  if (value >= 40) return 'text-yellow-600'
  return 'text-red-600'
}

export function getDevIndexBg(value: number): string {
  if (value >= 70) return '#10b981'
  if (value >= 40) return '#eab308'
  return '#ef4444'
}

export function getDevIndexLabel(value: number): string {
  if (value >= 70) return 'Хороший уровень'
  if (value >= 40) return 'Средний уровень'
  return 'Ниже среднего'
}

export function truncate(str: string, max: number): string {
  if (str.length <= max) return str
  return str.slice(0, max) + '…'
}

export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).replace(/_/g, ' ')
}
