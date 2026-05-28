package dto

import "time"

// CreateMatchRequest holds data to create a match.
type CreateMatchRequest struct {
	TeamID    string    `json:"teamId"    validate:"required"`
	Opponent  string    `json:"opponent"  validate:"required"`
	KickoffAt time.Time `json:"kickoffAt" validate:"required"`
	Location  string    `json:"location"`
	IsHome    bool      `json:"isHome"`
	Notes     string    `json:"notes"`
}

// UpdateMatchRequest holds data to update a match.
type UpdateMatchRequest struct {
	Opponent     string     `json:"opponent"`
	KickoffAt    *time.Time `json:"kickoffAt"`
	Location     string     `json:"location"`
	IsHome       *bool      `json:"isHome"`
	Status       string     `json:"status"   validate:"omitempty,oneof=scheduled in_progress completed cancelled postponed"`
	GoalsFor     *int       `json:"goalsFor"`
	GoalsAgainst *int       `json:"goalsAgainst"`
	Notes        string     `json:"notes"`
}

// MatchResponse is the public representation of a match.
type MatchResponse struct {
	ID           string    `json:"id"`
	TeamID       string    `json:"teamId"`
	Opponent     string    `json:"opponent"`
	KickoffAt    time.Time `json:"kickoffAt"`
	Location     string    `json:"location,omitempty"`
	IsHome       bool      `json:"isHome"`
	Status       string    `json:"status"`
	GoalsFor     int       `json:"goalsFor"`
	GoalsAgainst int       `json:"goalsAgainst"`
	Notes        string    `json:"notes,omitempty"`
	CreatedAt    time.Time `json:"createdAt"`
}

// MatchLineupPlayerResponse is a player in a lineup.
type MatchLineupPlayerResponse struct {
	PlayerID      string   `json:"playerId"`
	FirstName     string   `json:"firstName"`
	LastName      string   `json:"lastName"`
	Role          string   `json:"role"`
	Position      string   `json:"position,omitempty"`
	MinutesPlayed int      `json:"minutesPlayed"`
	FieldX        *float64 `json:"fieldX,omitempty"`
	FieldY        *float64 `json:"fieldY,omitempty"`
}

// MatchEventResponse is a single match event.
type MatchEventResponse struct {
	ID        string  `json:"id"`
	PlayerID  *string `json:"playerId,omitempty"`
	FirstName string  `json:"firstName,omitempty"`
	LastName  string  `json:"lastName,omitempty"`
	Minute    int     `json:"minute"`
	Type      string  `json:"type"`
	Notes     string  `json:"notes,omitempty"`
}

// MatchDetailResponse includes lineup and events.
type MatchDetailResponse struct {
	MatchResponse
	Lineup []MatchLineupPlayerResponse `json:"lineup"`
	Events []MatchEventResponse        `json:"events"`
}

// LineupPlayerRequest is a single player lineup entry.
type LineupPlayerRequest struct {
	PlayerID      string   `json:"playerId"      validate:"required"`
	Role          string   `json:"role"          validate:"required,oneof=starter substitute"`
	Position      string   `json:"position"      validate:"omitempty,oneof=goalkeeper defender midfielder forward universal"`
	MinutesPlayed int      `json:"minutesPlayed"`
	FieldX        *float64 `json:"fieldX,omitempty"`
	FieldY        *float64 `json:"fieldY,omitempty"`
}

// SetLineupRequest holds the full lineup for a match.
type SetLineupRequest struct {
	Formation string                `json:"formation" validate:"omitempty"`
	Players   []LineupPlayerRequest `json:"players"   validate:"required,min=1"`
}

// AddMatchEventRequest holds data to add a match event.
type AddMatchEventRequest struct {
	PlayerID *string `json:"playerId"`
	Minute   int     `json:"minute"  validate:"min=0"`
	Type     string  `json:"type"    validate:"required,oneof=goal assist yellow_card red_card sub_in sub_out"`
	Notes    string  `json:"notes"`
}

// PlayerMatchStat is per-player stats in a match summary.
type PlayerMatchStat struct {
	PlayerID   string `json:"playerId"`
	PlayerName string `json:"playerName"`
	Goals      int    `json:"goals"`
	Assists    int    `json:"assists"`
	YellowCards int   `json:"yellowCards"`
	RedCards   int    `json:"redCards"`
}

// MatchSummaryResponse holds aggregated match statistics.
type MatchSummaryResponse struct {
	MatchResponse
	PlayerStats []PlayerMatchStat `json:"playerStats"`
}
