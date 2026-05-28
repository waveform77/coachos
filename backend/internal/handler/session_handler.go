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

// SessionHandler handles training session endpoints.
type SessionHandler struct {
	sessionService *service.SessionService
}

// NewSessionHandler creates a new SessionHandler.
func NewSessionHandler(sessionService *service.SessionService) *SessionHandler {
	return &SessionHandler{sessionService: sessionService}
}

// CreateSession handles POST /api/v1/sessions.
func (h *SessionHandler) CreateSession(c *fiber.Ctx) error {
	claims := c.Locals("user").(*pkgjwt.Claims)

	var req dto.CreateSessionRequest
	if err := c.BodyParser(&req); err != nil {
		return domain.NewBadRequest("invalid request body")
	}
	if err := validator.Validate(req); err != nil {
		return err
	}

	session, err := h.sessionService.Create(c.UserContext(), claims.UserID, req)
	if err != nil {
		return err
	}
	return c.Status(fiber.StatusCreated).JSON(mapSessionResp(*session))
}

// GetSession handles GET /api/v1/sessions/:id.
func (h *SessionHandler) GetSession(c *fiber.Ctx) error {
	id := c.Params("id")
	session, err := h.sessionService.GetDetail(c.UserContext(), id)
	if err != nil {
		return err
	}

	blocks := make([]dto.TrainingBlockResponse, 0, len(session.Blocks))
	for _, b := range session.Blocks {
		exercises := make([]dto.SessionExerciseResponse, 0, len(b.Exercises))
		for _, se := range b.Exercises {
			exercises = append(exercises, dto.SessionExerciseResponse{
				ID:                se.ID,
				ExerciseID:        se.ExerciseID,
				Exercise:          mapExerciseResp(se.Exercise),
				OrderIndex:        se.OrderIndex,
				DurationMin:       se.DurationMin,
				Sets:              se.Sets,
				Reps:              se.Reps,
				IntensityOverride: se.IntensityOverride,
			})
		}
		blocks = append(blocks, dto.TrainingBlockResponse{
			ID:          b.ID,
			Kind:        string(b.Kind),
			OrderIndex:  b.OrderIndex,
			DurationMin: b.DurationMin,
			Notes:       b.Notes,
			Exercises:   exercises,
		})
	}

	attendance := make([]dto.AttendanceResponse, 0, len(session.Attendance))
	for _, ar := range session.Attendance {
		attendance = append(attendance, dto.AttendanceResponse{
			ID:        ar.ID,
			SessionID: ar.SessionID,
			PlayerID:  ar.PlayerID,
			FirstName: ar.Player.FirstName,
			LastName:  ar.Player.LastName,
			Status:    string(ar.Status),
			Reason:    ar.Reason,
			MarkedAt:  ar.MarkedAt,
		})
	}

	return c.JSON(dto.SessionDetailResponse{
		SessionResponse: mapSessionResp(*session),
		Blocks:          blocks,
		Attendance:      attendance,
	})
}

// ListSessions handles GET /api/v1/sessions.
func (h *SessionHandler) ListSessions(c *fiber.Ctx) error {
	claims := c.Locals("user").(*pkgjwt.Claims)
	teamID := c.Query("teamId")

	var fromPtr, toPtr *time.Time
	if fs := c.Query("from"); fs != "" {
		t, err := time.Parse(time.RFC3339, fs)
		if err != nil {
			return domain.NewBadRequest("invalid from date format (use RFC3339)")
		}
		fromPtr = &t
	}
	if ts := c.Query("to"); ts != "" {
		t, err := time.Parse(time.RFC3339, ts)
		if err != nil {
			return domain.NewBadRequest("invalid to date format (use RFC3339)")
		}
		toPtr = &t
	}

	var pq dto.PaginationQuery
	_ = c.QueryParser(&pq)
	pq.Defaults()

	var sessions []domain.TrainingSession
	var total int64
	var err error
	if teamID != "" {
		sessions, total, err = h.sessionService.FindByTeam(c.UserContext(), teamID, fromPtr, toPtr, pq.Page, pq.Limit)
	} else {
		if claims.ClubID == "" {
			return domain.NewBadRequest("teamId query parameter is required when user has no club")
		}
		sessions, total, err = h.sessionService.FindByClub(c.UserContext(), claims.ClubID, fromPtr, toPtr, pq.Page, pq.Limit)
	}
	if err != nil {
		return err
	}

	resp := make([]dto.SessionResponse, 0, len(sessions))
	for _, s := range sessions {
		resp = append(resp, mapSessionResp(s))
	}

	return c.JSON(dto.PaginatedResponse[dto.SessionResponse]{
		Data: resp,
		Meta: dto.MetaData{Page: pq.Page, Limit: pq.Limit, Total: total},
	})
}

