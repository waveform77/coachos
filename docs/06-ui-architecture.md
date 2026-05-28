# CoachOS — UI/UX Architecture

## Design System

### Color Palette
```css
/* Primary — Football Green */
--primary: #10B981;           /* emerald-500 */
--primary-dark: #059669;      /* emerald-600 */
--primary-light: #6EE7B7;     /* emerald-300 */

/* Accent — Energy Orange */
--accent: #F97316;            /* orange-500 */
--accent-dark: #EA580C;       /* orange-600 */

/* Neutrals */
--background: #F8FAFC;        /* slate-50 */
--foreground: #0F172A;        /* slate-900 */
--card: #FFFFFF;
--border: #E2E8F0;            /* slate-200 */

/* Semantic */
--success: #10B981;
--warning: #F59E0B;
--error: #EF4444;
--info: #3B82F6;
```

### Typography
- **UI Font**: Inter (Google Fonts)
- **Metric Font**: JetBrains Mono (numbers, stats)
- Scale: 12/14/16/20/24/30/36/48px

### Component Library
shadcn/ui + Tailwind CSS с кастомными CSS-переменными.
Иконки: lucide-react.

### PDI Color Coding
- 0–39: red (требует внимания)
- 40–69: yellow (развивается)
- 70–100: green (отличный прогресс)

---

## Layout Architecture

### AppShell
```
┌─────────────────────────────────────────────────┐
│ TOPBAR: Logo | PageTitle | Notifications | User  │
├──────────┬──────────────────────────────────────┤
│          │                                        │
│ SIDEBAR  │         MAIN CONTENT                  │
│ (240px)  │         (flex-1)                      │
│          │                                        │
│ Nav items│                                        │
│ (role-   │                                        │
│ specific)│                                        │
│          │                                        │
└──────────┴──────────────────────────────────────┘
```

**Mobile (< 768px)**:
- Sidebar скрыт, открывается как Sheet drawer
- Bottom navigation bar с 4–5 основными пунктами

### Breakpoints
- `sm`: 640px  
- `md`: 768px  
- `lg`: 1024px  
- `xl`: 1280px

---

## Sidebar Navigation по ролям

### Admin
- 🏠 Dashboard
- 🏟️ Club Overview
- 👥 Teams
- ⚽ Players
- 🎓 Coaches
- 📊 Analytics

### Coach
- ⚡ Command Center
- 👥 My Teams
- 📅 Calendar
- 🏋️ Exercises
- ✅ Attendance
- ⭐ Assessments
- 🏆 Matches
- 📊 Analytics
- 🤖 AI Assistant

### Player
- 📅 My Schedule
- 📈 My Progress
- 🎯 My Goals
- 📋 My Reports

### Parent
- 👤 Child Overview
- 📅 Schedule
- ✅ Attendance
- 📊 Progress

---

## Pages Specification

### Landing Page (`/`)
**Goal**: Конвертировать посетителя в регистрацию

**Sections**:
1. **Hero**: «The Operating System for Football Academies» + CTA «Get Started Free» + «See Demo»
2. **Problem**: 3 боли тренеров (с иконками)
3. **Features**: 6 ключевых фич (grid)
4. **Roles**: Coach / Player / Parent — что видит каждый
5. **Social proof**: цифры (мест, академий, игроков)
6. **CTA**: «Start your free trial»

---

### Login (`/login`)
**Goal**: Вход в систему

**Elements**:
- CoachOS logo + tagline
- Email + Password fields
- «Войти» button
- Link to register
- Error state under form

---

### Coach Command Center (`/coach`)
**Goal**: Главная страница тренера — всё важное с первого взгляда

**Layout**: 3-column grid

**Row 1 — StatCards** (4 карточки):
- Тренировок сегодня (с иконкой calendar)
- Игроков присутствует (с attendance rate)
- Перегруженных игроков (warning color)
- Новых уведомлений

**Row 2** (2 колонки):
- **Left**: TodaysSessions — список сессий на сегодня с кнопкой «Начать»
- **Right**: AbsentToday — список отсутствующих игроков с причинами

**Row 3** (2 колонки):
- **Left**: PlayersAtRisk — таблица с badge-сигналами (низкая посещаемость, падение PDI)
- **Right**: UpcomingSessions — ближайшие 7 дней

---

### Player Profile (`/coach/players/:id`)
**Goal**: Полный профиль с всей аналитикой

**Header**:
- Фото/аватар, имя, позиция, номер
- PDI gauge (большой, центральный)
- Быстрые действия: «Добавить оценку», «Написать цель»

**Tabs**:
1. **Overview**:
   - Physical stats (возраст, рост, вес, ведущая нога)
   - Latest assessment Radar Chart (5 параметров)
   - Current goals (3 последних с прогрессом)
   - Medical notes (только coach/admin)

2. **Progress**:
   - DevIndex LineChart (последние 6 месяцев)
   - Assessment history table
   - «Сравнить с предыдущей оценкой» toggle

3. **Attendance**:
   - Attendance rate progress bar
   - Monthly calendar (presence/absence heatmap style)
   - Last 10 sessions table

4. **Goals**:
   - Active goals list с progress bars
   - Achieved goals
   - «Добавить цель» button

5. **Assessments**:
   - History с датами
   - «Добавить оценку» dialog

---

### Training Calendar (`/coach/calendar`)
**Goal**: Планирование и обзор расписания

**FullCalendar Features**:
- Month/Week/Day views
- Цветовое кодирование: зелёный = тренировка, оранжевый = матч
- Клик на событие → detail sheet справа
- Drag-n-drop (could-have)
- «+ Создать тренировку» button

**Side Panel** (при выборе события):
- Session/Match details
- Quick actions: Edit, Complete, Cancel

---

