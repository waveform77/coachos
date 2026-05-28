import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { Calendar, ClipboardCheck, CheckCircle2, XCircle, AlertCircle, Clock, Stethoscope } from 'lucide-react'
import { analyticsApi } from '@/shared/api/analytics.api'
import { parentsApi } from '@/shared/api/parents.api'
import { queryKeys } from '@/shared/api/query-keys'
import {
  PageHeader, Card, CardContent, CardHeader, CardTitle, Progress, Badge, Skeleton, Avatar, AvatarFallback, AvatarImage,
} from '@/shared/ui'
import { EmptyState } from '@/shared/ui/empty-state'
import { formatDateTime, getInitials } from '@/shared/lib/utils'
import type { AttendanceRecord, AttendanceStatus } from '@/shared/types'

const STATUS_CONFIG: Record<AttendanceStatus, { label: string; icon: typeof CheckCircle2; color: string; bg: string }> = {
  present: { label: 'Присутствовал', icon: CheckCircle2, color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
  absent: { label: 'Отсутствовал', icon: XCircle, color: 'text-red-700', bg: 'bg-red-50 border-red-200' },
  late: { label: 'Опоздал', icon: Clock, color: 'text-yellow-700', bg: 'bg-yellow-50 border-yellow-200' },
  excused: { label: 'Уважительная', icon: AlertCircle, color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200' },
  injured: { label: 'Травма', icon: Stethoscope, color: 'text-orange-700', bg: 'bg-orange-50 border-orange-200' },
}

export function ParentAttendancePage() {
  const { t } = useTranslation()
  const { data: children = [], isLoading: childrenLoading } = useQuery({
    queryKey: queryKeys.parent.children(),
    queryFn: parentsApi.listChildren,
  })

  const [playerId, setPlayerId] = React.useState('')
  React.useEffect(() => {
    if (!children.length) return
    if (!playerId || !children.some((c) => c.id === playerId)) {
      setPlayerId(children[0].id)
    }
  }, [children, playerId])

  const { data: analytics, isLoading: analyticsLoading } = useQuery({
    queryKey: queryKeys.analytics.player(playerId),
    queryFn: () => analyticsApi.getPlayerAnalytics(playerId),
    enabled: !!playerId,
  })

  const history = analytics?.attendanceHistory ?? []
  const totalSessions = history.length
  const presentSessions = history.filter((a) => a.status === 'present').length
  const attendanceRate = totalSessions > 0 ? Math.round((presentSessions / totalSessions) * 100) : 0

  return (
    <div className="space-y-6">
      <PageHeader title={t('parent.attendance')} description={t('attendance.title')} />

      {children.length > 1 && (
        <div className="flex flex-wrap gap-3">
          {children.map((child) => (
            <button
              key={child.id}
              onClick={() => setPlayerId(child.id)}
              className={`flex items-center gap-3 rounded-xl border px-4 py-3 transition-all ${
                playerId === child.id ? 'border-primary bg-primary/5 shadow-sm' : 'border-border hover:bg-accent'
              }`}
            >
              <Avatar className="h-10 w-10">
                {child.photoURL && <AvatarImage src={child.photoURL} alt={child.firstName} />}
                <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                  {getInitials(child.firstName, child.lastName)}
                </AvatarFallback>
              </Avatar>
              <span className="font-medium">{child.firstName} {child.lastName}</span>
            </button>
          ))}
        </div>
      )}

      {childrenLoading ? (
        <Skeleton className="h-48 w-full rounded-lg" />
      ) : !children.length ? (
        <Card>
          <CardContent>
            <EmptyState icon={ClipboardCheck} title={t('parent.attendance')} description={t('common.noData')} />
          </CardContent>
        </Card>
      ) : analyticsLoading ? (
        <Skeleton className="h-64 w-full rounded-lg" />
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t('parent.attendanceRate')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-w-md mx-auto text-center">
                <span className={`text-5xl font-bold ${attendanceRate >= 80 ? 'text-emerald-600' : attendanceRate >= 60 ? 'text-yellow-600' : 'text-red-500'}`}>
                  {attendanceRate}%
                </span>
                <Progress value={attendanceRate} className="h-4" />
                <p className="text-base text-muted-foreground">
                  {presentSessions} {t('attendance.present')} {t('common.outOf')} {totalSessions} {t('sessions.title')}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t('playerDetail.attendanceHistory')}</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {history.length ? (
                <div className="space-y-3">
                  {history.map((r) => {
                    const cfg = STATUS_CONFIG[r.status]
                    const Icon = cfg.icon
                    return (
                      <div key={r.id} className={`flex items-center gap-4 rounded-xl border p-4 ${cfg.bg}`}>
                        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/80`}>
                          <Icon className={`h-5 w-5 ${cfg.color}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-base font-medium">{formatDateTime(r.markedAt)}</p>
                          {r.reason && <p className="text-sm text-muted-foreground">{r.reason}</p>}
                        </div>
                        <Badge variant="outline" className={`${cfg.color} border-current`}>
                          {t(`commonEnums.attendanceStatus.${r.status}`)}
                        </Badge>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8 text-base">{t('common.noData')}</p>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
