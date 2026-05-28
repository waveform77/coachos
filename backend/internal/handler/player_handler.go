package handler

import (
	"fmt"
	"os"
	"path/filepath"

	"github.com/coachos/backend/internal/domain"
	"github.com/coachos/backend/internal/dto"
	"github.com/coachos/backend/internal/pkg/idgen"
	pkgjwt "github.com/coachos/backend/internal/pkg/jwt"
	"github.com/coachos/backend/internal/service"
	"github.com/coachos/backend/internal/validator"
	"github.com/gofiber/fiber/v2"
)

// PlayerHandler handles player endpoints.
type PlayerHandler struct {
	playerService *service.PlayerService
}

// NewPlayerHandler creates a new PlayerHandler.
func NewPlayerHandler(playerService *service.PlayerService) *PlayerHandler {
	return &PlayerHandler{playerService: playerService}
}

// CreatePlayer handles POST /api/v1/players.
func (h *PlayerHandler) CreatePlayer(c *fiber.Ctx) error {
	claims := c.Locals("user").(*pkgjwt.Claims)

	var req dto.CreatePlayerRequest
	if err := c.BodyParser(&req); err != nil {
		return domain.NewBadRequest("invalid request body")
	}
	if err := validator.Validate(req); err != nil {
		return err
	}

	player, err := h.playerService.Create(c.UserContext(), claims.ClubID, req)
	if err != nil {
		return err
	}

	return c.Status(fiber.StatusCreated).JSON(mapPlayerResp(*player))
}

// GetPlayer handles GET /api/v1/players/:id.
func (h *PlayerHandler) GetPlayer(c *fiber.Ctx) error {
	id := c.Params("id")
	player, err := h.playerService.FindByID(c.UserContext(), id)
	if err != nil {
		return err
	}
	return c.JSON(mapPlayerResp(*player))
}

// ListPlayers handles GET /api/v1/players.
func (h *PlayerHandler) ListPlayers(c *fiber.Ctx) error {
	claims := c.Locals("user").(*pkgjwt.Claims)

	var pq dto.PaginationQuery
	_ = c.QueryParser(&pq)
	pq.Defaults()

	players, total, err := h.playerService.FindByClub(c.UserContext(), claims.ClubID, pq.Page, pq.Limit)
	if err != nil {
		return err
	}

	resp := make([]dto.PlayerResponse, 0, len(players))
	for _, p := range players {
		resp = append(resp, mapPlayerResp(p))
	}

	return c.JSON(dto.PaginatedResponse[dto.PlayerResponse]{
		Data: resp,
		Meta: dto.MetaData{Page: pq.Page, Limit: pq.Limit, Total: total},
	})
}

// UpdatePlayer handles PATCH /api/v1/players/:id.
func (h *PlayerHandler) UpdatePlayer(c *fiber.Ctx) error {
	id := c.Params("id")

	var req dto.UpdatePlayerRequest
	if err := c.BodyParser(&req); err != nil {
		return domain.NewBadRequest("invalid request body")
	}

	player, err := h.playerService.Update(c.UserContext(), id, req)
	if err != nil {
		return err
	}
	return c.JSON(mapPlayerResp(*player))
}

// DeletePlayer handles DELETE /api/v1/players/:id.
func (h *PlayerHandler) DeletePlayer(c *fiber.Ctx) error {
	id := c.Params("id")
	if err := h.playerService.Delete(c.UserContext(), id); err != nil {
		return err
	}
	return c.JSON(dto.MessageResponse{Message: "player deleted"})
}

// GetPlayerProfile handles GET /api/v1/players/:id/profile.
func (h *PlayerHandler) GetPlayerProfile(c *fiber.Ctx) error {
	id := c.Params("id")
	profile, err := h.playerService.GetProfile(c.UserContext(), id)
	if err != nil {
		return err
	}
	return c.JSON(profile)
}

