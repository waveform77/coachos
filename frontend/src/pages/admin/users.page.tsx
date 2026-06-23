import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Search, Plus, Users, Pencil, Mail, Phone } from 'lucide-react'
import { toast } from 'sonner'
import { authApi, type CreateUserRequest, type UpdateUserRequest } from '@/shared/api/auth.api'
import { UserForm } from '@/features/auth/user-form'
import { queryKeys } from '@/shared/api/query-keys'
import { useAuthStore } from '@/app/store/auth.store'
import {
  PageHeader, Button, Input, Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
  Switch, Badge, Skeleton, DataTable, type Column,
} from '@/shared/ui'
import { EmptyState } from '@/shared/ui/empty-state'
import { useDebounce } from '@/shared/lib/hooks'
import type { User, Role } from '@/shared/types'

const ROLES: Role[] = ['admin', 'coach', 'player', 'parent', 'analyst']

export function UsersPage() {
  const { t } = useTranslation()
  const { user } = useAuthStore()
  const qc = useQueryClient()
  const clubId = user?.clubId ?? ''
  const [roleFilter, setRoleFilter] = React.useState<string>('all')
  const [search, setSearch] = React.useState('')
  const debouncedSearch = useDebounce(search)
  const [createOpen, setCreateOpen] = React.useState(false)
  const [editingUser, setEditingUser] = React.useState<User | null>(null)

  const { data: users, isLoading } = useQuery({
    queryKey: queryKeys.users.list({ role: roleFilter !== 'all' ? roleFilter : 'coach', clubId }),
    queryFn: () => authApi.listUsers({ role: roleFilter !== 'all' ? roleFilter : 'coach', limit: 100 }),
    enabled: !!clubId,
  })

  const filtered = React.useMemo(() => {
    if (!users) return []
    return users.filter((u) => {
      const fullName = `${u.firstName} ${u.lastName}`.toLowerCase()
      const matchesSearch = fullName.includes(debouncedSearch.toLowerCase()) || u.email.toLowerCase().includes(debouncedSearch.toLowerCase())
      const matchesRole = roleFilter === 'all' || u.role === roleFilter
      return matchesSearch && matchesRole
    })
  }, [users, debouncedSearch, roleFilter])

  const { mutate: createUser, isPending: creating } = useMutation({
    mutationFn: (data: CreateUserRequest) => authApi.createUser(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.users.list({ role: roleFilter !== 'all' ? roleFilter : 'coach', clubId }) })
      toast.success(t('common.success'))
      setCreateOpen(false)
    },
    onError: (err: unknown) => {
      const message = (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message
      toast.error(message ?? t('common.error'))
    },
  })

  const { mutate: updateUser, isPending: updating } = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateUserRequest }) => authApi.updateUser(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.users.list({ role: roleFilter !== 'all' ? roleFilter : 'coach', clubId }) })
      toast.success(t('common.success'))
      setEditingUser(null)
    },
    onError: (err: unknown) => {
      const message = (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message
      toast.error(message ?? t('common.error'))
    },
  })

  const columns: Column<User>[] = [
    {
      key: 'name',
      header: t('profile.firstName') + ' / ' + t('profile.lastName'),
      cell: (u) => (
        <div className="flex items-center gap-2">
          <span className="font-medium">{u.firstName} {u.lastName}</span>
        </div>
      ),
    },
    {
      key: 'email',
      header: 'Email',
      cell: (u) => <div className="flex items-center gap-1.5 text-muted-foreground"><Mail className="h-3.5 w-3.5" />{u.email}</div>,
    },
    {
      key: 'role',
      header: t('profile.role'),
      cell: (u) => <Badge variant="secondary">{t(`commonEnums.roles.${u.role}`)}</Badge>,
    },
    {
      key: 'phone',
      header: t('profile.phone'),
      cell: (u) => u.phone ? <div className="flex items-center gap-1.5 text-muted-foreground"><Phone className="h-3.5 w-3.5" />{u.phone}</div> : '—',
    },
    {
      key: 'status',
      header: t('common.status'),
      cell: (u) => (
        <div className="flex items-center gap-2">
          <Switch
            checked={u.isActive}
            onCheckedChange={(checked) => updateUser({ id: u.id, data: { isActive: checked } })}
            disabled={updating}
          />
          <span className={u.isActive ? 'text-emerald-600' : 'text-muted-foreground'}>
            {u.isActive ? t('common.active') : t('common.inactive')}
          </span>
        </div>
      ),
    },
    {
      key: 'actions',
      header: '',
      cell: (u) => (
        <Button variant="ghost" size="sm" onClick={() => setEditingUser(u)}>
          <Pencil className="h-4 w-4" />
        </Button>
      ),
    },
  ]

  if (!clubId) {
    return (
      <div className="space-y-6">
        <PageHeader title={t('admin.title')} description={t('admin.clubManagement')} />
        <EmptyState icon={Users} title={t('common.noData')} description={t('admin.noClubLinked')} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('admin.title')}
        description="Управление пользователями клуба"
        actions={
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2"><Plus className="h-5 w-5" />{t('common.add')}</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle>{t('admin.addCoach')}</DialogTitle></DialogHeader>
              <UserForm
                onSubmit={(v) => createUser({ ...v, role: v.role as Role })}
                loading={creating}
                submitLabel={t('common.create')}
              />
            </DialogContent>
          </Dialog>
        }
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t('common.search')} className="pl-9" />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-full sm:w-48"><SelectValue placeholder={t('common.filter')} /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('common.all')}</SelectItem>
            {ROLES.map((r) => <SelectItem key={r} value={r}>{t(`commonEnums.roles.${r}`)}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <Skeleton className="h-64 w-full rounded-lg" />
      ) : filtered.length ? (
        <DataTable columns={columns} data={filtered} />
      ) : (
        <EmptyState icon={Users} title={t('common.noData')} description={t('admin.coachList')} />
      )}

      <Dialog open={!!editingUser} onOpenChange={(open) => !open && setEditingUser(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{t('common.edit')}</DialogTitle></DialogHeader>
          {editingUser && (
            <UserForm
              defaultValues={{
                firstName: editingUser.firstName,
                lastName: editingUser.lastName,
                email: editingUser.email,
                phone: editingUser.phone ?? '',
                role: editingUser.role,
                password: '',
              }}
              onSubmit={(v) => {
                const data: UpdateUserRequest = {
                  firstName: v.firstName,
                  lastName: v.lastName,
                  phone: v.phone || undefined,
                  role: v.role,
                  password: v.password || undefined,
                }
                updateUser({ id: editingUser.id, data })
              }}
              loading={updating}
              submitLabel={t('common.save')}
              passwordOptional
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

