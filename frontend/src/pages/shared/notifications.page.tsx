import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { CheckCheck, Bell } from 'lucide-react'
import { toast } from 'sonner'
import { notificationsApi } from '@/shared/api/notifications.api'
import { queryKeys } from '@/shared/api/query-keys'
import { PageHeader, Button, Badge } from '@/shared/ui'
import { EmptyState } from '@/shared/ui/empty-state'
import { formatRelativeTime } from '@/shared/lib/utils'
import { format, parseISO, isToday, isYesterday } from 'date-fns'
import type { Notification } from '@/shared/types'

function groupByDate(notifications: Notification[], t: (key: string) => string): Record<string, Notification[]> {
  return notifications.reduce((acc, n) => {
    const date = parseISO(n.createdAt)
    let label: string
    if (isToday(date)) label = t('notifications.groupToday')
    else if (isYesterday(date)) label = t('notifications.groupYesterday')
    else label = format(date, 'MMMM d, yyyy')
    if (!acc[label]) acc[label] = []
    acc[label].push(n)
    return acc
  }, {} as Record<string, Notification[]>)
}

export function NotificationsPage() {
  const { t } = useTranslation()
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.notifications.all({}),
    queryFn: () => notificationsApi.getNotifications({ limit: 50 }),
  })

  const { mutate: markRead } = useMutation({
    mutationFn: notificationsApi.markRead,
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.notifications.all() }),
  })

  const { mutate: markAll, isPending: markingAll } = useMutation({
    mutationFn: notificationsApi.markAllRead,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.notifications.all() })
      toast.success(t('notifications.markAllRead'))
    },
  })

  const notifications = data?.data ?? []
  const grouped = groupByDate(notifications, t)
  const unreadCount = data?.unreadCount ?? 0

  return (
    <div className="space-y-6 max-w-2xl">
      <PageHeader
        title={t('notifications.title')}
        description={`${unreadCount} ${t('notifications.unread')}`}
        actions={
          unreadCount > 0 ? (
            <Button variant="outline" size="sm" onClick={() => markAll()} disabled={markingAll} className="gap-2">
              <CheckCheck className="h-4 w-4" />{t('notifications.markAllRead')}
            </Button>
          ) : undefined
        }
      />

      {isLoading ? (
        <div className="text-center text-muted-foreground py-8">{t('common.loading')}</div>
      ) : notifications.length > 0 ? (
        <div className="space-y-6">
          {Object.entries(grouped).map(([dateLabel, items]) => (
            <div key={dateLabel}>
              <h3 className="mb-3 text-sm font-semibold text-muted-foreground">{dateLabel}</h3>
              <div className="space-y-2">
                {items.map((n) => (
                  <div
                    key={n.id}
                    className={`rounded-lg border p-4 cursor-pointer transition-colors ${!n.readAt ? 'bg-primary/5 border-primary/20 hover:bg-primary/10' : 'hover:bg-muted/50'}`}
                    onClick={() => !n.readAt && markRead(n.id)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-sm">{n.title}</p>
                          {!n.readAt && <span className="h-2 w-2 rounded-full bg-primary shrink-0" />}
                        </div>
                        {n.body && <p className="mt-1 text-sm text-muted-foreground">{n.body}</p>}
                        <p className="mt-1.5 text-xs text-muted-foreground">{formatRelativeTime(n.createdAt)}</p>
                      </div>
                      <Badge variant="outline" className="text-xs shrink-0 capitalize">{n.type.replace(/_/g, ' ')}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState icon={Bell} title={t('notifications.noNotifications')} description={t('common.success')} />
      )}
    </div>
  )
}
