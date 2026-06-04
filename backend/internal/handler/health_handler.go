package handler

import "github.com/gofiber/fiber/v2"

// HealthHandler handles health check endpoints.
type HealthHandler struct {
	version string
}

// NewHealthHandler creates a new HealthHandler.
func NewHealthHandler(version string) *HealthHandler {
	return &HealthHandler{version: version}
}

// Health handles GET /health.
func (h *HealthHandler) Health(c *fiber.Ctx) error {
	return c.JSON(fiber.Map{
		"status":  "ok",
		"version": h.version,
	})
}
