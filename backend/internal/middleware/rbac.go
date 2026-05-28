package middleware

import (
	"github.com/coachos/backend/internal/domain"
	"github.com/gofiber/fiber/v2"
)

// RequireRole returns a middleware that checks the user role from JWT claims.
func RequireRole(roles ...domain.Role) fiber.Handler {
	roleSet := make(map[domain.Role]struct{}, len(roles))
	for _, r := range roles {
		roleSet[r] = struct{}{}
	}

	return func(c *fiber.Ctx) error {
		claims := GetClaims(c)
		if claims == nil {
			return domain.NewUnauthorized("authentication required")
		}

		userRole := domain.Role(claims.Role)
		if _, ok := roleSet[userRole]; !ok {
			return domain.NewForbidden("insufficient permissions for this operation")
		}

		return c.Next()
	}
}

// RequireAnyRole returns middleware that checks if user has at least one of the given roles.
func RequireAnyRole(roles ...domain.Role) fiber.Handler {
	return RequireRole(roles...)
}

// RequireSameClub checks that the authenticated user belongs to the same club as specified.
// The clubID is expected in c.Locals("target_club_id") set by the handler before calling this.
func RequireSameClub() fiber.Handler {
	return func(c *fiber.Ctx) error {
		claims := GetClaims(c)
		if claims == nil {
			return domain.NewUnauthorized("authentication required")
		}

		// Admins can skip club check (they manage the club)
		if domain.Role(claims.Role) == domain.RoleAdmin {
			return c.Next()
		}

		targetClubID, _ := c.Locals("target_club_id").(string)
		if targetClubID == "" {
			return c.Next() // no target club set, skip check
		}

		if claims.ClubID != targetClubID {
			return domain.NewForbidden("access to this club's resources is not allowed")
		}

		return c.Next()
	}
}
