package service

import (
	"context"

	"github.com/coachos/backend/internal/domain"
	"github.com/coachos/backend/internal/dto"
	"github.com/coachos/backend/internal/repository"
)

// MatchService handles match business logic.
type MatchService struct {
	matchRepo repository.MatchRepository
}

// NewMatchService creates a new MatchService.
func NewMatchService(matchRepo repository.MatchRepository) *MatchService {
	return &MatchService{matchRepo: matchRepo}
}

// Create creates a new match.
func (s *MatchService) Create(ctx context.Context, req dto.CreateMatchRequest) (*domain.Match, error) {
	match := &domain.Match{
		TeamID:    req.TeamID,
		Opponent:  req.Opponent,
		KickoffAt: req.KickoffAt,
		Location:  req.Location,
		IsHome:    req.IsHome,
		Status:    domain.MatchStatusScheduled,
		Notes:     req.Notes,
	}
	if err := s.matchRepo.Create(ctx, match); err != nil {
		return nil, err
	}
	return match, nil
}

// FindByID returns a match by ID.
func (s *MatchService) FindByID(ctx context.Context, id string) (*domain.Match, error) {
	return s.matchRepo.FindByID(ctx, id)
}

// FindByTeam returns paginated matches for a team.
func (s *MatchService) FindByTeam(ctx context.Context, teamID string, page, limit int) ([]domain.Match, int64, error) {
	return s.matchRepo.FindByTeam(ctx, teamID, page, limit)
}

// FindByClub returns paginated matches for all teams in a club.
func (s *MatchService) FindByClub(ctx context.Context, clubID string, page, limit int) ([]domain.Match, int64, error) {
	return s.matchRepo.FindByClub(ctx, clubID, page, limit)
}

// FindByPlayer returns paginated matches for teams a player belongs to.
func (s *MatchService) FindByPlayer(ctx context.Context, playerID string, page, limit int) ([]domain.Match, int64, error) {
	return s.matchRepo.FindByPlayer(ctx, playerID, page, limit)
}

// Update updates a match.
func (s *MatchService) Update(ctx context.Context, id string, req dto.UpdateMatchRequest) (*domain.Match, error) {
	match, err := s.matchRepo.FindByID(ctx, id)
	if err != nil {
		return nil, err
	}

	if req.Opponent != "" {
		match.Opponent = req.Opponent
	}
	if req.KickoffAt != nil {
		match.KickoffAt = *req.KickoffAt
	}
	if req.Location != "" {
		match.Location = req.Location
	}
	if req.IsHome != nil {
		match.IsHome = *req.IsHome
	}
	if req.Status != "" {
		match.Status = domain.MatchStatus(req.Status)
	}
	if req.GoalsFor != nil {
		match.GoalsFor = *req.GoalsFor
	}
	if req.GoalsAgainst != nil {
		match.GoalsAgainst = *req.GoalsAgainst
	}
	if req.Notes != "" {
		match.Notes = req.Notes
	}

	if err := s.matchRepo.Update(ctx, match); err != nil {
		return nil, err
	}
	return match, nil
}

// Delete deletes a match.
func (s *MatchService) Delete(ctx context.Context, id string) error {
	if _, err := s.matchRepo.FindByID(ctx, id); err != nil {
		return err
	}
	return s.matchRepo.Delete(ctx, id)
}

// SetLineup sets the full lineup for a match.
func (s *MatchService) SetLineup(ctx context.Context, matchID string, req dto.SetLineupRequest) error {
	lineups := make([]domain.MatchLineup, 0, len(req.Players))
	for _, p := range req.Players {
		ml := domain.MatchLineup{
			MatchID:       matchID,
			PlayerID:      p.PlayerID,
			Role:          domain.LineupRole(p.Role),
			Position:      domain.Position(p.Position),
			MinutesPlayed: p.MinutesPlayed,
		}
		if p.FieldX != nil {
			ml.FieldX = p.FieldX
		}
		if p.FieldY != nil {
			ml.FieldY = p.FieldY
		}
		lineups = append(lineups, ml)
	}
	return s.matchRepo.SetLineup(ctx, matchID, lineups)
}

// AddEvent records a match event.
func (s *MatchService) AddEvent(ctx context.Context, matchID string, req dto.AddMatchEventRequest) (*domain.MatchEvent, error) {
	event := &domain.MatchEvent{
		MatchID:  matchID,
		PlayerID: req.PlayerID,
		Minute:   req.Minute,
		Type:     domain.MatchEventType(req.Type),
		Notes:    req.Notes,
	}
	if err := s.matchRepo.AddEvent(ctx, event); err != nil {
		return nil, err
	}
	return event, nil
}

// GetLineup returns the lineup for a match.
func (s *MatchService) GetLineup(ctx context.Context, matchID string) ([]domain.MatchLineup, error) {
	return s.matchRepo.GetLineup(ctx, matchID)
}

// GetEvents returns the events for a match.
func (s *MatchService) GetEvents(ctx context.Context, matchID string) ([]domain.MatchEvent, error) {
	return s.matchRepo.GetEvents(ctx, matchID)
}

// GetSummary returns aggregated per-player stats for a match.
func (s *MatchService) GetSummary(ctx context.Context, matchID string) (*dto.MatchSummaryResponse, error) {
	match, err := s.matchRepo.FindByID(ctx, matchID)
	if err != nil {
		return nil, err
	}

	events, err := s.matchRepo.GetEvents(ctx, matchID)
	if err != nil {
		return nil, err
	}

	statsMap := make(map[string]*dto.PlayerMatchStat)
	for _, ev := range events {
		if ev.PlayerID == nil {
			continue
		}
		pid := *ev.PlayerID
		if _, ok := statsMap[pid]; !ok {
			name := ""
			if ev.Player != nil {
				name = ev.Player.FirstName + " " + ev.Player.LastName
			}
			statsMap[pid] = &dto.PlayerMatchStat{PlayerID: pid, PlayerName: name}
		}
		switch ev.Type {
		case domain.MatchEventGoal:
			statsMap[pid].Goals++
		case domain.MatchEventAssist:
			statsMap[pid].Assists++
		case domain.MatchEventYellow:
			statsMap[pid].YellowCards++
		case domain.MatchEventRed:
			statsMap[pid].RedCards++
		}
	}

	stats := make([]dto.PlayerMatchStat, 0, len(statsMap))
	for _, v := range statsMap {
		stats = append(stats, *v)
	}

	return &dto.MatchSummaryResponse{
		MatchResponse: dto.MatchResponse{
			ID:           match.ID,
			TeamID:       match.TeamID,
			Opponent:     match.Opponent,
			KickoffAt:    match.KickoffAt,
			Location:     match.Location,
			IsHome:       match.IsHome,
			Status:       string(match.Status),
			GoalsFor:     match.GoalsFor,
			GoalsAgainst: match.GoalsAgainst,
			Notes:        match.Notes,
			CreatedAt:    match.CreatedAt,
		},
		PlayerStats: stats,
	}, nil
}
