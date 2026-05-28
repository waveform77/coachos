package dto

import "time"

// CreateTeamRequest holds data to create a team.
type CreateTeamRequest struct {
	Name        string `json:"name"        validate:"required"`
	AgeGroup    string `json:"ageGroup"`
	Season      string `json:"season"`
	HeadCoachID string `json:"headCoachId"`
}

// UpdateTeamRequest holds data to update a team.
type UpdateTeamRequest struct {
	Name        string `json:"name"`
	AgeGroup    string `json:"ageGroup"`
	Season      string `json:"season"`
	HeadCoachID string `json:"headCoachId"`
}

// TeamResponse is the public representation of a team.
type TeamResponse struct {
	ID          string     `json:"id"`
	ClubID      string     `json:"clubId"`
	Name        string     `json:"name"`
	AgeGroup    string     `json:"ageGroup,omitempty"`
	Season      string     `json:"season,omitempty"`
	HeadCoachID *string    `json:"headCoachId,omitempty"`
	CreatedAt   time.Time  `json:"createdAt"`
}

// TeamMemberResponse is a member entry in a team.
type TeamMemberResponse struct {
	PlayerID     string  `json:"playerId"`
	FirstName    string  `json:"firstName"`
	LastName     string  `json:"lastName"`
	DevIndex     float64 `json:"devIndex"`
	JerseyNumber *int    `json:"jerseyNumber,omitempty"`
	Position     string  `json:"position,omitempty"`
	IsCaptain    bool    `json:"isCaptain"`
}

// TeamDetailResponse includes the team and its current members.
type TeamDetailResponse struct {
	TeamResponse
	Members []TeamMemberResponse `json:"members"`
}

// AddMemberRequest holds data to add a player to a team.
type AddMemberRequest struct {
	PlayerID     string `json:"playerId"     validate:"required"`
	JerseyNumber *int   `json:"jerseyNumber"`
	Position     string `json:"position"`
	IsCaptain    bool   `json:"isCaptain"`
}

// TeamDashboardResponse holds team-level stats.
type TeamDashboardResponse struct {
	Team              TeamResponse `json:"team"`
	MemberCount       int          `json:"memberCount"`
	UpcomingSessions  int          `json:"upcomingSessions"`
	LastMatchResult   *string      `json:"lastMatchResult,omitempty"`
}
