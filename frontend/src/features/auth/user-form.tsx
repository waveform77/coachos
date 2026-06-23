import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Button, Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from '@/shared/ui'
import type { Role } from '@/shared/types'

export interface UserFormValues {
  firstName: string
  lastName: string
  email: string
  phone: string
  role: string
  password: string
}

interface UserFormProps {
  defaultValues?: Partial<UserFormValues>
  onSubmit: (values: UserFormValues) => void
  loading: boolean
  submitLabel: string
  hidePassword?: boolean
  allowedRoles?: Role[]
  passwordOptional?: boolean
}

export function UserForm({
  defaultValues,
  onSubmit,
  loading,
  submitLabel,
  hidePassword = false,
  allowedRoles = ['coach', 'player', 'parent', 'analyst'],
  passwordOptional = false,
}: UserFormProps) {
  const { t } = useTranslation()
  const schema = React.useMemo(
    () =>
      z.object({
        firstName: z.string().min(1, t('validation.firstNameRequired')),
        lastName: z.string().min(1, t('validation.lastNameRequired')),
        email: z.string().email(t('validation.invalidEmail')),
        phone: z.string().optional(),
        role: z.enum(['admin', 'coach', 'player', 'parent', 'analyst']),
        password: hidePassword
          ? z.string().optional()
          : passwordOptional
            ? z.union([z.string().min(8, t('validation.passwordMin8')), z.string().length(0)]).optional()
            : z.string().min(8, t('validation.passwordMin8')),
      }),
    [t, hidePassword, passwordOptional]
  )

  const form = useForm<UserFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      role: 'coach',
      password: '',
      ...defaultValues,
    },
  })

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField control={form.control} name="firstName" render={({ field }) => (
            <FormItem>
              <FormLabel>{t('profile.firstName')}</FormLabel>
              <FormControl><Input {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="lastName" render={({ field }) => (
            <FormItem>
              <FormLabel>{t('profile.lastName')}</FormLabel>
              <FormControl><Input {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
        </div>
        <FormField control={form.control} name="email" render={({ field }) => (
          <FormItem>
            <FormLabel>Email</FormLabel>
            <FormControl><Input type="email" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="phone" render={({ field }) => (
          <FormItem>
            <FormLabel>{t('profile.phone')}</FormLabel>
            <FormControl><Input {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="role" render={({ field }) => (
          <FormItem>
            <FormLabel>{t('profile.role')}</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl>
                <SelectTrigger><SelectValue /></SelectTrigger>
              </FormControl>
              <SelectContent>
                {allowedRoles.map((r) => (
                  <SelectItem key={r} value={r}>{t(`commonEnums.roles.${r}`)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )} />
        {!hidePassword && (
          <FormField control={form.control} name="password" render={({ field }) => (
            <FormItem>
              <FormLabel>{passwordOptional ? 'Новый пароль' : t('auth.password')}</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  placeholder={passwordOptional ? 'Оставить текущий' : '••••••••'}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />
        )}
        <Button type="submit" disabled={loading} className="w-full">
          {loading ? t('common.saving') : submitLabel}
        </Button>
      </form>
    </Form>
  )
}
