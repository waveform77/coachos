# CoachOS — Cursor Implementation Prompts

Готовые промпты для итеративной реализации проекта в Cursor.
Каждый промпт — самодостаточная задача с чёткими критериями готовности.

---

## PROMPT 1: Инициализация Backend

```
Создай backend bootstrap для проекта CoachOS в директории /backend.

Модуль: github.com/coachos/backend
Go: 1.22

Создай следующие файлы:

1. backend/go.mod — с зависимостями:
   - github.com/gofiber/fiber/v2 v2.52.4
   - github.com/golang-jwt/jwt/v5 v5.2.1
   - github.com/spf13/viper v1.18.2
   - github.com/rs/zerolog v1.32.0
   - github.com/google/uuid v1.6.0
   - golang.org/x/crypto v0.22.0
   - gorm.io/gorm v1.25.10
   - gorm.io/driver/postgres v1.5.9
   - github.com/go-playground/validator/v10 v10.20.0
   - github.com/lib/pq v1.10.9
   - gorm.io/datatypes v1.2.0

2. backend/.env.example — все env vars (APP_ENV, APP_PORT, JWT_SECRET, DB_*, CORS_ORIGINS, LOG_LEVEL)

3. backend/internal/config/config.go — Viper-based config загрузка, строго типизированная Config struct

4. backend/internal/pkg/logger/logger.go — zerolog structured logger

5. backend/internal/pkg/jwt/jwt.go — JWT генерация и парсинг (Claims: UserID, Email, Role, ClubID)

6. backend/internal/pkg/hash/hash.go — bcrypt wrapper (HashPassword, CheckPassword)

7. backend/internal/pkg/idgen/idgen.go — UUID v4 генератор

8. backend/internal/database/postgres.go — GORM + PostgreSQL подключение с connection pool

9. backend/internal/handler/health_handler.go — GET /health endpoint

10. backend/cmd/api/main.go — composition root с graceful shutdown (SIGTERM/SIGINT)

Требования:
- Весь код должен компилироваться
- Нет псевдокода
- Обработка ошибок везде
- Graceful shutdown ждёт 5 секунд
- Health endpoint возвращает {"status":"ok","service":"coachos-api","version":"1.0.0","timestamp":"..."}

Проверка готовности:
go build ./cmd/api → должен компилироваться
go vet ./... → нет ошибок
```

---

## PROMPT 2: Domain Models + Migrations

```
Реализуй domain layer для CoachOS backend.

Создай:

1. backend/internal/domain/models.go
   Все GORM модели:
   - Club, User, RefreshToken, CoachProfile
   - Team, TeamMember, Player, Parent, PlayerParent
   - Exercise, TrainingSession, TrainingBlock, SessionExercise
   - AttendanceRecord, PlayerAssessment, PlayerGoal
   - Match, MatchLineup, MatchEvent
   - Notification, Report, AIRecommendation, AuditLog

   Требования:
   - BaseModel с UUID (BeforeCreate hook), timestamps, soft delete
   - Все ENUMs как string type constants
   - GORM tags корректны (type:uuid, uniqueIndex, default)
   - pq.StringArray для TEXT[] полей
   - datatypes.JSON для JSONB полей

2. backend/internal/domain/errors.go
   - Sentinel errors: ErrNotFound, ErrForbidden, ErrUnauthorized, ErrConflict, ErrValidation
   - AppError struct с Code, Message, Details, Err
   - Constructor функции: NewNotFound, NewForbidden, NewConflict, NewValidation

3. backend/migrations/0001_init.up.sql
   Полный PostgreSQL DDL:
   - CREATE TYPE для всех enum
   - CREATE TABLE для всех таблиц с indexes и constraints
   - Соответствует domain models

4. backend/migrations/0001_init.down.sql
   DROP всё в обратном порядке

Проверка: go build ./... → success
```

---

## PROMPT 3: Auth Module

