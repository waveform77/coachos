# CoachOS — Technical Debt Register

## Категории

- 🔴 **Critical**: решить до production
- 🟡 **High**: решить в следующем спринте
- 🟢 **Low**: можно отложить

---

## Backend

### 🟡 GORM vs sqlc для аналитических запросов
**Файл**: `internal/repository/postgres/*`  
**Проблема**: GORM reflection overhead на JOIN-тяжёлых аналитических запросах  
**Решение**: Горячие пути в analytics_service перевести на `db.Raw()` с явным SQL  
**Estimated**: 2 дня

### 🟡 N+1 в GetSessionDetail
**Файл**: `internal/repository/postgres/session_repo.go`  
**Проблема**: При загрузке сессии с блоками и упражнениями возможны N+1 запросы  
**Решение**: Явный `Preload("Blocks.Exercises.Exercise")` или BatchPreload  
**Estimated**: 0.5 дня

### 🔴 Refresh Token cleanup job
**Файл**: `internal/repository/postgres/refresh_token_repo.go`  
**Проблема**: Истёкшие refresh tokens накапливаются в БД  
**Решение**: Cron job или background goroutine каждые 24 часа  
**Estimated**: 1 день

### 🟡 Missing pagination в /players/:id/assessments
**Файл**: `internal/handler/assessment_handler.go`  
**Проблема**: Без cursor-based pagination может вернуть все assessment за годы  
**Решение**: Добавить before/after cursor pagination  
**Estimated**: 0.5 дня

### 🟢 AI Provider OpenAI implementation
**Файл**: `internal/ai/`  
**Проблема**: MockProvider не использует реальный AI  
**Решение**: Реализовать `openai.go` с go-openai клиентом  
**Estimated**: 3 дня

### 🟡 Rate limiting не распределённое
**Файл**: `internal/middleware/`  
**Проблема**: In-memory rate limiter не работает при нескольких инстансах  
**Решение**: Redis-based rate limiter (gomodule/redismq или limiter)  
**Estimated**: 1 день

### 🟢 Audit log не реализован
**Файл**: `internal/domain/models.go` (AuditLog exists)  
**Проблема**: Таблица есть, но запись не реализована  
**Решение**: GORM hooks или service middleware  
**Estimated**: 2 дня

### 🔴 Medical notes не зашифрованы
**Файл**: `internal/domain/models.go` (Player.MedicalNotes)  
**Проблема**: Медицинские данные детей в открытом виде  
**Решение**: AES-256 encryption at rest (column-level)  
**Estimated**: 2 дня

---

## Frontend

### 🟡 Нет виртуализации больших таблиц
**Файл**: `src/shared/ui/data-table.tsx`  
**Проблема**: DataTable без виртуализации будет тормозить на 500+ строках  
**Решение**: @tanstack/react-virtual или TanStack Table virtualization  
**Estimated**: 1 день

### 🟡 Нет оффлайн-режима
**Файл**: `src/app/`  
**Проблема**: Нет graceful degradation при потере сети  
**Решение**: Service Worker + TanStack Query persistor  
**Estimated**: 2 дня

### 🟢 Bundle size не оптимизирован
**Файл**: `frontend/vite.config.ts`  
**Проблема**: FullCalendar (~150KB) и Recharts (~70KB) в основном бандле  
**Решение**: Dynamic imports для calendar и chart pages  
**Estimated**: 0.5 дня

### 🟡 Нет Optimistic Updates на attendance marking
**Файл**: `src/features/attendance/attendance-table.tsx`  
**Проблема**: UI не обновляется мгновенно при отметке посещаемости  
**Решение**: TanStack Query optimistic updates  
**Estimated**: 1 день

### ✅ i18n реализован
**Файл**: `frontend/src/shared/i18n/`  
**Статус**: Завершено. Есть словари `ru.json` и `en.json`, LanguageSwitcher в топбаре.  
**Осталось**: аудит на хардкод-строки (`grep -r "[а-яА-Я]"` в компонентах).

### 🔴 Нет CSRF protection для form submissions
**Файл**: `src/shared/api/client.ts`  
**Проблема**: POST/PATCH/DELETE запросы без CSRF token  
**Решение**: Double Submit Cookie pattern или SameSite=Strict  
**Estimated**: 1 день

---

## Infrastructure

### 🟡 Нет health check для frontend container
**Файл**: `docker-compose.yml`  
**Проблема**: Frontend может быть недоступен, Compose не знает  
**Решение**: HEALTHCHECK в Dockerfile  
**Estimated**: 0.5 дня

### 🟢 Нет log aggregation
**Файл**: `docker-compose.yml`  
**Проблема**: Логи только в stdout контейнеров  
**Решение**: Loki + Grafana или ELK stack  
**Estimated**: 2 дня

### 🟢 Нет backup strategy
**Файл**: `docker-compose.yml`  
**Проблема**: PostgreSQL данные только в Docker volume  
**Решение**: Automated pg_dump + offsite backup (S3/B2)  
**Estimated**: 1 день

---

## Scoring

| Категория | Critical | High | Low | Total days |
|---|---|---|---|---|
| Backend | 2 | 4 | 2 | ~13 |
| Frontend | 1 | 3 | 1 | ~7 |
| Infrastructure | 0 | 1 | 2 | ~3.5 |
| **Total** | **3** | **8** | **5** | **~23.5 days** |

Весь технический долг закрывается примерно за 1.5–2 спринта после MVP.
