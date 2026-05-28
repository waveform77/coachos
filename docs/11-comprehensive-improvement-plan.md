# CoachOS — Комплексный план улучшений (v1.0)

> **Цель**: сделать приложение простым, крутым и понятным для всех ролей (тренер, игрок, родитель, админ, аналитик).  
> **Контекст**: дипломная работа Золоторевского А.Р. (09.02.07, МГУТУ им. К.Г. Разумовского, руководитель Кочетков С.С.).  
> **Статус**: MVP реализован, accessibility-рефакторинг завершён (0 TS-ошибок), сборка стабильна.

---

## 1. Обзор текущего состояния

| Блок | Что хорошо | Что требует доработки |
|---|---|---|
| **Архитектура** | Clean Architecture на Go, Fiber, GORM, миграции, JWT+refresh, RBAC | N+1 в сессиях, отсутствует аудит-лог, мед. заметки не зашифрованы |
| **Фронтенд** | React 18, Vite, Tailwind, shadcn/ui, i18next (ru/en), lazy-loading, TanStack Query | Нет тестов, не везде optimistic updates, DataTable без виртуализации |
| **UI/UX** | Accessibility-рефакторинг выполнен (крупные элементы, светлая тема, progress bars вместо радара) | Неконсистентные empty states, сырые детали в Calendar Sheet, не везде скелетоны |
| **Данные** | Полная схема БД, 3 миграции, сидеры, связи parent-child | `ParentChild` API не отдаёт `photoURL`/`position`, нет полнотекстового поиска |
| **AI** | Mock-провайдер работает, endpoints готовы | Нет реального AI (DeepSeek/OpenAI), нет кэширования ответов |
| **Тренерская тетрадь** | Есть `medical_notes`, `notes` в сессиях | Нет структурированных coach notes, auto-stats из матчей, экспорта в Excel |
| **FM-механики** | Есть DevIndex, оценки, goals | Нет формы/тона, усталости, тактической доски, сравнения игроков, скаутинга |
| **Тесты** | Backend: CI с Postgres, линтер, race detector | Frontend: только `setup.ts`, нет unit/e2e тестов |
| **Документация** | ADR, архитектура, API spec, security, deployment | `tech-debt.md` устарел (i18n помечен как не реализован), нет плана доведения до защиты |

---

## 2. Принцип приоритизации

Используем MoSCoW + дипломный контекст:

- **Must (P0)**: без этого нельзя защитить диплом или продукт не работает
- **Should (P1)**: значительно улучшает UX и оценку на защите
- **Could (P2)**: nice-to-have, можно сделать если останется время
- **Won't (now)**: откладываем (микросервисы, Redis, мобильное приложение)

---

## 3. Этап 1 — Данные и API (P0)

### 3.1 Согласованность типов (Frontend ↔ Backend)
**Проблема**: `User` имеет `clubID` и `clubId`, `Team` имеет `clubID`/`clubId`, `TeamWithMembers` дублирует поля.  
**Решение**: единый camelCase (`clubId`) на фронтенде, маппинг на бэкенде при сериализации.

| Файл | Действие |
|---|---|
| `frontend/src/shared/types/index.ts` | Удалить `clubID`, оставить только `clubId`; убрать `TeamWithMembers` дубли |
| `backend/internal/dto/*` | Проверить `json` теги на snake_case vs camelCase |

### 3.2 Расширение DTO для ParentChild
**Проблема**: `ParentChild` не отдаёт `photoURL` и `position` — UI вынужден показывать инициалы без позиции.  
**Решение**: добавить поля в DTO и запрос репозитория.

| Файл | Действие |
|---|---|
| `backend/internal/dto/parent.go` | Добавить `PhotoURL`, `Position` в `ParentChildResponse` |
| `backend/internal/repository/postgres/parent_repo.go` | JOIN с `players` для получения `photo_url`, `position` |
| `frontend/src/shared/api/parents.api.ts` | Обновить тип `ParentChild` |
| `frontend/src/pages/parent/overview.page.tsx` | Вернуть аватар + бейдж позиции |

### 3.3 Пагинация на "тяжёлых" списках
**Проблема**: `/players/:id/assessments`, `/exercises`, `/notifications` могут вернуть сотни записей.  
**Решение**: cursor-based или offset пагинация на бэкенде + infinite scroll / numbered pagination на фронтенде.