```
Реализуй authentication module для CoachOS backend.

Создай:

1. backend/internal/repository/interfaces.go
   Интерфейсы: UserRepository, RefreshTokenRepository

2. backend/internal/repository/postgres/user_repo.go
   GORM реализация UserRepository

3. backend/internal/repository/postgres/refresh_token_repo.go
   GORM реализация RefreshTokenRepository

4. backend/internal/dto/auth.go
   RegisterRequest, LoginRequest, AuthResponse, TokenPair (с validate tags)

5. backend/internal/dto/user.go
   UserResponse, UpdateProfileRequest

6. backend/internal/validator/validator.go
   Setup go-playground/validator/v10, функция Validate(interface{}) error

7. backend/internal/service/auth_service.go
   AuthService с методами:
   - Register: hash password, create user, return tokens
   - Login: verify password, issue tokens, store refresh hash
   - Refresh: rotation с family_id reuse detection
   - Logout: revoke refresh token
   - Me: find user by ID

8. backend/internal/handler/auth_handler.go
   Fiber handlers: Register, Login, Refresh, Logout, Me
   Refresh token в httpOnly cookie (Secure, SameSite=Lax)

9. backend/internal/middleware/auth.go
   JWT middleware: extract Bearer, parse claims, set ctx.Locals("user")

10. backend/internal/middleware/error_handler.go
    Central error handler: AppError → HTTP status + JSON

11. backend/internal/middleware/rbac.go
    RequireRole(roles ...domain.Role) fiber.Handler

12. backend/internal/routes/routes.go
    Зарегистрировать auth routes (register, login, refresh, logout, me)

Требования:
- Access token: 15 min, хранится только в памяти клиента
- Refresh token: 7 дней, httpOnly cookie + bcrypt hash в БД
- При reuse атаке: ревокировать всю family
- Все ошибки через AppError
- Тест: POST /auth/register → 201 + token
```

---

## PROMPT 4: Clubs, Teams, Players CRUD

```
Реализуй CRUD для clubs, teams, players в CoachOS backend.

Создай для каждой сущности (club, team, player, parent):
1. DTO файл с Request/Response struct и validate tags
2. Repository interface (в interfaces.go)
3. GORM реализация репозитория
4. Service с бизнес-логикой
5. Fiber handler
6. Routes в routes.go

Clubs:
- POST /api/v1/clubs (admin)
- GET /api/v1/clubs/:id (auth)
- PATCH /api/v1/clubs/:id (admin)
- GET /api/v1/clubs/:id/dashboard → {teamCount, playerCount, coachCount, recentSessions}

Teams:
- CRUD /api/v1/teams
- POST /api/v1/teams/:id/members (playerID, jerseyNumber, position, isCaptain)
- DELETE /api/v1/teams/:id/members/:playerID
- GET /api/v1/teams/:id/dashboard

Players:
- CRUD /api/v1/players
- GET /api/v1/players/:id/profile (player + latest assessment + goals count + attendance rate)
- GET /api/v1/players/:id/progress (assessment history for charting)
- GET /api/v1/players/:id/dev-index (PDI calculation)

Добавить в middleware/rbac.go:
- RequireClubAccess: проверяет что resource.ClubID == user.ClubID

Требования:
- Pagination на всех list endpoints (?page=1&limit=20)
- Soft delete (gorm.DeletedAt)
- Club ownership check на всех операциях
```

---

## PROMPT 5: Exercises + Training Sessions

```
Реализуй exercises и training sessions modules для CoachOS.

Exercises:
- Repository + Service + Handler + DTO
- Filters: category, difficulty, tags (pq array overlap), search (ILIKE), global
- CRUD /api/v1/exercises
- GET /api/v1/exercises?category=technique&difficulty=3&tags=dribbling&search=cone

Training Sessions:
- Repository + Service + Handler + DTO
- CRUD /api/v1/sessions
- POST /api/v1/sessions/:id/blocks {kind, orderIndex, durationMin}
- POST /api/v1/sessions/:id/blocks/:blockID/exercises {exerciseID, orderIndex, durationMin, sets, reps}
- GET /api/v1/sessions/:id → SessionDetailResponse (preload Blocks.Exercises.Exercise)
- PATCH /api/v1/sessions/:id/attendance → bulk attendance update
- POST /api/v1/sessions/:id/complete → status=completed + notifications

Smart Training Load:
- В SessionService.Create/Complete рассчитывай weekly load score:
  load = SUM(duration * intensity_multiplier)
  low=0.6, medium=1.0, high=1.5
- Если > 450 → создай уведомление "Overload Warning" тренеру
- Верни в response: {loadScore, loadLevel: "normal"|"high"|"overload"}

Notifier:
- backend/internal/notifier/notifier.go → Notifier interface
- backend/internal/notifier/inapp.go → InAppNotifier (сохраняет в notifications table)
- При CompleteSession → уведомить всех игроков команды
```

---

## PROMPT 6: Attendance + Assessments + Matches

