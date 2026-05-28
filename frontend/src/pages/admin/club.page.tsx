import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Building2, Users, UserCheck, Trophy } from 'lucide-react'
import { toast } from 'sonner'
import { clubsApi } from '@/shared/api/clubs.api'
import { queryKeys } from '@/shared/api/query-keys'
import { useAuthStore } from '@/app/store/auth.store'
import {
  PageHeader, Card, CardContent, CardHeader, CardTitle, Button, Input, Label, Skeleton,
} from '@/shared/ui'
import { StatCard } from '@/shared/ui/stat-card'

export function ClubPage() {
  const { t } = useTranslation()
  const { user } = useAuthStore()
  const qc = useQueryClient()
  const [editing, setEditing] = React.useState(false)

  const { data: dashboard, isLoading } = useQuery({
    queryKey: queryKeys.clubs.dashboard(user?.clubId ?? ''),
    queryFn: () => clubsApi.getClubDashboard(user?.clubId ?? ''),
    enabled: !!user?.clubId,
  })

  const { data: club } = useQuery({
    queryKey: queryKeys.clubs.detail(user?.clubId ?? ''),
    queryFn: () => clubsApi.getClub(user?.clubId ?? ''),
    enabled: !!user?.clubId,
  })

  const [form, setForm] = React.useState({ name: '', city: '', country: '' })
  React.useEffect(() => {
    if (club) setForm({ name: club.name, city: club.city ?? '', country: club.country ?? '' })
  }, [club])

  const { mutate: updateClub, isPending } = useMutation({
    mutationFn: (data: typeof form) => clubsApi.updateClub(user?.clubId ?? '', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.clubs.detail(user?.clubId ?? '') })
      qc.invalidateQueries({ queryKey: queryKeys.clubs.dashboard(user?.clubId ?? '') })
      toast.success(t('common.success'))
      setEditing(false)
    },
    onError: () => toast.error(t('common.error')),
  })

  if (!user?.clubId) {
    return (
      <div className="space-y-6">
        <PageHeader title={t('nav.admin.dashboard')} description={t('admin.clubManagement')} />
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <p>{t('admin.noClubLinked')}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader title={t('nav.admin.dashboard')} description={t('admin.clubManagement')} />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title={t('teams.title')} value={dashboard?.teamCount ?? 0} icon={Users} loading={isLoading} />
        <StatCard title={t('players.title')} value={dashboard?.playerCount ?? 0} icon={UserCheck} loading={isLoading} />
        <StatCard title={t('admin.coaches')} value={dashboard?.coachCount ?? 0} icon={UserCheck} loading={isLoading} />
        <StatCard title={t('common.avg') + ' ' + t('players.devIndex')} value={
          dashboard?.teamStats?.length
            ? Math.round(dashboard.teamStats.reduce((a, row) => a + row.avgDevIndex, 0) / dashboard.teamStats.length)
            : 0
        } icon={Trophy} loading={isLoading} />
      </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">{t('admin.clubDetails')}</CardTitle>
            {!editing && <Button variant="outline" onClick={() => setEditing(true)}>{t('common.edit')}</Button>}
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">{[1,2,3].map((i) => <Skeleton key={i} className="h-11 w-full" />)}</div>
            ) : editing ? (
              <div className="space-y-5">
                <div className="space-y-2">
                  <Label className="text-base">{t('admin.clubName')}</Label>
                  <Input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
                  <p className="text-sm text-muted-foreground">Название клуба, отображаемое во всей системе</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-base">{t('admin.city')}</Label>
                    <Input value={form.city} onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-base">{t('admin.country')}</Label>
                    <Input value={form.country} onChange={(e) => setForm((p) => ({ ...p, country: e.target.value }))} />
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button onClick={() => updateClub(form)} disabled={isPending} className="h-11 px-6">{t('common.save')}</Button>
                  <Button variant="outline" onClick={() => setEditing(false)} className="h-11 px-6">{t('common.cancel')}</Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-primary/10">
                    <Building2 className="h-7 w-7 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{club?.name ?? '—'}</p>
                    <p className="text-base text-muted-foreground">{[club?.city, club?.country].filter(Boolean).join(', ') || t('common.noData')}</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

      {dashboard?.teamStats && dashboard.teamStats.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-lg">{t('teamOverview.teamOverview')}</CardTitle></CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-base">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-semibold">{t('teams.teamName')}</th>
                    <th className="text-right py-3 px-4 font-semibold">{t('teamDetail.players')}</th>
                    <th className="text-right py-3 px-4 font-semibold">{t('teamDetail.avgAttendance')}</th>
                    <th className="text-right py-3 px-4 font-semibold">{t('teamDetail.avgDevIndex')}</th>
                  </tr>
                </thead>
                <tbody>
                  {dashboard.teamStats.map((stat, idx) => (
                    <tr key={stat.teamID} className={`border-b ${idx % 2 === 1 ? 'bg-muted/30' : ''}`}>
                      <td className="py-3 px-4 font-medium">{stat.teamName}</td>
                      <td className="py-3 px-4 text-right">{stat.playerCount}</td>
                      <td className="py-3 px-4 text-right">{Math.round(stat.avgAttendance)}%</td>
                      <td className="py-3 px-4 text-right font-medium text-primary">{Math.round(stat.avgDevIndex)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
