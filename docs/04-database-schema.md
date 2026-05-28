# CoachOS — Database Schema

## Design Decisions

- **Identifiers**: UUID v4 (application-generated) — не раскрывают порядок записей, безопасны для публичных API
- **Soft Delete**: `deleted_at TIMESTAMPTZ NULL` на критичных сущностях (GORM soft delete)
- **Timestamps**: `created_at`, `updated_at` на всех таблицах
- **ENUMs**: реализованы как PostgreSQL `TYPE` для data integrity + читаемость
- **JSON fields**: `datatypes.JSON` (JSONB в PostgreSQL) для гибких метаданных

## Entity Relationship Overview

```
clubs
  ├── users (многие)
  │    ├── coach_profiles (1:1)
  │    └── parents (1:1)
  ├── teams (многие)
  │    ├── team_members (игроки в команде, composite PK)
  │    ├── training_sessions (многие)
  │    │    ├── training_blocks (многие)
  │    │    │    └── session_exercises (многие)
  │    │    └── attendance_records (многие)
  │    └── matches (многие)
  │         ├── match_lineups (composite PK)
  │         └── match_events
  └── players (многие)
       ├── player_assessments
       ├── player_goals
       └── player_parents (связь с родителями, composite PK)
```

## SQL DDL

### ENUM Types

```sql
CREATE TYPE user_role AS ENUM ('admin', 'coach', 'player', 'parent', 'analyst');

CREATE TYPE age_group AS ENUM (
  'U7','U8','U9','U10','U11','U12','U13','U14',
  'U15','U16','U17','U18','U19','U21','Senior'
);

CREATE TYPE player_position AS ENUM (
  'goalkeeper', 'defender', 'midfielder', 'forward', 'universal'
);

CREATE TYPE dominant_foot AS ENUM ('left', 'right', 'both');

CREATE TYPE session_status AS ENUM (
  'planned', 'in_progress', 'completed', 'cancelled'
);

CREATE TYPE session_intensity AS ENUM ('low', 'medium', 'high');

CREATE TYPE block_kind AS ENUM ('warmup', 'main', 'game', 'cooldown');

CREATE TYPE exercise_category AS ENUM (
  'technique', 'tactics', 'physical', 'coordination',
  'goalkeeping', 'warmup', 'cooldown'
);

CREATE TYPE attendance_status AS ENUM (
  'present', 'absent', 'late', 'excused', 'injured'
);

CREATE TYPE match_status AS ENUM (
  'scheduled', 'in_progress', 'completed', 'cancelled', 'postponed'
);

CREATE TYPE match_event_type AS ENUM (
  'goal', 'assist', 'yellow_card', 'red_card', 'sub_in', 'sub_out'
);

CREATE TYPE lineup_role AS ENUM ('starter', 'substitute');

CREATE TYPE goal_status AS ENUM ('active', 'achieved', 'paused', 'cancelled');

CREATE TYPE notification_type AS ENUM (
  'session_created', 'session_updated', 'session_cancelled',
  'attendance_marked', 'assessment_added', 'match_scheduled',
  'match_result', 'report_ready', 'general'
);

CREATE TYPE report_type AS ENUM ('player', 'team', 'attendance', 'progress');

CREATE TYPE ai_target_type AS ENUM ('player', 'team', 'session');

CREATE TYPE license_level AS ENUM ('none', 'grassroots', 'c', 'b', 'a', 'pro');

CREATE TYPE relation_type AS ENUM ('mother', 'father', 'guardian', 'other');
```

### Table: clubs

```sql
CREATE TABLE clubs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        VARCHAR(255) NOT NULL,
  country     VARCHAR(100),
  city        VARCHAR(100),
  logo_url    TEXT,
  founded_at  DATE,
  settings    JSONB DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at  TIMESTAMPTZ
);

CREATE INDEX idx_clubs_deleted_at ON clubs(deleted_at);
```

**Назначение**: Клуб/академия — корневая сущность. Все пользователи, команды, игроки принадлежат клубу.

### Table: users

```sql
CREATE TABLE users (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email          VARCHAR(255) NOT NULL UNIQUE,
  password_hash  TEXT NOT NULL,
  role           user_role NOT NULL DEFAULT 'player',
  club_id        UUID REFERENCES clubs(id) ON DELETE RESTRICT,
  first_name     VARCHAR(100) NOT NULL,
  last_name      VARCHAR(100) NOT NULL,
  phone          VARCHAR(20),
  avatar_url     TEXT,
  is_active      BOOLEAN NOT NULL DEFAULT TRUE,
  last_login_at  TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at     TIMESTAMPTZ
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_club_id_role ON users(club_id, role);
CREATE INDEX idx_users_deleted_at ON users(deleted_at);
```

