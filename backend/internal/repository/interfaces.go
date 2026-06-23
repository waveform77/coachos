package repository

import (
	"context"
	"time"

	"github.com/coachos/backend/internal/domain"
)

// UserRepository defines persistence operations for users.
type UserRepository interface {
	Create(ctx context.Context, user *domain.User) error
	FindByID(ctx context.Context, id string) (*domain.User, error)
	FindByEmail(ctx context.Context, email string) (*domain.User, error)
	Update(ctx context.Context, user *domain.User) error
	List(ctx context.Context, clubID string, role domain.Role, page, limit int) ([]domain.User, int64, error)
}

// RefreshTokenRepository defines persistence operations for refresh tokens.
type RefreshTokenRepository interface {
	Create(ctx context.Context, token *domain.RefreshToken) error
	FindByHash(ctx context.Context, hash string) (*domain.RefreshToken, error)
	MarkUsed(ctx context.Context, id string) error
	RevokeFamily(ctx context.Context, familyID string) error
	DeleteExpired(ctx context.Context) error
}

// ClubRepository defines persistence operations for clubs.
type ClubRepository interface {
	Create(ctx context.Context, club *domain.Club) error
	FindByID(ctx context.Context, id string) (*domain.Club, error)
	Update(ctx context.Context, club *domain.Club) error
}

// TeamRepository defines persistence operations for teams.
type TeamRepository interface {
	Create(ctx context.Context, team *domain.Team) error
	FindByID(ctx context.Context, id string) (*domain.Team, error)
	FindByClub(ctx context.Context, clubID string, page, limit int) ([]domain.Team, int64, error)
	Update(ctx context.Context, team *domain.Team) error
	Delete(ctx context.Context, id string) error
	AddMember(ctx context.Context, member *domain.TeamMember) error
	RemoveMember(ctx context.Context, teamID, playerID string) error
	GetMembers(ctx context.Context, teamID string) ([]domain.TeamMember, error)
}

// PlayerRepository defines persistence operations for players.
type PlayerRepository interface {
	Create(ctx context.Context, player *domain.Player) error
	FindByID(ctx context.Context, id string) (*domain.Player, error)
	FindByUserID(ctx context.Context, userID string) (*domain.Player, error)
	FindByClub(ctx context.Context, clubID string, page, limit int) ([]domain.Player, int64, error)
	Update(ctx context.Context, player *domain.Player) error
	Delete(ctx context.Context, id string) error
	UpdateDevIndex(ctx context.Context, playerID string, index float64) error
	// LinkPlayerToUser links an existing player card to a user account.
	LinkPlayerToUser(ctx context.Context, playerID, userID string) error
	// IsPlayerLinked reports whether the player card already has a linked user.
	IsPlayerLinked(ctx context.Context, playerID string) (bool, error)
}

// ParentRepository defines persistence operations for parents.
type ParentRepository interface {
	Create(ctx context.Context, parent *domain.Parent) error
	FindByID(ctx context.Context, id string) (*domain.Parent, error)
	FindByUserID(ctx context.Context, userID string) (*domain.Parent, error)
	Update(ctx context.Context, parent *domain.Parent) error
	LinkToPlayer(ctx context.Context, playerID, parentID string) error
	GetByPlayer(ctx context.Context, playerID string) ([]domain.Parent, error)
	// ListPlayersForParentUser returns players linked via player_parents for a parent users.id.
	ListPlayersForParentUser(ctx context.Context, parentUserID string) ([]domain.Player, error)
	// IsParentLinkedToPlayer reports whether the parent account (by user id) is linked to the player row.
	IsParentLinkedToPlayer(ctx context.Context, parentUserID, playerID string) (bool, error)
	// Вариант A: Приглашения по email
	CreateInvitation(ctx context.Context, inv *domain.ParentInvitation) error
	GetInvitationByToken(ctx context.Context, token string) (*domain.ParentInvitation, error)
	GetPendingInvitationByEmail(ctx context.Context, playerID, email string) (*domain.ParentInvitation, error)
	ListInvitationsForPlayer(ctx context.Context, playerID string) ([]domain.ParentInvitation, error)
	MarkInvitationAccepted(ctx context.Context, id string, acceptedBy string) error
	// Вариант C: Коды доступа
	CreateLinkCode(ctx context.Context, code *domain.PlayerLinkCode) error
	GetLinkCodeByCode(ctx context.Context, code string) (*domain.PlayerLinkCode, error)
	MarkLinkCodeUsed(ctx context.Context, id string, usedBy string) error
	ListActiveLinkCodesForPlayer(ctx context.Context, playerID string) ([]domain.PlayerLinkCode, error)
}

