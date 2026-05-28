package postgres

import (
	"context"
	"time"

	"github.com/coachos/backend/internal/domain"
	"gorm.io/gorm"
)

type notificationRepo struct {
	db *gorm.DB
}

// NewNotificationRepository returns a GORM-backed NotificationRepository.
func NewNotificationRepository(db *gorm.DB) *notificationRepo {
	return &notificationRepo{db: db}
}

func (r *notificationRepo) Create(ctx context.Context, n *domain.Notification) error {
	return r.db.WithContext(ctx).Create(n).Error
}

func (r *notificationRepo) GetByUser(ctx context.Context, userID string, unreadOnly bool, page, limit int) ([]domain.Notification, int64, error) {
	var notifications []domain.Notification
	var total int64

	q := r.db.WithContext(ctx).Model(&domain.Notification{}).Where("user_id = ?", userID)
	if unreadOnly {
		q = q.Where("read_at IS NULL")
	}

	if err := q.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	offset := (page - 1) * limit
	err := q.Offset(offset).Limit(limit).Order("created_at DESC").Find(&notifications).Error
	return notifications, total, err
}

func (r *notificationRepo) MarkRead(ctx context.Context, id, userID string) error {
	now := time.Now()
	return r.db.WithContext(ctx).Model(&domain.Notification{}).
		Where("id = ? AND user_id = ?", id, userID).
		Update("read_at", now).Error
}

func (r *notificationRepo) MarkAllRead(ctx context.Context, userID string) error {
	now := time.Now()
	return r.db.WithContext(ctx).Model(&domain.Notification{}).
		Where("user_id = ? AND read_at IS NULL", userID).
		Update("read_at", now).Error
}
