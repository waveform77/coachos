import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { parentsApi } from '@/shared/api/parents.api'
import { authApi } from '@/shared/api/auth.api'
import { useAuthStore } from '@/app/store/auth.store'
import { queryKeys } from '@/shared/api/query-keys'
import { PageHeader, Card, CardContent, Input, Button } from '@/shared/ui'
import { KeyRound, CheckCircle, UserCheck } from 'lucide-react'
import { toast } from 'sonner'

export function PlayerLinkCodePage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const setAuth = useAuthStore((s) => s.setAuth)
  const [code, setCode] = React.useState('')
  const [linkedPlayer, setLinkedPlayer] = React.useState<{ name: string; id: string } | null>(null)

  const useCodeMutation = useMutation({
    mutationFn: (code: string) => parentsApi.useLinkCode(code),
    onSuccess: async (data) => {
      setLinkedPlayer({ name: data.playerName, id: data.playerID })
      toast.success(t('player.codeLinked', { name: data.playerName }))
      setCode('')

      // Refresh tokens so the access token includes the new clubId
      try {
        const { accessToken } = await authApi.refresh()
        const user = await authApi.getMe()
        setAuth(user, accessToken)
        queryClient.invalidateQueries({ queryKey: queryKeys.auth.me() })
      } catch {
        // Non-fatal: user can navigate manually; still redirect below
      }

      // Redirect to player schedule after a short delay so the user sees the success message
      setTimeout(() => navigate('/me/schedule'), 1200)
    },
    onError: () => {
      toast.error(t('player.invalidCode'))
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (code.length !== 6) {
      toast.error(t('player.invalidCode'))
      return
    }
    useCodeMutation.mutate(code)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('player.linkProfile')}
        description={t('player.linkProfileDescription')}
      />

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center gap-6 py-8">
            <div className="rounded-full bg-primary/10 p-4">
              <KeyRound className="h-8 w-8 text-primary" />
            </div>

            <div className="text-center">
              <h3 className="text-lg font-semibold">{t('player.linkProfile')}</h3>
              <p className="text-sm text-muted-foreground">{t('player.linkProfileDesc')}</p>
            </div>

            <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
              <Input
                placeholder={t('player.enterCodePlaceholder')}
                value={code}
                onChange={(e) => {
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
                    <UserCheck className="mr-2 h-4 w-4" />
                    {t('player.linkProfile')}
                  </>
                )}
              </Button>
            </form>

            {linkedPlayer && (
              <div className="rounded-lg bg-emerald-50 p-4 text-center">
                <CheckCircle className="mx-auto mb-2 h-6 w-6 text-emerald-600" />
                <p className="font-medium text-emerald-700">{t('player.codeLinked')}</p>
                <p className="text-sm text-emerald-600">
                  {t('player.codeLinkedDesc', { name: linkedPlayer.name })}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
