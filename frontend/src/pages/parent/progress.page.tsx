import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { TrendingUp } from 'lucide-react'
import { analyticsApi } from '@/shared/api/analytics.api'
import { parentsApi } from '@/shared/api/parents.api'
import { queryKeys } from '@/shared/api/query-keys'
import {
  PageHeader, Card, CardContent, CardHeader, CardTitle, Progress, Skeleton, Avatar, AvatarFallback,
} from '@/shared/ui'
import { EmptyState } from '@/shared/ui/empty-state'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { formatDate, getDevIndexColor, getDevIndexLabel, getInitials } from '@/shared/lib/utils'

export function ParentProgressPage() {
  const { t } = useTranslation()
  const { data: children = [], isLoading: childrenLoading } = useQuery({
    queryKey: queryKeys.parent.children(),
    queryFn: parentsApi.listChildren,
  })

  const [playerId, setPlayerId] = React.useState('')
  React.useEffect(() => {
    if (!children.length) return
    if (!playerId || !children.some((c) => c.id === playerId)) {
      setPlayerId(children[0].id)
    }
  }, [children, playerId])

  const selectedChild = children.find((c) => c.id === playerId)

  const { data: analytics, isLoading: analyticsLoading } = useQuery({
    queryKey: queryKeys.analytics.player(playerId),
    queryFn: () => analyticsApi.getPlayerAnalytics(playerId),
    enabled: !!playerId,
  })

  const latestAssessment = analytics?.assessmentHistory?.[0]
  const devIndex = selectedChild?.devIndex ?? 0

  return (
    <div className="space-y-6">
      <PageHeader title={t('parent.progress')} description={t('parent.devIndex')} />

      {children.length > 1 && (
        <div className="flex flex-wrap gap-3">
          {children.map((child) => (
            <button
              key={child.id}
              onClick={() => setPlayerId(child.id)}
              className={`flex items-center gap-3 rounded-xl border px-4 py-3 transition-all ${
                playerId === child.id ? 'border-primary bg-primary/5 shadow-sm' : 'border-border hover:bg-accent'
              }`}
            >
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                  {getInitials(child.firstName, child.lastName)}
                </AvatarFallback>
              </Avatar>
              <span className="font-medium">{child.firstName} {child.lastName}</span>
            </button>
          ))}
        </div>
      )}

      {childrenLoading ? (
        <Skeleton className="h-64 w-full rounded-lg" />
      ) : !children.length ? (
        <Card>
          <CardContent>
            <EmptyState icon={TrendingUp} title={t('parent.progress')} description={t('common.noData')} />
          </CardContent>
        </Card>
      ) : analyticsLoading ? (
        <Skeleton className="h-80 w-full rounded-lg" />
      ) : (
        <div className="space-y-6">
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
              <CardHeader>
                <CardTitle className="text-lg">{t('parent.latestAssessment')}</CardTitle>
              </CardHeader>
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

            {/* DevIndex history chart */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{t('parent.devIndex')}</CardTitle>
              </CardHeader>
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
      )}
    </div>
  )
}