| Файл | Действие |
|---|---|
| `backend/internal/handler/assessment_handler.go` | Добавить `page`/`limit` query params |
| `backend/internal/handler/exercise_handler.go` | Аналогично |
| `frontend/src/shared/api/assessments.api.ts` | Принимать `PaginationQuery` |
| `frontend/src/pages/coach/assessments.page.tsx` | Добавить `<Pagination />` или infinite scroll |

### 3.4 Сидеры для демо-данных
**Проблема**: при развёртывании на стенде пустая БД выглядит неубедительно.  
**Решение**: rich seeds с реалистичными данными (клуб, 2–3 команды, 15 игроков, 20 сессий, оценки, attendance).

| Файл | Действие |
|---|---|
| `backend/seeds/*` | Создать `seed_club.go`, `seed_teams.go`, `seed_players.go`, `seed_sessions.go`, `seed_assessments.go` |
| `backend/cmd/seed/main.go` | CLI-команда для запуска сидеров |
| `Makefile` | Добавить `make seed` |

---

## 4. Этап 2 — UI/UX: единообразие и "простота" (P0–P1)

### 4.1 Консистентные Empty States
**Проблема**: где-то `text-center text-muted-foreground py-8`, где-то `<EmptyState />`, где-то просто `—`.  
**Решение**: единый компонент `EmptyState` с иконкой, заголовком, описанием и CTA-кнопкой (где применимо).

| Файл | Действие |
|---|---|
| `frontend/src/shared/ui/empty-state.tsx` | Убедиться, что компонент поддерживает `action` prop (кнопка) |
| `frontend/src/pages/*` | Заменить inline empty states на `<EmptyState />` |

### 4.2 Скелетоны везде
**Проблема**: на `AdminAnalyticsPage`, `ParentProgressPage` и др. `isLoading ? <Skeleton />` — но не везде.  
**Решение**: обязательный `Skeleton` для каждой страницы с network-запросами.

### 4.3 Toast-сообщения
**Проблема**: `toast.success(t('common.success'))` — слишком абстрактно.  
**Решение**: конкретные сообщения: "Игрок Иванов добавлен", "Тренировка запланирована на 15 июня".

| Файл | Пример |
|---|---|
| `frontend/src/features/players/player-form.tsx` | `toast.success(t('players.created', { name: data.firstName }))` |
| `frontend/src/features/sessions/session-form.tsx` | `toast.success(t('sessions.created', { date: formatDate(data.scheduledAt) }))` |

### 4.4 Детали события в Calendar Sheet
**Проблема**: при клике на событие в календаре открывается Sheet с текстом "ID: xxx".  
**Решение**: загрузка деталей сессии/матча и отображение полной карточки.

| Файл | Действие |
|---|---|
| `frontend/src/pages/coach/calendar.page.tsx` | Добавить `useQuery` для `sessionsApi.getSession` / `matchesApi.getMatch` по `selectedEvent.id` |
| `frontend/src/pages/player/schedule.page.tsx` | Аналогично для игрока (только сессии) |
| `frontend/src/pages/parent/schedule.page.tsx` | Аналогично для родителя |

### 4.5 Улучшение Coach Attendance Page
**Проблема**: страница `/coach/attendance` — это только список сессий с ссылкой "Отметить". Сама отметка происходит на `/coach/sessions/:id`, но UI неочевиден.  
**Решение**: либо inline-отметка прямо на странице attendance (quick-mark), либо более понятный flow.

| Файл | Действие |
|---|---|
| `frontend/src/pages/coach/attendance.page.tsx` | Добавить столбец "Посещаемость" с прогресс-баром (X из Y отмечено) |
| `frontend/src/pages/coach/session-detail.page.tsx` | Убедиться, что отметка attendance имеет optimistic update |

### 4.6 Optimistic Updates на Attendance
**Проблема**: при отметке посещаемости UI ждёт ответа сервера.  
**Решение**: TanStack Query optimistic update.

| Файл | Действие |
|---|---|
| `frontend/src/features/attendance/attendance-table.tsx` | `onMutate` + `queryClient.setQueryData` |

---

## 5. Этап 3 — Фичи: доведение до рабочего состояния (P0)

