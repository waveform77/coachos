import * as React from 'react'
import { DndContext, closestCenter, type DragEndEvent } from '@dnd-kit/core'
import { SortableContext, useSortable, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Plus, GripVertical, Trash2, Clock, ChevronDown, ChevronUp } from 'lucide-react'
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

function SortableBlock({
  block, exercises, onToggle, onAddExercise, onRemoveExercise, onRemoveBlock, readOnly,
}: {
  block: LocalBlock
  exercises: Exercise[]
  onToggle: () => void
  onAddExercise: (exerciseId: string) => void
  onRemoveExercise: (exerciseId: string) => void
  onRemoveBlock: () => void
  readOnly?: boolean
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
              <div className="mb-3 space-y-2">
                {block.exercises.map((ex) => (
                  <div key={ex.id} className="flex items-center gap-2 rounded-md bg-muted/50 px-3 py-2">
                    <span className="flex-1 text-sm">{ex.name}</span>
                    {ex.durationMin && (
                      <span className="text-xs text-muted-foreground">{ex.durationMin}min</span>
                    )}
                    {!readOnly && (
                      <button onClick={() => onRemoveExercise(ex.id)} className="text-muted-foreground hover:text-destructive">
                        <Trash2 className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
            {!readOnly && (
              <div>
                {showPicker ? (
                  <div className="space-y-2">
                    <Input
                      placeholder="Search exercises..."
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
                      {filtered.length === 0 && <p className="text-sm text-muted-foreground px-2">No exercises found</p>}
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => setShowPicker(false)} className="w-full">Cancel</Button>
                  </div>
                ) : (
                  <Button variant="outline" size="sm" onClick={() => setShowPicker(true)} className="w-full gap-1">
                    <Plus className="h-3 w-3" />Add exercise
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

export function SessionBuilder({ sessionId, initialBlocks = [], exercises, readOnly, onSave }: SessionBuilderProps) {
  const [blocks, setBlocks] = React.useState<LocalBlock[]>(() =>
    initialBlocks.map((b) => ({
      ...b,
      expanded: true,
      exercises: (b.exercises ?? []).map((e) => ({
        id: e.id,
        exerciseID: e.exerciseID,
        name: e.exercise?.name ?? 'Unknown',
        durationMin: e.durationMin,
        orderIndex: e.orderIndex,
      })),
    }))
  )
  const [saving, setSaving] = React.useState(false)

  const totalDuration = blocks.reduce((acc, b) =>
    acc + b.exercises.reduce((a, e) => a + (e.durationMin ?? 0), 0), 0
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (over && active.id !== over.id) {
      setBlocks((prev) => {
        const oldIdx = prev.findIndex((b) => b.id === active.id)
        const newIdx = prev.findIndex((b) => b.id === over.id)
        return arrayMove(prev, oldIdx, newIdx)
      })
    }
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
      id: `ex-${Date.now()}`,
      exerciseID: exerciseId,
      name: exercise.name,
      durationMin: exercise.durationMin,
      orderIndex: 0,
    }
    setBlocks((prev) => prev.map((b) => b.id === blockId ? { ...b, exercises: [...b.exercises, newEx] } : b))
  }

  const removeExercise = (blockId: string, exerciseId: string) => {
    setBlocks((prev) => prev.map((b) =>
      b.id === blockId ? { ...b, exercises: b.exercises.filter((e) => e.id !== exerciseId) } : b
    ))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      for (const block of blocks) {
        if (block.id.startsWith('temp-')) {
          await sessionsApi.addBlock(sessionId, { kind: block.kind, orderIndex: block.orderIndex })
        }
      }
      onSave?.()
      toast.success('Session saved')
    } catch {
      toast.error('Failed to save session')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          <span>Total: <strong className="text-foreground">{totalDuration} min</strong></span>
          <span>·</span>
          <span><strong className="text-foreground">{blocks.length}</strong> blocks</span>
        </div>
        {!readOnly && <Button onClick={handleSave} disabled={saving} size="sm">{saving ? 'Saving...' : 'Save Session'}</Button>}
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
                onRemoveBlock={() => removeBlock(block.id)}
                readOnly={readOnly}
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
