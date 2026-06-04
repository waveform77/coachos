import * as React from 'react'
import { DndContext, closestCenter, type DragEndEvent } from '@dnd-kit/core'
import { SortableContext, useSortable, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Plus, GripVertical, Trash2, Clock, ChevronDown, ChevronUp, ArrowUp, ArrowDown, Timer, Layers, Repeat } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import type { TrainingBlock, Exercise, BlockKind } from '@/shared/types'
import { cn, capitalize } from '@/shared/lib/utils'
import { Button, Badge, Input, Card, CardContent, CardHeader, CardTitle } from '@/shared/ui'
import { sessionsApi } from '@/shared/api/sessions.api'

interface LocalExercise {
  id: string
  exerciseID: string
  name: string
  durationMin?: number
  sets?: number
  reps?: number
  orderIndex: number
}

interface LocalBlock extends Omit<TrainingBlock, 'exercises'> {
  exercises: LocalExercise[]
  expanded: boolean
}

interface SessionBuilderProps {
  sessionId: string
  initialBlocks?: TrainingBlock[]
  exercises: Exercise[]
  readOnly?: boolean
  onSave?: () => void
}

const BLOCK_KINDS: BlockKind[] = ['warmup', 'main', 'game', 'cooldown']

const BLOCK_COLORS: Record<BlockKind, string> = {
  warmup: 'border-l-yellow-400',
  main: 'border-l-emerald-500',
  game: 'border-l-blue-500',
  cooldown: 'border-l-purple-400',
}

function SortableExercise({
  ex, onRemove, onUpdate, readOnly, t,
}: {
  ex: LocalExercise
  onRemove: () => void
  onUpdate: (patch: Partial<LocalExercise>) => void
  readOnly?: boolean
  t: (key: string) => string
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: ex.id })

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn('flex flex-col gap-2 rounded-md bg-muted/50 px-3 py-2', isDragging && 'opacity-50')}
    >
      <div className="flex items-center gap-2">
        {!readOnly && (
          <button {...attributes} {...listeners} className="cursor-grab text-muted-foreground hover:text-foreground shrink-0">
            <GripVertical className="h-3 w-3" />
          </button>
        )}
        <span className="flex-1 text-sm font-medium truncate">{ex.name}</span>
        {!readOnly && (
          <button onClick={onRemove} className="text-muted-foreground hover:text-destructive shrink-0">
            <Trash2 className="h-3 w-3" />
          </button>
        )}
      </div>
      <div className="flex items-center gap-3 pl-5">
        <div className="flex items-center gap-1.5" title={t('common.duration')}>
          <Timer className="h-3.5 w-3.5 text-muted-foreground" />
          <Input
            type="number"
            min={1}
            max={180}
            value={ex.durationMin ?? ''}
            onChange={(e) => onUpdate({ durationMin: e.target.value === '' ? undefined : Number(e.target.value) })}
            disabled={readOnly}
            className="h-7 w-[52px] text-xs px-1.5"
          />
        </div>
        <div className="flex items-center gap-1.5" title={t('sessions.sets')}>
          <Layers className="h-3.5 w-3.5 text-muted-foreground" />
          <Input
            type="number"
            min={1}
            max={20}
            value={ex.sets ?? ''}
            onChange={(e) => onUpdate({ sets: e.target.value === '' ? undefined : Number(e.target.value) })}
            disabled={readOnly}
            className="h-7 w-[44px] text-xs px-1.5"
          />
        </div>
        <div className="flex items-center gap-1.5" title={t('sessions.reps')}>
          <Repeat className="h-3.5 w-3.5 text-muted-foreground" />
          <Input
            type="number"
            min={1}
            max={100}
            value={ex.reps ?? ''}
            onChange={(e) => onUpdate({ reps: e.target.value === '' ? undefined : Number(e.target.value) })}
            disabled={readOnly}
            className="h-7 w-[44px] text-xs px-1.5"
          />
        </div>
      </div>
    </div>
  )
}

