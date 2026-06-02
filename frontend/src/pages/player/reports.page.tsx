import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { FileText, TrendingUp, Target, Calendar, Clock, Activity, Flame, AlertTriangle, ThumbsUp, TrendingDown, Minus, Sparkles, Brain, Zap, AlertCircle, RefreshCw } from 'lucide-react'
import { analyticsApi } from '@/shared/api/analytics.api'
import { aiApi } from '@/shared/api/ai.api'
import { queryKeys } from '@/shared/api/query-keys'
import { PageHeader, Card, CardContent, CardHeader, CardTitle, Progress, Badge, Skeleton } from '@/shared/ui'

export function PlayerReportsPage() {
  const { t } = useTranslation()

  const { data: reports, isLoading } = useQuery({
    queryKey: queryKeys.me.reports(),
    queryFn: () => analyticsApi.getMyReports(),
  })

  const analytics = reports?.analytics
  const matchStats = reports?.matchStats
  const form = reports?.form

  const queryClient = useQueryClient()

  const {
    data: aiInsights,
    isLoading: isAiLoading,
  } = useQuery({
    queryKey: queryKeys.me.aiInsights(),
    queryFn: () => aiApi.getMyInsights(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  const {
    mutate: generateInsights,
    isPending: isGenerating,
  } = useMutation({
    mutationKey: queryKeys.me.aiInsights(),
    mutationFn: () => aiApi.generateMyInsights(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.me.aiInsights() })
    },
  })

  const totalSessions = analytics?.attendanceHistory?.length ?? 0
  const presentSessions = analytics?.attendanceHistory?.filter((a) => a.status === 'present').length ?? 0
  const attendanceRate = totalSessions > 0 ? Math.round((presentSessions / totalSessions) * 100) : 0
  const latestAssessment = analytics?.assessmentHistory?.[0]

  const getFormIcon = (formStatus?: string) => {
    switch (formStatus) {
      case 'excellent': return <Flame className="h-6 w-6 text-orange-500" />
      case 'rising': return <TrendingUp className="h-6 w-6 text-emerald-500" />
      case 'falling': return <TrendingDown className="h-6 w-6 text-red-500" />
      case 'rusty': return <AlertTriangle className="h-6 w-6 text-yellow-500" />
      default: return <Minus className="h-6 w-6 text-muted-foreground" />
    }
  }

  const getFormColor = (formStatus?: string) => {
    switch (formStatus) {
      case 'excellent': return 'text-orange-600 bg-orange-50'
      case 'rising': return 'text-emerald-600 bg-emerald-50'
      case 'falling': return 'text-red-600 bg-red-50'
      case 'rusty': return 'text-yellow-600 bg-yellow-50'
      default: return 'text-slate-600 bg-slate-50'
    }
  }

  const recommendations = React.useMemo(() => {
    const recs: string[] = []
    if (attendanceRate > 0 && attendanceRate < 60) {
      recs.push(t('reports.recLowAttendance', 'Низкая посещаемость. Старайтесь не пропускать тренировки — регулярность — ключ к прогрессу.'))
    }
    if (latestAssessment) {
      const weakSkills = []
      if (latestAssessment.technical < 6) weakSkills.push(t('assessments.technical'))
      if (latestAssessment.physical < 6) weakSkills.push(t('assessments.physical'))
      if (latestAssessment.tactical < 6) weakSkills.push(t('assessments.tactical'))
      if (latestAssessment.discipline < 6) weakSkills.push(t('assessments.discipline'))
      if (latestAssessment.teamwork < 6) weakSkills.push(t('assessments.teamwork'))
      if (weakSkills.length > 0) {
        recs.push(t('reports.recWeakSkills', 'Обратите внимание на: {{skills}}. Работа над этими навыками даст быстрый рост.', { skills: weakSkills.join(', ') }))
      }
    }
    if ((matchStats?.goals ?? 0) === 0 && (matchStats?.matchesPlayed ?? 0) > 3) {
      recs.push(t('reports.recNoGoals', 'В последних матчах не забито голов. Попробуйте больше работать на завершение атак на тренировках.'))
    }
    if (form?.form === 'excellent' || form?.form === 'rising') {
      recs.push(t('reports.recGoodForm', 'Отличная форма! Поддерживайте текущий темп тренировок и восстановления.'))
    }
    if (recs.length === 0) {
      recs.push(t('reports.recGeneral', 'Продолжайте работать над собой. Регулярность тренировок и самоанализ помогут достичь новых высот.'))
    }
    return recs
  }, [analytics, matchStats, form, attendanceRate, latestAssessment, t])

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4 sm:grid-cols-2">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
        <Skeleton className="h-40 w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader title={t('playerPortal.myReports')} description={t('parent.reports')} />

      {/* Attendance + Assessment */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-lg">{t('attendance.title')}</CardTitle></CardHeader>
          <CardContent className="text-center">
            <span className={`text-5xl font-bold ${attendanceRate >= 80 ? 'text-emerald-600' : attendanceRate >= 60 ? 'text-yellow-600' : 'text-red-500'}`}>
              {attendanceRate}%
            </span>
            <Progress value={attendanceRate} className="mt-4 h-4" />
            <p className="text-base text-muted-foreground mt-2">
              {presentSessions} {t('attendance.present')} {t('common.outOf')} {totalSessions} {t('sessions.title')}
            </p>
          </CardContent>
        </Card>

        {latestAssessment ? (
          <Card>
            <CardHeader><CardTitle className="text-lg">{t('playerDetail.latestAssessment')}</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {([
                { key: 'technical', label: t('assessments.technical') },
                { key: 'physical', label: t('assessments.physical') },
                { key: 'tactical', label: t('assessments.tactical') },
                { key: 'discipline', label: t('assessments.discipline') },
                { key: 'teamwork', label: t('assessments.teamwork') }
              ] as const).map(({ key, label }) => (
                <div key={key}>
                  <div className="flex justify-between text-base mb-1">
                    <span>{label}</span>
                    <span className="font-medium">{latestAssessment[key]}/10</span>
                  </div>
                  <Progress value={latestAssessment[key] * 10} className="h-3" />
                </div>
              ))}
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              <p className="text-base">{t('playerDetail.noAssessments')}</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Match Stats */}
      {matchStats && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold">{t('playerDetail.matchStats')}</h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardContent className="p-6 text-center">
                <Target className="h-6 w-6 text-primary mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">{t('matches.goals')}</p>
                <p className="text-3xl font-bold mt-1">{matchStats.goals}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <Activity className="h-6 w-6 text-primary mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">{t('matches.assists')}</p>
                <p className="text-3xl font-bold mt-1">{matchStats.assists}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <Calendar className="h-6 w-6 text-primary mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">{t('matches.matchesPlayed')}</p>
                <p className="text-3xl font-bold mt-1">{matchStats.matchesPlayed}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <Clock className="h-6 w-6 text-primary mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">{t('matches.minutesPlayed')}</p>
                <p className="text-3xl font-bold mt-1">{matchStats.minutesPlayed}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <div className="h-6 w-6 mx-auto mb-2 rounded-full bg-yellow-100 text-yellow-700 flex items-center justify-center text-xs font-bold">Y</div>
                <p className="text-sm text-muted-foreground">{t('matches.yellowCards')}</p>
                <p className="text-3xl font-bold mt-1">{matchStats.yellowCards}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <div className="h-6 w-6 mx-auto mb-2 rounded-full bg-red-100 text-red-700 flex items-center justify-center text-xs font-bold">R</div>
                <p className="text-sm text-muted-foreground">{t('matches.redCards')}</p>
                <p className="text-3xl font-bold mt-1">{matchStats.redCards}</p>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Player Form */}
      {form && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <TrendingUp className="h-5 w-5 text-primary" />
              {t('playerPortal.form', 'Форма')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap items-center gap-4">
              <div className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium ${getFormColor(form.form)}`}>
                {getFormIcon(form.form)}
                <span>{t(form.label, form.label)}</span>
                <span>{form.trend}</span>
              </div>
              <div className="flex items-center gap-6 text-sm">
                <div className="text-center">
                  <p className="text-muted-foreground">{t('assessments.avgScore', 'Средний балл')}</p>
                  <p className="text-xl font-bold">{form.avgScore}</p>
                </div>
                <div className="text-center">
                  <p className="text-muted-foreground">{t('attendance.title')}</p>
                  <p className="text-xl font-bold">{form.attendance}%</p>
                </div>
                <div className="text-center">
                  <p className="text-muted-foreground">{t('matches.matchesPlayed')}</p>
                  <p className="text-xl font-bold">{form.matchCount}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* AI Insights */}
      {(isAiLoading || isGenerating) && (
        <div className="space-y-4">
          {isGenerating && <Skeleton className="h-12 w-full" />}
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      )}

      {aiInsights?.analysis && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Brain className="h-5 w-5 text-primary" />
              {t('aiAssistant.analysis', 'AI-анализ игрока')}
            </CardTitle>
            <button
              type="button"
              onClick={() => generateInsights()}
              disabled={isGenerating}
              className="flex items-center gap-1 rounded-md border px-3 py-1.5 text-sm font-medium hover:bg-accent transition-colors disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`h-4 w-4 ${isGenerating ? 'animate-spin' : ''}`} />
              {t('aiAssistant.refresh', 'Обновить')}
            </button>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-base text-muted-foreground">{aiInsights.analysis.summary}</p>
            {aiInsights.analysis.strengths && aiInsights.analysis.strengths.length > 0 && (
              <div>
                <p className="font-medium mb-2">{t('aiAssistant.strengths', 'Сильные стороны')}</p>
                <ul className="space-y-2">
                  {aiInsights.analysis.strengths.map((s, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <Zap className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {aiInsights.analysis.weaknesses && aiInsights.analysis.weaknesses.length > 0 && (
              <div>
                <p className="font-medium mb-2">{t('aiAssistant.weaknesses', 'Зоны роста')}</p>
                <ul className="space-y-2">
                  {aiInsights.analysis.weaknesses.map((w, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <AlertCircle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                      {w}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {aiInsights.analysis.recommendations && aiInsights.analysis.recommendations.length > 0 && (
              <div>
                <p className="font-medium mb-2">{t('aiAssistant.recommendations', 'Рекомендации ИИ')}</p>
                <ul className="space-y-2">
                  {aiInsights.analysis.recommendations.map((r, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <ThumbsUp className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                      {r}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {aiInsights?.progress && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Sparkles className="h-5 w-5 text-primary" />
              {t('aiAssistant.progressSummary', 'Саммари прогресса')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="text-base px-3 py-1">
                {aiInsights.progress.trend}
              </Badge>
              <p className="text-base">{aiInsights.progress.summary}</p>
            </div>
            {aiInsights.progress.highlights && aiInsights.progress.highlights.length > 0 && (
              <div>
                <p className="font-medium mb-2">{t('aiAssistant.highlights', 'Ключевые моменты')}</p>
                <ul className="space-y-2">
                  {aiInsights.progress.highlights.map((h, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <Zap className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                      {h}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {aiInsights.progress.alerts && aiInsights.progress.alerts.length > 0 && (
              <div>
                <p className="font-medium mb-2">{t('aiAssistant.alerts', 'Внимание')}</p>
                <ul className="space-y-2">
                  {aiInsights.progress.alerts.map((a, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <AlertTriangle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                      {a}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Fallback recommendations when AI is unavailable */}
      {!isAiLoading && !isGenerating && !aiInsights?.analysis && (
        <div className="space-y-4">
          <button
            type="button"
            onClick={() => generateInsights()}
            disabled={isGenerating}
            className="w-full flex items-center justify-center gap-2 rounded-lg border bg-card p-4 text-base font-medium hover:bg-accent transition-colors disabled:opacity-50 cursor-pointer"
          >
            <Sparkles className="h-5 w-5 text-primary" />
            {t('aiAssistant.generate', 'Сгенерировать AI-анализ')}
          </button>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileText className="h-5 w-5 text-primary" />
                {t('aiAssistant.recommendations')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {recommendations.map((rec, i) => (
                <div key={i} className="flex items-start gap-3 rounded-lg border p-4">
                  <ThumbsUp className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <p className="text-base">{rec}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
