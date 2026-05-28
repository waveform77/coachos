import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { TrendingUp, Calendar, CheckSquare, Bell, User } from 'lucide-react'
import { notificationsApi } from '@/shared/api/notifications.api'
import { sessionsApi } from '@/shared/api/sessions.api'
import { parentsApi } from '@/shared/api/parents.api'
import { analyticsApi } from '@/shared/api/analytics.api'
import { queryKeys } from '@/shared/api/query-keys'
import {
  PageHeader, Card, CardContent, CardHeader, CardTitle, Badge, Progress, StatCard, Avatar, AvatarFallback, AvatarImage,
} from '@/shared/ui'
import { formatRelativeTime, getDevIndexColor, getDevIndexLabel, getInitials } from '@/shared/lib/utils'
import { SessionCard } from '@/entities/session/session-card'

export function ParentOverviewPage() {
  const { t } = useTranslation()

  const { data: children = [] } = useQuery({
    queryKey: queryKeys.parent.children(),
    queryFn: parentsApi.listChildren,
  })

  const [selectedChildId, setSelectedChildId] = React.useState('')
  React.useEffect(() => {
    if (children.length && !selectedChildId) {
      setSelectedChildId(children[0].id)
    }
  }, [children, selectedChildId])

  const selectedChild = children.find((c) => c.id === selectedChildId)

  const { data: analytics } = useQuery({
    queryKey: queryKeys.analytics.player(selectedChildId),
    queryFn: () => analyticsApi.getPlayerAnalytics(selectedChildId),
    enabled: !!selectedChildId,
  })

  const { data: sessions } = useQuery({
    queryKey: queryKeys.sessions.all({ limit: 5 }),
    queryFn: () => sessionsApi.listSessions({ limit: 5 }),
  })

  const { data: notifs } = useQuery({
    queryKey: queryKeys.notifications.all({}),
    queryFn: () => notificationsApi.getNotifications({ limit: 5 }),
  })

  const attendanceHistory = analytics?.attendanceHistory ?? []
  const totalSessions = attendanceHistory.length
  const presentSessions = attendanceHistory.filter((a) => a.status === 'present').length
  const attendanceRate = totalSessions > 0 ? Math.round((presentSessions / totalSessions) * 100) : 0
  const latestAssessment = analytics?.assessmentHistory?.[0]
  const devIndex = selectedChild?.devIndex ?? 0

  return (
    <div className="space-y-6">
      <PageHeader title={t('parent.title')} description={t('parent.overview')} />

      {/* Child selector */}
      {children.length > 1 && (
        <div className="flex flex-wrap gap-3">
          {children.map((child) => (
            <button
              key={child.id}
              onClick={() => setSelectedChildId(child.id)}
              className={`flex items-center gap-3 rounded-xl border px-4 py-3 transition-all ${
                selectedChildId === child.id
                  ? 'border-primary bg-primary/5 shadow-sm'
                  : 'border-border hover:bg-accent'
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

      {/* Child profile card + stats */}
      {selectedChild && (
        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-1">
            <CardContent className="p-6 flex flex-col items-center text-center gap-3">
              <Avatar className="h-20 w-20">
                {selectedChild.photoURL && <AvatarImage src={selectedChild.photoURL} alt={selectedChild.firstName} />}
                <AvatarFallback className="bg-primary/10 text-primary text-2xl font-bold">
                  {getInitials(selectedChild.firstName, selectedChild.lastName)}
                </AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-xl font-bold">{selectedChild.firstName} {selectedChild.lastName}</h2>
                <div className="mt-2 flex flex-wrap justify-center gap-2">
                  <Badge variant="outline">{t('players.devIndex')} {devIndex}</Badge>
                  {selectedChild.position && (
                    <Badge variant="secondary">{t(`commonEnums.position.${selectedChild.position}`)}</Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="lg:col-span-2 grid gap-4 sm:grid-cols-2">
            <StatCard
              title={t('parent.devIndex')}
              value={devIndex}
              icon={TrendingUp}
              description={getDevIndexLabel(devIndex)}
            />
            <StatCard
              title={t('parent.attendance')}
              value={`${attendanceRate}%`}
              icon={CheckSquare}
              description={`${presentSessions} из ${totalSessions} тренировок`}
            />
            <StatCard
              title={t('common.notifications')}
              value={notifs?.unreadCount ?? 0}
              icon={Bell}
              description={t('notifications.unread')}
            />
            <StatCard
              title={t('parent.schedule')}
              value={sessions?.data?.length ?? 0}
              icon={Calendar}
              description={t('parent.upcomingSessions')}
            />
          </div>
        </div>
      )}

      {/* Latest assessment summary */}
      {latestAssessment && (
        <Card>
          <CardHeader><CardTitle className="text-lg">{t('parent.latestAssessment')}</CardTitle></CardHeader>
          <CardContent className="space-y-4 max-w-xl">
            {(['technical', 'physical', 'tactical', 'discipline', 'teamwork'] as const).map((skill) => (
              <div key={skill}>
                <div className="flex justify-between text-base mb-1">
                  <span>{t(`assessments.${skill}`)}</span>
                  <span className="font-medium">{latestAssessment[skill]}/10</span>
                </div>
                <Progress value={latestAssessment[skill] * 10} className="h-3" />
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-lg">{t('parent.upcomingSessions')}</CardTitle></CardHeader>
          <CardContent>
            {sessions?.data?.length ? (
              <div className="space-y-3">
                {sessions.data.map((s) => <SessionCard key={s.id} session={s} compact />)}
              </div>
            ) : (
              <p className="text-base text-muted-foreground text-center py-8">{t('common.noData')}</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-lg">{t('common.notifications')}</CardTitle></CardHeader>
          <CardContent>
            {notifs?.data?.length ? (
              <div className="space-y-3">
                {notifs.data.map((n) => (
                  <div key={n.id} className={`rounded-lg border p-4 ${!n.readAt ? 'bg-primary/5 border-primary/20' : ''}`}>
                    <p className="text-base font-medium">{n.title}</p>
                    {n.body && <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{n.body}</p>}
                    <p className="mt-1 text-sm text-muted-foreground">{formatRelativeTime(n.createdAt)}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-base text-muted-foreground text-center py-8">{t('notifications.noNotifications')}</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
