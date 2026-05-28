# CoachOS — Полный контекст приложения для написания диплома

> Файл предназначен для импорта в Kimi Desktop. Содержит ВЕСЬ контекст проекта, необходимый для генерации текста выпускной квалификационной работы.
> Тема диплома: «Разработка веб-приложения для применения в организации тренерской деятельности на примере футбола»

---

## 1. Общие сведения

- **Название проекта:** CoachOS (Operating System for Football Academies)
- **Тип:** Веб-приложение (SPA + REST API)
- **Назначение:** Автоматизация управления футбольной академией: игроки, команды, тренировки, матчи, оценки, аналитика, AI-ассистент
- **Целевая аудитория:** Главные тренеры, ассистенты, спортивные директоры детско-юношеских футбольных школ, родители игроков
- **Количество ролей пользователей:** 5 (admin, coach, player, parent, analyst)
- **Количество страниц frontend:** ~35
- **Количество endpoint backend:** ~75
- **Количество таблиц БД:** 23
- **Объём backend:** ~3500 строк Go
- **Объём frontend:** ~5000 строк TypeScript/TSX
- **Срок разработки:** 12–16 недель

---

## 2. Актуальность и обоснование темы (для Введения)

### Проблематика предметной области

Типичная футбольная академия с 100–200 игроками сегодня работает в Excel, Word и Telegram-чатах. Тренер тратит 3–5 часов в неделю на административную работу вместо тренировочного процесса. Прогресс игрока нигде не фиксируется систематически — «в голове тренера». Родители не понимают, как развивается ребёнок и за что платят. Директор академии не видит работу тренеров объективно. Нагрузка планируется «на глазок», что приводит к детским травмам из-за перегрузок.

### Цифры и тренды

- Рынок спортивного ПО оценивается в $6 млрд и растёт
- В России нет специализированных решений для футбольных академий с русскоязычным UX
- Существующие зарубежные продукты (TeamSnap, SportsEngine) — горизонтальные, без глубокой вертикали для футбола
- Государственная политика цифровизации спорта (нацпроект «Культура», федеральный проект «Цифровая культура»)
- GDPR и 152-ФЗ требуют особой защиты данных детей

### Объект исследования

Организация тренерской деятельности в детско-юношеской футбольной академии.

### Предмет исследования

Разработка веб-приложения для автоматизации процессов планирования тренировок, оценки прогресса игроков, управления составами и аналитики в футбольной академии.

### Цель

Разработка информационной системы для комплексной автоматизации тренерской деятельности футбольной академии с функциями аналитики прогресса игроков и AI-ассистирования.

### Задачи (5 штук)

1. Провести анализ предметной области организации тренерской деятельности, выявить существующие проблемы и сформулировать требования к информационной системе.
2. Провести сравнительный анализ существующих программных решений и обосновать выбор инструментальных средств разработки.
3. Спроектировать архитектуру информационной системы, модель данных, REST API и систему безопасности.
4. Разработать программное обеспечение, включающее backend на языке Go, frontend на React с TypeScript, интеграцию с PostgreSQL и реализацию ключевых функциональных модулей.
5. Провести тестирование разработанного программного продукта и подготовить его к развёртыванию.

---

## 3. Предметная область: терминология и процессы

### Ключевые термины

- **Футбольная академия** — организация, осуществляющая спортивную подготовку детей и подростков по футболу
- **Player Development Index (PDI)** — нормированный индекс 0–100, отражающий комплексный прогресс игрока
- **Smart Training Load** — алгоритм расчёта еженедельной нагрузки на основе интенсивности и длительности тренировок
- **Tactical Board** — виртуальная тактическая доска для расстановки игроков
- **Coach Command Center** — главный дашборд тренера с ключевыми показателями
- **Parent Transparency Mode** — ролевой интерфейс для родителей с понятной визуализацией прогресса
- **Attendance** — журнал посещаемости тренировок
- **Assessment** — оценка игрока по 5 параметрам (technical, physical, tactical, discipline, teamwork)
- **Training Session** — тренировочное занятие, состоящее из блоков (warmup, main, game, cooldown)
- **Match Event** — событие матча (гол, ассист, карточка, замена)
- **Lineup** — состав команды на матч (starters / substitutes)
- **Age Group** — возрастная категория (U7–U21, Senior)
- **Exercise Library** — библиотека упражнений с категориями, сложностью, тегами

### Процессы, подлежащие автоматизации

1. **Управление игроками** — создание карточки, антропометрия, медицинские заметки, привязка к команде
2. **Планирование тренировок** — создание сессии, конструктор из блоков и упражнений, расчёт длительности и нагрузки
3. **Учёт посещаемости** — массовая отметка статусов по игрокам, статистика
4. **Оценка игроков** — выставление оценок по 5 параметрам, история, расчёт PDI
5. **Управление матчами** — создание матча, состав, события, статистика
6. **Аналитика** — графики посещаемости, прогресса, нагрузки, предупреждения
7. **AI-ассистирование** — генерация планов тренировок, рекомендации упражнений, анализ игрока
8. **Уведомления** — in-app уведомления об изменениях расписания, оценках, результатах
9. **Отчётность** — отчёты по игроку и команде

### Сравнительный анализ аналогов

