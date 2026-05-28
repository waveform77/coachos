# CoachOS — Architecture Document

## 1. Системная архитектура

```
┌─────────────────────────────────────────────────────────────────┐
│                        CoachOS Platform                          │
├─────────────┬──────────────────────────┬────────────────────────┤
│  Browser    │    CDN / Static Host     │   Reverse Proxy        │
│  SPA        │    (Vercel/Netlify)      │   (Caddy/Nginx)        │
│  React+TS   │    Frontend Bundle       │   TLS termination      │
└──────┬──────┴──────────────────────────┴──────────┬─────────────┘
       │ HTTPS                                       │ /api/v1/*
       │                                    ┌────────▼────────────┐
       │                                    │   Go Fiber API      │
       │                                    │   (monolith)        │
       │                                    │   Port: 8080        │
       │                                    └────────┬────────────┘
       │                                             │
       │                              ┌──────────────┼──────────────┐
       │                              │              │              │
       │                     ┌────────▼──┐    ┌──────▼──────┐  ┌───▼───┐
       │                     │ PostgreSQL│    │ Redis       │  │ S3/   │
       │                     │    16     │    │ (post-MVP)  │  │ MinIO │
       │                     │  Port:5432│    │ Port: 6379  │  │(post) │
       │                     └───────────┘    └─────────────┘  └───────┘
       │
       │ Future: microservices
       │  ├── training-service
       │  ├── analytics-service
       │  └── notification-service
```

## 2. Backend — Clean Architecture

### Принцип: зависимости направлены ТОЛЬКО ВНУТРЬ

```
cmd/api/main.go (composition root)
         │
         ▼
    internal/routes
         │
         ├── internal/middleware (cross-cutting)
         │
         ▼
    internal/handler (HTTP layer)
         │
         ▼
    internal/service (business logic)
         │
         ├── internal/domain (models, errors) ◄── NO dependencies
         │
         ▼
    internal/repository (interfaces)
         │
         ▼
    internal/repository/postgres (GORM impls)
         │
         ▼
    PostgreSQL
```

### Ответственность каждого слоя

#### `cmd/api/main.go` — Composition Root
- Загружает конфиг из ENV
- Создаёт все зависимости (DB, repos, services, handlers)
- Регистрирует роуты
- Graceful shutdown (SIGTERM/SIGINT)
- **Правило**: здесь живёт весь wiring. Слои ничего не создают сами.

#### `internal/config/` — Configuration
- Viper загружает `.env` + переменные окружения
- Строго типизированная struct `Config`
- Validation через struct tags
- **Правило**: ни один другой слой не читает `os.Getenv` напрямую

#### `internal/database/` — Database
- GORM connection pool с configurable параметрами
- Healthcheck ping
- AutoMigrate в dev режиме
- **Правило**: только технические детали подключения, ноль бизнес-логики

#### `internal/domain/` — Domain Layer
- Чистые Go-структуры: GORM tags, validation tags, ноль HTTP
- Кастомные ошибки: `ErrNotFound`, `ErrForbidden`, `ErrConflict`
- Enum-типы как `type Role string`
- `BaseModel` с UUID, timestamps, soft delete
- **Правило**: НОЛЬ внешних зависимостей (только stdlib + gorm.io/gorm)

#### `internal/repository/` — Data Access Layer
- Интерфейсы в `interfaces.go` — контракты для сервисов
- GORM реализации в `postgres/`
- Каждый метод принимает `context.Context`
- Возвращают domain-модели, ноль DTO
- **Правило**: SQL/GORM только здесь. Сервисы не знают о БД.

#### `internal/service/` — Business Logic
- Оркестрирует репозитории
- Бизнес-правила (расчёт PDI, Smart Training Load, RBAC проверки)
- Вызывает Notifier и AIProvider через интерфейсы
- Принимает DTO (request), возвращает domain-модели
- **Правило**: нет HTTP, нет SQL. Только бизнес.

#### `internal/handler/` — HTTP Layer
- Парсит `fiber.Ctx` → DTO
- Валидирует DTO
- Вызывает сервис
- Маппирует domain → response DTO
- Возвращает JSON с правильным HTTP кодом
- **Правило**: ноль бизнес-логики. Только HTTP.

#### `internal/dto/` — Data Transfer Objects
- Request structs с `validate` тегами
- Response structs — то, что видит клиент
- Маппинг-функции `toResponse(domain.X) XResponse`
- **Правило**: DTO не знают о репозиториях и БД

