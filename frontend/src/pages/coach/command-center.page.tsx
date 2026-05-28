import * as React from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Calendar, Users, AlertTriangle, Bell, TrendingDown, ShieldCheck, Clock } from 'lucide-react'
import { format } from 'date-fns'
import { ru, enUS } from 'date-fns/locale'
import { analyticsApi } from '@/shared/api/analytics.api'
import { queryKeys } from '@/shared/api/query-keys'
import { PageHeader, StatCard, Card, CardContent, CardHeader, CardTitle, Badge, Avatar, AvatarFallback, Progress, Skeleton } from '@/shared/ui'
import { SessionCard } from '@/entities/session/session-card'
import { getInitials, getDevIndexColor, getDevIndexLabel } from '@/shared/lib/utils'
import { cn } from '@/shared/lib/utils'



export function CommandCenterPage() {
  const { t, i18n } = useTranslation()
  const dateLocale = i18n.language.startsWith('ru') ? ru : enUS

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.analytics.coachDashboard(),
    queryFn: analyticsApi.getCoachDashboard,
  })

  const todayLabel = format(new Date(), 'PPPP', { locale: dateLocale })

  const cc = 'coach.commandCenter' as const

  return (
    <div className="space-y-8">
      <PageHeader
        title={t(`${cc}.title`)}
        description={todayLabel}
      />

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title={t(`${cc}.todaySessions`)}
          value={isLoading ? '—' : (data?.todaysSessions?.length ?? 0)}
          icon={Calendar}
          loading={isLoading}
          description={t(`${cc}.todaySessionsDesc`)}
          trend={{ value: 0, direction: 'neutral' }}
        />
        <StatCard
          title={t(`${cc}.playersPresent`)}
          value={isLoading ? '—' : (data?.teamStats?.reduce((a, x) => a + x.playerCount, 0) ?? 0)}
          icon={Users}
          loading={isLoading}
          description={t(`${cc}.playersPresentDesc`)}
        />
        <StatCard
          title={t(`${cc}.atRisk`)}
          value={isLoading ? '—' : (data?.playersAtRisk?.length ?? 0)}
          icon={AlertTriangle}
          loading={isLoading}
          description={t(`${cc}.atRiskDesc`)}
          trend={data?.playersAtRisk?.length ? { value: 0, direction: 'down' } : undefined}
          iconClassName="bg-red-100 dark:bg-red-950"
        />
        <StatCard
          title={t(`${cc}.absentToday`)}
          value={isLoading ? '—' : (data?.absentToday?.length ?? 0)}
          icon={Bell}
          loading={isLoading}
          description={t(`${cc}.absentTodayDesc`)}
        />
      </div>

      {/* Two column: Sessions + Absent */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div>
          <Card className="h-full">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Calendar className="h-5 w-5 text-primary" />
                </div>
                <CardTitle className="text-lg">{t(`${cc}.todaysSessionsCard`)}</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}
                </div>
              ) : data?.todaysSessions?.length ? (
                <div className="space-y-3">
                  {data.todaysSessions.map((s) => (
                    <SessionCard key={s.id} session={s} compact />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                    <ShieldCheck className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <p className="mt-3 text-base text-muted-foreground">{t(`${cc}.noSessionsToday`)}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div>
          <Card className="h-full">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100 dark:bg-red-950">
                  <Bell className="h-5 w-5 text-red-600 dark:text-red-400" />
                </div>
                <CardTitle className="text-lg">{t(`${cc}.absentCard`)}</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full rounded-xl" />)}
                </div>
              ) : data?.absentToday?.length ? (
                <div className="space-y-2">
                  {data.absentToday.map((p) => (
                    <div
                      key={p.id}
                      className="group flex items-center gap-3 rounded-xl border border-red-200/50 bg-red-50/50 px-4 py-3 transition-all duration-200 hover:border-red-300 hover:bg-red-50 dark:border-red-950 dark:bg-red-950/20 dark:hover:bg-red-950/30"
                    >
                      <Avatar className="h-10 w-10 ring-2 ring-red-100 dark:ring-red-950">
                        <AvatarFallback className="text-sm bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300">
                          {getInitials(p.firstName, p.lastName)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-base font-medium">{p.firstName} {p.lastName}</span>
                      <Badge variant="destructive" className="ml-auto shadow-sm">
                        {t(`${cc}.absentBadge`)}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950">
                    <ShieldCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <p className="mt-3 text-base font-medium text-emerald-600 dark:text-emerald-400">{t(`${cc}.everyonePresent`)}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Two column: At Risk + Upcoming */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div>
          <Card className="h-full">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100 dark:bg-orange-950">
                  <AlertTriangle className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                </div>
                <CardTitle className="text-lg">{t(`${cc}.playersAtRisk`)}</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}
                </div>
              ) : data?.playersAtRisk?.length ? (
                <div className="space-y-3">
                  {data.playersAtRisk.map(({ player, attendanceRate, devIndexTrend, lastAssessmentDays }) => (
                    <div
                      key={player.id}
                      className="rounded-xl border p-4 transition-all duration-200 hover:border-orange-200 hover:shadow-md dark:hover:border-orange-950"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-11 w-11">
                          <AvatarFallback className="text-sm">{getInitials(player.firstName, player.lastName)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-base font-medium truncate">{player.firstName} {player.lastName}</p>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                            <span className="text-sm text-muted-foreground">
                              {t(`${cc}.attendanceLabel`)}: <span className={cn('font-medium', attendanceRate < 60 ? 'text-red-500' : attendanceRate < 80 ? 'text-yellow-600' : 'text-emerald-600')}>
                                {Math.round(attendanceRate)}%
                              </span>
                            </span>
                            {devIndexTrend === 'falling' && (
                              <span className="flex items-center gap-0.5 text-sm text-red-500">
                                <TrendingDown className="h-4 w-4" />{t(`${cc}.declining`)}
                              </span>
                            )}
                            {lastAssessmentDays > 30 && (
                              <span className="flex items-center gap-0.5 text-sm text-orange-500">
                                <Clock className="h-4 w-4" />
                                {t(`${cc}.noAssessmentIn`, { days: lastAssessmentDays })}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <Progress value={attendanceRate} className="mt-3 h-2" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950">
                    <ShieldCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <p className="mt-3 text-base font-medium text-emerald-600 dark:text-emerald-400">{t(`${cc}.noPlayersAtRisk`)}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div>
          <Card className="h-full">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-950">
                  <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <CardTitle className="text-lg">{t(`${cc}.upcomingSessions`)}</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => <Skeleton key={i} className="h-14 w-full rounded-xl" />)}
                </div>
              ) : data?.upcomingSessions?.length ? (
                <div className="space-y-2">
                  {data.upcomingSessions.slice(0, 5).map((s) => (
                    <SessionCard key={s.id} session={s} compact />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                    <Clock className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <p className="mt-3 text-base text-muted-foreground">{t(`${cc}.noUpcoming`)}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Team Overview */}
      {data?.teamStats && data.teamStats.length > 0 && (
        <div>
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-100 dark:bg-indigo-950">
                  <Users className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <CardTitle className="text-lg">{t(`${cc}.teamOverview`)}</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {data.teamStats.map((stat) => (
                  <div
                    key={stat.teamID}
                    className="rounded-xl border p-5 transition-all duration-200 hover:shadow-md hover:border-border/80"
                  >
                    <h4 className="text-lg font-semibold truncate">{stat.teamName}</h4>
                    <div className="mt-4 space-y-3">
                      <div className="flex justify-between items-center text-base">
                        <span className="text-muted-foreground">{t(`${cc}.players`)}</span>
                        <span className="font-medium tabular-nums">{stat.playerCount}</span>
                      </div>
                      <div className="flex justify-between items-center text-base">
                        <span className="text-muted-foreground">{t(`${cc}.avgAttendance`)}</span>
                        <span className={cn(
                          'font-medium tabular-nums',
                          stat.avgAttendance >= 80 ? 'text-emerald-600 dark:text-emerald-400' :
                          stat.avgAttendance >= 60 ? 'text-yellow-600 dark:text-yellow-400' :
                          'text-red-500 dark:text-red-400'
                        )}>
                          {Math.round(stat.avgAttendance)}%
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-base">
                        <span className="text-muted-foreground">{t(`${cc}.avgDevIndex`)}</span>
                        <div className="text-right">
                          <span className={cn('font-medium tabular-nums', getDevIndexColor(stat.avgDevIndex))}>
                            {Math.round(stat.avgDevIndex)}
                          </span>
                          <p className="text-xs text-muted-foreground">{getDevIndexLabel(stat.avgDevIndex)}</p>
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className={cn(
                          'h-full rounded-full transition-all duration-500',
                          stat.avgAttendance >= 80 ? 'bg-emerald-500' :
                          stat.avgAttendance >= 60 ? 'bg-yellow-500' :
                          'bg-red-500'
                        )}
                        style={{ width: `${Math.min(stat.avgAttendance, 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