**Назначение**: Базовая учётная запись. Роль определяет, какие части системы доступны.

### Table: refresh_tokens

```sql
CREATE TABLE refresh_tokens (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  family_id   UUID NOT NULL,
  token_hash  TEXT NOT NULL,
  expires_at  TIMESTAMPTZ NOT NULL,
  used_at     TIMESTAMPTZ,
  ip          VARCHAR(45),
  user_agent  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_family_id ON refresh_tokens(family_id);
CREATE INDEX idx_refresh_tokens_token_hash ON refresh_tokens(token_hash);
CREATE INDEX idx_refresh_tokens_expires_at ON refresh_tokens(expires_at);
```

**Назначение**: Хранение хешей refresh-токенов для rotation + family-based reuse detection.

### Table: coach_profiles

```sql
CREATE TABLE coach_profiles (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  license_level   license_level DEFAULT 'none',
  specialization  VARCHAR(100),
  bio             TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at      TIMESTAMPTZ
);

CREATE INDEX idx_coach_profiles_user_id ON coach_profiles(user_id);
```

### Table: teams

```sql
CREATE TABLE teams (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id        UUID NOT NULL REFERENCES clubs(id) ON DELETE RESTRICT,
  name           VARCHAR(255) NOT NULL,
  age_group      age_group,
  season         VARCHAR(20),
  head_coach_id  UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at     TIMESTAMPTZ
);

CREATE INDEX idx_teams_club_id ON teams(club_id);
CREATE INDEX idx_teams_head_coach_id ON teams(head_coach_id);
CREATE INDEX idx_teams_deleted_at ON teams(deleted_at);
```

### Table: players

```sql
CREATE TABLE players (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID REFERENCES users(id) ON DELETE SET NULL,
  club_id        UUID NOT NULL REFERENCES clubs(id) ON DELETE RESTRICT,
  first_name     VARCHAR(100) NOT NULL,
  last_name      VARCHAR(100) NOT NULL,
  birth_date     DATE,
  height_cm      NUMERIC(5,1),
  weight_kg      NUMERIC(5,1),
  dominant_foot  dominant_foot,
  position       player_position,
  medical_notes  TEXT,
  photo_url      TEXT,
  dev_index      NUMERIC(5,2) NOT NULL DEFAULT 0,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at     TIMESTAMPTZ
);

CREATE INDEX idx_players_club_id ON players(club_id);
CREATE INDEX idx_players_user_id ON players(user_id);
CREATE INDEX idx_players_birth_date ON players(birth_date);
CREATE INDEX idx_players_deleted_at ON players(deleted_at);
```

**Назначение**: Игрок — центральная сущность. `dev_index` кешируется и пересчитывается сервисом.

### Table: team_members

```sql
CREATE TABLE team_members (
  team_id        UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  player_id      UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  joined_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  jersey_number  SMALLINT,
  position       player_position,
  is_captain     BOOLEAN NOT NULL DEFAULT FALSE,
  PRIMARY KEY (team_id, player_id)
);

CREATE INDEX idx_team_members_team_id ON team_members(team_id);
CREATE INDEX idx_team_members_player_id ON team_members(player_id);
```

### Table: parents

```sql
CREATE TABLE parents (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID REFERENCES users(id) ON DELETE SET NULL,
  full_name  VARCHAR(200) NOT NULL,
  phone      VARCHAR(20),
  email      VARCHAR(255),
  relation   relation_type,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);
```

### Table: player_parents

```sql
CREATE TABLE player_parents (
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  parent_id UUID NOT NULL REFERENCES parents(id) ON DELETE CASCADE,
  PRIMARY KEY (player_id, parent_id)
);
```

### Table: exercises

