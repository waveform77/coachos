import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { matchesApi } from '@/shared/api/matches.api'
import { teamsApi } from '@/shared/api/teams.api'
import { playersApi } from '@/shared/api/players.api'
import { queryKeys } from '@/shared/api/query-keys'
import { useAuthStore } from '@/app/store/auth.store'
import {
  Button, Tabs, TabsContent, TabsList, TabsTrigger, Badge, Skeleton,
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
  Card, CardContent,
} from '@/shared/ui'
import { LineupBuilder } from '@/features/matches/lineup-builder'
import { MatchEventsForm } from '@/features/matches/match-events-form'
import { formatDate, getStatusColor, capitalize } from '@/shared/lib/utils'
import { MapPin, Home } from 'lucide-react'
import type { Player } from '@/shared/types'

export function MatchDetailPage() {
  const { t } = useTranslation()
  const { matchId } = useParams<{ matchId: string }>()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { user } = useAuthStore()
  const [eventOpen, setEventOpen] = React.useState(false)

  const { data: match, isLoading } = useQuery({
    queryKey: queryKeys.matches.detail(matchId!),
    queryFn: () => matchesApi.getMatch(matchId!),
    enabled: !!matchId,
  })

  const lineup = match?.lineup
  const events = match?.events

  const { data: teamMembers } = useQuery({
    queryKey: queryKeys.teams.members(match?.teamID ?? ''),
    queryFn: () => teamsApi.getTeamMembers(match!.teamID),
    enabled: !!match?.teamID,
  })

  const { data: clubPlayers } = useQuery({
    queryKey: queryKeys.players.all({ clubId: user?.clubId }),
    queryFn: () => playersApi.listPlayers({ clubId: user?.clubId, limit: 100 }),
    enabled: !!user?.clubId,
  })

  const { mutate: addEvent, isPending } = useMutation({
    mutationFn: (data: Parameters<typeof matchesApi.addMatchEvent>[1]) => matchesApi.addMatchEvent(matchId!, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.matches.detail(matchId!) })
      toast.success(t('common.success'))
      setEventOpen(false)
    },
    onError: () => toast.error(t('common.error')),
  })

  const players = React.useMemo(() => {
    const fromTeam = teamMembers?.map((m) => m.player).filter((p): p is Player => !!p) ?? []
    const result = fromTeam.length > 0 ? fromTeam : (clubPlayers?.data ?? [])
    console.log('MatchDetailPage Players:', result.map(p => ({ id: p.id, name: `${p.firstName} ${p.lastName}` })));
    return result
  }, [teamMembers, clubPlayers])

  if (isLoading) return <Skeleton className="h-64 w-full rounded-lg" />
  if (!match) return null

  const EVENT_ICONS: Record<string, string> = {
    goal: '⚽', assist: '🎯', yellow_card: '🟨', red_card: '🟥', sub_in: '⬆️', sub_out: '⬇️',
  }

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={() => navigate('/coach/matches')} className="gap-2 -ml-2">
        <ArrowLeft className="h-4 w-4" />{t('common.back')}
      </Button>

      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col items-center gap-4">
            <div className="flex items-center gap-2">
              <Badge className={getStatusColor(match.status)}>{t(`commonEnums.matchStatus.${match.status}`)}</Badge>
              <Badge variant={match.isHome ? 'default' : 'secondary'}>
                {match.isHome ? <><Home className="mr-1 h-3 w-3" />{t('matches.home')}</> : t('matches.away')}
              </Badge>
            </div>
            <div className="flex items-center gap-6 text-center">
              <div>
                <p className="text-sm text-muted-foreground">{t('common.team')}</p>
                <p className="text-4xl font-bold text-emerald-600">{match.goalsFor}</p>
              </div>
              <p className="text-2xl font-bold text-muted-foreground">:</p>
              <div>
                <p className="text-sm text-muted-foreground">{match.opponent}</p>
                <p className="text-4xl font-bold text-red-500">{match.goalsAgainst}</p>
              </div>
            </div>
            <div className="flex flex-wrap justify-center gap-4 text-sm text-muted-foreground">
              <span>{formatDate(match.kickoffAt, 'EEE, MMM d, yyyy HH:mm')}</span>
              {match.location && <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{match.location}</span>}
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="lineup">
        <TabsList>
          <TabsTrigger value="lineup">{t('matchDetail.lineupBuilder')}</TabsTrigger>
          <TabsTrigger value="events">{t('matches.events')} ({events?.length ?? 0})</TabsTrigger>
          <TabsTrigger value="summary">{t('matches.matchSummary')}</TabsTrigger>
        </TabsList>

        <TabsContent value="lineup" className="mt-4">
          <LineupBuilder
            matchId={matchId!}
            players={players}
            initialLineup={match?.lineup}
            onSaved={() => qc.invalidateQueries({ queryKey: queryKeys.matches.detail(matchId!) })}
          />
        </TabsContent>

        <TabsContent value="events" className="mt-4">
          <div className="space-y-4">
            <div className="flex justify-end">
              <Dialog open={eventOpen} onOpenChange={setEventOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2"><Plus className="h-4 w-4" />{t('matches.addEvent')}</Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader><DialogTitle>{t('matches.addEvent')}</DialogTitle></DialogHeader>
                  <MatchEventsForm players={players} loading={isPending} onSubmit={async (v) => addEvent(v as Parameters<typeof matchesApi.addMatchEvent>[1])} />
                </DialogContent>
              </Dialog>
            </div>
            {events?.length ? (
              <div className="relative">
                <div className="absolute left-8 top-0 h-full w-0.5 bg-border" />
                <div className="space-y-4">
                  {[...events].sort((a, b) => a.minute - b.minute).map((ev) => {
                    const player = players.find((p) => p.id === ev.playerID)
                    return (
                      <div key={ev.id} className="flex items-start gap-3 pl-4">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border bg-background text-sm z-10">{ev.minute}'</div>
                        <div className="flex-1 rounded-lg border p-3">
                          <div className="flex items-center gap-2">
                            <span>{EVENT_ICONS[ev.type] ?? '📋'}</span>
                            <span className="font-medium">{t(`matches.${ev.type}`)}</span>
                            {player && <span className="text-muted-foreground">— {player.firstName} {player.lastName}</span>}
                          </div>
                          {ev.notes && <p className="mt-1 text-sm text-muted-foreground">{ev.notes}</p>}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">{t('common.noData')}</p>
            )}
          </div>
        </TabsContent>

        <TabsContent value="summary" className="mt-4">
          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground">{match.notes ?? t('common.noData')}</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
