package dto

import "time"

// CreatePlayerRequest holds data to create a player.
type CreatePlayerRequest struct {
	FirstName    string     `json:"firstName"    validate:"required"`
	LastName     string     `json:"lastName"     validate:"required"`
	BirthDate    *time.Time `json:"birthDate"`
	HeightCm     *float32   `json:"heightCm"`
	WeightKg     *float32   `json:"weightKg"`
	DominantFoot string     `json:"dominantFoot" validate:"omitempty,oneof=left right both"`
	Position     string     `json:"position"     validate:"omitempty,oneof=goalkeeper defender midfielder forward universal"`
	MedicalNotes string     `json:"medicalNotes"`
	PhotoURL     string     `json:"photoUrl"`
	UserID       *string    `json:"userId"`
	PotentialAbility int    `json:"potentialAbility"`
}

// UpdatePlayerRequest holds data to update a player.
type UpdatePlayerRequest struct {
	FirstName    string     `json:"firstName"`
	LastName     string     `json:"lastName"`
	BirthDate    *time.Time `json:"birthDate"`
	HeightCm     *float32   `json:"heightCm"`
	WeightKg     *float32   `json:"weightKg"`
	DominantFoot string     `json:"dominantFoot" validate:"omitempty,oneof=left right both"`
	Position     string     `json:"position"     validate:"omitempty,oneof=goalkeeper defender midfielder forward universal"`
	MedicalNotes string     `json:"medicalNotes"`
	PhotoURL     string     `json:"photoUrl"`
	PotentialAbility int    `json:"potentialAbility"`
}

// PlayerResponse is the public representation of a player.
type PlayerResponse struct {
	ID           string     `json:"id"`
	ClubID       string     `json:"clubId"`
	FirstName    string     `json:"firstName"`
	LastName     string     `json:"lastName"`
	BirthDate    *time.Time `json:"birthDate,omitempty"`
	HeightCm     *float32   `json:"heightCm,omitempty"`
	WeightKg     *float32   `json:"weightKg,omitempty"`
	DominantFoot string     `json:"dominantFoot,omitempty"`
	Position     string     `json:"position,omitempty"`
	PhotoURL         string     `json:"photoUrl,omitempty"`
	DevIndex         float64    `json:"devIndex"`
	PotentialAbility int        `json:"potentialAbility"`
	CreatedAt        time.Time  `json:"createdAt"`
}

// PlayerProfileResponse includes extended player info.
type PlayerProfileResponse struct {
	PlayerResponse
	LatestAssessment *AssessmentResponse `json:"latestAssessment,omitempty"`
	GoalsCount       int                 `json:"goalsCount"`
	AttendanceRate   float64             `json:"attendanceRate"`
}

// PlayerProgressResponse holds assessment history data points for charting.
type PlayerProgressResponse struct {
	PlayerID    string               `json:"playerId"`
	Assessments []AssessmentResponse `json:"assessments"`
	DevIndex    float64              `json:"devIndex"`
}
