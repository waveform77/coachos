package postgres

import (
	"context"

	"github.com/coachos/backend/internal/domain"
	"gorm.io/gorm"
)

type aiRepo struct {
	db *gorm.DB
}

// NewAIRepository returns a GORM-backed AIRepository.
func NewAIRepository(db *gorm.DB) *aiRepo {
	return &aiRepo{db: db}
}

func (r *aiRepo) Save(ctx context.Context, rec *domain.AIRecommendation) error {
	return r.db.WithContext(ctx).Create(rec).Error
}

func (r *aiRepo) GetByTarget(ctx context.Context, targetType domain.AITargetType, targetID string) ([]domain.AIRecommendation, error) {
	var recs []domain.AIRecommendation
	err := r.db.WithContext(ctx).
		Where("target_type = ? AND target_id = ?", targetType, targetID).
		Order("created_at DESC").
		Find(&recs).Error
	return recs, err
}
