import * as React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuthStore } from '@/app/store/auth.store'
import { ROLE_DEFAULT_ROUTES } from '@/shared/config/roles'

export function DashboardPage() {
  const user = useAuthStore((s) => s.user)
  if (!user) return <Navigate to="/login" replace />
  return <Navigate to={ROLE_DEFAULT_ROUTES[user.role]} replace />
}