```sql
CREATE TABLE exercises (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id      UUID REFERENCES clubs(id) ON DELETE CASCADE,
  name         VARCHAR(255) NOT NULL,
  category     exercise_category NOT NULL,
  difficulty   SMALLINT NOT NULL DEFAULT 1 CHECK (difficulty >= 1 AND difficulty <= 5),
  duration_min SMALLINT,
  players_min  SMALLINT,
  players_max  SMALLINT,
  equipment    TEXT[] DEFAULT '{}',
  description  TEXT,
  diagram_url  TEXT,
  tags         TEXT[] DEFAULT '{}',
  created_by   UUID REFERENCES users(id) ON DELETE SET NULL,
  is_global    BOOLEAN NOT NULL DEFAULT FALSE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at   TIMESTAMPTZ
);

CREATE INDEX idx_exercises_club_id ON exercises(club_id);
CREATE INDEX idx_exercises_category ON exercises(category);
CREATE INDEX idx_exercises_difficulty ON exercises(difficulty);
CREATE INDEX idx_exercises_is_global ON exercises(is_global);
CREATE INDEX idx_exercises_tags ON exercises USING GIN(tags);
CREATE INDEX idx_exercises_equipment ON exercises USING GIN(equipment);
```

### Table: training_sessions

```sql
CREATE TABLE training_sessions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id      UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  coach_id     UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_min SMALLINT,
  location     VARCHAR(255),
  status       session_status NOT NULL DEFAULT 'planned',
  intensity    session_intensity NOT NULL DEFAULT 'medium',
  focus        TEXT[] DEFAULT '{}',
  notes        TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at   TIMESTAMPTZ
);

CREATE INDEX idx_sessions_team_id_scheduled ON training_sessions(team_id, scheduled_at DESC);
CREATE INDEX idx_sessions_coach_id ON training_sessions(coach_id);
CREATE INDEX idx_sessions_status ON training_sessions(status);
CREATE INDEX idx_sessions_deleted_at ON training_sessions(deleted_at);
```

### Table: training_blocks

```sql
CREATE TABLE training_blocks (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id   UUID NOT NULL REFERENCES training_sessions(id) ON DELETE CASCADE,
  kind         block_kind NOT NULL,
  order_index  SMALLINT NOT NULL,
  duration_min SMALLINT,
  notes        TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_blocks_session_id ON training_blocks(session_id);
CREATE INDEX idx_blocks_order ON training_blocks(session_id, order_index);
```

### Table: session_exercises

```sql
CREATE TABLE session_exercises (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  block_id           UUID NOT NULL REFERENCES training_blocks(id) ON DELETE CASCADE,
  exercise_id        UUID NOT NULL REFERENCES exercises(id) ON DELETE RESTRICT,
  order_index        SMALLINT NOT NULL DEFAULT 0,
  duration_min       SMALLINT,
  sets               SMALLINT,
  reps               SMALLINT,
  intensity_override VARCHAR(10),
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_session_exercises_block_id ON session_exercises(block_id);
CREATE INDEX idx_session_exercises_exercise_id ON session_exercises(exercise_id);
```

### Table: attendance_records

```sql
CREATE TABLE attendance_records (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id  UUID NOT NULL REFERENCES training_sessions(id) ON DELETE CASCADE,
  player_id   UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  status      attendance_status NOT NULL DEFAULT 'present',
  reason      TEXT,
  marked_by   UUID REFERENCES users(id) ON DELETE SET NULL,
  marked_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (session_id, player_id)
);

CREATE INDEX idx_attendance_session_id ON attendance_records(session_id);
CREATE INDEX idx_attendance_player_id ON attendance_records(player_id);
CREATE INDEX idx_attendance_player_status ON attendance_records(player_id, status);
```

### Table: player_assessments

```sql
CREATE TABLE player_assessments (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id   UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  coach_id    UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  assessed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  technical   SMALLINT NOT NULL CHECK (technical >= 1 AND technical <= 10),
  physical    SMALLINT NOT NULL CHECK (physical >= 1 AND physical <= 10),
  tactical    SMALLINT NOT NULL CHECK (tactical >= 1 AND tactical <= 10),
  discipline  SMALLINT NOT NULL CHECK (discipline >= 1 AND discipline <= 10),
  teamwork    SMALLINT NOT NULL CHECK (teamwork >= 1 AND teamwork <= 10),
  notes       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_assessments_player_id_date ON player_assessments(player_id, assessed_at DESC);
CREATE INDEX idx_assessments_coach_id ON player_assessments(coach_id);
```

### Table: player_goals

```sql
CREATE TABLE player_goals (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id      UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  title          VARCHAR(255) NOT NULL,
  description    TEXT,
  target_metric  VARCHAR(100),
  target_value   NUMERIC(10,2),
  deadline       DATE,
  status         goal_status NOT NULL DEFAULT 'active',
  progress_pct   NUMERIC(5,2) NOT NULL DEFAULT 0,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_goals_player_id ON player_goals(player_id);
CREATE INDEX idx_goals_status ON player_goals(player_id, status);
```

### Table: matches

