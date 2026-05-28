import * as React from 'react'
import { getDevIndexBg } from '@/shared/lib/utils'
import { cn } from '@/shared/lib/utils'

interface DevIndexProps {
  value: number
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
  labelText?: string
  className?: string
}

const SIZES = {
  sm: { outer: 'h-14 w-14', text: 'text-base', labelClass: 'text-sm' },
  md: { outer: 'h-18 w-18', text: 'text-xl', labelClass: 'text-sm' },
  lg: { outer: 'h-24 w-24', text: 'text-2xl', labelClass: 'text-base' },
}

export function DevIndex({ value, size = 'md', showLabel = true, labelText, className }: DevIndexProps) {
  const clampedValue = Math.max(0, Math.min(100, value))
  const color = getDevIndexBg(clampedValue)
  const { outer, text, labelClass } = SIZES[size]
  const circumference = 2 * Math.PI * 20
  const dashOffset = circumference * (1 - clampedValue / 100)

  return (
    <div className={cn('flex flex-col items-center gap-1', className)}>
      <div className={cn('relative', outer)}>
        <svg className="h-full w-full -rotate-90" viewBox="0 0 48 48">
          <circle cx="24" cy="24" r="20" fill="none" stroke="currentColor" strokeWidth="4" className="text-muted" />
          <circle
            cx="24" cy="24" r="20" fill="none"
            stroke={color}
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            className="transition-all duration-700"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={cn('font-bold', text)} style={{ color }}>{clampedValue}</span>
        </div>
      </div>
      {showLabel && <span className={cn('font-medium text-muted-foreground', labelClass)}>{labelText ?? 'Dev Index'}</span>}
    </div>
  )
}
