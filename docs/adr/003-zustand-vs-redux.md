# ADR-003: Zustand vs Redux Toolkit

**Статус**: Accepted  
**Дата**: 2024-01-01

## Контекст

Нужно выбрать state management решение для React frontend.

## Варианты

1. **Zustand** — минималистичный state manager
2. **Redux Toolkit** — полноценный state management
3. **Jotai** — atomic state management

## Решение

**Zustand**

## Обоснование

TanStack Query уже обрабатывает ~90% state приложения (server state: кэш запросов, invalidation, background updates).

Zustand нужен только для:
- Auth state: user, accessToken (session state)
- UI preferences: sidebarCollapsed, theme (UI state)
- Session Builder draft (local complex state)

Redux Toolkit был бы overkill:
- Lишний boilerplate (actions, reducers, selectors)
- Сложнее TS-эргономика для небольшого состояния
- Payload: +15KB в бандле

## Последствия

- Zustand: ~1KB after tree-shaking
- Простая и понятная API
- Легкий devtools
- При необходимости масштабирования: можно добавить Immer middleware
