package middleware

import (
	"time"

	"github.com/coachos/backend/internal/pkg/idgen"
	"github.com/gofiber/fiber/v2"
	"github.com/rs/zerolog"
)

// RequestLogger returns a Fiber middleware that logs each request using zerolog.
func RequestLogger(log *zerolog.Logger) fiber.Handler {
	return func(c *fiber.Ctx) error {
		start := time.Now()
		requestID := idgen.New()

		// Attach request ID to context
		c.Locals("request_id", requestID)
		c.Set("X-Request-ID", requestID)

		// Process request
		err := c.Next()

		// Log after completion
		status := c.Response().StatusCode()
		latency := time.Since(start)

		event := log.Info()
		if status >= 500 {
			event = log.Error()
		} else if status >= 400 {
			event = log.Warn()
		}

		claims := GetClaims(c)
		userID := ""
		role := ""
		if claims != nil {
			userID = claims.UserID
			role = claims.Role
		}

		event.
			Str("request_id", requestID).
			Str("method", c.Method()).
			Str("path", c.Path()).
			Int("status", status).
			Dur("latency", latency).
			Str("ip", c.IP()).
			Str("user_id", userID).
			Str("role", role).
			Str("user_agent", c.Get("User-Agent")).
			Msg("http request")

		return err
	}
}
