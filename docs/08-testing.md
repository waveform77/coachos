# CoachOS — Testing Strategy

## Принцип: тестировать критичный путь, не всё подряд

Для MVP приоритет:
1. Auth flow (безопасность)
2. RBAC (кто что видит)
3. PDI расчёт (флагманская фича)
4. Business rules (нагрузка, оценки)
5. Handler integration (API контракт)

---

## Backend Testing

### Tools
- `testing` — стандартная библиотека Go
- `github.com/stretchr/testify` — assertions, require, mock
- `net/http/httptest` — HTTP handler testing
- `github.com/testcontainers/testcontainers-go` — реальная PostgreSQL в тестах
- `github.com/golang/mock` или `github.com/vektra/mockery` — mock generation

### 1. Unit Tests — Services

#### Auth Service
```go
// backend/tests/unit/auth_service_test.go
func TestAuthService_Register(t *testing.T) {
    // Arrange: mock UserRepository, mock RefreshTokenRepository
    // Act: Register(ctx, RegisterRequest{email, password, firstName, lastName, role})
    // Assert:
    //   - UserRepo.Create called with hashed password
    //   - access token returned
    //   - refresh token stored as hash
}

func TestAuthService_Login_WrongPassword(t *testing.T) {
    // Assert: ErrUnauthorized returned
}

func TestAuthService_Refresh_ReuseDetected(t *testing.T) {
    // Arrange: token already marked used
    // Assert: entire family revoked, ErrUnauthorized returned
}
```

#### Player Development Index
```go
// backend/tests/unit/player_service_test.go
func TestPlayerService_RecalculateDevIndex(t *testing.T) {
    testCases := []struct {
        name           string
        attendanceRate float64
        avgAssessment  float64
        goalsRate      float64
        expectedPDI    float64
    }{
        {"perfect", 100, 10, 100, 100},
        {"zero", 0, 0, 0, 0},
        {"average", 80, 6, 50, 0.8*20 + 0.6*50 + 0.5*30},
    }
    for _, tc := range testCases {
        t.Run(tc.name, func(t *testing.T) {
            pdi := CalculatePDI(tc.attendanceRate, tc.avgAssessment, tc.goalsRate)
            assert.InDelta(t, tc.expectedPDI, pdi, 0.01)
        })
    }
}
```

#### Smart Training Load
```go
func TestSessionService_SmartTrainingLoad(t *testing.T) {
    // Test load score calculation:
    // - low intensity (60min) = 60 * 0.6 = 36
    // - medium intensity (90min) = 90 * 1.0 = 90
    // - high intensity (120min) = 120 * 1.5 = 180
    // - overload threshold: > 450/week
}
```

#### Assessment Service
```go
func TestAssessmentService_Create_TriggersDevIndexRecalc(t *testing.T) {
    // Assert: after Create, PlayerRepo.UpdateDevIndex is called
}
```

### 2. Repository Tests (Integration)

Use testcontainers-go to spin up real PostgreSQL:

```go
// backend/tests/integration/user_repo_test.go
func TestUserRepository_Create(t *testing.T) {
    db := setupTestDB(t) // testcontainers PostgreSQL
    repo := postgres.NewUserRepository(db)
    
    user := &domain.User{Email: "test@test.com", ...}
    err := repo.Create(ctx, user)
    
    assert.NoError(t, err)
    assert.NotEmpty(t, user.ID)
    
    found, err := repo.FindByEmail(ctx, "test@test.com")
    assert.NoError(t, err)
    assert.Equal(t, user.ID, found.ID)
}

func TestUserRepository_FindByEmail_NotFound(t *testing.T) {
    // Assert: ErrNotFound returned
}
```

### 3. Handler Tests

```go
// backend/tests/handler/auth_handler_test.go
func TestAuthHandler_Login_Success(t *testing.T) {
    // Arrange: mock AuthService returning valid response
    app := setupTestApp()
    
    body := `{"email":"coach@test.com","password":"Test123!"}`
    req := httptest.NewRequest("POST", "/api/v1/auth/login", strings.NewReader(body))
    req.Header.Set("Content-Type", "application/json")
    
    resp, _ := app.Test(req)
    
    assert.Equal(t, 200, resp.StatusCode)
    // Assert response has access_token
    // Assert Set-Cookie header with refresh_token
}

func TestAuthHandler_Login_WrongPassword(t *testing.T) {
    // Assert: 401 response with error.code = "invalid_credentials"
}
```

### 4. RBAC Tests

```go
// backend/tests/middleware/rbac_test.go
func TestRequireRole_CoachCanAccessTeams(t *testing.T) {
    // Coach JWT → GET /api/v1/teams → 200
}

func TestRequireRole_PlayerCannotCreateSession(t *testing.T) {
    // Player JWT → POST /api/v1/sessions → 403
}

func TestRequireRole_ParentCannotSeeOtherChildData(t *testing.T) {
    // Parent JWT with childID=X → GET /api/v1/players/Y → 403
}
```

