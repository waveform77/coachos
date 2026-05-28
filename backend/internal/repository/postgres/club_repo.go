package postgres

import (
	"context"
	"errors"

	"github.com/coachos/backend/internal/domain"
	"gorm.io/gorm"
)

type clubRepo struct {
	db *gorm.DB
}

// NewClubRepository returns a GORM-backed ClubRepository.
func NewClubRepository(db *gorm.DB) *clubRepo {
	return &clubRepo{db: db}
}

func (r *clubRepo) Create(ctx context.Context, club *domain.Club) error {
	return r.db.WithContext(ctx).Create(club).Error
}

func (r *clubRepo) FindByID(ctx context.Context, id string) (*domain.Club, error) {
	var club domain.Club
	err := r.db.WithContext(ctx).First(&club, "id = ?", id).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, domain.NewNotFound("club", id)
	}
	return &club, err
}

func (r *clubRepo) Update(ctx context.Context, club *domain.Club) error {
	return r.db.WithContext(ctx).Save(club).Error
}
