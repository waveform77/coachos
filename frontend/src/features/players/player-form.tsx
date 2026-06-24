import * as React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { Player } from '@/shared/types'
import {
  Button, Form, FormControl, FormField, FormItem, FormLabel, FormMessage, Input,
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Textarea,
} from '@/shared/ui'

const playerSchema = z.object({
  firstName: z.string().min(1, 'Required'),
  lastName: z.string().min(1, 'Required'),
  birthDate: z.string().optional(),
  position: z.enum(['goalkeeper', 'defender', 'midfielder', 'forward', 'universal']).optional(),
  dominantFoot: z.enum(['left', 'right', 'both']).optional(),
  heightCm: z.number().min(50).max(250).optional().or(z.literal('')),
  weightKg: z.number().min(20).max(200).optional().or(z.literal('')),
  medicalNotes: z.string().optional(),
  teamId: z.string().optional(),
})

type PlayerValues = z.infer<typeof playerSchema>

interface PlayerFormProps {
  defaultValues?: Partial<Player>
  onSubmit: (values: PlayerValues) => Promise<void>
  loading?: boolean
  teams?: Array<{ id: string; name: string }>
}

export function PlayerForm({ defaultValues, onSubmit, loading, teams }: PlayerFormProps) {
  const { t } = useTranslation()
  const form = useForm<PlayerValues>({
    resolver: zodResolver(playerSchema),
    defaultValues: {
      firstName: defaultValues?.firstName ?? '',
      lastName: defaultValues?.lastName ?? '',
      birthDate: defaultValues?.birthDate?.split('T')[0] ?? '',
      position: defaultValues?.position,
      dominantFoot: defaultValues?.dominantFoot,
      heightCm: defaultValues?.heightCm ?? '',
      weightKg: defaultValues?.weightKg ?? '',
      medicalNotes: defaultValues?.medicalNotes ?? '',
      teamId: '',
    },
  })

  const handleSubmit = async (values: PlayerValues) => {
    const cleaned = {
      ...values,
      // Convert empty numeric fields to undefined so backend treats them as absent
      heightCm: values.heightCm === '' ? undefined : Number(values.heightCm),
      weightKg: values.weightKg === '' ? undefined : Number(values.weightKg),
      // Backend expects RFC3339 timestamp for time fields — convert date input (YYYY-MM-DD)
      birthDate: values.birthDate ? new Date(values.birthDate).toISOString() : undefined,
    }
    await onSubmit(cleaned)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-5">
        <div className="space-y-1">
          <h3 className="text-base font-semibold">{t('auth.personalInfo')}</h3>
          <p className="text-sm text-muted-foreground">Основные данные игрока</p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <FormField control={form.control} name="firstName" render={({ field }) => (
            <FormItem>
              <FormLabel className="text-base">{t('auth.firstName')} *</FormLabel>
              <FormControl><Input placeholder="Иван" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="lastName" render={({ field }) => (
            <FormItem>
              <FormLabel className="text-base">{t('auth.lastName')} *</FormLabel>
              <FormControl><Input placeholder="Иванов" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
        </div>
        <FormField control={form.control} name="birthDate" render={({ field }) => (
          <FormItem>
            <FormLabel className="text-base">{t('players.birthDate')}</FormLabel>
            <FormControl><Input type="date" {...field} /></FormControl>
            <p className="text-sm text-muted-foreground">Для расчёта возраста и возрастной группы</p>
            <FormMessage />
          </FormItem>
        )} />
        <div className="grid grid-cols-2 gap-4">
          <FormField control={form.control} name="position" render={({ field }) => (
            <FormItem>
              <FormLabel className="text-base">{t('players.position')}</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl><SelectTrigger><SelectValue placeholder={t('common.select')} /></SelectTrigger></FormControl>
                <SelectContent>
                  <SelectItem value="goalkeeper">{t('commonEnums.positions.goalkeeper')}</SelectItem>
                  <SelectItem value="defender">{t('commonEnums.positions.defender')}</SelectItem>
                  <SelectItem value="midfielder">{t('commonEnums.positions.midfielder')}</SelectItem>
                  <SelectItem value="forward">{t('commonEnums.positions.forward')}</SelectItem>
                  <SelectItem value="universal">{t('commonEnums.positions.universal')}</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="dominantFoot" render={({ field }) => (
            <FormItem>
              <FormLabel className="text-base">{t('players.dominantFoot')}</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl><SelectTrigger><SelectValue placeholder={t('common.select')} /></SelectTrigger></FormControl>
                <SelectContent>
                  <SelectItem value="left">{t('commonEnums.dominantFoot.left')}</SelectItem>
                  <SelectItem value="right">{t('commonEnums.dominantFoot.right')}</SelectItem>
                  <SelectItem value="both">{t('commonEnums.dominantFoot.both')}</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )} />
        </div>

        {teams && teams.length > 0 && (
          <FormField control={form.control} name="teamId" render={({ field }) => (
            <FormItem>
              <FormLabel className="text-base">{t('common.team')}</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl><SelectTrigger><SelectValue placeholder={t('common.select')} /></SelectTrigger></FormControl>
                <SelectContent>
                  {teams.map((t) => (
                    <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )} />
        )}

        <div className="space-y-1 pt-2">
          <h3 className="text-base font-semibold">{t('playerDetail.physicalParams')}</h3>
          <p className="text-sm text-muted-foreground">Необязательно, можно заполнить позже</p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <FormField control={form.control} name="heightCm" render={({ field }) => (
            <FormItem>
              <FormLabel className="text-base">{t('players.height')} (см)</FormLabel>
              <FormControl>
                <Input type="number" min={50} max={250} placeholder="175" {...field}
                  onChange={(e) => field.onChange(e.target.value === '' ? '' : Number(e.target.value))} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="weightKg" render={({ field }) => (
            <FormItem>
              <FormLabel className="text-base">{t('players.weight')} (кг)</FormLabel>
              <FormControl>
                <Input type="number" min={20} max={200} placeholder="70" {...field}
                  onChange={(e) => field.onChange(e.target.value === '' ? '' : Number(e.target.value))} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />
        </div>

        <div className="space-y-1 pt-2">
          <h3 className="text-base font-semibold">{t('players.medicalNotes')}</h3>
          <p className="text-sm text-muted-foreground">Важная информация для тренера</p>
        </div>
        <FormField control={form.control} name="medicalNotes" render={({ field }) => (
          <FormItem>
            <FormLabel className="text-base">{t('players.medicalNotes')}</FormLabel>
            <FormControl>
              <Textarea placeholder={t('players.medicalNotesPlaceholder')} rows={3} {...field} />
            </FormControl>
            <p className="text-sm text-muted-foreground">Аллергии, хронические заболевания, особенности — видно только тренеру</p>
            <FormMessage />
          </FormItem>
        )} />
        <Button type="submit" className="w-full h-11 text-base" disabled={loading}>
          {loading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
          {defaultValues ? t('common.save') : t('players.addPlayer')}
        </Button>
      </form>
    </Form>
  )
}
