import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { Plus, Filter } from 'lucide-react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import type { EventClickArg } from '@fullcalendar/core'
import { sessionsApi } from '@/shared/api/sessions.api'
import { matchesApi } from '@/shared/api/matches.api'
import { analyticsApi } from '@/shared/api/analytics.api'
import { teamsApi } from '@/shared/api/teams.api'
import { queryKeys } from '@/shared/api/query-keys'
import { useAuthStore } from '@/app/store/auth.store'
import {
  Button, PageHeader, Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
  Sheet, SheetContent, SheetHeader, SheetTitle, Badge,
} from '@/shared/ui'
import { SessionForm } from '@/features/sessions/session-form'
import { toast } from 'sonner'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { formatDate, formatDateTime, getStatusColor, capitalize, getDevIndexColor } from '@/shared/lib/utils'

export function CalendarPage() {
  const { t } = useTranslation()
  const { user } = useAuthStore()
  const qc = useQueryClient()
  const [teamFilter, setTeamFilter] = React.useState<string>('all')
  const [createOpen, setCreateOpen] = React.useState(false)
  const [selectedEvent, setSelectedEvent] = React.useState<{ type: 'session' | 'match'; id: string } | null>(null)

  const { data: sessionDetail } = useQuery({
    queryKey: queryKeys.sessions.detail(selectedEvent?.id ?? ''),
    queryFn: () => sessionsApi.getSession(selectedEvent!.id),
    enabled: selectedEvent?.type === 'session',
  })

  const { data: matchDetail } = useQuery({
    queryKey: queryKeys.matches.detail(selectedEvent?.id ?? ''),
    queryFn: () => matchesApi.getMatch(selectedEvent!.id),
    enabled: selectedEvent?.type === 'match',
  })

  const { data: teams } = useQuery({
    queryKey: queryKeys.teams.all({ clubId: user?.clubId }),
    queryFn: () => teamsApi.listTeams({ clubId: user?.clubId }),
  })

  const { data: sessions } = useQuery({
    queryKey: queryKeys.sessions.all({ teamId: teamFilter !== 'all' ? teamFilter : undefined }),
    queryFn: () => sessionsApi.listSessions({ teamId: teamFilter !== 'all' ? teamFilter : undefined }),
  })

  const { data: matches } = useQuery({
    queryKey: queryKeys.matches.all({ teamId: teamFilter !== 'all' ? teamFilter : undefined }),
    queryFn: () => matchesApi.listMatches({ teamId: teamFilter !== 'all' ? teamFilter : undefined }),
  })

  const { mutate: createSession, isPending } = useMutation({
    mutationFn: sessionsApi.createSession,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.sessions.all() })
      toast.success(t('common.success'))
      setCreateOpen(false)
    },
    onError: () => toast.error(t('common.error')),
  })

  const events = [
    ...(sessions?.data ?? []).map((s) => ({
      id: `session-${s.id}`,
      title: `⚽ ${t('calendar.sessions')}${s.location ? ` @ ${s.location}` : ''}`,
      start: s.scheduledAt,
      end: s.durationMin ? new Date(new Date(s.scheduledAt).getTime() + s.durationMin * 60000).toISOString() : undefined,
      color: '#10b981',
      extendedProps: { type: 'session', sessionId: s.id },
    })),
    ...(matches?.data ?? []).map((m) => ({
      id: `match-${m.id}`,
      title: `🏆 vs ${m.opponent}`,
      start: m.kickoffAt,
      color: '#f97316',
      extendedProps: { type: 'match', matchId: m.id },
    })),
  ]

  const handleEventClick = (arg: EventClickArg) => {
    const { type, sessionId, matchId } = arg.event.extendedProps
    if (type === 'session') setSelectedEvent({ type: 'session', id: sessionId })
    if (type === 'match') setSelectedEvent({ type: 'match', id: matchId })
  }

  const teamsList = teams?.data?.map((t) => ({ id: t.id, name: t.name })) ?? []

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('calendar.title')}
        description={`${t('calendar.sessions')} & ${t('calendar.matches')}`}
        actions={
          <div className="flex items-center gap-2">
            <Select value={teamFilter} onValueChange={setTeamFilter}>
              <SelectTrigger className="w-44">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder={t('common.all')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('common.all')}</SelectItem>
                {teamsList.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2"><Plus className="h-4 w-4" />{t('calendar.addSession')}</Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader><DialogTitle>{t('calendar.addSession')}</DialogTitle></DialogHeader>
                <SessionForm
                  teams={teamsList}
                  loading={isPending}
                  onSubmit={async (v) => createSession(v as Parameters<typeof sessionsApi.createSession>[0])}
                />
              </DialogContent>
            </Dialog>
          </div>
        }
      />

      <div className="rounded-lg border bg-card p-4">
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          headerToolbar={{ left: 'prev,next today', center: 'title', right: 'dayGridMonth,timeGridWeek,timeGridDay' }}
          events={events}
          eventClick={handleEventClick}
          height={600}
          eventDisplay="block"
          dayMaxEvents={3}
        />
      </div>

      <Sheet open={!!selectedEvent} onOpenChange={() => setSelectedEvent(null)}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>{selectedEvent?.type === 'session' ? t('sessions.sessionDetails') : t('matches.matchDetails')}</SheetTitle>
          </SheetHeader>
          <div className="mt-6 space-y-4">
            {selectedEvent?.type === 'session' && sessionDetail && (
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">{t('common.date')}</p>
                  <p className="text-base font-medium">{formatDateTime(sessionDetail.scheduledAt)}</p>
                </div>
                {sessionDetail.location && (
                  <div>
                    <p className="text-sm text-muted-foreground">{t('common.location')}</p>
                    <p className="text-base font-medium">{sessionDetail.location}</p>
                  </div>
                )}
                {sessionDetail.durationMin && (
                  <div>
                    <p className="text-sm text-muted-foreground">{t('sessions.duration')}</p>
                    <p className="text-base font-medium">{sessionDetail.durationMin} {t('common.minutes')}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-muted-foreground">{t('common.status')}</p>
                  <Badge className={getStatusColor(sessionDetail.status)}>{t(`commonEnums.sessionStatus.${sessionDetail.status}`)}</Badge>
                </div>
                {sessionDetail.intensity && (
                  <div>
                    <p className="text-sm text-muted-foreground">{t('sessions.intensity')}</p>
                    <p className="text-base font-medium">{t(`exercises.${sessionDetail.intensity}`)}</p>
                  </div>
                )}
                {sessionDetail.focus && sessionDetail.focus.length > 0 && (
                  <div>
                    <p className="text-sm text-muted-foreground">{t('sessions.focus')}</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {sessionDetail.focus.map((f) => (
                        <Badge key={f} variant="outline">{f}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
            {selectedEvent?.type === 'match' && matchDetail && (
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">{t('common.date')}</p>
                  <p className="text-base font-medium">{formatDateTime(matchDetail.kickoffAt)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t('matches.opponent')}</p>
                  <p className="text-base font-medium">{matchDetail.opponent}</p>
                </div>
                {matchDetail.location && (
                  <div>
                    <p className="text-sm text-muted-foreground">{t('common.location')}</p>
                    <p className="text-base font-medium">{matchDetail.location}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-muted-foreground">{t('common.status')}</p>
                  <Badge className={getStatusColor(matchDetail.status)}>{t(`commonEnums.matchStatus.${matchDetail.status}`)}</Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t('matches.type')}</p>
                  <p className="text-base font-medium">{matchDetail.isHome ? t('matches.home') : t('matches.away')}</p>
                </div>
                {(matchDetail.goalsFor > 0 || matchDetail.goalsAgainst > 0) && (
                  <div>
                    <p className="text-sm text-muted-foreground">{t('matches.score')}</p>
                    <p className="text-base font-medium">{matchDetail.goalsFor} : {matchDetail.goalsAgainst}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