| Продукт | Страна | Сильные стороны | Слабые стороны | Почему не подходит |
|---|---|---|---|---|
| Excel / Google Sheets | — | Знакомо, бесплатно | Хаос версий, нет аналитики, нет ролей, нет автоматизации | Требует ручного труда, не масштабируется |
| TeamSnap | США | Расписание, уведомления, мобильное приложение | Нет аналитики прогресса, нет тренировочного конструктора, нет AI | Нет глубокой вертикали для футбола |
| SportsEngine | США | Регистрация, платежи, широкий охват видов спорта | Нет тренировочного инструмента, нет оценки игроков | Горизонтальное решение, не для тренеров |
| Hudl | США | Видеоанализ, профессиональный уровень | Только видео, высокая стоимость, сложность | Другой сегмент — профессионалы |
| Bitrix24 / AmoCRM | РФ | CRM, управление клиентами | Не для спорта, сложная кастомизация | Нет доменной модели футбола |
| **CoachOS (разраб.)** | РФ | Полная вертикаль футбола, PDI, Smart Load, AI, русский UX, ролевые интерфейсы | MVP-стадия, нет мобильного приложения | — |

### Уникальность разрабатываемого продукта

1. **Player Development Index** — формула 0–100, учитывающая посещаемость (20%), оценки тренера (50%), достижение целей (30%). Отсутствует у конкурентов.
2. **Smart Training Load** — алгоритм расчёта нагрузки с предупреждением о перегрузке. Защищает детей от травм.
3. **AI Coach Assistant** — генерация тренировок по цели, рекомендации под слабые стороны игрока (Weakness-to-Drill Engine).
4. **Parent Transparency Mode** — понятный нарративный интерфейс для родителей вместо сухих таблиц.
5. **Ролевая модель 5 ролей** — каждая роль видит только свой функционал.

---

## 4. Выбор и обоснование инструментальных средств

### Критерии отбора

1. Производительность при высокой нагрузке
2. Типобезопасность и надёжность
3. Экосистема и наличие библиотек
4. Скорость разработки MVP
5. Возможность развёртывания в контейнерах
6. Поддержка современных паттернов проектирования

### Backend

| Компонент | Выбрано | Альтернативы | Обоснование выбора |
|---|---|---|---|
| Язык | Go 1.22 | Python, Node.js, Java, C# | Компилируемый, статически типизированный, встроенная конкурентность (goroutines), высокая производительность REST API, маленький бинарный файл (~15MB), быстрый старт контейнера |
| HTTP-фреймворк | Fiber v2 | Gin, Echo, stdlib net/http | Высокая производительность (fasthttp), синтаксис вдохновлён Express.js, хорошая документация, встроенные middleware |
| ORM | GORM | sqlc, Ent, raw SQL | Быстрая разработка на 23 таблицах, авто-миграции, поддержка PostgreSQL-специфичных типов (ENUM, JSONB), хуки |
| База данных | PostgreSQL 16 | MySQL, MongoDB, SQLite | Реляционная модель с Foreign Keys для целостности, ACID-транзакции, JSONB для гибких метаданных, ENUM типы, сложные аналитические запросы (JOIN, GROUP BY) |
| Миграции | golang-migrate | GORM AutoMigrate | Версионирование схемы, откат изменений, совместимость с CI/CD |
| Аутентификация | JWT (HS256) + Refresh Token | OAuth2, Session Cookies | Stateless, масштабируемый, rotation с family-based reuse detection |
| Валидация | go-playground/validator | ручная | Struct tags, 20+ встроенных правил, кастомные валидаторы |
| Логирование | Uber Zap | logrus, stdlib | Структурированный JSON-логи, высокая производительность |
| Конфигурация | Viper | envconfig, ручная | Поддержка .env, ENV, JSON, YAML, автоматический unmarshal в struct |

### Frontend

| Компонент | Выбрано | Альтернативы | Обоснование выбора |
|---|---|---|---|
| Framework | React 18 | Vue, Angular, Svelte | Лидирующая библиотека, огромная экосистема, TypeScript-first |
| Язык | TypeScript 5 | JavaScript | Строгая типизация для 15+ сущностей и 5 ролей, автодополнение, рефакторинг |
| Сборщик | Vite | Webpack, CRA | HMR <50ms, быстрая сборка, ESM-native, современная конфигурация |
| Стили | Tailwind CSS | CSS Modules, Styled Components, MUI | Utility-first, малый размер бандла, консистентность дизайна, быстрая разработка |
| UI-компоненты | shadcn/ui + Radix UI | MUI, Ant Design, Chakra | Headless accessible компоненты, полный контроль над стилизацией, независимость от дизайн-системы |
| Server State | TanStack Query (React Query) | SWR, Redux Toolkit + RTK Query | Кэширование, инвалидация, фоновые обновления, оптимистичные обновления, отслеживание состояний загрузки |
| Client State | Zustand | Redux, MobX, Context API | Минимальный API, без boilerplate, TypeScript-friendly, подходит для небольшого клиентского состояния (auth, UI) |
| Формы | React Hook Form | Formik, ручная | Производительность (не перерисовывает всю форму), интеграция с Zod |
| Валидация форм | Zod | Yup, Joi | TypeScript-first schema validation, вывод типов из схемы, интеграция с React Hook Form |
| Графики | Recharts | Chart.js, D3 | React-native компоненты, простой API, адаптивность |
| Календарь | FullCalendar | react-big-calendar, ручной | Month/Week/Day views, drag-n-drop, события |
| Drag-n-drop | @dnd-kit/core | react-beautiful-dnd, HTML5 DnD | Современный API, PointerSensor, хорошая работа в React 18, DragOverlay |
| i18n | react-i18next | Lingui, FormatJS | Поддержка RU/EN, lazy loading переводов |
| Иконки | lucide-react | react-icons, heroicons | Единый стиль, Tree-shakeable |
| Шрифты | Inter + JetBrains Mono | системные | Inter для UI, JetBrains Mono для цифр и статистики |

### Инфраструктура

