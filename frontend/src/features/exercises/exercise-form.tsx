import * as React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, Star, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { Exercise } from '@/shared/types'
import {
  Button, Form, FormControl, FormField, FormItem, FormLabel, FormMessage, Input,
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Textarea, Badge,
} from '@/shared/ui'
import { cn } from '@/shared/lib/utils'

const exerciseSchema = z.object({
  name: z.string().min(1, 'Required'),
  category: z.enum(['technique', 'tactics', 'physical', 'coordination', 'goalkeeping', 'warmup', 'cooldown']),
  difficulty: z.number().min(1).max(5),
  durationMin: z.number().min(1).max(120).optional().or(z.literal('')),
  playersMin: z.number().min(1).optional().or(z.literal('')),
  playersMax: z.number().min(1).optional().or(z.literal('')),
  description: z.string().optional(),
})

type ExerciseValues = z.infer<typeof exerciseSchema>

interface ExerciseFormProps {
  defaultValues?: Partial<Exercise>
  onSubmit: (values: ExerciseValues & { equipment: string[]; tags: string[] }) => Promise<void>
  loading?: boolean
}

function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hovered, setHovered] = React.useState(0)
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
        >
          <Star className={cn('h-6 w-6 transition-colors', (hovered || value) >= star ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground')} />
        </button>
      ))}
    </div>
  )
}

export function ExerciseForm({ defaultValues, onSubmit, loading }: ExerciseFormProps) {
  const { t } = useTranslation()
  const [equipment, setEquipment] = React.useState<string[]>(defaultValues?.equipment ?? [])
  const [tags, setTags] = React.useState<string[]>(defaultValues?.tags ?? [])
  const [equipInput, setEquipInput] = React.useState('')
  const [tagInput, setTagInput] = React.useState('')

  const form = useForm<ExerciseValues>({
    resolver: zodResolver(exerciseSchema),
    defaultValues: {
      name: defaultValues?.name ?? '',
      category: defaultValues?.category ?? 'technique',
      difficulty: defaultValues?.difficulty ?? 3,
      durationMin: defaultValues?.durationMin ?? '',
      playersMin: defaultValues?.playersMin ?? '',
      playersMax: defaultValues?.playersMax ?? '',
      description: defaultValues?.description ?? '',
    },
  })

  const addItem = (
    value: string, list: string[], setList: React.Dispatch<React.SetStateAction<string[]>>, setInput: React.Dispatch<React.SetStateAction<string>>
  ) => {
    const trimmed = value.trim()
    if (trimmed && !list.includes(trimmed)) setList((prev) => [...prev, trimmed])
    setInput('')
  }

  const handleSubmit = async (values: ExerciseValues) => {
    await onSubmit({
      ...values,
      durationMin: values.durationMin === '' ? undefined : Number(values.durationMin),
      playersMin: values.playersMin === '' ? undefined : Number(values.playersMin),
      playersMax: values.playersMax === '' ? undefined : Number(values.playersMax),
      equipment,
      tags,
    })
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField control={form.control} name="name" render={({ field }) => (
          <FormItem><FormLabel>{t('exercises.exerciseName')}</FormLabel><FormControl><Input placeholder="Rondo 4v2..." {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        <div className="grid grid-cols-2 gap-4">
          <FormField control={form.control} name="category" render={({ field }) => (
            <FormItem>
              <FormLabel>{t('exercises.category')}</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                <SelectContent>
                  <SelectItem value="technique">{t('exercises.technique')}</SelectItem>
                  <SelectItem value="tactics">{t('exercises.tactics')}</SelectItem>
                  <SelectItem value="physical">{t('exercises.physical')}</SelectItem>
                  <SelectItem value="coordination">{t('exercises.coordination')}</SelectItem>
                  <SelectItem value="goalkeeping">{t('exercises.goalkeeping')}</SelectItem>
                  <SelectItem value="warmup">{t('exercises.warmup')}</SelectItem>
                  <SelectItem value="cooldown">{t('exercises.cooldown')}</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="difficulty" render={({ field }) => (
            <FormItem>
              <FormLabel>{t('exercises.difficulty')}</FormLabel>
              <FormControl>
                <StarRating value={field.value} onChange={field.onChange} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />
        </div>
        <div className="grid grid-cols-3 gap-4">
          <FormField control={form.control} name="durationMin" render={({ field }) => (
            <FormItem><FormLabel>{t('exercises.duration')} ({t('common.min')})</FormLabel><FormControl>
              <Input type="number" min={1} placeholder="15" {...field}
                onChange={(e) => field.onChange(e.target.value === '' ? '' : Number(e.target.value))} />
            </FormControl><FormMessage /></FormItem>
          )} />
          <FormField control={form.control} name="playersMin" render={({ field }) => (
            <FormItem><FormLabel>{t('common.min')} {t('exercises.players')}</FormLabel><FormControl>
              <Input type="number" min={1} placeholder="4" {...field}
                onChange={(e) => field.onChange(e.target.value === '' ? '' : Number(e.target.value))} />
            </FormControl><FormMessage /></FormItem>
          )} />
          <FormField control={form.control} name="playersMax" render={({ field }) => (
            <FormItem><FormLabel>{t('common.max')} {t('exercises.players')}</FormLabel><FormControl>
              <Input type="number" min={1} placeholder="20" {...field}
                onChange={(e) => field.onChange(e.target.value === '' ? '' : Number(e.target.value))} />
            </FormControl><FormMessage /></FormItem>
          )} />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">{t('exercises.equipment')}</label>
          <div className="flex flex-wrap gap-2 min-h-[2.5rem] rounded-md border p-2">
            {equipment.map((e) => (
              <Badge key={e} variant="secondary" className="gap-1">{e}
                <button type="button" onClick={() => setEquipment((p) => p.filter((i) => i !== e))}><X className="h-3 w-3" /></button>
              </Badge>
            ))}
            <input value={equipInput} onChange={(e) => setEquipInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addItem(equipInput, equipment, setEquipment, setEquipInput))}
              placeholder={equipment.length === 0 ? t('exercises.equipmentPlaceholder') : ''} className="flex-1 bg-transparent text-sm outline-none min-w-[100px]" />
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">{t('exercises.tags')}</label>
          <div className="flex flex-wrap gap-2 min-h-[2.5rem] rounded-md border p-2">
            {tags.map((t) => (
              <Badge key={t} variant="outline" className="gap-1">{t}
                <button type="button" onClick={() => setTags((p) => p.filter((i) => i !== t))}><X className="h-3 w-3" /></button>
              </Badge>
            ))}
            <input value={tagInput} onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addItem(tagInput, tags, setTags, setTagInput))}
              placeholder={tags.length === 0 ? t('exercises.tagsPlaceholder') : ''} className="flex-1 bg-transparent text-sm outline-none min-w-[100px]" />
          </div>
        </div>
        <FormField control={form.control} name="description" render={({ field }) => (
          <FormItem><FormLabel>{t('exercises.description')}</FormLabel><FormControl>
            <Textarea placeholder={t('exercises.descriptionPlaceholder')} rows={4} {...field} />
          </FormControl><FormMessage /></FormItem>
        )} />
        <Button type="submit" className="w-full" disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {defaultValues ? t('common.save') : t('exercises.addExercise')}
        </Button>
      </form>
    </Form>
  )
}
