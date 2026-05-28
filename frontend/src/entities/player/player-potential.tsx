import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { Progress } from '@/shared/ui'

interface PlayerPotentialProps {
  devIndex: number
  potentialAbility?: number
}

export function PlayerPotential({ devIndex, potentialAbility = 0 }: PlayerPotentialProps) {
  const { t } = useTranslation()

  if (!potentialAbility || potentialAbility <= 0) return null

  const currentPct = Math.min(devIndex, 100)
  const potentialPct = Math.min(potentialAbility, 100)

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">{t('playerPotential.current')}</span>
        <span className="font-medium">{Math.round(currentPct)} / 100</span>
      </div>
      <div className="relative h-3 rounded-full bg-muted overflow-hidden">
        <div
          className="absolute left-0 top-0 h-full rounded-full bg-primary/30 border-2 border-dashed border-primary"
          style={{ width: `${potentialPct}%` }}
        />
        <div
          className="absolute left-0 top-0 h-full rounded-full bg-primary"
          style={{ width: `${currentPct}%` }}
        />
      </div>
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{t('playerPotential.potential')}: {potentialPct}</span>
        <span>{potentialPct - currentPct > 0 ? `+${Math.round(potentialPct - currentPct)}` : ''}</span>
      </div>
    </div>
  )
}
