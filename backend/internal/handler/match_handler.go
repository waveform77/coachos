package handler

import (
	"github.com/coachos/backend/internal/domain"
	"github.com/coachos/backend/internal/dto"
	pkgjwt "github.com/coachos/backend/internal/pkg/jwt"
	"github.com/coachos/backend/internal/service"
	"github.com/coachos/backend/internal/validator"
	"github.com/gofiber/fiber/v2"
)

// MatchHandler handles match endpoints.
type MatchHandler struct {
	matchService  *service.MatchService
	playerService *service.PlayerService
}

// NewMatchHandler creates a new MatchHandler.
func NewMatchHandler(matchService *service.MatchService, playerService *service.PlayerService) *MatchHandler {
	return &MatchHandler{matchService: matchService, playerService: playerService}
}

// CreateMatch handles POST /api/v1/matches.
func (h *MatchHandler) CreateMatch(c *fiber.Ctx) error {
	var req dto.CreateMatchRequest
	if err := c.BodyParser(&req); err != nil {
		return domain.NewBadRequest("invalid request body")
	}
	if err := validator.Validate(req); err != nil {
		return err
	}

	match, err := h.matchService.Create(c.UserContext(), req)
	if err != nil {
		return err
	}
	return c.Status(fiber.StatusCreated).JSON(mapMatchResp(*match))
}

// GetMatch handles GET /api/v1/matches/:id.
func (h *MatchHandler) GetMatch(c *fiber.Ctx) error {
	id := c.Params("id")
	match, err := h.matchService.FindByID(c.UserContext(), id)
	if err != nil {
		return err
	}

	lineup, _ := h.matchService.GetLineup(c.UserContext(), id)
	events, _ := h.matchService.GetEvents(c.UserContext(), id)

	lineupResp := make([]dto.MatchLineupPlayerResponse, 0, len(lineup))
	for _, l := range lineup {
		lineupResp = append(lineupResp, dto.MatchLineupPlayerResponse{
			PlayerID:      l.PlayerID,
			FirstName:     l.Player.FirstName,
			LastName:      l.Player.LastName,
			Role:          string(l.Role),
			Position:      string(l.Position),
			MinutesPlayed: l.MinutesPlayed,
			FieldX:        l.FieldX,
			FieldY:        l.FieldY,
		})
	}

	eventsResp := make([]dto.MatchEventResponse, 0, len(events))
	for _, e := range events {
		er := dto.MatchEventResponse{
			ID:       e.ID,
			PlayerID: e.PlayerID,
			Minute:   e.Minute,
			Type:     string(e.Type),
			Notes:    e.Notes,
		}
		if e.Player != nil {
			er.FirstName = e.Player.FirstName
			er.LastName = e.Player.LastName
		}
		eventsResp = append(eventsResp, er)
	}

	return c.JSON(dto.MatchDetailResponse{
		MatchResponse: mapMatchResp(*match),
		Lineup:        lineupResp,
		Events:        eventsResp,
	})
}

// ListMatches handles GET /api/v1/matches.
func (h *MatchHandler) ListMatches(c *fiber.Ctx) error {
	claims := c.Locals("user").(*pkgjwt.Claims)
	teamID := c.Query("teamId")

	var pq dto.PaginationQuery
	_ = c.QueryParser(&pq)
	pq.Defaults()

	var matches []domain.Match
	var total int64
	var err error
	if teamID != "" {
		matches, total, err = h.matchService.FindByTeam(c.UserContext(), teamID, pq.Page, pq.Limit)
	} else {
		if claims.ClubID == "" {
			return domain.NewBadRequest("teamId query parameter is required when user has no club")
		}
		matches, total, err = h.matchService.FindByClub(c.UserContext(), claims.ClubID, pq.Page, pq.Limit)
	}
	if err != nil {
		return err
	}

	resp := make([]dto.MatchResponse, 0, len(matches))
	for _, m := range matches {
		resp = append(resp, mapMatchResp(m))
	}

	return c.JSON(dto.PaginatedResponse[dto.MatchResponse]{
		Data: resp,
		Meta: dto.MetaData{Page: pq.Page, Limit: pq.Limit, Total: total},
	})
}

