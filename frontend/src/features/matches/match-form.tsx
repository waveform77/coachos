import * as React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import {
  Button, Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
  Input, Checkbox, Textarea,
} from '@/shared/ui'

const matchSchema = z.object({
  opponent: z.string().min(1, 'Opponent name required'),
  kickoffAt: z.string().min(1, 'Date and time required'),
  location: z.string().optional(),
  isHome: z.boolean(),
  notes: z.string().optional(),
})

type MatchValues = z.infer<typeof matchSchema>

interface MatchFormProps {
  onSubmit: (values: MatchValues) => Promise<void>
  loading?: boolean
}

export function MatchForm({ onSubmit, loading }: MatchFormProps) {
  const { t } = useTranslation()
  const form = useForm<MatchValues>({
    resolver: zodResolver(matchSchema),
    defaultValues: { opponent: '', kickoffAt: '', location: '', isHome: true, notes: '' },
  })

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField control={form.control} name="opponent" render={({ field }) => (
          <FormItem><FormLabel>{t('matches.opponent')}</FormLabel><FormControl><Input placeholder="FC Rival..." {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="kickoffAt" render={({ field }) => (
          <FormItem><FormLabel>{t('matches.date')} & {t('common.time')}</FormLabel><FormControl>
            <Input type="datetime-local" {...field} />
          </FormControl><FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="location" render={({ field }) => (
          <FormItem><FormLabel>{t('common.location')}</FormLabel><FormControl><Input placeholder={t('matches.locationPlaceholder')} {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="isHome" render={({ field }) => (
          <FormItem>
            <div className="flex items-center gap-3">
              <FormControl>
                <Checkbox checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
              <FormLabel className="cursor-pointer">{t('matches.home')}</FormLabel>
            </div>
          </FormItem>
        )} />
        <FormField control={form.control} name="notes" render={({ field }) => (
          <FormItem><FormLabel>{t('common.notes')}</FormLabel><FormControl>
            <Textarea placeholder={t('matches.notesPlaceholder')} rows={3} {...field} />
          </FormControl><FormMessage /></FormItem>
        )} />
        <Button type="submit" className="w-full" disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {t('matches.addMatch')}
        </Button>
      </form>
    </Form>
  )
}
