package service

import (
	"context"

	"github.com/coachos/backend/internal/domain"
	"github.com/coachos/backend/internal/repository"
)

// NotificationService handles notification retrieval and management.
type NotificationService struct {
	repo repository.NotificationRepository
}

// NewNotificationService creates a new NotificationService.
func NewNotificationService(repo repository.NotificationRepository) *NotificationService {
	return &NotificationService{repo: repo}
}

// GetByUser returns paginated notifications for a user.
func (s *NotificationService) GetByUser(ctx context.Context, userID string, unreadOnly bool, page, limit int) ([]domain.Notification, int64, error) {
	return s.repo.GetByUser(ctx, userID, unreadOnly, page, limit)
}

// MarkRead marks a single notification as read.
func (s *NotificationService) MarkRead(ctx context.Context, id, userID string) error {
	return s.repo.MarkRead(ctx, id, userID)
}

// MarkAllRead marks all notifications as read for a user.
func (s *NotificationService) MarkAllRead(ctx context.Context, userID string) error {
	return s.repo.MarkAllRead(ctx, userID)
}
