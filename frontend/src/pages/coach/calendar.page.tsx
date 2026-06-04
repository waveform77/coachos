import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Plus, Filter, CalendarDays, Pencil, Dumbbell, Trophy } from 'lucide-react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import type { EventClickArg, EventContentArg } from '@fullcalendar/core'
import { sessionsApi } from '@/shared/api/sessions.api'
import { matchesApi } from '@/shared/api/matches.api'
import { teamsApi } from '@/shared/api/teams.api'
import { queryKeys } from '@/shared/api/query-keys'
import { useAuthStore } from '@/app/store/auth.store'
import type { SessionStatus } from '@/shared/types'
import {
  Button, PageHeader, Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
  Sheet, SheetContent, SheetHeader, SheetTitle, Badge,
} from '@/shared/ui'
import { SessionForm } from '@/features/sessions/session-form'
import { toast } from 'sonner'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { formatDate, formatDateTime, getStatusColor } from '@/shared/lib/utils'

function formatEventTime(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
}

function CalendarEventContent(arg: EventContentArg) {
  const isSession = arg.event.extendedProps.type === 'session'
  const Icon = isSession ? Dumbbell : Trophy
  return (
    <div className="flex items-center gap-1 px-1 py-0.5 text-xs leading-tight">
      <Icon className="h-3 w-3 shrink-0" />
      <span className="font-medium shrink-0">{arg.timeText}</span>
      <span className="truncate">{arg.event.title}</span>
    </div>
  )
}

