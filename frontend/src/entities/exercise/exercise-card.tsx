import * as React from 'react'
import { Star, Clock, Users } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { Exercise } from '@/shared/types'
import { Card, CardContent, Badge } from '@/shared/ui'
import { capitalize } from '@/shared/lib/utils'

interface ExerciseCardProps {
  exercise: Exercise
  onClick?: () => void
  onEdit?: () => void
  onAddToSession?: () => void
  compact?: boolean
}

const CATEGORY_COLORS: Record<string, string> = {
  technique: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  tactics: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  physical: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  coordination: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
  goalkeeping: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  warmup: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  cooldown: 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-200',
}

export function ExerciseCard({ exercise, onClick, compact }: ExerciseCardProps) {
  const { t } = useTranslation()
  return (
    <Card
      className={`transition-all duration-200 ${onClick ? 'cursor-pointer hover:shadow-md hover:-translate-y-0.5' : ''}`}
      onClick={onClick}
    >
      <CardContent className={compact ? 'p-3' : 'p-4'}>
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${CATEGORY_COLORS[exercise.category] ?? 'bg-slate-100 text-slate-800'}`}>
                {t(`exercises.${exercise.category}`)}
              </span>
              {exercise.isGlobal && (
                <Badge variant="outline" className="text-xs">{t('exercises.global')}</Badge>
              )}
            </div>
            <h3 className={`mt-1.5 font-semibold ${compact ? 'text-sm' : ''} line-clamp-2`}>{exercise.name}</h3>
            <div className="mt-2 flex items-center gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className={`h-3.5 w-3.5 ${i < exercise.difficulty ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`} />
              ))}
            </div>
          </div>
        </div>
        {!compact && (
          <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground border-t pt-3">
            {exercise.durationMin && (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />{exercise.durationMin} {t('common.min')}
              </span>
            )}
            {(exercise.playersMin || exercise.playersMax) && (
              <span className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                {exercise.playersMin ?? '?'}{exercise.playersMax ? `–${exercise.playersMax}` : '+'} {t('exercises.players')}
              </span>
            )}
          </div>
        )}
        {!compact && exercise.tags && exercise.tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {exercise.tags.slice(0, 4).map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
