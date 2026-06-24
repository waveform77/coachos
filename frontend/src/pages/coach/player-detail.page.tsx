import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Plus, Target, Calendar, Camera, TrendingUp, ChevronDown, ChevronUp } from 'lucide-react'
import { toast } from 'sonner'
import { playersApi } from '@/shared/api/players.api'
import { assessmentsApi } from '@/shared/api/assessments.api'
import { analyticsApi } from '@/shared/api/analytics.api'
import { queryKeys } from '@/shared/api/query-keys'
import {
  Button, Tabs, TabsContent, TabsList, TabsTrigger, Badge, Card, CardContent, CardHeader, CardTitle,
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, Skeleton, Progress,
  Avatar, AvatarFallback, AvatarImage,
} from '@/shared/ui'
import { DevIndex } from '@/entities/player/player-dev-index'
import { SkillRadarChart } from '@/entities/player/skill-radar-chart'
import { PlayerFormBadge } from '@/entities/player/player-form-badge'
import { PlayerPotential } from '@/entities/player/player-potential'
import { AssessmentForm } from '@/features/players/assessment-form'
import { ParentLinkingSection } from '@/features/players/parent-linking-section'
import { PlayerNotes } from '@/features/players/player-notes'
import { MedicalLog } from '@/features/players/medical-log'
import { calculateAge, formatDate, getDevIndexColor, getDevIndexLabel } from '@/shared/lib/utils'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

