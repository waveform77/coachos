package service

import (
	"context"
	"math"

	"github.com/coachos/backend/internal/domain"
	"github.com/coachos/backend/internal/dto"
	"github.com/coachos/backend/internal/repository"
)

// PlayerService handles player business logic.
type PlayerService struct {
	playerRepo     repository.PlayerRepository
	assessmentRepo repository.AssessmentRepository
	attendanceRepo repository.AttendanceRepository
	goalRepo       repository.PlayerGoalRepository
}

// NewPlayerService creates a new PlayerService.
func NewPlayerService(
	playerRepo repository.PlayerRepository,
	assessmentRepo repository.AssessmentRepository,
	attendanceRepo repository.AttendanceRepository,
	goalRepo repository.PlayerGoalRepository,
) *PlayerService {
	return &PlayerService{
		playerRepo:     playerRepo,
		assessmentRepo: assessmentRepo,
		attendanceRepo: attendanceRepo,
		goalRepo:       goalRepo,
	}
}

// Create creates a new player in a club.
func (s *PlayerService) Create(ctx context.Context, clubID string, req dto.CreatePlayerRequest) (*domain.Player, error) {
	player := &domain.Player{
		ClubID:       clubID,
		FirstName:    req.FirstName,
		LastName:     req.LastName,
		BirthDate:    req.BirthDate,
		HeightCm:     req.HeightCm,
		WeightKg:     req.WeightKg,
		DominantFoot: domain.DominantFoot(req.DominantFoot),
		Position:     domain.Position(req.Position),
		MedicalNotes:     req.MedicalNotes,
		PhotoURL:         req.PhotoURL,
		UserID:           req.UserID,
		PotentialAbility: req.PotentialAbility,
	}
	if err := s.playerRepo.Create(ctx, player); err != nil {
		return nil, err
	}
	return player, nil
}

// FindByID returns a player by ID.
func (s *PlayerService) FindByID(ctx context.Context, id string) (*domain.Player, error) {
	return s.playerRepo.FindByID(ctx, id)
}

// FindByClub returns paginated players for a club.
func (s *PlayerService) FindByClub(ctx context.Context, clubID string, page, limit int) ([]domain.Player, int64, error) {
	return s.playerRepo.FindByClub(ctx, clubID, page, limit)
}

// FindByUserID returns a player linked to a user account.
func (s *PlayerService) FindByUserID(ctx context.Context, userID string) (*domain.Player, error) {
	return s.playerRepo.FindByUserID(ctx, userID)
}

// Update updates a player's data.
func (s *PlayerService) Update(ctx context.Context, id string, req dto.UpdatePlayerRequest) (*domain.Player, error) {
	player, err := s.playerRepo.FindByID(ctx, id)
	if err != nil {
		return nil, err
	}

	if req.FirstName != "" {
		player.FirstName = req.FirstName
	}
	if req.LastName != "" {
		player.LastName = req.LastName
	}
	if req.BirthDate != nil {
		player.BirthDate = req.BirthDate
	}
	if req.HeightCm != nil {
		player.HeightCm = req.HeightCm
	}
	if req.WeightKg != nil {
		player.WeightKg = req.WeightKg
	}
	if req.DominantFoot != "" {
		player.DominantFoot = domain.DominantFoot(req.DominantFoot)
	}
	if req.Position != "" {
		player.Position = domain.Position(req.Position)
	}
	if req.MedicalNotes != "" {
		player.MedicalNotes = req.MedicalNotes
	}
	if req.PhotoURL != "" {
		player.PhotoURL = req.PhotoURL
	}
	if req.PotentialAbility > 0 {
		player.PotentialAbility = req.PotentialAbility
	}

	if err := s.playerRepo.Update(ctx, player); err != nil {
		return nil, err
	}
	return player, nil
}

// Delete soft-deletes a player.
func (s *PlayerService) Delete(ctx context.Context, id string) error {
	if _, err := s.playerRepo.FindByID(ctx, id); err != nil {
		return err
	}
	return s.playerRepo.Delete(ctx, id)
}