// GetPlayerProgress handles GET /api/v1/players/:id/progress.
func (h *PlayerHandler) GetPlayerProgress(c *fiber.Ctx) error {
	id := c.Params("id")
	progress, err := h.playerService.GetProgress(c.UserContext(), id)
	if err != nil {
		return err
	}
	return c.JSON(progress)
}

// GetPlayerDevIndex handles GET /api/v1/players/:id/dev-index.
func (h *PlayerHandler) GetPlayerDevIndex(c *fiber.Ctx) error {
	id := c.Params("id")
	player, err := h.playerService.FindByID(c.UserContext(), id)
	if err != nil {
		return err
	}
	return c.JSON(fiber.Map{"playerId": id, "devIndex": player.DevIndex})
}

// GetPlayerAttendance handles GET /api/v1/players/:id/attendance.
func (h *PlayerHandler) GetPlayerAttendance(c *fiber.Ctx) error {
	id := c.Params("id")

	profile, err := h.playerService.GetProfile(c.UserContext(), id)
	if err != nil {
		return err
	}

	return c.JSON(fiber.Map{
		"playerId":       id,
		"attendanceRate": profile.AttendanceRate,
	})
}

// UploadPlayerPhoto handles POST /api/v1/players/:id/photo.
func (h *PlayerHandler) UploadPlayerPhoto(c *fiber.Ctx) error {
	id := c.Params("id")

	// Check if player exists
	player, err := h.playerService.FindByID(c.UserContext(), id)
	if err != nil {
		return err
	}

	// Parse multipart form
	file, err := c.FormFile("photo")
	if err != nil {
		return domain.NewBadRequest("photo file is required")
	}

	// Validate file type
	allowedTypes := map[string]bool{
		"image/jpeg": true,
		"image/png":  true,
		"image/webp": true,
	}
	contentType := file.Header.Get("Content-Type")
	if !allowedTypes[contentType] {
		return domain.NewBadRequest("only JPEG, PNG, or WebP images are allowed")
	}

	// Validate file size (max 5MB)
	maxSize := int64(5 * 1024 * 1024)
	if file.Size > maxSize {
		return domain.NewBadRequest("file size must be less than 5MB")
	}

	// Create uploads directory if not exists
	uploadsDir := "./uploads/photos"
	if err := os.MkdirAll(uploadsDir, os.ModePerm); err != nil {
		return domain.NewInternal("failed to create uploads directory")
	}

	// Generate unique filename
	ext := filepath.Ext(file.Filename)
	if ext == "" {
		ext = ".jpg"
	}
	filename := idgen.New() + ext
	destPath := filepath.Join(uploadsDir, filename)

	// Save file
	if err := c.SaveFile(file, destPath); err != nil {
		return domain.NewInternal("failed to save file")
	}

	// Update player's photo URL
	photoURL := fmt.Sprintf("/uploads/photos/%s", filename)
	_, err = h.playerService.Update(c.UserContext(), id, dto.UpdatePlayerRequest{
		PhotoURL: photoURL,
	})
	if err != nil {
		// Clean up file if update fails
		os.Remove(destPath)
		return err
	}

	return c.JSON(fiber.Map{
		"playerId": id,
		"photoURL": photoURL,
		"firstName": player.FirstName,
		"lastName":  player.LastName,
	})
}

func mapPlayerResp(p domain.Player) dto.PlayerResponse {
	return dto.PlayerResponse{
		ID:           p.ID,
		ClubID:       p.ClubID,
		FirstName:    p.FirstName,
		LastName:     p.LastName,
		BirthDate:    p.BirthDate,
		HeightCm:     p.HeightCm,
		WeightKg:     p.WeightKg,
		DominantFoot: string(p.DominantFoot),
		Position:     string(p.Position),
		PhotoURL:         p.PhotoURL,
		DevIndex:         p.DevIndex,
		PotentialAbility: p.PotentialAbility,
		CreatedAt:        p.CreatedAt,
	}
}
