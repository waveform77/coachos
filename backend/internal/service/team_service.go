package service

import (
	"context"
	"time"

	"github.com/coachos/backend/internal/domain"
	"github.com/coachos/backend/internal/dto"
	"github.com/coachos/backend/internal/repository"
)

// TeamService handles team business logic.
type TeamService struct {
	teamRepo    repository.TeamRepository
	sessionRepo repository.TrainingSessionRepository
}

// NewTeamService creates a new TeamService.
func NewTeamService(teamRepo repository.TeamRepository, sessionRepo repository.TrainingSessionRepository) *TeamService {
	return &TeamService{teamRepo: teamRepo, sessionRepo: sessionRepo}
}

// Create creates a new team.
func (s *TeamService) Create(ctx context.Context, clubID string, req dto.CreateTeamRequest) (*domain.Team, error) {
	team := &domain.Team{
		ClubID:   clubID,
		Name:     req.Name,
		AgeGroup: domain.AgeGroup(req.AgeGroup),
		Season:   req.Season,
	}
	if req.HeadCoachID != "" {
		team.HeadCoachID = &req.HeadCoachID
	}
	if err := s.teamRepo.Create(ctx, team); err != nil {
		return nil, err
	}
	return team, nil
}

// FindByID returns a team by ID.
func (s *TeamService) FindByID(ctx context.Context, id string) (*domain.Team, error) {
	return s.teamRepo.FindByID(ctx, id)
}

// FindByClub returns paginated teams for a club.
func (s *TeamService) FindByClub(ctx context.Context, clubID string, page, limit int) ([]domain.Team, int64, error) {
	return s.teamRepo.FindByClub(ctx, clubID, page, limit)
}

// Update updates a team.
func (s *TeamService) Update(ctx context.Context, id string, req dto.UpdateTeamRequest) (*domain.Team, error) {
	team, err := s.teamRepo.FindByID(ctx, id)
	if err != nil {
		return nil, err
	}

	if req.Name != "" {
		team.Name = req.Name
	}
	if req.AgeGroup != "" {
		team.AgeGroup = domain.AgeGroup(req.AgeGroup)
	}
	if req.Season != "" {
		team.Season = req.Season
	}
	if req.HeadCoachID != "" {
		team.HeadCoachID = &req.HeadCoachID
	}

	if err := s.teamRepo.Update(ctx, team); err != nil {
		return nil, err
	}
	return team, nil
}

// Delete soft-deletes a team.
func (s *TeamService) Delete(ctx context.Context, id string) error {
	if _, err := s.teamRepo.FindByID(ctx, id); err != nil {
		return err
	}
	return s.teamRepo.Delete(ctx, id)
}

// AddMember adds a player to a team.
func (s *TeamService) AddMember(ctx context.Context, teamID string, req dto.AddMemberRequest) error {
	if _, err := s.teamRepo.FindByID(ctx, teamID); err != nil {
		return err
	}
	member := &domain.TeamMember{
		TeamID:       teamID,
		PlayerID:     req.PlayerID,
		JoinedAt:     time.Now(),
		JerseyNumber: req.JerseyNumber,
		Position:     domain.Position(req.Position),
		IsCaptain:    req.IsCaptain,
	}
	return s.teamRepo.AddMember(ctx, member)
}

// RemoveMember removes a player from a team.
func (s *TeamService) RemoveMember(ctx context.Context, teamID, playerID string) error {
	return s.teamRepo.RemoveMember(ctx, teamID, playerID)
}

// GetMembers returns the members of a team.
func (s *TeamService) GetMembers(ctx context.Context, teamID string) ([]domain.TeamMember, error) {
	return s.teamRepo.GetMembers(ctx, teamID)
}

// GetDashboard returns team-level summary.
func (s *TeamService) GetDashboard(ctx context.Context, teamID string) (*dto.TeamDashboardResponse, error) {
	team, err := s.teamRepo.FindByID(ctx, teamID)
	if err != nil {
		return nil, err
	}

	members, err := s.teamRepo.GetMembers(ctx, teamID)
	if err != nil {
		return nil, err
	}

	now := time.Now()
	upcoming, _, _ := s.sessionRepo.FindByTeam(ctx, teamID, &now, nil, 1, 10)

	return &dto.TeamDashboardResponse{
		Team: dto.TeamResponse{
			ID:          team.ID,
			ClubID:      team.ClubID,
			Name:        team.Name,
			AgeGroup:    string(team.AgeGroup),
			Season:      team.Season,
			HeadCoachID: team.HeadCoachID,
			CreatedAt:   team.CreatedAt,
		},
		MemberCount:      len(members),
		UpcomingSessions: len(upcoming),
	}, nil
}
