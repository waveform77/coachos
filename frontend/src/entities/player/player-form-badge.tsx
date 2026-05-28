import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { analyticsApi } from '@/shared/api/analytics.api'
import { Badge, Skeleton } from '@/shared/ui'

interface PlayerFormBadgeProps {
  playerId: string
  size?: 'sm' | 'md'
}

const FORM_COLORS: Record<string, string> = {
  excellent: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  rising: 'bg-blue-100 text-blue-800 border-blue-200',
  stable: 'bg-slate-100 text-slate-800 border-slate-200',
  falling: 'bg-orange-100 text-orange-800 border-orange-200',
  rusty: 'bg-gray-100 text-gray-800 border-gray-200',
}

export function PlayerFormBadge({ playerId, size = 'sm' }: PlayerFormBadgeProps) {
  const { t } = useTranslation()
  const { data, isLoading } = useQuery({
    queryKey: ['analytics', 'player', playerId, 'form'],
    queryFn: () => analyticsApi.getPlayerForm(playerId),
    enabled: !!playerId,
    staleTime: 5 * 60 * 1000,
  })

  if (isLoading) {
    return <Skeleton className={size === 'sm' ? 'h-6 w-20' : 'h-7 w-24'} />
  }

  if (!data) return null

  const colorClass = FORM_COLORS[data.form] ?? FORM_COLORS.stable

  const trendIcon = data.form === 'excellent' || data.form === 'rising'
    ? <TrendingUp className="h-3 w-3" />
    : data.form === 'falling' || data.form === 'rusty'
      ? <TrendingDown className="h-3 w-3" />
      : <Minus className="h-3 w-3" />

  return (
    <Badge variant="outline" className={`gap-1 font-medium ${colorClass} ${size === 'md' ? 'text-base px-3 py-1' : ''}`}>
      {trendIcon}
      <span>{t(data.label)}</span>
    </Badge>
  )
}
