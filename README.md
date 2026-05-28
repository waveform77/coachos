# CoachOS — Operating System for Football Academies

> «Не CRM и не календарь. CoachOS — это Notion+Strava+Linear для футбольной академии.»

[![CI](https://github.com/coachos/platform/workflows/CI/badge.svg)](https://github.com/coachos/platform/actions)
[![Go](https://img.shields.io/badge/Go-1.22-00ADD8?logo=go)](https://go.dev)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)](https://react.dev)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?logo=postgresql)](https://postgresql.org)

## Что это такое

**CoachOS** — SaaS-платформа для организации тренерской деятельности в футболе. Объединяет тренеров, игроков, родителей и администраторов академии в едином workspace.

### Ключевые функции

- 📅 **Конструктор тренировок** — drag-and-drop блоки с расчётом нагрузки
- 📊 **Player Development Index** — нормированный индекс развития 0–100
- ⚡ **Coach Command Center** — главный дашборд тренера
- 🏋️ **Smart Training Load** — предупреждения о перегрузке
- 🤖 **AI Coach Assistant** — генерация планов и рекомендаций
- 👨‍👩‍👦 **Parent Transparency Mode** — понятный прогресс для родителей
- 📈 **Аналитика** — posещаемость, прогресс, сравнение игроков

### Роли пользователей

| Роль | Описание |
|---|---|
| **Admin** | Управление клубом, командами, тренерами |
| **Coach** | Тренировки, оценки, аналитика, AI-ассистент |
| **Player** | Личный кабинет: расписание, прогресс, цели |
| **Parent** | Просмотр прогресса ребёнка |
| **Analyst** | Чтение аналитики |

## Технологический стек

### Backend
- **Language**: Go 1.22
- **Framework**: Fiber v2
- **Database**: PostgreSQL 16 + GORM
- **Auth**: JWT (access 15min) + Refresh Token Rotation
- **Architecture**: Clean Architecture (handler → service → repository → domain)

### Frontend
- **Framework**: React 18 + TypeScript + Vite
- **UI**: Tailwind CSS + shadcn/ui
- **State**: TanStack Query (server) + Zustand (client)
- **Forms**: React Hook Form + Zod
- **Charts**: Recharts
- **Calendar**: FullCalendar
- **Architecture**: Feature-Sliced Design

### Infrastructure
- **Container**: Docker + Docker Compose
- **Database migrations**: golang-migrate
- **CI/CD**: GitHub Actions

## Быстрый старт

### Prerequisites
- Docker Desktop 4.x+
- Go 1.22+ (для `make dev-backend`, `make seed`, тестов). Если `go` не в PATH, **`make migrate-up` / `migrate-down`** всё равно сработают через **Docker** (образ `migrate/migrate`).
- Node.js 20+ (для разработки)
- Make

### 1. Клонировать и настроить

```bash
git clone <repo-url> football-coach-platform
cd football-coach-platform

# Скопировать env файлы
make setup
```

### 2. Настроить `backend/.env`

```env
APP_ENV=development
APP_PORT=8080
JWT_SECRET=your-super-secret-key-min-32-chars
DB_HOST=localhost
DB_PORT=5433
DB_USER=coachos
DB_PASSWORD=coachos_secret
DB_NAME=coachos_db
DB_SSL_MODE=disable
```

`5433` — порт проброса из `docker-compose` (чтобы не конфликтовать с локальным Postgres на `5432`). Свой сервер на `5432` → укажите `DB_PORT=5432`.

**Ошибка `password authentication failed for user "coachos"`**

1. **Порт** — миграции с хоста должны идти на тот же порт, что проброшен из Compose (часто **`DB_PORT=5433`**). Если указать `5432`, вы можете попасть в **другой** PostgreSQL на машине с другими учётными данными.
2. **Одинаковые учётки** — переменные **`DB_USER`**, **`DB_PASSWORD`**, **`DB_NAME`** в корневом **`.env`** (его читает `docker compose` для Postgres) и в **`backend/.env`** должны **совпадать**. Пароль задаётся при **первом** создании тома `postgres_data`; позже смена строки в `.env` сама по себе пароль в уже созданном кластере не меняет.
3. **Сброс тома** (удалит данные БД в Docker): `docker compose down -v`, затем `docker compose up -d postgres`, подождать healthy, снова **`make migrate-up`**.

### 3. Запустить

```bash
# Запустить весь стек
make up

# Применить миграции и seed-данные
make migrate-up
make seed
```

### 4. Открыть

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8080
- **Health check**: http://localhost:8080/health

### Demo аккаунты

| Роль | Email | Пароль |
|---|---|---|
| Admin | admin@coachos.dev | Admin123! |
| Coach | coach1@coachos.dev | Coach123! |
| Coach | coach2@coachos.dev | Coach123! |
| Player | player1@coachos.dev | Player123! |
| Parent | parent1@coachos.dev | Parent123! |

**Что в демо после `make seed`:** три команды (U15/U17/Senior), 15 игроков с антропометрией, аккаунт **player1** привязан к Ивану Козлову, **parent1** — родитель этого игрока; русскоязычные упражнения и заметки к тренировкам; много сессий (в т.ч. «сегодня» и архив), посещаемость с отсутствиями/опозданиями, три оценки на игрока, цели, матчи с составами и событиями, уведомления.

## Структура проекта

```
football-coach-platform/
├── backend/               # Go Fiber API
│   ├── cmd/api/           # Entry point
│   ├── internal/
│   │   ├── config/        # Viper configuration
│   │   ├── database/      # GORM + PostgreSQL
│   │   ├── domain/        # Models + errors (no dependencies)
│   │   ├── repository/    # Data access (interfaces + postgres/)
│   │   ├── service/       # Business logic
│   │   ├── handler/       # HTTP handlers
│   │   ├── middleware/    # Auth, RBAC, logger
│   │   ├── routes/        # Route registration
│   │   ├── dto/           # Request/Response types
│   │   ├── ai/            # AI Provider interface + mock
│   │   └── notifier/      # Notification interface + inapp
│   ├── migrations/        # SQL migrations
│   └── seeds/             # Demo data
│
├── frontend/              # React TypeScript SPA
│   └── src/
│       ├── app/           # Providers, Router, Zustand stores
│       ├── pages/         # Page components (per route)
│       ├── widgets/       # Composite UI blocks
│       ├── features/      # User actions (forms, interactions)
│       ├── entities/      # Domain UI models (cards, charts)
│       └── shared/        # Reusable (ui, api, lib, types)
│
├── docker/                # Docker configs
├── docs/                  # Documentation
└── .github/workflows/     # CI/CD
```

## Development

```bash
# Только backend
make dev-backend

# Только frontend
make dev-frontend

# Тесты
make test

# Линтеры
make lint

# Пересоздать БД с нуля
make db-reset
```

## Документация

| Документ | Описание |
|---|---|
| [docs/01-product-vision.md](docs/01-product-vision.md) | Product Vision & Business |
| [docs/02-mvp-scope.md](docs/02-mvp-scope.md) | MVP Scope (MoSCoW) |
| [docs/03-architecture.md](docs/03-architecture.md) | Системная архитектура |
| [docs/04-database-schema.md](docs/04-database-schema.md) | Схема базы данных (полный DDL) |
| [docs/05-api-spec.md](docs/05-api-spec.md) | REST API спецификация |
| [docs/06-ui-architecture.md](docs/06-ui-architecture.md) | UI/UX Architecture |
| [docs/07-security.md](docs/07-security.md) | Security Checklist |
| [docs/08-testing.md](docs/08-testing.md) | Testing Strategy |
| [docs/09-deployment.md](docs/09-deployment.md) | Deployment Guide |
| [docs/10-diploma-defense.md](docs/10-diploma-defense.md) | Руководство по защите диплома |
| [docs/19-cursor-prompts.md](docs/19-cursor-prompts.md) | Cursor implementation prompts |

## API Reference

```
POST /api/v1/auth/register   — Регистрация
POST /api/v1/auth/login      — Вход
GET  /api/v1/auth/me         — Текущий пользователь

GET  /api/v1/players         — Список игроков
GET  /api/v1/players/:id/profile  — Профиль + PDI
GET  /api/v1/sessions        — Тренировки
POST /api/v1/sessions        — Создать тренировку

GET  /api/v1/analytics/coach-dashboard — Command Center данные
POST /api/v1/ai/training-plan          — AI план тренировки
```

Полная спецификация: [docs/05-api-spec.md](docs/05-api-spec.md)

## Лицензия

MIT — свободное использование для учебных и коммерческих целей.

---

*CoachOS — дипломный проект по теме «Разработка веб-приложения для применения в организации тренерской деятельности на примере футбола»*
