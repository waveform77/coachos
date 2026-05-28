import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { analyticsApi } from '@/shared/api/analytics.api'
import { teamsApi } from '@/shared/api/teams.api'
import { playersApi } from '@/shared/api/players.api'
import { queryKeys } from '@/shared/api/query-keys'
import { useAuthStore } from '@/app/store/auth.store'
import {
  PageHeader, Tabs, TabsContent, TabsList, TabsTrigger, Card, CardContent, CardHeader, CardTitle,
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Skeleton, Badge, Avatar, AvatarFallback,
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/shared/ui'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, Legend, ReferenceLine,
} from 'recharts'
import { SkillRadarChart } from '@/entities/player/skill-radar-chart'
import { getInitials } from '@/shared/lib/utils'
import { cn } from '@/shared/lib/utils'

export function CoachAnalyticsPage() {
  const { t } = useTranslation()
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const [teamFilter, setTeamFilter] = React.useState<string>('all')
  const [selectedPlayerId, setSelectedPlayerId] = React.useState<string | null>(null)

  const { data: teams } = useQuery({
    queryKey: queryKeys.teams.all({ clubId: user?.clubId }),
    queryFn: () => teamsApi.listTeams({ clubId: user?.clubId }),
  })

  const { data: allClubPlayers, isLoading: loadingAllPlayers } = useQuery({
    queryKey: queryKeys.players.all({ clubId: user?.clubId }),
    queryFn: () => playersApi.listPlayers({ clubId: user?.clubId, limit: 100 }),
    enabled: !!user?.clubId,
  })

  const { data: teamMembers, isLoading: loadingTeamMembers } = useQuery({
    queryKey: queryKeys.teams.members(teamFilter),
    queryFn: () => teamsApi.getTeamMembers(teamFilter),
    enabled: teamFilter !== 'all',
  })

  const loadingPlayers = teamFilter === 'all' ? loadingAllPlayers : loadingTeamMembers

  const { data: attendance, isLoading: loadingAttendance } = useQuery({
    queryKey: queryKeys.analytics.attendance({ teamId: teamFilter !== 'all' ? teamFilter : undefined }),
    queryFn: () => analyticsApi.getAttendanceAnalytics({ teamId: teamFilter !== 'all' ? teamFilter : undefined }),
  })

  const { data: trainingLoad, isLoading: loadingLoad } = useQuery({
    queryKey: queryKeys.analytics.trainingLoad({ teamId: teamFilter !== 'all' ? teamFilter : undefined }),
    queryFn: () => analyticsApi.getTrainingLoad({ teamId: teamFilter !== 'all' ? teamFilter : undefined }),
  })

  const { data: playerAnalytics, isLoading: loadingPlayerAnalytics } = useQuery({
    queryKey: queryKeys.analytics.player(selectedPlayerId ?? ''),
    queryFn: () => analyticsApi.getPlayerAnalytics(selectedPlayerId!),
    enabled: !!selectedPlayerId,
  })

  const teamSelector = (
    <Select value={teamFilter} onValueChange={(v) => { setTeamFilter(v); setSelectedPlayerId(null) }}>
      <SelectTrigger className="w-40">
        <SelectValue placeholder={t('common.all')} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">{t('common.all')}</SelectItem>
        {teams?.data?.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
      </SelectContent>
    </Select>
  )

  const playerList = React.useMemo(() => {
    if (teamFilter === 'all') return allClubPlayers?.data ?? []
    return teamMembers?.map((m) => m.player) ?? []
  }, [teamFilter, allClubPlayers, teamMembers])

  const getDevIndexColor = (val: number) => {
    if (val >= 80) return 'text-emerald-600'
    if (val >= 60) return 'text-yellow-600'
    return 'text-red-500'
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('analytics.title')}
        description={t('analytics.coachAnalytics')}
        actions={teamSelector}
      />

      <Tabs defaultValue="attendance">
        <TabsList>
          <TabsTrigger value="attendance">{t('attendance.title')}</TabsTrigger>
          <TabsTrigger value="load">{t('analytics.load')}</TabsTrigger>
          <TabsTrigger value="players">{t('players.title')}</TabsTrigger>
        </TabsList>

        <TabsContent value="attendance" className="mt-4 space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">{t('attendance.attendanceRate')}</CardTitle></CardHeader>
            <CardContent>
              {loadingAttendance ? (
                <Skeleton className="h-64 w-full" />
              ) : attendance?.length ? (
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={attendance.slice(0, 20)} margin={{ top: 5, right: 10, left: -20, bottom: 60 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="playerName" angle={-45} textAnchor="end" tick={{ fontSize: 11 }} />
                    <YAxis tickFormatter={(v) => `${v}%`} tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(v) => [`${v}%`, t('attendance.attendanceRate')]} />
                    <Bar dataKey="rate" fill="#10b981" radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-center text-muted-foreground py-8">{t('common.noData')}</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="load" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t('analytics.load')}</CardTitle>
              <p className="text-sm text-muted-foreground">{t('analytics.loadDescription')}</p>
            </CardHeader>
            <CardContent>
              {loadingLoad ? (
                <Skeleton className="h-64 w-full" />
              ) : trainingLoad?.length ? (
                <ResponsiveContainer width="100%" height={320}>
                  <AreaChart data={trainingLoad} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="weekLabel" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Legend />
                    <ReferenceLine y={80} stroke="#ef4444" strokeDasharray="4 4" label={{ value: t('analytics.load'), fontSize: 11, fill: '#ef4444' }} />
                    <Area type="monotone" dataKey="loadScore" stroke="#10b981" fill="#10b981" fillOpacity={0.2} name={t('analytics.load')} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-center text-muted-foreground py-8">{t('common.noData')}</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="players" className="mt-4 space-y-4">
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Player List */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-base">{t('players.title')}</CardTitle>
              </CardHeader>
              <CardContent>
                {loadingPlayers ? (
                  <div className="space-y-2">
                    {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
                  </div>
                ) : playerList.length > 0 ? (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{t('common.player')}</TableHead>
                          <TableHead>{t('common.position')}</TableHead>
                          <TableHead>{t('players.devIndex')}</TableHead>
                          <TableHead className="text-right">{t('common.status')}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {playerList.map((player) => (
                          <TableRow
                            key={player.id}
                            className={cn(
                              'cursor-pointer transition-colors',
                              selectedPlayerId === player.id ? 'bg-primary/5' : 'hover:bg-muted/50'
                            )}
                            onClick={() => setSelectedPlayerId(player.id)}
                          >
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Avatar className="h-8 w-8">
                                  <AvatarFallback className="text-xs bg-primary/10 text-primary">
                                    {getInitials(player.firstName, player.lastName)}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="font-medium text-sm">{player.firstName} {player.lastName}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-sm capitalize">{player.position ?? '-'}</TableCell>
                            <TableCell className={cn('font-semibold tabular-nums', getDevIndexColor(player.devIndex))}>
                              {player.devIndex}
                            </TableCell>
                            <TableCell className="text-right">
                              {selectedPlayerId === player.id && (
                                <Badge variant="secondary" className="text-xs">Selected</Badge>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">{t('common.noData')}</p>
                )}
              </CardContent>
            </Card>

            {/* Player Detail Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t('playerDetail.skillsSummary')}</CardTitle>
              </CardHeader>
              <CardContent>
                {!selectedPlayerId ? (
                  <div className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-3">
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" /></svg>
                    </div>
                    <p className="text-sm">{t('analytics.selectPlayers')}</p>
                  </div>
                ) : loadingPlayerAnalytics ? (
                  <Skeleton className="h-48 w-full" />
                ) : playerAnalytics?.assessmentHistory?.[0] ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { key: 'technical', label: t('assessments.technical'), val: playerAnalytics.assessmentHistory[0].technical },
                        { key: 'physical', label: t('assessments.physical'), val: playerAnalytics.assessmentHistory[0].physical },
                        { key: 'tactical', label: t('assessments.tactical'), val: playerAnalytics.assessmentHistory[0].tactical },
                        { key: 'discipline', label: t('assessments.discipline'), val: playerAnalytics.assessmentHistory[0].discipline },
                        { key: 'teamwork', label: t('assessments.teamwork'), val: playerAnalytics.assessmentHistory[0].teamwork },
                      ].map((s) => (
                        <div key={s.key} className="rounded-lg border p-3 text-center">
                          <p className="text-xs text-muted-foreground">{s.label}</p>
                          <p className="mt-1 text-lg font-bold">{s.val}<span className="text-xs font-normal text-muted-foreground">/10</span></p>
                        </div>
                      ))}
                      <div className="rounded-lg border p-3 text-center bg-primary/5">
                        <p className="text-xs text-muted-foreground">{t('players.devIndex')}</p>
                        <p className="mt-1 text-lg font-bold">{playerAnalytics.devIndexHistory?.slice(-1)[0]?.value ?? '—'}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => navigate(`/coach/players/${selectedPlayerId}`)}
                      className="w-full rounded-lg border py-2 text-sm font-medium text-primary hover:bg-primary/5 transition-colors"
                    >
                      {t('playerDetail.openProfile')}
                    </button>
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">{t('common.noData')}</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
