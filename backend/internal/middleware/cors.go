package middleware

import (
	"strings"

	"github.com/gofiber/fiber/v2"
)

// CORSMiddleware returns a Fiber handler that sets CORS headers.
func CORSMiddleware(origins []string) fiber.Handler {
	return func(c *fiber.Ctx) error {
		origin := c.Get("Origin")

		for _, allowed := range origins {
			if strings.TrimSpace(allowed) == "*" || strings.TrimSpace(allowed) == origin {
				c.Set("Access-Control-Allow-Origin", origin)
				break
			}
		}

		c.Set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS")
		c.Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
		c.Set("Access-Control-Allow-Credentials", "true")

		if c.Method() == "OPTIONS" {
			return c.SendStatus(fiber.StatusNoContent)
		}

		return c.Next()
	}
}
