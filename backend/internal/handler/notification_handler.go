package handler

import (
	"github.com/coachos/backend/internal/dto"
	pkgjwt "github.com/coachos/backend/internal/pkg/jwt"
	"github.com/coachos/backend/internal/service"
	"github.com/gofiber/fiber/v2"
)

// NotificationHandler handles notification endpoints.
type NotificationHandler struct {
	notificationService *service.NotificationService
}

// NewNotificationHandler creates a new NotificationHandler.
func NewNotificationHandler(notificationService *service.NotificationService) *NotificationHandler {
	return &NotificationHandler{notificationService: notificationService}
}

// GetNotifications handles GET /api/v1/notifications.
func (h *NotificationHandler) GetNotifications(c *fiber.Ctx) error {
	claims := c.Locals("user").(*pkgjwt.Claims)

	var pq dto.PaginationQuery
	_ = c.QueryParser(&pq)
	pq.Defaults()

	unreadOnly := c.QueryBool("unreadOnly", false)

	notifications, total, err := h.notificationService.GetByUser(c.UserContext(), claims.UserID, unreadOnly, pq.Page, pq.Limit)
	if err != nil {
		return err
	}

	type NotificationResponse struct {
		ID        string      `json:"id"`
		Type      string      `json:"type"`
		Title     string      `json:"title"`
		Body      string      `json:"body"`
		Payload   interface{} `json:"payload,omitempty"`
		ReadAt    interface{} `json:"readAt,omitempty"`
		CreatedAt interface{} `json:"createdAt"`
	}

	resp := make([]NotificationResponse, 0, len(notifications))
	for _, n := range notifications {
		resp = append(resp, NotificationResponse{
			ID:        n.ID,
			Type:      string(n.Type),
			Title:     n.Title,
			Body:      n.Body,
			ReadAt:    n.ReadAt,
			CreatedAt: n.CreatedAt,
		})
	}

	return c.JSON(dto.PaginatedResponse[NotificationResponse]{
		Data: resp,
		Meta: dto.MetaData{Page: pq.Page, Limit: pq.Limit, Total: total},
	})
}

// MarkRead handles PATCH /api/v1/notifications/:id/read.
func (h *NotificationHandler) MarkRead(c *fiber.Ctx) error {
	id := c.Params("id")
	claims := c.Locals("user").(*pkgjwt.Claims)

	if err := h.notificationService.MarkRead(c.UserContext(), id, claims.UserID); err != nil {
		return err
	}
	return c.JSON(dto.MessageResponse{Message: "notification marked as read"})
}

// MarkAllRead handles PATCH /api/v1/notifications/read-all.
func (h *NotificationHandler) MarkAllRead(c *fiber.Ctx) error {
	claims := c.Locals("user").(*pkgjwt.Claims)

	if err := h.notificationService.MarkAllRead(c.UserContext(), claims.UserID); err != nil {
		return err
	}
	return c.JSON(dto.MessageResponse{Message: "all notifications marked as read"})
}
