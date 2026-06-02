package handler

import (
	"errors"

	"github.com/coachos/backend/internal/domain"
	"github.com/coachos/backend/internal/dto"
	pkgjwt "github.com/coachos/backend/internal/pkg/jwt"
	"github.com/coachos/backend/internal/service"
	"github.com/coachos/backend/internal/validator"
	"github.com/gofiber/fiber/v2"
)

// AIHandler handles AI endpoints.
type AIHandler struct {
	aiService *service.AIService
}

// NewAIHandler creates a new AIHandler.
func NewAIHandler(aiService *service.AIService) *AIHandler {
	return &AIHandler{aiService: aiService}
}

// GenerateTrainingPlan handles POST /api/v1/ai/training-plan.
func (h *AIHandler) GenerateTrainingPlan(c *fiber.Ctx) error {
	claims := c.Locals("user").(*pkgjwt.Claims)

	var req dto.GenerateTrainingPlanRequest
	if err := c.BodyParser(&req); err != nil {
		return domain.NewBadRequest("invalid request body")
	}
	if err := validator.Validate(req); err != nil {
		return err
	}

	resp, err := h.aiService.GenerateTrainingPlan(c.UserContext(), claims.UserID, req)
	if err != nil {
		return err
	}
	return c.JSON(resp)
}

// RecommendExercises handles POST /api/v1/ai/recommend-exercises.
func (h *AIHandler) RecommendExercises(c *fiber.Ctx) error {
	claims := c.Locals("user").(*pkgjwt.Claims)

	var req dto.RecommendExercisesRequest
	if err := c.BodyParser(&req); err != nil {
		return domain.NewBadRequest("invalid request body")
	}
	if err := validator.Validate(req); err != nil {
		return err
	}

	resp, err := h.aiService.RecommendExercises(c.UserContext(), claims.UserID, req)
	if err != nil {
		return err
	}
	return c.JSON(resp)
}

// AnalyzePlayer handles POST /api/v1/ai/analyze-player.
func (h *AIHandler) AnalyzePlayer(c *fiber.Ctx) error {
	claims := c.Locals("user").(*pkgjwt.Claims)

	var req dto.AnalyzePlayerRequest
	if err := c.BodyParser(&req); err != nil {
		return domain.NewBadRequest("invalid request body")
	}
	if err := validator.Validate(req); err != nil {
		return err
	}

	resp, err := h.aiService.AnalyzePlayer(c.UserContext(), claims.UserID, req)
	if err != nil {
		return err
	}
	return c.JSON(resp)
}

// SummarizeProgress handles POST /api/v1/ai/summarize-progress.
func (h *AIHandler) SummarizeProgress(c *fiber.Ctx) error {
	claims := c.Locals("user").(*pkgjwt.Claims)

	var req dto.SummarizeProgressRequest
	if err := c.BodyParser(&req); err != nil {
		return domain.NewBadRequest("invalid request body")
	}
	if err := validator.Validate(req); err != nil {
		return err
	}

	resp, err := h.aiService.SummarizeProgress(c.UserContext(), claims.UserID, req)
	if err != nil {
		return err
	}
	return c.JSON(resp)
}

// GetMyInsights handles GET /api/v1/me/ai/insights.
func (h *AIHandler) GetMyInsights(c *fiber.Ctx) error {
	claims := c.Locals("user").(*pkgjwt.Claims)

	resp, err := h.aiService.GetMyInsights(c.UserContext(), claims.UserID)
	if err != nil {
		if errors.Is(err, domain.ErrNotFound) {
			return c.JSON(dto.AIResponse{})
		}
		return err
	}
	return c.JSON(resp)
}

// GenerateMyInsights handles POST /api/v1/me/ai/insights.
func (h *AIHandler) GenerateMyInsights(c *fiber.Ctx) error {
	claims := c.Locals("user").(*pkgjwt.Claims)

	resp, err := h.aiService.GenerateMyInsights(c.UserContext(), claims.UserID)
	if err != nil {
		return err
	}
	return c.JSON(resp)
}
