package handler

import (
	"github.com/coachos/backend/internal/domain"
	"github.com/coachos/backend/internal/dto"
	"github.com/coachos/backend/internal/repository"
	"github.com/coachos/backend/internal/validator"
	"github.com/gofiber/fiber/v2"
)

// MedicalRecordHandler handles medical record endpoints.
type MedicalRecordHandler struct {
	repo repository.MedicalRecordRepository
}

// NewMedicalRecordHandler creates a new MedicalRecordHandler.
func NewMedicalRecordHandler(repo repository.MedicalRecordRepository) *MedicalRecordHandler {
	return &MedicalRecordHandler{repo: repo}
}

// CreateMedicalRecord handles POST /api/v1/medical-records.
func (h *MedicalRecordHandler) CreateMedicalRecord(c *fiber.Ctx) error {
	var req dto.CreateMedicalRecordRequest
	if err := c.BodyParser(&req); err != nil {
		return domain.NewBadRequest("invalid request body")
	}
	if err := validator.Validate(req); err != nil {
		return err
	}

	record := &domain.MedicalRecord{
		PlayerID:    req.PlayerID,
		Condition:   req.Condition,
		Description: req.Description,
		Severity:    req.Severity,
		Status:      req.Status,
	}
	if req.StartDate != "" {
		record.StartDate = &req.StartDate
	}
	if req.EndDate != "" {
		record.EndDate = &req.EndDate
	}

	if err := h.repo.Create(c.UserContext(), record); err != nil {
		return err
	}

	return c.Status(fiber.StatusCreated).JSON(mapMedicalRecord(record))
}

// ListMedicalRecords handles GET /api/v1/players/:id/medical-records.
func (h *MedicalRecordHandler) ListMedicalRecords(c *fiber.Ctx) error {
	playerID := c.Params("id")
	if playerID == "" {
		return domain.NewBadRequest("player id is required")
	}

	records, total, err := h.repo.ListByPlayer(c.UserContext(), playerID, 1, 100)
	if err != nil {
		return err
	}

	out := make([]dto.MedicalRecordResponse, 0, len(records))
	for i := range records {
		out = append(out, mapMedicalRecord(&records[i]))
	}

	return c.JSON(fiber.Map{"data": out, "meta": fiber.Map{"total": total}})
}

// UpdateMedicalRecord handles PATCH /api/v1/medical-records/:id.
func (h *MedicalRecordHandler) UpdateMedicalRecord(c *fiber.Ctx) error {
	id := c.Params("id")
	var req dto.CreateMedicalRecordRequest
	if err := c.BodyParser(&req); err != nil {
		return domain.NewBadRequest("invalid request body")
	}
	if err := validator.Validate(req); err != nil {
		return err
	}

	record, err := h.repo.FindByID(c.UserContext(), id)
	if err != nil {
		return err
	}

	record.Condition = req.Condition
	record.Description = req.Description
	record.Severity = req.Severity
	record.Status = req.Status
	if req.StartDate != "" {
		record.StartDate = &req.StartDate
	}
	if req.EndDate != "" {
		record.EndDate = &req.EndDate
	}

	if err := h.repo.Update(c.UserContext(), record); err != nil {
		return err
	}

	return c.JSON(mapMedicalRecord(record))
}

// DeleteMedicalRecord handles DELETE /api/v1/medical-records/:id.
func (h *MedicalRecordHandler) DeleteMedicalRecord(c *fiber.Ctx) error {
	id := c.Params("id")
	if err := h.repo.Delete(c.UserContext(), id); err != nil {
		return err
	}
	return c.SendStatus(fiber.StatusNoContent)
}

func mapMedicalRecord(r *domain.MedicalRecord) dto.MedicalRecordResponse {
	resp := dto.MedicalRecordResponse{
		ID:          r.ID,
		PlayerID:    r.PlayerID,
		Condition:   r.Condition,
		Description: r.Description,
		Severity:    r.Severity,
		Status:      r.Status,
		CreatedAt:   r.CreatedAt,
	}
	if r.StartDate != nil {
		resp.StartDate = *r.StartDate
	}
	if r.EndDate != nil {
		resp.EndDate = *r.EndDate
	}
	return resp
}
