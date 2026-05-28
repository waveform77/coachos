import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { BookOpen, ArrowLeft } from 'lucide-react'
import { RegisterForm } from '@/features/auth/register-form'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui'
import { LanguageSwitcher } from '@/shared/i18n/language-switcher'

export function RegisterPage() {
  const { t } = useTranslation()
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 p-4">
      {/* Background effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-950/30 via-slate-950 to-blue-950/20" />
      <div className="absolute -top-40 left-1/2 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-emerald-500/5 blur-[120px]" />
      <div className="absolute bottom-0 right-0 h-[400px] w-[400px] rounded-full bg-blue-500/5 blur-[100px]" />

      <div className="absolute right-4 top-4 z-10">
        <LanguageSwitcher className="border-white/10 bg-white/5" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Back to home */}
        <div className="mb-6 flex justify-center">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-400 backdrop-blur-sm transition-all duration-200 hover:border-white/20 hover:bg-white/10 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            {t('landing.home')}
          </Link>
        </div>

        <div className="mb-8 flex flex-col items-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary shadow-xl shadow-primary/20 transition-transform duration-300 hover:scale-105">
            <BookOpen className="h-8 w-8 text-white" />
          </div>
          <h1 className="mt-5 text-3xl font-bold tracking-tight text-white">{t('common.brand')}</h1>
          <p className="mt-1.5 text-slate-400">{t('common.tagline')}</p>
        </div>

        <Card className="border-white/10 bg-slate-900/60 shadow-2xl shadow-black/20 backdrop-blur-xl">
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl text-white">{t('auth.createAccount')}</CardTitle>
            <CardDescription className="text-slate-400">{t('auth.registerSubtitle')}</CardDescription>
          </CardHeader>
          <CardContent>
            <RegisterForm />
            <p className="mt-6 text-center text-sm text-slate-400">
              {t('auth.haveAccount')}{' '}
              <Link
                to="/login"
                className="font-medium text-primary transition-colors duration-200 hover:text-primary/80"
              >
                {t('auth.signInLink')}
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