### 5.1 Parent Enter Code → Auto-redirect
**Проблема**: после ввода кода родитель остаётся на той же странице.  
**Решение**: редирект на `/parent/overview` после успешного связывания первого ребёнка.

| Файл | Действие |
|---|---|
| `frontend/src/pages/parent/enter-code.page.tsx` | `navigate('/parent/overview')` в `onSuccess` |

### 5.2 Player Schedule — детали сессии
**Проблема**: 128 строк, но нет drill-down в сессию.  
**Решение**: клик по событию в календаре → Sheet/Dialog с деталями (место, тренер, фокус).

### 5.3 Coach AI Assistant — реальный провайдер
**Проблема**: `MockProvider` всегда возвращает шаблон.  
**Решение**: интеграция DeepSeek API (уже есть конфиг) + fallback на mock при отсутствии ключа.

| Файл | Действие |
|---|---|
| `backend/internal/ai/deepseek.go` | Реализовать `DeepSeekProvider` с `go-resty` или `net/http` |
| `backend/internal/ai/mock.go` | Убедиться, что fallback работает при `apiKey == ""` |
| `backend/internal/service/ai_service.go` | Добавить кэширование (in-memory LRU, TTL 1ч) |

### 5.4 Notifications — Badge на колокольчике
**Проблема**: колокольчик в топбаре не показывает счётчик непрочитанных.  
**Решение**: `useQuery` для непрочитанных + badge.

| Файл | Действие |
|---|---|
| `frontend/src/widgets/app-shell/topbar.tsx` | Добавить `Badge` с `notifications.filter(n => !n.readAt).length` |
| `frontend/src/pages/shared/notifications.page.tsx` | Mark all read + индивидуальное прочтение |

### 5.5 Profile Page
**Проблема**: `/profile` — страница профиля, но нужно проверить, что она редактируема и показывает все данные.  
**Решение**: форма редактирования профиля (имя, телефон, аватар).

| Файл | Действие |
|---|---|
| `frontend/src/pages/shared/profile.page.tsx` | PATCH `/users/me` (бэкенд уже имеет placeholder) |
| `backend/internal/routes/routes.go` | Реализовать `users.Patch("/me", ...)` через authH.UpdateMe |

---

## 6. Этап 4 — Accessibility: следующий уровень (P1)

Accessibility-рефакторинг (размер шрифта, touch targets) выполнен. Теперь нужно:

### 6.1 ARIA и Focus Management
- Каждый `<Dialog>` должен иметь `aria-describedby` и focus trap.
- Toast-уведомления должны иметь `role="status"` или `role="alert"`.
- Навигация по табам в формах должна быть логичной.

### 6.2 Skip Link
- Добавить `Skip to main content` ссылку для screen readers.

### 6.3 High Contrast Mode
- Проверить контрастность текста на всех бейджах и цветных фонах.
- Добавить `prefers-contrast: high` media query где нужно.

### 6.4 Reduced Motion
- Уважать `prefers-reduced-motion` для всех анимаций (landing page, hover effects).

---

## 7. Этап 5 — Тестирование (P0 для диплома)

### 7.1 Frontend Unit Tests
**Фреймворк**: уже настроен Vitest + `@testing-library/react`.

| Что тестировать | Пример |
|---|---|
| `shared/lib/utils.ts` | `getDevIndexLabel`, `formatDate`, `calculateAge` |
| `features/auth/login-form.tsx` | Валидация email, submit вызывает `authApi.login` |
| `features/players/player-form.tsx` | Разбиение на секции, валидация обязательных полей |
| `widgets/app-shell/sidebar-nav.tsx` | Рендеринг пунктов меню для каждой роли |

### 7.2 Frontend Integration Tests
- TanStack Query hooks: `useQuery` + `msw` (Mock Service Worker) для API.

### 7.3 E2E Tests
**Фреймворк**: Playwright (уже в `frontend/e2e/`).

| Сценарий | Описание |
|---|---|
| `auth.spec.ts` | Регистрация → вход → редирект на дашборд |
| `coach-flow.spec.ts` | Создание игрока → оценка → проверка progress bars |
| `parent-flow.spec.ts` | Ввод кода → появление ребёнка → проверка attendance |

