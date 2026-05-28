import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { parentsApi } from '@/shared/api/parents.api'
import { queryKeys } from '@/shared/api/query-keys'
import {
  Card, CardContent, CardHeader, CardTitle,
  Button, Input, Badge, Dialog, DialogContent,
  DialogHeader, DialogTitle, DialogDescription,
  DialogFooter,
} from '@/shared/ui'
import { Mail, KeyRound, Copy, CheckCircle, XCircle } from 'lucide-react'
import { toast } from 'sonner'

type ParentLinkingSectionProps = {
  playerId: string
}

export function ParentLinkingSection({ playerId }: ParentLinkingSectionProps) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [email, setEmail] = React.useState('')
  const [showInviteDialog, setShowInviteDialog] = React.useState(false)
  const [showCodeDialog, setShowCodeDialog] = React.useState(false)
  const [generatedCode, setGeneratedCode] = React.useState('')

  // Загружаем приглашения (Вариант A)
  const { data: invitationsData } = useQuery({
    queryKey: queryKeys.coach.invitations(playerId),
    queryFn: () => parentsApi.listInvitations(playerId),
    enabled: !!playerId,
  })

  // Загружаем коды (Вариант C)
  const { data: codesData } = useQuery({
    queryKey: queryKeys.coach.linkCodes(playerId),
    queryFn: () => parentsApi.listLinkCodes(playerId),
    enabled: !!playerId,
  })

  // Мутация создания приглашения (Вариант A)
  const inviteMutation = useMutation({
    mutationFn: (email: string) => parentsApi.createInvitation({ playerID: playerId, email }),
    onSuccess: () => {
      toast.success(t('playerDetail.invitationSent'))
      setEmail('')
      setShowInviteDialog(false)
      queryClient.invalidateQueries({ queryKey: queryKeys.coach.invitations(playerId) })
    },
    onError: () => toast.error(t('common.error')),
  })

  // Мутация генерации кода (Вариант C)
  const codeMutation = useMutation({
    mutationFn: () => parentsApi.generateLinkCode(playerId),
    onSuccess: (data) => {
      setGeneratedCode(data.code)
      queryClient.invalidateQueries({ queryKey: queryKeys.coach.linkCodes(playerId) })
    },
    onError: () => toast.error(t('common.error')),
  })

  const handleCopyCode = () => {
    navigator.clipboard.writeText(generatedCode)
    toast.success(t('common.copied'))
  }

  const handleSendInvite = () => {
    if (!email || !email.includes('@')) {
      toast.error(t('validation.invalidEmail'))
      return
    }
    inviteMutation.mutate(email)
  }

  const pendingInvitations = invitationsData?.invitations?.filter((i) => i.status === 'pending') || []
  const activeCodes = codesData?.codes || []

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('playerDetail.linkParent')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Вариант A: Приглашение по email */}
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-blue-100 p-2">
                <Mail className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="font-medium">{t('playerDetail.sendInvitation')}</p>
                <p className="text-sm text-muted-foreground">
                  {t('playerDetail.sendInvitationDesc')}
                </p>
              </div>
            </div>
            <Button onClick={() => setShowInviteDialog(true)}>
              {t('playerDetail.inviteByEmail')}
            </Button>
          </div>

          {/* Вариант C: Код доступа */}
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-emerald-100 p-2">
                <KeyRound className="h-4 w-4 text-emerald-600" />
              </div>
              <div>
                <p className="font-medium">{t('playerDetail.generateCode')}</p>
                <p className="text-sm text-muted-foreground">
                  {t('playerDetail.generateCodeDesc')}
                </p>
              </div>
            </div>
            <Button variant="outline" onClick={() => { setGeneratedCode(''); setShowCodeDialog(true); codeMutation.mutate() }}>
              {t('playerDetail.generateCode')}
            </Button>
          </div>

          {/* Список активных кодов */}
          {activeCodes.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">{t('playerDetail.activeCodes')}</p>
              {activeCodes.map((code) => (
                <div key={code.id} className="flex items-center justify-between rounded-md bg-muted p-2">
                  <code className="text-lg font-bold tracking-widest">{code.code}</code>
                  <Badge variant="outline">
                    {t('playerDetail.expires')}: {new Date(code.expiresAt).toLocaleDateString()}
                  </Badge>
                </div>
              ))}
            </div>
          )}

          {/* Список ожидающих приглашений */}
          {pendingInvitations.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">{t('playerDetail.pendingInvitations')}</p>
              {pendingInvitations.map((inv) => (
                <div key={inv.id} className="flex items-center justify-between rounded-md bg-muted p-2">
                  <span>{inv.email}</span>
                  <Badge variant="outline">
                    {t('playerDetail.expires')}: {new Date(inv.expiresAt).toLocaleDateString()}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Диалог приглашения */}
      <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('playerDetail.inviteParent')}</DialogTitle>
            <DialogDescription>
              {t('playerDetail.inviteParentDesc')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Input
              type="email"
              placeholder={t('auth.email')}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <p className="text-sm text-muted-foreground">
              {t('playerDetail.invitationExpiresIn')} 7 {t('common.days')}
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowInviteDialog(false)}>
              {t('common.cancel')}
            </Button>
            <Button
              onClick={handleSendInvite}
              disabled={inviteMutation.isPending}
            >
              {inviteMutation.isPending ? t('common.sending') : t('playerDetail.sendInvitation')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Диалог кода */}
      <Dialog open={showCodeDialog} onOpenChange={setShowCodeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('playerDetail.linkCodeGenerated')}</DialogTitle>
            <DialogDescription>
              {t('playerDetail.linkCodeDesc')}
            </DialogDescription>
          </DialogHeader>
          <div className="py-6">
            {generatedCode ? (
              <div className="flex flex-col items-center gap-4">
                <div className="rounded-lg bg-emerald-50 p-6">
                  <code className="text-4xl font-bold tracking-[0.5em] text-emerald-700">
                    {generatedCode}
                  </code>
                </div>
                <Button variant="outline" onClick={handleCopyCode} className="gap-2">
                  <Copy className="h-4 w-4" />
                  {t('common.copy')}
                </Button>
              </div>
            ) : (
              <div className="flex justify-center py-4">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button onClick={() => setShowCodeDialog(false)}>
              {t('common.close')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
