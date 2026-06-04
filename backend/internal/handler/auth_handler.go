package handler

import (
	"time"

	"github.com/coachos/backend/internal/domain"
	"github.com/coachos/backend/internal/dto"
	pkgjwt "github.com/coachos/backend/internal/pkg/jwt"
	"github.com/coachos/backend/internal/service"
	"github.com/coachos/backend/internal/validator"
	"github.com/gofiber/fiber/v2"
)

// AuthHandler handles authentication endpoints.
type AuthHandler struct {
	authService *service.AuthService
}

// NewAuthHandler creates a new AuthHandler.
func NewAuthHandler(authService *service.AuthService) *AuthHandler {
	return &AuthHandler{authService: authService}
}

// Register handles POST /api/v1/auth/register.
// @Summary Register new user
// @Description Create a new user account
// @Tags auth
// @Accept json
// @Produce json
// @Param body body dto.RegisterRequest true "Registration data"
// @Success 201 {object} dto.AuthResponse
// @Failure 400 {object} map[string]string
// @Router /api/v1/auth/register [post]
func (h *AuthHandler) Register(c *fiber.Ctx) error {
	var req dto.RegisterRequest
	if err := c.BodyParser(&req); err != nil {
		return domain.NewBadRequest("invalid request body")
	}
	if err := validator.Validate(req); err != nil {
		return err
	}

	user, err := h.authService.Register(
		c.UserContext(),
		req.Email, req.Password, req.FirstName, req.LastName,
		domain.Role(req.Role), nil,
	)
	if err != nil {
		return err
	}

	return c.Status(fiber.StatusCreated).JSON(dto.UserResponse{
		ID:        user.ID,
		Email:     user.Email,
		Role:      user.Role,
		FirstName: user.FirstName,
		LastName:  user.LastName,
		IsActive:  user.IsActive,
		CreatedAt: user.CreatedAt,
	})
}

// Login handles POST /api/v1/auth/login.
// @Summary User login
// @Description Authenticate user and return tokens
// @Tags auth
// @Accept json
// @Produce json
// @Param body body dto.LoginRequest true "Login credentials"
// @Success 200 {object} dto.AuthResponse
// @Failure 400 {object} map[string]string
// @Router /api/v1/auth/login [post]
func (h *AuthHandler) Login(c *fiber.Ctx) error {
	var req dto.LoginRequest
	if err := c.BodyParser(&req); err != nil {
		return domain.NewBadRequest("invalid request body")
	}
	if err := validator.Validate(req); err != nil {
		return err
	}

	user, accessToken, refreshToken, err := h.authService.Login(
		c.UserContext(),
		req.Email, req.Password,
		c.IP(), c.Get("User-Agent"),
	)
	if err != nil {
		return err
	}

	c.Cookie(&fiber.Cookie{
		Name:     "refresh_token",
		Value:    refreshToken,
		HTTPOnly: true,
		Secure:   false,
		SameSite: "Lax",
		Expires:  time.Now().Add(30 * 24 * time.Hour),
		Path:     "/",
	})

	return c.JSON(dto.AuthResponse{
		AccessToken: accessToken,
		User: dto.UserResponse{
			ID:          user.ID,
			Email:       user.Email,
			Role:        user.Role,
			ClubID:      user.ClubID,
			FirstName:   user.FirstName,
			LastName:    user.LastName,
			Phone:       user.Phone,
			AvatarURL:   user.AvatarURL,
			IsActive:    user.IsActive,
			LastLoginAt: user.LastLoginAt,
			CreatedAt:   user.CreatedAt,
		},
	})
}