export function CalendarPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const qc = useQueryClient()
  const [teamFilter, setTeamFilter] = React.useState<string>('all')
  const [createOpen, setCreateOpen] = React.useState(false)
  const [editOpen, setEditOpen] = React.useState(false)
  const [selectedEvent, setSelectedEvent] = React.useState<{ type: 'session' | 'match'; id: string } | null>(null)
  const [selectedDate, setSelectedDate] = React.useState<{ dateStr: string; items: typeof events } | null>(null)
  const [statusValue, setStatusValue] = React.useState<string>('')

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

  const { mutate: createSession, isPending: isCreating } = useMutation({
    mutationFn: sessionsApi.createSession,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.sessions.all() })
      toast.success(t('common.success'))
      setCreateOpen(false)
    },
    onError: () => toast.error(t('common.error')),
  })

  const { mutate: updateSession, isPending: isUpdating } = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof sessionsApi.updateSession>[1] }) =>
      sessionsApi.updateSession(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.sessions.all() })
      qc.invalidateQueries({ queryKey: queryKeys.sessions.detail(selectedEvent!.id) })
      toast.success(t('common.saved'))
      setEditOpen(false)
      setSelectedEvent(null)
    },
    onError: () => toast.error(t('common.error')),
  })

  const events = [
    ...(sessions?.data ?? []).map((s) => ({
      id: `session-${s.id}`,
      title: `${t('calendar.session')}${s.location ? ` · ${s.location}` : ''}`,
      start: s.scheduledAt,
      end: s.durationMin ? new Date(new Date(s.scheduledAt).getTime() + s.durationMin * 60000).toISOString() : undefined,
      color: '#10b981',
      textColor: '#ffffff',
      extendedProps: { type: 'session', sessionId: s.id },
    })),
    ...(matches?.data ?? []).map((m) => ({
      id: `match-${m.id}`,
      title: `${t('calendar.match')} vs ${m.opponent}`,
      start: m.kickoffAt,
      color: '#f97316',
      textColor: '#ffffff',
      extendedProps: { type: 'match', matchId: m.id },
    })),
  ]

  const handleEventClick = (arg: EventClickArg) => {
    const { type, sessionId, matchId } = arg.event.extendedProps as Record<string, string>
    if (type === 'session') setSelectedEvent({ type: 'session', id: sessionId })
    if (type === 'match') setSelectedEvent({ type: 'match', id: matchId })
  }

  const handleDateClick = (info: { dateStr: string }) => {
    const items = events.filter((e) => {
      const start = e.start.slice(0, 10)
      return start === info.dateStr
    })
    setSelectedDate({ dateStr: info.dateStr, items })
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
              <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader><DialogTitle>{t('calendar.addSession')}</DialogTitle></DialogHeader>
                <SessionForm
                  teams={teamsList}
                  loading={isCreating}
                  onSubmit={async (v) => {
                    const payload = {
                      teamID: v.teamID,
                      scheduledAt: v.scheduledAt ? new Date(v.scheduledAt).toISOString() : undefined,
                      durationMin: v.durationMin === '' ? undefined : v.durationMin,
                      location: v.location,
                      intensity: v.intensity,
                      notes: v.notes,
                      focus: v.focus,
                    }
                    createSession(payload)
                  }}
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
          dateClick={handleDateClick}
          height={600}
          eventDisplay="block"
          dayMaxEvents={4}
          eventTimeFormat={{ hour: '2-digit', minute: '2-digit', hour12: false }}
          eventContent={CalendarEventContent}
        />
      </div>

      {/* Day events sheet */}
      <Sheet open={!!selectedDate} onOpenChange={() => setSelectedDate(null)}>
        <SheetContent className="w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5" />
              {selectedDate ? formatDate(selectedDate.dateStr, 'EEEE, d MMMM yyyy') : ''}
            </SheetTitle>
          </SheetHeader>
          <div className="mt-6 space-y-3">
            {selectedDate?.items.length === 0 && (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground gap-2">
                <CalendarDays className="h-8 w-8 opacity-50" />
                <p className="text-sm">{t('calendar.noEvents')}</p>
              </div>
            )}
            {selectedDate?.items.map((item) => {
              const isSession = item.extendedProps.type === 'session'
              const Icon = isSession ? Dumbbell : Trophy
              return (
                <button
                  key={item.id}
                  className="w-full text-left rounded-lg border p-3 hover:bg-accent transition-colors"
                  onClick={() => {
                    setSelectedDate(null)
                    const props = item.extendedProps as Record<string, string>
                    if (props.type === 'session') setSelectedEvent({ type: 'session', id: props.sessionId })
                    if (props.type === 'match') setSelectedEvent({ type: 'match', id: props.matchId })
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md" style={{ backgroundColor: item.color }}>
                      <Icon className="h-4 w-4 text-white" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium truncate">{item.title}</p>
                      <p className="text-xs text-muted-foreground">{formatEventTime(item.start)}</p>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </SheetContent>
      </Sheet>

      {/* Event detail sheet */}
      <Sheet open={!!selectedEvent} onOpenChange={() => setSelectedEvent(null)}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              {selectedEvent?.type === 'session' ? (
                <>
                  <Dumbbell className="h-5 w-5 text-emerald-500" />
                  {t('sessions.sessionDetails')}
                </>
              ) : (
                <>
                  <Trophy className="h-5 w-5 text-orange-500" />
                  {t('matches.matchDetails')}
                </>
              )}
            </SheetTitle>
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
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">{t('common.changeStatus')}</p>
                  <Select
                    value={statusValue || sessionDetail.status}
                    onValueChange={setStatusValue}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="planned">{t('commonEnums.sessionStatus.planned')}</SelectItem>
                      <SelectItem value="in_progress">{t('commonEnums.sessionStatus.in_progress')}</SelectItem>
                      <SelectItem value="completed">{t('commonEnums.sessionStatus.completed')}</SelectItem>
                      <SelectItem value="cancelled">{t('commonEnums.sessionStatus.cancelled')}</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    className="w-full"
                    size="sm"
                    disabled={isUpdating || (statusValue || sessionDetail.status) === sessionDetail.status}
                    onClick={() => {
                      if (statusValue) {
                        updateSession({ id: selectedEvent!.id, data: { status: statusValue as SessionStatus } })
                      }
                    }}
                  >
                    {isUpdating ? t('common.saving') : t('common.save')}
                  </Button>
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
                <Button
                  className="w-full gap-2 mt-2"
                  variant="outline"
                  onClick={() => setEditOpen(true)}
                >
                  <Pencil className="h-4 w-4" />
                  {t('common.edit')}
                </Button>
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

      {/* Edit session dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{t('sessions.editSession')}</DialogTitle></DialogHeader>
          {sessionDetail && (
            <SessionForm
              teams={teamsList}
              defaultValues={sessionDetail}
              loading={isUpdating}
              onSubmit={async (v) => {
                await updateSession({
                  id: selectedEvent!.id,
                  data: {
                    scheduledAt: v.scheduledAt ? new Date(v.scheduledAt).toISOString() : undefined,
                    durationMin: v.durationMin === '' ? undefined : v.durationMin,
                    location: v.location,
                    intensity: v.intensity,
                    notes: v.notes,
                    focus: v.focus,
                  } as Parameters<typeof sessionsApi.updateSession>[1],
                })
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
