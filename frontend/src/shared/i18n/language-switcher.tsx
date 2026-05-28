import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/shared/lib/utils'

export function LanguageSwitcher({ className }: { className?: string }) {
  const { i18n } = useTranslation()

  const setLang = (lng: string) => {
    void i18n.changeLanguage(lng)
  }

  return (
    <div
      className={cn(
        'inline-flex items-center rounded-md border border-border bg-muted/40 p-0.5 text-xs',
        className
      )}
      role="group"
      aria-label={i18n.t('common.language')}
    >
      <button
        type="button"
        onClick={() => setLang('ru')}
        className={cn(
          'rounded px-2 py-1 transition-colors',
          i18n.language.startsWith('ru')
            ? 'bg-background font-semibold shadow-sm'
            : 'text-muted-foreground hover:text-foreground'
        )}
      >
        RU
      </button>
      <button
        type="button"
        onClick={() => setLang('en')}
        className={cn(
          'rounded px-2 py-1 transition-colors',
          i18n.language.startsWith('en')
            ? 'bg-background font-semibold shadow-sm'
            : 'text-muted-foreground hover:text-foreground'
        )}
      >
        EN
      </button>
    </div>
  )
}
