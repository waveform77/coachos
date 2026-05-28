import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { FileText } from 'lucide-react'
import { analyticsApi } from '@/shared/api/analytics.api'
import { authApi } from '@/shared/api/auth.api'
import { queryKeys } from '@/shared/api/query-keys'
import { PageHeader, Card, CardContent, CardHeader, CardTitle, Progress } from '@/shared/ui'

export function PlayerReportsPage() {
  const { t } = useTranslation()
  const { data: me } = useQuery({ queryKey: queryKeys.auth.me(), queryFn: authApi.getMe })

  const { data: analytics } = useQuery({
    queryKey: queryKeys.analytics.player(me?.id ?? ''),
    queryFn: () => analyticsApi.getPlayerAnalytics(me!.id),
    enabled: !!me?.id,
  })

  const totalSessions = analytics?.attendanceHistory?.length ?? 0
  const presentSessions = analytics?.attendanceHistory?.filter((a) => a.status === 'present').length ?? 0
  const attendanceRate = totalSessions > 0 ? Math.round((presentSessions / totalSessions) * 100) : 0
  const latestAssessment = analytics?.assessmentHistory?.[0]

  return (
    <div className="space-y-6">
      <PageHeader title={t('playerPortal.myReports')} description={t('parent.reports')} />

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

        {latestAssessment && (
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
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <FileText className="h-5 w-5 text-primary" />{t('aiAssistant.recommendations')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-base text-muted-foreground">
            {t('aiAssistant.subtitle')}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
