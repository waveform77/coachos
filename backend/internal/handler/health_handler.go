package handler

import (
	"time"

	"github.com/gofiber/fiber/v2"
)

// HealthHandler handles health check requests.
type HealthHandler struct {
	version   string
	startTime time.Time
}

// NewHealthHandler creates a new HealthHandler.
func NewHealthHandler(version string) *HealthHandler {
	return &HealthHandler{
		version:   version,
		startTime: time.Now(),
	}
}

// Health godoc
// @Summary Health check
// @Description Returns service health status
// @Tags health
// @Produce json
// @Success 200 {object} map[string]interface{}
// @Router /health [get]
func (h *HealthHandler) Health(c *fiber.Ctx) error {
	return c.JSON(fiber.Map{
		"status":    "ok",
		"service":   "coachos-api",
		"version":   h.version,
		"timestamp": time.Now().UTC().Format(time.RFC3339),
		"uptime":    time.Since(h.startTime).String(),
	})
}