### 7.4 Backend Tests
Уже есть CI с Postgres. Нужно расширить покрытие:
- `service/pdi_formula_test.go` — уже есть, добавить тесты для краевых случаев.
- `handler/*_test.go` — HTTP tests с `httptest`.
- `middleware/*_test.go` — RBAC, JWT валидация.

---

## 8. Этап 6 — Производительность (P1)

### 8.1 Bundle Analysis
```bash
cd frontend && npx vite-bundle-visualizer
```
**Цель**: убедиться, что FullCalendar и Recharts не попадают в initial chunk.

### 8.2 Virtualized Lists
- `DataTable` на страницах с >100 строками (Players, Exercises, Assessments).
- `@tanstack/react-virtual` уже предложен в `perf-optimization.md`.

### 8.3 Image Optimization
- Аватарки: `loading="lazy"`, `decoding="async"`.
- Загрузка фото игроков: сжатие на клиенте перед отправкой (Canvas resize до 400x400).

### 8.4 Debounced Search
- Поиск упражнений: `useDebounce(query, 300)`.

---

## 9. Этап 7 — Безопасность и надёжность (P1)

### 9.1 Шифрование медицинских заметок
**Проблема**: `medical_notes` в открытом виде.  
**Решение**: AES-256 column-level encryption.

| Файл | Действие |
|---|---|
| `backend/internal/domain/player.go` | Добавить `Encrypt/Decrypt` hooks в GORM |
| `backend/.env` | `MEDICAL_ENCRYPTION_KEY` |

### 9.2 CSRF Protection
**Проблема**: POST/PATCH без CSRF токена.  
**Решение**: Double Submit Cookie (`SameSite=Strict` уже должен быть, но нужно проверить).

### 9.3 Audit Log
**Проблема**: таблица `audit_logs` пустая.  
**Решение**: middleware или GORM hooks на CREATE/UPDATE/DELETE для критичных сущностей (players, assessments, attendance).

### 9.4 Refresh Token Cleanup
**Проблема**: истёкшие токены накапливаются.  
**Решение**: background goroutine или cron job каждые 24ч.

---

## 10. Этап 8 — Документация и i18n (P1)

### 10.1 Обновление `tech-debt.md`
- i18n уже реализован — убрать из долга.
- Добавить новые пункты по результатам этого плана.

### 10.2 Полнота переводов
**Проблема**: могут оставаться хардкод-строки на русском (или английском) в некоторых компонентах.  
**Решение**: аудит всех `.tsx` файлов на предмет `t('...')` покрытия.

```bash
grep -r "[а-яА-Я]\{3,\}" frontend/src/pages/ --include="*.tsx" | grep -v "t('" | grep -v "//"
```

### 10.3 API Documentation
- Обновить `docs/05-api-spec.md` с учётом новых endpoints (parent linking, AI).

### 10.4 Дипломная документация
- `docs/10-diploma-defense.md` — обновить скриншоты после UI-улучшений.
- Добавить раздел "Тестирование" с покрытием кода.

---

## 11. Этап 9 — Тренерская тетрадь → Digital (P1)

> Задача: полностью заменить бумажные носители и Excel, которыми пользовался Иван Васильевич. Вся информация должна быть удобнее, чем в тетради, и быстрее, чем в Excel.

### 11.1 Coach Notes / Player Journal
**Было**: тренер писал в блокнот: "Ваня 15.05 — плохо играет головой, надо отработать".  
**Стало**: структурированные заметки к каждому игроку с категорией, датой и приоритетом.

| Поле | Описание |
|---|---|
| `category` | `technique`, `tactics`, `physical`, `behavior`, `medical` |
| `content` | Текст заметки |
| `isPrivate` | Видно только тренеру или всему штабу |
| `createdAt` | Автоматическая дата |

**Файлы:**
- `backend/internal/domain/coach_note.go` — модель
- `backend/internal/repository/postgres/coach_note_repo.go` — CRUD
- `backend/internal/handler/coach_note_handler.go` — endpoints
- `frontend/src/features/players/player-notes.tsx` — вкладка "Заметки" в профиле игрока
- `frontend/src/pages/coach/player-detail.page.tsx` — добавить таб или секцию

### 11.2 Session Diary (Дневник тренировки)
**Было**: после тренировки тренер отмечал в тетради, что прошло хорошо.  
**Стало**: поле `coachNotes` у `TrainingSession` (уже есть `notes`, но нужно разделить на `notes` — общие, и `coachDiary` — приватный анализ).

