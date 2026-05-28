import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, Home, MapPin } from 'lucide-react'
import { matchesApi } from '@/shared/api/matches.api'
import { queryKeys } from '@/shared/api/query-keys'
import {
  Button, Tabs, TabsContent, TabsList, TabsTrigger, Badge, Card, CardContent, Skeleton, Avatar, AvatarFallback,
} from '@/shared/ui'
import { EmptyState } from '@/shared/ui'
import { formatDate, getStatusColor, getInitials, capitalize } from '@/shared/lib/utils'

export function PlayerMatchDetailPage() {
  const { t } = useTranslation()
  const { matchId } = useParams<{ matchId: string }>()
  const navigate = useNavigate()

  const { data: match, isLoading } = useQuery({
    queryKey: queryKeys.matches.detail(matchId!),
    queryFn: () => matchesApi.getMatch(matchId!),
    enabled: !!matchId,
  })

  const { data: lineup } = useQuery({
    queryKey: queryKeys.matches.lineup(matchId!),
    queryFn: () => matchesApi.getLineup(matchId!),
    enabled: !!matchId,
  })

  const { data: events } = useQuery({
    queryKey: queryKeys.matches.events(matchId!),
    queryFn: () => matchesApi.getMatchEvents(matchId!),
    enabled: !!matchId,
  })

  if (isLoading) return <Skeleton className="h-64 w-full rounded-lg" />
  if (!match) return null

  const starters = lineup?.filter((l) => l.role === 'starter') ?? []
  const subs = lineup?.filter((l) => l.role === 'substitute') ?? []

  const EVENT_ICONS: Record<string, string> = {
    goal: '⚽', assist: '🎯', yellow_card: '🟨', red_card: '🟥', sub_in: '⬆️', sub_out: '⬇️',
  }

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={() => navigate('/me/matches')} className="gap-2 -ml-2">
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
          <TabsTrigger value="lineup">{t('matchDetail.lineup') || 'Состав'}</TabsTrigger>
          <TabsTrigger value="events">{t('matches.events')} ({events?.length ?? 0})</TabsTrigger>
        </TabsList>

        <TabsContent value="lineup" className="mt-4">
          <div className="space-y-4">
            <div>
              <h3 className="mb-2 font-semibold text-sm">{t('tactics.onField') || 'Стартовый состав'} ({starters.length})</h3>
              {starters.length ? (
                <div className="grid gap-2 sm:grid-cols-2">
                  {starters.map((entry) => (
                    <PlayerLineupRow key={entry.playerID} entry={entry} />
                  ))}
                </div>
              ) : (
                <EmptyState title={t('common.noData')} description="" />
              )}
            </div>
            <div>
              <h3 className="mb-2 font-semibold text-sm">{t('tactics.substitutes') || 'Запасные'} ({subs.length})</h3>
              {subs.length ? (
                <div className="grid gap-2 sm:grid-cols-2">
                  {subs.map((entry) => (
                    <PlayerLineupRow key={entry.playerID} entry={entry} />
                  ))}
                </div>
              ) : (
                <EmptyState title={t('common.noData')} description="" />
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="events" className="mt-4">
          {events?.length ? (
            <div className="relative">
              <div className="absolute left-8 top-0 h-full w-0.5 bg-border" />
              <div className="space-y-4">
                {[...events].sort((a, b) => a.minute - b.minute).map((ev) => (
                  <div key={ev.id} className="flex items-start gap-3 pl-4">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border bg-background text-sm z-10">{ev.minute}'</div>
                    <div className="flex-1 rounded-lg border p-3">
                      <div className="flex items-center gap-2">
                        <span>{EVENT_ICONS[ev.type] ?? '📋'}</span>
                        <span className="font-medium">{t(`matches.${ev.type}`)}</span>
                        {ev.playerID && ev.player && (
                          <span className="text-muted-foreground">— {ev.player.firstName} {ev.player.lastName}</span>
                        )}
                      </div>
                      {ev.notes && <p className="mt-1 text-sm text-muted-foreground">{ev.notes}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">{t('common.noData')}</p>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

function PlayerLineupRow({ entry }: { entry: import('@/shared/types').MatchLineup }) {
  const player = entry.player
  return (
    <div className="flex items-center gap-3 rounded-lg border p-3">
      <Avatar className="h-9 w-9">
        <AvatarFallback className="text-xs">{getInitials(player?.firstName ?? '', player?.lastName ?? '')}</AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{player?.firstName} {player?.lastName}</p>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {entry.position && <span className="capitalize">{capitalize(entry.position)}</span>}
          {entry.fieldX != null && entry.fieldY != null && (
            <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded">{Math.round(entry.fieldX)}:{Math.round(entry.fieldY)}</span>
          )}
        </div>
      </div>
    </div>
  )
}
