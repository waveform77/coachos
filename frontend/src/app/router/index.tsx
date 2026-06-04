import * as React from 'react'
import { createBrowserRouter, Navigate } from 'react-router-dom'
import { ProtectedRoute } from './protected-route'
import { useAuthStore } from '@/app/store/auth.store'
import { ROLE_DEFAULT_ROUTES } from '@/shared/config/roles'
import { ROUTES } from '@/shared/config/routes'

const AppShell = React.lazy(() => import('@/widgets/app-shell/app-shell').then((m) => ({ default: m.AppShell })))

const LoginPage = React.lazy(() => import('@/pages/auth/login.page').then((m) => ({ default: m.LoginPage })))
const RegisterPage = React.lazy(() => import('@/pages/auth/register.page').then((m) => ({ default: m.RegisterPage })))
const LandingPage = React.lazy(() => import('@/pages/landing/landing.page').then((m) => ({ default: m.LandingPage })))

const DashboardRedirect = React.lazy(() => import('@/pages/dashboard/dashboard.page').then((m) => ({ default: m.DashboardPage })))

// Coach pages
const CommandCenterPage = React.lazy(() => import('@/pages/coach/command-center.page').then((m) => ({ default: m.CommandCenterPage })))
const TeamsPage = React.lazy(() => import('@/pages/coach/teams.page').then((m) => ({ default: m.TeamsPage })))
const TeamDetailPage = React.lazy(() => import('@/pages/coach/team-detail.page').then((m) => ({ default: m.TeamDetailPage })))
const PlayersPage = React.lazy(() => import('@/pages/coach/players.page').then((m) => ({ default: m.PlayersPage })))
const PlayerDetailPage = React.lazy(() => import('@/pages/coach/player-detail.page').then((m) => ({ default: m.PlayerDetailPage })))
const CalendarPage = React.lazy(() => import('@/pages/coach/calendar.page').then((m) => ({ default: m.CalendarPage })))
const SessionDetailPage = React.lazy(() => import('@/pages/coach/session-detail.page').then((m) => ({ default: m.SessionDetailPage })))
const SessionsListPage = React.lazy(() => import('@/pages/coach/sessions-list.page').then((m) => ({ default: m.SessionsListPage })))
const SessionNewPage = React.lazy(() => import('@/pages/coach/session-new.page').then((m) => ({ default: m.SessionNewPage })))
const ExercisesPage = React.lazy(() => import('@/pages/coach/exercises.page').then((m) => ({ default: m.ExercisesPage })))
const AttendancePage = React.lazy(() => import('@/pages/coach/attendance.page').then((m) => ({ default: m.AttendancePage })))
const AssessmentsPage = React.lazy(() => import('@/pages/coach/assessments.page').then((m) => ({ default: m.AssessmentsPage })))
const MatchesPage = React.lazy(() => import('@/pages/coach/matches.page').then((m) => ({ default: m.MatchesPage })))
const MatchDetailPage = React.lazy(() => import('@/pages/coach/match-detail.page').then((m) => ({ default: m.MatchDetailPage })))
const CoachAnalyticsPage = React.lazy(() => import('@/pages/coach/analytics.page').then((m) => ({ default: m.CoachAnalyticsPage })))
const AiAssistantPage = React.lazy(() => import('@/pages/coach/ai-assistant.page').then((m) => ({ default: m.AiAssistantPage })))

// Admin pages
const ClubPage = React.lazy(() => import('@/pages/admin/club.page').then((m) => ({ default: m.ClubPage })))
const CoachesPage = React.lazy(() => import('@/pages/admin/coaches.page').then((m) => ({ default: m.CoachesPage })))
const AdminAnalyticsPage = React.lazy(() => import('@/pages/admin/analytics.page').then((m) => ({ default: m.AdminAnalyticsPage })))

// Player pages
const PlayerSchedulePage = React.lazy(() => import('@/pages/player/schedule.page').then((m) => ({ default: m.PlayerSchedulePage })))
const PlayerProgressPage = React.lazy(() => import('@/pages/player/progress.page').then((m) => ({ default: m.PlayerProgressPage })))
const PlayerGoalsPage = React.lazy(() => import('@/pages/player/goals.page').then((m) => ({ default: m.PlayerGoalsPage })))
const PlayerReportsPage = React.lazy(() => import('@/pages/player/reports.page').then((m) => ({ default: m.PlayerReportsPage })))
const PlayerMatchesPage = React.lazy(() => import('@/pages/player/matches.page').then((m) => ({ default: m.PlayerMatchesPage })))
const PlayerMatchDetailPage = React.lazy(() => import('@/pages/player/match-detail.page').then((m) => ({ default: m.PlayerMatchDetailPage })))