- `backend/internal/dto/session.go` — добавить `CoachDiary string`
- `frontend/src/pages/coach/session-detail.page.tsx` — textarea для тренера после завершения сессии

### 11.3 Match Diary & Post-Match Analysis
**Было**: после матча тренер анализировал в голове или на коленке.  
**Стало**: структурированная форма:
- Что сработало (тактически)
- Что не сработало
- Ключевые моменты
- Выводы на следующую тренировку

- `backend/internal/domain/match_note.go` — модель
- `frontend/src/pages/coach/match-detail.page.tsx` — секция "Анализ матча"

### 11.4 Auto-Stats из Match Events → Player Profile
**Было**: голы, ассисты, карточки считались вручную в Excel.  
**Стало**: автоматический подсчёт по `match_events`.

| Метрика | Источник |
|---|---|
| Голы | `COUNT(*) WHERE type = 'goal'` |
| Ассисты | `COUNT(*) WHERE type = 'assist'` |
| Жёлтые карточки | `COUNT(*) WHERE type = 'yellow_card'` |
| Красные карточки | `COUNT(*) WHERE type = 'red_card'` |
| Минуты на поле | `match_lineups.minutes_played` |
| Матчи (старт/замена) | `match_lineups.role` |

**Реализация:**
- `backend/internal/service/analytics_service.go` — метод `GetPlayerMatchStats(playerID)`
- `backend/internal/handler/analytics_handler.go` — endpoint
- `frontend/src/pages/coach/player-detail.page.tsx` — карточка "Матчевая статистика" (большие цифры)
- `frontend/src/pages/player/reports.page.tsx` — показывать свои голы/ассисты

### 11.5 Export Reports (Excel / PDF)
**Было**: тренер копировал данные из системы в Excel для отчёта директору/родителям.  
**Стало**: кнопка "Выгрузить в Excel" на любой странице с таблицей.

- `frontend/src/shared/lib/export.ts` — утилита `exportToCSV(data, filename)`
- `frontend/src/shared/lib/export-pdf.ts` — утилита `exportToPDF(elementId, filename)` (через `html2canvas` + `jspdf`)
- Кнопки на: Players, Assessments, Attendance, Match Summary

### 11.6 Medical Log (история травм и болезней)
**Было**: одно поле `medical_notes` — всё в куче.  
**Стало**: структурированная история.

| Поле | Описание |
|---|---|
| `condition` | `injury`, `illness`, `recovery`, `fit` |
| `description` | Описание |
| `startDate` / `endDate` | Период |
| `severity` | `minor`, `moderate`, `severe` |
| `status` | `active`, `recovered` |

- `backend/internal/domain/medical_record.go` — модель
- `backend/migrations/0004_medical_records.up.sql` — миграция
- `frontend/src/features/players/medical-log.tsx` — timeline травм

---

## 12. Этап 10 — Football Manager механики в академии (P1–P2)

> Адаптация лучших UX-паттернов из Football Manager для работы с юными игроками. Не копируем сложность — берём понятность.

### 12.1 Player Form & Morale (Форма и мораль)
Как в FM: стрелка формы показывает динамику за последние 2 недели.

| Индикатор | Расчёт |
|---|---|
| 🔥 Отличная | avg оценка ≥ 8, attendance 100%, 2+ матча |
| ↗️ Растёт | тренд DevIndex + оценок положительный |
| ➡️ Стабильная | без резких изменений |
| ↘️ Падает | пропуски, низкие оценки, травма |
| 💤 Нет игровой практики | >14 дней без матча |

**Реализация:**
- `backend/internal/service/analytics_service.go` — `CalculatePlayerForm(playerID)`
- `frontend/src/entities/player/player-form-badge.tsx` — компонент (стрелка + текст)
- `frontend/src/pages/coach/players.page.tsx` — бейдж формы в карточке игрока
- `frontend/src/pages/coach/command-center.page.tsx` — фильтр "Игроки в хорошей форме / рискуют"

### 12.2 Match Sharpness / Game Rhythm (Игровая острота)
Как в FM: игрок мало играет — теряет остроту; играет много — устаёт.

