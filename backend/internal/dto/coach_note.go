package dto

import "time"

// CreateCoachNoteRequest holds data to create a coach note.
type CreateCoachNoteRequest struct {
	PlayerID  string `json:"playerId" validate:"required,uuid"`
	Category  string `json:"category" validate:"required,oneof=technique tactics physical behavior medical"`
	Content   string `json:"content" validate:"required,min=1,max=2000"`
	IsPrivate bool   `json:"isPrivate"`
}

// CoachNoteResponse is the public representation of a coach note.
type CoachNoteResponse struct {
	ID        string    `json:"id"`
	PlayerID  string    `json:"playerId"`
	CoachID   string    `json:"coachId"`
	Category  string    `json:"category"`
	Content   string    `json:"content"`
	IsPrivate bool      `json:"isPrivate"`
	CreatedAt time.Time `json:"createdAt"`
}
