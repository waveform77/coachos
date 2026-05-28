import * as React from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { cn } from '@/shared/lib/utils'
import { ScrollArea } from '@/shared/ui'
import type { LucideIcon } from 'lucide-react'

export interface NavItem {
  label: string
  href: string
  icon: LucideIcon
  badge?: number
}

interface SidebarNavProps {
  items: NavItem[]
  onNavigate?: () => void
}

export function SidebarNav({ items, onNavigate }: SidebarNavProps) {
  const location = useLocation()

  return (
    <ScrollArea className="flex-1 py-3">
      <nav className="space-y-1 px-2">
        {items.map((item) => {
          const isActive = location.pathname === item.href ||
            (item.href !== '/coach' && location.pathname.startsWith(item.href))
          const Icon = item.icon
          return (
            <NavLink
              key={item.href}
              to={item.href}
              onClick={onNavigate}
              className={cn(
                'group relative flex items-center gap-3 rounded-xl px-4 py-3 text-base font-medium transition-all duration-200 min-h-[52px]',
                isActive
                  ? 'bg-primary/15 text-primary shadow-sm shadow-primary/5'
                  : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
              )}
              title={item.label}
            >
              {isActive && (
                <span className="absolute left-0 top-1/2 h-6 w-0.5 -translate-y-1/2 rounded-r-full bg-primary" />
              )}
              <Icon className={cn(
                'h-6 w-6 shrink-0 transition-colors duration-200',
                isActive ? 'text-primary' : 'text-slate-400 group-hover:text-white'
              )} />
              <span className="truncate">{item.label}</span>
              {item.badge != null && item.badge > 0 && (
                <span className="ml-auto flex h-6 min-w-6 items-center justify-center rounded-full bg-primary px-2 text-xs font-semibold text-white shadow-sm shadow-primary/20">
                  {item.badge > 99 ? '99+' : item.badge}
                </span>
              )}
            </NavLink>
          )
        })}
      </nav>
    </ScrollArea>
  )
}