### Test Coverage Targets

| Package | Target Coverage |
|---|---|
| service/ | 70%+ |
| handler/ | 60%+ |
| repository/postgres/ | 50%+ |
| middleware/ | 80%+ |
| domain/ | 90%+ |

---

## Frontend Testing

### Tools
- `vitest` — unit/component testing (Vite-native, fast)
- `@testing-library/react` — component testing
- `@testing-library/jest-dom` — DOM assertions
- `@testing-library/user-event` — simulating user interactions
- `msw` (Mock Service Worker) — API mocking in tests
- `playwright` — E2E tests

### 1. Component Tests

#### Auth Forms
```typescript
// frontend/src/features/auth/__tests__/login-form.test.tsx
describe('LoginForm', () => {
  it('shows validation errors on empty submit', async () => {
    render(<LoginForm />)
    await userEvent.click(screen.getByRole('button', { name: /войти/i }))
    expect(screen.getByText(/email обязателен/i)).toBeInTheDocument()
  })
  
  it('calls onSuccess after successful login', async () => {
    server.use(http.post('/api/v1/auth/login', () => Response.json({...})))
    // fill form, submit, assert callback called
  })
})
```

#### StatCard
```typescript
describe('StatCard', () => {
  it('renders value and trend correctly', () => {
    render(<StatCard title="Игроков" value={42} trend={{ value: 5, direction: 'up' }} />)
    expect(screen.getByText('42')).toBeInTheDocument()
    expect(screen.getByText('+5%')).toBeInTheDocument()
  })
  
  it('shows skeleton when loading', () => {
    render(<StatCard loading />)
    expect(screen.getByTestId('stat-card-skeleton')).toBeInTheDocument()
  })
})
```

#### RoleGuard
```typescript
describe('RoleGuard', () => {
  it('renders children for allowed role', () => {
    mockAuthStore({ role: 'coach' })
    render(<RoleGuard roles={['coach', 'admin']}><div>Protected</div></RoleGuard>)
    expect(screen.getByText('Protected')).toBeInTheDocument()
  })
  
  it('renders fallback for disallowed role', () => {
    mockAuthStore({ role: 'player' })
    render(<RoleGuard roles={['coach']} fallback={<div>No access</div>}><div>Protected</div></RoleGuard>)
    expect(screen.queryByText('Protected')).not.toBeInTheDocument()
    expect(screen.getByText('No access')).toBeInTheDocument()
  })
})
```

### 2. Hook Tests

```typescript
// frontend/src/shared/lib/__tests__/hooks.test.ts
describe('useDebounce', () => {
  it('debounces value changes', async () => {
    const { result } = renderHook(() => useDebounce('initial', 300))
    expect(result.current).toBe('initial')
    act(() => { /* change value */ })
    expect(result.current).toBe('initial') // still debounced
    await waitFor(() => expect(result.current).toBe('new'))
  })
})
```

### 3. Form Validation Tests

```typescript
describe('PlayerForm validation', () => {
  it('requires first name', async () => { ... })
  it('validates birth date not in future', async () => { ... })
  it('validates height between 50-250cm', async () => { ... })
})
```

### 4. E2E Tests (Playwright)

```typescript
// frontend/tests/e2e/auth.spec.ts
test('coach can login and see command center', async ({ page }) => {
  await page.goto('/login')
  await page.fill('[name="email"]', 'coach@coachos.dev')
  await page.fill('[name="password"]', 'Coach123!')
  await page.click('button[type="submit"]')
  
  await expect(page).toHaveURL('/coach')
  await expect(page.getByText('Command Center')).toBeVisible()
})

test('player cannot access coach routes', async ({ page }) => {
  // login as player
  await page.goto('/coach/sessions')
  await expect(page).toHaveURL('/dashboard') // redirected
})

test('coach can create and complete a training session', async ({ page }) => {
  // E2E happy path: login → create session → add exercises → mark attendance → complete
})
```

### E2E Smoke Scenarios

| Scenario | Actor | Steps |
|---|---|---|
| Login + Dashboard | All roles | Login → see role-specific dashboard |
| Create Session | Coach | Create session → add blocks → add exercises → save |
| Mark Attendance | Coach | Open session → mark all players → save |
| Assess Player | Coach | Open player → create assessment → save |
| Schedule Match | Coach | Create match → set lineup → add events |
| View Progress | Player | Login → my progress → see charts |
| View Child | Parent | Login → child overview → see PDI |
| Generate AI Plan | Coach | AI assistant → enter goal → see plan |

---

## Running Tests

```bash
# Backend unit tests
cd backend && make test

# Backend integration tests (requires Docker)
cd backend && make test-integration

# Frontend unit tests
cd frontend && npm test

# Frontend E2E (requires running app)
cd frontend && npx playwright test

# All tests
make test-all
```
