CREATE TABLE coach_notes (
    id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    player_id  UUID NOT NULL REFERENCES players(id),
    coach_id   UUID NOT NULL REFERENCES users(id),
    category   VARCHAR(20) NOT NULL,
    content    TEXT NOT NULL,
    is_private BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_coach_notes_player_id ON coach_notes(player_id);
CREATE INDEX idx_coach_notes_coach_id ON coach_notes(coach_id);
CREATE INDEX idx_coach_notes_category ON coach_notes(category);
