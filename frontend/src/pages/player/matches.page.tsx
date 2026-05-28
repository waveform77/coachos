import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Trophy, MapPin, Calendar, ArrowRight } from 'lucide-react'
import { matchesApi } from '@/shared/api/matches.api'
import { queryKeys } from '@/shared/api/query-keys'
import {
  PageHeader, Badge, Card, CardContent, Skeleton,
  Tabs, TabsContent, TabsList, TabsTrigger,
} from '@/shared/ui'
import { EmptyState } from '@/shared/ui'
import { formatDate, getStatusColor, capitalize } from '@/shared/lib/utils'

export function PlayerMatchesPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const { data: matches, isLoading } = useQuery({
    queryKey: queryKeys.matches.my(),
    queryFn: () => matchesApi.getMyMatches({ limit: 50 }),
  })

  const upcoming = matches?.data?.filter((m) => m.status === 'scheduled') ?? []
  const completed = matches?.data?.filter((m) => m.status === 'completed') ?? []
  const other = matches?.data?.filter((m) => !['scheduled', 'completed'].includes(m.status)) ?? []

  const MatchCard = ({ m }: { m: import('@/shared/types').Match }) => (
    <Card
      className="cursor-pointer hover:shadow-md transition-all"
      onClick={() => navigate(`/me/matches/${m.id}`)}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge className={getStatusColor(m.status)}>
                {t(`commonEnums.matchStatus.${m.status}`)}
              </Badge>
              <Badge variant={m.isHome ? 'default' : 'secondary'} className="text-xs">
                {m.isHome ? t('matches.home') : t('matches.away')}
              </Badge>
            </div>
            <h3 className="mt-2 font-semibold truncate">
              {m.isHome ? t('common.team') : m.opponent} vs {m.isHome ? m.opponent : t('common.team')}
            </h3>
            <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                {formatDate(m.kickoffAt, 'EEE, MMM d, yyyy HH:mm')}
              </span>
              {m.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  <span className="truncate">{m.location}</span>
                </span>
              )}
            </div>
            {m.status === 'completed' && (
              <div className="mt-2 flex items-center gap-2 text-lg font-bold">
                <span className="text-emerald-600">{m.goalsFor}</span>
                <span className="text-muted-foreground">:</span>
                <span className="text-red-500">{m.goalsAgainst}</span>
              </div>
            )}
          </div>
          <ArrowRight className="h-5 w-5 text-muted-foreground shrink-0 mt-1" />
        </div>
      </CardContent>
    </Card>
  )

  const MatchList = ({ list }: { list: import('@/shared/types').Match[] }) => (
    <div className="grid gap-3 sm:grid-cols-2">
      {list.map((m) => (
        <MatchCard key={m.id} m={m} />
      ))}
    </div>
  )

  return (
    <div className="space-y-6">
      <PageHeader title={t('playerPortal.matches') || 'Матчи'} description={t('playerPortal.matchesDesc') || 'Расписание и результаты ваших матчей'} />

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-28 w-full rounded-lg" />
          ))}
        </div>
      ) : matches?.data?.length === 0 ? (
        <EmptyState icon={Trophy} title={t('playerPortal.noMatches') || 'Нет матчей'} description={t('playerPortal.noMatchesHint') || 'Матчи вашей команды появятся здесь'} />
      ) : (
        <Tabs defaultValue="upcoming">
          <TabsList>
            <TabsTrigger value="upcoming">{t('matches.upcoming')} ({upcoming.length})</TabsTrigger>
            <TabsTrigger value="completed">{t('matches.completed')} ({completed.length})</TabsTrigger>
            <TabsTrigger value="other">{t('matches.other')} ({other.length})</TabsTrigger>
          </TabsList>
          <TabsContent value="upcoming" className="mt-4">
            {upcoming.length ? <MatchList list={upcoming} /> : <p className="text-center text-muted-foreground py-8">{t('common.noData')}</p>}
          </TabsContent>
          <TabsContent value="completed" className="mt-4">
            {completed.length ? <MatchList list={completed} /> : <p className="text-center text-muted-foreground py-8">{t('common.noData')}</p>}
          </TabsContent>
          <TabsContent value="other" className="mt-4">
            {other.length ? <MatchList list={other} /> : <p className="text-center text-muted-foreground py-8">{t('common.noData')}</p>}
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}