#### `internal/middleware/` — Cross-Cutting Concerns
- `auth.go` — JWT парсинг, inject user в ctx
- `rbac.go` — RequireRole, RequireClubAccess
- `logger.go` — zerolog request logging
- `recover.go` — panic recovery → 500
- `cors.go` — CORS из конфига
- `error_handler.go` — маппинг AppError → HTTP + JSON

#### `internal/ai/` — AI Provider Port
- Интерфейс `Provider` — контракт для AI
- `MockProvider` — правила-based, нет внешнего API
- Заготовки `openai.go`, `anthropic.go` для будущего подключения
- **Правило**: сервисы вызывают только интерфейс, не конкретную реализацию

#### `internal/notifier/` — Notification Port
- Интерфейс `Notifier`
- `InAppNotifier` — сохраняет в БД
- Mock email/push для демо
- **Правило**: observer pattern, service emit events, notifier реагирует

## 3. Frontend — Feature-Sliced Design (FSD)

### Почему FSD

В проекте 35+ страниц, 5 ролей, 15+ доменных сущностей.

FSD даёт жёсткие правила импортов:
```
app → pages → widgets → features → entities → shared
  Каждый слой может импортировать только НИЖЕЛЕЖАЩИЕ слои
  НЕЛЬЗЯ импортировать из соседних или верхних слоёв
```

Это предотвращает спагетти-импорты в большом проекте.

### Структура слоёв

```
src/
├── app/          # Providers, Router, Theme, Global CSS
│   ├── index.tsx
│   ├── router/
│   ├── providers/
│   └── store/        # Zustand stores (auth, ui)
│
├── pages/        # Экраны = компоновщики виджетов и фич
│   ├── auth/     # login, register
│   ├── landing/  # public landing
│   ├── coach/    # command-center, calendar, sessions...
│   ├── admin/    # club, teams, analytics
│   ├── player/   # schedule, progress, goals
│   ├── parent/   # overview, attendance, progress
│   └── shared/   # profile, notifications, dashboard
│
├── widgets/      # Крупные UI-блоки (переиспользуются на страницах)
│   ├── app-shell/       # Sidebar + Topbar + Layout
│   ├── coach-dashboard/ # Command Center widgets
│   ├── session-builder/ # Drag-n-drop конструктор
│   └── analytics/       # Chart collections
│
├── features/     # Пользовательские действия
│   ├── auth/            # login-form, register-form
│   ├── players/         # player-form, assessment-form
│   ├── sessions/        # session-form, session-builder
│   ├── exercises/       # exercise-form
│   ├── matches/         # match-form, lineup-builder
│   └── attendance/      # attendance-table
│
├── entities/     # Доменные UI-модели с базовыми компонентами
│   ├── player/          # PlayerCard, SkillRadarChart, DevIndex
│   ├── team/            # TeamCard
│   ├── session/         # SessionCard
│   └── exercise/        # ExerciseCard
│
└── shared/       # Переиспользуемый код без бизнес-логики
    ├── ui/              # shadcn/ui компоненты
    ├── api/             # axios client, API functions, query keys
    ├── lib/             # utils, custom hooks
    ├── config/          # routes, roles, env
    └── types/           # TypeScript типы (matching backend domain)
```

## 4. Auth Flow — JWT + Refresh Rotation

```
1. Client → POST /auth/login {email, password}
2. Server → verify bcrypt, issue:
   - access_token (JWT, 15min, signed HS256)
   - refresh_token (random UUID, stored as bcrypt hash in DB)
3. Server → refresh_token stored with family_id (UUID)
4. Response → {access_token, user}
   + Set-Cookie: refresh_token=... HttpOnly Secure SameSite=Lax

CLIENT STORAGE:
  - access_token: Zustand (memory only, lost on page reload → re-fetch)
  - refresh_token: httpOnly cookie (XSS-safe)
  - user: localStorage (для быстрого restore UI без запроса)

5. Access expires → 401 response
6. Axios interceptor → POST /auth/refresh (cookie sent automatically)
7. Server:
   a. Validate refresh token hash
   b. Check expiry and not used
   c. If token already used → REUSE ATTACK detected → revoke entire family
   d. Mark old token as used
   e. Generate new access + refresh (same family or new if reuse detected)
8. Client → retry original request with new access token

LOGOUT:
9. Client → POST /auth/logout
10. Server → mark refresh token as used (effectively revoked)
11. Client → clear Zustand + localStorage
```

## 5. RBAC Flow

