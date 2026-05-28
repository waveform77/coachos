package handler

import (
	"github.com/coachos/backend/internal/domain"
	"github.com/coachos/backend/internal/dto"
	pkgjwt "github.com/coachos/backend/internal/pkg/jwt"
	"github.com/coachos/backend/internal/service"
	"github.com/coachos/backend/internal/validator"
	"github.com/gofiber/fiber/v2"
)

func mapAssessment(a domain.PlayerAssessment) dto.AssessmentResponse {
	return dto.AssessmentResponse{
		ID:         a.ID,
		PlayerID:   a.PlayerID,
		CoachID:    a.CoachID,
		AssessedAt: a.AssessedAt,
		Technical:  a.Technical,
		Physical:   a.Physical,
		Tactical:   a.Tactical,
		Discipline: a.Discipline,
		Teamwork:   a.Teamwork,
		Notes:      a.Notes,
		CreatedAt:  a.CreatedAt,
	}
}

// AssessmentHandler handles player assessment endpoints.
type AssessmentHandler struct {
	assessmentService *service.AssessmentService
}

// NewAssessmentHandler creates a new AssessmentHandler.
func NewAssessmentHandler(assessmentService *service.AssessmentService) *AssessmentHandler {
	return &AssessmentHandler{assessmentService: assessmentService}
}

// CreateAssessment handles POST /api/v1/assessments.
func (h *AssessmentHandler) CreateAssessment(c *fiber.Ctx) error {
	claims := c.Locals("user").(*pkgjwt.Claims)

	var req dto.CreateAssessmentRequest
	if err := c.BodyParser(&req); err != nil {
		return domain.NewBadRequest("invalid request body")
	}
	if err := validator.Validate(req); err != nil {
		return err
	}

	assessment, err := h.assessmentService.Create(c.UserContext(), claims.UserID, req)
	if err != nil {
		return err
	}

	return c.Status(fiber.StatusCreated).JSON(dto.AssessmentResponse{
		ID:         assessment.ID,
		PlayerID:   assessment.PlayerID,
		CoachID:    assessment.CoachID,
		AssessedAt: assessment.AssessedAt,
		Technical:  assessment.Technical,
		Physical:   assessment.Physical,
		Tactical:   assessment.Tactical,
		Discipline: assessment.Discipline,
		Teamwork:   assessment.Teamwork,
		Notes:      assessment.Notes,
		CreatedAt:  assessment.CreatedAt,
	})
}

// GetPlayerAssessments handles GET /api/v1/players/:id/assessments.
func (h *AssessmentHandler) GetPlayerAssessments(c *fiber.Ctx) error {
	playerID := c.Params("id")

	var pq dto.PaginationQuery
	_ = c.QueryParser(&pq)
	pq.Defaults()

	assessments, total, err := h.assessmentService.GetByPlayer(c.UserContext(), playerID, pq.Page, pq.Limit)
	if err != nil {
		return err
	}

	resp := make([]dto.AssessmentResponse, 0, len(assessments))
	for _, a := range assessments {
		resp = append(resp, mapAssessment(a))
	}

	return c.JSON(dto.PaginatedResponse[dto.AssessmentResponse]{
		Data: resp,
		Meta: dto.MetaData{Page: pq.Page, Limit: pq.Limit, Total: total},
	})
}

// GetTeamAssessmentSummary handles GET /api/v1/teams/:id/assessments-summary.
func (h *AssessmentHandler) GetTeamAssessmentSummary(c *fiber.Ctx) error {
	teamID := c.Params("id")

	summaries, err := h.assessmentService.GetTeamSummary(c.UserContext(), teamID)
	if err != nil {
		return err
	}

	resp := make([]dto.PlayerAssessmentSummaryResponse, 0, len(summaries))
	for _, s := range summaries {
		resp = append(resp, dto.PlayerAssessmentSummaryResponse{
			PlayerID:       s.PlayerID,
			PlayerName:     s.PlayerName,
			LastAssessedAt: s.LastAssessedAt,
			AvgTechnical:   s.AvgTechnical,
			AvgPhysical:    s.AvgPhysical,
			AvgTactical:    s.AvgTactical,
			AvgDiscipline:  s.AvgDiscipline,
			AvgTeamwork:    s.AvgTeamwork,
			Total:          s.Total,
		})
	}

	return c.JSON(dto.TeamAssessmentSummaryResponse{
		TeamID:  teamID,
		Players: resp,
	})
}