// ExerciseFilter holds filtering options for exercise listing.
type ExerciseFilter struct {
	Category   string
	Difficulty int
	Tags       []string
	Search     string
	Global     bool
	Page       int
	Limit      int
}

// ExerciseRepository defines persistence operations for exercises.
type ExerciseRepository interface {
	Create(ctx context.Context, exercise *domain.Exercise) error
	FindByID(ctx context.Context, id string) (*domain.Exercise, error)
	List(ctx context.Context, clubID string, filter ExerciseFilter) ([]domain.Exercise, int64, error)
	Update(ctx context.Context, exercise *domain.Exercise) error
	Delete(ctx context.Context, id string) error
}

// TrainingSessionRepository defines persistence operations for training sessions.
type TrainingSessionRepository interface {
	Create(ctx context.Context, session *domain.TrainingSession) error
	FindByID(ctx context.Context, id string) (*domain.TrainingSession, error)
	FindByTeam(ctx context.Context, teamID string, from, to *time.Time, page, limit int) ([]domain.TrainingSession, int64, error)
	FindByClub(ctx context.Context, clubID string, from, to *time.Time, page, limit int) ([]domain.TrainingSession, int64, error)
	Update(ctx context.Context, session *domain.TrainingSession) error
	Delete(ctx context.Context, id string) error
	AddBlock(ctx context.Context, block *domain.TrainingBlock) error
	UpdateBlock(ctx context.Context, block *domain.TrainingBlock) error
	GetBlocks(ctx context.Context, sessionID string) ([]domain.TrainingBlock, error)
	AddExerciseToBlock(ctx context.Context, se *domain.SessionExercise) error
	GetSessionDetail(ctx context.Context, id string) (*domain.TrainingSession, error)
	SaveBlocks(ctx context.Context, sessionID string, blocks []domain.TrainingBlock) error
}

// PlayerAttendanceStat holds per-player attendance statistics.
type PlayerAttendanceStat struct {
	PlayerID   string
	PlayerName string
	Present    int
	Total      int
	Rate       float64
}

// AttendanceRepository defines persistence operations for attendance records.
type AttendanceRepository interface {
	Upsert(ctx context.Context, record *domain.AttendanceRecord) error
	GetBySession(ctx context.Context, sessionID string) ([]domain.AttendanceRecord, error)
	GetByPlayer(ctx context.Context, playerID string, page, limit int) ([]domain.AttendanceRecord, int64, error)
	GetPlayerAttendanceStats(ctx context.Context, playerID string) (present, total int, error error)
	GetTeamAttendanceStats(ctx context.Context, teamID string, from, to time.Time) ([]PlayerAttendanceStat, error)
	GetClubAttendanceStats(ctx context.Context, clubID string, from, to time.Time) ([]PlayerAttendanceStat, error)
}

// PlayerAssessmentSummary holds aggregated assessment data per player.
type PlayerAssessmentSummary struct {
	PlayerID       string
	PlayerName     string
	LastAssessedAt time.Time
	AvgTechnical   float64
	AvgPhysical    float64
	AvgTactical    float64
	AvgDiscipline  float64
	AvgTeamwork    float64
	Total          int
}

// AssessmentRepository defines persistence operations for player assessments.
type AssessmentRepository interface {
	Create(ctx context.Context, assessment *domain.PlayerAssessment) error
	FindByPlayer(ctx context.Context, playerID string, page, limit int) ([]domain.PlayerAssessment, int64, error)
	GetTeamSummary(ctx context.Context, teamID string) ([]PlayerAssessmentSummary, error)
	GetLatestByPlayer(ctx context.Context, playerID string) (*domain.PlayerAssessment, error)
}

