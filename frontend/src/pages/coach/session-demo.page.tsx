import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, Dumbbell, Clock, Users } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { SessionBuilder } from '@/features/sessions/session-builder'
import { PageHeader, Badge, Button } from '@/shared/ui'

const MOCK_EXERCISES = [
  { id: 'ex-1', name: 'Беговая разминка', category: 'cardio', description: 'Лёгкий бег 10 минут', durationMin: 10 },
  { id: 'ex-2', name: 'Растяжка бёдер', category: 'stretching', description: 'Динамическая растяжка', durationMin: 5 },
  { id: 'ex-3', name: 'Пас в движении', category: 'technical', description: 'Короткие передачи в парах', durationMin: 15 },
  { id: 'ex-4', name: 'Удары по воротам', category: 'technical', description: 'Завершение атаки', durationMin: 15 },
  { id: 'ex-5', name: 'Малый игровой формат 5x5', category: 'game', description: 'Игра на укороченном поле', durationMin: 20 },
  { id: 'ex-6', name: 'Статическая растяжка', category: 'stretching', description: 'Растяжка мышц ног и спины', durationMin: 10 },
  { id: 'ex-7', name: 'Прессинг и отбор', category: 'tactical', description: 'Отработка высокого прессинга', durationMin: 12 },
  { id: 'ex-8', name: 'Стандартные положения', category: 'tactical', description: 'Угловые и штрафные', durationMin: 10 },
]

const MOCK_BLOCKS = [
  {
    id: 'block-warmup',
    sessionID: 'demo-session',
    kind: 'warmup' as const,
    orderIndex: 0,
    durationMin: 15,
    notes: 'Постепенный набор темпа',
    exercises: [
      { id: 'e1', exerciseID: 'ex-1', name: 'Беговая разминка', durationMin: 10, orderIndex: 0 },
      { id: 'e2', exerciseID: 'ex-2', name: 'Растяжка бёдер', durationMin: 5, orderIndex: 1 },
    ],
  },
  {
    id: 'block-main',
    sessionID: 'demo-session',
    kind: 'main' as const,
    orderIndex: 1,
    durationMin: 37,
    notes: 'Основная техническая часть',
    exercises: [
      { id: 'e3', exerciseID: 'ex-3', name: 'Пас в движении', durationMin: 15, orderIndex: 0 },
      { id: 'e4', exerciseID: 'ex-4', name: 'Удары по воротам', durationMin: 15, orderIndex: 1 },
      { id: 'e5', exerciseID: 'ex-7', name: 'Прессинг и отбор', durationMin: 12, orderIndex: 2 },
    ],
  },
  {
    id: 'block-game',
    sessionID: 'demo-session',
    kind: 'game' as const,
    orderIndex: 2,
    durationMin: 30,
    notes: 'Игровая модель',
    exercises: [
      { id: 'e6', exerciseID: 'ex-5', name: 'Малый игровой формат 5x5', durationMin: 20, orderIndex: 0 },
      { id: 'e7', exerciseID: 'ex-8', name: 'Стандартные положения', durationMin: 10, orderIndex: 1 },
    ],
  },
  {
    id: 'block-cooldown',
    sessionID: 'demo-session',
    kind: 'cooldown' as const,
    orderIndex: 3,
    durationMin: 10,
    notes: 'Восстановление',
    exercises: [
      { id: 'e8', exerciseID: 'ex-6', name: 'Статическая растяжка', durationMin: 10, orderIndex: 0 },
    ],
  },
]

export function SessionDemoPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [saved, setSaved] = React.useState(false)

  const totalMin = MOCK_BLOCKS.reduce((acc, b) => acc + (b.durationMin ?? 0), 0)

  return (
    <div className="space-y-6">
      <Button variant="ghost" className="gap-2" onClick={() => navigate('/coach/calendar')}>
        <ArrowLeft className="h-4 w-4" />
        {t('common.back')}
      </Button>

      <PageHeader
        title={t('sessions.sessionBuilder')}
        description="Демонстрация конструктора тренировки"
        actions={
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="gap-1">
              <Clock className="h-3.5 w-3.5" />
              {totalMin} {t('common.min')}
            </Badge>
            <Badge variant="outline" className="gap-1">
              <Users className="h-3.5 w-3.5" />
              {MOCK_BLOCKS.reduce((acc, b) => acc + b.exercises.length, 0)} упражнений
            </Badge>
            <Badge className="bg-emerald-500 gap-1">
              <Dumbbell className="h-3.5 w-3.5" />
              Demo
            </Badge>
          </div>
        }
      />

      <SessionBuilder
        sessionId="demo"
        initialBlocks={MOCK_BLOCKS as any}
        exercises={MOCK_EXERCISES as any}
        readOnly={false}
        onSave={() => {
          setSaved(true)
          setTimeout(() => setSaved(false), 2000)
        }}
      />

      {saved && (
        <div className="fixed bottom-6 right-6 rounded-lg bg-emerald-500 px-4 py-2 text-white shadow-lg">
          Сохранено (демо)
        </div>
      )}
    </div>
  )
}