// Parent pages
const ParentOverviewPage = React.lazy(() => import('@/pages/parent/overview.page').then((m) => ({ default: m.ParentOverviewPage })))
const ParentSchedulePage = React.lazy(() => import('@/pages/parent/schedule.page').then((m) => ({ default: m.ParentSchedulePage })))
const ParentAttendancePage = React.lazy(() => import('@/pages/parent/attendance.page').then((m) => ({ default: m.ParentAttendancePage })))
const ParentProgressPage = React.lazy(() => import('@/pages/parent/progress.page').then((m) => ({ default: m.ParentProgressPage })))
const ParentEnterCodePage = React.lazy(() => import('@/pages/parent/enter-code.page').then((m) => ({ default: m.ParentEnterCodePage })))

// Shared pages
const ProfilePage = React.lazy(() => import('@/pages/shared/profile.page').then((m) => ({ default: m.ProfilePage })))
const SettingsPage = React.lazy(() => import('@/pages/shared/settings.page').then((m) => ({ default: m.SettingsPage })))
const NotificationsPage = React.lazy(() => import('@/pages/shared/notifications.page').then((m) => ({ default: m.NotificationsPage })))

function RootRedirect() {
  const { isAuthenticated, user } = useAuthStore()
  if (!isAuthenticated) return <Navigate to="/landing" replace />
  if (user) return <Navigate to={ROLE_DEFAULT_ROUTES[user.role]} replace />
  return <Navigate to="/login" replace />
}

