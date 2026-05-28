import * as React from 'react'
import { Bell, LogOut, User, Settings, Menu, Home } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { useAuthStore } from '@/app/store/auth.store'
import { authApi } from '@/shared/api/auth.api'
import { ROUTES } from '@/shared/config/routes'
import { getInitials } from '@/shared/lib/utils'
import { useQuery } from '@tanstack/react-query'
import { notificationsApi } from '@/shared/api/notifications.api'
import { queryKeys } from '@/shared/api/query-keys'
import { formatDistanceToNow, parseISO } from 'date-fns'
import { ru, enUS } from 'date-fns/locale'
import { LanguageSwitcher } from '@/shared/i18n/language-switcher'
import { ThemeSwitcher } from '@/shared/ui/theme-switcher'
import { useTranslation } from 'react-i18next'
import {
  Avatar, AvatarFallback, AvatarImage, Button,
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
  Popover, PopoverContent, PopoverTrigger,
  ScrollArea,
} from '@/shared/ui'

interface TopbarProps {
  onMenuClick: () => void
}

export function Topbar({ onMenuClick }: TopbarProps) {
  const navigate = useNavigate()
  const { t, i18n } = useTranslation()
  const { user, logout } = useAuthStore()

  const { data: notifData } = useQuery({
    queryKey: queryKeys.notifications.all({ unreadOnly: true }),
    queryFn: () => notificationsApi.getNotifications({ unreadOnly: true, limit: 10 }),
    refetchInterval: 30_000,
  })

  const unreadCount = notifData?.unreadCount ?? 0

  const handleLogout = async () => {
    try {
      await authApi.logout()
    } catch { /* ignore */ }
    logout()
    navigate(ROUTES.LOGIN)
    toast.success(t('common.loggedOut'))
  }

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center border-b border-border/50 bg-background/80 px-4 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60 lg:px-6">
      <Button
        variant="ghost"
        size="icon"
        onClick={onMenuClick}
        className="mr-2 lg:hidden hover:bg-accent h-11 w-11"
      >
        <Menu className="h-6 w-6" />
      </Button>

      <div className="flex-1" />

      <div className="flex items-center gap-1 sm:gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/landing')}
          className="hidden sm:inline-flex gap-1.5 text-muted-foreground hover:text-foreground transition-colors duration-200 h-10 px-3 text-base"
        >
          <Home className="h-5 w-5" />
          {t('landing.home')}
        </Button>
        <LanguageSwitcher />
        <ThemeSwitcher />

        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="relative hover:bg-accent transition-colors duration-200 h-11 w-11"
            >
              <Bell className="h-6 w-6" />
              {unreadCount > 0 && (
                <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 animate-in zoom-in items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-white shadow-sm shadow-destructive/20">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-0" align="end">
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <h3 className="font-semibold">{t('common.notifications')}</h3>
              <Button variant="ghost" size="sm" onClick={() => navigate(ROUTES.NOTIFICATIONS)} className="text-xs">
                {t('common.viewAll')}
              </Button>
            </div>
            <ScrollArea className="h-72">
              {notifData?.data?.length ? (
                <div className="divide-y">
                  {notifData.data.slice(0, 5).map((n) => (
                    <div key={n.id} className={`px-4 py-3 transition-colors hover:bg-accent/50 ${!n.readAt ? 'bg-primary/[0.03]' : ''}`}>
                      <p className="text-sm font-medium">{n.title}</p>
                      {n.body && <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">{n.body}</p>}
                      <p className="mt-1 text-xs text-muted-foreground">
                        {formatDistanceToNow(parseISO(n.createdAt), {
                          addSuffix: true,
                          locale: i18n.language.startsWith('ru') ? ru : enUS,
                        })}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex h-full items-center justify-center py-8">
                  <p className="text-sm text-muted-foreground">{t('common.noNotifications')}</p>
                </div>
              )}
            </ScrollArea>
          </PopoverContent>
        </Popover>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="relative h-10 w-10 rounded-full hover:bg-accent transition-colors duration-200"
            >
              <Avatar className="h-11 w-11 ring-2 ring-border/50 transition-shadow duration-200 hover:ring-primary/30">
                {user?.avatarURL && <AvatarImage src={user.avatarURL} alt={user.firstName} />}
                <AvatarFallback className="bg-primary/10 text-primary text-base font-semibold">
                  {user ? getInitials(user.firstName, user.lastName) : '??'}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-semibold">{user?.firstName} {user?.lastName}</p>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate(ROUTES.PROFILE)} className="cursor-pointer">
              <User className="mr-2 h-4 w-4" />{t('common.profile')}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate(ROUTES.SETTINGS)} className="cursor-pointer">
              <Settings className="mr-2 h-4 w-4" />{t('common.settings')}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive focus:text-destructive">
              <LogOut className="mr-2 h-4 w-4" />{t('common.logOut')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
