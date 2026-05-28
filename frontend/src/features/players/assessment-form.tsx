import * as React from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, Tooltip } from 'recharts'
import { Button, Form, FormControl, FormField, FormItem, FormLabel, FormMessage, Textarea } from '@/shared/ui'
import { cn } from '@/shared/lib/utils'

const assessmentSchema = z.object({
  technical: z.number().min(1).max(10),
  physical: z.number().min(1).max(10),
  tactical: z.number().min(1).max(10),
  discipline: z.number().min(1).max(10),
  teamwork: z.number().min(1).max(10),
  notes: z.string().optional(),
})

type AssessmentValues = z.infer<typeof assessmentSchema>

interface AssessmentFormProps {
  onSubmit: (values: AssessmentValues) => Promise<void>
  loading?: boolean
}

const SKILLS = [
  { key: 'technical' as const, labelKey: 'assessments.technical' },
  { key: 'physical' as const, labelKey: 'assessments.physical' },
  { key: 'tactical' as const, labelKey: 'assessments.tactical' },
  { key: 'discipline' as const, labelKey: 'assessments.discipline' },
  { key: 'teamwork' as const, labelKey: 'assessments.teamwork' },
]

function SkillSlider({ value, onChange, label }: { value: number; onChange: (v: number) => void; label: string }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{label}</span>
        <span className={cn(
          'text-sm font-bold',
          value >= 8 ? 'text-emerald-600' : value >= 5 ? 'text-yellow-600' : 'text-red-500'
        )}>{value}/10</span>
      </div>
      <input
        type="range" min={1} max={10} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-primary"
      />
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>1</span><span>5</span><span>10</span>
      </div>
    </div>
  )
}

export function AssessmentForm({ onSubmit, loading }: AssessmentFormProps) {
  const { t } = useTranslation()
  const form = useForm<AssessmentValues>({
    resolver: zodResolver(assessmentSchema),
    defaultValues: { technical: 5, physical: 5, tactical: 5, discipline: 5, teamwork: 5, notes: '' },
  })

  const watchedValues = form.watch()

  const radarData = SKILLS.map((s) => ({
    subject: t(s.labelKey),
    value: watchedValues[s.key],
    fullMark: 10,
  }))

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-4">
            {SKILLS.map((skill) => (
              <Controller
                key={skill.key}
                control={form.control}
                name={skill.key}
                render={({ field }) => (
                  <SkillSlider
                    value={field.value}
                    onChange={field.onChange}
                    label={t(skill.labelKey)}
                  />
                )}
              />
            ))}
          </div>
          <div className="flex flex-col items-center">
            <p className="mb-2 text-sm font-medium text-muted-foreground">{t('assessments.radarChart')}</p>
            <ResponsiveContainer width="100%" height={250}>
              <RadarChart data={radarData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="subject" tick={{ fontSize: 12 }} />
                <Radar name="Rating" dataKey="value" stroke="#10b981" fill="#10b981" fillOpacity={0.3} />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <FormField control={form.control} name="notes" render={({ field }) => (
          <FormItem>
            <FormLabel>{t('common.notes')}</FormLabel>
            <FormControl>
              <Textarea placeholder={t('assessments.notesPlaceholder')} rows={3} {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <Button type="submit" className="w-full" disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {t('assessments.addAssessment')}
        </Button>
      </form>
    </Form>
  )
}
