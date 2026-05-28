import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { Target, CheckCircle2, PauseCircle, XCircle } from 'lucide-react'
import { analyticsApi } from '@/shared/api/analytics.api'
import { authApi } from '@/shared/api/auth.api'
import { queryKeys } from '@/shared/api/query-keys'
import { PageHeader, Card, CardContent, Badge, Progress } from '@/shared/ui'
import { EmptyState } from '@/shared/ui/empty-state'
import { formatDate } from '@/shared/lib/utils'
import type { GoalStatus } from '@/shared/types'

const STATUS_ICON: Record<GoalStatus, typeof CheckCircle2> = {
  active: Target,
  achieved: CheckCircle2,
  paused: PauseCircle,
  cancelled: XCircle,
}

const STATUS_COLOR: Record<GoalStatus, string> = {
  active: 'bg-blue-100 text-blue-800',
  achieved: 'bg-emerald-100 text-emerald-800',
  paused: 'bg-yellow-100 text-yellow-800',
  cancelled: 'bg-slate-100 text-slate-800',
}

export function PlayerGoalsPage() {
  const { t } = useTranslation()
  const { data: me } = useQuery({ queryKey: queryKeys.auth.me(), queryFn: authApi.getMe })

  const { data: analytics } = useQuery({
    queryKey: queryKeys.analytics.player(me?.id ?? ''),
    queryFn: () => analyticsApi.getPlayerAnalytics(me!.id),
    enabled: !!me?.id,
  })

  const goals = analytics?.goalsProgress ?? []

  return (
    <div className="space-y-6">
      <PageHeader title={t('playerPortal.myGoals')} description={t('commonEnums.goalStatus.active')} />

      {goals.length > 0 ? (
        <div className="space-y-4">
          {goals.map((g) => {
            const StatusIcon = STATUS_ICON[g.status]
            return (
              <Card key={g.id}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${STATUS_COLOR[g.status]}`}>
                        <StatusIcon className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-semibold text-lg">{g.title}</p>
                        {g.description && <p className="text-base text-muted-foreground">{g.description}</p>}
                        {g.deadline && <p className="text-sm text-muted-foreground">{t('common.date')}: {formatDate(g.deadline)}</p>}
                      </div>
                    </div>
                    <Badge className={`shrink-0 ${STATUS_COLOR[g.status]}`}>
                      {t(`commonEnums.goalStatus.${g.status}`)}
                    </Badge>
                  </div>
                  <div className="mt-4">
                    <div className="flex justify-between text-base mb-1.5">
                      <span className="text-muted-foreground">{t('common.progress')}</span>
                      <span className="font-medium">{g.progressPct}%</span>
                    </div>
                    <Progress value={g.progressPct} className="h-4" />
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : (
        <EmptyState icon={Target} title={t('common.noData')} description={t('playerPortal.activeGoals')} />
      )}
    </div>
  )
}
