import * as React from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  BookOpen, BarChart3, Calendar, Users, Brain, Trophy, Shield, ChevronRight,
  Star, Zap, Target, Globe, Home, ArrowRight, Sparkles,
} from 'lucide-react'
import { Button } from '@/shared/ui'
import { cn } from '@/shared/lib/utils'
import { LanguageSwitcher } from '@/shared/i18n/language-switcher'
import { useAuthStore } from '@/app/store/auth.store'

const FEATURE_META = [
  { key: 'sessionBuilder' as const, icon: Calendar, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', hover: 'hover:border-emerald-500/40 hover:shadow-emerald-500/10' },
  { key: 'playerAnalytics' as const, icon: BarChart3, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20', hover: 'hover:border-blue-500/40 hover:shadow-blue-500/10' },
  { key: 'aiAssistant' as const, icon: Brain, color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20', hover: 'hover:border-purple-500/40 hover:shadow-purple-500/10' },
  { key: 'matchManagement' as const, icon: Trophy, color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20', hover: 'hover:border-orange-500/40 hover:shadow-orange-500/10' },
  { key: 'attendance' as const, icon: Shield, color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20', hover: 'hover:border-red-500/40 hover:shadow-red-500/10' },
  { key: 'parentPortal' as const, icon: Globe, color: 'text-teal-400', bg: 'bg-teal-500/10', border: 'border-teal-500/20', hover: 'hover:border-teal-500/40 hover:shadow-teal-500/10' },
]

const ROLE_META = [
  { key: 'coach' as const, icon: Target, color: 'from-emerald-500 to-teal-500', shadow: 'shadow-emerald-500/20' },
  { key: 'player' as const, icon: Star, color: 'from-blue-500 to-indigo-500', shadow: 'shadow-blue-500/20' },
  { key: 'parent' as const, icon: Shield, color: 'from-orange-500 to-red-500', shadow: 'shadow-orange-500/20' },
]

const STATS_META = [
  { value: '10x', labelKey: 'landing.stat1Label' as const, icon: Zap },
  { value: '360°', labelKey: 'landing.stat2Label' as const, icon: BarChart3 },
  { value: '100%', labelKey: 'landing.stat3Label' as const, icon: Globe },
]

const HERO_CARDS = ['heroCard1', 'heroCard2', 'heroCard3'] as const

function useScrollReveal(threshold = 0.1) {
  const ref = React.useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = React.useState(false)

  React.useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.unobserve(el)
        }
      },
      { threshold }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [threshold])

  return { ref, isVisible }
}

function AnimatedSection({ children, className, delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const { ref, isVisible } = useScrollReveal()
  return (
    <div
      ref={ref}
      className={cn(
        'transition-all duration-700 ease-out',
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8',
        className
      )}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  )
}

function StaggerContainer({ children, className }: { children: React.ReactNode; className?: string }) {
  const { ref, isVisible } = useScrollReveal()
  return (
    <div ref={ref} className={className}>
      {React.Children.map(children, (child, i) => (
        <div
          key={i}
          className={cn(
            'transition-all duration-700 ease-out',
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          )}
          style={{ transitionDelay: `${i * 100}ms` }}
        >
          {child}
        </div>
      ))}
    </div>
  )
}

export function LandingPage() {
  const { t } = useTranslation()
  const { isAuthenticated } = useAuthStore()

  return (
    <div className="min-h-screen bg-slate-950 text-white selection:bg-primary/30 selection:text-white">
      {/* Header */}
      <header className="fixed top-4 left-4 right-4 z-50 mx-auto max-w-7xl rounded-2xl border border-white/5 bg-slate-900/80 px-4 shadow-2xl shadow-black/20 backdrop-blur-xl sm:px-6">
        <div className="flex h-14 items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary shadow-lg shadow-primary/25">
              <BookOpen className="h-4 w-4 text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight">{t('common.brand')}</span>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <Link to="/" className="hidden sm:inline-flex">
              <Button
                variant="ghost"
                size="sm"
                className="gap-1.5 text-slate-300 hover:text-white hover:bg-white/5"
              >
                <Home className="h-4 w-4" />
                {t('landing.home')}
              </Button>
            </Link>
            <LanguageSwitcher className="border-white/10 bg-white/5" />
            {isAuthenticated ? (
              <>
                <Link to="/profile">
                  <Button variant="ghost" size="sm" className="text-slate-300 hover:text-white hover:bg-white/5">
                    {t('landing.profileBtn')}
                  </Button>
                </Link>
                <Link to="/dashboard">
                  <Button size="sm" className="gap-1 shadow-lg shadow-primary/20">
                    {t('landing.goToApp')} <ChevronRight className="h-4 w-4" />
                  </Button>
                </Link>
              </>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="ghost" size="sm" className="text-slate-300 hover:text-white hover:bg-white/5">
                    {t('landing.signIn')}
                  </Button>
                </Link>
                <Link to="/register">
                  <Button size="sm" className="gap-1 shadow-lg shadow-primary/20">
                    {t('landing.getStarted')} <ChevronRight className="h-4 w-4" />
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-28">
        {/* Background effects */}
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-950/40 via-slate-950 to-blue-950/30" />
        <div className="absolute -top-20 left-1/2 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-emerald-500/8 blur-[100px]" />
        <div className="absolute top-40 right-0 h-[400px] w-[400px] rounded-full bg-blue-500/5 blur-[100px]" />
        <div className="absolute bottom-0 left-0 h-[300px] w-[300px] rounded-full bg-teal-500/5 blur-[100px]" />

        <div className="relative mx-auto max-w-7xl px-4 py-20 text-center sm:px-6 sm:py-28">
          <AnimatedSection>
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-1.5 text-sm text-emerald-400 shadow-lg shadow-emerald-500/5">
              <Sparkles className="h-3.5 w-3.5" />
              {t('landing.badge')}
            </div>
          </AnimatedSection>

          <AnimatedSection delay={100}>
            <h1 className="mt-8 text-5xl font-extrabold tracking-tight sm:text-6xl lg:text-8xl">
              {t('landing.heroTitle')}{' '}
              <span className="relative">
                <span className="bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent">
                  {t('landing.heroHighlight')}
                </span>
                <span className="absolute -bottom-2 left-0 right-0 h-1 rounded-full bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 opacity-50 blur-sm" />
              </span>
            </h1>
          </AnimatedSection>

          <AnimatedSection delay={200}>
            <p className="mx-auto mt-8 max-w-2xl text-lg leading-relaxed text-slate-400 sm:text-xl">
              {t('landing.heroSubtitle')}
            </p>
          </AnimatedSection>

          <AnimatedSection delay={300}>
            <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              {isAuthenticated ? (
                <>
                  <Link to="/dashboard">
                    <Button
                      size="lg"
                      className="group gap-2 rounded-xl px-8 text-base shadow-xl shadow-primary/20 transition-all duration-300 hover:shadow-primary/30 hover:scale-[1.02] active:scale-[0.98]"
                    >
                      {t('landing.goToApp')}
                      <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                    </Button>
                  </Link>
                  <Link to="/profile">
                    <Button
                      size="lg"
                      variant="outline"
                      className="gap-2 rounded-xl text-base border-white/10 text-slate-300 hover:border-white/20 hover:bg-white/5 hover:text-white transition-all duration-300"
                    >
                      {t('landing.profileBtn')}
                    </Button>
                  </Link>
                </>
              ) : (
                <>
                  <Link to="/register">
                    <Button
                      size="lg"
                      className="group gap-2 rounded-xl px-8 text-base shadow-xl shadow-primary/20 transition-all duration-300 hover:shadow-primary/30 hover:scale-[1.02] active:scale-[0.98]"
                    >
                      {t('landing.startFree')}
                      <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                    </Button>
                  </Link>
                  <Link to="/login">
                    <Button
                      size="lg"
                      variant="outline"
                      className="gap-2 rounded-xl text-base border-white/10 text-slate-300 hover:border-white/20 hover:bg-white/5 hover:text-white transition-all duration-300"
                    >
                      {t('landing.signInAccount')}
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </AnimatedSection>
        </div>

        {/* Hero Cards */}
        <div className="relative mx-auto max-w-5xl px-4 pb-20">
          <AnimatedSection delay={400}>
            <div className="rounded-2xl border border-white/5 bg-slate-900/60 p-5 shadow-2xl shadow-black/20 backdrop-blur-xl">
              <div className="grid gap-4 sm:grid-cols-3">
                {HERO_CARDS.map((key, i) => (
                  <div
                    key={key}
                    className="group relative overflow-hidden rounded-xl border border-white/5 bg-slate-800/50 p-5 transition-all duration-300 hover:border-white/10 hover:bg-slate-800/80"
                  >
                    <div className={cn('mb-3 h-1.5 w-10 rounded-full', i === 0 ? 'bg-emerald-500' : i === 1 ? 'bg-blue-500' : 'bg-orange-500')} />
                    <p className="font-medium text-slate-200">{t(`landing.${key}`)}</p>
                    <div className="absolute -right-4 -top-4 h-16 w-16 rounded-full bg-white/[0.02] transition-transform duration-500 group-hover:scale-150" />
                  </div>
                ))}
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* Stats Strip */}
      <section className="relative border-y border-white/5 bg-slate-900/30">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
          <StaggerContainer className="grid gap-10 sm:grid-cols-3">
            {STATS_META.map(({ value, labelKey, icon: Icon }) => (
              <div key={labelKey} className="group flex flex-col items-center gap-4 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 shadow-lg shadow-primary/5 ring-1 ring-primary/20 transition-all duration-300 group-hover:scale-110 group-hover:shadow-primary/15">
                  <Icon className="h-6 w-6 text-primary" />
                </div>
                <p className="text-4xl font-black tracking-tight text-white transition-transform duration-300 group-hover:scale-105">{value}</p>
                <p className="max-w-[200px] text-sm leading-relaxed text-slate-400">{t(labelKey)}</p>
              </div>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <AnimatedSection className="mb-20 text-center">
            <h2 className="text-4xl font-bold tracking-tight sm:text-5xl">{t('landing.featuresTitle')}</h2>
            <p className="mx-auto mt-5 max-w-xl text-lg text-slate-400">{t('landing.featuresSubtitle')}</p>
          </AnimatedSection>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURE_META.map(({ key, icon: Icon, color, bg, border, hover }, i) => (
              <AnimatedSection key={key} delay={i * 100}>
                <div
                  className={cn(
                    'group relative h-full rounded-2xl border bg-slate-900/40 p-7 backdrop-blur-sm transition-all duration-300',
                    border,
                    hover,
                    'hover:-translate-y-1 hover:shadow-xl'
                  )}
                >
                  <div className={cn('mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110', bg)}>
                    <Icon className={cn('h-6 w-6', color)} />
                  </div>
                  <h3 className="text-lg font-semibold text-white">{t(`landing.features.${key}.title`)}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-slate-400">{t(`landing.features.${key}.description`)}</p>
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/[0.02] to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* Roles Section */}
      <section className="relative py-28">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-900/30 to-transparent" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
          <AnimatedSection className="mb-20 text-center">
            <h2 className="text-4xl font-bold tracking-tight sm:text-5xl">{t('landing.rolesTitle')}</h2>
            <p className="mx-auto mt-5 max-w-xl text-lg text-slate-400">{t('landing.rolesSubtitle')}</p>
          </AnimatedSection>

          <div className="grid gap-8 lg:grid-cols-3">
            {ROLE_META.map(({ key, icon: Icon, color, shadow }, i) => (
              <AnimatedSection key={key} delay={i * 150}>
                <div className="group relative overflow-hidden rounded-2xl border border-white/5 bg-slate-900/60 shadow-xl transition-all duration-300 hover:-translate-y-2 hover:border-white/10 hover:shadow-2xl">
                  <div className={cn('relative flex items-center gap-4 bg-gradient-to-r p-7', color)}>
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm shadow-lg">
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-white">{t(`landing.roles.${key}.name`)}</h3>
                    <div className={cn('absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10 blur-2xl transition-all duration-500 group-hover:scale-150', shadow)} />
                  </div>
                  <div className="p-7">
                    <ul className="space-y-4">
                      {(['f1', 'f2', 'f3', 'f4'] as const).map((fk) => (
                        <li key={fk} className="flex items-center gap-3 text-sm text-slate-300">
                          <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10">
                            <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                          </div>
                          {t(`landing.roles.${key}.${fk}`)}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-28">
        <div className="mx-auto max-w-4xl px-4">
          <AnimatedSection>
            <div className="relative overflow-hidden rounded-[2rem] border border-emerald-500/10 bg-gradient-to-br from-emerald-950/60 via-slate-900/80 to-teal-950/60 p-12 text-center shadow-2xl shadow-emerald-950/20 sm:p-16">
              <div className="absolute -left-20 -top-20 h-64 w-64 rounded-full bg-emerald-500/10 blur-[80px]" />
              <div className="absolute -bottom-20 -right-20 h-64 w-64 rounded-full bg-teal-500/10 blur-[80px]" />

              <div className="relative">
                <h2 className="text-4xl font-bold tracking-tight sm:text-5xl">{t('landing.ctaTitle')}</h2>
                <p className="mx-auto mt-5 max-w-lg text-lg text-slate-400">{t('landing.ctaSubtitle')}</p>
                <div className="mt-10">
                  {isAuthenticated ? (
                    <Link to="/dashboard">
                      <Button
                        size="lg"
                        className="group gap-2 rounded-xl px-10 text-base shadow-xl shadow-primary/20 transition-all duration-300 hover:shadow-primary/30 hover:scale-[1.02] active:scale-[0.98]"
                      >
                        {t('landing.goToApp')}
                        <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                      </Button>
                    </Link>
                  ) : (
                    <Link to="/register">
                      <Button
                        size="lg"
                        className="group gap-2 rounded-xl px-10 text-base shadow-xl shadow-primary/20 transition-all duration-300 hover:shadow-primary/30 hover:scale-[1.02] active:scale-[0.98]"
                      >
                        {t('landing.ctaButton')}
                        <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 bg-slate-950">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
          <div className="flex flex-col items-center justify-between gap-8 sm:flex-row">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary shadow-lg shadow-primary/20">
                <BookOpen className="h-4 w-4 text-white" />
              </div>
              <span className="text-lg font-bold">{t('common.brand')}</span>
            </div>

            <nav className="flex flex-wrap items-center justify-center gap-6 text-sm">
              <Link to="/" className="flex items-center gap-1.5 text-slate-400 transition-colors duration-200 hover:text-white">
                <Home className="h-4 w-4" />
                {t('landing.footerHome')}
              </Link>
              <a href="#features" className="text-slate-400 transition-colors duration-200 hover:text-white">
                {t('landing.footerFeatures')}
              </a>
              <a href="#roles" className="text-slate-400 transition-colors duration-200 hover:text-white">
                {t('landing.footerRoles')}
              </a>
            </nav>

            <p className="text-sm text-slate-500">{t('landing.footer')}</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
