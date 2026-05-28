import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { sessionsApi } from '@/shared/api/sessions.api'
import { teamsApi } from '@/shared/api/teams.api'
import { queryKeys } from '@/shared/api/query-keys'
import { useAuthStore } from '@/app/store/auth.store'
import {
  PageHeader, Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
  Card, CardContent, Badge, DataTable, type Column,
} from '@/shared/ui'
import { formatDateTime, getStatusColor, capitalize } from '@/shared/lib/utils'
import type { TrainingSession } from '@/shared/types'

export function AttendancePage() {
  const { t } = useTranslation()
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const [teamFilter, setTeamFilter] = React.useState<string>('all')

  const { data: teams } = useQuery({
    queryKey: queryKeys.teams.all({ clubId: user?.clubId }),
    queryFn: () => teamsApi.listTeams({ clubId: user?.clubId }),
  })

  const { data: sessions, isLoading } = useQuery({
    queryKey: queryKeys.sessions.all({ teamId: teamFilter !== 'all' ? teamFilter : undefined }),
    queryFn: () => sessionsApi.listSessions({ teamId: teamFilter !== 'all' ? teamFilter : undefined, limit: 50 }),
  })

  const columns: Column<TrainingSession>[] = [
    { key: 'date', header: t('common.date'), cell: (s) => <span className="text-sm">{formatDateTime(s.scheduledAt)}</span> },
    { key: 'status', header: t('common.status'), cell: (s) => <Badge className={`text-xs ${getStatusColor(s.status)}`}>{t(`commonEnums.sessionStatus.${s.status}`)}</Badge> },
    { key: 'location', header: t('common.location'), cell: (s) => <span className="text-sm text-muted-foreground">{s.location ?? '—'}</span> },
    { key: 'intensity', header: t('sessions.intensity'), cell: (s) => <span className="text-sm">{t(`exercises.${s.intensity}`)}</span> },
    { key: 'action', header: '', cell: (s) => (
      <button onClick={() => navigate(`/coach/sessions/${s.id}`)} className="text-xs text-primary hover:underline">
        {t('sessions.markAttendance')}
      </button>
    )},
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('attendance.title')}
        description={t('attendance.sessionAttendance')}
      />
      <div className="flex items-center gap-3">
        <Select value={teamFilter} onValueChange={setTeamFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder={t('common.all')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('common.all')}</SelectItem>
            {teams?.data?.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          <DataTable
            columns={columns}
            data={sessions?.data ?? []}
            loading={isLoading}
            emptyTitle={t('common.noData')}
            emptyDescription={t('common.noData')}
          />
        </CardContent>
      </Card>
    </div>
  )
}
