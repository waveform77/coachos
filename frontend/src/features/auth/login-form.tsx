import * as React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import { Loader2, Mail, Lock } from 'lucide-react'
import { authApi } from '@/shared/api/auth.api'
import { useAuthStore } from '@/app/store/auth.store'
import { ROLE_DEFAULT_ROUTES } from '@/shared/config/roles'
import {
  Button, Form, FormControl, FormField, FormItem, FormLabel, FormMessage, Input,
} from '@/shared/ui'

export function LoginForm() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const setAuth = useAuthStore((s) => s.setAuth)
  const [loading, setLoading] = React.useState(false)

  const loginSchema = React.useMemo(
    () =>
      z.object({
        email: z.string().email(t('validation.invalidEmail')),
        password: z.string().min(6, t('validation.passwordMin6')),
      }),
    [t]
  )

  type LoginValues = z.infer<typeof loginSchema>

  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  const onSubmit = async (values: LoginValues) => {
    setLoading(true)
    try {
      const data = await authApi.login(values)
      setAuth(data.user, data.accessToken)
      toast.success(t('auth.welcomeBackToast', { name: data.user.firstName }))
      navigate(ROLE_DEFAULT_ROUTES[data.user.role])
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message
      toast.error(message ?? t('auth.invalidCredentials'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-slate-300">{t('auth.email')}</FormLabel>
              <FormControl>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                  <Input
                    type="email"
                    placeholder="coach@academy.com"
                    autoComplete="email"
                    className="pl-10 border-white/10 bg-white/5 text-white placeholder:text-slate-500 focus:border-primary/50 focus:ring-primary/20"
                    {...field}
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-slate-300">{t('auth.password')}</FormLabel>
              <FormControl>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                  <Input
                    type="password"
                    placeholder="••••••••"
                    autoComplete="current-password"
                    className="pl-10 border-white/10 bg-white/5 text-white placeholder:text-slate-500 focus:border-primary/50 focus:ring-primary/20"
                    {...field}
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button
          type="submit"
          className="w-full shadow-lg shadow-primary/20 transition-all duration-200 hover:shadow-primary/30 hover:scale-[1.01] active:scale-[0.99]"
          disabled={loading}
        >
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {t('auth.signIn')}
        </Button>
      </form>
    </Form>
  )
}
