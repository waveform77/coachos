-- ============================================================
-- PARENT INVITATIONS (Вариант A: приглашения от тренера по email)
-- ============================================================

CREATE TABLE parent_invitations (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    player_id   UUID NOT NULL REFERENCES players(id),
    club_id     UUID NOT NULL REFERENCES clubs(id),
    email       VARCHAR(255) NOT NULL,
    token       VARCHAR(255) NOT NULL UNIQUE,
    status      VARCHAR(20) NOT NULL DEFAULT 'pending',
    created_by  UUID NOT NULL REFERENCES users(id),
    expires_at  TIMESTAMPTZ NOT NULL,
    accepted_at TIMESTAMPTZ,
    accepted_by UUID REFERENCES users(id),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at  TIMESTAMPTZ
);

CREATE INDEX idx_parent_invitations_player_id ON parent_invitations(player_id);
CREATE INDEX idx_parent_invitations_club_id ON parent_invitations(club_id);
CREATE INDEX idx_parent_invitations_email ON parent_invitations(email);
CREATE INDEX idx_parent_invitations_token ON parent_invitations(token);
CREATE INDEX idx_parent_invitations_status ON parent_invitations(status);

-- ============================================================
-- PLAYER LINK CODES (Вариант C: коды доступа для быстрого связывания)
-- ============================================================

CREATE TABLE player_link_codes (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    player_id   UUID NOT NULL REFERENCES players(id),
    club_id     UUID NOT NULL REFERENCES clubs(id),
    code        VARCHAR(10) NOT NULL UNIQUE,
    created_by  UUID NOT NULL REFERENCES users(id),
    expires_at  TIMESTAMPTZ NOT NULL,
    used_at     TIMESTAMPTZ,
    used_by     UUID REFERENCES users(id),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at  TIMESTAMPTZ
);

CREATE INDEX idx_player_link_codes_player_id ON player_link_codes(player_id);
CREATE INDEX idx_player_link_codes_club_id ON player_link_codes(club_id);
CREATE INDEX idx_player_link_codes_code ON player_link_codes(code);
