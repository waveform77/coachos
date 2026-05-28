-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- ENUMS
-- ============================================================

CREATE TYPE role_enum AS ENUM ('admin', 'coach', 'player', 'parent', 'analyst');
CREATE TYPE age_group_enum AS ENUM ('U7','U8','U9','U10','U11','U12','U13','U14','U15','U16','U17','U18','U19','U21','Senior');
CREATE TYPE position_enum AS ENUM ('goalkeeper','defender','midfielder','forward','universal');
CREATE TYPE dominant_foot_enum AS ENUM ('left','right','both');
CREATE TYPE session_status_enum AS ENUM ('planned','in_progress','completed','cancelled');
CREATE TYPE session_intensity_enum AS ENUM ('low','medium','high');
CREATE TYPE block_kind_enum AS ENUM ('warmup','main','game','cooldown');
CREATE TYPE exercise_category_enum AS ENUM ('technique','tactics','physical','coordination','goalkeeping','warmup','cooldown');
CREATE TYPE attendance_status_enum AS ENUM ('present','absent','late','excused','injured');
CREATE TYPE match_status_enum AS ENUM ('scheduled','in_progress','completed','cancelled','postponed');
CREATE TYPE match_event_type_enum AS ENUM ('goal','assist','yellow_card','red_card','sub_in','sub_out');
CREATE TYPE lineup_role_enum AS ENUM ('starter','substitute');
CREATE TYPE goal_status_enum AS ENUM ('active','achieved','paused','cancelled');
CREATE TYPE notification_type_enum AS ENUM ('session_created','session_updated','session_cancelled','attendance_marked','assessment_added','match_scheduled','match_result','report_ready','general');
CREATE TYPE report_type_enum AS ENUM ('player','team','attendance','progress');
CREATE TYPE ai_target_type_enum AS ENUM ('player','team','session');
CREATE TYPE license_level_enum AS ENUM ('none','grassroots','c','b','a','pro');
CREATE TYPE relation_enum AS ENUM ('mother','father','guardian','other');

-- ============================================================
-- CLUBS
-- ============================================================

CREATE TABLE clubs (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name        VARCHAR(255) NOT NULL,
    country     VARCHAR(100),
    city        VARCHAR(100),
    logo_url    TEXT,
    founded_at  TIMESTAMPTZ,
    settings    JSONB,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at  TIMESTAMPTZ
);

CREATE INDEX idx_clubs_deleted_at ON clubs(deleted_at);

-- ============================================================
-- USERS
-- ============================================================

CREATE TABLE users (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email         VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role          VARCHAR(20)  NOT NULL DEFAULT 'player',
    club_id       UUID REFERENCES clubs(id),
    first_name    VARCHAR(100) NOT NULL,
    last_name     VARCHAR(100) NOT NULL,
    phone         VARCHAR(50),
    avatar_url    TEXT,
    is_active     BOOLEAN NOT NULL DEFAULT TRUE,
    last_login_at TIMESTAMPTZ,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at    TIMESTAMPTZ
);

CREATE UNIQUE INDEX idx_users_email ON users(email) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_club_id ON users(club_id);
CREATE INDEX idx_users_deleted_at ON users(deleted_at);

-- ============================================================
-- REFRESH TOKENS
-- ============================================================

