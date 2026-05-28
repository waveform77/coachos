package dto

import "time"

// CreateAssessmentRequest holds data to create a player assessment.
type CreateAssessmentRequest struct {
	PlayerID   string    `json:"playerId"    validate:"required"`
	AssessedAt time.Time `json:"assessedAt"  validate:"required"`
	Technical  int       `json:"technical"   validate:"required,min=1,max=10"`
	Physical   int       `json:"physical"    validate:"required,min=1,max=10"`
	Tactical   int       `json:"tactical"    validate:"required,min=1,max=10"`
	Discipline int       `json:"discipline"  validate:"required,min=1,max=10"`
	Teamwork   int       `json:"teamwork"    validate:"required,min=1,max=10"`
	Notes      string    `json:"notes"`
}

// AssessmentResponse is the public representation of an assessment.
type AssessmentResponse struct {
	ID         string    `json:"id"`
	PlayerID   string    `json:"playerId"`
	CoachID    string    `json:"coachId"`
	AssessedAt time.Time `json:"assessedAt"`
	Technical  int       `json:"technical"`
	Physical   int       `json:"physical"`
	Tactical   int       `json:"tactical"`
	Discipline int       `json:"discipline"`
	Teamwork   int       `json:"teamwork"`
	Notes      string    `json:"notes,omitempty"`
	CreatedAt  time.Time `json:"createdAt"`
}

// PlayerAssessmentSummaryResponse is a per-player summary in a team assessment report.
type PlayerAssessmentSummaryResponse struct {
	PlayerID       string    `json:"playerId"`
	PlayerName     string    `json:"playerName"`
	LastAssessedAt time.Time `json:"lastAssessedAt"`
	AvgTechnical   float64   `json:"avgTechnical"`
	AvgPhysical    float64   `json:"avgPhysical"`
	AvgTactical    float64   `json:"avgTactical"`
	AvgDiscipline  float64   `json:"avgDiscipline"`
	AvgTeamwork    float64   `json:"avgTeamwork"`
	Total          int       `json:"total"`
}

// TeamAssessmentSummaryResponse holds the team-level assessment summary.
type TeamAssessmentSummaryResponse struct {
	TeamID  string                             `json:"teamId"`
	Players []PlayerAssessmentSummaryResponse  `json:"players"`
}
