package handler

import (
	"github.com/coachos/backend/internal/domain"
	pkgjwt "github.com/coachos/backend/internal/pkg/jwt"
	"github.com/coachos/backend/internal/service"
	"github.com/gofiber/fiber/v2"
)

// AnalyticsHandler handles analytics endpoints.
type AnalyticsHandler struct {
	analyticsService *service.AnalyticsService
	sessionService   *service.SessionService
}

// NewAnalyticsHandler creates a new AnalyticsHandler.
func NewAnalyticsHandler(analyticsService *service.AnalyticsService, sessionService *service.SessionService) *AnalyticsHandler {
	return &AnalyticsHandler{analyticsService: analyticsService, sessionService: sessionService}
}

// GetCoachDashboard handles GET /api/v1/analytics/coach-dashboard.
func (h *AnalyticsHandler) GetCoachDashboard(c *fiber.Ctx) error {
	claims := c.Locals("user").(*pkgjwt.Claims)
	if claims.ClubID == "" {
		return domain.NewBadRequest("user is not associated with a club")
	}

	dashboard, err := h.analyticsService.CoachDashboard(c.UserContext(), claims.ClubID)
	if err != nil {
		return err
	}
	return c.JSON(dashboard)
}

// GetTeamAnalytics handles GET /api/v1/analytics/team/:id.
func (h *AnalyticsHandler) GetTeamAnalytics(c *fiber.Ctx) error {
	teamID := c.Params("id")
	analytics, err := h.analyticsService.TeamAnalytics(c.UserContext(), teamID)
	if err != nil {
		return err
	}
	return c.JSON(analytics)
}

// GetPlayerAnalytics handles GET /api/v1/analytics/player/:id.
func (h *AnalyticsHandler) GetPlayerAnalytics(c *fiber.Ctx) error {
	claims := c.Locals("user").(*pkgjwt.Claims)
	playerID := c.Params("id")
	analytics, err := h.analyticsService.PlayerAnalytics(c.UserContext(), playerID, claims)
	if err != nil {
		return err
	}
	return c.JSON(analytics)
}

// GetAttendanceAnalytics handles GET /api/v1/analytics/attendance.
func (h *AnalyticsHandler) GetAttendanceAnalytics(c *fiber.Ctx) error {
	claims := c.Locals("user").(*pkgjwt.Claims)
	teamID := c.Query("teamId")
	clubID := claims.ClubID
	if teamID != "" {
		clubID = ""
	} else if clubID == "" {
		return domain.NewBadRequest("teamId query parameter is required when user has no club")
	}

	analytics, err := h.analyticsService.AttendanceAnalytics(c.UserContext(), teamID, clubID)
	if err != nil {
		return err
	}
	return c.JSON(analytics)
}

// GetTrainingLoad handles GET /api/v1/analytics/training-load.
func (h *AnalyticsHandler) GetTrainingLoad(c *fiber.Ctx) error {
	claims := c.Locals("user").(*pkgjwt.Claims)
	teamID := c.Query("teamId")
	clubID := claims.ClubID
	if teamID != "" {
		clubID = ""
	} else if clubID == "" {
		return domain.NewBadRequest("teamId query parameter is required when user has no club")
	}

	load, err := h.analyticsService.TrainingLoad(c.UserContext(), teamID, clubID)
	if err != nil {
		return err
	}
	return c.JSON(load)
}

// GetPlayerMatchStats handles GET /api/v1/analytics/player/:id/match-stats.
func (h *AnalyticsHandler) GetPlayerMatchStats(c *fiber.Ctx) error {
	playerID := c.Params("id")
	if playerID == "" {
		return domain.NewBadRequest("player id is required")
	}

	stats, err := h.analyticsService.GetPlayerMatchStats(c.UserContext(), playerID)
	if err != nil {
		return err
	}

	return c.JSON(stats)
}

// GetPlayerForm handles GET /api/v1/analytics/player/:id/form.
func (h *AnalyticsHandler) GetPlayerForm(c *fiber.Ctx) error {
	playerID := c.Params("id")
	if playerID == "" {
		return domain.NewBadRequest("player id is required")
	}

	form, err := h.analyticsService.CalculatePlayerForm(c.UserContext(), playerID)
	if err != nil {
		return err
	}

	return c.JSON(form)
}