```
Roles:
  admin   → полный доступ к клубу
  coach   → свои команды, тренировки, игроки
  player  → только свой профиль
  parent  → только связанные дети
  analyst → чтение аналитики

Backend middleware chain per request:
  AuthMiddleware → extract JWT, set ctx.Locals("user")
  RequireRole(roles...) → check user.Role ∈ roles, else 403
  RequireClubAccess → check resource.ClubID == user.ClubID

Frontend:
  <ProtectedRoute> → redirect to /login if !authenticated
  <RoleGuard roles={[]}> → hide/show UI elements
  route config → role-based allowed routes
```

## 6. Data Flow — типичный запрос

```
1. UI component → useQuery(queryKeys.sessions.byTeam(teamId))
2. TanStack Query → check cache (stale: 5min)
   - HIT: return cached data immediately
   - MISS: call API function
3. API function → axios.get('/api/v1/sessions?teamId=...')
4. Axios interceptor → attach Authorization: Bearer <access>
5. Fiber router → AuthMiddleware → RequireRole(['coach', 'admin'])
6. Handler.ListSessions(ctx) → parse query params → DTO
7. Service.ListByTeam(ctx, teamID, filters) 
   → Repository.FindByTeam(ctx, teamID, from, to, page, limit)
   → GORM → SELECT ... FROM training_sessions WHERE team_id = $1 ...
   → []domain.TrainingSession
8. Service → return []domain.TrainingSession
9. Handler → map to []SessionResponse DTO → c.JSON(PaginatedResponse)
10. TanStack Query → cache response, return to UI
11. UI → renders SessionCard list
```

## 7. Error Handling Strategy

### Backend
```go
// Domain errors (слой domain)
var ErrNotFound = errors.New("not found")
var ErrForbidden = errors.New("forbidden")

// Wrapped AppError (бизнес-контекст)
type AppError struct {
    Code    string      // "user_not_found"
    Message string      // "User with ID xxx not found"
    Details interface{} // validation details
    Err     error       // wrapped sentinel
}

// Central error handler (middleware)
// AppError → HTTP status mapping:
// ErrNotFound   → 404
// ErrForbidden  → 403
// ErrUnauthorized → 401
// ErrConflict   → 409
// ErrValidation → 422
// Other         → 500

// Response format (always):
{
  "error": {
    "code": "user_not_found",
    "message": "User with ID abc not found",
    "details": null
  }
}
```

### Frontend
```typescript
// Axios interceptor catches HTTP errors
// TanStack Query wraps in QueryError
// Components use:
//   isLoading → show Skeleton
//   isError   → show ErrorState with retry
//   data      → render content (or EmptyState if empty)
// Toast notifications via sonner for mutations
```

## 8. Performance Strategy

### Backend
- Connection pool: max_open=25, max_idle=5, max_lifetime=30min
- Pagination on all list endpoints (default limit=20, max=100)
- Analytics queries: raw SQL with aggregates (not N+1 GORM)
- Key indexes: see database schema doc
- AI responses: in-memory LRU cache (avoid re-computing same request)

### Frontend
- TanStack Query cache: staleTime=5min for reference data
- All page components lazy-loaded (code splitting)
- DataTable virtualization for lists > 100 items
- Debounced search inputs (300ms)
- Optimistic updates for attendance marking and read notifications
- Image lazy loading for player photos

## 9. Security Architecture

See `/docs/07-security.md` for full checklist.

Key points:
- Passwords: bcrypt cost=12
- Access tokens: in-memory (never localStorage)
- Refresh tokens: httpOnly cookie + hash in DB
- CORS: explicit allowed origins
- Rate limiting: 100 req/min per IP
- Input validation: all DTO validated via go-playground/validator
- SQL injection: GORM parameterized queries only
- Audit log: all mutations recorded

## 10. Scalability Path

### Phase 1: MVP (now)
Single monolith + single PostgreSQL + no cache

### Phase 2: Growth (post-MVP)
Add Redis for:
- Session caching
- Rate limiting (redis-based)
- Analytics query cache (TTL=10min)

### Phase 3: Scale
Extract modules to microservices:
- `training-service`: sessions, exercises, attendance
- `analytics-service`: read-heavy queries, pre-computed aggregates
- `notification-service`: async event processing
- `ai-service`: AI calls, caching, rate limiting

Between services: gRPC (internal) + event bus (NATS/Kafka)

### Phase 4: Enterprise
- Multi-region deployment
- Database sharding by club_id
- CDN for media assets
- Dedicated video analysis service