export function PlayerDetailPage() {
  const { t } = useTranslation()
  const { playerId } = useParams<{ playerId: string }>()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [assessOpen, setAssessOpen] = React.useState(false)
  const [showRadar, setShowRadar] = React.useState(false)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  const { data: player, isLoading } = useQuery({
    queryKey: queryKeys.players.detail(playerId!),
    queryFn: () => playersApi.getPlayer(playerId!),
    enabled: !!playerId,
  })

  const { mutate: uploadPhoto, isPending: isUploading } = useMutation({
    mutationFn: ({ id, file }: { id: string; file: File }) => playersApi.uploadPlayerPhoto(id, file),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.players.detail(playerId!) })
      toast.success(t('common.success'))
    },
    onError: () => toast.error(t('common.error')),
  })

  const { data: analytics } = useQuery({
    queryKey: queryKeys.analytics.player(playerId!),
    queryFn: () => import('@/shared/api/analytics.api').then((m) => m.analyticsApi.getPlayerAnalytics(playerId!)),
    enabled: !!playerId,
  })

  const { data: assessments } = useQuery({
    queryKey: queryKeys.assessments.player(playerId!),
    queryFn: () => assessmentsApi.getPlayerAssessments(playerId!),
    enabled: !!playerId,
  })

  const { data: matchStats } = useQuery({
    queryKey: ['analytics', 'player', playerId, 'match-stats'],
    queryFn: () => analyticsApi.getPlayerMatchStats(playerId!),
    enabled: !!playerId,
  })

  const { mutate: createAssessment, isPending } = useMutation({
    mutationFn: assessmentsApi.createAssessment,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.assessments.player(playerId!) })
      toast.success(t('common.success'))
      setAssessOpen(false)
    },
    onError: () => toast.error(t('common.error')),
  })

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full rounded-lg" />
      </div>
    )
  }
  if (!player) return null

  const latestAssessment = assessments?.[0]
  const previousAssessment = assessments?.[1]
  const age = calculateAge(player.birthDate)
  const attendanceTotal = analytics?.attendanceHistory?.length ?? 0
  const attendancePresent = analytics?.attendanceHistory?.filter(a => a.status === 'present').length ?? 0
  const attendanceRate = attendanceTotal > 0 ? Math.round((attendancePresent / attendanceTotal) * 100) : 0

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={() => navigate('/coach/players')} className="gap-2 -ml-2 h-11 text-base">
        <ArrowLeft className="h-5 w-5" />{t('common.back')}
      </Button>

      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
            <div className="relative group">
              <Avatar className="h-24 w-24 shrink-0">
                {player.photoURL ? (
                  <AvatarImage src={`${import.meta.env.VITE_API_URL || ''}${player.photoURL}`} alt={`${player.firstName} ${player.lastName}`} className="object-cover" />
                ) : null}
                <AvatarFallback className="bg-primary/10 text-3xl font-bold text-primary">
                  {player.firstName[0]}{player.lastName[0]}
                </AvatarFallback>
              </Avatar>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 text-white opacity-0 transition-opacity hover:opacity-100 disabled:opacity-50 cursor-pointer"
                title={player.photoURL ? t('players.changePhoto') : t('players.uploadPhoto')}
              >
                {isUploading ? (
                  <span className="text-sm">{t('common.loading')}</span>
                ) : (
                  <Camera className="h-8 w-8" />
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file && playerId) {
                    uploadPhoto({ id: playerId, file })
                  }
                }}
              />
            </div>
            <div className="flex-1 text-center sm:text-left">
              <h1 className="text-3xl font-bold">{player.firstName} {player.lastName}</h1>
              <div className="mt-2 flex flex-wrap justify-center gap-2 sm:justify-start">
                {player.position && <Badge variant="secondary">{t(`commonEnums.positions.${player.position}`)}</Badge>}
                {age && <Badge variant="outline">{t('players.age')} {age}</Badge>}
                {player.dominantFoot && <Badge variant="outline">{t(`commonEnums.dominantFoot.${player.dominantFoot}`)}</Badge>}
              </div>
              {player.heightCm || player.weightKg ? (
                <p className="mt-2 text-base text-muted-foreground">
                  {player.heightCm ? `${player.heightCm} см` : ''}{player.heightCm && player.weightKg ? ' · ' : ''}{player.weightKg ? `${player.weightKg} кг` : ''}
                </p>
              ) : null}
            </div>
            <div className="flex flex-col items-center gap-1">
              <DevIndex value={player.devIndex} size="lg" />
              <span className={`text-sm font-medium ${getDevIndexColor(player.devIndex)}`}>{getDevIndexLabel(player.devIndex)}</span>
              <PlayerFormBadge playerId={player.id} size="md" />
              {player.potentialAbility ? (
                <div className="w-full max-w-[180px] mt-1">
                  <PlayerPotential devIndex={player.devIndex} potentialAbility={player.potentialAbility} />
                </div>
              ) : null}
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="overview">
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="overview">{t('playerDetail.overview')}</TabsTrigger>
          <TabsTrigger value="progress">{t('playerDetail.progress')}</TabsTrigger>
          <TabsTrigger value="attendance">{t('playerDetail.attendance')}</TabsTrigger>
          <TabsTrigger value="parents">{t('playerDetail.parents')}</TabsTrigger>
          <TabsTrigger value="notes">{t('playerDetail.notes')}</TabsTrigger>
          <TabsTrigger value="matches">{t('matches.title')}</TabsTrigger>
          <TabsTrigger value="medical">{t('playerDetail.medical')}</TabsTrigger>
        </TabsList>

        {/* OVERVIEW TAB */}
        <TabsContent value="overview" className="mt-4 space-y-4">
          {latestAssessment ? (
            <div className="grid gap-4 lg:grid-cols-2">
              <Card>
                <CardHeader><CardTitle className="text-lg">{t('assessments.latestScores')}</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  {(['technical', 'physical', 'tactical', 'discipline', 'teamwork'] as const).map((skill) => (
                    <div key={skill}>
                      <div className="flex justify-between text-base mb-1">
                        <span>{t(`assessments.${skill}`)}</span>
                        <span className="font-medium">{latestAssessment[skill]}{t('assessments.maxScore')}</span>
                      </div>
                      <Progress value={latestAssessment[skill] * 10} className="h-3" />
                    </div>
                  ))}
                </CardContent>
              </Card>
              <div className="space-y-4">
                {analytics?.goalsProgress?.length ? (
                  <Card>
                    <CardHeader><CardTitle className="text-lg">{t('playerDetail.goals')}</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                      {analytics.goalsProgress.slice(0, 3).map((g) => (
                        <div key={g.id}>
                          <div className="flex justify-between text-base mb-1">
                            <span className="font-medium truncate">{g.title}</span>
                            <span>{g.progressPct}%</span>
                          </div>
                          <Progress value={g.progressPct} className="h-2" />
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                ) : null}
                <Card>
                  <CardHeader><CardTitle className="text-lg">{t('playerDetail.quickStats')}</CardTitle></CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between text-base">
                      <span className="text-muted-foreground">{t('players.devIndex')}</span>
                      <span className="font-semibold">{player.devIndex ?? '—'}</span>
                    </div>
                    <div className="flex justify-between text-base">
                      <span className="text-muted-foreground">{t('attendance.title')}</span>
                      <span className="font-semibold">{attendancePresent} / {attendanceTotal} ({attendanceRate}%)</span>
                    </div>
                    <div className="flex justify-between text-base">
                      <span className="text-muted-foreground">{t('assessments.total')}</span>
                      <span className="font-semibold">{assessments?.length ?? 0}</span>
                    </div>
                  </CardContent>
                </Card>
                {matchStats && (
                  <Card>
                    <CardHeader><CardTitle className="text-lg">{t('playerDetail.matchStats')}</CardTitle></CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between text-base">
                        <span className="text-muted-foreground">{t('matches.goals')}</span>
                        <span className="font-semibold">{matchStats.goals}</span>
                      </div>
                      <div className="flex justify-between text-base">
                        <span className="text-muted-foreground">{t('matches.assists')}</span>
                        <span className="font-semibold">{matchStats.assists}</span>
                      </div>
                      <div className="flex justify-between text-base">
                        <span className="text-muted-foreground">{t('matches.yellowCards')}</span>
                        <span className="font-semibold">{matchStats.yellowCards}</span>
                      </div>
                      <div className="flex justify-between text-base">
                        <span className="text-muted-foreground">{t('matches.redCards')}</span>
                        <span className="font-semibold">{matchStats.redCards}</span>
                      </div>
                      <div className="flex justify-between text-base">
                        <span className="text-muted-foreground">{t('matches.minutesPlayed')}</span>
                        <span className="font-semibold">{matchStats.minutesPlayed}</span>
                      </div>
                      <div className="flex justify-between text-base">
                        <span className="text-muted-foreground">{t('matches.matchesPlayed')}</span>
                        <span className="font-semibold">{matchStats.matchesPlayed}</span>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                <p className="text-base">{t('playerDetail.noAssessments')}</p>
                <p className="text-sm mt-1">{t('playerDetail.addAssessmentHint')}</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* PROGRESS TAB */}
        <TabsContent value="progress" className="mt-4 space-y-4">
          {/* DevIndex Chart */}
          <Card>
            <CardHeader><CardTitle className="text-lg">{t('players.devIndex')}</CardTitle></CardHeader>
            <CardContent>
              {analytics?.devIndexHistory?.length ? (
                <ResponsiveContainer width="100%" height={350}>
                  <LineChart data={analytics.devIndexHistory}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" tick={{ fontSize: 13 }} tickFormatter={(v) => formatDate(v, 'MMM d')} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 13 }} />
                    <Tooltip />
                    <Line type="monotone" dataKey="value" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-base text-muted-foreground text-center py-8">{t('common.noData')}</p>
              )}
            </CardContent>
          </Card>

          {/* Goals */}
          <Card>
            <CardHeader><CardTitle className="text-lg">{t('playerDetail.goals')}</CardTitle></CardHeader>
            <CardContent>
              {analytics?.goalsProgress?.length ? (
                <div className="space-y-4">
                  {analytics.goalsProgress.map((g) => (
                    <div key={g.id} className="rounded-lg border p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-semibold text-base">{g.title}</p>
                          {g.description && <p className="mt-1 text-base text-muted-foreground">{g.description}</p>}
                          {g.deadline && <p className="mt-1 text-sm text-muted-foreground">{t('common.date')}: {formatDate(g.deadline)}</p>}
                        </div>
                        <Badge variant={g.status === 'achieved' ? 'default' : 'outline'}>{t(`commonEnums.goalStatus.${g.status}`)}</Badge>
                      </div>
                      <div className="mt-3">
                        <div className="flex justify-between text-sm text-muted-foreground mb-1">
                          <span>{t('common.progress')}</span><span className="font-medium">{g.progressPct}%</span>
                        </div>
                        <Progress value={g.progressPct} className="h-3" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center py-12">
                  <Target className="h-12 w-12 text-muted-foreground/50" />
                  <p className="mt-3 font-medium text-base">{t('playerPortal.activeGoals')}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Assessments History */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">{t('assessments.assessmentHistory')}</h3>
              <Dialog open={assessOpen} onOpenChange={setAssessOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2"><Plus className="h-5 w-5" />{t('playerDetail.addAssessment')}</Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader><DialogTitle>{t('playerDetail.addAssessment')}</DialogTitle></DialogHeader>
                  <AssessmentForm
                    loading={isPending}
                    onSubmit={async (v) => createAssessment({ ...v, playerID: playerId!, coachID: '', assessedAt: new Date().toISOString() })}
                  />
                </DialogContent>
              </Dialog>
            </div>
            {assessments?.length ? (
              <div className="space-y-4">
                {assessments.map((a) => (
                  <Card key={a.id}>
                    <CardContent className="p-5">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-base font-medium text-muted-foreground">{formatDate(a.assessedAt)}</p>
                        <Button variant="ghost" size="sm" onClick={() => setShowRadar((s) => !s)} className="gap-1">
                          {showRadar ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                          {showRadar ? t('common.collapse') : t('assessments.showRadar')}
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {(['technical', 'physical', 'tactical', 'discipline', 'teamwork'] as const).map((skill) => (
                          <Badge key={skill} variant="secondary">
                            {t(`assessments.${skill}`)}: {a[skill]}/10
                          </Badge>
                        ))}
                      </div>
                      {showRadar && (
                        <div className="mt-4">
                          <SkillRadarChart assessment={a} previous={previousAssessment} height={280} />
                        </div>
                      )}
                      {a.notes && <p className="mt-3 text-base text-muted-foreground">{a.notes}</p>}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8 text-base">{t('playerDetail.noAssessments')}</p>
            )}
          </div>
        </TabsContent>

        {/* ATTENDANCE TAB */}
        <TabsContent value="attendance" className="mt-4">
          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-1">
              <CardHeader><CardTitle className="text-lg">{t('attendance.attendanceRate')}</CardTitle></CardHeader>
              <CardContent className="text-center">
                <span className={`text-5xl font-bold ${attendanceRate >= 80 ? 'text-emerald-600' : attendanceRate >= 60 ? 'text-yellow-600' : 'text-red-500'}`}>
                  {attendanceRate}%
                </span>
                <p className="text-base text-muted-foreground mt-2">
                  {attendancePresent} {t('attendance.present')} / {attendanceTotal} {t('common.total')}
                </p>
                <Progress value={attendanceRate} className="mt-4 h-3" />
              </CardContent>
            </Card>
            <Card className="lg:col-span-2">
              <CardHeader><CardTitle className="text-lg">{t('playerDetail.attendanceHistory')}</CardTitle></CardHeader>
              <CardContent className="p-6">
                {analytics?.attendanceHistory?.length ? (
                  <div className="space-y-3">
                    {analytics.attendanceHistory.map((r) => (
                      <div key={r.id} className="flex items-center gap-3 rounded-lg border p-4">
                        <Calendar className="h-5 w-5 text-muted-foreground shrink-0" />
                        <span className="flex-1 text-base">{formatDate(r.markedAt)}</span>
                        <Badge className={`${r.status === 'present' ? 'bg-emerald-100 text-emerald-800' : r.status === 'absent' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>
                          {t(`commonEnums.attendanceStatus.${r.status}`)}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8 text-base">{t('playerDetail.attendanceHistory')}</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="parents" className="mt-4">
          <ParentLinkingSection playerId={playerId!} isLinked={!!player.userID} />
        </TabsContent>

        <TabsContent value="notes" className="mt-4">
          <PlayerNotes playerId={playerId!} />
        </TabsContent>

        <TabsContent value="matches" className="mt-4">
          {matchStats ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardContent className="p-6 text-center">
                  <p className="text-sm text-muted-foreground">{t('matches.matchesPlayed')}</p>
                  <p className="text-3xl font-bold mt-1">{matchStats.matchesPlayed}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6 text-center">
                  <p className="text-sm text-muted-foreground">{t('matches.goals')}</p>
                  <p className="text-3xl font-bold mt-1">{matchStats.goals}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6 text-center">
                  <p className="text-sm text-muted-foreground">{t('matches.assists')}</p>
                  <p className="text-3xl font-bold mt-1">{matchStats.assists}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6 text-center">
                  <p className="text-sm text-muted-foreground">{t('matches.yellowCards')}</p>
                  <p className="text-3xl font-bold mt-1">{matchStats.yellowCards}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6 text-center">
                  <p className="text-sm text-muted-foreground">{t('matches.redCards')}</p>
                  <p className="text-3xl font-bold mt-1">{matchStats.redCards}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6 text-center">
                  <p className="text-sm text-muted-foreground">{t('matches.minutesPlayed')}</p>
                  <p className="text-3xl font-bold mt-1">{matchStats.minutesPlayed}</p>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                <p className="text-base">{t('common.noData')}</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="medical" className="mt-4">
          <MedicalLog playerId={playerId!} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
