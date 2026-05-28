package notifier

import (
	"context"

	"github.com/coachos/backend/internal/domain"
)

// NotificationEvent represents a notification to be dispatched.
type NotificationEvent struct {
	UserIDs []string
	Type    domain.NotificationType
	Title   string
	Body    string
	Payload interface{}
}

// Notifier is the interface for dispatching notifications.
type Notifier interface {
	Notify(ctx context.Context, event NotificationEvent) error
}