| Значение | Описание |
|---|---|
| 90–100% | Оптимальная острота |
| 70–89% | Недостаточно игровой практики |
| <70% | Сильно «потерян», нужны спарринги |

Формула: `sharpness = f(минуты_за_14_дней, тренировки, матчи)`

- `backend/internal/service/analytics_service.go` — `CalculateSharpness(playerID)`
- `frontend/src/pages/coach/player-detail.page.tsx` — progress bar "Острота"

### 12.3 Training Load & Fatigue (Нагрузка и усталость)
Как в FM: индикатор перегрузки. Риск травмы растёт с усталостью.

| Зона | Цвет | Действие |
|---|---|---|
| Зелёная | Норма | Можно тренироваться |
| Жёлтая | Повышенная | Снизить интенсивность |
| Красная | Перегрузка | Выходной / восстановление |

Расчёт: сумма `intensity` сессий за 7 дней + матчи.

- `backend/internal/service/analytics_service.go` — `CalculateFatigue(playerID)`
- `frontend/src/pages/coach/command-center.page.tsx` — карточка "Риск травм" с именами игроков в красной зоне
- `frontend/src/pages/coach/player-detail.page.tsx` — график нагрузки за 30 дней

### 12.4 Tactics Board / Pitch Diagram (Тактическая доска)
**Было**: тренер рисовал схему на доске или в тетради.  
**Стало**: интерактивное футбольное поле.

**MVP версия:**
- SVG-поле с разметкой
- Drag & drop игроков на позиции (11 основных + замены)
- Выбор схемы: 4-4-2, 4-3-3, 4-2-3-1, 3-5-2, 5-3-2
- Сохранение состава в `match_lineups`

**Файлы:**
- `frontend/src/features/matches/tactics-board.tsx` — SVG поле + DnD (`@dnd-kit/core` уже в зависимостях)
- `frontend/src/features/matches/formation-selector.tsx` — селектор схемы
- `frontend/src/pages/coach/match-detail.page.tsx` — вкладка "Состав"
- `backend/internal/service/match_service.go` — валидация позиций по схеме

### 12.5 Player Comparison (Side-by-Side)
Как в FM: сравнение двух игроков для выбора на позицию.

- `frontend/src/features/players/player-comparison.tsx` — две колонки, progress bars по параметрам
- `frontend/src/pages/coach/players.page.tsx` — кнопка "Сравнить" (multi-select 2 игроков)
- Показывать: DevIndex, оценки (техника, физика, тактика), форма, возраст, позиция

### 12.6 Scouting / Trial Reports (Скаутинг новичков)
Как в FM: карточка просмотренного игрока с вердиктом.

| Поле | Тип |
|---|---|
| `playerName` | string |
| `birthDate` | date |
| `position` | enum |
| `trialDate` | date |
| `ratings` | 1–5 звёзд по технике/физике/тактике/психологии |
| `verdict` | `sign`, `watch`, `reject` |
| `potential` | `high`, `medium`, `low` |
| `notes` | text |

- `backend/internal/domain/trial_report.go` — модель
- `frontend/src/pages/coach/players.page.tsx` — кнопка "Добавить на просмотр"
- `frontend/src/pages/coach/scouting.page.tsx` — страница "Просмотры" (новая)

### 12.7 Development Potential (CA / PA)
Как в FM: текущий уровень (CA) vs потолок (PA).

- `backend/internal/domain/player.go` — добавить `potentialAbility int` (1–100)
- `frontend/src/entities/player/player-potential.tsx` — визуализация: двойной progress bar
  - Верхний: текущий DevIndex (заполненный)
  - Нижний: потенциал (штриховой/полупрозрачный)
- `frontend/src/pages/coach/player-detail.page.tsx` — секция "Потенциал"

### 12.8 Team Chemistry & Dynamics
Упрощённая версия FM dynamics:
- Капитан (уже есть `is_captain`)
- Группы: "Основа", "Молодёжь", "Новички"
- Лидерские качества: кто влияет на мораль команды

- `frontend/src/pages/coach/team-detail.page.tsx` — секция "Атмосфера в команде"

---

## 13. Роадмап и оценка по времени

