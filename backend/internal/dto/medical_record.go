package dto

import "time"

// CreateMedicalRecordRequest holds data to create a medical record.
type CreateMedicalRecordRequest struct {
	PlayerID    string `json:"playerId" validate:"required,uuid"`
	Condition   string `json:"condition" validate:"required,oneof=injury illness recovery fit"`
	Description string `json:"description" validate:"required,min=1,max=2000"`
	StartDate   string `json:"startDate" validate:"omitempty,datetime=2006-01-02"`
	EndDate     string `json:"endDate" validate:"omitempty,datetime=2006-01-02"`
	Severity    string `json:"severity" validate:"omitempty,oneof=minor moderate severe"`
	Status      string `json:"status" validate:"required,oneof=active recovered"`
}

// MedicalRecordResponse is the public representation of a medical record.
type MedicalRecordResponse struct {
	ID          string    `json:"id"`
	PlayerID    string    `json:"playerId"`
	Condition   string    `json:"condition"`
	Description string    `json:"description"`
	StartDate   string    `json:"startDate,omitempty"`
	EndDate     string    `json:"endDate,omitempty"`
	Severity    string    `json:"severity,omitempty"`
	Status      string    `json:"status"`
	CreatedAt   time.Time `json:"createdAt"`
}
