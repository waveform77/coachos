import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Trash2, HeartPulse } from 'lucide-react'
import { toast } from 'sonner'
import { medicalApi, type CreateMedicalRecordRequest } from '@/shared/api/medical.api'
import { queryKeys } from '@/shared/api/query-keys'
import {
  Button, Card, CardContent, CardHeader, CardTitle, Badge, Textarea,
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Skeleton, Input,
} from '@/shared/ui'
import { EmptyState } from '@/shared/ui/empty-state'

const CONDITIONS: CreateMedicalRecordRequest['condition'][] = ['injury', 'illness', 'recovery', 'fit']
const SEVERITIES: NonNullable<CreateMedicalRecordRequest['severity']>[] = ['minor', 'moderate', 'severe']

const CONDITION_COLORS: Record<string, string> = {
  injury: 'bg-red-100 text-red-800',
  illness: 'bg-orange-100 text-orange-800',
  recovery: 'bg-blue-100 text-blue-800',
  fit: 'bg-emerald-100 text-emerald-800',
}

const SEVERITY_COLORS: Record<string, string> = {
  minor: 'border-yellow-300',
  moderate: 'border-orange-300',
  severe: 'border-red-300',
}

interface MedicalLogProps {
  playerId: string
}

export function MedicalLog({ playerId }: MedicalLogProps) {
  const { t } = useTranslation()
  const qc = useQueryClient()
  const [isCreating, setIsCreating] = React.useState(false)
  const [condition, setCondition] = React.useState<CreateMedicalRecordRequest['condition']>('injury')
  const [description, setDescription] = React.useState('')
  const [startDate, setStartDate] = React.useState('')
  const [endDate, setEndDate] = React.useState('')
  const [severity, setSeverity] = React.useState<CreateMedicalRecordRequest['severity']>('minor')
  const [status, setStatus] = React.useState<CreateMedicalRecordRequest['status']>('active')

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.medical.player(playerId),
    queryFn: () => medicalApi.listByPlayer(playerId),
    enabled: !!playerId,
  })

  const createMutation = useMutation({
    mutationFn: medicalApi.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.medical.player(playerId) })
      toast.success(t('common.success'))
      resetForm()
      setIsCreating(false)
    },
    onError: () => toast.error(t('common.error')),
  })

  const deleteMutation = useMutation({
    mutationFn: medicalApi.delete,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.medical.player(playerId) })
      toast.success(t('common.success'))
    },
    onError: () => toast.error(t('common.error')),
  })

  const resetForm = () => {
    setCondition('injury')
    setDescription('')
    setStartDate('')
    setEndDate('')
    setSeverity('minor')
    setStatus('active')
  }

  const handleCreate = () => {
    if (!description.trim()) return
    createMutation.mutate({
      playerId,
      condition,
      description: description.trim(),
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      severity,
      status,
    })
  }

  const records = data?.data ?? []

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">{t('medicalLog.title')}</h3>
        <Button size="sm" className="gap-2" onClick={() => setIsCreating((s) => !s)}>
          <Plus className="h-4 w-4" />{t('medicalLog.add')}
        </Button>
      </div>

      {isCreating && (
        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Select value={condition} onValueChange={(v) => setCondition(v as CreateMedicalRecordRequest['condition'])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CONDITIONS.map((c) => <SelectItem key={c} value={c}>{t(`medicalLog.conditions.${c}`)}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={severity} onValueChange={(v) => setSeverity(v as CreateMedicalRecordRequest['severity'])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SEVERITIES.map((s) => <SelectItem key={s} value={s}>{t(`medicalLog.severities.${s}`)}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm text-muted-foreground">{t('medicalLog.startDate')}</label>
                <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              </div>
              <div>
                <label className="text-sm text-muted-foreground">{t('medicalLog.endDate')}</label>
                <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              </div>
            </div>
            <Select value={status} onValueChange={(v) => setStatus(v as CreateMedicalRecordRequest['status'])}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="active">{t('medicalLog.statuses.active')}</SelectItem>
                <SelectItem value="recovered">{t('medicalLog.statuses.recovered')}</SelectItem>
              </SelectContent>
            </Select>
            <Textarea placeholder={t('medicalLog.placeholder')} value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setIsCreating(false)}>{t('common.cancel')}</Button>
              <Button size="sm" onClick={handleCreate} disabled={createMutation.isPending || !description.trim()}>
                {t('common.save')}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <Skeleton className="h-32 w-full" />
      ) : records.length === 0 ? (
        <EmptyState icon={HeartPulse} title={t('medicalLog.emptyTitle')} description={t('medicalLog.emptyDescription')} />
      ) : (
        <div className="space-y-3">
          {records.map((record) => (
            <Card key={record.id} className={`border-l-4 ${SEVERITY_COLORS[record.severity ?? 'minor'] ?? 'border-gray-300'}`}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <Badge className={CONDITION_COLORS[record.condition] ?? 'bg-slate-100'}>
                        {t(`medicalLog.conditions.${record.condition}`)}
                      </Badge>
                      <Badge variant={record.status === 'active' ? 'destructive' : 'outline'}>
                        {t(`medicalLog.statuses.${record.status}`)}
                      </Badge>
                      {record.severity && (
                        <Badge variant="outline">{t(`medicalLog.severities.${record.severity}`)}</Badge>
                      )}
                    </div>
                    <p className="text-base whitespace-pre-wrap">{record.description}</p>
                    {(record.startDate || record.endDate) && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {record.startDate && new Date(record.startDate).toLocaleDateString()}
                        {record.startDate && record.endDate ? ' — ' : ''}
                        {record.endDate && new Date(record.endDate).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="shrink-0 h-8 w-8 text-destructive"
                    onClick={() => deleteMutation.mutate(record.id)}
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
