package postgres

import (
	"context"
	"errors"

	"github.com/coachos/backend/internal/domain"
	"github.com/coachos/backend/internal/repository"
	"gorm.io/gorm"
)

type matchRepo struct {
	db *gorm.DB
}

// NewMatchRepository returns a GORM-backed MatchRepository.
func NewMatchRepository(db *gorm.DB) *matchRepo {
	return &matchRepo{db: db}
}

func (r *matchRepo) Create(ctx context.Context, match *domain.Match) error {
	return r.db.WithContext(ctx).Create(match).Error
}

func (r *matchRepo) FindByID(ctx context.Context, id string) (*domain.Match, error) {
	var match domain.Match
	err := r.db.WithContext(ctx).First(&match, "id = ?", id).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, domain.NewNotFound("match", id)
	}
	return &match, err
}

func (r *matchRepo) FindByTeam(ctx context.Context, teamID string, page, limit int) ([]domain.Match, int64, error) {
	var matches []domain.Match
	var total int64

	q := r.db.WithContext(ctx).Model(&domain.Match{}).Where("team_id = ?", teamID)
	if err := q.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	offset := (page - 1) * limit
	err := q.Offset(offset).Limit(limit).Order("kickoff_at DESC").Find(&matches).Error
	return matches, total, err
}

func (r *matchRepo) FindByClub(ctx context.Context, clubID string, page, limit int) ([]domain.Match, int64, error) {
	var matches []domain.Match
	var total int64

	q := r.db.WithContext(ctx).Model(&domain.Match{}).
		Where("team_id IN (SELECT id FROM teams WHERE club_id = ? AND deleted_at IS NULL)", clubID)
	if err := q.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	offset := (page - 1) * limit
	err := q.Offset(offset).Limit(limit).Order("kickoff_at DESC").Find(&matches).Error
	return matches, total, err
}

func (r *matchRepo) FindByPlayer(ctx context.Context, playerID string, page, limit int) ([]domain.Match, int64, error) {
	var matches []domain.Match
	var total int64

	q := r.db.WithContext(ctx).Model(&domain.Match{}).
		Where("team_id IN (SELECT team_id FROM team_members WHERE player_id = ?)", playerID)
	if err := q.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	offset := (page - 1) * limit
	err := q.Offset(offset).Limit(limit).Order("kickoff_at DESC").Find(&matches).Error
	return matches, total, err
}

func (r *matchRepo) Update(ctx context.Context, match *domain.Match) error {
	return r.db.WithContext(ctx).Save(match).Error
}

func (r *matchRepo) Delete(ctx context.Context, id string) error {
	return r.db.WithContext(ctx).Delete(&domain.Match{}, "id = ?", id).Error
}

func (r *matchRepo) SetLineup(ctx context.Context, matchID string, lineups []domain.MatchLineup) error {
	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		if err := tx.Where("match_id = ?", matchID).Delete(&domain.MatchLineup{}).Error; err != nil {
			return err
		}
		if len(lineups) == 0 {
			return nil
		}
		return tx.Create(&lineups).Error
	})
}

func (r *matchRepo) GetLineup(ctx context.Context, matchID string) ([]domain.MatchLineup, error) {
	var lineups []domain.MatchLineup
	err := r.db.WithContext(ctx).
		Preload("Player").
		Where("match_id = ?", matchID).
		Find(&lineups).Error
	return lineups, err
}

func (r *matchRepo) AddEvent(ctx context.Context, event *domain.MatchEvent) error {
	return r.db.WithContext(ctx).Create(event).Error
}

func (r *matchRepo) GetEvents(ctx context.Context, matchID string) ([]domain.MatchEvent, error) {
	var events []domain.MatchEvent
	err := r.db.WithContext(ctx).
		Preload("Player").
		Where("match_id = ?", matchID).
		Order("minute ASC").
		Find(&events).Error
	return events, err
}

func (r *matchRepo) GetPlayerMatchStats(ctx context.Context, playerID string) (*repository.PlayerMatchStats, error) {
	var stats repository.PlayerMatchStats

	// Goals
	var goals int64
	r.db.WithContext(ctx).Model(&domain.MatchEvent{}).
		Where("player_id = ? AND type = 'goal'", playerID).
		Count(&goals)
	stats.Goals = int(goals)

	// Assists
	var assists int64
	r.db.WithContext(ctx).Model(&domain.MatchEvent{}).
		Where("player_id = ? AND type = 'assist'", playerID).
		Count(&assists)
	stats.Assists = int(assists)

	// Yellow cards
	var yellows int64
	r.db.WithContext(ctx).Model(&domain.MatchEvent{}).
		Where("player_id = ? AND type = 'yellow_card'", playerID).
		Count(&yellows)
	stats.YellowCards = int(yellows)

	// Red cards
	var reds int64
	r.db.WithContext(ctx).Model(&domain.MatchEvent{}).
		Where("player_id = ? AND type = 'red_card'", playerID).
		Count(&reds)
	stats.RedCards = int(reds)

	// Minutes played & matches played
	type result struct {
		Minutes int
		Matches int64
	}
	var res result
	r.db.WithContext(ctx).Model(&domain.MatchLineup{}).
		Select("COALESCE(SUM(minutes_played), 0) as minutes, COUNT(*) as matches").
		Where("player_id = ?", playerID).
		Scan(&res)
	stats.MinutesPlayed = res.Minutes
	stats.MatchesPlayed = int(res.Matches)

	return &stats, nil
}
