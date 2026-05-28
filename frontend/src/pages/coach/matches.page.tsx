import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Plus, Trophy, MapPin, Calendar } from 'lucide-react'
import { toast } from 'sonner'
import { matchesApi } from '@/shared/api/matches.api'
import { teamsApi } from '@/shared/api/teams.api'
import { queryKeys } from '@/shared/api/query-keys'
import { useAuthStore } from '@/app/store/auth.store'
import {
  PageHeader, Button, Tabs, TabsContent, TabsList, TabsTrigger, Badge, Card, CardContent,
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, Skeleton,
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/shared/ui'
import { MatchForm } from '@/features/matches/match-form'
import { formatDate, getStatusColor, capitalize } from '@/shared/lib/utils'
import { EmptyState } from '@/shared/ui'

export function MatchesPage() {
  const { t } = useTranslation()
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [open, setOpen] = React.useState(false)
  const [teamFilter, setTeamFilter] = React.useState<string>('all')

  const { data: teams } = useQuery({
    queryKey: queryKeys.teams.all({ clubId: user?.clubId }),
    queryFn: () => teamsApi.listTeams({ clubId: user?.clubId }),
  })

  const { data: matches, isLoading } = useQuery({
    queryKey: queryKeys.matches.all({ teamId: teamFilter !== 'all' ? teamFilter : undefined }),
    queryFn: () => matchesApi.listMatches({ teamId: teamFilter !== 'all' ? teamFilter : undefined }),
  })

  const { mutate: createMatch, isPending } = useMutation({
    mutationFn: (data: Parameters<typeof matchesApi.createMatch>[0]) => matchesApi.createMatch({
      ...data,
      teamId: teamFilter !== 'all' ? teamFilter : (teams?.data?.[0]?.id ?? ''),
    } as any),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.matches.all() })
      toast.success(t('common.success'))
      setOpen(false)
    },
    onError: () => toast.error(t('common.error')),
  })

  const upcoming = matches?.data?.filter((m) => m.status === 'scheduled') ?? []
  const completed = matches?.data?.filter((m) => m.status === 'completed') ?? []
  const other = matches?.data?.filter((m) => !['scheduled', 'completed'].includes(m.status)) ?? []

  const MatchCard = ({ m }: { m: import('@/shared/types').Match }) => (
    <Card className="cursor-pointer hover:shadow-md transition-all" onClick={() => navigate(`/coach/matches/${m.id}`)}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge className={`text-xs ${getStatusColor(m.status)}`}>{t(`commonEnums.matchStatus.${m.status}`)}</Badge>
              <Badge variant={m.isHome ? 'default' : 'secondary'} className="text-xs">{m.isHome ? t('matches.home') : t('matches.away')}</Badge>
            </div>
            <p className="mt-2 text-sm font-semibold text-foreground">
              {teams?.data?.find((t) => t.id === m.teamID)?.name ?? t('common.team')}
            </p>
            <p className="mt-0.5 text-lg font-bold">vs {m.opponent}</p>
            <div className="mt-1.5 flex flex-wrap gap-3 text-sm text-muted-foreground">
              <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />{formatDate(m.kickoffAt, 'EEE MMM d, HH:mm')}</span>
              {m.location && <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{m.location}</span>}
            </div>
          </div>
          {m.status === 'completed' && (
            <div className="text-right shrink-0">
              <p className="text-2xl font-bold">{m.goalsFor} : {m.goalsAgainst}</p>
              <p className={`text-xs font-medium ${m.goalsFor > m.goalsAgainst ? 'text-emerald-600' : m.goalsFor < m.goalsAgainst ? 'text-red-500' : 'text-muted-foreground'}`}>
                {m.goalsFor > m.goalsAgainst ? t('matches.win') : m.goalsFor < m.goalsAgainst ? t('matches.loss') : t('matches.draw')}
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('matches.title')}
        description={t('matches.matchList')}
        actions={
          <div className="flex items-center gap-2">
            <Select value={teamFilter} onValueChange={setTeamFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder={t('common.all')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('common.all')}</SelectItem>
                {teams?.data?.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2"><Plus className="h-4 w-4" />{t('matches.addMatch')}</Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader><DialogTitle>{t('matches.addMatch')}</DialogTitle></DialogHeader>
                <MatchForm loading={isPending} onSubmit={async (v) => createMatch(v as Parameters<typeof matchesApi.createMatch>[0])} />
              </DialogContent>
            </Dialog>
          </div>
        }
      />

      <Tabs defaultValue="upcoming">
        <TabsList>
          <TabsTrigger value="upcoming">{t('matches.upcoming')} ({upcoming.length})</TabsTrigger>
          <TabsTrigger value="completed">{t('matches.completed')} ({completed.length})</TabsTrigger>
          {other.length > 0 && <TabsTrigger value="other">{t('common.all')} ({other.length})</TabsTrigger>}
        </TabsList>

        {[{ value: 'upcoming', data: upcoming }, { value: 'completed', data: completed }, { value: 'other', data: other }].map(({ value, data }) => (
          <TabsContent key={value} value={value} className="mt-4">
            {isLoading ? (
              <div className="space-y-3">{[1,2,3].map((i) => <Skeleton key={i} className="h-32 rounded-lg" />)}</div>
            ) : data.length ? (
              <div className="space-y-3">{data.map((m) => <MatchCard key={m.id} m={m} />)}</div>
            ) : (
              <EmptyState icon={Trophy} title={t('common.noData')} description={t('common.noData')} />
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
