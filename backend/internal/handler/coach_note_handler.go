package handler

import (
	"github.com/coachos/backend/internal/domain"
	"github.com/coachos/backend/internal/dto"
	pkgjwt "github.com/coachos/backend/internal/pkg/jwt"
	"github.com/coachos/backend/internal/repository"
	"github.com/coachos/backend/internal/validator"
	"github.com/gofiber/fiber/v2"
)

// CoachNoteHandler handles coach note endpoints.
type CoachNoteHandler struct {
	repo repository.CoachNoteRepository
}

// NewCoachNoteHandler creates a new CoachNoteHandler.
func NewCoachNoteHandler(repo repository.CoachNoteRepository) *CoachNoteHandler {
	return &CoachNoteHandler{repo: repo}
}

// CreateCoachNote handles POST /api/v1/coach/notes.
func (h *CoachNoteHandler) CreateCoachNote(c *fiber.Ctx) error {
	claims := c.Locals("user").(*pkgjwt.Claims)

	var req dto.CreateCoachNoteRequest
	if err := c.BodyParser(&req); err != nil {
		return domain.NewBadRequest("invalid request body")
	}
	if err := validator.Validate(req); err != nil {
		return err
	}

	note := &domain.CoachNote{
		PlayerID:  req.PlayerID,
		CoachID:   claims.UserID,
		Category:  req.Category,
		Content:   req.Content,
		IsPrivate: req.IsPrivate,
	}

	if err := h.repo.Create(c.UserContext(), note); err != nil {
		return err
	}

	return c.Status(fiber.StatusCreated).JSON(dto.CoachNoteResponse{
		ID:        note.ID,
		PlayerID:  note.PlayerID,
		CoachID:   note.CoachID,
		Category:  note.Category,
		Content:   note.Content,
		IsPrivate: note.IsPrivate,
		CreatedAt: note.CreatedAt,
	})
}

// ListCoachNotes handles GET /api/v1/players/:id/notes.
func (h *CoachNoteHandler) ListCoachNotes(c *fiber.Ctx) error {
	playerID := c.Params("id")
	if playerID == "" {
		return domain.NewBadRequest("player id is required")
	}

	notes, total, err := h.repo.ListByPlayer(c.UserContext(), playerID, 1, 100)
	if err != nil {
		return err
	}

	out := make([]dto.CoachNoteResponse, 0, len(notes))
	for i := range notes {
		n := &notes[i]
		out = append(out, dto.CoachNoteResponse{
			ID:        n.ID,
			PlayerID:  n.PlayerID,
			CoachID:   n.CoachID,
			Category:  n.Category,
			Content:   n.Content,
			IsPrivate: n.IsPrivate,
			CreatedAt: n.CreatedAt,
		})
	}

	return c.JSON(fiber.Map{"data": out, "meta": fiber.Map{"total": total}})
}

// UpdateCoachNote handles PATCH /api/v1/coach/notes/:id.
func (h *CoachNoteHandler) UpdateCoachNote(c *fiber.Ctx) error {
	claims := c.Locals("user").(*pkgjwt.Claims)
	id := c.Params("id")

	var req dto.CreateCoachNoteRequest
	if err := c.BodyParser(&req); err != nil {
		return domain.NewBadRequest("invalid request body")
	}
	if err := validator.Validate(req); err != nil {
		return err
	}

	note, err := h.repo.FindByID(c.UserContext(), id)
	if err != nil {
		return err
	}

	if note.CoachID != claims.UserID {
		return domain.NewForbidden("you can only update your own notes")
	}

	note.Category = req.Category
	note.Content = req.Content
	note.IsPrivate = req.IsPrivate

	if err := h.repo.Update(c.UserContext(), note); err != nil {
		return err
	}

	return c.JSON(dto.CoachNoteResponse{
		ID:        note.ID,
		PlayerID:  note.PlayerID,
		CoachID:   note.CoachID,
		Category:  note.Category,
		Content:   note.Content,
		IsPrivate: note.IsPrivate,
		CreatedAt: note.CreatedAt,
	})
}

// DeleteCoachNote handles DELETE /api/v1/coach/notes/:id.
func (h *CoachNoteHandler) DeleteCoachNote(c *fiber.Ctx) error {
	claims := c.Locals("user").(*pkgjwt.Claims)
	id := c.Params("id")

	note, err := h.repo.FindByID(c.UserContext(), id)
	if err != nil {
		return err
	}

	if note.CoachID != claims.UserID {
		return domain.NewForbidden("you can only delete your own notes")
	}

	if err := h.repo.Delete(c.UserContext(), id); err != nil {
		return err
	}

	return c.SendStatus(fiber.StatusNoContent)
}
