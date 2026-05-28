import * as React from 'react'
import { useNavigate } from 'react-router-dom'
import { Users, UserCheck } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { Team } from '@/shared/types'
import { Card, CardContent, Badge } from '@/shared/ui'

interface TeamCardProps {
  team: Team
  memberCount?: number
  onClick?: () => void
}

export function TeamCard({ team, memberCount, onClick }: TeamCardProps) {
  const navigate = useNavigate()
  const { t } = useTranslation()

  const handleClick = () => {
    if (onClick) onClick()
    else navigate(`/coach/teams/${team.id}`)
  }

  return (
    <Card
      className="cursor-pointer hover:shadow-md transition-all duration-200 hover:-translate-y-0.5"
      onClick={handleClick}
    >
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-lg truncate">{team.name}</h3>
            <div className="mt-2 flex flex-wrap gap-2">
              {team.ageGroup && (
                <Badge variant="secondary">{team.ageGroup}</Badge>
              )}
              {team.season && (
                <Badge variant="outline">{team.season}</Badge>
              )}
            </div>
          </div>
          <div className="ml-3 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <Users className="h-5 w-5 text-primary" />
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-3 text-sm text-muted-foreground border-t pt-3">
          {memberCount != null && (
            <span className="flex items-center gap-1">
              <Users className="h-3.5 w-3.5" />{memberCount} {t('teams.playersCount')}
            </span>
          )}
          {team.headCoach && (
            <span className="flex items-center gap-1 truncate">
              <UserCheck className="h-3.5 w-3.5 shrink-0" />
              {team.headCoach.firstName} {team.headCoach.lastName}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