```
Реализуй attendance, assessments, matches modules.

Attendance:
- AttendanceRepository + Service + Handler
- PATCH /api/v1/sessions/:id/attendance → upsert records
- GET /api/v1/sessions/:id/attendance → all records
- GET /api/v1/players/:id/attendance → paginated history
- GetPlayerAttendanceStats(playerID) → (present int, total int, rate float64)
- GetTeamAttendanceStats(teamID, from, to) → []PlayerAttendanceStat

Assessments:
- AssessmentRepository + Service + Handler
- POST /api/v1/assessments {playerID, technical, physical, tactical, discipline, teamwork 1-10, notes}
- GET /api/v1/players/:id/assessments → paginated + trend
- GET /api/v1/teams/:id/assessments-summary → AVG scores per player (raw SQL)
- После создания assessment → пересчитать PDI игрока:
  PDI = attendance_rate*0.20 + avg_assessment*10*0.50 + goals_rate*0.30
  Обновить players.dev_index

Matches:
- MatchRepository + Service + Handler
- CRUD /api/v1/matches
- PUT /api/v1/matches/:id/lineup → set full lineup
- POST /api/v1/matches/:id/events → add event (goal/assist/card/sub)
- GET /api/v1/matches/:id/summary → {match, lineup, events, playerStats}
  playerStats: per player goals/assists/cards/minutes

PlayerGoals:
- PlayerGoalRepository + Service + Handler
- CRUD /api/v1/players/:id/goals
- PDI recalculation учитывает achieved goals rate
```

---

## PROMPT 7: Analytics + AI Assistant

```
Реализуй analytics и AI assistant modules.

Analytics:
- AnalyticsService + AnalyticsHandler
- GET /api/v1/analytics/coach-dashboard
  {todaysSessions, absentToday, playersAtRisk, upcomingSessions, teamStats}
  playersAtRisk: attendance < 60% OR последняя оценка > 30 дней назад

- GET /api/v1/analytics/team/:id
  {attendanceByWeek[], avgAssessments{}, trainingLoadByWeek[], topPlayers[]}

- GET /api/v1/analytics/player/:id
  {assessmentHistory[], devIndexHistory[], attendanceHistory[], goalsProgress[]}

- GET /api/v1/analytics/training-load?teamID=&weeks=8
  {weeks[], overloadWarnings[]}

AI Assistant:
- backend/internal/ai/provider.go → Provider interface
  GenerateTrainingPlan, RecommendExercises, AnalyzePlayer, SummarizeProgress

- backend/internal/ai/mock_provider.go → MockProvider (rule-based)
  GenerateTrainingPlan: при goal='pressing' → tactics+physical план
  RecommendExercises: если weakSkill='technical' → топ-3 упражнения из библиотеки
  AnalyzePlayer: по assessments считает strengths/weaknesses (top/bottom 2 параметра)
  SummarizeProgress: сравнивает первую и последнюю оценку

- AIService + AIHandler + AIRepository (сохранять запросы/ответы)
- POST /api/v1/ai/training-plan
- POST /api/v1/ai/recommend-exercises
- POST /api/v1/ai/analyze-player
- POST /api/v1/ai/summarize-progress

Notifications:
- NotificationService + NotificationHandler
- GET /api/v1/notifications?unreadOnly=true&page=1&limit=20
- PATCH /api/v1/notifications/:id/read
- PATCH /api/v1/notifications/read-all
```

---

## PROMPT 8: Seeds + Tests

```
Реализуй seed данные и базовые тесты.

Seeds (backend/seeds/seed.go):
Создай функцию Seed(db *gorm.DB) error которая создаёт:
- 1 club: "FC Academy Demo"
- 1 admin: admin@coachos.dev / Admin123!
- 2 coaches: coach1@coachos.dev / Coach123!, coach2@coachos.dev / Coach123!
- 3 teams: U15 Alpha, U17 Pro, Senior Squad
- 15 players с разными позициями и данными
- 30 exercises по всем категориям
- 8 training sessions с blocks и exercises
- Attendance records (90% attendance rate)
- Player assessments (varied scores)
- 2 matches с lineup и events
- Notifications для всех пользователей

Tests:
1. backend/tests/unit/pdi_test.go
   TestCalculatePDI с табличными тестами

2. backend/tests/unit/training_load_test.go
   TestCalculateWeeklyLoad

3. backend/tests/handler/auth_handler_test.go
   TestRegister_Success, TestLogin_Success, TestLogin_WrongPassword

4. backend/tests/middleware/rbac_test.go
   TestRequireRole_AllowedRole, TestRequireRole_DeniedRole

Запустить seed командой: go run ./seeds/cmd/main.go
```

