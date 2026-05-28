import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { analyticsApi } from '@/shared/api/analytics.api'
import { authApi } from '@/shared/api/auth.api'
import { queryKeys } from '@/shared/api/query-keys'
import { PageHeader, Card, CardContent, CardHeader, CardTitle, Progress } from '@/shared/ui'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { formatDate, getDevIndexColor, getDevIndexLabel } from '@/shared/lib/utils'

export function PlayerProgressPage() {
  const { t } = useTranslation()
  const { data: me } = useQuery({ queryKey: queryKeys.auth.me(), queryFn: authApi.getMe })

  const { data: analytics } = useQuery({
    queryKey: queryKeys.analytics.player(me?.id ?? ''),
    queryFn: () => analyticsApi.getPlayerAnalytics(me!.id),
    enabled: !!me?.id,
  })

  const latestAssessment = analytics?.assessmentHistory?.[0]
  const devIndex = analytics?.devIndexHistory?.[analytics.devIndexHistory.length - 1]?.value ?? 0

  return (
    <div className="space-y-6">
      <PageHeader title={t('playerPortal.myProgress')} description={t('playerPortal.devIndex')} />

      {/* DevIndex big display */}
      <Card>
        <CardContent className="p-8 text-center">
          <span className={`text-6xl font-bold ${getDevIndexColor(devIndex)}`}>{devIndex}</span>
          <p className="text-lg font-medium text-muted-foreground mt-2">{getDevIndexLabel(devIndex)}</p>
          <div className="mt-4 max-w-md mx-auto">
            <Progress value={devIndex} className="h-4" />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Latest assessment as bars */}
        <Card>
          <CardHeader><CardTitle className="text-lg">{t('assessments.title')}</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {latestAssessment ? (
              <>
                {(['technical', 'physical', 'tactical', 'discipline', 'teamwork'] as const).map((skill) => (
                  <div key={skill}>
                    <div className="flex justify-between text-base mb-1">
                      <span>{t(`assessments.${skill}`)}</span>
                      <span className="font-medium">{latestAssessment[skill]}/10</span>
                    </div>
                    <Progress value={latestAssessment[skill] * 10} className="h-3" />
                  </div>
                ))}
              </>
            ) : (
              <p className="text-center text-muted-foreground py-8 text-base">{t('assessments.noAssessments')}</p>
            )}
          </CardContent>
        </Card>

        {/* DevIndex history */}
        <Card>
          <CardHeader><CardTitle className="text-lg">{t('playerPortal.devIndex')}</CardTitle></CardHeader>
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
              <p className="text-center text-muted-foreground py-8 text-base">{t('common.noData')}</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
