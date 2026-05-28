package handler

import (
	"github.com/coachos/backend/internal/domain"
	"github.com/coachos/backend/internal/dto"
	pkgjwt "github.com/coachos/backend/internal/pkg/jwt"
	"github.com/coachos/backend/internal/repository"
	"github.com/coachos/backend/internal/service"
	"github.com/gofiber/fiber/v2"
)

// ParentHandler handles parent-only endpoints.
type ParentHandler struct {
	parentRepo repository.ParentRepository
	parentSvc  *service.ParentService
	playerRepo repository.PlayerRepository
}

// NewParentHandler creates a ParentHandler.
func NewParentHandler(parentRepo repository.ParentRepository, playerRepo repository.PlayerRepository, parentSvc *service.ParentService) *ParentHandler {
	return &ParentHandler{
		parentRepo: parentRepo,
		parentSvc:  parentSvc,
		playerRepo: playerRepo,
	}
}

// ListChildren handles GET /api/v1/parent/children (linked player profiles).
func (h *ParentHandler) ListChildren(c *fiber.Ctx) error {
	claims := c.Locals("user").(*pkgjwt.Claims)
	players, err := h.parentRepo.ListPlayersForParentUser(c.UserContext(), claims.UserID)
	if err != nil {
		return err
	}
	out := make([]dto.ParentChildResponse, 0, len(players))
	for i := range players {
		p := &players[i]
		out = append(out, dto.ParentChildResponse{
			ID:        p.ID,
			FirstName: p.FirstName,
			LastName:  p.LastName,
			DevIndex:  p.DevIndex,
			PhotoURL:  p.PhotoURL,
			Position:  string(p.Position),
		})
	}
	return c.JSON(out)
}

// ============== Вариант A: Приглашения по email ==============

// CreateInvitation handles POST /api/v1/coach/parent-invitations (тренер создает приглашение)
func (h *ParentHandler) CreateInvitation(c *fiber.Ctx) error {
	claims := c.Locals("user").(*pkgjwt.Claims)

	var req dto.CreateInvitationRequest
	if err := c.BodyParser(&req); err != nil {
		return domain.NewBadRequest("invalid body: " + err.Error())
	}

	inv, err := h.parentSvc.CreateInvitation(c.UserContext(), req.PlayerID, req.Email, claims.UserID)
	if err != nil {
		return err
	}

	return c.Status(fiber.StatusCreated).JSON(dto.InvitationResponse{
		ID:        inv.ID,
		PlayerID:  inv.PlayerID,
		Email:     inv.Email,
		Token:     inv.Token,
		Status:    string(inv.Status),
		ExpiresAt: inv.ExpiresAt,
		CreatedAt: inv.CreatedAt,
	})
}

// AcceptInvitation handles POST /api/v1/parent/accept-invitation (родитель принимает приглашение)
func (h *ParentHandler) AcceptInvitation(c *fiber.Ctx) error {
	claims := c.Locals("user").(*pkgjwt.Claims)

	var req dto.AcceptInvitationRequest
	if err := c.BodyParser(&req); err != nil {
		return domain.NewBadRequest("invalid body: " + err.Error())
	}

	if err := h.parentSvc.AcceptInvitation(c.UserContext(), req.Token, claims); err != nil {
		return err
	}

	return c.JSON(fiber.Map{
		"message": "invitation accepted, you are now linked to the player",
	})
}

// ListInvitations handles GET /api/v1/coach/parent-invitations (тренер смотрит приглашения)
func (h *ParentHandler) ListInvitations(c *fiber.Ctx) error {
	playerID := c.Query("playerId")
	if playerID == "" {
		return domain.NewBadRequest("playerId query parameter required")
	}

	invs, err := h.parentSvc.ListInvitationsForPlayer(c.UserContext(), playerID)
	if err != nil {
		return err
	}

	return c.JSON(dto.ListInvitationsResponse{Invitations: invs})
}

// ============== Вариант C: Коды доступа ==============

// GenerateLinkCode handles POST /api/v1/coach/link-codes (тренер генерирует код)
func (h *ParentHandler) GenerateLinkCode(c *fiber.Ctx) error {
	claims := c.Locals("user").(*pkgjwt.Claims)

	var req dto.GenerateLinkCodeRequest
	if err := c.BodyParser(&req); err != nil {
		return domain.NewBadRequest("invalid body: " + err.Error())
	}

	lc, err := h.parentSvc.GenerateLinkCode(c.UserContext(), req.PlayerID, claims.UserID)
	if err != nil {
		return err
	}

	return c.Status(fiber.StatusCreated).JSON(dto.LinkCodeResponse{
		ID:        lc.ID,
		PlayerID:  lc.PlayerID,
		Code:      lc.Code,
		ExpiresAt: lc.ExpiresAt,
		CreatedAt: lc.CreatedAt,
	})
}

// UseLinkCode handles POST /api/v1/parent/use-link-code (родитель использует код)
func (h *ParentHandler) UseLinkCode(c *fiber.Ctx) error {
	claims := c.Locals("user").(*pkgjwt.Claims)

	var req dto.UseLinkCodeRequest
	if err := c.BodyParser(&req); err != nil {
		return domain.NewBadRequest("invalid body: " + err.Error())
	}

	player, err := h.parentSvc.UseLinkCode(c.UserContext(), req.Code, claims)
	if err != nil {
		return err
	}

	return c.JSON(fiber.Map{
		"message":  "successfully linked to player",
		"playerID": player.ID,
		"playerName": player.FullName(),
	})
}

// ListLinkCodes handles GET /api/v1/coach/link-codes (тренер смотрит коды)
func (h *ParentHandler) ListLinkCodes(c *fiber.Ctx) error {
	playerID := c.Query("playerId")
	if playerID == "" {
		return domain.NewBadRequest("playerId query parameter required")
	}

	codes, err := h.parentSvc.ListActiveLinkCodes(c.UserContext(), playerID)
	if err != nil {
		return err
	}

	return c.JSON(dto.ListLinkCodesResponse{Codes: codes})
}
