# CoachOS — Performance Optimization Guide

## Backend Optimizations

### 1. Database Indexes (Implemented)

Critical indexes already in migration:
```sql
-- Most important for query performance:
CREATE INDEX idx_sessions_team_id_scheduled ON training_sessions(team_id, scheduled_at DESC);
CREATE INDEX idx_attendance_player_status ON attendance_records(player_id, status);
CREATE INDEX idx_assessments_player_id_date ON player_assessments(player_id, assessed_at DESC);
CREATE INDEX idx_notifications_user_unread ON notifications(user_id, read_at) WHERE read_at IS NULL;
CREATE INDEX idx_exercises_tags ON exercises USING GIN(tags);
CREATE INDEX idx_audit_created_at ON audit_logs USING BRIN(created_at);
```

**Partial index** на notifications (WHERE read_at IS NULL) — запрос непрочитанных быстр даже при большом количестве прочитанных.

**BRIN индекс** на audit_logs — для временных данных с монотонным ростом.

**GIN индекс** на exercises.tags — для overlap-запросов массивов.

### 2. Pagination на всех list endpoints

```go
// Все list endpoints принимают page/limit
// Default: page=1, limit=20, max=100
// Никогда не делать SELECT без LIMIT в production
type PaginationQuery struct {
    Page  int `query:"page" validate:"min=1" default:"1"`
    Limit int `query:"limit" validate:"min=1,max=100" default:"20"`
}
```

### 3. N+1 Prevention

**Проблема**: GORM может генерировать N+1 при загрузке associations.

**Решение**: явный Preload:
```go
// Плохо (N+1):
db.Find(&sessions)
for _, s := range sessions { db.Find(&s.Blocks) } // N queries!

// Хорошо:
db.Preload("Blocks.Exercises.Exercise").
   Where("team_id = ?", teamID).
   Find(&sessions) // 1 query per level = 4 total
```

### 4. Analytics Queries — Raw SQL

Heavy analytics запросы не через GORM ORM:
```go
// Посещаемость команды за период
query := `
    SELECT 
        p.id,
        p.first_name || ' ' || p.last_name AS player_name,
        COUNT(*) FILTER (WHERE ar.status = 'present') AS present,
        COUNT(*) AS total,
        ROUND(100.0 * COUNT(*) FILTER (WHERE ar.status = 'present') / COUNT(*), 1) AS rate
    FROM team_members tm
    JOIN players p ON p.id = tm.player_id
    LEFT JOIN attendance_records ar ON ar.player_id = p.id
        AND ar.session_id IN (
            SELECT id FROM training_sessions 
            WHERE team_id = $1 AND scheduled_at BETWEEN $2 AND $3
        )
    WHERE tm.team_id = $1
    GROUP BY p.id, player_name
    ORDER BY rate DESC
`
```

### 5. Connection Pool Configuration

```go
sqlDB, _ := db.DB()
sqlDB.SetMaxOpenConns(25)
sqlDB.SetMaxIdleConns(5)
sqlDB.SetConnMaxLifetime(30 * time.Minute)
sqlDB.SetConnMaxIdleTime(10 * time.Minute)
```

### 6. JSON Serialization

- Использовать `json.Marshal` только в хендлерах (не в сервисах)
- Fiber: `c.JSON()` автоматически использует fastjson
- Не включать nested objects без необходимости в list-responses

### 7. AI Response Caching (In-Memory LRU)

```go
// AI запросы одинаковые повторяются — кешируем
type AICache struct {
    mu    sync.RWMutex
    cache map[string]*CacheEntry
    maxSize int
}
// Key: hash(request params)
// TTL: 1 hour
// LRU eviction при достижении maxSize
```

---

## Frontend Optimizations

### 1. Code Splitting (Lazy Loading)

Все страницы lazy-loaded в роутере:
```typescript
// router/index.tsx
const CoachCommandCenter = lazy(() => import('@/pages/coach/command-center.page'))
const Calendar = lazy(() => import('@/pages/coach/calendar.page'))
// FullCalendar и Recharts загружаются только при посещении соответствующих страниц
```

