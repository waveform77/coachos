package service

import (
	"context"
	"time"

	"github.com/coachos/backend/internal/domain"
	"github.com/coachos/backend/internal/repository"
)

// AttendanceService handles attendance business logic.
type AttendanceService struct {
	attendRepo repository.AttendanceRepository
}

// NewAttendanceService creates a new AttendanceService.
func NewAttendanceService(attendRepo repository.AttendanceRepository) *AttendanceService {
	return &AttendanceService{attendRepo: attendRepo}
}

// MarkAttendance records a single attendance record.
func (s *AttendanceService) MarkAttendance(ctx context.Context, record *domain.AttendanceRecord) error {
	return s.attendRepo.Upsert(ctx, record)
}

// GetBySession returns attendance records for a session.
func (s *AttendanceService) GetBySession(ctx context.Context, sessionID string) ([]domain.AttendanceRecord, error) {
	return s.attendRepo.GetBySession(ctx, sessionID)
}

// GetByPlayer returns paginated attendance records for a player.
func (s *AttendanceService) GetByPlayer(ctx context.Context, playerID string, page, limit int) ([]domain.AttendanceRecord, int64, error) {
	return s.attendRepo.GetByPlayer(ctx, playerID, page, limit)
}

// GetStats returns overall attendance stats for a player.
func (s *AttendanceService) GetStats(ctx context.Context, playerID string) (present, total int, rate float64, err error) {
	present, total, err = s.attendRepo.GetPlayerAttendanceStats(ctx, playerID)
	if err != nil {
		return
	}
	if total > 0 {
		rate = float64(present) / float64(total) * 100
	}
	return
}

// GetTeamStats returns per-player attendance stats for a team.
func (s *AttendanceService) GetTeamStats(ctx context.Context, teamID string, from, to time.Time) ([]repository.PlayerAttendanceStat, error) {
	return s.attendRepo.GetTeamAttendanceStats(ctx, teamID, from, to)
}