---

## PROMPT 9: Frontend Bootstrap + Auth

```
Создай frontend для CoachOS.

Setup:
- Vite + React 18 + TypeScript
- Tailwind CSS с custom emerald/orange theme
- shadcn/ui компоненты (button, card, input, badge, etc.)
- FSD structure: app/, pages/, widgets/, features/, entities/, shared/

Файлы:
1. frontend/package.json (все зависимости из плана)
2. frontend/vite.config.ts (proxy /api/v1 → localhost:8080, alias @/)
3. frontend/tailwind.config.ts (custom colors)
4. frontend/src/shared/types/index.ts (все TypeScript типы)
5. frontend/src/shared/lib/utils.ts (cn, formatDate, getInitials)
6. frontend/src/shared/api/client.ts (axios + refresh interceptor)
7. frontend/src/app/store/auth.store.ts (Zustand: user, accessToken)
8. frontend/src/app/providers/query-provider.tsx
9. frontend/src/app/router/index.tsx (все маршруты с lazy loading)
10. frontend/src/app/router/protected-route.tsx
11. frontend/src/app/index.tsx
12. frontend/src/main.tsx

Auth pages:
13. frontend/src/features/auth/login-form.tsx (react-hook-form + zod)
14. frontend/src/features/auth/register-form.tsx
15. frontend/src/pages/auth/login.page.tsx
16. frontend/src/pages/auth/register.page.tsx

shadcn/ui components:
17. frontend/src/shared/ui/button.tsx
18. frontend/src/shared/ui/card.tsx
19. frontend/src/shared/ui/input.tsx
20. frontend/src/shared/ui/badge.tsx
21. frontend/src/shared/ui/skeleton.tsx
22. frontend/src/shared/ui/stat-card.tsx
23. frontend/src/shared/ui/empty-state.tsx
24. frontend/src/shared/ui/role-guard.tsx
```

---

## PROMPT 10: AppShell + Dashboards

```
Реализуй AppShell и dashboards для CoachOS frontend.

AppShell:
- frontend/src/widgets/app-shell/app-shell.tsx
  Sidebar (роль-зависимая навигация) + Topbar + main content
  Mobile: Sheet drawer для sidebar

- frontend/src/widgets/app-shell/sidebar-nav.tsx
  NavLink items с icons, active state

- frontend/src/widgets/app-shell/topbar.tsx
  Notifications bell (unread badge) + User menu (profile, logout)

Dashboards:
- frontend/src/pages/dashboard/dashboard.page.tsx
  Router: перенаправляет на /coach, /admin, /me/schedule, /parent в зависимости от роли

- frontend/src/pages/coach/command-center.page.tsx
  Row 1: 4 StatCards
  Row 2: TodaysSessions + AbsentToday
  Row 3: PlayersAtRisk + UpcomingSessions
  useQuery(queryKeys.analytics.coachDashboard)
  Skeleton loading states

API hooks:
- frontend/src/shared/api/analytics.api.ts
- frontend/src/shared/api/query-keys.ts
- useCoachDashboard hook в shared/lib/hooks.ts
```

---

## PROMPT 11: Players + Teams Modules

```
Реализуй teams и players modules для CoachOS frontend.

Teams:
- frontend/src/shared/api/teams.api.ts (all API functions)
- frontend/src/entities/team/team-card.tsx
- frontend/src/pages/coach/teams.page.tsx (grid + create dialog)
- frontend/src/pages/coach/team-detail.page.tsx
  Tabs: Members | Sessions | Matches | Analytics
  Members tab: PlayerCard list + add/remove

Players:
- frontend/src/shared/api/players.api.ts
- frontend/src/entities/player/player-card.tsx
- frontend/src/entities/player/player-dev-index.tsx (circular progress 0-100)
- frontend/src/entities/player/skill-radar-chart.tsx (Recharts RadarChart)
- frontend/src/features/players/player-form.tsx (create/edit)
- frontend/src/features/players/assessment-form.tsx (5 sliders + radar preview)
- frontend/src/pages/coach/players.page.tsx (list + filters)
- frontend/src/pages/coach/player-detail.page.tsx
  Header: photo, name, position, PDI gauge
  Tabs: Overview | Progress | Attendance | Goals | Assessments
```

---

## PROMPT 12: Calendar + Session Builder + Exercises