```sql
CREATE TABLE matches (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id        UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  opponent       VARCHAR(255) NOT NULL,
  kickoff_at     TIMESTAMPTZ NOT NULL,
  location       VARCHAR(255),
  is_home        BOOLEAN NOT NULL DEFAULT TRUE,
  status         match_status NOT NULL DEFAULT 'scheduled',
  goals_for      SMALLINT NOT NULL DEFAULT 0 CHECK (goals_for >= 0),
  goals_against  SMALLINT NOT NULL DEFAULT 0 CHECK (goals_against >= 0),
  notes          TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at     TIMESTAMPTZ
);

CREATE INDEX idx_matches_team_id ON matches(team_id);
CREATE INDEX idx_matches_kickoff ON matches(kickoff_at DESC);
CREATE INDEX idx_matches_status ON matches(status);
```

### Table: match_lineups

```sql
CREATE TABLE match_lineups (
  match_id       UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  player_id      UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  role           lineup_role NOT NULL,
  position       player_position,
  minutes_played SMALLINT DEFAULT 0,
  PRIMARY KEY (match_id, player_id)
);

CREATE INDEX idx_lineups_match_id ON match_lineups(match_id);
CREATE INDEX idx_lineups_player_id ON match_lineups(player_id);
```

### Table: match_events

```sql
CREATE TABLE match_events (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id  UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  player_id UUID REFERENCES players(id) ON DELETE SET NULL,
  minute    SMALLINT NOT NULL DEFAULT 0,
  type      match_event_type NOT NULL,
  notes     TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_match_events_match_id ON match_events(match_id);
CREATE INDEX idx_match_events_minute ON match_events(match_id, minute);
CREATE INDEX idx_match_events_player_id ON match_events(player_id);
```

### Table: notifications

```sql
CREATE TABLE notifications (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type       notification_type NOT NULL,
  title      VARCHAR(255) NOT NULL,
  body       TEXT,
  payload    JSONB DEFAULT '{}',
  read_at    TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_user_unread ON notifications(user_id, read_at) WHERE read_at IS NULL;
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);
```

### Table: reports

```sql
CREATE TABLE reports (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id         UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  type            report_type NOT NULL,
  scope_id        UUID,
  generated_by    UUID REFERENCES users(id) ON DELETE SET NULL,
  params          JSONB DEFAULT '{}',
  snapshot        JSONB DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_reports_club_id ON reports(club_id);
CREATE INDEX idx_reports_scope_id ON reports(scope_id);
```

### Table: ai_recommendations

```sql
CREATE TABLE ai_recommendations (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  target_type  ai_target_type NOT NULL,
  target_id    UUID NOT NULL,
  prompt       JSONB DEFAULT '{}',
  response     JSONB DEFAULT '{}',
  created_by   UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ai_target ON ai_recommendations(target_type, target_id);
CREATE INDEX idx_ai_created_by ON ai_recommendations(created_by);
```

### Table: audit_logs

```sql
CREATE TABLE audit_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id    UUID,
  action      VARCHAR(100) NOT NULL,
  entity_type VARCHAR(100) NOT NULL,
  entity_id   UUID,
  before      JSONB,
  after       JSONB,
  ip          VARCHAR(45),
  user_agent  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_actor_id ON audit_logs(actor_id);
CREATE INDEX idx_audit_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_created_at ON audit_logs USING BRIN(created_at);
```

## Player Development Index (PDI) Formula

```sql
-- PDI рассчитывается в application layer:
-- 
-- attendance_rate = COUNT(present) / COUNT(total_sessions) * 100
-- avg_assessment = AVG(technical + physical + tactical + discipline + teamwork) / 5
-- goals_achieved_rate = COUNT(achieved_goals) / COUNT(total_goals) * 100
--
-- PDI = (attendance_rate * 0.20) + (avg_assessment * 10 * 0.50) + (goals_achieved_rate * 0.30)
-- Нормировано в диапазоне 0–100
--
-- Интерпретация:
-- 0–39:  Требует внимания (красный)
-- 40–69: Развивается (жёлтый)
-- 70–100: Отличный прогресс (зелёный)
```

## Smart Training Load Formula

```sql
-- Load score за неделю:
-- load_score = SUM(duration_min * intensity_multiplier)
-- intensity_multiplier: low=0.6, medium=1.0, high=1.5
--
-- Пороги:
-- < 300: Нормальная нагрузка
-- 300–450: Высокая нагрузка (предупреждение)
-- > 450: Перегрузка (критическое предупреждение)
```