CREATE TABLE refresh_tokens (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID NOT NULL REFERENCES users(id),
    family_id   UUID NOT NULL,
    token_hash  VARCHAR(255) NOT NULL,
    expires_at  TIMESTAMPTZ NOT NULL,
    used_at     TIMESTAMPTZ,
    ip          VARCHAR(50),
    user_agent  TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_family_id ON refresh_tokens(family_id);
CREATE UNIQUE INDEX idx_refresh_tokens_hash ON refresh_tokens(token_hash);

-- ============================================================
-- COACH PROFILES
-- ============================================================

CREATE TABLE coach_profiles (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    license_level   VARCHAR(20),
    specialization  TEXT,
    bio             TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at      TIMESTAMPTZ,
    CONSTRAINT uni_coach_profiles_user_id UNIQUE (user_id)
);

-- ============================================================
-- TEAMS
-- ============================================================

CREATE TABLE teams (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    club_id       UUID NOT NULL REFERENCES clubs(id),
    name          VARCHAR(255) NOT NULL,
    age_group     VARCHAR(10),
    season        VARCHAR(20),
    head_coach_id UUID REFERENCES users(id),
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at    TIMESTAMPTZ
);

CREATE INDEX idx_teams_club_id ON teams(club_id);
CREATE INDEX idx_teams_deleted_at ON teams(deleted_at);

-- ============================================================
-- PLAYERS
-- ============================================================

CREATE TABLE players (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id       UUID REFERENCES users(id),
    club_id       UUID NOT NULL REFERENCES clubs(id),
    first_name    VARCHAR(100) NOT NULL,
    last_name     VARCHAR(100) NOT NULL,
    birth_date    DATE,
    height_cm     REAL,
    weight_kg     REAL,
    dominant_foot VARCHAR(10),
    position      VARCHAR(20),
    medical_notes TEXT,
    photo_url     TEXT,
    dev_index     NUMERIC(5,2) DEFAULT 0,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at    TIMESTAMPTZ
);

CREATE INDEX idx_players_club_id ON players(club_id);
CREATE INDEX idx_players_deleted_at ON players(deleted_at);

-- ============================================================
-- TEAM MEMBERS
-- ============================================================

CREATE TABLE team_members (
    team_id       UUID NOT NULL REFERENCES teams(id),
    player_id     UUID NOT NULL REFERENCES players(id),
    joined_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    jersey_number INT,
    position      VARCHAR(20),
    is_captain    BOOLEAN NOT NULL DEFAULT FALSE,
    PRIMARY KEY (team_id, player_id)
);

-- ============================================================
-- PARENTS
-- ============================================================

CREATE TABLE parents (
    id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id    UUID REFERENCES users(id),
    full_name  VARCHAR(255) NOT NULL,
    phone      VARCHAR(50),
    email      VARCHAR(255),
    relation   VARCHAR(20),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- ============================================================
-- PLAYER PARENTS
-- ============================================================

CREATE TABLE player_parents (
    player_id UUID NOT NULL REFERENCES players(id),
    parent_id UUID NOT NULL REFERENCES parents(id),
    PRIMARY KEY (player_id, parent_id)
);

-- ============================================================
-- EXERCISES
-- ============================================================

CREATE TABLE exercises (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    club_id      UUID REFERENCES clubs(id),
    name         VARCHAR(255) NOT NULL,
    category     VARCHAR(20)  NOT NULL,
    difficulty   INT CHECK (difficulty >= 1 AND difficulty <= 5),
    duration_min INT,
    players_min  INT,
    players_max  INT,
    equipment    TEXT[],
    description  TEXT,
    diagram_url  TEXT,
    tags         TEXT[],
    created_by_id UUID REFERENCES users(id),
    is_global    BOOLEAN NOT NULL DEFAULT FALSE,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at   TIMESTAMPTZ
);

CREATE INDEX idx_exercises_club_id ON exercises(club_id);
CREATE INDEX idx_exercises_deleted_at ON exercises(deleted_at);
CREATE INDEX idx_exercises_tags ON exercises USING gin(tags);

-- ============================================================
-- TRAINING SESSIONS
-- ============================================================

CREATE TABLE training_sessions (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id      UUID NOT NULL REFERENCES teams(id),
    coach_id     UUID NOT NULL REFERENCES users(id),
    scheduled_at TIMESTAMPTZ NOT NULL,
    duration_min INT,
    location     VARCHAR(255),
    status       VARCHAR(20) NOT NULL DEFAULT 'planned',
    intensity    VARCHAR(10) NOT NULL DEFAULT 'medium',
    focus        TEXT[],
    notes        TEXT,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at   TIMESTAMPTZ
);

CREATE INDEX idx_training_sessions_team_id ON training_sessions(team_id);
CREATE INDEX idx_training_sessions_scheduled_at ON training_sessions(scheduled_at);
CREATE INDEX idx_training_sessions_deleted_at ON training_sessions(deleted_at);

-- ============================================================
-- TRAINING BLOCKS
-- ============================================================

CREATE TABLE training_blocks (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id   UUID NOT NULL REFERENCES training_sessions(id),
    kind         VARCHAR(20) NOT NULL,
    order_index  INT NOT NULL,
    duration_min INT,
    notes        TEXT,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at   TIMESTAMPTZ
);

CREATE INDEX idx_training_blocks_session_id ON training_blocks(session_id);

-- ============================================================
-- SESSION EXERCISES
-- ============================================================

CREATE TABLE session_exercises (
    id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    block_id           UUID NOT NULL REFERENCES training_blocks(id),
    exercise_id        UUID NOT NULL REFERENCES exercises(id),
    order_index        INT,
    duration_min       INT,
    sets               INT,
    reps               INT,
    intensity_override VARCHAR(50),
    created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at         TIMESTAMPTZ
);

CREATE INDEX idx_session_exercises_block_id ON session_exercises(block_id);

-- ============================================================
-- ATTENDANCE RECORDS
-- ============================================================

CREATE TABLE attendance_records (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id   UUID NOT NULL REFERENCES training_sessions(id),
    player_id    UUID NOT NULL REFERENCES players(id),
    status       VARCHAR(20) NOT NULL DEFAULT 'present',
    reason       TEXT,
    marked_by_id UUID REFERENCES users(id),
    marked_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at   TIMESTAMPTZ,
    UNIQUE(session_id, player_id)
);

CREATE INDEX idx_attendance_records_session_id ON attendance_records(session_id);
CREATE INDEX idx_attendance_records_player_id ON attendance_records(player_id);

-- ============================================================
-- PLAYER ASSESSMENTS
-- ============================================================

CREATE TABLE player_assessments (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    player_id   UUID NOT NULL REFERENCES players(id),
    coach_id    UUID NOT NULL REFERENCES users(id),
    assessed_at TIMESTAMPTZ NOT NULL,
    technical   INT CHECK (technical >= 1 AND technical <= 10),
    physical    INT CHECK (physical >= 1 AND physical <= 10),
    tactical    INT CHECK (tactical >= 1 AND tactical <= 10),
    discipline  INT CHECK (discipline >= 1 AND discipline <= 10),
    teamwork    INT CHECK (teamwork >= 1 AND teamwork <= 10),
    notes       TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at  TIMESTAMPTZ
);

CREATE INDEX idx_player_assessments_player_id ON player_assessments(player_id);

-- ============================================================
-- PLAYER GOALS
-- ============================================================

CREATE TABLE player_goals (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    player_id     UUID NOT NULL REFERENCES players(id),
    title         VARCHAR(255) NOT NULL,
    description   TEXT,
    target_metric VARCHAR(100),
    target_value  FLOAT,
    deadline      TIMESTAMPTZ,
    status        VARCHAR(20) NOT NULL DEFAULT 'active',
    progress_pct  NUMERIC(5,2) DEFAULT 0,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at    TIMESTAMPTZ
);

CREATE INDEX idx_player_goals_player_id ON player_goals(player_id);

-- ============================================================
-- MATCHES
-- ============================================================

CREATE TABLE matches (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id       UUID NOT NULL REFERENCES teams(id),
    opponent      VARCHAR(255) NOT NULL,
    kickoff_at    TIMESTAMPTZ NOT NULL,
    location      VARCHAR(255),
    is_home       BOOLEAN NOT NULL DEFAULT TRUE,
    status        VARCHAR(20) NOT NULL DEFAULT 'scheduled',
    goals_for     INT NOT NULL DEFAULT 0 CHECK (goals_for >= 0),
    goals_against INT NOT NULL DEFAULT 0 CHECK (goals_against >= 0),
    notes         TEXT,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at    TIMESTAMPTZ
);

CREATE INDEX idx_matches_team_id ON matches(team_id);

-- ============================================================
-- MATCH LINEUPS
-- ============================================================

CREATE TABLE match_lineups (
    match_id       UUID NOT NULL REFERENCES matches(id),
    player_id      UUID NOT NULL REFERENCES players(id),
    role           VARCHAR(20) NOT NULL,
    position       VARCHAR(20),
    minutes_played INT NOT NULL DEFAULT 0,
    PRIMARY KEY (match_id, player_id)
);

-- ============================================================
-- MATCH EVENTS
-- ============================================================

CREATE TABLE match_events (
    id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    match_id   UUID NOT NULL REFERENCES matches(id),
    player_id  UUID REFERENCES players(id),
    minute     INT NOT NULL DEFAULT 0,
    type       VARCHAR(20) NOT NULL,
    notes      TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_match_events_match_id ON match_events(match_id);

-- ============================================================
-- NOTIFICATIONS
-- ============================================================

CREATE TABLE notifications (
    id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id    UUID NOT NULL REFERENCES users(id),
    type       VARCHAR(40) NOT NULL,
    title      VARCHAR(255) NOT NULL,
    body       TEXT,
    payload    JSONB,
    read_at    TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_read_at ON notifications(read_at);

-- ============================================================
-- REPORTS
-- ============================================================

CREATE TABLE reports (
    id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    club_id          UUID NOT NULL REFERENCES clubs(id),
    type             VARCHAR(20) NOT NULL,
    scope_id         UUID,
    generated_by_id  UUID REFERENCES users(id),
    params           JSONB,
    snapshot         JSONB,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at       TIMESTAMPTZ
);

CREATE INDEX idx_reports_club_id ON reports(club_id);

-- ============================================================
-- AI RECOMMENDATIONS
-- ============================================================

CREATE TABLE ai_recommendations (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    target_type   VARCHAR(20) NOT NULL,
    target_id     UUID NOT NULL,
    prompt        JSONB,
    response      JSONB,
    created_by_id UUID REFERENCES users(id),
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at    TIMESTAMPTZ
);

CREATE INDEX idx_ai_recommendations_target_id ON ai_recommendations(target_id);

-- ============================================================
-- AUDIT LOGS
-- ============================================================

CREATE TABLE audit_logs (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    actor_id    UUID REFERENCES users(id),
    action      VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id   UUID,
    before      JSONB,
    after       JSONB,
    ip          VARCHAR(50),
    user_agent  TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_actor_id ON audit_logs(actor_id);
CREATE INDEX idx_audit_logs_entity_id ON audit_logs(entity_id);