// GetMyMatches handles GET /api/v1/me/matches for the current player.
func (h *MatchHandler) GetMyMatches(c *fiber.Ctx) error {
	claims := c.Locals("user").(*pkgjwt.Claims)

	var pq dto.PaginationQuery
	_ = c.QueryParser(&pq)
	pq.Defaults()

	player, err := h.playerService.FindByUserID(c.UserContext(), claims.UserID)
	if err != nil {
		return err
	}
	if player == nil {
		return domain.NewNotFound("player", claims.UserID)
	}

	matches, total, err := h.matchService.FindByPlayer(c.UserContext(), player.ID, pq.Page, pq.Limit)
	if err != nil {
		return err
	}

	resp := make([]dto.MatchResponse, 0, len(matches))
	for _, m := range matches {
		resp = append(resp, mapMatchResp(m))
	}

	return c.JSON(dto.PaginatedResponse[dto.MatchResponse]{
		Data: resp,
		Meta: dto.MetaData{Page: pq.Page, Limit: pq.Limit, Total: total},
	})
}

// UpdateMatch handles PATCH /api/v1/matches/:id.
func (h *MatchHandler) UpdateMatch(c *fiber.Ctx) error {
	id := c.Params("id")

	var req dto.UpdateMatchRequest
	if err := c.BodyParser(&req); err != nil {
		return domain.NewBadRequest("invalid request body")
	}

	match, err := h.matchService.Update(c.UserContext(), id, req)
	if err != nil {
		return err
	}
	return c.JSON(mapMatchResp(*match))
}

// DeleteMatch handles DELETE /api/v1/matches/:id.
func (h *MatchHandler) DeleteMatch(c *fiber.Ctx) error {
	id := c.Params("id")
	if err := h.matchService.Delete(c.UserContext(), id); err != nil {
		return err
	}
	return c.JSON(dto.MessageResponse{Message: "match deleted"})
}

// SetLineup handles PUT /api/v1/matches/:id/lineup.
func (h *MatchHandler) SetLineup(c *fiber.Ctx) error {
	matchID := c.Params("id")

	var req dto.SetLineupRequest
	if err := c.BodyParser(&req); err != nil {
		return domain.NewBadRequest("invalid request body")
	}
	if err := validator.Validate(req); err != nil {
		return err
	}

	if err := h.matchService.SetLineup(c.UserContext(), matchID, req); err != nil {
		return err
	}
	return c.JSON(dto.MessageResponse{Message: "lineup updated"})
}

// AddEvent handles POST /api/v1/matches/:id/events.
func (h *MatchHandler) AddEvent(c *fiber.Ctx) error {
	matchID := c.Params("id")
	claims := c.Locals("user").(*pkgjwt.Claims)
	_ = claims

	var req dto.AddMatchEventRequest
	if err := c.BodyParser(&req); err != nil {
		return domain.NewBadRequest("invalid request body")
	}
	if err := validator.Validate(req); err != nil {
		return err
	}

	event, err := h.matchService.AddEvent(c.UserContext(), matchID, req)
	if err != nil {
		return err
	}

	return c.Status(fiber.StatusCreated).JSON(dto.MatchEventResponse{
		ID:       event.ID,
		PlayerID: event.PlayerID,
		Minute:   event.Minute,
		Type:     string(event.Type),
		Notes:    event.Notes,
	})
}

// GetSummary handles GET /api/v1/matches/:id/summary.
func (h *MatchHandler) GetSummary(c *fiber.Ctx) error {
	id := c.Params("id")
	summary, err := h.matchService.GetSummary(c.UserContext(), id)
	if err != nil {
		return err
	}
	return c.JSON(summary)
}

func mapMatchResp(m domain.Match) dto.MatchResponse {
	return dto.MatchResponse{
		ID:           m.ID,
		TeamID:       m.TeamID,
		Opponent:     m.Opponent,
		KickoffAt:    m.KickoffAt,
		Location:     m.Location,
		IsHome:       m.IsHome,
		Status:       string(m.Status),
		GoalsFor:     m.GoalsFor,
		GoalsAgainst: m.GoalsAgainst,
		Notes:        m.Notes,
		CreatedAt:    m.CreatedAt,
	}
}
