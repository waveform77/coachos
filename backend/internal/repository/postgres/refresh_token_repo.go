package postgres

import (
	"context"
	"errors"
	"time"

	"github.com/coachos/backend/internal/domain"
	"gorm.io/gorm"
)

type refreshTokenRepo struct {
	db *gorm.DB
}

// NewRefreshTokenRepository returns a GORM-backed RefreshTokenRepository.
func NewRefreshTokenRepository(db *gorm.DB) *refreshTokenRepo {
	return &refreshTokenRepo{db: db}
}

func (r *refreshTokenRepo) Create(ctx context.Context, token *domain.RefreshToken) error {
	return r.db.WithContext(ctx).Create(token).Error
}

func (r *refreshTokenRepo) FindByHash(ctx context.Context, hash string) (*domain.RefreshToken, error) {
	var token domain.RefreshToken
	err := r.db.WithContext(ctx).First(&token, "token_hash = ?", hash).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, domain.NewNotFound("refresh_token", hash)
	}
	return &token, err
}

func (r *refreshTokenRepo) MarkUsed(ctx context.Context, id string) error {
	now := time.Now()
	return r.db.WithContext(ctx).Model(&domain.RefreshToken{}).
		Where("id = ?", id).
		Update("used_at", now).Error
}

func (r *refreshTokenRepo) RevokeFamily(ctx context.Context, familyID string) error {
	now := time.Now()
	return r.db.WithContext(ctx).Model(&domain.RefreshToken{}).
		Where("family_id = ? AND used_at IS NULL", familyID).
		Update("used_at", now).Error
}

func (r *refreshTokenRepo) DeleteExpired(ctx context.Context) error {
	return r.db.WithContext(ctx).
		Where("expires_at < ?", time.Now()).
		Delete(&domain.RefreshToken{}).Error
}
