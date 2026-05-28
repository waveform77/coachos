package middleware

import (
	"strings"

	"github.com/coachos/backend/internal/domain"
	pkgjwt "github.com/coachos/backend/internal/pkg/jwt"
	"github.com/gofiber/fiber/v2"
)

const UserContextKey = "user_claims"

// AuthMiddleware validates the JWT access token from the Authorization header.
func AuthMiddleware(jwtSecret string) fiber.Handler {
	return func(c *fiber.Ctx) error {
		authHeader := c.Get("Authorization")
		if authHeader == "" {
			return domain.NewUnauthorized("authorization header is required")
		}

		parts := strings.SplitN(authHeader, " ", 2)
		if len(parts) != 2 || !strings.EqualFold(parts[0], "Bearer") {
			return domain.NewUnauthorized("invalid authorization header format")
		}

		tokenString := parts[1]
		claims, err := pkgjwt.ParseAccessToken(tokenString, jwtSecret)
		if err != nil {
			if err == pkgjwt.ErrExpiredToken {
				return domain.NewUnauthorized("access token has expired")
			}
			return domain.NewUnauthorized("invalid access token")
		}

		c.Locals(UserContextKey, claims)
		c.Locals("user", claims) // handlers expect this key
		return c.Next()
	}
}

// Auth is an alias for AuthMiddleware (used by routes registration).
func Auth(jwtSecret string) fiber.Handler {
	return AuthMiddleware(jwtSecret)
}

// GetClaims extracts JWT claims from the Fiber context.
func GetClaims(c *fiber.Ctx) *pkgjwt.Claims {
	if v := c.Locals("user"); v != nil {
		if claims, ok := v.(*pkgjwt.Claims); ok {
			return claims
		}
	}
	claims, _ := c.Locals(UserContextKey).(*pkgjwt.Claims)
	return claims
}
