import * as React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { TrainingSession } from '@/shared/types'
import {
  Button, Form, FormControl, FormField, FormItem, FormLabel, FormMessage, Input,
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Textarea,
  Badge,
} from '@/shared/ui'

const sessionSchema = z.object({
  teamID: z.string().min(1, 'Team is required'),
  scheduledAt: z.string().min(1, 'Date and time required'),
  durationMin: z.number().min(15).max(360).optional().or(z.literal('')),
  location: z.string().optional(),
  intensity: z.enum(['low', 'medium', 'high']),
  notes: z.string().optional(),
})

type SessionValues = z.infer<typeof sessionSchema>

interface SessionFormProps {
  teams: Array<{ id: string; name: string }>
  defaultValues?: Partial<TrainingSession>
  onSubmit: (values: SessionValues & { focus: string[] }) => Promise<void>
  loading?: boolean
}

export function SessionForm({ teams, defaultValues, onSubmit, loading }: SessionFormProps) {
  const { t } = useTranslation()
  const [focusTags, setFocusTags] = React.useState<string[]>(defaultValues?.focus ?? [])
  const [tagInput, setTagInput] = React.useState('')

  const form = useForm<SessionValues>({
    resolver: zodResolver(sessionSchema),
    defaultValues: {
      teamID: defaultValues?.teamID ?? '',
      scheduledAt: defaultValues?.scheduledAt ? defaultValues.scheduledAt.slice(0, 16) : '',
      durationMin: defaultValues?.durationMin ?? '',
      location: defaultValues?.location ?? '',
      intensity: defaultValues?.intensity ?? 'medium',
      notes: defaultValues?.notes ?? '',
    },
  })

  const addTag = (e: React.KeyboardEvent) => {
    if ((e.key === 'Enter' || e.key === ',') && tagInput.trim()) {
      e.preventDefault()
      const tag = tagInput.trim().toLowerCase()
      if (!focusTags.includes(tag)) setFocusTags((prev) => [...prev, tag])
      setTagInput('')
    }
  }

  const removeTag = (tag: string) => setFocusTags((prev) => prev.filter((t) => t !== tag))

  const handleSubmit = async (values: SessionValues) => {
    await onSubmit({ ...values, focus: focusTags })
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-5">
        <div className="space-y-1">
          <h3 className="text-base font-semibold">{t('sessions.sessionDetails')}</h3>
          <p className="text-sm text-muted-foreground">Основные параметры тренировки</p>
        </div>
        <FormField control={form.control} name="teamID" render={({ field }) => (
          <FormItem>
            <FormLabel className="text-base">{t('common.team')} *</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl><SelectTrigger><SelectValue placeholder={t('common.select')} /></SelectTrigger></FormControl>
              <SelectContent>
                {teams.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )} />
        <div className="grid grid-cols-2 gap-4">
          <FormField control={form.control} name="scheduledAt" render={({ field }) => (
            <FormItem>
              <FormLabel className="text-base">{t('common.date')} & {t('common.time')} *</FormLabel>
              <FormControl><Input type="datetime-local" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="durationMin" render={({ field }) => (
            <FormItem>
              <FormLabel className="text-base">{t('common.duration')} ({t('common.min')})</FormLabel>
              <FormControl>
                <Input type="number" min={15} max={360} placeholder="90" {...field}
                  onChange={(e) => field.onChange(e.target.value === '' ? '' : Number(e.target.value))} />
              </FormControl>
              <p className="text-sm text-muted-foreground">Обычно 60–120 минут</p>
              <FormMessage />
            </FormItem>
          )} />
        </div>
        <FormField control={form.control} name="location" render={({ field }) => (
          <FormItem>
            <FormLabel className="text-base">{t('common.location')}</FormLabel>
            <FormControl><Input placeholder={t('sessions.locationPlaceholder')} {...field} /></FormControl>
            <p className="text-sm text-muted-foreground">Стадион или номер поля</p>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="intensity" render={({ field }) => (
          <FormItem>
            <FormLabel className="text-base">{t('sessions.intensity')}</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
              <SelectContent>
                <SelectItem value="low">{t('sessions.low')}</SelectItem>
                <SelectItem value="medium">{t('sessions.medium')}</SelectItem>
                <SelectItem value="high">{t('sessions.high')}</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )} />
        <div className="space-y-2">
          <label className="text-base font-medium">{t('sessions.focus')}</label>
          <p className="text-sm text-muted-foreground">Нажмите Enter после каждого тега</p>
          <div className="flex flex-wrap gap-2 min-h-[2.75rem] rounded-md border p-2">
            {focusTags.map((tag) => (
              <Badge key={tag} variant="secondary" className="gap-1 text-sm py-1 px-2">
                {tag}
                <button type="button" onClick={() => removeTag(tag)}><X className="h-4 w-4" /></button>
              </Badge>
            ))}
            <input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={addTag}
              placeholder={focusTags.length === 0 ? t('sessions.focusPlaceholder') : ''}
              className="flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground min-w-[120px]"
            />
          </div>
        </div>
        <FormField control={form.control} name="notes" render={({ field }) => (
          <FormItem>
            <FormLabel className="text-base">{t('common.notes')}</FormLabel>
            <FormControl>
              <Textarea placeholder={t('sessions.notesPlaceholder')} rows={3} {...field} />
            </FormControl>
            <p className="text-sm text-muted-foreground">Заметки для себя или других тренеров</p>
            <FormMessage />
          </FormItem>
        )} />
        <Button type="submit" className="w-full h-11 text-base" disabled={loading}>
          {loading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
          {defaultValues ? t('common.save') : t('sessions.addSession')}
        </Button>
      </form>
    </Form>
  )
}
