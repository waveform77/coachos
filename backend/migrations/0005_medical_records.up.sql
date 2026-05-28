CREATE TABLE medical_records (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    player_id   UUID NOT NULL REFERENCES players(id),
    condition   VARCHAR(20) NOT NULL,
    description TEXT NOT NULL,
    start_date  DATE,
    end_date    DATE,
    severity    VARCHAR(20),
    status      VARCHAR(20) NOT NULL DEFAULT 'active',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_medical_records_player_id ON medical_records(player_id);
CREATE INDEX idx_medical_records_status ON medical_records(status);
