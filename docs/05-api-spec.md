# CoachOS — API Specification

## Base URL
```
/api/v1
```

## Authentication
All protected endpoints require:
```
Authorization: Bearer <access_token>
```
Refresh token is sent automatically via httpOnly cookie.

## Response Format

### Success
```json
{
  "data": { ... }
}
```
Or for lists:
```json
{
  "data": [...],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 150
  }
}
```

### Error
```json
{
  "error": {
    "code": "user_not_found",
    "message": "User with ID xxx not found",
    "details": null
  }
}
```

---

## Auth Endpoints

### POST /auth/register
**Access**: Public

**Request**:
```json
{
  "email": "coach@academy.com",
  "password": "SecurePass123!",
  "firstName": "Ivan",
  "lastName": "Petrov",
  "role": "coach",
  "clubID": "uuid-optional"
}
```

**Response** `201`:
```json
{
  "accessToken": "eyJ...",
  "user": {
    "id": "uuid",
    "email": "coach@academy.com",
    "role": "coach",
    "firstName": "Ivan",
    "lastName": "Petrov",
    "isActive": true,
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```
+ Set-Cookie: refresh_token=... HttpOnly Secure SameSite=Lax

**Errors**: 400 validation, 409 email already exists

---

### POST /auth/login
**Access**: Public

**Request**:
```json
{ "email": "coach@academy.com", "password": "SecurePass123!" }
```

**Response** `200`: Same as register

**Errors**: 401 invalid credentials, 403 account inactive

---

### POST /auth/refresh
**Access**: Public (cookie required)

**Response** `200`:
```json
{ "accessToken": "eyJ..." }
```
+ new refresh cookie

**Errors**: 401 invalid/expired/reused token

---

### POST /auth/logout
**Access**: Authenticated

**Response** `204`: No content + Clear-Cookie

---

### GET /auth/me
**Access**: Authenticated

**Response** `200`: User object

---

## Players Endpoints

### GET /players
**Access**: admin, coach
**Query**: `?clubID=uuid&position=midfielder&page=1&limit=20`

**Response** `200`: Paginated list of PlayerResponse

### POST /players
**Access**: admin, coach

**Request**:
```json
{
  "firstName": "Dmitry",
  "lastName": "Ivanov",
  "birthDate": "2010-05-15",
  "position": "midfielder",
  "dominantFoot": "right",
  "heightCm": 165,
  "weightKg": 58,
  "clubID": "uuid"
}
```

### GET /players/:id
**Access**: auth (own for player, child for parent)
**Response**: PlayerResponse

### PATCH /players/:id
**Access**: admin, coach
**Request**: Partial PlayerResponse fields

### DELETE /players/:id
**Access**: admin

### GET /players/:id/profile
**Access**: auth
**Response**:
```json
{
  "player": { ... },
  "latestAssessment": { "technical": 8, "physical": 7, ... },
  "devIndex": 72.5,
  "goalsCount": { "active": 3, "achieved": 5, "total": 8 },
  "attendanceRate": 85.5,
  "teamMemberships": [{ "teamID": "...", "teamName": "U15A" }]
}
```

### GET /players/:id/progress
**Access**: auth
**Query**: `?from=2024-01-01&to=2024-12-31`
**Response**:
```json
{
  "assessmentHistory": [...],
  "devIndexHistory": [
    { "date": "2024-01-15", "value": 65.2 },
    { "date": "2024-02-20", "value": 68.5 }
  ],
  "goalsProgress": [...]
}
```

### GET /players/:id/dev-index
**Access**: auth
**Response**: `{ "devIndex": 72.5, "breakdown": { "attendance": 0.85, "assessment": 0.78, "goals": 0.60 }, "trend": "rising" }`

### GET /players/:id/attendance
**Access**: auth
**Query**: `?page=1&limit=20`
**Response**: Paginated list of AttendanceRecord

---

## Teams Endpoints

### GET /teams
**Access**: auth
**Query**: `?clubID=uuid`
**Response**: Paginated list of TeamResponse

### POST /teams
**Access**: admin, coach
**Request**: `{ "clubID": "uuid", "name": "U15 Alpha", "ageGroup": "U15", "season": "2024/25", "headCoachID": "uuid" }`

### GET /teams/:id
**Response**: TeamResponse with member count

### GET /teams/:id/dashboard
**Access**: admin, coach
**Response**: `{ "playerCount": 18, "avgAttendance": 82.5, "avgDevIndex": 65.3, "upcomingSessions": 3, "recentMatches": [...] }`

### POST /teams/:id/members
**Access**: coach, admin
**Request**: `{ "playerID": "uuid", "jerseyNumber": 10, "position": "midfielder", "isCaptain": false }`

### DELETE /teams/:id/members/:playerID
**Access**: coach, admin

---

## Training Sessions Endpoints

### GET /sessions
**Access**: auth
**Query**: `?teamID=uuid&from=date&to=date&status=planned&page=1&limit=20`

### POST /sessions
**Access**: coach
**Request**:
```json
{
  "teamID": "uuid",
  "scheduledAt": "2024-06-15T10:00:00Z",
  "durationMin": 90,
  "location": "Main Field",
  "intensity": "medium",
  "focus": ["pressing", "passing"],
  "notes": "Focus on high press"
}
```

### GET /sessions/:id
**Response**: SessionDetailResponse (with blocks + exercises)

### POST /sessions/:id/blocks
**Access**: coach
**Request**: `{ "kind": "warmup", "orderIndex": 0, "durationMin": 15, "notes": "..." }`

### POST /sessions/:id/blocks/:blockID/exercises
**Access**: coach
**Request**: `{ "exerciseID": "uuid", "orderIndex": 0, "durationMin": 10, "sets": 3, "reps": 10 }`

