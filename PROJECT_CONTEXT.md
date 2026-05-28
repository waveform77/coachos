# CoachOS — Football Manager Platform
## Контекст проекта для теоретической части диплома

---

## 1. Общие сведения

**Название:** CoachOS  
**Назначение:** Веб-платформа для тренерского штаба футбольной академии. Автоматизация управления игроками, матчами, тренировками, медицинскими записями, аналитикой и тактической подготовкой.  
**Целевая аудитория:** Главные тренеры, ассистенты тренеров, спортивные директоры детско-юношеских футбольных школ и академий.

---

## 2. Технологический стек

### Frontend
- **React 18** + **TypeScript** — типобезопасная компонентная архитектура
- **Vite** — сборщик, HMR, быстрый старт dev-сервера
- **TanStack Query (React Query)** — серверное состояние, кэширование, инвалидация, оптимистичные обновления
- **Tailwind CSS** + **shadcn/ui** — утилитарный CSS + доступные headless-компоненты на базе Radix UI
- **react-i18next** — интернационализация (RU/EN)
- **Recharts** — визуализация аналитики (формы игроков, тренды)
- **@dnd-kit/core** — современный drag-and-drop (тактическая доска)
- **Zustand** — глобальное клиентское состояние (аутентификация)
- **Zod** — валидация форм на клиенте

### Backend
- **Go (Golang)** — высокопроизводительный бэкенд
- **Fiber** — HTTP-фреймворк (аналог Express для Go)
- **GORM** — ORM для PostgreSQL
- **PostgreSQL** — реляционная БД
- **JWT** — stateless-аутентификация
- **Uber Zap** — структурированное логирование

---

## 3. Архитектура системы

```
┌─────────────┐      REST/JSON      ┌─────────────┐      SQL       ┌─────────────┐
│   React     │ ◄─────────────────► │  Go/Fiber   │ ◄────────────► │ PostgreSQL  │
│  (Vite)     │   localhost:3000    │  (GORM)     │  localhost:   │   (GORM)    │
│             │                     │             │     5432       │             │
└─────────────┘                     └─────────────┘                └─────────────┘
```

**Паттерн:** Клиент-серверная архитектура с REST API. Frontend — SPA (Single Page Application).

---

## 4. Ключевые функциональные модули

### 4.1. Управление игроками (Player Management)
- Карточка игрока: ФИО, дата рождения, позиция, амплуа, рост, вес, ведущая нога, фото
- Команды (U15, U17, Senior) — привязка игрока к команде
- Пагинация с лимитом (дефолт 20, для крупных списков — 100)

### 4.2. Матчи и составы (Match & Lineup Builder)
- Создание матчей: дата, соперник, дом/в гостях, счёт, статус
- **Tactical Board (тактическая доска):** drag-and-drop расстановка игроков на виртуальном поле с координатами (fieldX, fieldY в процентах)
- Схемы (4-4-2, 4-3-3, 3-5-2 и др.) — автоматическая расстановка по шаблонам
- События матча: голы, ассисты, жёлтые/красные карточки, замены

### 4.3. Тренировки и посещаемость (Training & Attendance)
- Расписание тренировок по командам
- Журнал посещаемости: присутствовал / опоздал / отсутствовал / травмирован / освобождён

### 4.4. Оценки и форма (Assessments & Player Form)
- 6 оценок за тренировку (техника, тактика, физика, психология, игра в обороне, игра в атаке)
- Расчёт формы (excellent / rising / falling / stable) на основе тренда последних оценок

### 4.5. Медицинские записи (Medical Records)
- Травмы, болезни, реабилитация
- Даты начала/окончания (`*string` nullable для ongoing случаев)
- Статус: active / recovered

### 4.6. Аналитика и дашборд
- Форма игрока (sparkline тренда)
- Командная статистика
- Индивидуальная статистика по матчам (голы, ассисты, карточки, минуты)

### 4.7. AI-рекомендации
- Генерация рекомендаций по развитию игрока на основе данных

---

## 5. Модель данных (основные сущности)

