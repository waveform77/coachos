package handler

import (
	"github.com/coachos/backend/internal/domain"
	"github.com/coachos/backend/internal/dto"
	pkgjwt "github.com/coachos/backend/internal/pkg/jwt"
	"github.com/coachos/backend/internal/service"
	"github.com/coachos/backend/internal/validator"
	"github.com/gofiber/fiber/v2"
)

// ClubHandler handles club endpoints.
type ClubHandler struct {
	clubService *service.ClubService
}

// NewClubHandler creates a new ClubHandler.
func NewClubHandler(clubService *service.ClubService) *ClubHandler {
	return &ClubHandler{clubService: clubService}
}

// CreateClub handles POST /api/v1/clubs.
func (h *ClubHandler) CreateClub(c *fiber.Ctx) error {
	var req dto.CreateClubRequest
	if err := c.BodyParser(&req); err != nil {
		return domain.NewBadRequest("invalid request body")
	}
	if err := validator.Validate(req); err != nil {
		return err
	}

	club, err := h.clubService.Create(c.UserContext(), req)
	if err != nil {
		return err
	}

	return c.Status(fiber.StatusCreated).JSON(dto.ClubResponse{
		ID:        club.ID,
		Name:      club.Name,
		Country:   club.Country,
		City:      club.City,
		LogoURL:   club.LogoURL,
		FoundedAt: club.FoundedAt,
		CreatedAt: club.CreatedAt,
	})
}

// GetClub handles GET /api/v1/clubs/:id.
func (h *ClubHandler) GetClub(c *fiber.Ctx) error {
	id := c.Params("id")
	club, err := h.clubService.FindByID(c.UserContext(), id)
	if err != nil {
		return err
	}

	return c.JSON(dto.ClubResponse{
		ID:        club.ID,
		Name:      club.Name,
		Country:   club.Country,
		City:      club.City,
		LogoURL:   club.LogoURL,
		FoundedAt: club.FoundedAt,
		CreatedAt: club.CreatedAt,
	})
}

// UpdateClub handles PATCH /api/v1/clubs/:id.
func (h *ClubHandler) UpdateClub(c *fiber.Ctx) error {
	id := c.Params("id")

	var req dto.UpdateClubRequest
	if err := c.BodyParser(&req); err != nil {
		return domain.NewBadRequest("invalid request body")
	}

	club, err := h.clubService.Update(c.UserContext(), id, req)
	if err != nil {
		return err
	}

	return c.JSON(dto.ClubResponse{
		ID:        club.ID,
		Name:      club.Name,
		Country:   club.Country,
		City:      club.City,
		LogoURL:   club.LogoURL,
		FoundedAt: club.FoundedAt,
		CreatedAt: club.CreatedAt,
	})
}

// GetClubDashboard handles GET /api/v1/clubs/:id/dashboard.
func (h *ClubHandler) GetClubDashboard(c *fiber.Ctx) error {
	id := c.Params("id")
	claims, ok := c.Locals("user").(*pkgjwt.Claims)
	if ok && claims.ClubID != "" && claims.ClubID != id {
		return domain.NewForbidden("access denied")
	}

	dashboard, err := h.clubService.GetDashboard(c.UserContext(), id)
	if err != nil {
		return err
	}
	return c.JSON(dashboard)
}
