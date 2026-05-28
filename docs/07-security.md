# CoachOS — Security Checklist

## Критически важно: система работает с данными несовершеннолетних

По GDPR и российскому законодательству о персональных данных (149-ФЗ, 152-ФЗ), данные детей требуют особой защиты. Родители должны давать согласие на обработку данных ребёнка.

---

## 1. Аутентификация

### Пароли
- [x] bcrypt с cost=12 (стандарт для production)
- [x] Минимальная длина пароля: 8 символов
- [x] Проверка сложности: буквы + цифры
- [ ] TODO: rate limiting на /auth/login (5 попыток / 15 мин)
- [ ] TODO: lockout аккаунта после 10 неудачных попыток

### JWT Access Token
- [x] Алгоритм: HS256 (HMAC-SHA256)
- [x] Срок действия: 15 минут
- [x] Хранение на клиенте: только в памяти (Zustand), НЕ в localStorage
- [x] Защита от XSS: токен не доступен из JavaScript cookie
- [x] Claims: userID, email, role, clubID, exp, iat, jti

### Refresh Token
- [x] Срок действия: 7 дней
- [x] Хранение: httpOnly cookie (Secure + SameSite=Lax)
- [x] В БД хранится только bcrypt-хеш, не сам токен
- [x] Rotation: каждое обновление выдаёт новый токен
- [x] Family-based reuse detection: если использован повторно — ревокируем всю семью
- [x] IP и User-Agent записываются для аудита

---

## 2. Авторизация (RBAC)

- [x] 5 ролей: admin, coach, player, parent, analyst
- [x] Роль хранится в JWT claims + проверяется из БД на чувствительных операциях
- [x] RequireRole middleware на каждом защищённом маршруте
- [x] Club-based scoping: пользователь видит данные только своего клуба
- [x] Player scoping: тренер может оценивать только игроков своих команд
- [ ] TODO: Row-Level Security (RLS) в PostgreSQL — post-MVP

### RBAC матрица (ключевые операции)

| Операция | admin | coach | player | parent | analyst |
|---|:---:|:---:|:---:|:---:|:---:|
| Создать клуб | ✓ | | | | |
| Управлять командами | ✓ | ✓ | | | |
| Создать тренировку | ✓ | ✓ | | | |
| Оценить игрока | | ✓ | | | |
| Смотреть свой профиль | ✓ | ✓ | ✓ | | |
| Смотреть профиль ребёнка | | | | ✓ | |
| Аналитика клуба | ✓ | ✓ | | | ✓ |
| Удалить данные | ✓ | | | | |

---

## 3. Transport Security

- [x] HTTPS обязателен в production (Caddy auto TLS)
- [x] CORS: явный whitelist origins (не `*`)
- [x] CORS: allowed methods: GET, POST, PUT, PATCH, DELETE, OPTIONS
- [x] CORS: allowed headers: Content-Type, Authorization
- [x] CORS: credentials: true (для cookie)
- [ ] TODO: HSTS header в production
- [ ] TODO: Content-Security-Policy header

---

## 4. Rate Limiting

- [x] 100 requests/min per IP (Fiber rate limiter)
- [ ] TODO: Отдельные, более строгие лимиты на /auth/login и /auth/register
- [ ] TODO: Redis-based distributed rate limiting для multi-instance деплоя

---

## 5. Input Validation

- [x] Все DTO валидируются go-playground/validator/v10
- [x] UUID параметры валидируются перед запросом в БД
- [x] ENUM поля: только допустимые значения
- [x] Числовые поля: min/max constraints
- [x] Строковые поля: maxLength ограничения
- [x] SQL injection: GORM использует parameterized queries
- [ ] TODO: Sanitization HTML в полях с rich text (medical_notes, bio)

---

## 6. XSS Protection

- [x] Access token не в localStorage (главная защита от XSS)
- [x] Fiber не рендерит HTML, чистый JSON API
- [ ] TODO: CSP headers на frontend
- [ ] TODO: DOMPurify для user-generated content в UI

---

## 7. CSRF Considerations

- Refresh token в SameSite=Lax cookie — защита от CSRF для простых запросов
- API использует JSON с `Content-Type: application/json` — браузеры не отправляют такие preflight без явного кода
- SameSite=Lax защищает GET, SameSite=Strict для полной защиты POST
- [ ] TODO: Рассмотреть SameSite=Strict для refresh cookie

---

## 8. Secrets Management

- [x] JWT_SECRET: длина ≥ 32 байт, случайный
- [x] Все секреты через ENV variables, не в коде
- [x] .env.example без реальных значений
- [x] .gitignore включает .env файлы
- [ ] TODO: Rotation процедура для JWT_SECRET (с grace period)
- [ ] TODO: HashiCorp Vault или аналог для production

---

## 9. Audit Logging

- [x] audit_logs таблица: actor, action, entity, before/after, ip, user_agent
- [x] BRIN индекс на created_at для эффективных временных запросов
- [ ] TODO: Автоматическое логирование через GORM хуки или middleware
- [ ] TODO: Retention policy (хранить X дней, затем архивировать)

---

## 10. GDPR / Защита данных детей

### Особые требования для детских данных

Футбольные академии работают с детьми от 7 лет. По GDPR (статья 8) и российскому 152-ФЗ:

**Обязательно:**
- [ ] Явное согласие родителей/опекунов на обработку данных ребёнка
- [ ] Возможность родителя запросить удаление данных ребёнка
- [ ] Минимизация данных: собирать только необходимое
- [ ] Ограничение доступа: медицинские заметки видит только тренер и admin
- [ ] Срок хранения: данные должны удаляться по запросу

**Реализовано:**
- [x] Soft delete (deleted_at) на всех критичных сущностях
- [x] medical_notes видны только coach и admin (RBAC)
- [x] player_parents связь — родитель видит только своего ребёнка

**TODO:**
- [ ] Consent management (согласие при регистрации)
- [ ] Data export endpoint (право на переносимость)
- [ ] Right to erasure — hard delete с каскадом
- [ ] Data retention policy (автоудаление через X лет)
- [ ] Шифрование medical_notes в БД (column-level encryption)
- [ ] Privacy policy и Terms of Service

---

## 11. Production Security Checklist

Перед деплоем на production:

- [ ] Сменить все дефолтные пароли
- [ ] JWT_SECRET: криптографически случайный, ≥ 64 символа
- [ ] DB_PASSWORD: сложный, уникальный
- [ ] Отключить AutoMigrate в production
- [ ] Включить SSL для PostgreSQL
- [ ] Закрыть порт PostgreSQL (5432) от внешнего доступа
- [ ] Включить файрвол (ufw или аналог)
- [ ] Настроить log aggregation (Loki/ELK)
- [ ] Настроить alerting на 5xx errors, auth failures
- [ ] Запустить нагрузочное тестирование
- [ ] Провести security scan (gosec, semgrep)

---

## 12. Dependency Security

- [ ] Regular `go list -m -u all` для обновлений
- [ ] `npm audit` для frontend
- [ ] Dependabot или Renovate для автоматических PR с обновлениями
- [ ] Docker образы: использовать конкретные теги, не `latest`
- [ ] Сканирование образов (Trivy или Snyk)
