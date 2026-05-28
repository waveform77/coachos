import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Search, LayoutGrid, List, Download, ArrowRightLeft } from 'lucide-react'
import { toast } from 'sonner'
import { playersApi } from '@/shared/api/players.api'
import { teamsApi } from '@/shared/api/teams.api'
import { queryKeys } from '@/shared/api/query-keys'
import { useAuthStore } from '@/app/store/auth.store'
import { PlayerCard } from '@/entities/player/player-card'
import {
  PageHeader, Button, Input, Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Skeleton, DataTable, Badge, type Column,
} from '@/shared/ui'
import { EmptyState } from '@/shared/ui/empty-state'
import { Users } from 'lucide-react'
import { PlayerForm } from '@/features/players/player-form'
import { PlayerComparison } from '@/features/players/player-comparison'
import { useDebounce } from '@/shared/lib/hooks'
import { capitalize, calculateAge } from '@/shared/lib/utils'
import { exportToCSV } from '@/shared/lib/export'
import type { Player } from '@/shared/types'

export function PlayersPage() {
  const { t } = useTranslation()
  const { user } = useAuthStore()
  const qc = useQueryClient()
  const [search, setSearch] = React.useState('')
  const [positionFilter, setPositionFilter] = React.useState<string>('all')
  const [viewMode, setViewMode] = React.useState<'grid' | 'list'>('grid')
  const [open, setOpen] = React.useState(false)
  const [compareOpen, setCompareOpen] = React.useState(false)
  const [compareA, setCompareA] = React.useState('')
  const [compareB, setCompareB] = React.useState('')
  const debouncedSearch = useDebounce(search)

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.players.all({ clubId: user?.clubId, position: positionFilter !== 'all' ? positionFilter : undefined }),
    queryFn: () => playersApi.listPlayers({ clubId: user?.clubId, limit: 100 }),
  })

  const { data: teamsData } = useQuery({
    queryKey: queryKeys.teams.all({ clubId: user?.clubId }),
    queryFn: () => teamsApi.listTeams({ clubId: user?.clubId, limit: 100 }),
  })

  const { mutate: createPlayer, isPending } = useMutation({
    mutationFn: async (payload: Parameters<typeof playersApi.createPlayer>[0] & { teamId?: string }) => {
      const { teamId, ...playerData } = payload
      const created = await playersApi.createPlayer(playerData)
      if (teamId) {
        await teamsApi.addMember(teamId, { playerID: created.id, position: created.position ?? undefined })
      }
      return created
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.players.all() })
      qc.invalidateQueries({ queryKey: queryKeys.teams.all() })
      toast.success(t('players.playerCreated'))
      setOpen(false)
    },
    onError: () => toast.error(t('common.error')),
  })

  const filtered = data?.data?.filter((p) => {
    const matchesSearch = `${p.firstName} ${p.lastName}`.toLowerCase().includes(debouncedSearch.toLowerCase())
    const matchesPosition = positionFilter === 'all' || p.position === positionFilter
    return matchesSearch && matchesPosition
  }) ?? []

  const columns: Column<Player>[] = [
    { key: 'name', header: t('players.playerCard'), cell: (p) => (
      <div className="flex items-center gap-2">
        <span className="font-medium">{p.firstName} {p.lastName}</span>
      </div>
    ) },
    { key: 'position', header: t('players.position'), cell: (p) => p.position ? <Badge variant="secondary">{t(`commonEnums.positions.${p.position}`)}</Badge> : '—' },
    { key: 'age', header: t('players.age'), cell: (p) => calculateAge(p.birthDate) ?? '—' },
    { key: 'devIndex', header: t('players.devIndex'), cell: (p) => (
      <span className={`font-bold ${p.devIndex >= 70 ? 'text-emerald-600' : p.devIndex >= 40 ? 'text-yellow-600' : 'text-red-500'}`}>
        {p.devIndex}
      </span>
    ) },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('players.title')}
        description={t('players.description', { count: data?.data?.length ?? 0 })}
        actions={
          <div className="flex items-center gap-2">
            <Dialog open={compareOpen} onOpenChange={setCompareOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="gap-2"><ArrowRightLeft className="h-4 w-4" />{t('players.compare')}</Button>
              </DialogTrigger>
              <DialogContent className="max-w-xl">
                <DialogHeader><DialogTitle>{t('playerComparison.title')}</DialogTitle></DialogHeader>
                <div className="grid grid-cols-2 gap-4">
                  <Select value={compareA} onValueChange={setCompareA}>
                    <SelectTrigger><SelectValue placeholder={t('playerComparison.selectFirst')} /></SelectTrigger>
                    <SelectContent>
                      {data?.data?.map((p) => <SelectItem key={p.id} value={p.id}>{p.firstName} {p.lastName}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Select value={compareB} onValueChange={setCompareB}>
                    <SelectTrigger><SelectValue placeholder={t('playerComparison.selectSecond')} /></SelectTrigger>
                    <SelectContent>
                      {data?.data?.map((p) => <SelectItem key={p.id} value={p.id}>{p.firstName} {p.lastName}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                {compareA && compareB && compareA !== compareB && (
                  <PlayerComparison
                    playerA={data!.data!.find((p) => p.id === compareA)!}
                    playerB={data!.data!.find((p) => p.id === compareB)!}
                    onClose={() => { setCompareA(''); setCompareB(''); setCompareOpen(false) }}
                  />
                )}
              </DialogContent>
            </Dialog>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2"><Plus className="h-5 w-5" />{t('players.addPlayer')}</Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg flex flex-col max-h-[90vh] p-0">
                <DialogHeader className="p-6 pb-2"><DialogTitle>{t('players.addPlayer')}</DialogTitle></DialogHeader>
                <div className="overflow-y-auto px-6 pb-6">
                  <PlayerForm
                    onSubmit={async (v) => createPlayer({ ...v, clubId: user?.clubId ?? '', devIndex: 50, heightCm: typeof v.heightCm === 'number' ? v.heightCm : undefined, weightKg: typeof v.weightKg === 'number' ? v.weightKg : undefined })}
                    loading={isPending}
                    teams={teamsData?.data?.map((t) => ({ id: t.id, name: t.name })) ?? []}
                  />
                </div>
              </DialogContent>
            </Dialog>
          </div>
        }
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t('players.searchPlaceholder')} className="pl-9" />
        </div>
        <Select value={positionFilter} onValueChange={setPositionFilter}>
          <SelectTrigger className="w-full sm:w-40"><SelectValue placeholder={t('players.position')} /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('common.all')}</SelectItem>
            {['goalkeeper', 'defender', 'midfielder', 'forward', 'universal'].map((p) => (
              <SelectItem key={p} value={p}>{t(`commonEnums.positions.${p}`)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex rounded-md border">
          <Button variant={viewMode === 'grid' ? 'secondary' : 'ghost'} onClick={() => setViewMode('grid')} className="rounded-r-none gap-2" title={t('players.viewGrid')}>
            <LayoutGrid className="h-5 w-5" /><span className="hidden sm:inline">{t('players.viewGrid')}</span>
          </Button>
          <Button variant={viewMode === 'list' ? 'secondary' : 'ghost'} onClick={() => setViewMode('list')} className="rounded-l-none border-l gap-2" title={t('players.viewList')}>
            <List className="h-5 w-5" /><span className="hidden sm:inline">{t('players.viewList')}</span>
          </Button>
        </div>
        <Button
          variant="outline"
          className="gap-2"
          onClick={() =>
            exportToCSV(
              filtered.map((p) => ({
                name: `${p.firstName} ${p.lastName}`,
                position: p.position ? t(`commonEnums.positions.${p.position}`) : '',
                age: calculateAge(p.birthDate) ?? '',
                devIndex: p.devIndex,
              })),
              [
                { key: 'name', label: t('players.playerCard') },
                { key: 'position', label: t('players.position') },
                { key: 'age', label: t('players.age') },
                { key: 'devIndex', label: t('players.devIndex') },
              ],
              'players'
            )
          }
        >
          <Download className="h-4 w-4" />
          <span className="hidden sm:inline">{t('common.exportCSV')}</span>
        </Button>
      </div>

      {isLoading ? (
        viewMode === 'grid' ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4">
            {[1,2,3,4,5,6,7,8].map((i) => <Skeleton key={i} className="h-32 rounded-lg" />)}
          </div>
        ) : (
          <Skeleton className="h-64 w-full rounded-lg" />
        )
      ) : filtered.length ? (
        viewMode === 'grid' ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4">
            {filtered.map((p) => <PlayerCard key={p.id} player={p} />)}
          </div>
        ) : (
          <DataTable columns={columns} data={filtered} />
        )
      ) : (
        <EmptyState icon={Users} title={t('common.noData')} description={t('players.addPlayer')}
          action={{ label: t('players.addPlayer'), onClick: () => setOpen(true) }} />
      )}
    </div>
  )
}
