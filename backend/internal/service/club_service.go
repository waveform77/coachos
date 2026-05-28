package service

import (
	"context"
	"time"

	"github.com/coachos/backend/internal/domain"
	"github.com/coachos/backend/internal/dto"
	"github.com/coachos/backend/internal/repository"
)

// ClubService handles club business logic.
type ClubService struct {
	clubRepo       repository.ClubRepository
	teamRepo       repository.TeamRepository
	playerRepo     repository.PlayerRepository
	userRepo       repository.UserRepository
	sessionRepo    repository.TrainingSessionRepository
	attendanceRepo repository.AttendanceRepository
}

// NewClubService creates a new ClubService.
func NewClubService(
	clubRepo repository.ClubRepository,
	teamRepo repository.TeamRepository,
	playerRepo repository.PlayerRepository,
	userRepo repository.UserRepository,
	sessionRepo repository.TrainingSessionRepository,
	attendanceRepo repository.AttendanceRepository,
) *ClubService {
	return &ClubService{
		clubRepo:       clubRepo,
		teamRepo:       teamRepo,
		playerRepo:     playerRepo,
		userRepo:       userRepo,
		sessionRepo:    sessionRepo,
		attendanceRepo: attendanceRepo,
	}
}

// Create creates a new club.
func (s *ClubService) Create(ctx context.Context, req dto.CreateClubRequest) (*domain.Club, error) {
	club := &domain.Club{
		Name:      req.Name,
		Country:   req.Country,
		City:      req.City,
		LogoURL:   req.LogoURL,
		FoundedAt: req.FoundedAt,
	}
	if err := s.clubRepo.Create(ctx, club); err != nil {
		return nil, err
	}
	return club, nil
}

// FindByID returns a club by ID.
func (s *ClubService) FindByID(ctx context.Context, id string) (*domain.Club, error) {
	return s.clubRepo.FindByID(ctx, id)
}

// Update updates a club's fields.
func (s *ClubService) Update(ctx context.Context, id string, req dto.UpdateClubRequest) (*domain.Club, error) {
	club, err := s.clubRepo.FindByID(ctx, id)
	if err != nil {
		return nil, err
	}

	if req.Name != "" {
		club.Name = req.Name
	}
	if req.Country != "" {
		club.Country = req.Country
	}
	if req.City != "" {
		club.City = req.City
	}
	if req.LogoURL != "" {
		club.LogoURL = req.LogoURL
	}
	if req.FoundedAt != nil {
		club.FoundedAt = req.FoundedAt
	}

	if err := s.clubRepo.Update(ctx, club); err != nil {
		return nil, err
	}
	return club, nil
}

// GetDashboard returns aggregated club statistics.
func (s *ClubService) GetDashboard(ctx context.Context, clubID string) (*dto.ClubDashboardResponse, error) {
	club, err := s.clubRepo.FindByID(ctx, clubID)
	if err != nil {
		return nil, err
	}

	_, teamCount, err := s.teamRepo.FindByClub(ctx, clubID, 1, 1000)
	if err != nil {
		return nil, err
	}

	_, playerCount, err := s.playerRepo.FindByClub(ctx, clubID, 1, 1000)
	if err != nil {
		return nil, err
	}

	_, coachCount, err := s.userRepo.List(ctx, clubID, domain.RoleCoach, 1, 1000)
	if err != nil {
		return nil, err
	}

	teamsList, _, err := s.teamRepo.FindByClub(ctx, clubID, 1, 1000)
	if err != nil {
		return nil, err
	}

	from := time.Now().AddDate(0, -3, 0)
	to := time.Now()
	var teamStats []dto.TeamStatItem
	for _, tm := range teamsList {
		members, _ := s.teamRepo.GetMembers(ctx, tm.ID)
		n := len(members)
		var sumDev float64
		for _, m := range members {
			sumDev += m.Player.DevIndex
		}
		var avgDev float64
		if n > 0 {
			avgDev = sumDev / float64(n)
		}
		var avgAtt float64
		if stats, err := s.attendanceRepo.GetTeamAttendanceStats(ctx, tm.ID, from, to); err == nil {
			var present, total int
			for _, ps := range stats {
				present += ps.Present
				total += ps.Total
			}
			if total > 0 {
				avgAtt = float64(present) / float64(total) * 100
			}
		}
		teamStats = append(teamStats, dto.TeamStatItem{
			TeamID:        tm.ID,
			TeamName:      tm.Name,
			PlayerCount:   n,
			AvgDevIndex:   avgDev,
			AvgAttendance: avgAtt,
		})
	}

	var recentSessions []dto.SessionResponse
	for _, team := range teamsList {
		sessions, _, _ := s.sessionRepo.FindByTeam(ctx, team.ID, nil, nil, 1, 3)
		for _, sess := range sessions {
			recentSessions = append(recentSessions, mapSession(sess))
		}
		if len(recentSessions) >= 5 {
			break
		}
	}

	return &dto.ClubDashboardResponse{
		Club:           mapClub(*club),
		TeamCount:      teamCount,
		PlayerCount:    playerCount,
		CoachCount:     coachCount,
		TeamStats:      teamStats,
		RecentSessions: recentSessions,
	}, nil
}

func mapClub(c domain.Club) dto.ClubResponse {
	return dto.ClubResponse{
		ID:        c.ID,
		Name:      c.Name,
		Country:   c.Country,
		City:      c.City,
		LogoURL:   c.LogoURL,
		FoundedAt: c.FoundedAt,
		CreatedAt: c.CreatedAt,
	}
}

func mapSession(s domain.TrainingSession) dto.SessionResponse {
	return dto.SessionResponse{
		ID:          s.ID,
		TeamID:      s.TeamID,
		CoachID:     s.CoachID,
		ScheduledAt: s.ScheduledAt,
		DurationMin: s.DurationMin,
		Location:    s.Location,
		Status:      string(s.Status),
		Intensity:   string(s.Intensity),
		Focus:       s.Focus,
		Notes:       s.Notes,
		CreatedAt:   s.CreatedAt,
	}
}
