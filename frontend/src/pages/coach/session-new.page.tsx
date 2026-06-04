import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import { SessionForm } from '@/features/sessions/session-form'
import { Button, PageHeader } from '@/shared/ui'
import { sessionsApi } from '@/shared/api/sessions.api'
import { teamsApi } from '@/shared/api/teams.api'
import { queryKeys } from '@/shared/api/query-keys'
import { useAuthStore } from '@/app/store/auth.store'

export function SessionNewPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [loading, setLoading] = React.useState(false)

  const { data: teams } = useQuery({
    queryKey: queryKeys.teams.all({ clubId: user?.clubId }),
    queryFn: () => teamsApi.listTeams({ clubId: user?.clubId }),
  })

  const handleSubmit = async (values: Parameters<typeof sessionsApi.createSession>[0]) => {
    setLoading(true)
    try {
      const session = await sessionsApi.createSession(values)
      toast.success(t('sessions.sessionSaved'))
      navigate(`/coach/sessions/${session.id}`)
    } catch {
      toast.error(t('sessions.sessionSaveFailed'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <Button variant="ghost" className="gap-2" onClick={() => navigate('/coach/calendar')}>
        <ArrowLeft className="h-4 w-4" />
        {t('common.back')}
      </Button>

      <PageHeader
        title={t('sessions.addSession')}
        description={t('sessions.sessionBuilder')}
      />

      <SessionForm
        teams={(teams as any)?.data ?? []}
        loading={loading}
        onSubmit={async (values) => {
          await handleSubmit(values as any)
        }}
      />
    </div>
  )
}