// GetProfile returns full player profile including latest assessment and goals.
func (s *PlayerService) GetProfile(ctx context.Context, playerID string) (*dto.PlayerProfileResponse, error) {
	player, err := s.playerRepo.FindByID(ctx, playerID)
	if err != nil {
		return nil, err
	}

	latest, _ := s.assessmentRepo.GetLatestByPlayer(ctx, playerID)
	goals, _ := s.goalRepo.FindByPlayer(ctx, playerID)
	present, total, _ := s.attendanceRepo.GetPlayerAttendanceStats(ctx, playerID)

	var attendanceRate float64
	if total > 0 {
		attendanceRate = float64(present) / float64(total) * 100
	}

	resp := &dto.PlayerProfileResponse{
		PlayerResponse: mapPlayer(*player),
		GoalsCount:     len(goals),
		AttendanceRate: attendanceRate,
	}

	if latest != nil {
		a := mapAssessment(*latest)
		resp.LatestAssessment = &a
	}

	return resp, nil
}

// GetProgress returns the assessment timeline for charting.
func (s *PlayerService) GetProgress(ctx context.Context, playerID string) (*dto.PlayerProgressResponse, error) {
	player, err := s.playerRepo.FindByID(ctx, playerID)
	if err != nil {
		return nil, err
	}

	assessments, _, err := s.assessmentRepo.FindByPlayer(ctx, playerID, 1, 50)
	if err != nil {
		return nil, err
	}

	mapped := make([]dto.AssessmentResponse, 0, len(assessments))
	for _, a := range assessments {
		mapped = append(mapped, mapAssessment(a))
	}

	return &dto.PlayerProgressResponse{
		PlayerID:    playerID,
		Assessments: mapped,
		DevIndex:    player.DevIndex,
	}, nil
}

// RecalculateDevIndex computes and stores the player's development index.
// Weights: attendance 20%, avg assessment 50%, goals achieved 30%.
func (s *PlayerService) RecalculateDevIndex(ctx context.Context, playerID string) error {
	present, total, err := s.attendanceRepo.GetPlayerAttendanceStats(ctx, playerID)
	if err != nil {
		return err
	}
	var attendanceRate float64
	if total > 0 {
		attendanceRate = float64(present) / float64(total) * 100
	}

	assessments, _, err := s.assessmentRepo.FindByPlayer(ctx, playerID, 1, 100)
	if err != nil {
		return err
	}
	var avgAssessment float64
	if len(assessments) > 0 {
		var sum float64
		for _, a := range assessments {
			sum += float64(a.Technical+a.Physical+a.Tactical+a.Discipline+a.Teamwork) / 5.0
		}
		avgAssessment = sum / float64(len(assessments))
	}

	goals, err := s.goalRepo.FindByPlayer(ctx, playerID)
	if err != nil {
		return err
	}
	var achieved int
	for _, g := range goals {
		if g.Status == domain.GoalStatusAchieved {
			achieved++
		}
	}
	var goalAchievedPct float64
	if len(goals) > 0 {
		goalAchievedPct = float64(achieved) / float64(len(goals)) * 100
	}

	// PDI 0–100: attendance%×0.20 + avgAssessment(1–10)×10×0.50 + goalsAchieved%×0.30
	devIndex := attendanceRate*0.20 + avgAssessment*10*0.50 + goalAchievedPct*0.30
	devIndex = math.Round(devIndex*100) / 100
	return s.playerRepo.UpdateDevIndex(ctx, playerID, devIndex)
}

func mapPlayer(p domain.Player) dto.PlayerResponse {
	return dto.PlayerResponse{
		ID:           p.ID,
		ClubID:       p.ClubID,
		FirstName:    p.FirstName,
		LastName:     p.LastName,
		BirthDate:    p.BirthDate,
		HeightCm:     p.HeightCm,
		WeightKg:     p.WeightKg,
		DominantFoot: string(p.DominantFoot),
		Position:     string(p.Position),
		PhotoURL:         p.PhotoURL,
		DevIndex:         p.DevIndex,
		PotentialAbility: p.PotentialAbility,
		CreatedAt:        p.CreatedAt,
	}
}

func mapAssessment(a domain.PlayerAssessment) dto.AssessmentResponse {
	return dto.AssessmentResponse{
		ID:         a.ID,
		PlayerID:   a.PlayerID,
		CoachID:    a.CoachID,
		AssessedAt: a.AssessedAt,
		Technical:  a.Technical,
		Physical:   a.Physical,
		Tactical:   a.Tactical,
		Discipline: a.Discipline,
		Teamwork:   a.Teamwork,
		Notes:      a.Notes,
		CreatedAt:  a.CreatedAt,
	}
}
