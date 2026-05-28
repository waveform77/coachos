package middleware

import (
	"fmt"
	"net/http"
	"runtime/debug"

	"github.com/gofiber/fiber/v2"
	"github.com/rs/zerolog"
)

// RecoverMiddleware recovers from panics and logs them.
func RecoverMiddleware(log *zerolog.Logger) fiber.Handler {
	return func(c *fiber.Ctx) (err error) {
		defer func() {
			if r := recover(); r != nil {
				stack := debug.Stack()
				log.Error().
					Interface("panic", r).
					Str("stack", string(stack)).
					Str("path", c.Path()).
					Str("method", c.Method()).
					Msg("panic recovered")

				err = c.Status(http.StatusInternalServerError).JSON(fiber.Map{
					"error": fiber.Map{
						"code":    "internal_server_error",
						"message": fmt.Sprintf("panic: %v", r),
					},
				})
			}
		}()
		return c.Next()
	}
}
