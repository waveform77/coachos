package postgres

import (
	"context"
	"errors"

	"github.com/coachos/backend/internal/domain"
	"gorm.io/gorm"
)

type teamRepo struct {
	db *gorm.DB
}

// NewTeamRepository returns a GORM-backed TeamRepository.
func NewTeamRepository(db *gorm.DB) *teamRepo {
	return &teamRepo{db: db}
}

func (r *teamRepo) Create(ctx context.Context, team *domain.Team) error {
	return r.db.WithContext(ctx).Create(team).Error
}

func (r *teamRepo) FindByID(ctx context.Context, id string) (*domain.Team, error) {
	var team domain.Team
	err := r.db.WithContext(ctx).First(&team, "id = ?", id).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, domain.NewNotFound("team", id)
	}
	return &team, err
}

func (r *teamRepo) FindByClub(ctx context.Context, clubID string, page, limit int) ([]domain.Team, int64, error) {
	var teams []domain.Team
	var total int64

	q := r.db.WithContext(ctx).Model(&domain.Team{}).Where("club_id = ?", clubID)
	if err := q.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	offset := (page - 1) * limit
	err := q.Offset(offset).Limit(limit).Order("created_at DESC").Find(&teams).Error
	return teams, total, err
}

func (r *teamRepo) Update(ctx context.Context, team *domain.Team) error {
	return r.db.WithContext(ctx).Save(team).Error
}

func (r *teamRepo) Delete(ctx context.Context, id string) error {
	return r.db.WithContext(ctx).Delete(&domain.Team{}, "id = ?", id).Error
}

func (r *teamRepo) AddMember(ctx context.Context, member *domain.TeamMember) error {
	return r.db.WithContext(ctx).Create(member).Error
}

func (r *teamRepo) RemoveMember(ctx context.Context, teamID, playerID string) error {
	return r.db.WithContext(ctx).
		Delete(&domain.TeamMember{}, "team_id = ? AND player_id = ?", teamID, playerID).Error
}

func (r *teamRepo) GetMembers(ctx context.Context, teamID string) ([]domain.TeamMember, error) {
	var members []domain.TeamMember
	err := r.db.WithContext(ctx).
		Preload("Player").
		Where("team_id = ?", teamID).
		Find(&members).Error
	return members, err
}
