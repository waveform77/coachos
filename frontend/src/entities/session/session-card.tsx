import * as React from 'react'
import { useNavigate } from 'react-router-dom'
import { Calendar, Clock, MapPin, Flame } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { TrainingSession } from '@/shared/types'
import { Card, CardContent, Badge } from '@/shared/ui'
import { formatDate, getStatusColor, getIntensityColor, capitalize } from '@/shared/lib/utils'
import { format, parseISO } from 'date-fns'

interface SessionCardProps {
  session: TrainingSession
  teamName?: string
  onClick?: () => void
  compact?: boolean
}

export function SessionCard({ session, teamName, onClick, compact }: SessionCardProps) {
  const navigate = useNavigate()
  const { t } = useTranslation()

  const handleClick = () => {
    if (onClick) onClick()
    else navigate(`/coach/sessions/${session.id}`)
  }

  const time = session.scheduledAt ? format(parseISO(session.scheduledAt), 'HH:mm') : ''

  if (compact) {
    return (
      <div
        className="flex items-center gap-3 rounded-lg border p-3 cursor-pointer hover:bg-muted/50 transition-colors"
        onClick={handleClick}
      >
        <div className="flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-md bg-primary/10">
          <span className="text-xs font-bold text-primary">{format(parseISO(session.scheduledAt), 'MMM')}</span>
          <span className="text-sm font-bold text-primary leading-none">{format(parseISO(session.scheduledAt), 'd')}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{teamName ?? t('sessions.title')} · {time}</p>
          {session.location && <p className="text-xs text-muted-foreground truncate">{session.location}</p>}
        </div>
        <Badge className={`text-xs shrink-0 ${getStatusColor(session.status)}`}>{session.status}</Badge>
      </div>
    )
  }

  return (
    <Card className="cursor-pointer hover:shadow-md transition-all duration-200" onClick={handleClick}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge className={`text-xs ${getStatusColor(session.status)}`}>{capitalize(session.status)}</Badge>
              <Badge className={`text-xs ${getIntensityColor(session.intensity)}`}>{capitalize(session.intensity)}</Badge>
            </div>
            {teamName && <p className="mt-1.5 font-semibold">{teamName}</p>}
            <div className="mt-2 space-y-1.5 text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 shrink-0" />
                <span>{formatDate(session.scheduledAt, 'EEE, MMM d')} · {time}</span>
              </div>
              {session.durationMin && (
              <div className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 shrink-0" />
                <span>{session.durationMin} {t('common.min')}</span>
              </div>
              )}
              {session.location && (
                <div className="flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{session.location}</span>
                </div>
              )}
            </div>
          </div>
          {session.focus && session.focus.length > 0 && (
            <div className="flex flex-wrap gap-1 max-w-[120px]">
              {session.focus.slice(0, 3).map((f) => (
                <Badge key={f} variant="outline" className="text-xs">{f}</Badge>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
