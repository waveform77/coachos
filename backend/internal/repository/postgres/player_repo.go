package postgres

import (
	"context"
	"errors"

	"github.com/coachos/backend/internal/domain"
	"gorm.io/gorm"
)

type playerRepo struct {
	db *gorm.DB
}

// NewPlayerRepository returns a GORM-backed PlayerRepository.
func NewPlayerRepository(db *gorm.DB) *playerRepo {
	return &playerRepo{db: db}
}

func (r *playerRepo) Create(ctx context.Context, player *domain.Player) error {
	return r.db.WithContext(ctx).Create(player).Error
}

func (r *playerRepo) FindByID(ctx context.Context, id string) (*domain.Player, error) {
	var player domain.Player
	err := r.db.WithContext(ctx).First(&player, "id = ?", id).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, domain.NewNotFound("player", id)
	}
	return &player, err
}

func (r *playerRepo) FindByUserID(ctx context.Context, userID string) (*domain.Player, error) {
	var player domain.Player
	err := r.db.WithContext(ctx).Where("user_id = ?", userID).First(&player).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, domain.NewNotFound("player", userID)
	}
	return &player, err
}

func (r *playerRepo) FindByClub(ctx context.Context, clubID string, page, limit int) ([]domain.Player, int64, error) {
	var players []domain.Player
	var total int64

	q := r.db.WithContext(ctx).Model(&domain.Player{}).Where("club_id = ?", clubID)
	if err := q.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	offset := (page - 1) * limit
	err := q.Offset(offset).Limit(limit).Order("last_name ASC").Find(&players).Error
	return players, total, err
}

func (r *playerRepo) Update(ctx context.Context, player *domain.Player) error {
	return r.db.WithContext(ctx).Save(player).Error
}

func (r *playerRepo) Delete(ctx context.Context, id string) error {
	return r.db.WithContext(ctx).Delete(&domain.Player{}, "id = ?", id).Error
}

func (r *playerRepo) UpdateDevIndex(ctx context.Context, playerID string, index float64) error {
	return r.db.WithContext(ctx).Model(&domain.Player{}).
		Where("id = ?", playerID).
		Update("dev_index", index).Error
}
