package handler

import (
	"github.com/coachos/backend/internal/domain"
	"github.com/coachos/backend/internal/dto"
	pkgjwt "github.com/coachos/backend/internal/pkg/jwt"
	"github.com/coachos/backend/internal/service"
	"github.com/coachos/backend/internal/validator"
	"github.com/gofiber/fiber/v2"
)

// ExerciseHandler handles exercise endpoints.
type ExerciseHandler struct {
	exerciseService *service.ExerciseService
}

// NewExerciseHandler creates a new ExerciseHandler.
func NewExerciseHandler(exerciseService *service.ExerciseService) *ExerciseHandler {
	return &ExerciseHandler{exerciseService: exerciseService}
}

// CreateExercise handles POST /api/v1/exercises.
func (h *ExerciseHandler) CreateExercise(c *fiber.Ctx) error {
	claims := c.Locals("user").(*pkgjwt.Claims)

	var req dto.CreateExerciseRequest
	if err := c.BodyParser(&req); err != nil {
		return domain.NewBadRequest("invalid request body")
	}
	if err := validator.Validate(req); err != nil {
		return err
	}

	exercise, err := h.exerciseService.Create(c.UserContext(), claims.ClubID, claims.UserID, req)
	if err != nil {
		return err
	}

	return c.Status(fiber.StatusCreated).JSON(mapExerciseResp(*exercise))
}

// GetExercise handles GET /api/v1/exercises/:id.
func (h *ExerciseHandler) GetExercise(c *fiber.Ctx) error {
	id := c.Params("id")
	exercise, err := h.exerciseService.FindByID(c.UserContext(), id)
	if err != nil {
		return err
	}
	return c.JSON(mapExerciseResp(*exercise))
}

// ListExercises handles GET /api/v1/exercises.
func (h *ExerciseHandler) ListExercises(c *fiber.Ctx) error {
	claims := c.Locals("user").(*pkgjwt.Claims)

	var filter dto.ExerciseFilterQuery
	_ = c.QueryParser(&filter)
	if filter.Page < 1 {
		filter.Page = 1
	}
	if filter.Limit < 1 {
		filter.Limit = 20
	}

	exercises, total, err := h.exerciseService.List(c.UserContext(), claims.ClubID, filter)
	if err != nil {
		return err
	}

	resp := make([]dto.ExerciseResponse, 0, len(exercises))
	for _, e := range exercises {
		resp = append(resp, mapExerciseResp(e))
	}

	return c.JSON(dto.PaginatedResponse[dto.ExerciseResponse]{
		Data: resp,
		Meta: dto.MetaData{Page: filter.Page, Limit: filter.Limit, Total: total},
	})
}

// UpdateExercise handles PATCH /api/v1/exercises/:id.
func (h *ExerciseHandler) UpdateExercise(c *fiber.Ctx) error {
	id := c.Params("id")

	var req dto.UpdateExerciseRequest
	if err := c.BodyParser(&req); err != nil {
		return domain.NewBadRequest("invalid request body")
	}

	exercise, err := h.exerciseService.Update(c.UserContext(), id, req)
	if err != nil {
		return err
	}
	return c.JSON(mapExerciseResp(*exercise))
}

// DeleteExercise handles DELETE /api/v1/exercises/:id.
func (h *ExerciseHandler) DeleteExercise(c *fiber.Ctx) error {
	id := c.Params("id")
	if err := h.exerciseService.Delete(c.UserContext(), id); err != nil {
		return err
	}
	return c.JSON(dto.MessageResponse{Message: "exercise deleted"})
}

func mapExerciseResp(e domain.Exercise) dto.ExerciseResponse {
	return dto.ExerciseResponse{
		ID:          e.ID,
		ClubID:      e.ClubID,
		Name:        e.Name,
		Category:    string(e.Category),
		Difficulty:  e.Difficulty,
		DurationMin: e.DurationMin,
		PlayersMin:  e.PlayersMin,
		PlayersMax:  e.PlayersMax,
		Equipment:   []string(e.Equipment),
		Description: e.Description,
		DiagramURL:  e.DiagramURL,
		Tags:        []string(e.Tags),
		IsGlobal:    e.IsGlobal,
		CreatedByID: e.CreatedByID,
		CreatedAt:   e.CreatedAt,
	}
}