function SortableBlock({
  block, exercises, onToggle, onAddExercise, onRemoveExercise, onUpdateExercise, onRemoveBlock, onMoveExercise, readOnly, t,
}: {
  block: LocalBlock
  exercises: Exercise[]
  onToggle: () => void
  onAddExercise: (exerciseId: string) => void
  onRemoveExercise: (exerciseId: string) => void
  onUpdateExercise: (exerciseId: string, patch: Partial<LocalExercise>) => void
  onRemoveBlock: () => void
  onMoveExercise: (exerciseId: string, direction: -1 | 1) => void
  readOnly?: boolean
  t: (key: string) => string
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: block.id })
  const [search, setSearch] = React.useState('')
  const [showPicker, setShowPicker] = React.useState(false)

  const filtered = exercises.filter((e) => e.name.toLowerCase().includes(search.toLowerCase()))
  const totalDuration = block.exercises.reduce((acc, e) => acc + (e.durationMin ?? 0), 0)

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn('opacity-100', isDragging && 'opacity-50')}
    >
      <Card className={cn('border-l-4', BLOCK_COLORS[block.kind])}>
        <CardHeader className="pb-2 pt-3">
          <div className="flex items-center gap-2">
            {!readOnly && (
              <button {...attributes} {...listeners} className="cursor-grab text-muted-foreground hover:text-foreground">
                <GripVertical className="h-4 w-4" />
              </button>
            )}
            <Badge variant="outline" className="capitalize">{block.kind}</Badge>
            {totalDuration > 0 && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />{totalDuration}min
              </span>
            )}
            <div className="ml-auto flex items-center gap-2">
              {!readOnly && (
                <button onClick={onRemoveBlock} className="text-muted-foreground hover:text-destructive">
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
              <button onClick={onToggle} className="text-muted-foreground">
                {block.expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </CardHeader>
        {block.expanded && (
          <CardContent className="pb-3">
            {block.exercises.length > 0 && (
              <SortableContext items={block.exercises.map((e) => e.id)} strategy={verticalListSortingStrategy}>
                <div className="mb-3 space-y-2">
                  {block.exercises.map((ex) => (
                    <SortableExercise
                      key={ex.id}
                      ex={ex}
                      readOnly={readOnly}
                      t={t}
                      onRemove={() => onRemoveExercise(ex.id)}
                      onUpdate={(patch) => onUpdateExercise(ex.id, patch)}
                    />
                  ))}
                </div>
              </SortableContext>
            )}
            {!readOnly && (
              <div>
                {showPicker ? (
                  <div className="space-y-2">
                    <Input
                      placeholder={t('exercises.searchPlaceholder')}
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="h-8 text-sm"
                    />
                    <div className="max-h-40 overflow-y-auto space-y-1">
                      {filtered.slice(0, 20).map((ex) => (
                        <button
                          key={ex.id}
                          type="button"
                          className="w-full text-left rounded px-2 py-1.5 text-sm hover:bg-accent flex items-center justify-between"
                          onClick={() => { onAddExercise(ex.id); setShowPicker(false); setSearch('') }}
                        >
                          <span>{ex.name}</span>
                          <Badge variant="outline" className="text-xs capitalize">{ex.category}</Badge>
                        </button>
                      ))}
                      {filtered.length === 0 && <p className="text-sm text-muted-foreground px-2">{t('sessions.noExercisesFound')}</p>}
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => setShowPicker(false)} className="w-full">{t('common.cancel')}</Button>
                  </div>
                ) : (
                  <Button variant="outline" size="sm" onClick={() => setShowPicker(true)} className="w-full gap-1">
                    <Plus className="h-3 w-3" />{t('sessions.addExercise')}
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        )}
      </Card>
    </div>
  )
}

export function SessionBuilder({ sessionId, initialBlocks, exercises, readOnly, onSave }: SessionBuilderProps) {
  const { t } = useTranslation()
  const [blocks, setBlocks] = React.useState<LocalBlock[]>(() =>
    (initialBlocks ?? []).map((b) => ({
      ...b,
      expanded: true,
      exercises: (b.exercises ?? []).map((e) => ({
        id: e.id,
        exerciseID: e.exerciseID,
        name: e.exercise?.name ?? 'Unknown',
        durationMin: e.durationMin,
        sets: (e as any).sets,
        reps: (e as any).reps,
        orderIndex: e.orderIndex,
      })),
    }))
  )

  React.useEffect(() => {
    setBlocks(
      (initialBlocks ?? []).map((b) => ({
        ...b,
        expanded: true,
        exercises: (b.exercises ?? []).map((e) => ({
          id: e.id,
          exerciseID: e.exerciseID,
          name: e.exercise?.name ?? 'Unknown',
          durationMin: e.durationMin,
          sets: (e as any).sets,
          reps: (e as any).reps,
          orderIndex: e.orderIndex,
        })),
      }))
    )
  }, [initialBlocks])
  const [saving, setSaving] = React.useState(false)

  const totalDuration = blocks.reduce((acc, b) =>
    acc + b.exercises.reduce((a, e) => a + (e.durationMin ?? 0), 0), 0
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const isBlock = blocks.some((b) => b.id === active.id)
    if (isBlock) {
      setBlocks((prev) => {
        const oldIdx = prev.findIndex((b) => b.id === active.id)
        const newIdx = prev.findIndex((b) => b.id === over.id)
        return arrayMove(prev, oldIdx, newIdx)
      })
      return
    }

    setBlocks((prev) => {
      return prev.map((block) => {
        const exIdx = block.exercises.findIndex((e) => e.id === active.id)
        const overIdx = block.exercises.findIndex((e) => e.id === over.id)
        if (exIdx === -1 || overIdx === -1) return block
        return { ...block, exercises: arrayMove(block.exercises, exIdx, overIdx) }
      })
    })
  }

  const addBlock = (kind: BlockKind) => {
    const newBlock: LocalBlock = {
      id: `temp-${Date.now()}`,
      sessionID: sessionId,
      kind,
      orderIndex: blocks.length,
      exercises: [],
      expanded: true,
    }
    setBlocks((prev) => [...prev, newBlock])
  }

  const removeBlock = (blockId: string) => setBlocks((prev) => prev.filter((b) => b.id !== blockId))

  const toggleBlock = (blockId: string) => setBlocks((prev) =>
    prev.map((b) => b.id === blockId ? { ...b, expanded: !b.expanded } : b)
  )

  const addExerciseToBlock = (blockId: string, exerciseId: string) => {
    const exercise = exercises.find((e) => e.id === exerciseId)
    if (!exercise) return
    const newEx: LocalExercise = {
      id: `ex-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      exerciseID: exerciseId,
      name: exercise.name,
      durationMin: exercise.durationMin ?? 10,
      sets: 3,
      reps: 10,
      orderIndex: 0,
    }
    setBlocks((prev) => prev.map((b) => b.id === blockId ? { ...b, exercises: [...b.exercises, newEx] } : b))
  }

  const removeExercise = (blockId: string, exerciseId: string) => {
    setBlocks((prev) => prev.map((b) =>
      b.id === blockId ? { ...b, exercises: b.exercises.filter((e) => e.id !== exerciseId) } : b
    ))
  }

  const updateExercise = (blockId: string, exerciseId: string, patch: Partial<LocalExercise>) => {
    setBlocks((prev) => prev.map((b) =>
      b.id === blockId ? { ...b, exercises: b.exercises.map((e) => e.id === exerciseId ? { ...e, ...patch } : e) } : b
    ))
  }

  const moveExercise = (blockId: string, exerciseId: string, direction: -1 | 1) => {
    setBlocks((prev) => prev.map((b) => {
      if (b.id !== blockId) return b
      const idx = b.exercises.findIndex((e) => e.id === exerciseId)
      if (idx === -1) return b
      const newIdx = idx + direction
      if (newIdx < 0 || newIdx >= b.exercises.length) return b
      return { ...b, exercises: arrayMove(b.exercises, idx, newIdx) }
    }))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const payload = blocks.map((block, blockIdx) => ({
        kind: block.kind,
        orderIndex: blockIdx,
        durationMin: block.exercises.reduce((a, e) => a + (e.durationMin ?? 0), 0),
        notes: '',
        exercises: block.exercises.map((ex, exIdx) => ({
          exerciseID: ex.exerciseID,
          orderIndex: exIdx,
          durationMin: ex.durationMin,
          sets: ex.sets,
          reps: ex.reps,
          intensityOverride: '',
        })),
      }))

      await sessionsApi.saveBlocks(sessionId, { blocks: payload })
      onSave?.()
      toast.success(t('sessions.sessionSaved'))
    } catch {
      toast.error(t('sessions.sessionSaveFailed'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          <span>{t('sessions.totalDuration')}: <strong className="text-foreground">{totalDuration} {t('common.min')}</strong></span>
          <span>·</span>
          <span><strong className="text-foreground">{blocks.length}</strong> {t('sessions.blocks').toLowerCase()}</span>
          <span>·</span>
          <span><strong className="text-foreground">{blocks.reduce((acc, b) => acc + b.exercises.length, 0)}</strong> {t('sessions.exercises').toLowerCase()}</span>
        </div>
        {!readOnly && <Button onClick={handleSave} disabled={saving} size="sm">{saving ? t('common.sending') : t('common.save')}</Button>}
      </div>

      <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={blocks.map((b) => b.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-3">
            {blocks.map((block) => (
              <SortableBlock
                key={block.id}
                block={block}
                exercises={exercises}
                onToggle={() => toggleBlock(block.id)}
                onAddExercise={(exId) => addExerciseToBlock(block.id, exId)}
                onRemoveExercise={(exId) => removeExercise(block.id, exId)}
                onUpdateExercise={(exId, patch) => updateExercise(block.id, exId, patch)}
                onRemoveBlock={() => removeBlock(block.id)}
                onMoveExercise={(exId, dir) => moveExercise(block.id, exId, dir)}
                readOnly={readOnly}
                t={t}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {!readOnly && (
        <div className="flex flex-wrap gap-2">
          {BLOCK_KINDS.filter((k) => !blocks.find((b) => b.kind === k)).map((kind) => (
            <Button key={kind} variant="outline" size="sm" onClick={() => addBlock(kind)} className="gap-1">
              <Plus className="h-3 w-3" />{capitalize(kind)}
            </Button>
          ))}
        </div>
      )}
    </div>
  )
}
