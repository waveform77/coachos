import * as React from 'react'
import { Outlet } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  LayoutDashboard, Users, Calendar, Dumbbell, ClipboardCheck, BarChart3,
  Brain, Trophy, UserCheck, Target, BookOpen, Home, Building2,
  Star, TrendingUp, FileText, KeyRound, ClipboardList, Shield,
} from 'lucide-react'
import { useAuthStore } from '@/app/store/auth.store'
import { Link } from 'react-router-dom'
import { cn } from '@/shared/lib/utils'
import { Sheet, SheetContent } from '@/shared/ui'
import { SidebarNav, type NavItem } from './sidebar-nav'
import { Topbar } from './topbar'
import { useIsMobile } from '@/shared/lib/hooks'
import type { TFunction } from 'i18next'

function getNavItems(role: string, t: TFunction): NavItem[] {
  switch (role) {
    case 'coach':
      return [
        { label: t('nav.coach.commandCenter'), href: '/coach', icon: LayoutDashboard },
        { label: t('nav.coach.myTeams'), href: '/coach/teams', icon: Users },
        { label: t('nav.coach.players'), href: '/coach/players', icon: UserCheck },
        { label: t('nav.coach.calendar'), href: '/coach/calendar', icon: Calendar },
        { label: t('nav.coach.sessions'), href: '/coach/sessions', icon: ClipboardList },
        { label: t('nav.coach.exercises'), href: '/coach/exercises', icon: Dumbbell },
        { label: t('nav.coach.attendance'), href: '/coach/attendance', icon: ClipboardCheck },
        { label: t('nav.coach.assessments'), href: '/coach/assessments', icon: Star },
        { label: t('nav.coach.matches'), href: '/coach/matches', icon: Trophy },
        { label: t('nav.coach.analytics'), href: '/coach/analytics', icon: BarChart3 },
        { label: t('nav.coach.aiAssistant'), href: '/coach/ai', icon: Brain },
      ]
    case 'admin':
      return [
        { label: t('nav.admin.dashboard'), href: '/admin/club', icon: Building2 },
        { label: t('nav.admin.users'), href: '/admin/users', icon: Shield },
        { label: t('nav.admin.teams'), href: '/coach/teams', icon: Users },
        { label: t('nav.admin.players'), href: '/coach/players', icon: UserCheck },
        { label: t('nav.admin.coaches'), href: '/admin/coaches', icon: UserCheck },
        { label: t('nav.admin.analytics'), href: '/admin/analytics', icon: BarChart3 },
      ]
    case 'player':
      return [
        { label: t('nav.player.schedule'), href: '/me/schedule', icon: Calendar },
        { label: t('nav.player.matches'), href: '/me/matches', icon: Trophy },
        { label: t('nav.player.progress'), href: '/me/progress', icon: TrendingUp },
        { label: t('nav.player.goals'), href: '/me/goals', icon: Target },
        { label: t('nav.player.reports'), href: '/me/reports', icon: FileText },
        { label: t('nav.player.linkProfile'), href: '/me/link-code', icon: KeyRound },
      ]
    case 'parent':
      return [
        { label: t('nav.parent.overview'), href: '/parent/overview', icon: Home },
        { label: t('nav.parent.enterCode'), href: '/parent/enter-code', icon: KeyRound },
        { label: t('nav.parent.schedule'), href: '/parent/schedule', icon: Calendar },
        { label: t('nav.parent.attendance'), href: '/parent/attendance', icon: ClipboardCheck },
        { label: t('nav.parent.progress'), href: '/parent/progress', icon: TrendingUp },
      ]
    case 'analyst':
      return [
        { label: t('nav.analyst.teams'), href: '/coach/teams', icon: Users },
        { label: t('nav.analyst.players'), href: '/coach/players', icon: UserCheck },
        { label: t('nav.analyst.assessments'), href: '/coach/assessments', icon: Star },
        { label: t('nav.analyst.analytics'), href: '/coach/analytics', icon: BarChart3 },
      ]
    default:
      return []
  }
}

interface SidebarProps {
  navItems: NavItem[]
  onNavigate?: () => void
}

function Sidebar({ navItems, onNavigate }: SidebarProps) {
  const { t } = useTranslation()
  return (
    <aside className={cn(
      'flex h-full flex-col border-r border-white/5 bg-slate-950 transition-all duration-300 ease-in-out',
      'w-72'
    )}>
      <div className="flex h-16 items-center border-b border-white/5 px-4">
        <Link to="/landing" className="flex items-center gap-2.5 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary shadow-lg shadow-primary/20 transition-transform duration-200 group-hover:scale-105">
            <BookOpen className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight text-white transition-colors duration-200 group-hover:text-primary">{t('common.brand')}</span>
        </Link>
      </div>

      <SidebarNav items={navItems} onNavigate={onNavigate} />
    </aside>
  )
}

export function AppShell() {
  const { user } = useAuthStore()
  const { t, i18n } = useTranslation()
  const [mobileOpen, setMobileOpen] = React.useState(false)
  const isMobile = useIsMobile()

  const navItems = React.useMemo(
    () => (user ? getNavItems(user.role, t) : []),
    [user, t, i18n.language]
  )

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {!isMobile && (
        <Sidebar navItems={navItems} />
      )}

      {isMobile && (
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetContent side="left" className="w-64 p-0 bg-slate-950 border-r border-white/5">
            <div className="flex h-16 items-center border-b border-white/5 px-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary shadow-lg shadow-primary/20">
                  <BookOpen className="h-4 w-4 text-white" />
                </div>
                <span className="text-lg font-bold tracking-tight text-white">{t('common.brand')}</span>
              </div>
            </div>
            <SidebarNav items={navItems} onNavigate={() => setMobileOpen(false)} />
          </SheetContent>
        </Sheet>
      )}

      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar onMenuClick={() => setMobileOpen(true)} />
        <main className="flex-1 overflow-y-auto">
          <div className="container mx-auto p-4 lg:p-6">
            <Outlet />
          </div>
        </main>
        {/* App Footer */}
        <footer className="border-t border-border/50 bg-background/80 backdrop-blur-sm py-3 px-6">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{t('landing.footer')}</span>
            <span className="hidden sm:inline">CoachOS v1.0</span>
          </div>
        </footer>
      </div>
    </div>
  )
}