// UpdateSession handles PATCH /api/v1/sessions/:id.
func (h *SessionHandler) UpdateSession(c *fiber.Ctx) error {
	id := c.Params("id")

	var req dto.UpdateSessionRequest
	if err := c.BodyParser(&req); err != nil {
		return domain.NewBadRequest("invalid request body")
	}

	session, err := h.sessionService.Update(c.UserContext(), id, req)
	if err != nil {
		return err
	}
	return c.JSON(mapSessionResp(*session))
}

// DeleteSession handles DELETE /api/v1/sessions/:id.
func (h *SessionHandler) DeleteSession(c *fiber.Ctx) error {
	id := c.Params("id")
	if err := h.sessionService.Delete(c.UserContext(), id); err != nil {
		return err
	}
	return c.JSON(dto.MessageResponse{Message: "session deleted"})
}

// AddBlock handles POST /api/v1/sessions/:id/blocks.
func (h *SessionHandler) AddBlock(c *fiber.Ctx) error {
	sessionID := c.Params("id")

	var req dto.CreateBlockRequest
	if err := c.BodyParser(&req); err != nil {
		return domain.NewBadRequest("invalid request body")
	}
	if err := validator.Validate(req); err != nil {
		return err
	}

	block, err := h.sessionService.AddBlock(c.UserContext(), sessionID, req)
	if err != nil {
		return err
	}

	return c.Status(fiber.StatusCreated).JSON(dto.TrainingBlockResponse{
		ID:          block.ID,
		Kind:        string(block.Kind),
		OrderIndex:  block.OrderIndex,
		DurationMin: block.DurationMin,
		Notes:       block.Notes,
		Exercises:   []dto.SessionExerciseResponse{},
	})
}

// AddExerciseToBlock handles POST /api/v1/sessions/:id/blocks/:blockID/exercises.
func (h *SessionHandler) AddExerciseToBlock(c *fiber.Ctx) error {
	blockID := c.Params("blockID")

	var req dto.AddExerciseToBlockRequest
	if err := c.BodyParser(&req); err != nil {
		return domain.NewBadRequest("invalid request body")
	}
	if err := validator.Validate(req); err != nil {
		return err
	}

	se, err := h.sessionService.AddExerciseToBlock(c.UserContext(), blockID, req)
	if err != nil {
		return err
	}

	return c.Status(fiber.StatusCreated).JSON(dto.SessionExerciseResponse{
		ID:                se.ID,
		ExerciseID:        se.ExerciseID,
		OrderIndex:        se.OrderIndex,
		DurationMin:       se.DurationMin,
		Sets:              se.Sets,
		Reps:              se.Reps,
		IntensityOverride: se.IntensityOverride,
	})
}

// MarkAttendance handles PATCH /api/v1/sessions/:id/attendance.
func (h *SessionHandler) MarkAttendance(c *fiber.Ctx) error {
	sessionID := c.Params("id")
	claims := c.Locals("user").(*pkgjwt.Claims)

	var req dto.MarkAttendanceRequest
	if err := c.BodyParser(&req); err != nil {
		return domain.NewBadRequest("invalid request body")
	}
	if err := validator.Validate(req); err != nil {
		return err
	}

	if err := h.sessionService.MarkAttendance(c.UserContext(), sessionID, claims.UserID, req); err != nil {
		return err
	}
	return c.JSON(dto.MessageResponse{Message: "attendance marked"})
}

// CompleteSession handles POST /api/v1/sessions/:id/complete.
func (h *SessionHandler) CompleteSession(c *fiber.Ctx) error {
	id := c.Params("id")
	session, err := h.sessionService.CompleteSession(c.UserContext(), id)
	if err != nil {
		return err
	}
	return c.JSON(mapSessionResp(*session))
}

func mapSessionResp(s domain.TrainingSession) dto.SessionResponse {
	return dto.SessionResponse{
		ID:          s.ID,
		TeamID:      s.TeamID,
		CoachID:     s.CoachID,
		ScheduledAt: s.ScheduledAt,
		DurationMin: s.DurationMin,
		Location:    s.Location,
		Status:      string(s.Status),
		Intensity:   string(s.Intensity),
		Focus:       s.Focus,
		Notes:       s.Notes,
		CreatedAt:   s.CreatedAt,
	}
}
