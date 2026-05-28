import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Search, ChevronDown, ChevronUp } from 'lucide-react'
import { toast } from 'sonner'
import { assessmentsApi } from '@/shared/api/assessments.api'
import { playersApi } from '@/shared/api/players.api'
import { queryKeys } from '@/shared/api/query-keys'
import { useAuthStore } from '@/app/store/auth.store'
import {
  PageHeader, Button, Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
  Card, CardContent, CardHeader, CardTitle,
} from '@/shared/ui'
import { AssessmentForm } from '@/features/players/assessment-form'
import { SkillRadarChart } from '@/entities/player/skill-radar-chart'
import { formatDate } from '@/shared/lib/utils'
import { useDebounce } from '@/shared/lib/hooks'

export function AssessmentsPage() {
  const { t } = useTranslation()
  const { user } = useAuthStore()
  const qc = useQueryClient()
  const [selectedPlayerId, setSelectedPlayerId] = React.useState<string>('')
  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState('')
  const debouncedSearch = useDebounce(search)

  const { data: players } = useQuery({
    queryKey: queryKeys.players.all({ clubId: user?.clubId }),
    queryFn: () => playersApi.listPlayers({ clubId: user?.clubId, limit: 100 }),
  })

  const didAutoSelectPlayer = React.useRef(false)
  React.useEffect(() => {
    const list = players?.data
    if (didAutoSelectPlayer.current || !list?.length) return
    setSelectedPlayerId(list[0].id)
    didAutoSelectPlayer.current = true
  }, [players?.data])

  const { data: assessments, isLoading } = useQuery({
    queryKey: queryKeys.assessments.player(selectedPlayerId),
    queryFn: () => assessmentsApi.getPlayerAssessments(selectedPlayerId),
    enabled: !!selectedPlayerId,
  })

  const { mutate: createAssessment, isPending } = useMutation({
    mutationFn: assessmentsApi.createAssessment,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.assessments.player(selectedPlayerId) })
      toast.success(t('common.success'))
      setOpen(false)
    },
    onError: () => toast.error(t('common.error')),
  })

  const filteredPlayers = players?.data?.filter((p) =>
    `${p.firstName} ${p.lastName}`.toLowerCase().includes(debouncedSearch.toLowerCase())
  ) ?? []

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('assessments.title')}
        description={t('assessments.assessmentHistory')}
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2" disabled={!selectedPlayerId}>
                <Plus className="h-4 w-4" />{t('assessments.addAssessment')}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader><DialogTitle>{t('assessments.addAssessment')}</DialogTitle></DialogHeader>
              <AssessmentForm
                loading={isPending}
                onSubmit={async (v) => createAssessment({
                  ...v, playerID: selectedPlayerId, coachID: user?.id ?? '', assessedAt: new Date().toISOString(),
                })}
              />
            </DialogContent>
          </Dialog>
        }
      />

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t('players.searchPlaceholder')} className="pl-9" />
        </div>
        <Select value={selectedPlayerId} onValueChange={setSelectedPlayerId}>
          <SelectTrigger className="w-full sm:w-64">
            <SelectValue placeholder={t('analytics.selectPlayers')} />
          </SelectTrigger>
          <SelectContent>
            {filteredPlayers.map((p) => (
              <SelectItem key={p.id} value={p.id}>{p.firstName} {p.lastName}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedPlayerId ? (
        isLoading ? (
          <div className="text-center text-muted-foreground py-8">{t('common.loading')}</div>
        ) : assessments?.length ? (
          <AssessmentList assessments={assessments} />
        ) : (
          <div className="text-center text-muted-foreground py-8">{t('assessments.noAssessments')}</div>
        )
      ) : (
        <div className="text-center text-muted-foreground py-12">{t('assessments.selectPlayer')}</div>
      )}
    </div>
  )
}

function AssessmentList({ assessments }: { assessments: Array<{
  id: string
  playerID: string
  coachID: string
  assessedAt: string
  technical: number
  physical: number
  tactical: number
  discipline: number
  teamwork: number
  notes?: string
}> }) {
  const { t } = useTranslation()
  const [expandedId, setExpandedId] = React.useState<string | null>(null)

  const skills = [
    { key: 'technical', color: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400' },
    { key: 'physical', color: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400' },
    { key: 'tactical', color: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400' },
    { key: 'discipline', color: 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-400' },
    { key: 'teamwork', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400' },
  ] as const

  return (
    <div className="space-y-3">
      {assessments.map((a, idx) => {
        const isExpanded = expandedId === a.id
        return (
          <Card key={a.id} className="overflow-hidden">
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{formatDate(a.assessedAt)}</p>
                  <p className="text-xs text-muted-foreground">
                    {idx < assessments.length - 1 ? t('assessments.vsPrevious') : t('assessments.firstAssessment')}
                  </p>
                </div>
                <button
                  onClick={() => setExpandedId(isExpanded ? null : a.id)}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  {isExpanded ? t('common.collapse') : t('assessments.showRadar')}
                </button>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {skills.map((s) => (
                  <div key={s.key} className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${s.color}`}>
                    <span>{t(`assessments.${s.key}`)}</span>
                    <span className="font-bold">{a[s.key as keyof typeof a] as number}</span>
                  </div>
                ))}
              </div>
              {a.notes && <p className="mt-3 text-sm text-muted-foreground">{a.notes}</p>}
            </div>
            {isExpanded && (
              <div className="border-t px-4 pb-4 pt-4">
                <SkillRadarChart assessment={a} previous={assessments[idx + 1]} height={240} />
              </div>
            )}
          </Card>
        )
      })}
    </div>
  )
}
