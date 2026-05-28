import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, Users, Plus } from 'lucide-react'
import { teamsApi, teamDetailToMembers } from '@/shared/api/teams.api'
import { sessionsApi } from '@/shared/api/sessions.api'
import { matchesApi } from '@/shared/api/matches.api'
import { queryKeys } from '@/shared/api/query-keys'
import { Button, Tabs, TabsContent, TabsList, TabsTrigger, Badge, Avatar, AvatarFallback, Skeleton } from '@/shared/ui'
import { SessionCard } from '@/entities/session/session-card'
import { getInitials, capitalize } from '@/shared/lib/utils'
import { PageHeader } from '@/shared/ui/page-header'

export function TeamDetailPage() {
  const { t } = useTranslation()
  const { teamId } = useParams<{ teamId: string }>()
  const navigate = useNavigate()

  const { data: team, isLoading } = useQuery({
    queryKey: queryKeys.teams.detail(teamId!),
    queryFn: () => teamsApi.getTeam(teamId!),
    enabled: !!teamId,
  })

  const { data: sessions } = useQuery({
    queryKey: queryKeys.sessions.all({ teamId }),
    queryFn: () => sessionsApi.listSessions({ teamId }),
    enabled: !!teamId,
  })

  const { data: matches } = useQuery({
    queryKey: queryKeys.matches.all({ teamId }),
    queryFn: () => matchesApi.listMatches({ teamId }),
    enabled: !!teamId,
  })

  const members = React.useMemo(
    () => (team ? teamDetailToMembers(team) : []),
    [team],
  )

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full rounded-lg" />
      </div>
    )
  }

  if (!team) return null

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={() => navigate('/coach/teams')} className="gap-2 -ml-2">
        <ArrowLeft className="h-4 w-4" />{t('common.back')}
      </Button>
      <PageHeader
        title={team.name}
        description={[team.ageGroup, team.season].filter(Boolean).join(' · ')}
        actions={
          <div className="flex gap-2">
            <Badge variant="secondary">{team.ageGroup}</Badge>
            <Badge variant="outline">{team.season}</Badge>
          </div>
        }
      />

      <Tabs defaultValue="members">
        <TabsList>
          <TabsTrigger value="members">{t('teamDetail.players')} ({members?.length ?? 0})</TabsTrigger>
          <TabsTrigger value="sessions">{t('teamDetail.sessions')} ({sessions?.data?.length ?? 0})</TabsTrigger>
          <TabsTrigger value="matches">{t('teamDetail.matches')} ({matches?.data?.length ?? 0})</TabsTrigger>
        </TabsList>

        <TabsContent value="members" className="mt-4">
          <div className="space-y-4">
            <div className="flex justify-end">
              <Button size="sm" className="gap-2"><Plus className="h-4 w-4" />{t('teamDetail.addPlayer')}</Button>
            </div>
            {members?.length ? (
              <div className="rounded-md border divide-y">
                {members.map((m) => (
                  <div key={m.playerID} className="flex items-center gap-3 p-4 hover:bg-muted/50 cursor-pointer"
                    onClick={() => navigate(`/coach/players/${m.playerID}`)}>
                    <Avatar className="h-9 w-9">
                      <AvatarFallback className="text-sm">{getInitials(m.player.firstName, m.player.lastName)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-medium">{m.player.firstName} {m.player.lastName}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {m.position && <span className="text-xs text-muted-foreground">{t(`commonEnums.positions.${m.position}`)}</span>}
                        {m.jerseyNumber && <Badge variant="outline" className="text-xs">#{m.jerseyNumber}</Badge>}
                        {m.isCaptain && <Badge className="text-xs">{t('players.isCaptain')}</Badge>}
                      </div>
                    </div>
                    <span className="text-sm font-bold text-primary">{m.player.devIndex}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center py-16 text-center">
                <Users className="h-12 w-12 text-muted-foreground/50" />
                <p className="mt-3 font-medium">{t('common.noData')}</p>
                <p className="mt-1 text-sm text-muted-foreground">{t('teamDetail.addPlayer')}</p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="sessions" className="mt-4">
          <div className="space-y-3">
            {sessions?.data?.length ? (
              sessions.data.map((s) => <SessionCard key={s.id} session={s} />)
            ) : (
              <p className="text-center text-muted-foreground py-8">{t('common.noData')}</p>
            )}
          </div>
        </TabsContent>

        <TabsContent value="matches" className="mt-4">
          <div className="space-y-3">
            {matches?.data?.length ? (
              matches.data.map((m) => (
                <div key={m.id} className="flex items-center gap-4 rounded-lg border p-4 cursor-pointer hover:bg-muted/50"
                  onClick={() => navigate(`/coach/matches/${m.id}`)}>
                  <div className="flex-1">
                    <p className="font-medium">vs {m.opponent}</p>
                    <p className="text-sm text-muted-foreground">{new Date(m.kickoffAt).toLocaleDateString()}</p>
                  </div>
                  {m.status === 'completed' && (
                    <span className="text-lg font-bold">{m.goalsFor} : {m.goalsAgainst}</span>
                  )}
                  <Badge>{t(`commonEnums.matchStatus.${m.status}`)}</Badge>
                </div>
              ))
            ) : (
              <p className="text-center text-muted-foreground py-8">{t('common.noData')}</p>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
