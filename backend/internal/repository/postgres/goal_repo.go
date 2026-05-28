package postgres

import (
	"context"
	"errors"

	"github.com/coachos/backend/internal/domain"
	"gorm.io/gorm"
)

type goalRepo struct {
	db *gorm.DB
}

// NewGoalRepository returns a GORM-backed PlayerGoalRepository.
func NewGoalRepository(db *gorm.DB) *goalRepo {
	return &goalRepo{db: db}
}

func (r *goalRepo) Create(ctx context.Context, goal *domain.PlayerGoal) error {
	return r.db.WithContext(ctx).Create(goal).Error
}

func (r *goalRepo) FindByPlayer(ctx context.Context, playerID string) ([]domain.PlayerGoal, error) {
	var goals []domain.PlayerGoal
	err := r.db.WithContext(ctx).
		Where("player_id = ?", playerID).
		Order("created_at DESC").
		Find(&goals).Error
	return goals, err
}

func (r *goalRepo) Update(ctx context.Context, goal *domain.PlayerGoal) error {
	return r.db.WithContext(ctx).Save(goal).Error
}

func (r *goalRepo) Delete(ctx context.Context, id string) error {
	if err := r.db.WithContext(ctx).First(&domain.PlayerGoal{}, "id = ?", id).Error; errors.Is(err, gorm.ErrRecordNotFound) {
		return domain.NewNotFound("goal", id)
	}
	return r.db.WithContext(ctx).Delete(&domain.PlayerGoal{}, "id = ?", id).Error
}
