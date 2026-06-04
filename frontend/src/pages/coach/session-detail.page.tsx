import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'
import { sessionsApi } from '@/shared/api/sessions.api'
import { exercisesApi } from '@/shared/api/exercises.api'
import { teamsApi } from '@/shared/api/teams.api'
import { queryKeys } from '@/shared/api/query-keys'
import {
  Button, Tabs, TabsContent, TabsList, TabsTrigger, Badge, Skeleton, Card, CardContent,
} from '@/shared/ui'
import { SessionBuilder } from '@/features/sessions/session-builder'
import { AttendanceTable } from '@/features/attendance/attendance-table'
import { formatDateTime, getStatusColor, getIntensityColor, capitalize } from '@/shared/lib/utils'
import { MapPin, Clock } from 'lucide-react'

export function SessionDetailPage() {
  const { t } = useTranslation()
  const { sessionId } = useParams<{ sessionId: string }>()
  const navigate = useNavigate()
  const qc = useQueryClient()

  const { data: session, isLoading } = useQuery({
    queryKey: queryKeys.sessions.detail(sessionId!),
    queryFn: () => sessionsApi.getSession(sessionId!),
    enabled: !!sessionId,
  })

  const { data: exercises } = useQuery({
    queryKey: queryKeys.exercises.all({}),
    queryFn: () => exercisesApi.listExercises({ limit: 200 }),
  })

  const { data: attendance } = useQuery({
    queryKey: queryKeys.sessions.attendance(sessionId!),
    queryFn: () => sessionsApi.getAttendance(sessionId!),
    enabled: !!sessionId,
  })

  const { data: teamMembers } = useQuery({
    queryKey: queryKeys.teams.members(session?.teamID ?? ''),
    queryFn: () => teamsApi.getTeamMembers(session!.teamID),
    enabled: !!session?.teamID,
  })

  const { mutate: complete, isPending: completing } = useMutation({
    mutationFn: () => sessionsApi.completeSession(sessionId!),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.sessions.detail(sessionId!) })
      toast.success(t('common.success'))
    },
    onError: () => toast.error(t('common.error')),
  })

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full rounded-lg" />
      </div>
    )
  }
  if (!session) return null

  const isEditable = session.status === 'planned' || session.status === 'in_progress'
  const players = teamMembers?.map((m) => m.player) ?? []

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={() => navigate('/coach/calendar')} className="gap-2 -ml-2">
        <ArrowLeft className="h-4 w-4" />{t('common.back')}
      </Button>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge className={getStatusColor(session.status)}>{t(`commonEnums.sessionStatus.${session.status}`)}</Badge>
            <Badge className={getIntensityColor(session.intensity)}>{t(`exercises.${session.intensity}`)}</Badge>
          </div>
          <p className="mt-2 text-xl font-bold">{formatDateTime(session.scheduledAt)}</p>
          <div className="mt-2 flex flex-wrap gap-3 text-sm text-muted-foreground">
            {session.durationMin && <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{session.durationMin} {t('common.min')}</span>}
            {session.location && <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{session.location}</span>}
          </div>
          {session.focus && session.focus.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {session.focus.map((f) => <Badge key={f} variant="outline" className="text-xs">{f}</Badge>)}
            </div>
          )}
        </div>
        {isEditable && (
          <Button onClick={() => complete()} disabled={completing} variant="outline" className="gap-2 shrink-0">
            <CheckCircle className="h-4 w-4" />{t('sessions.completed')}
          </Button>
        )}
      </div>

      <Tabs defaultValue="builder">
        <TabsList>
          <TabsTrigger value="builder">{t('sessions.sessionBuilder')}</TabsTrigger>
          <TabsTrigger value="attendance">{t('attendance.title')} ({attendance?.length ?? 0})</TabsTrigger>
          <TabsTrigger value="notes">{t('common.description')}</TabsTrigger>
        </TabsList>

        <TabsContent value="builder" className="mt-4">
          <SessionBuilder
            sessionId={sessionId!}
            initialBlocks={session.blocks}
            exercises={exercises?.data ?? []}
            readOnly={!isEditable}
            onSave={() => qc.invalidateQueries({ queryKey: queryKeys.sessions.detail(sessionId!) })}
          />
        </TabsContent>

        <TabsContent value="attendance" className="mt-4">
          {players.length > 0 ? (
            <AttendanceTable
              sessionId={sessionId!}
              players={players}
              initialRecords={attendance ?? []}
              onSaved={() => qc.invalidateQueries({ queryKey: queryKeys.sessions.attendance(sessionId!) })}
            />
          ) : (
            <p className="text-center text-muted-foreground py-8">{t('common.noData')}</p>
          )}
        </TabsContent>

        <TabsContent value="notes" className="mt-4">
          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground">{session.notes || t('common.noData')}</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
