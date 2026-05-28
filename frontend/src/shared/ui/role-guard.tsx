import * as React from 'react'
import type { Role } from '../types'
import { useAuthStore } from '@/app/store/auth.store'

interface RoleGuardProps {
  roles: Role[]
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function RoleGuard({ roles, children, fallback = null }: RoleGuardProps) {
  const user = useAuthStore((s) => s.user)
  if (!user || !roles.includes(user.role)) return <>{fallback}</>
  return <>{children}</>
}
