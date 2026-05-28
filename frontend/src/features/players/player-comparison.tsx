import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { X, ArrowRightLeft } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, Badge, Progress, Button } from '@/shared/ui'
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui'
import { getInitials, calculateAge } from '@/shared/lib/utils'
import type { Player } from '@/shared/types'

interface PlayerComparisonProps {
  playerA: Player
  playerB: Player
  onClose: () => void
}

export function PlayerComparison({ playerA, playerB, onClose }: PlayerComparisonProps) {
  const { t } = useTranslation()

  const fields = [
    { label: t('players.devIndex'), key: 'devIndex' as const, max: 100 },
    { label: t('players.age'), key: 'age' as const, max: 30 },
    { label: t('players.position'), key: 'position' as const },
    { label: t('players.height'), key: 'heightCm' as const, max: 220, suffix: ' см' },
    { label: t('players.weight'), key: 'weightKg' as const, max: 120, suffix: ' кг' },
  ]

  const getValue = (p: Player, key: string) => {
    if (key === 'age') return calculateAge(p.birthDate) ?? 0
    if (key === 'position') return p.position ?? '—'
    return (p as unknown as Record<string, number | string | undefined>)[key]
  }

  return (
    <Card className="relative">
      <Button variant="ghost" size="icon" className="absolute right-2 top-2" onClick={onClose}>
        <X className="h-4 w-4" />
      </Button>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <ArrowRightLeft className="h-5 w-5" />
          {t('playerComparison.title')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-3 gap-4 items-center">
          <div className="text-center">
            <Avatar className="h-16 w-16 mx-auto">
              {playerA.photoURL && <AvatarImage src={playerA.photoURL} alt={playerA.firstName} />}
              <AvatarFallback className="bg-primary/10 text-primary text-xl font-bold">
                {getInitials(playerA.firstName, playerA.lastName)}
              </AvatarFallback>
            </Avatar>
            <p className="mt-2 font-semibold text-base">{playerA.firstName} {playerA.lastName}</p>
          </div>
          <div className="text-center text-sm text-muted-foreground">{t('playerComparison.vs')}</div>
          <div className="text-center">
            <Avatar className="h-16 w-16 mx-auto">
              {playerB.photoURL && <AvatarImage src={playerB.photoURL} alt={playerB.firstName} />}
              <AvatarFallback className="bg-primary/10 text-primary text-xl font-bold">
                {getInitials(playerB.firstName, playerB.lastName)}
              </AvatarFallback>
            </Avatar>
            <p className="mt-2 font-semibold text-base">{playerB.firstName} {playerB.lastName}</p>
          </div>
        </div>

        {fields.map((field) => {
          const aVal = getValue(playerA, field.key)
          const bVal = getValue(playerB, field.key)
          const isNum = typeof aVal === 'number' && typeof bVal === 'number'

          return (
            <div key={field.key}>
              <p className="text-sm font-medium text-muted-foreground mb-2">{field.label}</p>
              <div className="grid grid-cols-3 gap-4 items-center">
                <div className="text-right">
                  {field.key === 'position' ? (
                    <Badge variant="secondary">{aVal ? t(`commonEnums.positions.${aVal}`) : '—'}</Badge>
                  ) : (
                    <span className={`font-semibold text-lg ${isNum && aVal > bVal ? 'text-emerald-600' : ''}`}>
                      {aVal}{field.suffix ?? ''}
                    </span>
                  )}
                </div>
                <div className="text-center">
                  {isNum && field.max ? (
                    <div className="space-y-1">
                      <Progress value={Math.min((aVal / field.max) * 100, 100)} className="h-2" />
                      <Progress value={Math.min((bVal / field.max) * 100, 100)} className="h-2" />
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground">{t('playerComparison.comparison')}</span>
                  )}
                </div>
                <div className="text-left">
                  {field.key === 'position' ? (
                    <Badge variant="secondary">{bVal ? t(`commonEnums.positions.${bVal}`) : '—'}</Badge>
                  ) : (
                    <span className={`font-semibold text-lg ${isNum && bVal > aVal ? 'text-emerald-600' : ''}`}>
                      {bVal}{field.suffix ?? ''}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