```
Реализуй calendar, session builder, exercises pages.

Calendar:
- frontend/src/pages/coach/calendar.page.tsx
  FullCalendar с Month/Week/Day views
  Sessions: green events, Matches: orange
  Click → Sheet with session/match details
  "+ Create" button

Session Builder:
- frontend/src/features/sessions/session-builder.tsx
  dnd-kit sortable blocks
  Exercise picker (searchable)
  Total duration + load score display

- frontend/src/pages/coach/session-detail.page.tsx
  Header: date, team, status
  Tabs: Builder | Attendance | Notes
  AttendanceTable component

Exercises:
- frontend/src/features/exercises/exercise-form.tsx
- frontend/src/entities/exercise/exercise-card.tsx
- frontend/src/pages/coach/exercises.page.tsx
  Filter chips by category
  Grid of ExerciseCards
  Create/Edit dialog
```

---

## PROMPT 13: Assessments + Matches + Analytics

```
Реализуй assessments, matches, analytics pages.

Assessments:
- frontend/src/pages/coach/assessments.page.tsx
  Player selector + history table + add assessment button

Matches:
- frontend/src/features/matches/match-form.tsx
- frontend/src/features/matches/lineup-builder.tsx (assign roles)
- frontend/src/features/matches/match-events-form.tsx
- frontend/src/pages/coach/matches.page.tsx (upcoming/completed tabs)
- frontend/src/pages/coach/match-detail.page.tsx
  Tabs: Lineup | Events | Summary

Analytics:
- frontend/src/pages/coach/analytics.page.tsx
  Tab 1: Team — BarChart посещаемости, AreaChart нагрузки
  Tab 2: Players — RadarChart сравнения, LineChart PDI
  Tab 3: Load — weekly load AreaChart с threshold line
  Все через Recharts
```

---

## PROMPT 14: AI Assistant + Player/Parent Portals

```
Реализуй AI assistant и portals.

AI Assistant:
- frontend/src/shared/api/ai.api.ts
- frontend/src/pages/coach/ai-assistant.page.tsx
  Left: 4 quick action cards
  Center: chat-style interface
  Loading: "Thinking..." animation
  Response: structured cards

Player Portal:
- frontend/src/pages/player/schedule.page.tsx (FullCalendar)
- frontend/src/pages/player/progress.page.tsx (PDI + radar + history)
- frontend/src/pages/player/goals.page.tsx (progress bars)
- frontend/src/pages/player/reports.page.tsx

Parent Portal (Transparency Mode):
- frontend/src/pages/parent/overview.page.tsx
  Hero: child name + big PDI gauge + trend
  Cards: next session, attendance rate, active goals
  Strengths + growth areas
  Recent notifications
- frontend/src/pages/parent/schedule.page.tsx
- frontend/src/pages/parent/attendance.page.tsx
- frontend/src/pages/parent/progress.page.tsx

Landing Page:
- frontend/src/pages/landing/landing.page.tsx
  Hero, Features, Roles, CTA sections
  Modern gradient design
```

---

## PROMPT 15: Polish + Testing

```
Финальная полировка CoachOS frontend.

Loading/Error states:
- frontend/src/shared/ui/loading-skeleton.tsx (card, table, chart variants)
- Error boundaries на всех страницах
- Empty states с CTA для каждой страницы
- Toast notifications (sonner) на всех mutations

Responsive:
- Проверить и исправить mobile breakpoints
- Sidebar → Sheet на mobile
- Tables → horizontal scroll на mobile
- Cards → single column на mobile

Dark Mode:
- ThemeProvider с light/dark toggle в Topbar
- CSS variables через shadcn/ui

A11y:
- ARIA labels на interactive elements
- Focus trap в dialogs
- Keyboard navigation

Tests (Vitest + RTL):
- frontend/src/features/auth/__tests__/login-form.test.tsx
- frontend/src/shared/ui/__tests__/role-guard.test.tsx
- frontend/src/shared/ui/__tests__/stat-card.test.tsx
- frontend/src/shared/lib/__tests__/utils.test.ts
```

---

## Общие правила для всех промптов

1. Код должен компилироваться/запускаться без ошибок
2. Нет псевдокода — только рабочий код
3. Обработка ошибок везде
4. TypeScript strict mode
5. Именование согласовано с backend (camelCase в JSON, PascalCase в Go)
6. Никаких `any` типов в TypeScript без необходимости
7. Каждый файл начинается с правильных import
8. После создания файлов — запустить соответствующую проверку
