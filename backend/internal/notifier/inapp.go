package notifier

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/coachos/backend/internal/domain"
	"github.com/coachos/backend/internal/pkg/idgen"
	"gorm.io/datatypes"
	"gorm.io/gorm"
)

// InAppNotifier saves notifications to the database.
type InAppNotifier struct {
	db *gorm.DB
}

// NewInAppNotifier creates a new InAppNotifier.
func NewInAppNotifier(db *gorm.DB) *InAppNotifier {
	return &InAppNotifier{db: db}
}

// Notify creates in-app notification records for each user.
func (n *InAppNotifier) Notify(ctx context.Context, event NotificationEvent) error {
	if len(event.UserIDs) == 0 {
		return nil
	}

	var payloadJSON datatypes.JSON
	if event.Payload != nil {
		b, err := json.Marshal(event.Payload)
		if err == nil {
			payloadJSON = datatypes.JSON(b)
		}
	}
	if payloadJSON == nil {
		payloadJSON = datatypes.JSON(`{}`)
	}

	notifications := make([]*domain.Notification, 0, len(event.UserIDs))
	now := time.Now()

	for _, userID := range event.UserIDs {
		notifications = append(notifications, &domain.Notification{
			ID:        idgen.New(),
			UserID:    userID,
			Type:      event.Type,
			Title:     event.Title,
			Body:      event.Body,
			Payload:   payloadJSON,
			CreatedAt: now,
		})
	}

	return n.db.WithContext(ctx).Create(&notifications).Error
}

// NotifyParentInvitation notifies parent about new invitation (email simulation - just in-app for now)
func (n *InAppNotifier) NotifyParentInvitation(email string, inv *domain.ParentInvitation, player *domain.Player) error {
	// В реальном приложении здесь отправка email
	// Пока просто логируем - в будущем можно добавить email сервис

	// Пытаемся найти пользователя с таким email для in-app уведомления
	var user domain.User
	if err := n.db.Where("email = ?", email).First(&user).Error; err == nil {
		// Пользователь найден - отправляем in-app уведомление
		payload := map[string]interface{}{
			"invitationID": inv.ID,
			"playerID":     inv.PlayerID,
			"playerName":   player.FullName(),
			"token":        inv.Token,
			"type":         "parent_invitation",
		}

		event := NotificationEvent{
			UserIDs: []string{user.ID},
			Type:    domain.NotificationGeneral,
			Title:   "Invitation to link with player",
			Body:    fmt.Sprintf("You have been invited to link with player %s", player.FullName()),
			Payload: payload,
		}
		return n.Notify(context.Background(), event)
	}

	// Если пользователь не найден - ничего не делаем (email отправится позже)
	return nil
}

// NotifyParentLinked notifies parent about successful linking
func (n *InAppNotifier) NotifyParentLinked(parentUserID string, playerName string) error {
	payload := map[string]interface{}{
		"playerName": playerName,
		"type":       "parent_linked",
	}

	event := NotificationEvent{
		UserIDs: []string{parentUserID},
		Type:    domain.NotificationGeneral,
		Title:   "Successfully linked to player",
		Body:    fmt.Sprintf("You are now linked to player %s", playerName),
		Payload: payload,
	}

	return n.Notify(context.Background(), event)
}
