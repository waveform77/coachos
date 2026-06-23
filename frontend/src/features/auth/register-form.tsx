import * as React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import { Loader2, Mail, Lock, User, Building2 } from 'lucide-react'
import { authApi } from '@/shared/api/auth.api'
import { useAuthStore } from '@/app/store/auth.store'
import { ROLE_DEFAULT_ROUTES } from '@/shared/config/roles'
import {
  Button, Form, FormControl, FormField, FormItem, FormLabel, FormMessage, Input,
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Checkbox,
} from '@/shared/ui'

export function RegisterForm() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const setAuth = useAuthStore((s) => s.setAuth)
  const [loading, setLoading] = React.useState(false)

  const registerSchema = React.useMemo(
    () =>
      z
        .object({
          firstName: z.string().min(1, t('validation.firstNameRequired')),
          lastName: z.string().min(1, t('validation.lastNameRequired')),
          email: z.string().email(t('validation.invalidEmail')),
          password: z.string().min(8, t('validation.passwordMin8')),
          confirmPassword: z.string(),
          role: z.enum(['coach', 'player', 'parent']),
          createClub: z.boolean(),
          clubName: z.string().optional(),
          clubCity: z.string().optional(),
          clubCountry: z.string().optional(),
        })
        .refine((d) => d.password === d.confirmPassword, {
          message: t('validation.passwordsNoMatch'),
          path: ['confirmPassword'],
        })
        .refine((d) => !d.createClub || (d.clubName && d.clubName.trim().length > 0), {
          message: 'Название клуба обязательно',
          path: ['clubName'],
        }),
    [t]
  )

  type RegisterValues = z.infer<typeof registerSchema>

  const form = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: '',
      role: 'coach',
      createClub: false,
      clubName: '',
      clubCity: '',
      clubCountry: '',
    },
  })

  const createClub = form.watch('createClub')

  const onSubmit = async (values: RegisterValues) => {
    setLoading(true)
    try {
      const { confirmPassword, clubName, clubCity, clubCountry, createClub, ...rest } = values
      void confirmPassword
      const payload: Parameters<typeof authApi.register>[0] = {
        ...rest,
        role: createClub ? 'admin' : values.role,
      }
      if (createClub) {
        payload.createClub = {
          name: clubName?.trim() ?? '',
          city: clubCity?.trim(),
          country: clubCountry?.trim(),
        }
      }
      const data = await authApi.register(payload)
      setAuth(data.user, data.accessToken)
      toast.success(t('auth.welcomeToast', { name: data.user.firstName }))
      navigate(ROLE_DEFAULT_ROUTES[data.user.role])
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message
      toast.error(message ?? t('auth.registerFailed'))
    } finally {
      setLoading(false)
    }
  }

  const inputClass = "border-white/10 bg-white/5 text-white placeholder:text-slate-500 focus:border-primary/50 focus:ring-primary/20"

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <FormField control={form.control} name="firstName" render={({ field }) => (
            <FormItem>
              <FormLabel className="text-slate-300">{t('auth.firstName')}</FormLabel>
              <FormControl>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                  <Input placeholder="John" className={"pl-10 " + inputClass} {...field} />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="lastName" render={({ field }) => (
            <FormItem>
              <FormLabel className="text-slate-300">{t('auth.lastName')}</FormLabel>
              <FormControl>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                  <Input placeholder="Doe" className={"pl-10 " + inputClass} {...field} />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />
        </div>
        <FormField control={form.control} name="email" render={({ field }) => (
          <FormItem>
            <FormLabel className="text-slate-300">{t('auth.email')}</FormLabel>
            <FormControl>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <Input type="email" placeholder="john@academy.com" className={"pl-10 " + inputClass} {...field} />
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        )} />
        {!createClub && (
          <FormField control={form.control} name="role" render={({ field }) => (
            <FormItem>
              <FormLabel className="text-slate-300">{t('auth.rolePrompt')}</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger className="border-white/10 bg-white/5 text-white">
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="coach">{t('auth.roleCoach')}</SelectItem>
                  <SelectItem value="player">{t('auth.rolePlayer')}</SelectItem>
                  <SelectItem value="parent">{t('auth.roleParent')}</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )} />
        )}

        <FormField control={form.control} name="createClub" render={({ field }) => (
          <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border border-white/10 p-4">
            <FormControl>
              <Checkbox checked={field.value} onCheckedChange={field.onChange} />
            </FormControl>
            <div className="space-y-1 leading-none">
              <FormLabel className="text-slate-200">Создать новый клуб</FormLabel>
              <p className="text-sm text-slate-400">Станете администратором новой академии</p>
            </div>
          </FormItem>
        )} />

        {createClub && (
          <div className="space-y-4 rounded-lg border border-white/10 bg-white/5 p-4">
            <div className="flex items-center gap-2 text-slate-200">
              <Building2 className="h-4 w-4" />
              <span className="font-medium">Данные клуба</span>
            </div>
            <FormField control={form.control} name="clubName" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-slate-300">Название клуба *</FormLabel>
                <FormControl><Input placeholder="FC Dynamo Academy" className={inputClass} {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="clubCity" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-300">Город</FormLabel>
                  <FormControl><Input placeholder="Москва" className={inputClass} {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="clubCountry" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-300">Страна</FormLabel>
                  <FormControl><Input placeholder="Россия" className={inputClass} {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
          </div>
        )}
        <FormField control={form.control} name="password" render={({ field }) => (
          <FormItem>
            <FormLabel className="text-slate-300">{t('auth.password')}</FormLabel>
            <FormControl>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <Input type="password" placeholder="••••••••" className={"pl-10 " + inputClass} {...field} />
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="confirmPassword" render={({ field }) => (
          <FormItem>
            <FormLabel className="text-slate-300">{t('auth.confirmPassword')}</FormLabel>
            <FormControl>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <Input type="password" placeholder="••••••••" className={"pl-10 " + inputClass} {...field} />
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <Button
          type="submit"
          className="w-full shadow-lg shadow-primary/20 transition-all duration-200 hover:shadow-primary/30 hover:scale-[1.01] active:scale-[0.99]"
          disabled={loading}
        >
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {t('auth.createAccountBtn')}
        </Button>
      </form>
    </Form>
  )
}
