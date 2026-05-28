package service

import (
	"context"
	"time"

	"github.com/coachos/backend/internal/domain"
	"github.com/coachos/backend/internal/dto"
	"github.com/coachos/backend/internal/repository"
)

// AssessmentService handles player assessment business logic.
type AssessmentService struct {
	assessmentRepo repository.AssessmentRepository
	playerService  *PlayerService
}

// NewAssessmentService creates a new AssessmentService.
func NewAssessmentService(assessmentRepo repository.AssessmentRepository, playerService *PlayerService) *AssessmentService {
	return &AssessmentService{
		assessmentRepo: assessmentRepo,
		playerService:  playerService,
	}
}

// Create creates a player assessment and recalculates dev index.
func (s *AssessmentService) Create(ctx context.Context, coachID string, req dto.CreateAssessmentRequest) (*domain.PlayerAssessment, error) {
	assessedAt := req.AssessedAt
	if assessedAt.IsZero() {
		assessedAt = time.Now()
	}

	assessment := &domain.PlayerAssessment{
		PlayerID:   req.PlayerID,
		CoachID:    coachID,
		AssessedAt: assessedAt,
		Technical:  req.Technical,
		Physical:   req.Physical,
		Tactical:   req.Tactical,
		Discipline: req.Discipline,
		Teamwork:   req.Teamwork,
		Notes:      req.Notes,
	}
	if err := s.assessmentRepo.Create(ctx, assessment); err != nil {
		return nil, err
	}

	// Recalculate dev index asynchronously (best effort)
	go func() {
		_ = s.playerService.RecalculateDevIndex(context.Background(), req.PlayerID)
	}()

	return assessment, nil
}

// GetByPlayer returns paginated assessments for a player.
func (s *AssessmentService) GetByPlayer(ctx context.Context, playerID string, page, limit int) ([]domain.PlayerAssessment, int64, error) {
	return s.assessmentRepo.FindByPlayer(ctx, playerID, page, limit)
}

// GetTeamSummary returns the assessment summary for all players in a team.
func (s *AssessmentService) GetTeamSummary(ctx context.Context, teamID string) ([]repository.PlayerAssessmentSummary, error) {
	return s.assessmentRepo.GetTeamSummary(ctx, teamID)
}

// GetLatest returns the most recent assessment for a player.
func (s *AssessmentService) GetLatest(ctx context.Context, playerID string) (*domain.PlayerAssessment, error) {
	return s.assessmentRepo.GetLatestByPlayer(ctx, playerID)
}
