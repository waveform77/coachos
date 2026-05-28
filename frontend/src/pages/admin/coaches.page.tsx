import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { UserCheck, Mail, Phone } from 'lucide-react'
import { PageHeader, Card, CardContent, Badge, Avatar, AvatarFallback, Skeleton } from '@/shared/ui'
import { EmptyState } from '@/shared/ui/empty-state'
import { getInitials } from '@/shared/lib/utils'
import { authApi } from '@/shared/api/auth.api'
import { queryKeys } from '@/shared/api/query-keys'
import { useAuthStore } from '@/app/store/auth.store'

export function CoachesPage() {
  const { t } = useTranslation()
  const { user } = useAuthStore()
  const clubId = user?.clubId ?? user?.clubId
  const { data: coaches, isLoading, isError, error, refetch } = useQuery({
    queryKey: queryKeys.users.list({ role: 'coach', clubId }),
    queryFn: () => authApi.listUsers({ role: 'coach', limit: 100, page: 1 }),
    enabled: !!clubId,
  })

  if (!clubId) {
    return (
      <div className="space-y-6">
        <PageHeader title={t('admin.coaches')} description={t('admin.coachList')} />
        <EmptyState icon={UserCheck} title={t('common.noData')} description={t('admin.noClubLinked')} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader title={t('admin.coaches')} description={t('admin.coachList')} />

      {isError ? (
        <EmptyState
          icon={UserCheck}
          title={t('common.error')}
          description={[error instanceof Error ? error.message : null, t('admin.coachesLoadError')].filter(Boolean).join(' — ')}
          action={{ label: t('common.retry'), onClick: () => void refetch() }}
        />
      ) : isLoading ? (
        <div className="space-y-3">{[1,2,3,4].map((i) => <Skeleton key={i} className="h-20 w-full rounded-lg" />)}</div>
      ) : coaches?.length ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {coaches.map((coach) => (
            <Card key={coach.id}>
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  <Avatar className="h-14 w-14">
                    <AvatarFallback className="bg-emerald-100 text-emerald-800 text-lg font-semibold">
                      {getInitials(coach.firstName, coach.lastName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-lg font-semibold">{coach.firstName} {coach.lastName}</p>
                    <Badge variant="secondary" className="mt-1">{t('commonEnums.roles.coach')}</Badge>
                    <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1.5"><Mail className="h-4 w-4" />{coach.email}</div>
                      {coach.phone && <div className="flex items-center gap-1.5"><Phone className="h-4 w-4" />{coach.phone}</div>}
                    </div>
                  </div>
                  <Badge variant={coach.isActive ? 'default' : 'secondary'} className="shrink-0">
                    {coach.isActive ? t('common.active') : t('common.inactive')}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState icon={UserCheck} title={t('common.noData')} description={t('admin.addCoach')} />
      )}
    </div>
  )
}
