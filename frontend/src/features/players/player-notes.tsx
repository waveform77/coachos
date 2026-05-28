import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Trash2, StickyNote } from 'lucide-react'
import { toast } from 'sonner'
import { coachNotesApi, type CreateCoachNoteRequest } from '@/shared/api/coach-notes.api'
import { queryKeys } from '@/shared/api/query-keys'
import {
  Button, Card, CardContent, CardHeader, CardTitle, Badge, Textarea,
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Skeleton,
} from '@/shared/ui'
import { EmptyState } from '@/shared/ui/empty-state'

const CATEGORIES: CreateCoachNoteRequest['category'][] = ['technique', 'tactics', 'physical', 'behavior', 'medical']

const CATEGORY_COLORS: Record<string, string> = {
  technique: 'bg-blue-100 text-blue-800',
  tactics: 'bg-purple-100 text-purple-800',
  physical: 'bg-orange-100 text-orange-800',
  behavior: 'bg-yellow-100 text-yellow-800',
  medical: 'bg-red-100 text-red-800',
}

interface PlayerNotesProps {
  playerId: string
}

export function PlayerNotes({ playerId }: PlayerNotesProps) {
  const { t } = useTranslation()
  const qc = useQueryClient()
  const [isCreating, setIsCreating] = React.useState(false)
  const [category, setCategory] = React.useState<CreateCoachNoteRequest['category']>('technique')
  const [content, setContent] = React.useState('')
  const [isPrivate, setIsPrivate] = React.useState(false)

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.coachNotes.player(playerId),
    queryFn: () => coachNotesApi.listByPlayer(playerId),
    enabled: !!playerId,
  })

  const createMutation = useMutation({
    mutationFn: coachNotesApi.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.coachNotes.player(playerId) })
      toast.success(t('common.success'))
      setContent('')
      setIsCreating(false)
    },
    onError: () => toast.error(t('common.error')),
  })

  const deleteMutation = useMutation({
    mutationFn: coachNotesApi.delete,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.coachNotes.player(playerId) })
      toast.success(t('common.success'))
    },
    onError: () => toast.error(t('common.error')),
  })

  const handleCreate = () => {
    if (!content.trim()) return
    createMutation.mutate({ playerId, category, content: content.trim(), isPrivate })
  }

  const notes = data?.data ?? []

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">{t('coachNotes.title')}</h3>
        <Button size="sm" className="gap-2" onClick={() => setIsCreating((s) => !s)}>
          <Plus className="h-4 w-4" />{t('coachNotes.add')}
        </Button>
      </div>

      {isCreating && (
        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center gap-3">
              <Select value={category} onValueChange={(v) => setCategory(v as CreateCoachNoteRequest['category'])}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>{t(`coachNotes.categories.${c}`)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={isPrivate}
                  onChange={(e) => setIsPrivate(e.target.checked)}
                  className="rounded border-gray-300"
                />
                {t('coachNotes.private')}
              </label>
            </div>
            <Textarea
              placeholder={t('coachNotes.placeholder')}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={3}
            />
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setIsCreating(false)}>{t('common.cancel')}</Button>
              <Button size="sm" onClick={handleCreate} disabled={createMutation.isPending || !content.trim()}>
                {t('common.save')}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <Skeleton className="h-32 w-full" />
      ) : notes.length === 0 ? (
        <EmptyState icon={StickyNote} title={t('coachNotes.emptyTitle')} description={t('coachNotes.emptyDescription')} />
      ) : (
        <div className="space-y-3">
          {notes.map((note) => (
            <Card key={note.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className={CATEGORY_COLORS[note.category] ?? 'bg-slate-100'}>
                        {t(`coachNotes.categories.${note.category}`)}
                      </Badge>
                      {note.isPrivate && <Badge variant="outline">{t('coachNotes.private')}</Badge>}
                      <span className="text-xs text-muted-foreground">{new Date(note.createdAt).toLocaleDateString()}</span>
                    </div>
                    <p className="text-base whitespace-pre-wrap">{note.content}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="shrink-0 h-8 w-8 text-destructive"
                    onClick={() => deleteMutation.mutate(note.id)}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
