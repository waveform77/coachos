package handler

import (
	"github.com/coachos/backend/internal/domain"
	"github.com/coachos/backend/internal/dto"
	pkgjwt "github.com/coachos/backend/internal/pkg/jwt"
	"github.com/coachos/backend/internal/service"
	"github.com/coachos/backend/internal/validator"
	"github.com/gofiber/fiber/v2"
)

// TeamHandler handles team endpoints.
type TeamHandler struct {
	teamService *service.TeamService
}

// NewTeamHandler creates a new TeamHandler.
func NewTeamHandler(teamService *service.TeamService) *TeamHandler {
	return &TeamHandler{teamService: teamService}
}

// CreateTeam handles POST /api/v1/teams.
func (h *TeamHandler) CreateTeam(c *fiber.Ctx) error {
	claims := c.Locals("user").(*pkgjwt.Claims)

	var req dto.CreateTeamRequest
	if err := c.BodyParser(&req); err != nil {
		return domain.NewBadRequest("invalid request body")
	}
	if err := validator.Validate(req); err != nil {
		return err
	}

	team, err := h.teamService.Create(c.UserContext(), claims.ClubID, req)
	if err != nil {
		return err
	}

	return c.Status(fiber.StatusCreated).JSON(dto.TeamResponse{
		ID:          team.ID,
		ClubID:      team.ClubID,
		Name:        team.Name,
		AgeGroup:    string(team.AgeGroup),
		Season:      team.Season,
		HeadCoachID: team.HeadCoachID,
		CreatedAt:   team.CreatedAt,
	})
}

// GetTeam handles GET /api/v1/teams/:id.
func (h *TeamHandler) GetTeam(c *fiber.Ctx) error {
	id := c.Params("id")
	team, err := h.teamService.FindByID(c.UserContext(), id)
	if err != nil {
		return err
	}

	members, _ := h.teamService.GetMembers(c.UserContext(), id)
	memberResp := make([]dto.TeamMemberResponse, 0, len(members))
	for _, m := range members {
		memberResp = append(memberResp, dto.TeamMemberResponse{
			PlayerID:     m.PlayerID,
			FirstName:    m.Player.FirstName,
			LastName:     m.Player.LastName,
			DevIndex:     m.Player.DevIndex,
			JerseyNumber: m.JerseyNumber,
			Position:     string(m.Position),
			IsCaptain:    m.IsCaptain,
		})
	}

	return c.JSON(dto.TeamDetailResponse{
		TeamResponse: dto.TeamResponse{
			ID:          team.ID,
			ClubID:      team.ClubID,
			Name:        team.Name,
			AgeGroup:    string(team.AgeGroup),
			Season:      team.Season,
			HeadCoachID: team.HeadCoachID,
			CreatedAt:   team.CreatedAt,
		},
		Members: memberResp,
	})
}

// ListTeams handles GET /api/v1/teams.
func (h *TeamHandler) ListTeams(c *fiber.Ctx) error {
	claims := c.Locals("user").(*pkgjwt.Claims)

	var pq dto.PaginationQuery
	_ = c.QueryParser(&pq)
	pq.Defaults()

	teams, total, err := h.teamService.FindByClub(c.UserContext(), claims.ClubID, pq.Page, pq.Limit)
	if err != nil {
		return err
	}

	resp := make([]dto.TeamResponse, 0, len(teams))
	for _, t := range teams {
		resp = append(resp, dto.TeamResponse{
			ID:          t.ID,
			ClubID:      t.ClubID,
			Name:        t.Name,
			AgeGroup:    string(t.AgeGroup),
			Season:      t.Season,
			HeadCoachID: t.HeadCoachID,
			CreatedAt:   t.CreatedAt,
		})
	}

	return c.JSON(dto.PaginatedResponse[dto.TeamResponse]{
		Data: resp,
		Meta: dto.MetaData{Page: pq.Page, Limit: pq.Limit, Total: total},
	})
}

// UpdateTeam handles PATCH /api/v1/teams/:id.
func (h *TeamHandler) UpdateTeam(c *fiber.Ctx) error {
	id := c.Params("id")

	var req dto.UpdateTeamRequest
	if err := c.BodyParser(&req); err != nil {
		return domain.NewBadRequest("invalid request body")
	}

	team, err := h.teamService.Update(c.UserContext(), id, req)
	if err != nil {
		return err
	}

	return c.JSON(dto.TeamResponse{
		ID:          team.ID,
		ClubID:      team.ClubID,
		Name:        team.Name,
		AgeGroup:    string(team.AgeGroup),
		Season:      team.Season,
		HeadCoachID: team.HeadCoachID,
		CreatedAt:   team.CreatedAt,
	})
}

// DeleteTeam handles DELETE /api/v1/teams/:id.
func (h *TeamHandler) DeleteTeam(c *fiber.Ctx) error {
	id := c.Params("id")
	if err := h.teamService.Delete(c.UserContext(), id); err != nil {
		return err
	}
	return c.JSON(dto.MessageResponse{Message: "team deleted"})
}

// AddMember handles POST /api/v1/teams/:id/members.
func (h *TeamHandler) AddMember(c *fiber.Ctx) error {
	teamID := c.Params("id")

	var req dto.AddMemberRequest
	if err := c.BodyParser(&req); err != nil {
		return domain.NewBadRequest("invalid request body")
	}
	if err := validator.Validate(req); err != nil {
		return err
	}

	if err := h.teamService.AddMember(c.UserContext(), teamID, req); err != nil {
		return err
	}
	return c.Status(fiber.StatusCreated).JSON(dto.MessageResponse{Message: "member added"})
}

// RemoveMember handles DELETE /api/v1/teams/:id/members/:playerID.
func (h *TeamHandler) RemoveMember(c *fiber.Ctx) error {
	teamID := c.Params("id")
	playerID := c.Params("playerID")

	if err := h.teamService.RemoveMember(c.UserContext(), teamID, playerID); err != nil {
		return err
	}
	return c.JSON(dto.MessageResponse{Message: "member removed"})
}

// GetTeamDashboard handles GET /api/v1/teams/:id/dashboard.
func (h *TeamHandler) GetTeamDashboard(c *fiber.Ctx) error {
	id := c.Params("id")
	dashboard, err := h.teamService.GetDashboard(c.UserContext(), id)
	if err != nil {
		return err
	}
	return c.JSON(dashboard)
}
