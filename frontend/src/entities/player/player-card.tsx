import * as React from 'react'
import { useNavigate } from 'react-router-dom'
import { User } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { Player } from '@/shared/types'
import { Card, CardContent, Badge, Avatar, AvatarImage, AvatarFallback } from '@/shared/ui'
import { getInitials, calculateAge, capitalize } from '@/shared/lib/utils'
import { DevIndex } from './player-dev-index'
import { PlayerFormBadge } from './player-form-badge'

interface PlayerCardProps {
  player: Player
  onClick?: () => void
  showTeam?: boolean
}

export function PlayerCard({ player, onClick }: PlayerCardProps) {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const age = calculateAge(player.birthDate)

  const handleClick = () => {
    if (onClick) onClick()
    else navigate(`/coach/players/${player.id}`)
  }

  return (
    <Card
      className="cursor-pointer hover:shadow-md transition-all duration-200 overflow-hidden"
      onClick={handleClick}
    >
      <CardContent className="p-5">
        <div className="flex items-start gap-3">
          <Avatar className="h-14 w-14 shrink-0">
            {player.photoURL ? (
              <AvatarImage src={player.photoURL} alt={player.firstName} />
            ) : null}
            <AvatarFallback className="bg-primary/10 text-primary text-lg font-semibold">
              {getInitials(player.firstName, player.lastName)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-lg font-semibold truncate">{player.firstName} {player.lastName}</p>
            <div className="mt-1.5 flex flex-wrap items-center gap-2">
              {player.position && (
                <Badge variant="secondary">{t(`commonEnums.positions.${player.position}`)}</Badge>
              )}
              {age && <span className="text-sm text-muted-foreground">{t('players.age')} {age}</span>}
              {player.dominantFoot && (
                <span className="text-sm text-muted-foreground">{t(`commonEnums.dominantFoot.${player.dominantFoot}`)}</span>
              )}
            </div>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1">
            <DevIndex value={player.devIndex} size="sm" showLabel={false} />
            <PlayerFormBadge playerId={player.id} size="sm" />
          </div>
        </div>
        {(player.heightCm || player.weightKg) && (
          <div className="mt-3 flex gap-3 text-sm text-muted-foreground border-t pt-3">
            {player.heightCm && <span>{player.heightCm} см</span>}
            {player.weightKg && <span>{player.weightKg} кг</span>}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