// MatchRepository defines persistence operations for matches.
type MatchRepository interface {
	Create(ctx context.Context, match *domain.Match) error
	FindByID(ctx context.Context, id string) (*domain.Match, error)
	FindByTeam(ctx context.Context, teamID string, page, limit int) ([]domain.Match, int64, error)
	FindByClub(ctx context.Context, clubID string, page, limit int) ([]domain.Match, int64, error)
	FindByPlayer(ctx context.Context, playerID string, page, limit int) ([]domain.Match, int64, error)
	Update(ctx context.Context, match *domain.Match) error
	Delete(ctx context.Context, id string) error
	SetLineup(ctx context.Context, matchID string, lineups []domain.MatchLineup) error
	GetLineup(ctx context.Context, matchID string) ([]domain.MatchLineup, error)
	AddEvent(ctx context.Context, event *domain.MatchEvent) error
	GetEvents(ctx context.Context, matchID string) ([]domain.MatchEvent, error)
	GetPlayerMatchStats(ctx context.Context, playerID string) (*PlayerMatchStats, error)
}

// NotificationRepository defines persistence operations for notifications.
type NotificationRepository interface {
	Create(ctx context.Context, n *domain.Notification) error
	GetByUser(ctx context.Context, userID string, unreadOnly bool, page, limit int) ([]domain.Notification, int64, error)
	MarkRead(ctx context.Context, id, userID string) error
	MarkAllRead(ctx context.Context, userID string) error
}

// AIRepository defines persistence operations for AI recommendations.
type AIRepository interface {
	Save(ctx context.Context, rec *domain.AIRecommendation) error
	GetByTarget(ctx context.Context, targetType domain.AITargetType, targetID string) ([]domain.AIRecommendation, error)
}

// PlayerGoalRepository defines persistence operations for player goals.
type PlayerGoalRepository interface {
	Create(ctx context.Context, goal *domain.PlayerGoal) error
	FindByPlayer(ctx context.Context, playerID string) ([]domain.PlayerGoal, error)
	Update(ctx context.Context, goal *domain.PlayerGoal) error
	Delete(ctx context.Context, id string) error
}

// PlayerMatchStats holds aggregated match statistics for a player.
type PlayerMatchStats struct {
	Goals         int `json:"goals"`
	Assists       int `json:"assists"`
	YellowCards   int `json:"yellowCards"`
	RedCards      int `json:"redCards"`
	MinutesPlayed int `json:"minutesPlayed"`
	MatchesPlayed int `json:"matchesPlayed"`
}

// CoachProfileRepository defines persistence operations for coach profiles.
type CoachProfileRepository interface {
	Create(ctx context.Context, profile *domain.CoachProfile) error
	FindByUserID(ctx context.Context, userID string) (*domain.CoachProfile, error)
	Update(ctx context.Context, profile *domain.CoachProfile) error
}

// CoachNoteRepository defines persistence operations for coach notes.
type CoachNoteRepository interface {
	Create(ctx context.Context, note *domain.CoachNote) error
	FindByID(ctx context.Context, id string) (*domain.CoachNote, error)
	ListByPlayer(ctx context.Context, playerID string, page, limit int) ([]domain.CoachNote, int64, error)
	Update(ctx context.Context, note *domain.CoachNote) error
	Delete(ctx context.Context, id string) error
}

// MedicalRecordRepository defines persistence operations for medical records.
type MedicalRecordRepository interface {
	Create(ctx context.Context, record *domain.MedicalRecord) error
	FindByID(ctx context.Context, id string) (*domain.MedicalRecord, error)
	ListByPlayer(ctx context.Context, playerID string, page, limit int) ([]domain.MedicalRecord, int64, error)
	Update(ctx context.Context, record *domain.MedicalRecord) error
	Delete(ctx context.Context, id string) error
}
