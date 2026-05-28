package postgres

import (
	"context"
	"errors"

	"github.com/coachos/backend/internal/domain"
	"gorm.io/gorm"
)

type userRepo struct {
	db *gorm.DB
}

// NewUserRepository returns a GORM-backed UserRepository.
func NewUserRepository(db *gorm.DB) *userRepo {
	return &userRepo{db: db}
}

func (r *userRepo) Create(ctx context.Context, user *domain.User) error {
	return r.db.WithContext(ctx).Create(user).Error
}

func (r *userRepo) FindByID(ctx context.Context, id string) (*domain.User, error) {
	var user domain.User
	err := r.db.WithContext(ctx).First(&user, "id = ?", id).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, domain.NewNotFound("user", id)
	}
	return &user, err
}

func (r *userRepo) FindByEmail(ctx context.Context, email string) (*domain.User, error) {
	var user domain.User
	err := r.db.WithContext(ctx).First(&user, "email = ?", email).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, domain.NewNotFound("user", email)
	}
	return &user, err
}

func (r *userRepo) Update(ctx context.Context, user *domain.User) error {
	return r.db.WithContext(ctx).Save(user).Error
}

func (r *userRepo) List(ctx context.Context, clubID string, role domain.Role, page, limit int) ([]domain.User, int64, error) {
	var users []domain.User
	var total int64

	q := r.db.WithContext(ctx).Model(&domain.User{})
	if clubID != "" {
		q = q.Where("club_id = ?", clubID)
	}
	if role != "" {
		q = q.Where("role = ?", role)
	}

	if err := q.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	offset := (page - 1) * limit
	err := q.Offset(offset).Limit(limit).Order("created_at DESC").Find(&users).Error
	return users, total, err
}
