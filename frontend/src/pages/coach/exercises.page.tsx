import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Search } from 'lucide-react'
import { toast } from 'sonner'
import { exercisesApi } from '@/shared/api/exercises.api'
import { queryKeys } from '@/shared/api/query-keys'
import { ExerciseCard } from '@/entities/exercise/exercise-card'
import {
  PageHeader, Button, Input, Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
  Badge, Skeleton,
} from '@/shared/ui'
import { EmptyState } from '@/shared/ui/empty-state'
import { Dumbbell } from 'lucide-react'
import { ExerciseForm } from '@/features/exercises/exercise-form'
import { useDebounce } from '@/shared/lib/hooks'
import type { ExerciseCategory } from '@/shared/types'

const getCategories = (t: (key: string) => string): { value: ExerciseCategory | 'all'; label: string }[] => [
  { value: 'all', label: t('common.all') },
  { value: 'technique', label: t('exercises.technique') },
  { value: 'tactics', label: t('exercises.tactics') },
  { value: 'physical', label: t('exercises.physical') },
  { value: 'coordination', label: t('exercises.coordination') },
  { value: 'goalkeeping', label: t('exercises.goalkeeping') },
  { value: 'warmup', label: t('exercises.warmup') },
  { value: 'cooldown', label: t('exercises.cooldown') },
]

export function ExercisesPage() {
  const { t } = useTranslation()
  const qc = useQueryClient()
  const [search, setSearch] = React.useState('')
  const [category, setCategory] = React.useState<ExerciseCategory | 'all'>('all')
  const [open, setOpen] = React.useState(false)
  const debouncedSearch = useDebounce(search)
  const CATEGORIES = getCategories(t)

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.exercises.all({ category: category !== 'all' ? category : undefined, search: debouncedSearch }),
    queryFn: () => exercisesApi.listExercises({
      category: category !== 'all' ? category : undefined,
      limit: 100,
    }),
  })

  const { mutate: createExercise, isPending } = useMutation({
    mutationFn: exercisesApi.createExercise,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.exercises.all() })
      toast.success(t('common.success'))
      setOpen(false)
    },
    onError: () => toast.error(t('common.error')),
  })

  const filtered = data?.data?.filter((e) =>
    e.name.toLowerCase().includes(debouncedSearch.toLowerCase())
  ) ?? []

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('exercises.library')}
        description={`${data?.data?.length ?? 0} ${t('exercises.title')}`}
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2"><Plus className="h-4 w-4" />{t('exercises.addExercise')}</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader><DialogTitle>{t('exercises.addExercise')}</DialogTitle></DialogHeader>
              <ExerciseForm
                loading={isPending}
                onSubmit={async (v) => {
                  const payload = { ...v, isGlobal: false, durationMin: typeof v.durationMin === 'number' ? v.durationMin : undefined }
                  createExercise(payload as Partial<import('@/shared/types').Exercise>)
                }}
              />
            </DialogContent>
          </Dialog>
        }
      />

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t('exercises.searchPlaceholder')} className="pl-9" />
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((c) => (
          <button key={c.value} onClick={() => setCategory(c.value)}>
            <Badge
              variant={category === c.value ? 'default' : 'outline'}
              className="cursor-pointer text-sm py-1 px-3"
            >
              {c.label}
            </Badge>
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[1,2,3,4,5,6,7,8].map((i) => <Skeleton key={i} className="h-40 rounded-lg" />)}
        </div>
      ) : filtered.length ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((ex) => (
            <ExerciseCard key={ex.id} exercise={ex} onClick={() => {}} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Dumbbell}
          title={t('common.noData')}
          description={t('exercises.addExercise')}
          action={{ label: t('exercises.addExercise'), onClick: () => setOpen(true) }}
        />
      )}
    </div>
  )
}
