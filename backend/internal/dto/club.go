package dto

import "time"

// CreateClubRequest holds data to create a new club.
type CreateClubRequest struct {
	Name      string     `json:"name"      validate:"required"`
	Country   string     `json:"country"`
	City      string     `json:"city"`
	LogoURL   string     `json:"logoUrl"`
	FoundedAt *time.Time `json:"foundedAt"`
}

// UpdateClubRequest holds data to update a club.
type UpdateClubRequest struct {
	Name      string     `json:"name"`
	Country   string     `json:"country"`
	City      string     `json:"city"`
	LogoURL   string     `json:"logoUrl"`
	FoundedAt *time.Time `json:"foundedAt"`
}

// ClubResponse is the public representation of a club.
type ClubResponse struct {
	ID        string     `json:"id"`
	Name      string     `json:"name"`
	Country   string     `json:"country"`
	City      string     `json:"city"`
	LogoURL   string     `json:"logoUrl,omitempty"`
	FoundedAt *time.Time `json:"foundedAt,omitempty"`
	CreatedAt time.Time  `json:"createdAt"`
}

// ClubDashboardResponse holds aggregated statistics for a club.
type ClubDashboardResponse struct {
	Club           ClubResponse      `json:"club"`
	TeamCount      int64             `json:"teamCount"`
	PlayerCount    int64             `json:"playerCount"`
	CoachCount     int64             `json:"coachCount"`
	TeamStats      []TeamStatItem    `json:"teamStats"`
	RecentSessions []SessionResponse `json:"recentSessions"`
}
