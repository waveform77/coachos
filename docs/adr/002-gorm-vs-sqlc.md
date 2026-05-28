# ADR-002: GORM vs sqlc

**Статус**: Accepted  
**Дата**: 2024-01-01

## Контекст

Нужно выбрать инструмент для работы с PostgreSQL в Go backend.

## Варианты

1. **GORM** — full-featured ORM
2. **sqlc** — type-safe SQL code generation
3. **pgx raw** — чистый PostgreSQL драйвер

## Решение

**GORM для MVP**, **sqlc для аналитических запросов в post-MVP**

## Обоснование GORM

- Быстрая разработка 23 таблиц за дни вместо недель
- Soft delete из коробки (`gorm.DeletedAt`)
- BeforeCreate hooks для UUID генерации
- Automatic migrations в dev режиме
- Preloading для связей

## Недостатки GORM

- Reflection overhead
- Скрытые SQL запросы, сложно отлаживать N+1
- Менее type-safe чем sqlc

## Митигация

- Аналитические heavy-запросы через `db.Raw()` с явным SQL
- GORM logger в debug режиме для обнаружения N+1
- Лог медленных запросов (> 200ms)

## Миграционный путь

После MVP: аналитические endpoints переписать на sqlc для лучшей производительности и type safety. CRUD endpoints оставить на GORM.
