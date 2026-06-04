import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Plus, Calendar, Clock, MapPin, Dumbbell, Filter } from 'lucide-react'
import { sessionsApi } from '@/shared/api/sessions.api'
import { teamsApi } from '@/shared/api/teams.api'
import { queryKeys } from '@/shared/api/query-keys'
import { useAuthStore } from '@/app/store/auth.store'
import { formatDateTime, getStatusColor, getIntensityColor, capitalize } from '@/shared/lib/utils'
import {
  Button, PageHeader, Badge, Card, CardContent,
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
  Skeleton,
} from '@/shared/ui'

export function SessionsListPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [statusFilter, setStatusFilter] = React.useState<string>('all')

  const { data: sessions, isLoading } = useQuery({
    queryKey: queryKeys.sessions.all({ status: statusFilter !== 'all' ? statusFilter : undefined }),
    queryFn: () => sessionsApi.listSessions({ status: statusFilter !== 'all' ? statusFilter : undefined, limit: 100 }),
  })

  const { data: teams } = useQuery({
    queryKey: queryKeys.teams.all({ clubId: user?.clubId }),
    queryFn: () => teamsApi.listTeams({ clubId: user?.clubId }),
  })

  const teamsMap = React.useMemo(() => {
    const map = new Map<string, string>()
    ;(teams as any)?.data?.forEach((t: any) => map.set(t.id, t.name))
    return map
  }, [teams])

  const filtered = sessions?.data ?? []

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('nav.coach.sessions')}
        description={t('sessions.title')}
        actions={
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40 h-9">
                  <SelectValue placeholder={t('common.filter')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('common.all')}</SelectItem>
                  <SelectItem value="planned">{t('sessions.planned')}</SelectItem>
                  <SelectItem value="in_progress">{t('sessions.inProgress')}</SelectItem>
                  <SelectItem value="completed">{t('sessions.completed')}</SelectItem>
                  <SelectItem value="cancelled">{t('sessions.cancelled')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button className="gap-2" onClick={() => navigate('/coach/sessions/new')}>
              <Plus className="h-4 w-4" />
              {t('sessions.addSession')}
            </Button>
          </div>
        }
      />

      <div className="space-y-3">
        {isLoading && (
          <>
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </>
        )}

        {!isLoading && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <Dumbbell className="h-12 w-12 mb-4 opacity-30" />
            <p className="text-lg font-medium">{t('common.noData')}</p>
            <p className="text-sm">{t('sessions.noSessions')}</p>
          </div>
        )}

        {filtered.map((session) => (
          <Card
            key={session.id}
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => navigate(`/coach/sessions/${session.id}`)}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-base truncate">
                      {teamsMap.get(session.teamID) ?? session.teamID}
                    </h3>
                    <Badge className={getStatusColor(session.status)}>
                      {t(`sessions.${session.status}`)}
                    </Badge>
                    <Badge variant="outline" className={getIntensityColor(session.intensity)}>
                      {t(`sessions.${session.intensity}`)}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      {formatDateTime(session.scheduledAt)}
                    </span>
                    {session.durationMin != null && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {session.durationMin} {t('common.min')}
                      </span>
                    )}
                    {session.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" />
                        {session.location}
                      </span>
                    )}
                  </div>
                  {session.focus && session.focus.length > 0 && (
                    <div className="flex items-center gap-1.5 flex-wrap pt-1">
                      {session.focus.map((f) => (
                        <Badge key={f} variant="secondary" className="text-xs capitalize">
                          {f}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
                <div className="shrink-0 text-right">
                  <span className="text-xs text-muted-foreground">
                    {session.blocks?.length ?? 0} {t('sessions.blocks').toLowerCase()}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