// Refresh handles POST /api/v1/auth/refresh.
func (h *AuthHandler) Refresh(c *fiber.Ctx) error {
	refreshToken := c.Cookies("refresh_token")
	if refreshToken == "" {
		var req dto.RefreshRequest
		if err := c.BodyParser(&req); err == nil {
			refreshToken = req.RefreshToken
		}
	}
	if refreshToken == "" {
		return domain.NewUnauthorized("refresh token required")
	}

	accessToken, newRefresh, err := h.authService.Refresh(
		c.UserContext(),
		refreshToken,
		c.IP(), c.Get("User-Agent"),
	)
	if err != nil {
		return err
	}

	c.Cookie(&fiber.Cookie{
		Name:     "refresh_token",
		Value:    newRefresh,
		HTTPOnly: true,
		Secure:   false,
		SameSite: "Lax",
		Expires:  time.Now().Add(30 * 24 * time.Hour),
		Path:     "/",
	})

	return c.JSON(dto.TokenPair{
		AccessToken:  accessToken,
		RefreshToken: newRefresh,
	})
}

// Logout handles POST /api/v1/auth/logout.
func (h *AuthHandler) Logout(c *fiber.Ctx) error {
	refreshToken := c.Cookies("refresh_token")
	if refreshToken == "" {
		var req dto.RefreshRequest
		_ = c.BodyParser(&req)
		refreshToken = req.RefreshToken
	}

	if refreshToken != "" {
		_ = h.authService.Logout(c.UserContext(), refreshToken)
	}

	c.ClearCookie("refresh_token")
	return c.JSON(dto.MessageResponse{Message: "logged out successfully"})
}

// Me handles GET /api/v1/auth/me.
// @Summary Get current user
// @Description Returns profile of authenticated user
// @Tags auth
// @Produce json
// @Security BearerAuth
// @Success 200 {object} dto.UserResponse
// @Router /api/v1/auth/me [get]
func (h *AuthHandler) Me(c *fiber.Ctx) error {
	claims := c.Locals("user").(*pkgjwt.Claims)

	user, err := h.authService.Me(c.UserContext(), claims.UserID)
	if err != nil {
		return err
	}

	return c.JSON(dto.UserResponse{
		ID:          user.ID,
		Email:       user.Email,
		Role:        user.Role,
		ClubID:      user.ClubID,
		FirstName:   user.FirstName,
		LastName:    user.LastName,
		Phone:       user.Phone,
		AvatarURL:   user.AvatarURL,
		IsActive:    user.IsActive,
		LastLoginAt: user.LastLoginAt,
		CreatedAt:   user.CreatedAt,
	})
}

// UpdateMe handles PATCH /api/v1/users/me.
func (h *AuthHandler) UpdateMe(c *fiber.Ctx) error {
	claims := c.Locals("user").(*pkgjwt.Claims)

	var req dto.UpdateProfileRequest
	if err := c.BodyParser(&req); err != nil {
		return domain.NewBadRequest("invalid request body")
	}
	if err := validator.Validate(req); err != nil {
		return err
	}

	user, err := h.authService.UpdateProfile(c.UserContext(), claims.UserID, req)
	if err != nil {
		return err
	}

	return c.JSON(dto.ToUserResponse(user))
}

// ListUsers handles GET /api/v1/users (admin: list users in their club).
func (h *AuthHandler) ListUsers(c *fiber.Ctx) error {
	claims := c.Locals("user").(*pkgjwt.Claims)
	if claims.ClubID == "" {
		return domain.NewBadRequest("user is not associated with a club")
	}
	roleStr := c.Query("role")
	if roleStr == "" {
		return domain.NewBadRequest("role query parameter is required")
	}
	role := domain.Role(roleStr)
	switch role {
	case domain.RoleAdmin, domain.RoleCoach, domain.RolePlayer, domain.RoleParent, domain.RoleAnalyst:
	default:
		return domain.NewBadRequest("invalid role filter")
	}

	var pq dto.PaginationQuery
	_ = c.QueryParser(&pq)
	pq.Defaults()

	users, err := h.authService.ListUsersByClubAndRole(c.UserContext(), claims.ClubID, role, pq.Page, pq.Limit)
	if err != nil {
		return err
	}
	out := make([]dto.UserResponse, 0, len(users))
	for i := range users {
		out = append(out, dto.ToUserResponse(&users[i]))
	}
	return c.JSON(out)
}
