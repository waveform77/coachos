import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { Sun, Moon, Monitor } from 'lucide-react'
import { useTheme } from '@/app/providers/theme-provider'
import { cn } from '@/shared/lib/utils'

export function ThemeSwitcher({ className }: { className?: string }) {
  const { t } = useTranslation()
  const { theme, setTheme } = useTheme()

  const options = [
    { key: 'light', icon: Sun, label: t('common.themeLight') },
    { key: 'dark', icon: Moon, label: t('common.themeDark') },
    { key: 'system', icon: Monitor, label: t('common.themeSystem') },
  ] as const

  return (
    <div
      className={cn(
        'inline-flex items-center rounded-md border border-border bg-muted/40 p-0.5',
        className
      )}
      role="group"
      aria-label={t('common.theme')}
    >
      {options.map(({ key, icon: Icon, label }) => (
        <button
          key={key}
          type="button"
          onClick={() => setTheme(key as 'light' | 'dark' | 'system')}
          className={cn(
            'flex items-center gap-1.5 rounded px-3 py-1.5 text-sm transition-colors',
            theme === key
              ? 'bg-background font-semibold shadow-sm text-foreground'
              : 'text-muted-foreground hover:text-foreground'
          )}
          title={label}
        >
          <Icon className="h-5 w-5" />
          <span className="hidden sm:inline">{label}</span>
        </button>
      ))}
    </div>
  )
}