const Suspend = ({ children }: { children: React.ReactNode }) => (
  <React.Suspense fallback={<div className="flex h-screen items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>}>
    {children}
  </React.Suspense>
)

export const router = createBrowserRouter(
  [
    {
      path: '/',
      element: <Suspend><RootRedirect /></Suspend>,
    },
    {
      path: '/landing',
      element: <Suspend><LandingPage /></Suspend>,
    },
    {
      path: '/login',
      element: <Suspend><LoginPage /></Suspend>,
    },
    {
      path: '/register',
      element: <Suspend><RegisterPage /></Suspend>,
    },
    {
      path: '/dashboard',
      element: <Suspend><ProtectedRoute><DashboardRedirect /></ProtectedRoute></Suspend>,
    },
    {
      element: (
        <Suspend>
          <ProtectedRoute>
            <AppShell />
          </ProtectedRoute>
        </Suspend>
      ),
      children: [
      { path: '/profile', element: <Suspend><ProfilePage /></Suspend> },
      { path: '/settings', element: <Suspend><SettingsPage /></Suspend> },
      { path: '/notifications', element: <Suspend><NotificationsPage /></Suspend> },

      // Coach routes
      { path: '/coach', element: <ProtectedRoute allowedRoles={['coach', 'analyst', 'admin']}><Suspend><CommandCenterPage /></Suspend></ProtectedRoute> },
      { path: '/coach/teams', element: <ProtectedRoute allowedRoles={['coach', 'analyst', 'admin']}><Suspend><TeamsPage /></Suspend></ProtectedRoute> },
      { path: '/coach/teams/:teamId', element: <ProtectedRoute allowedRoles={['coach', 'analyst', 'admin']}><Suspend><TeamDetailPage /></Suspend></ProtectedRoute> },
      { path: '/coach/players', element: <ProtectedRoute allowedRoles={['coach', 'analyst', 'admin']}><Suspend><PlayersPage /></Suspend></ProtectedRoute> },
      { path: '/coach/players/:playerId', element: <ProtectedRoute allowedRoles={['coach', 'analyst', 'admin']}><Suspend><PlayerDetailPage /></Suspend></ProtectedRoute> },
      { path: '/coach/calendar', element: <ProtectedRoute allowedRoles={['coach', 'analyst', 'admin']}><Suspend><CalendarPage /></Suspend></ProtectedRoute> },
      { path: '/coach/sessions', element: <ProtectedRoute allowedRoles={['coach', 'admin']}><Suspend><SessionsListPage /></Suspend></ProtectedRoute> },
      { path: '/coach/sessions/new', element: <ProtectedRoute allowedRoles={['coach', 'admin']}><Suspend><SessionNewPage /></Suspend></ProtectedRoute> },
      { path: '/coach/sessions/:sessionId', element: <ProtectedRoute allowedRoles={['coach', 'admin']}><Suspend><SessionDetailPage /></Suspend></ProtectedRoute> },
      { path: '/coach/exercises', element: <ProtectedRoute allowedRoles={['coach', 'analyst', 'admin']}><Suspend><ExercisesPage /></Suspend></ProtectedRoute> },
      { path: '/coach/attendance', element: <ProtectedRoute allowedRoles={['coach', 'admin']}><Suspend><AttendancePage /></Suspend></ProtectedRoute> },
      { path: '/coach/assessments', element: <ProtectedRoute allowedRoles={['coach', 'analyst', 'admin']}><Suspend><AssessmentsPage /></Suspend></ProtectedRoute> },
      { path: '/coach/matches', element: <ProtectedRoute allowedRoles={['coach', 'analyst', 'admin']}><Suspend><MatchesPage /></Suspend></ProtectedRoute> },
      { path: '/coach/matches/:matchId', element: <ProtectedRoute allowedRoles={['coach', 'analyst', 'admin']}><Suspend><MatchDetailPage /></Suspend></ProtectedRoute> },
      { path: '/coach/analytics', element: <ProtectedRoute allowedRoles={['coach', 'analyst', 'admin']}><Suspend><CoachAnalyticsPage /></Suspend></ProtectedRoute> },
      { path: '/coach/ai', element: <ProtectedRoute allowedRoles={['coach', 'admin']}><Suspend><AiAssistantPage /></Suspend></ProtectedRoute> },

      // Admin routes
      { path: '/admin', element: <ProtectedRoute allowedRoles={['admin']}><Navigate to={ROUTES.ADMIN_CLUB} replace /></ProtectedRoute> },
      { path: '/admin/club', element: <ProtectedRoute allowedRoles={['admin']}><Suspend><ClubPage /></Suspend></ProtectedRoute> },
      { path: '/admin/coaches', element: <ProtectedRoute allowedRoles={['admin']}><Suspend><CoachesPage /></Suspend></ProtectedRoute> },
      { path: '/admin/analytics', element: <ProtectedRoute allowedRoles={['admin']}><Suspend><AdminAnalyticsPage /></Suspend></ProtectedRoute> },

      // Player routes
      { path: '/me/schedule', element: <ProtectedRoute allowedRoles={['player']}><Suspend><PlayerSchedulePage /></Suspend></ProtectedRoute> },
      { path: '/me/progress', element: <ProtectedRoute allowedRoles={['player']}><Suspend><PlayerProgressPage /></Suspend></ProtectedRoute> },
      { path: '/me/goals', element: <ProtectedRoute allowedRoles={['player']}><Suspend><PlayerGoalsPage /></Suspend></ProtectedRoute> },
      { path: '/me/reports', element: <ProtectedRoute allowedRoles={['player']}><Suspend><PlayerReportsPage /></Suspend></ProtectedRoute> },
      { path: '/me/matches', element: <ProtectedRoute allowedRoles={['player']}><Suspend><PlayerMatchesPage /></Suspend></ProtectedRoute> },
      { path: '/me/matches/:matchId', element: <ProtectedRoute allowedRoles={['player']}><Suspend><PlayerMatchDetailPage /></Suspend></ProtectedRoute> },

      // Parent routes
      { path: '/parent/overview', element: <ProtectedRoute allowedRoles={['parent']}><Suspend><ParentOverviewPage /></Suspend></ProtectedRoute> },
      { path: '/parent/schedule', element: <ProtectedRoute allowedRoles={['parent']}><Suspend><ParentSchedulePage /></Suspend></ProtectedRoute> },
      { path: '/parent/attendance', element: <ProtectedRoute allowedRoles={['parent']}><Suspend><ParentAttendancePage /></Suspend></ProtectedRoute> },
      { path: '/parent/progress', element: <ProtectedRoute allowedRoles={['parent']}><Suspend><ParentProgressPage /></Suspend></ProtectedRoute> },
      { path: '/parent/enter-code', element: <ProtectedRoute allowedRoles={['parent']}><Suspend><ParentEnterCodePage /></Suspend></ProtectedRoute> },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
  ],
)