### PATCH /sessions/:id/attendance
**Access**: coach
**Request**:
```json
{
  "records": [
    { "playerID": "uuid1", "status": "present" },
    { "playerID": "uuid2", "status": "absent", "reason": "illness" }
  ]
}
```

### POST /sessions/:id/complete
**Access**: coach
**Response**: `{ "message": "Session completed", "notifications": 18 }` (sends notifications to all team members)

---

## Exercises Endpoints

### GET /exercises
**Access**: auth
**Query**: `?category=technique&difficulty=3&tags=dribbling,passing&search=cone&global=true&page=1&limit=20`

### POST /exercises
**Access**: coach, admin
**Request**:
```json
{
  "name": "Cone Dribbling",
  "category": "technique",
  "difficulty": 3,
  "durationMin": 10,
  "playersMin": 1,
  "playersMax": 5,
  "equipment": ["cones", "ball"],
  "description": "...",
  "tags": ["dribbling", "footwork"]
}
```

---

## Assessments Endpoints

### POST /assessments
**Access**: coach
**Request**:
```json
{
  "playerID": "uuid",
  "technical": 7,
  "physical": 8,
  "tactical": 6,
  "discipline": 9,
  "teamwork": 8,
  "notes": "Great improvement in pressing"
}
```

### GET /players/:id/assessments
**Access**: auth
**Response**: Paginated list + trend data

### GET /teams/:id/assessments-summary
**Access**: coach, admin
**Response**: List of PlayerAssessmentSummary with averages

---

## Matches Endpoints

### GET /matches
**Access**: auth
**Query**: `?teamID=uuid&status=scheduled&page=1&limit=20`

### POST /matches
**Access**: coach
**Request**: `{ "teamID": "uuid", "opponent": "FC Spartak Youth", "kickoffAt": "2024-06-20T15:00:00Z", "location": "Home Stadium", "isHome": true }`

### PUT /matches/:id/lineup
**Access**: coach
**Request**:
```json
{
  "lineup": [
    { "playerID": "uuid1", "role": "starter", "position": "goalkeeper" },
    { "playerID": "uuid2", "role": "starter", "position": "defender" }
  ]
}
```

### POST /matches/:id/events
**Access**: coach
**Request**: `{ "playerID": "uuid", "minute": 35, "type": "goal", "notes": "Header from corner" }`

### GET /matches/:id/summary
**Response**:
```json
{
  "match": { ... },
  "lineup": [...],
  "events": [...],
  "playerStats": [
    { "playerID": "uuid", "playerName": "...", "goals": 1, "assists": 0, "yellowCards": 0, "redCards": 0, "minutesPlayed": 90 }
  ]
}
```

---

## Analytics Endpoints

### GET /analytics/coach-dashboard
**Access**: coach, admin
**Response**:
```json
{
  "todaysSessions": [...],
  "absentToday": [{ "player": {...}, "reason": "illness" }],
  "playersAtRisk": [
    { "player": {...}, "attendanceRate": 45.0, "devIndexTrend": "falling", "lastAssessmentDays": 45 }
  ],
  "upcomingSessions": [...],
  "teamStats": [
    { "teamID": "...", "teamName": "U15A", "playerCount": 18, "avgAttendance": 82.0, "avgDevIndex": 65.5 }
  ]
}
```

### GET /analytics/team/:id
**Access**: coach, admin, analyst
**Query**: `?from=date&to=date`
**Response**:
```json
{
  "attendanceByWeek": [{ "week": "2024-W23", "rate": 85.0 }],
  "avgAssessments": { "technical": 7.2, "physical": 6.8, ... },
  "trainingLoad": [{ "week": "2024-W23", "loadScore": 320, "sessionCount": 3 }],
  "topPlayers": [{ "player": {...}, "devIndex": 88.5 }]
}
```

### GET /analytics/player/:id
**Access**: auth
**Response**: PlayerAnalytics (assessment timeline, attendance history, goals progress, devIndex history)

### GET /analytics/training-load
**Access**: coach
**Query**: `?teamID=uuid&weeks=8`
**Response**: Training load by week with overload warnings

---

## AI Assistant Endpoints

### POST /ai/training-plan
**Access**: coach
**Request**:
```json
{
  "teamID": "uuid",
  "goal": "improve pressing",
  "durationMin": 90,
  "focusAreas": ["tactics", "physical"]
}
```
**Response**:
```json
{
  "plan": {
    "title": "High Press Training Session",
    "overview": "Focus on coordinated pressing triggers...",
    "blocks": [
      {
        "kind": "warmup",
        "durationMin": 15,
        "exercises": ["Rondo 5v2", "Dynamic Stretching"],
        "notes": "Activate pressing movements"
      }
    ],
    "totalLoad": 380,
    "tips": ["Keep sessions intense but short", "Rest between high-intensity reps"]
  },
  "savedRecommendationID": "uuid"
}
```

### POST /ai/recommend-exercises
**Access**: coach
**Request**: `{ "playerID": "uuid", "weakSkill": "technical" }`
**Response**: List of ExerciseRecommendation with reasons

### POST /ai/analyze-player
**Access**: coach
**Request**: `{ "playerID": "uuid" }`
**Response**: AnalyzePlayerResponse with strengths, weaknesses, recommendations

### POST /ai/summarize-progress
**Access**: coach, parent
**Request**: `{ "playerID": "uuid", "periodDays": 30 }`
**Response**: Human-readable progress summary

---

## Notifications Endpoints

### GET /notifications
**Access**: self
**Query**: `?unreadOnly=true&page=1&limit=20`

### PATCH /notifications/:id/read
**Access**: self

### PATCH /notifications/read-all
**Access**: self
