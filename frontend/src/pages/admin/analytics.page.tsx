import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { clubsApi } from '@/shared/api/clubs.api'
import { queryKeys } from '@/shared/api/query-keys'
import { useAuthStore } from '@/app/store/auth.store'
import { PageHeader, Card, CardContent, CardHeader, CardTitle, Skeleton } from '@/shared/ui'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'

export function AdminAnalyticsPage() {
  const { t } = useTranslation()
  const { user } = useAuthStore()

  const devKey = t('teamDetail.avgDevIndex')
  const attKey = t('teamDetail.avgAttendance')
  const playersKey = t('players.title')

  const { data: dashboard, isLoading } = useQuery({
    queryKey: queryKeys.clubs.dashboard(user?.clubId ?? ''),
    queryFn: () => clubsApi.getClubDashboard(user?.clubId ?? ''),
    enabled: !!user?.clubId,
  })

  const comparisonData = dashboard?.teamStats?.map((team) => ({
    name: team.teamName,
    [devKey]: Math.round(team.avgDevIndex),
    [attKey]: Math.round(team.avgAttendance),
    [playersKey]: team.playerCount,
  })) ?? []

  return (
    <div className="space-y-6">
      <PageHeader title={t('nav.admin.analytics')} description={t('analytics.teamAnalytics')} />

      <Card>
        <CardHeader><CardTitle className="text-base">{t('analytics.comparePlayers')}</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : comparisonData.length ? (
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={comparisonData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey={devKey} fill="#10b981" radius={[4,4,0,0]} />
                <Bar dataKey={attKey} fill="#3b82f6" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-muted-foreground py-8">{t('common.noData')}</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
