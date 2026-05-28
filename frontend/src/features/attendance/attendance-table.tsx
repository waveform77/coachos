import * as React from 'react'
import { toast } from 'sonner'
import { Loader2, Save } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { Player, AttendanceStatus, AttendanceRecord } from '@/shared/types'
import { Button, Badge, Input, Avatar, AvatarFallback, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui'
import { getInitials, getAttendanceColor } from '@/shared/lib/utils'
import { sessionsApi } from '@/shared/api/sessions.api'

interface AttendanceEntry {
  player: Player
  status: AttendanceStatus
  reason: string
}

interface AttendanceTableProps {
  sessionId: string
  players: Player[]
  initialRecords?: AttendanceRecord[]
  onSaved?: () => void
}

const STATUS_OPTIONS: AttendanceStatus[] = ['present', 'absent', 'late', 'excused', 'injured']

export function AttendanceTable({ sessionId, players, initialRecords = [], onSaved }: AttendanceTableProps) {
  const { t } = useTranslation()
  const [entries, setEntries] = React.useState<AttendanceEntry[]>(() =>
    players.map((p) => {
      const existing = initialRecords.find((r) => r.playerID === p.id)
      return { player: p, status: existing?.status ?? 'present', reason: existing?.reason ?? '' }
    })
  )
  const [saving, setSaving] = React.useState(false)

  const updateEntry = (playerId: string, updates: Partial<AttendanceEntry>) => {
    setEntries((prev) => prev.map((e) => e.player.id === playerId ? { ...e, ...updates } : e))
  }

  const markAll = (status: AttendanceStatus) => {
    setEntries((prev) => prev.map((e) => ({ ...e, status })))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await sessionsApi.markAttendance(sessionId, entries.map((e) => ({
        playerID: e.player.id,
        status: e.status,
        reason: e.reason || undefined,
      })))
      toast.success('Attendance saved')
      onSaved?.()
    } catch {
      toast.error('Failed to save attendance')
    } finally {
      setSaving(false)
    }
  }

  const presentCount = entries.filter((e) => e.status === 'present').length
  const totalCount = entries.length

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">{presentCount}</span>/{totalCount} {t('attendance.present').toLowerCase()}
          <span className="ml-2">({Math.round((presentCount / Math.max(totalCount, 1)) * 100)}%)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">{t('attendance.markAllPresent')}:</span>
          {STATUS_OPTIONS.map((s) => (
            <button key={s} onClick={() => markAll(s)}
              className={`rounded-md px-2 py-1 text-xs font-medium border ${getAttendanceColor(s)}`}>
              {t(`commonEnums.attendanceStatus.${s}`)}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-md border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left px-4 py-3 font-medium">{t('attendance.player')}</th>
                <th className="text-left px-4 py-3 font-medium">{t('common.status')}</th>
                <th className="text-left px-4 py-3 font-medium">{t('attendance.reason')}</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {entries.map((entry) => (
                <tr key={entry.player.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-7 w-7">
                        <AvatarFallback className="text-xs">
                          {getInitials(entry.player.firstName, entry.player.lastName)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{entry.player.firstName} {entry.player.lastName}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Select value={entry.status} onValueChange={(v) => updateEntry(entry.player.id, { status: v as AttendanceStatus })}>
                      <SelectTrigger className="h-8 w-28">
                        <SelectValue>
                          <Badge className={`text-xs ${getAttendanceColor(entry.status)}`}>{t(`commonEnums.attendanceStatus.${entry.status}`)}</Badge>
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {STATUS_OPTIONS.map((s) => (
                          <SelectItem key={s} value={s}>
                            <Badge className={`text-xs ${getAttendanceColor(s)}`}>{t(`commonEnums.attendanceStatus.${s}`)}</Badge>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="px-4 py-3">
                    {(entry.status === 'absent' || entry.status === 'excused' || entry.status === 'injured') && (
                      <Input
                        value={entry.reason}
                        onChange={(e) => updateEntry(entry.player.id, { reason: e.target.value })}
                        placeholder={t('attendance.reasonPlaceholder')}
                        className="h-8 text-sm"
                      />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Button onClick={handleSave} disabled={saving} className="w-full sm:w-auto">
        {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
        {t('attendance.markAttendance')}
      </Button>
    </div>
  )
}