### Session Builder (`/coach/sessions/:id`)
**Goal**: Создание структурированной тренировки

**Layout** (2 columns):

**Left — Block List** (dnd-kit sortable):
```
┌─────────────────────┐
│ 🏃 Разминка (15 мин) │
│   • Rondo 5v2 (5m)  │
│   • Dynamic stretch │
│   [+ Add exercise]  │
├─────────────────────┤
│ ⚽ Основная (50 мин) │
│   • Pressing drill  │
│   • 1v1 duels       │
│   [+ Add exercise]  │
├─────────────────────┤
│ 🎮 Игровая (20 мин)  │
│   • 7v7 game        │
├─────────────────────┤
│ 💆 Заминка (5 мин)  │
│   • Static stretch  │
└─────────────────────┘
[+ Add Block]
```

**Right — Exercise Picker** (searchable):
- Search input
- Filter chips: по категории
- Exercise list с drag или click-to-add
- Exercise details on hover

**Footer**:
- Total duration: 90 min
- Load Score: 340 (Normal / High / Overload)
- «Сохранить» button

---

### Exercise Library (`/coach/exercises`)
**Goal**: Библиотека упражнений с фильтрацией

**Header**: Filter Bar
- Category chips: Technique | Tactics | Physical | Coordination | Goalkeeping | Warmup | Cooldown
- Difficulty slider: 1–5
- Search input
- «+ Создать» button

**Content**: Grid (3 columns на lg, 2 на md, 1 на sm)
- ExerciseCard каждое

**ExerciseCard**:
```
┌────────────────────┐
│ [Diagram/Icon]     │
│ Cone Dribbling     │
│ ⭐⭐⭐ Technique     │
│ 10 min | 1-5 игр.  │
│ Tags: #dribbling   │
│ [View] [Add] [Edit]│
└────────────────────┘
```

---

### AI Assistant (`/coach/ai`)
**Goal**: AI-помощник тренера

**Layout** (2 columns on desktop):

**Left — Quick Actions** (4 cards):
- 📋 Генерация плана тренировки
- 💡 Рекомендации упражнений
- 🔍 Анализ игрока
- 📈 Резюме прогресса

**Center — Conversation Area**:
```
┌──────────────────────────────┐
│ Запрос (bubble right):        │
│ «Создай тренировку на тему   │
│  улучшение прессинга»         │
│                               │
│ Ответ (bubble left):          │
│ ┌──────────────────────────┐  │
│ │ 📋 High Press Session    │  │
│ │ Разминка (15 мин): ...   │  │
│ │ Основная (60 мин): ...   │  │
│ │ [Apply to Calendar]      │  │
│ └──────────────────────────┘  │
└──────────────────────────────┘
│ Input: [Enter your request...][Send]│
```

---

### Parent Overview (`/parent/child/:id`)
**Goal**: Parent Transparency Mode — понятный прогресс без сухих таблиц

**Hero Section**:
- Имя ребёнка + фото
- Big PDI gauge: «Иван набрал 72 балла из 100»
- Trend badge: «↑ +5 за последний месяц»

**Cards Row**:
- 📅 Ближайшая тренировка: ЧЧ/ММ/ГГ
- ✅ Посещаемость: 87%
- 🎯 Активных целей: 3

**Strengths & Growth Areas**:
```
Сильные стороны: Дисциплина ★★★★★, Командная игра ★★★★
Зоны роста: Тактика ★★★, Физическая форма ★★★
```

**Recent Notifications**: последние 5 уведомлений об академии

---

## Key UI Components

### StatCard
```tsx
Props: {
  title: string
  value: string | number
  description?: string
  icon: LucideIcon
  trend?: { value: number; direction: 'up' | 'down' | 'neutral' }
  loading?: boolean
  variant?: 'default' | 'warning' | 'danger' | 'success'
}
```

### SkillRadarChart
```tsx
Props: {
  current: { technical: number; physical: number; tactical: number; discipline: number; teamwork: number }
  previous?: { ... } // для сравнения
  size?: 'sm' | 'md' | 'lg'
}
```

### PlayerDevIndex
```tsx
Props: {
  value: number // 0-100
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
  trend?: 'rising' | 'stable' | 'falling'
}
// Circular progress with color coding:
// 0-39: red, 40-69: yellow, 70-100: green
```

### AttendanceTable
```tsx
Props: {
  sessionID: string
  players: Player[]
  records: AttendanceRecord[]
  onSave: (records: AttendanceRecordUpdate[]) => void
  readOnly?: boolean
}
// Inline status toggle per player
// Bulk save button
```

### EmptyState
```tsx
Props: {
  icon: LucideIcon
  title: string
  description: string
  action?: { label: string; onClick: () => void }
}
```

---

## Loading & Error States

### Loading Strategy
1. **Page load**: LoadingSkeleton matching page layout
2. **Mutation**: Button spinner + disabled state
3. **Background refetch**: Stale data shown, subtle loading indicator

### Error Strategy
1. **Network error**: ErrorBoundary with retry button
2. **403 Forbidden**: Redirect to dashboard + toast
3. **404 Not Found**: EmptyState with back button
4. **Validation error**: Inline form errors

### Empty State Messages
- No players: «Нет игроков. Добавьте первого игрока в команду.»
- No sessions: «Нет тренировок. Создайте первую сессию.»
- No exercises: «Библиотека упражнений пуста. Добавьте своё первое упражнение.»
- No matches: «Матчи не запланированы.»

---

## Accessibility (A11y)

- ARIA roles на всех интерактивных элементах
- Focus trap в модальных диалогах
- Keyboard navigation: Tab, Enter, Escape, Arrow keys
- Color contrast: минимум AA (4.5:1 для текста)
- Screen reader support: all images have alt text
- Responsive font sizes: relative units