| Этап | Задачи | Оценка | Дипломная критичность |
|---|---|---|---|
| **1. Данные и API** | Типы, ParentChild DTO, пагинация, сидеры | 3 дня | Must |
| **2. UI/UX** | Empty states, скелетоны, toast, calendar sheet, attendance flow | 3 дня | Must |
| **3. Фичи** | Parent redirect, AI provider, notifications badge, profile edit | 3 дня | Must |
| **4. Accessibility** | ARIA, skip link, reduced motion | 1 день | Should |
| **5. Тестирование** | Unit + integration + e2e (frontend), handler tests (backend) | 4 дня | Must |
| **6. Производительность** | Bundle analysis, virtualization, debounce | 1 день | Could |
| **7. Безопасность** | Medical encryption, CSRF, audit log, token cleanup | 3 дня | Should |
| **8. Документация** | i18n audit, API spec, diploma defense update | 2 дня | Should |
| **9. Тренерская тетрадь** | Coach notes, session diary, match analysis, auto-stats, export, medical log | 5 дней | Must |
| **10. FM-механики** | Форма, острота, усталость, тактическая доска, сравнение, скаутинг, потенциал | 6 дней | Should |
| **Итого** | | **~31 день** | |

> **Рекомендуемый порядок для диплома** (сжатый, ~20 рабочих дней):  
> **1 → 3 → 9 (основа: notes + auto-stats + export) → 2 → 5 → 10 (только форма + сравнение + потенциал) → 7 → 4 → 6 → 8**.  
> FM-механики "полного плана" (тактическая доска, скаутинг) — если останется время после защиты MVP.

---

## 14. Чек-лист "Готово к защите"

### Core (P0)
- [ ] Все P0-задачи закрыты
- [ ] Frontend build: 0 TypeScript errors, 0 lint errors
- [ ] Backend: `go test ./...` проходит, race detector чист
- [ ] E2E: playwright tests проходят (auth, coach flow, parent flow)
- [ ] Демо-данные: `make seed` создаёт убедительный клуб с 15+ игроками
- [ ] Документация: `docs/` актуальны, `tech-debt.md` обновлён
- [ ] Дипломный отчёт: скриншоты UI соответствуют текущей версии
- [ ] Стенд: приложение развёрнуто и доступно по HTTPS

### Тренерская тетрадь (P1 — критично для концепции)
- [ ] Coach Notes: можно оставить заметку об игроке с категорией
- [ ] Auto-Stats: матчевая статистика (голы/ассисты/карточки) считается автоматически
- [ ] Export: хотя бы CSV-выгрузка из одного списка (игроки или посещаемость)
- [ ] Medical Log: структурированная история травм (минимум 1 запись в сидерах)

### FM-механики (P1–P2 — "вау-эффект" на защите)
- [ ] Player Form Badge: динамическая стрелка формы на карточке игрока
- [ ] Player Comparison: side-by-side сравнение 2 игроков
- [ ] Development Potential: поле `potentialAbility` + визуализация в профиле
- [ ] Tactics Board (опционально): SVG поле + drag & drop (если успеваем)

---

## Приложение A. Файлы, требующие немедленного внимания

| Файл | Проблема | Приоритет |
|---|---|---|
| `frontend/src/pages/coach/calendar.page.tsx` | Sheet показывает только ID | P0 |
| `frontend/src/pages/parent/schedule.page.tsx` | Нет drill-down в сессию | P0 |
| `frontend/src/pages/coach/attendance.page.tsx` | Неочевидный flow отметки | P0 |
| `frontend/src/pages/shared/profile.page.tsx` | Placeholder PATCH /users/me | P0 |
| `backend/internal/dto/parent.go` | Нет photoURL/position | P0 |
| `frontend/src/shared/types/index.ts` | Дублирование clubID/clubId | P0 |
| `frontend/src/pages/parent/enter-code.page.tsx` | Нет редиректа после link | P1 |
| `frontend/src/widgets/app-shell/topbar.tsx` | Нет badge на notifications | P1 |
| `backend/internal/ai/deepseek.go` | Не реализован (или mock) | P1 |
| `docs/tech-debt.md` | Устаревшая информация | P1 |
| `frontend/src/pages/coach/match-detail.page.tsx` | Нет post-match analysis / tactics board | P1 |
| `backend/internal/service/analytics_service.go` | Нет auto-stats по match_events | P1 |
| `frontend/src/pages/coach/players.page.tsx` | Нет form badge / comparison | P1 |
