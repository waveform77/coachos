import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { parentsApi } from '@/shared/api/parents.api'
import { queryKeys } from '@/shared/api/query-keys'
import {
  PageHeader, Card, CardContent, Input, Button,
  Badge, Skeleton,
} from '@/shared/ui'
import { KeyRound, CheckCircle, UserPlus } from 'lucide-react'
import { toast } from 'sonner'
import type { ParentChild } from '@/shared/api/parents.api'

export function ParentEnterCodePage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [code, setCode] = React.useState('')
  const [linkedChild, setLinkedChild] = React.useState<{ name: string; id: string } | null>(null)

  // Получаем уже связанных детей
  const { data: children, isLoading } = useQuery({
    queryKey: queryKeys.parent.children(),
    queryFn: parentsApi.listChildren,
  })

  // Мутация использования кода
  const useCodeMutation = useMutation({
    mutationFn: (code: string) => parentsApi.useLinkCode(code),
    onSuccess: (data) => {
      setLinkedChild({ name: data.playerName, id: data.playerID })
      toast.success(t('parent.codeLinked', { name: data.playerName }))
      queryClient.invalidateQueries({ queryKey: queryKeys.parent.children() })
      setCode('')
      // Если это первый ребёнок — редирект на overview
      if (!children || children.length === 0) {
        navigate('/parent/overview')
      }
    },
    onError: () => {
      toast.error(t('parent.invalidCode'))
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (code.length !== 6) {
      toast.error(t('parent.invalidCode'))
      return
    }
    useCodeMutation.mutate(code)
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title={t('parent.enterCode')} description={t('parent.enterCodeDescription')} />
        <Skeleton className="h-48 w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('parent.enterCode')}
        description={t('parent.enterCodeDescription')}
      />

      {/* Уже связанные дети */}
      {children && children.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <h3 className="mb-4 text-lg font-semibold">{t('parent.linkedPlayers')}</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              {children.map((child: ParentChild) => (
                <div
                  key={child.id}
                  className="flex items-center gap-3 rounded-lg border p-4"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100">
                    <CheckCircle className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="font-medium">{child.firstName} {child.lastName}</p>
                    <p className="text-sm text-muted-foreground">
                      {t('parent.devIndex')}: {child.devIndex}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Форма ввода кода */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center gap-6 py-8">
            <div className="rounded-full bg-primary/10 p-4">
              <KeyRound className="h-8 w-8 text-primary" />
            </div>

            <div className="text-center">
              <h3 className="text-lg font-semibold">{t('parent.linkChild')}</h3>
              <p className="text-sm text-muted-foreground">{t('parent.linkChildDesc')}</p>
            </div>

            <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
              <Input
                placeholder={t('parent.enterCodePlaceholder')}
                value={code}
                onChange={(e) => {
                  // Только цифры, максимум 6
                  const val = e.target.value.replace(/\D/g, '').slice(0, 6)
                  setCode(val)
                }}
                className="text-center text-2xl tracking-[0.5em]"
                maxLength={6}
              />
              <Button
                type="submit"
                className="w-full"
                disabled={code.length !== 6 || useCodeMutation.isPending}
              >
                {useCodeMutation.isPending ? (
                  t('common.loading')
                ) : (
                  <>
                    <UserPlus className="mr-2 h-4 w-4" />
                    {t('parent.linkChild')}
                  </>
                )}
              </Button>
            </form>

            {linkedChild && (
              <div className="rounded-lg bg-emerald-50 p-4 text-center">
                <CheckCircle className="mx-auto mb-2 h-6 w-6 text-emerald-600" />
                <p className="font-medium text-emerald-700">
                  {t('parent.codeLinked')}
                </p>
                <p className="text-sm text-emerald-600">
                  {t('parent.codeLinkedDesc', { name: linkedChild.name })}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