**FullCalendar** (~150KB) только на calendar page.  
**Recharts** (~70KB) только на analytics pages.

### 2. TanStack Query Cache Strategy

```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,  // 5 min — reference data (exercises, teams)
      gcTime: 10 * 60 * 1000,    // 10 min in cache after unmount
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

// Короткий stale для real-time данных
const attendanceQuery = useQuery({
  ...queryKeys.attendance.bySession(sessionId),
  staleTime: 30 * 1000, // 30 sec — посещаемость меняется часто
})
```

### 3. Optimistic Updates

```typescript
// Отметка посещаемости — мгновенный UI update
const markAttendance = useMutation({
  mutationFn: attendanceApi.markAttendance,
  onMutate: async (newRecord) => {
    await queryClient.cancelQueries(queryKeys.attendance.bySession(sessionId))
    const previous = queryClient.getQueryData(queryKeys.attendance.bySession(sessionId))
    
    queryClient.setQueryData(
      queryKeys.attendance.bySession(sessionId),
      (old: AttendanceRecord[]) =>
        old.map(r => r.playerID === newRecord.playerID 
          ? { ...r, status: newRecord.status } 
          : r
        )
    )
    return { previous }
  },
  onError: (_, __, context) => {
    queryClient.setQueryData(queryKeys.attendance.bySession(sessionId), context?.previous)
  },
  onSettled: () => {
    queryClient.invalidateQueries(queryKeys.attendance.bySession(sessionId))
  },
})
```

### 4. Table Virtualization

Для списков > 100 элементов:
```typescript
import { useVirtualizer } from '@tanstack/react-virtual'

function PlayersList({ players }: { players: Player[] }) {
  const parentRef = useRef<HTMLDivElement>(null)
  const rowVirtualizer = useVirtualizer({
    count: players.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 60, // row height px
    overscan: 10,
  })
  // Render only visible rows
}
```

### 5. Memoization

```typescript
// Expensive calculations
const playerStats = useMemo(
  () => calculateTeamStats(players, assessments, attendance),
  [players, assessments, attendance]
)

// Stable callback references
const handleAttendanceChange = useCallback(
  (playerID: string, status: AttendanceStatus) => {
    updateAttendance({ playerID, status })
  },
  [updateAttendance]
)

// List items
const PlayerCard = memo(({ player }: { player: Player }) => { ... })
```

### 6. Image Optimization

```typescript
// Lazy load avatars
<img 
  src={player.photoURL} 
  loading="lazy"
  decoding="async"
  alt={getInitials(player.firstName, player.lastName)}
/>

// Fallback to initials avatar if no photo
{player.photoURL ? (
  <img src={player.photoURL} loading="lazy" />
) : (
  <AvatarFallback>{getInitials(player.firstName, player.lastName)}</AvatarFallback>
)}
```

### 7. Debounced Search

```typescript
// Не отправлять запрос на каждый keystroke
function ExerciseSearch() {
  const [query, setQuery] = useState('')
  const debouncedQuery = useDebounce(query, 300) // 300ms delay
  
  const { data } = useQuery({
    ...queryKeys.exercises.list({ search: debouncedQuery }),
    enabled: debouncedQuery.length >= 2,
  })
}
```

---

## Performance Monitoring

### Backend
- GORM slow query log (> 200ms): включить в config
- zerolog latency tracking на каждый запрос
- Prometheus metrics (post-MVP): request duration, DB pool utilization

### Frontend
- Chrome DevTools Performance tab
- React DevTools Profiler
- Lighthouse audit target: LCP < 2.5s, FID < 100ms, CLS < 0.1
- Bundle analyzer: `npm run build -- --analyze`

---

## Post-MVP Optimizations

1. **Redis кэш** для аналитики (TTL=10min) — самый высокий ROI
2. **Read replicas** PostgreSQL для analytics queries
3. **CDN** для статических assets
4. **HTTP/2** через Caddy (уже поддерживается)
5. **Database partitioning** для audit_logs и attendance_records по created_at
