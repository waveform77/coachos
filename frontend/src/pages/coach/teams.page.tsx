import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Search } from 'lucide-react'
import { toast } from 'sonner'
import { teamsApi } from '@/shared/api/teams.api'
import { queryKeys } from '@/shared/api/query-keys'
import { useAuthStore } from '@/app/store/auth.store'
import { TeamCard } from '@/entities/team/team-card'
import {
  PageHeader, Button, Input, Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Skeleton,
} from '@/shared/ui'
import { EmptyState } from '@/shared/ui/empty-state'
import { Users } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useDebounce } from '@/shared/lib/hooks'

const teamSchema = z.object({
  name: z.string().min(1, 'required'),
  ageGroup: z.string().optional(),
  season: z.string().optional(),
})
type TeamValues = z.infer<typeof teamSchema>

const AGE_GROUPS = ['U7','U8','U9','U10','U11','U12','U13','U14','U15','U16','U17','U18','U19','U21','Senior']

export function TeamsPage() {
  const { t } = useTranslation()
  const { user } = useAuthStore()
  const qc = useQueryClient()
  const [search, setSearch] = React.useState('')
  const [open, setOpen] = React.useState(false)
  const debouncedSearch = useDebounce(search)

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.teams.all({ clubId: user?.clubId }),
    queryFn: () => teamsApi.listTeams({ clubId: user?.clubId }),
  })

  const { mutate: createTeam, isPending } = useMutation({
    mutationFn: teamsApi.createTeam,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.teams.all() })
      toast.success(t('common.success'))
      setOpen(false)
    },
    onError: () => toast.error(t('common.error')),
  })

  const form = useForm<TeamValues>({
    resolver: zodResolver(teamSchema),
    defaultValues: { name: '', ageGroup: '', season: '' },
  })

  const filtered = data?.data?.filter((t) =>
    t.name.toLowerCase().includes(debouncedSearch.toLowerCase())
  ) ?? []

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('teams.title')}
        description={`${data?.data?.length ?? 0} ${t('teams.teamList')}`}
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2"><Plus className="h-4 w-4" />{t('teams.addTeam')}</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t('teams.addTeam')}</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit((v) => createTeam({ name: v.name, ageGroup: v.ageGroup as import('@/shared/types').AgeGroup | undefined, season: v.season, clubId: user?.clubId ?? '' }))} className="space-y-4">
                  <FormField control={form.control} name="name" render={({ field }) => (
                    <FormItem><FormLabel>{t('teams.teamName')}</FormLabel><FormControl><Input placeholder="U17 Lions..." {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="ageGroup" render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('teams.ageGroup')}</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder={t('common.select')} /></SelectTrigger></FormControl>
                        <SelectContent>{AGE_GROUPS.map((ag) => <SelectItem key={ag} value={ag}>{ag}</SelectItem>)}</SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="season" render={({ field }) => (
                    <FormItem><FormLabel>{t('teams.season')}</FormLabel><FormControl><Input placeholder="2024/25" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <Button type="submit" className="w-full" disabled={isPending}>{isPending ? t('common.loading') : t('common.create')}</Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t('common.search')} className="pl-9" />
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1,2,3,4,5,6].map((i) => <Skeleton key={i} className="h-40 rounded-lg" />)}
        </div>
      ) : filtered.length ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((team) => (
            <TeamCard key={team.id} team={team} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Users}
          title={t('common.noData')}
          description={search ? t('common.noData') : t('teams.createFirstTeam')}
          action={!search ? { label: t('teams.addTeam'), onClick: () => setOpen(true) } : undefined}
        />
      )}
    </div>
  )
}