| Компонент | Выбрано | Обоснование |
|---|---|---|
| Контейнеризация | Docker + Docker Compose | Единая среда разработки, простое развёртывание, изоляция зависимостей |
| Reverse Proxy | Caddy | Авто-TLS (Let's Encrypt), простая конфигурация |
| CI/CD | GitHub Actions | Бесплатный tier, интеграция с репозиторием, автоматический запуск тестов |
| Среда разработки | VS Code + Go extension + ESLint + Prettier | Стандарт индустрии, автоформатирование, линтинг |

### Архитектурные паттерны

- **Backend:** Clean Architecture (handler → service → repository → domain). Зависимости направлены строго внутрь. Domain слой не имеет внешних зависимостей.
- **Frontend:** Feature-Sliced Design (FSD). Слои: app → pages → widgets → features → entities → shared. Запрещены импорты из соседних или верхних слоёв.

---

## 5. Архитектура системы

### 5.1 Общая системная архитектура

```
┌─────────────────────────────────────────────────────────────┐
│                      Пользователь (Browser)                   │
│                     React 18 SPA (Vite)                       │
└───────────────────────────┬─────────────────────────────────┘
                            │ HTTPS
┌───────────────────────────▼─────────────────────────────────┐
│                 Reverse Proxy (Caddy/Nginx)                  │
│                     TLS termination                          │
└───────────────┬───────────────────────────────┬─────────────┘
                │ /api/v1/*                     │ / (static)
┌───────────────▼─────────────┐   ┌─────────────▼─────────────┐
│      Go Fiber API           │   │   Static files / CDN      │
│      (monolith)             │   │   (frontend build)        │
│      Port: 8080             │   │                           │
└───────────────┬─────────────┘   └───────────────────────────┘
                │
    ┌───────────┼───────────┐
    ▼           ▼           ▼
┌────────┐ ┌────────┐ ┌─────────────┐
│PostgreSQL│ │ Redis  │ │  S3/MinIO   │
│  Port:   │ │(post-  │ │  (post-MVP) │
│  5432    │ │MVP)    │ │             │
└────────┘ └────────┘ └─────────────┘
```

### 5.2 Backend: Clean Architecture

```
cmd/api/main.go (composition root)
         │
         ▼
    internal/routes
         │
         ├── internal/middleware (auth, rbac, cors, logger, recover, error_handler)
         │
         ▼
    internal/handler (HTTP layer)
         │  Парсит fiber.Ctx → DTO, валидирует, вызывает сервис, маппит в response
         ▼
    internal/service (business logic)
         │  Оркестрирует репозитории, содержит бизнес-правила (PDI, Smart Load, RBAC)
         ├── internal/domain (models, errors) ◄── НОЛЬ внешних зависимостей
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

**Правила слоёв:**
- `domain`: чистые Go-структуры, GORM tags, кастомные ошибки (ErrNotFound, ErrForbidden, ErrConflict), enum-типы. Ноль зависимостей.
- `repository`: интерфейсы в `interfaces.go`, GORM реализации в `postgres/`. Каждый метод принимает `context.Context`. Возвращают domain-модели.
- `service`: бизнес-логика. Нет HTTP, нет SQL. Вызывает AIProvider и Notifier через интерфейсы.
- `handler`: только HTTP. Парсит запрос, валидирует DTO, вызывает сервис, возвращает JSON.
- `dto`: Request/Response structs с `validate` тегами. Маппинг-функции `toResponse(domain.X) XResponse`.
- `middleware`: cross-cutting concerns (auth, rbac, logger, recover, cors, error_handler).
- `config`: Viper загружает `.env`. Строго типизированная struct `Config`.

### 5.3 Frontend: Feature-Sliced Design (FSD)

```
src/
├── app/          # Providers, Router, Theme, Global CSS, Zustand stores
│   ├── router/
│   ├── providers/
│   └── store/        # auth store, ui store
│
├── pages/        # Экраны = компоновщики виджетов и фич
│   ├── auth/     # login, register
│   ├── coach/    # command-center, calendar, sessions, exercises, matches, assessments, ai
│   ├── admin/    # club, teams, coaches, analytics
│   ├── player/   # schedule, progress, goals
│   └── parent/   # overview, attendance, progress
│
├── widgets/      # Крупные UI-блоки
│   ├── app-shell/       # Sidebar + Topbar + Layout
│   ├── coach-dashboard/ # Command Center виджеты
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
├── entities/     # Доменные UI-модели
│   ├── player/          # PlayerCard, SkillRadarChart, DevIndex
│   ├── team/            # TeamCard
│   ├── session/         # SessionCard
│   └── exercise/        # ExerciseCard
│
└── shared/       # Переиспользуемый код без бизнес-логики
    ├── ui/              # shadcn/ui компоненты (Button, Dialog, Table, Form, etc.)
    ├── api/             # axios client, API functions, query keys, normalizeIds interceptor
    ├── lib/             # utils, custom hooks
    ├── config/          # routes, roles, env variables
    └── types/           # TypeScript типы (matching backend domain)
```

**Правило импортов:** каждый слой может импортировать только НИЖЕЛЕЖАЩИЕ слои. НЕЛЬЗЯ импортировать из соседних или верхних слоёв.

### 5.4 Поток данных (типичный запрос)

```
1. UI component → useQuery(queryKeys.sessions.byTeam(teamId))
2. TanStack Query → проверяет кэш (staleTime: 5min)
   - HIT: возвращает кэшированные данные
   - MISS: вызывает API функцию
3. API function → axios.get('/api/v1/sessions?teamId=...')
4. Axios interceptor → attach Authorization: Bearer <access>
                    → normalizeIds interceptor (ID → id)
5. Fiber router → AuthMiddleware → RequireRole(['coach', 'admin'])
6. Handler.ListSessions(ctx) → parse query params → DTO
7. Service.ListByTeam(ctx, teamID, filters)
   → Repository.FindByTeam(ctx, teamID, from, to, page, limit)
   → GORM → SELECT ... FROM training_sessions WHERE team_id = $1 ...
   → []domain.TrainingSession
8. Service → return []domain.TrainingSession
9. Handler → map to []SessionResponse DTO → c.JSON(PaginatedResponse)
10. TanStack Query → кэширует ответ, возвращает в UI
11. UI → рендерит SessionCard list
```

---

## 6. Модель данных

### 6.1 Принципы проектирования БД

- **Идентификаторы:** UUID v4 (application-generated) — не раскрывают порядок записей, безопасны для публичных API
- **Soft Delete:** `deleted_at TIMESTAMPTZ NULL` на критичных сущностях (GORM soft delete)
- **Timestamps:** `created_at`, `updated_at` на всех таблицах
- **ENUMs:** реализованы как PostgreSQL `TYPE` для целостности данных
- **JSON fields:** `JSONB` для гибких метаданных (settings, AI-ответы, params)
- **Индексы:** по всем внешним ключам, полям фильтрации и сортировки

### 6.2 ER-диаграмма (текстовая)

```
clubs
  ├── users (1:N)
  │    ├── coach_profiles (1:1)
  │    └── parents (1:1 через user_id)
  ├── teams (1:N)
  │    ├── team_members (игроки в команде, composite PK: team_id + player_id)
  │    ├── training_sessions (1:N)
  │    │    ├── training_blocks (1:N)
  │    │    │    └── session_exercises (1:N)
  │    │    └── attendance_records (1:N)
  │    └── matches (1:N)
  │         ├── match_lineups (composite PK: match_id + player_id)
  │         └── match_events (1:N)
  └── players (1:N)
       ├── player_assessments (1:N)
       ├── player_goals (1:N)
       └── player_parents (связь M:N с parents)

refresh_tokens → users (N:1)
exercises → clubs (N:1), users (created_by)
notifications → users (N:1)
reports → clubs (N:1), users (generated_by)
ai_recommendations → users (created_by)
audit_logs (независимая)
```

### 6.3 Полный список таблиц

**ENUM типы:**
- `user_role`: admin, coach, player, parent, analyst
- `age_group`: U7, U8, U9, U10, U11, U12, U13, U14, U15, U16, U17, U18, U19, U21, Senior
- `player_position`: goalkeeper, defender, midfielder, forward, universal
- `dominant_foot`: left, right, both
- `session_status`: planned, in_progress, completed, cancelled
- `session_intensity`: low, medium, high
- `block_kind`: warmup, main, game, cooldown
- `exercise_category`: technique, tactics, physical, coordination, goalkeeping, warmup, cooldown
- `attendance_status`: present, absent, late, excused, injured
- `match_status`: scheduled, in_progress, completed, cancelled, postponed
- `match_event_type`: goal, assist, yellow_card, red_card, sub_in, sub_out
- `lineup_role`: starter, substitute
- `goal_status`: active, achieved, paused, cancelled
- `notification_type`: session_created, session_updated, session_cancelled, attendance_marked, assessment_added, match_scheduled, match_result, report_ready, general
- `report_type`: player, team, attendance, progress
- `ai_target_type`: player, team, session
- `license_level`: none, grassroots, c, b, a, pro
- `relation_type`: mother, father, guardian, other

**Таблицы (23 штуки):**

| Таблица | Назначение | Ключевые поля | Связи |
|---|---|---|---|
| clubs | Клуб/академия — корневая сущность | id, name, country, city, logo_url, founded_at, settings(JSONB) | has many users, teams, players |
| users | Базовая учётная запись | id, email, password_hash, role, club_id, first_name, last_name, phone, avatar_url, is_active, last_login_at | belongs to club |
| refresh_tokens | Хранение хешей refresh-токенов | id, user_id, family_id, token_hash, expires_at, used_at, ip, user_agent | belongs to user |
| coach_profiles | Профиль тренера | id, user_id, license_level, specialization, bio | belongs to user (1:1) |
| teams | Команда в клубе | id, club_id, name, age_group, season, head_coach_id | belongs to club, has many players via team_members |
| players | Игрок — центральная сущность | id, user_id, club_id, first_name, last_name, birth_date, height_cm, weight_kg, dominant_foot, position, medical_notes, photo_url, dev_index | belongs to club, has many assessments, goals, medical records |
| team_members | Связь игрока с командой | team_id, player_id, joined_at, jersey_number, position, is_captain | composite PK |
| parents | Родитель | id, user_id, full_name, phone, email, relation | belongs to user |
| player_parents | Связь игрока и родителя | player_id, parent_id | composite PK |
| exercises | Упражнение в библиотеке | id, club_id, name, category, difficulty(1-5), duration_min, players_min, players_max, equipment[], description, diagram_url, tags[], created_by, is_global | belongs to club |
| training_sessions | Тренировочная сессия | id, team_id, coach_id, scheduled_at, duration_min, location, status, intensity, focus[], notes | belongs to team, has many blocks, attendance |
| training_blocks | Блок тренировки | id, session_id, kind, order_index, duration_min, notes | belongs to session, has many exercises |
| session_exercises | Упражнение в блоке | id, block_id, exercise_id, order_index, duration_min, sets, reps, intensity_override | belongs to block |
| attendance_records | Посещаемость | id, session_id, player_id, status, reason, marked_by, marked_at | unique(session_id, player_id) |
| player_assessments | Оценка игрока | id, player_id, coach_id, assessed_at, technical(1-10), physical(1-10), tactical(1-10), discipline(1-10), teamwork(1-10), notes | belongs to player |
| player_goals | Цели игрока | id, player_id, title, description, target_metric, target_value, deadline, status, progress_pct | belongs to player |
| matches | Матч | id, team_id, opponent, kickoff_at, location, is_home, status, goals_for, goals_against, notes | belongs to team |
| match_lineups | Состав матча | match_id, player_id, role, position, minutes_played | composite PK |
| match_events | События матча | id, match_id, player_id, minute, type, notes | belongs to match |
| notifications | In-app уведомления | id, user_id, type, title, body, payload(JSONB), read_at | belongs to user |
| reports | Отчёты | id, club_id, type, scope_id, generated_by, params(JSONB), snapshot(JSONB) | belongs to club |
| ai_recommendations | AI-рекомендации | id, target_type, target_id, prompt(JSONB), response(JSONB), created_by | belongs to user |
| audit_logs | Аудит изменений | id, actor_id, action, entity_type, entity_id, before(JSONB), after(JSONB), ip, user_agent | — |

### 6.4 Формулы и алгоритмы

**Player Development Index (PDI):**
```
attendance_rate = COUNT(present) / COUNT(total_sessions) * 100
avg_assessment = AVG(technical + physical + tactical + discipline + teamwork) / 5
goals_achieved_rate = COUNT(achieved_goals) / COUNT(total_goals) * 100

PDI = (attendance_rate * 0.20) + (avg_assessment * 10 * 0.50) + (goals_achieved_rate * 0.30)
Нормировано в диапазоне 0–100

Интерпретация:
0–39:  Требует внимания (красный)
40–69: Развивается (жёлтый)
70–100: Отличный прогресс (зелёный)
```

**Smart Training Load:**
```
load_score = SUM(duration_min * intensity_multiplier)
intensity_multiplier: low=0.6, medium=1.0, high=1.5

Пороги:
< 300: Нормальная нагрузка
300–450: Высокая нагрузка (предупреждение)
> 450: Перегрузка (критическое предупреждение)
```

### 6.5 Ключевые индексы БД

- `idx_users_email` — быстрый поиск по email при логине
- `idx_users_club_id_role` — фильтрация пользователей клуба по роли
- `idx_refresh_tokens_token_hash` — проверка refresh токена
- `idx_players_club_id` — список игроков клуба
- `idx_team_members_team_id` — состав команды
- `idx_sessions_team_id_scheduled` — календарь команды
- `idx_attendance_session_id` + `idx_attendance_player_id` — журнал посещаемости
- `idx_assessments_player_id_date` — история оценок игрока
- `idx_exercises_tags` (GIN) — полнотекстовый поиск по тегам
- `idx_notifications_user_unread` (partial index, WHERE read_at IS NULL) — счётчик непрочитанных
- `idx_audit_created_at` (BRIN) — эффективные временные запросы аудита

---

## 7. REST API Спецификация

### Базовый URL: `/api/v1`

### Auth Endpoints
- `POST /auth/register` — Регистрация (email, password, firstName, lastName, role, clubID). Ответ: accessToken + user + Set-Cookie refresh_token
- `POST /auth/login` — Вход. Ответ аналогичен register
- `POST /auth/refresh` — Обновление access token по refresh cookie
- `POST /auth/logout` — Выход (revoke refresh token, Clear-Cookie)
- `GET /auth/me` — Текущий пользователь

### Players Endpoints
- `GET /players` — Список (пагинация, фильтры: clubID, position, page, limit)
- `POST /players` — Создание
- `GET /players/:id` — Профиль
- `PATCH /players/:id` — Частичное обновление
- `DELETE /players/:id` — Удаление (admin only)
- `GET /players/:id/profile` — Полный профиль + PDI + attendanceRate + teamMemberships
- `GET /players/:id/progress` — История оценок, devIndexHistory, goalsProgress
- `GET /players/:id/dev-index` — `{devIndex, breakdown: {attendance, assessment, goals}, trend}`
- `GET /players/:id/attendance` — История посещаемости

### Teams Endpoints
- `GET /teams` — Список (фильтр: clubID)
- `POST /teams` — Создание
- `GET /teams/:id` — Детали с количеством игроков
- `GET /teams/:id/dashboard` — Статистика: playerCount, avgAttendance, avgDevIndex, upcomingSessions, recentMatches
- `POST /teams/:id/members` — Добавить игрока в команду
- `DELETE /teams/:id/members/:playerID` — Удалить из команды

### Training Sessions Endpoints
- `GET /sessions` — Список (фильтры: teamID, from, to, status, page, limit)
- `POST /sessions` — Создание
- `GET /sessions/:id` — Детали с блоками и упражнениями
- `POST /sessions/:id/blocks` — Добавить блок
- `POST /sessions/:id/blocks/:blockID/exercises` — Добавить упражнение в блок
- `PATCH /sessions/:id/attendance` — Массовая отметка посещаемости
- `POST /sessions/:id/complete` — Завершить сессию (отправляет уведомления)

### Exercises Endpoints
- `GET /exercises` — Библиотека (фильтры: category, difficulty, tags, search, global)
- `POST /exercises` — Создание упражнения

### Assessments Endpoints
- `POST /assessments` — Создать оценку (5 параметров: 1–10)
- `GET /players/:id/assessments` — История оценок
- `GET /teams/:id/assessments-summary` — Средние показатели по команде

### Matches Endpoints
- `GET /matches` — Список (фильтры: teamID, status)
- `POST /matches` — Создание
- `PUT /matches/:id/lineup` — Установить состав
- `POST /matches/:id/events` — Добавить событие
- `GET /matches/:id/summary` — Полная сводка: матч + состав + события + статистика по игрокам

### Analytics Endpoints
- `GET /analytics/coach-dashboard` — Command Center: todaysSessions, absentToday, playersAtRisk, upcomingSessions, teamStats
- `GET /analytics/team/:id` — Командная аналитика: attendanceByWeek, avgAssessments, trainingLoad, topPlayers
- `GET /analytics/player/:id` — Индивидуальная аналитика
- `GET /analytics/training-load` — Нагрузка по неделям с предупреждениями

### AI Assistant Endpoints
- `POST /ai/training-plan` — Генерация плана тренировки по цели
- `POST /ai/recommend-exercises` — Рекомендации упражнений под слабый навык
- `POST /ai/analyze-player` — Анализ сильных/слабых сторон
- `POST /ai/summarize-progress` — Резюме прогресса на человеческом языке

### Notifications Endpoints
- `GET /notifications` — Список (фильтр: unreadOnly)
- `PATCH /notifications/:id/read` — Отметить прочитанным
- `PATCH /notifications/read-all` — Отметить все прочитанными

---

## 8. Аутентификация и авторизация

### 8.1 JWT + Refresh Token Rotation

```
1. Client → POST /auth/login {email, password}
2. Server → verify bcrypt(cost=12), issue:
   - access_token (JWT HS256, 15min)
     Claims: userID, email, role, clubID, exp, iat, jti
   - refresh_token (random UUID, 7 дней)
3. Server → refresh_token stored as bcrypt hash in DB with family_id (UUID)
4. Response → {access_token, user}
   + Set-Cookie: refresh_token=... HttpOnly Secure SameSite=Lax

CLIENT STORAGE:
  - access_token: Zustand (memory only, lost on reload)
  - refresh_token: httpOnly cookie (XSS-safe)
  - user: localStorage (для быстрого restore UI)

5. Access expires → 401 response
6. Axios interceptor → POST /auth/refresh (cookie sent automatically)
7. Server:
   a. Validate refresh token hash
   b. Check expiry and not used
   c. If token already used → REUSE ATTACK detected → revoke entire family
   d. Mark old token as used
   e. Generate new access + refresh
8. Client → retry original request

LOGOUT:
9. Client → POST /auth/logout
10. Server → mark refresh token as used (revoked)
11. Client → clear Zustand + localStorage
```

### 8.2 RBAC матрица

| Операция | admin | coach | player | parent | analyst |
|---|---|:---:|:---:|:---:|:---:|
| Создать клуб | ✓ | | | | |
| Управлять командами | ✓ | ✓ | | | |
| Создать тренировку | ✓ | ✓ | | | |
| Оценить игрока | | ✓ | | | |
| Смотреть свой профиль | ✓ | ✓ | ✓ | | |
| Смотреть профиль ребёнка | | | | ✓ | |
| Аналитика клуба | ✓ | ✓ | | | ✓ |
| Удалить данные | ✓ | | | | |

**Middleware chain:** AuthMiddleware → RequireRole(roles...) → RequireClubAccess

**Frontend:** `<ProtectedRoute>` для аутентификации, `<RoleGuard>` для скрытия UI-элементов.

---

## 9. Функциональные модули (детальное описание)

### 9.1 Управление игроками
- Карточка игрока: ФИО, дата рождения, позиция, амплуа, рост, вес, ведущая нога, фото
- Привязка к команде через team_members (составной PK)
- Медицинские заметки (видны только coach/admin)
- Пагинация с лимитом (дефолт 20, для крупных списков — 100)

### 9.2 Матчи и составы (Match & Lineup Builder)
- Создание матчей: дата, соперник, дом/в гостях, счёт, статус
- Управление составом: starters / substitutes, позиции, минуты на поле
- События матча: голы, ассисты, жёлтые/красные карточки, замены с минутами
- Match Summary: агрегированная статистика по каждому игроку

### 9.3 Тренировки и посещаемость
- Расписание тренировок по командам (FullCalendar: month/week/day views)
- Конструктор тренировки: блоки (warmup, main, game, cooldown) + упражнения из библиотеки
- Автоподсчёт общей длительности
- Журнал посещаемости: присутствовал / опоздал / отсутствовал / травмирован / освобождён
- Массовая отметка attendance через PATCH /sessions/:id/attendance

### 9.4 Оценки и PDI
- 5 оценок за тренировку/период: technical, physical, tactical, discipline, teamwork (1–10)
- История оценок с датами
- Автоматический пересчёт PDI после каждой оценки
- Team Assessments Summary — средние показатели по команде

### 9.5 Медицинские записи
- Травмы, болезни, реабилитация
- Даты начала/окончания (nullable для ongoing случаев)
- Статус: active / recovered
- Видны только coach и admin (RBAC)

### 9.6 Аналитика и дашборд
- **Coach Command Center** (главная страница тренера):
  - StatCards: тренировок сегодня, игроков присутствует, перегруженных игроков, новых уведомлений
  - TodaysSessions — список сессий на сегодня
  - AbsentToday — отсутствующие с причинами
  - PlayersAtRisk — таблица с badge-сигналами (низкая посещаемость, падение PDI)
  - UpcomingSessions — ближайшие 7 дней
- **Player Profile Analytics:**
  - DevIndex LineChart (последние 6 месяцев)
  - Skill RadarChart (5 параметров) + сравнение с предыдущей оценкой
  - Attendance heatmap (monthly calendar)
- **Team Analytics:** attendanceByWeek, avgAssessments, trainingLoad, topPlayers
- **Training Load Chart:** AreaChart с пороговыми линиями 300 и 450

### 9.7 AI Coach Assistant
- **Архитектура:** интерфейс `AIProvider` для подключения любой реализации
```go
type AIProvider interface {
    GenerateTrainingPlan(goal string, durationMin int, focusAreas []string) (*TrainingPlan, error)
    RecommendExercises(weakSkill string, playerID uuid.UUID) ([]ExerciseRecommendation, error)
    AnalyzePlayer(assessments []Assessment, attendance []Attendance) (*PlayerAnalysis, error)
    SummarizeProgress(playerID uuid.UUID, periodDays int) (*ProgressSummary, error)
}
```
- **MVP реализация:** `MockProvider` — правила-based логика без внешнего API
  - Если цель «улучшить прессинг» → план с упражнениями категории tactics + physical
  - Если у игрока technical < 5 → рекомендуются упражнения категории technique
- **Будущее:** OpenAIProvider / AnthropicProvider — реализация того же интерфейса

### 9.8 Уведомления (In-App)
- Типы: session_created, session_updated, session_cancelled, attendance_marked, assessment_added, match_scheduled, match_result, report_ready, general
- Bell icon с badge unread count
- Mark read / mark all read
- Оптимистичные обновления UI

---

## 10. UI/UX Архитектура

### 10.1 Design System

**Color Palette:**
- Primary: #10B981 (emerald-500) — Football Green
- Primary Dark: #059669 (emerald-600)
- Accent: #F97316 (orange-500) — Energy Orange
- Background: #F8FAFC (slate-50)
- Foreground: #0F172A (slate-900)
- Card: #FFFFFF
- Border: #E2E8F0 (slate-200)
- Success: #10B981, Warning: #F59E0B, Error: #EF4444, Info: #3B82F6

**Typography:**
- UI Font: Inter (Google Fonts)
- Metric Font: JetBrains Mono (числа, статистика)
- Scale: 12/14/16/20/24/30/36/48px

**PDI Color Coding:**
- 0–39: red (требует внимания)
- 40–69: yellow (развивается)
- 70–100: green (отличный прогресс)

### 10.2 Layout

**AppShell (Desktop):**
- Topbar: Logo | PageTitle | Notifications Bell | UserMenu
- Sidebar (240px): навигация роле-специфичная
- Main Content: flex-1

**Mobile (< 768px):**
- Sidebar скрыт, открывается как Sheet drawer
- Bottom navigation bar с 4–5 пунктами

**Breakpoints:** sm 640px, md 768px, lg 1024px, xl 1280px

### 10.3 Навигация по ролям

**Coach:** Command Center, My Teams, Calendar, Exercises, Attendance, Assessments, Matches, Analytics, AI Assistant
**Admin:** Dashboard, Club Overview, Teams, Players, Coaches, Analytics
**Player:** My Schedule, My Progress, My Goals, My Reports
**Parent:** Child Overview, Schedule, Attendance, Progress

### 10.4 Ключевые компоненты

- **StatCard:** title, value, description, icon, trend, loading, variant
- **SkillRadarChart:** 5 параметров, опциональное сравнение с предыдущей оценкой
- **PlayerDevIndex:** Circular progress с цветовым кодированием и trend badge
- **AttendanceTable:** inline status toggle per player, bulk save
- **EmptyState:** icon, title, description, action

---

## 11. Безопасность

### 11.1 Аутентификация
- Пароли: bcrypt cost=12
- Access token: JWT HS256, 15min, хранится в памяти (Zustand), НЕ в localStorage
- Refresh token: httpOnly cookie (Secure + SameSite=Lax), bcrypt hash в БД
- Rotation: каждое обновление выдаёт новый токен
- Family-based reuse detection: повторное использование → ревок всей семьи

### 11.2 Авторизация
- 5 ролей с middleware `RequireRole`
- Club-based scoping: пользователь видит данные только своего клуба
- Player scoping: тренер оценивает только игроков своих команд

### 11.3 Transport & Input
- HTTPS обязателен в production
- CORS: explicit whitelist origins
- Rate limiting: 100 req/min per IP (Fiber)
- Все DTO валидируются через go-playground/validator
- SQL injection: GORM parameterized queries
- XSS: access token не в localStorage, Fiber возвращает JSON (не HTML)

### 11.4 Audit & GDPR
- `audit_logs` таблица: actor, action, entity, before/after, ip, user_agent
- Soft delete (deleted_at) на критичных сущностях
- Медицинские заметки видны только coach/admin
- player_parents связь — родитель видит только своего ребёнка

---

## 12. Тестирование

### 12.1 Backend

**Инструменты:** `testing`, `testify`, `httptest`, `testcontainers-go`

**Unit Tests (Services):**
- AuthService: регистрация, логин, reuse detection
- PlayerService: PDI расчёт (perfect=100, zero=0, average=формула)
- SessionService: Smart Training Load (low=0.6, medium=1.0, high=1.5)
- AssessmentService: пересчёт PDI после создания оценки

**Integration Tests (Repository):**
- testcontainers-go → реальная PostgreSQL
- UserRepository: Create, FindByEmail, NotFound

**Handler Tests:**
- AuthHandler: Login Success (200 + Set-Cookie), Wrong Password (401)

**RBAC Tests:**
- Coach может видеть команды (200)
- Player не может создавать сессии (403)
- Parent не видит чужих детей (403)

**Target Coverage:** service/ 70%+, handler/ 60%+, middleware/ 80%+, domain/ 90%+

### 12.2 Frontend

**Инструменты:** vitest, @testing-library/react, @testing-library/jest-dom, @testing-library/user-event, msw (Mock Service Worker), Playwright

**Component Tests:**
- LoginForm: валидация пустых полей, успешный логин
- StatCard: отображение значения и тренда, skeleton при loading
- RoleGuard: рендер для разрешённой роли, fallback для запрещённой

**E2E (Playwright):**
- Coach login → Command Center
- Player cannot access coach routes (редирект)
- Coach создаёт сессию → добавляет блоки → отмечает attendance → завершает

---

## 13. Особенности реализации и решённые проблемы

### 13.1 Нормализация ID
Backend генерировал поля в camelCase (`teamId`), но некоторые DTO возвращали `ID` в верхнем регистре. Решение: глобальный `normalizeIds` interceptor в API-клиенте, который рекурсивно заменяет `ID` → `id` во всех ответах.

### 13.2 Drag-and-drop на тактической доске
Проблема: нативный HTML5 DnD ненадёжен в React 18 (race condition setState, dataTransfer очищается). Решение: переход на `@dnd-kit/core` с `PointerSensor`, `pointerWithin` collision detection и `DragOverlay`.

### 13.3 Nullable даты в медицинских записях
Проблема: PostgreSQL тип `date` не принимает пустую строку `''` для ongoing травм. Решение: `StartDate`/`EndDate` изменены с `string` на `*string` (pointer), что позволяет передавать `NULL` в БД.

### 13.4 Пагинация по умолчанию
Backend возвращает 20 записей по умолчанию. Для страниц с полным списком игроков frontend явно передаёт `limit: 100`.

### 13.5 Сидирование данных
Для демонстрации создан богатый seeder: три команды (U15/U17/Senior), 15+ игроков, аккаунты для всех ролей, русскоязычные упражнения, тренировки с посещаемостью, оценки, матчи с составами и событиями, уведомления.

---

## 14. Деплоймент и CI/CD

### Docker Compose стек
- PostgreSQL 16 (порт 5432)
- Backend Go (порт 8080)
- Frontend Vite dev server (порт 5173)
- Caddy reverse proxy (порты 80/443)

### Команды
```bash
make dev          # Запуск dev-окружения
make migrate-up   # Применить миграции
make seed         # Заполнить демо-данными
make test         # Запуск тестов
make lint         # Линтеры
make db-reset     # Пересоздать БД
```

### GitHub Actions CI
- Backend: checkout → setup-go 1.22 → тесты с PostgreSQL сервисом → сборка
- Frontend: checkout → setup-node 20 → npm ci → тесты → сборка

### Деплойментные цели
- VPS: Ubuntu 22.04, 2 vCPU, 2GB RAM, Caddy auto-TLS
- Railway: бесплатный tier, CI/CD из коробки
- Fly.io: альтернатива VPS

---

## 15. Масштабируемость (дорожная карта)

**Phase 1: MVP (сейчас)**
- Единый Go monolith + PostgreSQL
- Горизонтальное масштабирование monolith за load balancer

**Phase 2: Growth**
- Redis: session caching, rate limiting, analytics query cache (TTL=10min)
- Read replicas PostgreSQL для аналитики

**Phase 3: Scale**
- Микросервисы: training-service, analytics-service, notification-service, ai-service
- gRPC (internal) + event bus (NATS/Kafka)
- Clean Architecture гарантирует: выделение в микросервис = замена одного слоя repository

**Phase 4: Enterprise**
- Multi-region deployment
- Database sharding by club_id
- CDN для медиа
- Dedicated video analysis service

---

## 16. Демо-аккаунты (для тестирования)

| Роль | Email | Пароль |
|---|---|---|
| Admin | admin@coachos.dev | Admin123! |
| Coach | coach1@coachos.dev | Coach123! |
| Coach | coach2@coachos.dev | Coach123! |
| Player | player1@coachos.dev | Player123! |
| Parent | parent1@coachos.dev | Parent123! |

После `make seed`: три команды (U15/U17/Senior), 15 игроков, player1 привязан к Ивану Козлову, parent1 — родитель этого игрока.

---

## 17. Готовые фразы для диплома

### Почему Go?
Компилируемый, статически типизированный язык с встроенной поддержкой конкурентности (goroutines). Обеспечивает высокую производительность REST API, строгую типизацию исключает целый класс ошибок на этапе компиляции, малый бинарный файл (~15MB) дешевле развёртывать в облаке.

### Почему PostgreSQL?
Данные футбольной академии имеют сложные связи: игрок ↔ команда ↔ тренировка ↔ посещаемость ↔ оценки. Реляционная модель обеспечивает целостность через Foreign Keys, ACID-транзакции важны при массовой отметке посещаемости, а JSONB позволяет хранить гибкие метаданные.

### Почему Clean Architecture?
Зависимости направлены строго внутрь: HTTP → Business Logic → Data Access → Database. Бизнес-логика не знает о HTTP и БД. Если сменить PostgreSQL на MongoDB — сервисы останутся нетронутыми. Если сменить Fiber на gRPC — бизнес-логика не изменится. Каждый слой легко тестировать изолированно.

### Почему Feature-Sliced Design?
В проекте 35+ страниц, 5 ролей, 15+ доменных сущностей. FSD предотвращает спагетти-импорты через жёсткие правила: app → pages → widgets → features → entities → shared. Каждый слой импортирует только нижележащие.

### Почему JWT + Refresh Rotation?
Access token короткий (15 мин) хранится в памяти — защита от XSS. Refresh token длинный (7 дней) в httpOnly cookie — недоступен JavaScript. Rotation защищает от кражи: повторное использование детектируется через family_id и ревокает всю семью.

---

*Контекст сгенерирован на основе актуального состояния кодовой базы CoachOS. Используйте как единственный источник истины при написании диплома.*
