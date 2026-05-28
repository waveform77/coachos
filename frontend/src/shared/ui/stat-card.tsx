import * as React from 'react'
import { TrendingUp, TrendingDown, Minus, type LucideIcon } from 'lucide-react'
import { Card, CardContent } from './card'
import { Skeleton } from './skeleton'
import { cn } from '../lib/utils'

interface StatCardProps {
  title: string
  value: string | number
  description?: string
  icon?: LucideIcon
  trend?: { value: number; direction: 'up' | 'down' | 'neutral' }
  loading?: boolean
  className?: string
  iconClassName?: string
}

export function StatCard({ title, value, description, icon: Icon, trend, loading, className, iconClassName }: StatCardProps) {
  if (loading) {
    return (
      <Card className={cn('overflow-hidden', className)}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-11 w-11 rounded-xl" />
          </div>
          <Skeleton className="mt-4 h-9 w-20" />
          <Skeleton className="mt-2 h-4 w-32" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card
      className={cn(
        'group overflow-hidden transition-all duration-300 hover:shadow-lg',
        className
      )}
    >
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          {Icon && (
            <div
              className={cn(
                'flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 transition-all duration-300 group-hover:scale-110 group-hover:bg-primary/15',
                iconClassName
              )}
            >
              <Icon className="h-5 w-5 text-primary transition-transform duration-300 group-hover:scale-110" />
            </div>
          )}
        </div>
        <div className="mt-4 flex items-end gap-2">
          <span className="text-3xl font-bold tracking-tight tabular-nums">{value}</span>
          {trend && (
            <span
              className={cn(
                'mb-1 flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-xs font-medium',
                trend.direction === 'up' && 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400',
                trend.direction === 'down' && 'bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400',
                trend.direction === 'neutral' && 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400',
              )}
            >
              {trend.direction === 'up' && <TrendingUp className="h-3 w-3" />}
              {trend.direction === 'down' && <TrendingDown className="h-3 w-3" />}
              {trend.direction === 'neutral' && <Minus className="h-3 w-3" />}
              {Math.abs(trend.value)}%
            </span>
          )}
        </div>
        {description && <p className="mt-2 text-base text-muted-foreground">{description}</p>}
      </CardContent>
    </Card>
  )
}
