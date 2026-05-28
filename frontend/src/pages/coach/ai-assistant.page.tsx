import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useMutation, useQuery } from '@tanstack/react-query'
import {
  Brain, Dumbbell, BarChart3, FileText, Loader2, Sparkles,
  ChevronDown, ChevronUp, AlertCircle, CheckCircle2, Clock,
  Target, Zap,
} from 'lucide-react'
import { aiApi } from '@/shared/api/ai.api'
import { playersApi } from '@/shared/api/players.api'
import { teamsApi } from '@/shared/api/teams.api'
import {
  PageHeader, Button, Card, CardContent, CardHeader, CardTitle,
  Badge, Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
  Input, Label, Separator, Textarea,
} from '@/shared/ui'
import { cn } from '@/shared/lib/utils'
import type { AIResponse, BlockSuggestion, AIRecommendationItem } from '@/shared/api/ai.api'

const WEAK_SKILLS = ['technical', 'physical', 'tactical', 'discipline', 'teamwork'] as const

interface ResultCard {
  id: string
  action: string
  label: string
  data: AIResponse
}

export function AiAssistantPage() {
  const { t } = useTranslation()
  const [results, setResults] = React.useState<ResultCard[]>([])
  const [activePanel, setActivePanel] = React.useState<string | null>('training-plan')

  const { data: playersData } = useQuery({
    queryKey: ['players', 'all'],
    queryFn: () => playersApi.listPlayers({ limit: 100 }),
  })
  const { data: teamsData } = useQuery({
    queryKey: ['teams', 'all'],
    queryFn: () => teamsApi.listTeams({ limit: 100 }),
  })

  const players = playersData?.data ?? []
  const teams = teamsData?.data ?? []

  const addResult = (action: string, label: string, data: AIResponse) => {
    setResults((prev) => [...prev, { id: Date.now().toString(), action, label, data }])
  }

  // Training Plan
  const [tpTeam, setTpTeam] = React.useState('')
  const [tpGoal, setTpGoal] = React.useState('')
  const [tpDuration, setTpDuration] = React.useState(90)

  const { mutate: generatePlan, isPending: generatingPlan } = useMutation({
    mutationFn: aiApi.generateTrainingPlan,
    onSuccess: (data) => {
      addResult('training-plan', t('aiAssistant.generateTrainingPlan'), data)
      setTpGoal('')
    },
  })

  // Recommend Exercises
  const [rePlayer, setRePlayer] = React.useState('')
  const [reSkill, setReSkill] = React.useState('technical')

  const { mutate: recommendEx, isPending: recommendingEx } = useMutation({
    mutationFn: aiApi.recommendExercises,
    onSuccess: (data) => addResult('recommend-exercises', t('aiAssistant.recommendExercises'), data),
  })

  // Analyze Player
  const [apPlayer, setApPlayer] = React.useState('')

  const { mutate: analyzePlayer, isPending: analyzingPlayer } = useMutation({
    mutationFn: aiApi.analyzePlayer,
    onSuccess: (data) => addResult('analyze-player', t('aiAssistant.analyzePlayer'), data),
  })

  // Summarize Progress
  const [spPlayer, setSpPlayer] = React.useState('')
  const [spDays, setSpDays] = React.useState(30)

  const { mutate: summarize, isPending: summarizing } = useMutation({
    mutationFn: aiApi.summarizeProgress,
    onSuccess: (data) => addResult('summarize-progress', t('aiAssistant.summarizeProgress'), data),
  })

  const isLoading = generatingPlan || recommendingEx || analyzingPlayer || summarizing

  const panels = [
    {
      id: 'training-plan',
      label: t('aiAssistant.generateTrainingPlan'),
      icon: Brain,
      color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950',
      ring: 'ring-emerald-500',
      canSubmit: tpTeam && tpGoal.trim() && tpDuration >= 30,
      onSubmit: () => generatePlan({ teamId: tpTeam, goal: tpGoal, duration: tpDuration }),
      content: (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>{t('common.team')}</Label>
            <Select value={tpTeam} onValueChange={setTpTeam}>
              <SelectTrigger><SelectValue placeholder={t('aiAssistant.selectTeam')} /></SelectTrigger>
              <SelectContent>
                {teams.map((team) => (
                  <SelectItem key={team.id} value={team.id}>{team.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>{t('aiAssistant.goal')}</Label>
            <Textarea
              value={tpGoal}
              onChange={(e) => setTpGoal(e.target.value)}
              placeholder={t('aiAssistant.goalPlaceholder')}
              rows={2}
              className="resize-none"
            />
          </div>
          <div className="space-y-2">
            <Label>{t('aiAssistant.durationMin')}</Label>
            <Input
              type="number"
              min={30}
              max={180}
              value={tpDuration}
              onChange={(e) => setTpDuration(Number(e.target.value))}
            />
          </div>
        </div>
      ),
    },
    {
      id: 'recommend-exercises',
      label: t('aiAssistant.recommendExercises'),
      icon: Dumbbell,
      color: 'text-blue-600 bg-blue-50 dark:bg-blue-950',
      ring: 'ring-blue-500',
      canSubmit: rePlayer && reSkill,
      onSubmit: () => recommendEx({ playerId: rePlayer, weakSkill: reSkill }),
      content: (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>{t('common.player')}</Label>
            <Select value={rePlayer} onValueChange={setRePlayer}>
              <SelectTrigger><SelectValue placeholder={t('aiAssistant.selectPlayer')} /></SelectTrigger>
              <SelectContent>
                {players.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.firstName} {p.lastName}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>{t('aiAssistant.weakSkill')}</Label>
            <Select value={reSkill} onValueChange={setReSkill}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {WEAK_SKILLS.map((s) => (
                  <SelectItem key={s} value={s}>{t(`playerDetail.${s}`)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      ),
    },
    {
      id: 'analyze-player',
      label: t('aiAssistant.analyzePlayer'),
      icon: BarChart3,
      color: 'text-purple-600 bg-purple-50 dark:bg-purple-950',
      ring: 'ring-purple-500',
      canSubmit: !!apPlayer,
      onSubmit: () => analyzePlayer({ playerId: apPlayer }),
      content: (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>{t('common.player')}</Label>
            <Select value={apPlayer} onValueChange={setApPlayer}>
              <SelectTrigger><SelectValue placeholder={t('aiAssistant.selectPlayer')} /></SelectTrigger>
              <SelectContent>
                {players.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.firstName} {p.lastName}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      ),
    },
    {
      id: 'summarize-progress',
      label: t('aiAssistant.summarizeProgress'),
      icon: FileText,
      color: 'text-orange-600 bg-orange-50 dark:bg-orange-950',
      ring: 'ring-orange-500',
      canSubmit: !!spPlayer && spDays >= 7,
      onSubmit: () => summarize({ playerId: spPlayer, periodDays: spDays }),
      content: (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>{t('common.player')}</Label>
            <Select value={spPlayer} onValueChange={setSpPlayer}>
              <SelectTrigger><SelectValue placeholder={t('aiAssistant.selectPlayer')} /></SelectTrigger>
              <SelectContent>
                {players.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.firstName} {p.lastName}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>{t('aiAssistant.periodDays')}</Label>
            <Input
              type="number"
              min={7}
              max={365}
              value={spDays}
              onChange={(e) => setSpDays(Number(e.target.value))}
            />
          </div>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('aiAssistant.title')}
        description={t('aiAssistant.subtitle')}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        {panels.map((panel) => {
          const Icon = panel.icon
          const isOpen = activePanel === panel.id
          return (
            <Card
              key={panel.id}
              className={cn(
                'transition-all duration-200 overflow-hidden',
                isOpen && `ring-1 ${panel.ring}`,
                !isOpen && 'hover:shadow-md hover:-translate-y-0.5 cursor-pointer'
              )}
            >
              <CardHeader
                className="pb-3 cursor-pointer"
                onClick={() => setActivePanel(isOpen ? null : panel.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn('flex h-10 w-10 items-center justify-center rounded-xl', panel.color)}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{panel.label}</CardTitle>
                      <p className="text-xs text-muted-foreground">{t('aiAssistant.clickToConfigure')}</p>
                    </div>
                  </div>
                  {isOpen ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                </div>
              </CardHeader>

              {isOpen && (
                <>
                  <Separator />
                  <CardContent className="pt-4 space-y-4">
                    {panel.content}
                    <div className="flex justify-end">
                      <Button
                        onClick={panel.onSubmit}
                        disabled={!panel.canSubmit || isLoading}
                        className="gap-2"
                      >
                        {isLoading && activePanel === panel.id && <Loader2 className="h-4 w-4 animate-spin" />}
                        <Sparkles className="h-4 w-4" />
                        {t('aiAssistant.generate')}
                      </Button>
                    </div>
                  </CardContent>
                </>
              )}
            </Card>
          )
        })}
      </div>

      {results.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            {t('aiAssistant.results')}
          </h3>

          {results.map((result) => (
            <ResultDisplay key={result.id} result={result} t={t} />
          ))}
        </div>
      )}
    </div>
  )
}

function ResultDisplay({ result, t }: { result: ResultCard; t: (key: string) => string }) {
  const { data } = result

  if (result.action === 'training-plan' && data.plan) {
    return (
      <Card className="overflow-hidden">
        <CardHeader className="bg-emerald-50/50 dark:bg-emerald-950/20 pb-3">
          <div className="flex items-center gap-2">
            <Brain className="h-4 w-4 text-emerald-600" />
            <CardTitle className="text-base">{result.label}</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-4 space-y-4">
          <div>
            <h4 className="text-lg font-bold">{data.plan.title}</h4>
            <p className="text-sm text-muted-foreground mt-1">{data.plan.overview}</p>
          </div>
          <div className="space-y-3">
            {data.plan.blocks.map((block: BlockSuggestion, i: number) => (
              <div key={i} className="rounded-lg border p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline" className="capitalize">{block.kind}</Badge>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />{block.durationMin} {t('aiAssistant.minutesShort')}
                  </span>
                </div>
                <ul className="text-sm space-y-1">
                  {block.exercises.map((ex: string, j: number) => (
                    <li key={j} className="flex items-center gap-2">
                      <CheckCircle2 className="h-3 w-3 text-emerald-500 shrink-0" />
                      {ex}
                    </li>
                  ))}
                </ul>
                {block.notes && <p className="text-xs text-muted-foreground mt-2 italic">{block.notes}</p>}
              </div>
            ))}
          </div>
          {data.plan.tips.length > 0 && (
            <div className="rounded-lg bg-muted p-3">
              <p className="text-xs font-medium mb-1">{t('aiAssistant.tips')}</p>
              <ul className="text-sm space-y-1">
                {data.plan.tips.map((tip: string, i: number) => (
                  <li key={i} className="flex items-start gap-2">
                    <Target className="h-3 w-3 text-primary shrink-0 mt-1" />
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  if (result.action === 'recommend-exercises' && data.recommendations) {
    return (
      <Card className="overflow-hidden">
        <CardHeader className="bg-blue-50/50 dark:bg-blue-950/20 pb-3">
          <div className="flex items-center gap-2">
            <Dumbbell className="h-4 w-4 text-blue-600" />
            <CardTitle className="text-base">{result.label}</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-4 space-y-3">
          {data.recommendations.map((rec: AIRecommendationItem, i: number) => (
            <div key={i} className="flex items-start gap-3 rounded-lg border p-3">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                {rec.priority}
              </div>
              <div>
                <p className="font-medium text-sm">{rec.name}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{rec.reason}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    )
  }

  if (result.action === 'analyze-player' && data.analysis) {
    return (
      <Card className="overflow-hidden">
        <CardHeader className="bg-purple-50/50 dark:bg-purple-950/20 pb-3">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-purple-600" />
            <CardTitle className="text-base">{result.label}</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-4 space-y-4">
          <div className="rounded-lg bg-muted p-3">
            <p className="text-sm">{data.analysis.summary}</p>
          </div>
          {data.analysis.strengths.length > 0 && (
            <div>
              <p className="text-xs font-medium text-emerald-600 mb-1">{t('aiAssistant.strengths')}</p>
              <ul className="text-sm space-y-1">
                {data.analysis.strengths.map((s: string, i: number) => (
                  <li key={i} className="flex items-center gap-2">
                    <CheckCircle2 className="h-3 w-3 text-emerald-500 shrink-0" />{s}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {data.analysis.weaknesses.length > 0 && (
            <div>
              <p className="text-xs font-medium text-red-500 mb-1">{t('aiAssistant.weaknesses')}</p>
              <ul className="text-sm space-y-1">
                {data.analysis.weaknesses.map((w: string, i: number) => (
                  <li key={i} className="flex items-center gap-2">
                    <AlertCircle className="h-3 w-3 text-red-500 shrink-0" />{w}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {data.analysis.recommendations.length > 0 && (
            <div className="rounded-lg border p-3">
              <p className="text-xs font-medium mb-1">{t('aiAssistant.recommendations')}</p>
              <ul className="text-sm space-y-1">
                {data.analysis.recommendations.map((r: string, i: number) => (
                  <li key={i} className="flex items-start gap-2">
                    <Target className="h-3 w-3 text-primary shrink-0 mt-1" />{r}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{t('aiAssistant.devIndex')}: {data.analysis.devIndex}</Badge>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (result.action === 'summarize-progress' && data.progress) {
    return (
      <Card className="overflow-hidden">
        <CardHeader className="bg-orange-50/50 dark:bg-orange-950/20 pb-3">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-orange-600" />
            <CardTitle className="text-base">{result.label}</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-4 space-y-4">
          <div className="flex items-center gap-2">
            <Badge
              className={cn(
                data.progress.trend === 'improving' && 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400',
                data.progress.trend === 'declining' && 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400',
                data.progress.trend === 'stable' && 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400',
              )}
            >
              {data.progress.trend}
            </Badge>
          </div>
          <p className="text-sm">{data.progress.summary}</p>
          {data.progress.highlights.length > 0 && (
            <div>
              <p className="text-xs font-medium text-emerald-600 mb-1">{t('aiAssistant.highlights')}</p>
              <ul className="text-sm space-y-1">
                {data.progress.highlights.map((h: string, i: number) => (
                  <li key={i} className="flex items-center gap-2">
                    <CheckCircle2 className="h-3 w-3 text-emerald-500 shrink-0" />{h}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {data.progress.alerts.length > 0 && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 dark:bg-red-950/20">
              <p className="text-xs font-medium text-red-600 mb-1">{t('aiAssistant.alerts')}</p>
              <ul className="text-sm space-y-1">
                {data.progress.alerts.map((a: string, i: number) => (
                  <li key={i} className="flex items-center gap-2 text-red-700 dark:text-red-400">
                    <AlertCircle className="h-3 w-3 shrink-0" />{a}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  return null
}
