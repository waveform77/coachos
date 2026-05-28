import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import { Calendar, MapPin, Clock } from 'lucide-react'
import { sessionsApi } from '@/shared/api/sessions.api'
import { queryKeys } from '@/shared/api/query-keys'
import { useAuthStore } from '@/app/store/auth.store'
import { PageHeader, Card, CardContent, Skeleton, Badge } from '@/shared/ui'
import { EmptyState } from '@/shared/ui/empty-state'
import { formatDateTime, capitalize } from '@/shared/lib/utils'
import type { TrainingSession } from '@/shared/types'

function sortBySchedule(a: TrainingSession, b: TrainingSession) {
  return new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()
}

export function PlayerSchedulePage() {
  const { t } = useTranslation()
  const { user } = useAuthStore()
  const {
    data: sessions,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: queryKeys.sessions.all({ scope: 'player', userId: user?.id ?? '' }),
    queryFn: () => sessionsApi.listSessions({ limit: 100, page: 1 }),
    enabled: !!user?.id,
  })

  const rows = React.useMemo(() => {
    const list = sessions?.data ?? []
    return [...list].sort(sortBySchedule)
  }, [sessions?.data])

  const events = React.useMemo(
    () =>
      rows.map((s) => ({
        id: s.id,
        title: `${t('sessions.title')}${s.location ? ` @ ${s.location}` : ''}`,
        start: s.scheduledAt,
        color: '#10b981',
      })),
    [rows, t],
  )

  if (!user?.id) {
    return (
      <div className="space-y-6">
        <PageHeader title={t('playerPortal.schedule')} description={t('playerPortal.upcoming')} />
        <EmptyState icon={Calendar} title={t('common.noData')} description={t('auth.signInSubtitle')} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader title={t('playerPortal.schedule')} description={t('playerPortal.upcoming')} />

      {isError ? (
        <EmptyState
          icon={Calendar}
          title={t('common.error')}
          description={error instanceof Error ? error.message : t('playerPortal.scheduleLoadError')}
          action={{ label: t('common.retry'), onClick: () => void refetch() }}
        />
      ) : isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-20 w-full rounded-lg" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <EmptyState icon={Calendar} title={t('playerPortal.scheduleEmpty')} description={t('playerPortal.scheduleEmptyHint')} />
      ) : (
        <>
          <div className="space-y-3">
            <h2 className="text-sm font-medium text-muted-foreground">{t('playerPortal.upcomingList')}</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {rows.slice(0, 12).map((s) => (
                <Card key={s.id}>
                  <CardContent className="flex flex-col gap-2 p-4">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-semibold leading-tight">{formatDateTime(s.scheduledAt)}</p>
                      <Badge variant="secondary" className="shrink-0 text-xs">
                        {capitalize(t(`sessions.${s.status === 'in_progress' ? 'inProgress' : s.status}`))}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4 shrink-0" />
                      {s.durationMin != null ? `${s.durationMin} ${t('common.min')}` : '—'}
                    </div>
                    {s.location ? (
                      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <MapPin className="h-4 w-4 shrink-0" />
                        <span className="truncate">{s.location}</span>
                      </div>
                    ) : null}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <Card>
            <CardContent className="p-4">
              <h2 className="mb-3 text-sm font-medium text-muted-foreground">{t('playerPortal.calendarMonth')}</h2>
              <div className="fc-app-schedule min-h-[520px] overflow-hidden rounded-md border border-border bg-card">
                <FullCalendar
                  plugins={[dayGridPlugin, timeGridPlugin]}
                  initialView="dayGridMonth"
                  headerToolbar={{ left: 'prev,next today', center: 'title', right: 'dayGridMonth,timeGridWeek' }}
                  events={events}
                  height={520}
                  eventDisplay="block"
                />
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
