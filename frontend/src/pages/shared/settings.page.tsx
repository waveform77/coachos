import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Bell, Palette, Languages } from 'lucide-react'
import { PageHeader, Card, CardContent, CardDescription, CardHeader, CardTitle, Button } from '@/shared/ui'
import { ThemeSwitcher } from '@/shared/ui/theme-switcher'
import { LanguageSwitcher } from '@/shared/i18n/language-switcher'
import { ROUTES } from '@/shared/config/routes'

export function SettingsPage() {
  const { t } = useTranslation()

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader title={t('common.settings')} description={t('settingsPage.description')} />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Palette className="h-4 w-4 text-primary" />
            {t('settingsPage.appearance')}
          </CardTitle>
          <CardDescription>{t('settingsPage.appearanceDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          <ThemeSwitcher className="w-full justify-center sm:w-auto" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Languages className="h-4 w-4 text-primary" />
            {t('settingsPage.language')}
          </CardTitle>
          <CardDescription>{t('settingsPage.languageDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          <LanguageSwitcher className="w-full justify-center sm:w-auto" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Bell className="h-4 w-4 text-primary" />
            {t('common.notifications')}
          </CardTitle>
          <CardDescription>{t('settingsPage.notificationsHint')}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" asChild>
            <Link to={ROUTES.NOTIFICATIONS}>{t('settingsPage.openNotifications')}</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
