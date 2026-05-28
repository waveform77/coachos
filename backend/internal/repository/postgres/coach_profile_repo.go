package postgres

import (
	"context"
	"errors"

	"github.com/coachos/backend/internal/domain"
	"gorm.io/gorm"
)

type coachProfileRepo struct {
	db *gorm.DB
}

// NewCoachProfileRepository returns a GORM-backed CoachProfileRepository.
func NewCoachProfileRepository(db *gorm.DB) *coachProfileRepo {
	return &coachProfileRepo{db: db}
}

func (r *coachProfileRepo) Create(ctx context.Context, profile *domain.CoachProfile) error {
	return r.db.WithContext(ctx).Create(profile).Error
}

func (r *coachProfileRepo) FindByUserID(ctx context.Context, userID string) (*domain.CoachProfile, error) {
	var profile domain.CoachProfile
	err := r.db.WithContext(ctx).First(&profile, "user_id = ?", userID).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, nil
	}
	return &profile, err
}

func (r *coachProfileRepo) Update(ctx context.Context, profile *domain.CoachProfile) error {
	return r.db.WithContext(ctx).Save(profile).Error
}
