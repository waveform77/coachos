import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import { sessionsApi } from '@/shared/api/sessions.api'
import { queryKeys } from '@/shared/api/query-keys'
import { PageHeader, Card, CardContent } from '@/shared/ui'

export function ParentSchedulePage() {
  const { t } = useTranslation()
  const { data: sessions } = useQuery({
    queryKey: queryKeys.sessions.all({}),
    queryFn: () => sessionsApi.listSessions({ limit: 100 }),
  })

  const events = (sessions?.data ?? []).map((s) => ({
    id: s.id, title: `⚽ ${t('sessions.title')}`, start: s.scheduledAt, color: '#10b981',
  }))

  return (
    <div className="space-y-6">
      <PageHeader title={t('parent.schedule')} description={t('parent.upcomingSessions')} />
      <Card>
        <CardContent className="p-4">
          <FullCalendar plugins={[dayGridPlugin]} initialView="dayGridMonth"
            headerToolbar={{ left: 'prev,next today', center: 'title', right: 'dayGridMonth' }}
            events={events} height={500} />
        </CardContent>
      </Card>
    </div>
  )
}
