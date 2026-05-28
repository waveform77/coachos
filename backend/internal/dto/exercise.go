package dto

import "time"

// CreateExerciseRequest holds data to create an exercise.
type CreateExerciseRequest struct {
	Name        string   `json:"name"        validate:"required"`
	Category    string   `json:"category"    validate:"required,oneof=technique tactics physical coordination goalkeeping warmup cooldown"`
	Difficulty  int      `json:"difficulty"  validate:"required,min=1,max=5"`
	DurationMin int      `json:"durationMin"`
	PlayersMin  int      `json:"playersMin"`
	PlayersMax  int      `json:"playersMax"`
	Equipment   []string `json:"equipment"`
	Description string   `json:"description"`
	DiagramURL  string   `json:"diagramUrl"`
	Tags        []string `json:"tags"`
	IsGlobal    bool     `json:"isGlobal"`
}

// UpdateExerciseRequest holds data to update an exercise.
type UpdateExerciseRequest struct {
	Name        string   `json:"name"`
	Category    string   `json:"category"   validate:"omitempty,oneof=technique tactics physical coordination goalkeeping warmup cooldown"`
	Difficulty  int      `json:"difficulty" validate:"omitempty,min=1,max=5"`
	DurationMin int      `json:"durationMin"`
	PlayersMin  int      `json:"playersMin"`
	PlayersMax  int      `json:"playersMax"`
	Equipment   []string `json:"equipment"`
	Description string   `json:"description"`
	DiagramURL  string   `json:"diagramUrl"`
	Tags        []string `json:"tags"`
	IsGlobal    bool     `json:"isGlobal"`
}

// ExerciseResponse is the public representation of an exercise.
type ExerciseResponse struct {
	ID          string    `json:"id"`
	ClubID      *string   `json:"clubId,omitempty"`
	Name        string    `json:"name"`
	Category    string    `json:"category"`
	Difficulty  int       `json:"difficulty"`
	DurationMin int       `json:"durationMin,omitempty"`
	PlayersMin  int       `json:"playersMin,omitempty"`
	PlayersMax  int       `json:"playersMax,omitempty"`
	Equipment   []string  `json:"equipment,omitempty"`
	Description string    `json:"description,omitempty"`
	DiagramURL  string    `json:"diagramUrl,omitempty"`
	Tags        []string  `json:"tags,omitempty"`
	IsGlobal    bool      `json:"isGlobal"`
	CreatedByID string    `json:"createdById"`
	CreatedAt   time.Time `json:"createdAt"`
}

// ExerciseFilterQuery holds query parameters to filter the exercise list.
type ExerciseFilterQuery struct {
	Category   string `query:"category"`
	Difficulty int    `query:"difficulty"`
	Tags       string `query:"tags"`
	Search     string `query:"search"`
	Global     bool   `query:"global"`
	Page       int    `query:"page"`
	Limit      int    `query:"limit"`
}