| Сущность | Поля | Связи |
|----------|------|-------|
| Club | id, name, city | has many Teams |
| Team | id, name, category (U15/U17/Senior), clubId | has many Players, has many Matches |
| Player | id, firstName, lastName, birthDate, position, dominantFoot, heightCm, weightKg, teamId, clubId, devIndex, potentialAbility | has many Assessments, has many MedicalRecords |
| Match | id, opponent, kickoffAt, location, isHome, status, goalsFor, goalsAgainst, teamId | has many MatchLineups, has many MatchEvents |
| MatchLineup | id, matchId, playerId, role (starter/substitute), position, fieldX, fieldY | belongs to Player |
| MatchEvent | id, matchId, playerId, type (goal/assist/card/sub), minute | belongs to Player |
| Assessment | id, playerId, technique, tactics, physical, psychology, defense, attack, date | belongs to Player |
| MedicalRecord | id, playerId, condition, description, startDate, endDate (*string), severity, status | belongs to Player |
| TrainingSession | id, teamId, date, type, location | has many Attendances |
| Attendance | id, trainingSessionId, playerId, status | belongs to Player |

---

## 6. Особенности реализации (для диплома)

### 6.1. Нормализация ID
Backend генерирует поля в camelCase (`teamId`, `playerId`), но некоторые DTO возвращали `ID` в верхнем регистре. Решение: глобальный `normalizeIds` interceptor в API-клиенте, который рекурсивно заменяет `ID` → `id` во всех ответах.

### 6.2. Drag-and-drop на тактической доске
Проблема: нативный HTML5 DnD ненадёжен в React 18 (race condition `setState`, `dataTransfer` очищается, draggable элементы на поле блокируют `drop`).  
Решение: переход на `@dnd-kit/core` с `PointerSensor`, `pointerWithin` collision detection и `DragOverlay`.

### 6.3. Медицинские даты
Проблема: PostgreSQL тип `date` не принимает пустую строку `''` для ongoing травм.  
Решение: `StartDate`/`EndDate` изменены с `string` на `*string` (pointer), что позволяет передавать `NULL` в БД.

### 6.4. Пагинация по умолчанию
Backend возвращает 20 записей по умолчанию. Для страниц с полным списком игроков (составы, оценки, аналитика) frontend явно передаёт `limit: 100`.

### 6.5. Сидирование данных
Для демонстрации и тестирования создан богатый seeder: 50 игроков, 60 матчей, 72 тренировки, 300+ оценок, медкарты, события матчей, посещаемость. Все данные реалистичны (уникальные имена, разнообразные тренды формы, разные статусы посещаемости).

---

## 7. Структура проекта

```
football manager/
├── frontend/
│   ├── src/
│   │   ├── app/              # routing, store, providers
│   │   ├── entities/         # domain models (Player, Match, etc.)
│   │   ├── features/         # feature modules (lineup-builder, match-events, etc.)
│   │   ├── pages/            # page components
│   │   ├── shared/           # ui kit, api client, utils, types
│   │   └── widgets/          # reusable composite widgets
│   ├── package.json
│   └── vite.config.ts
├── backend/
│   ├── cmd/api/main.go       # entry point
│   ├── internal/
│   │   ├── domain/models.go  # GORM models
│   │   ├── dto/              # request/response DTOs
│   │   ├── handlers/         # HTTP handlers (Fiber)
│   │   ├── repository/       # data access layer
│   │   ├── service/          # business logic
│   │   └── middleware/       # auth, cors, logging
│   ├── seeds/seed.go         # database seeder
│   └── go.mod
└── PROJECT_CONTEXT.md        # этот файл
```

---

## 8. Как использовать этот контекст в веб-чате Kimi

1. Открой https://kimi.moonshot.cn
2. Создай новый чат
3. Вставь содержимое этого файла в первое сообщение
4. Добавь промпт, например:  
   *"Напиши теоретическую часть диплома на тему 'Разработка информационной системы для управления футбольной академией'. Используй предоставленный контекст проекта CoachOS. Структура: 1) Актуальность и цели, 2) Обзор аналогов, 3) Выбор технологического стека с обоснованием, 4) Архитектура системы, 5) Модель данных, 6) Описание ключевых модулей."*

---

## 9. Скриншоты / демо

Для диплома рекомендуется сделать скриншоты:
- Дашборд тренера
- Карточка игрока с формой
- Тактическая доска с составом
- Статистика матча
- Календарь тренировок

---

*Сгенерировано автоматически на основе актуального состояния кодовой базы.*
