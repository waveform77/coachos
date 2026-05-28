import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { useAuthStore } from '@/app/store/auth.store'
import { authApi } from '@/shared/api/auth.api'
import { apiClient } from '@/shared/api/client'
import {
  PageHeader, Card, CardContent, CardHeader, CardTitle, Button,
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage, Input,
  Avatar, AvatarFallback, Badge,
} from '@/shared/ui'
import { getInitials } from '@/shared/lib/utils'
import { ROLE_DISPLAY_NAMES, ROLE_COLORS } from '@/shared/config/roles'

export function ProfilePage() {
  const { t } = useTranslation()

  const { user, setAuth } = useAuthStore()
  const [loading, setLoading] = React.useState(false)

  const profileSchema = z.object({
    firstName: z.string().min(1, t('validation.firstNameRequired')),
    lastName: z.string().min(1, t('validation.lastNameRequired')),
    phone: z.string().optional(),
  })
  type ProfileValues = z.infer<typeof profileSchema>

  const form = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: user?.firstName ?? '',
      lastName: user?.lastName ?? '',
      phone: user?.phone ?? '',
    },
  })

  const onSubmit = async (values: ProfileValues) => {
    setLoading(true)
    try {
      const updated = await apiClient.patch('/users/me', values).then((r) => r.data)
      const token = useAuthStore.getState().accessToken ?? ''
      setAuth(updated, token)
      toast.success(t('profile.profileUpdated'))
    } catch {
      toast.error(t('common.error'))
    } finally {
      setLoading(false)
    }
  }

  if (!user) return null

  return (
    <div className="space-y-6 max-w-2xl">
      <PageHeader title={t('profile.title')} description={t('profile.personalInfo')} />

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              {user.avatarURL && <img src={user.avatarURL} alt="avatar" />}
              <AvatarFallback className="text-xl font-bold bg-primary/10 text-primary">
                {getInitials(user.firstName, user.lastName)}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-xl font-bold">{user.firstName} {user.lastName}</p>
              <div className="flex items-center gap-2 mt-1">
                <Badge className={ROLE_COLORS[user.role]}>{t(`commonEnums.roles.${user.role}`)}</Badge>
                <Badge variant={user.isActive ? 'success' : 'secondary'}>{user.isActive ? t('common.yes') : t('common.no')}</Badge>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="firstName" render={({ field }) => (
                  <FormItem><FormLabel>{t('profile.firstName')}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="lastName" render={({ field }) => (
                  <FormItem><FormLabel>{t('profile.lastName')}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
              <div className="space-y-2">
                <FormLabel>{t('profile.email')}</FormLabel>
                <Input value={user.email} disabled className="bg-muted" />
              </div>
              <FormField control={form.control} name="phone" render={({ field }) => (
                <FormItem><FormLabel>{t('profile.phone')}</FormLabel><FormControl><Input type="tel" placeholder="+1 234 567 8900" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t('profile.saveChanges')}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">{t('profile.changePassword')}</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Input type="password" placeholder={t('profile.currentPassword')} disabled className="bg-muted" />
            <Input type="password" placeholder={t('profile.newPassword')} disabled className="bg-muted" />
            <Input type="password" placeholder={t('profile.confirmPassword')} disabled className="bg-muted" />
            <Button variant="outline" disabled>{t('profile.changePassword')}</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
