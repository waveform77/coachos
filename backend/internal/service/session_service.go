package service

import (
	"context"
	"time"

	"github.com/coachos/backend/internal/domain"
	"github.com/coachos/backend/internal/dto"
	"github.com/coachos/backend/internal/notifier"
	"github.com/coachos/backend/internal/repository"
	"github.com/lib/pq"
)

const weeklyLoadThreshold = 600.0 // intensity*duration threshold per week

// SessionService handles training session business logic.
type SessionService struct {
	sessionRepo  repository.TrainingSessionRepository
	teamRepo     repository.TeamRepository
	notif        notifier.Notifier
	attendRepo   repository.AttendanceRepository
}

// NewSessionService creates a new SessionService.
func NewSessionService(
	sessionRepo repository.TrainingSessionRepository,
	teamRepo repository.TeamRepository,
	notif notifier.Notifier,
	attendRepo repository.AttendanceRepository,
) *SessionService {
	return &SessionService{
		sessionRepo: sessionRepo,
		teamRepo:    teamRepo,
		notif:       notif,
		attendRepo:  attendRepo,
	}
}

// Create creates a training session.
func (s *SessionService) Create(ctx context.Context, coachID string, req dto.CreateSessionRequest) (*domain.TrainingSession, error) {
	intensity := domain.SessionIntensityMedium
	if req.Intensity != "" {
		intensity = domain.SessionIntensity(req.Intensity)
	}
	session := &domain.TrainingSession{
		TeamID:      req.TeamID,
		CoachID:     coachID,
		ScheduledAt: req.ScheduledAt,
		DurationMin: req.DurationMin,
		Location:    req.Location,
		Status:      domain.SessionStatusPlanned,
		Intensity:   intensity,
		Focus:       pq.StringArray(req.Focus),
		Notes:       req.Notes,
	}
	if err := s.sessionRepo.Create(ctx, session); err != nil {
		return nil, err
	}

	members, _ := s.teamRepo.GetMembers(ctx, req.TeamID)
	var userIDs []string
	for _, m := range members {
		if m.Player.UserID != nil {
			userIDs = append(userIDs, *m.Player.UserID)
		}
	}
	if len(userIDs) > 0 {
		_ = s.notif.Notify(ctx, notifier.NotificationEvent{
			UserIDs: userIDs,
			Type:    domain.NotificationSessionCreated,
			Title:   "New Training Session",
			Body:    "A new training session has been scheduled.",
		})
	}

	return session, nil
}

// FindByID returns a session by ID.
func (s *SessionService) FindByID(ctx context.Context, id string) (*domain.TrainingSession, error) {
	return s.sessionRepo.FindByID(ctx, id)
}

// GetDetail returns a session with full detail (blocks, exercises, attendance).
func (s *SessionService) GetDetail(ctx context.Context, id string) (*domain.TrainingSession, error) {
	return s.sessionRepo.GetSessionDetail(ctx, id)
}

// FindByTeam returns paginated sessions for a team.
func (s *SessionService) FindByTeam(ctx context.Context, teamID string, from, to *time.Time, page, limit int) ([]domain.TrainingSession, int64, error) {
	return s.sessionRepo.FindByTeam(ctx, teamID, from, to, page, limit)
}

// FindByClub returns paginated sessions for all teams in a club.
func (s *SessionService) FindByClub(ctx context.Context, clubID string, from, to *time.Time, page, limit int) ([]domain.TrainingSession, int64, error) {
	return s.sessionRepo.FindByClub(ctx, clubID, from, to, page, limit)
}

// Update updates a session.
func (s *SessionService) Update(ctx context.Context, id string, req dto.UpdateSessionRequest) (*domain.TrainingSession, error) {
	session, err := s.sessionRepo.FindByID(ctx, id)
	if err != nil {
		return nil, err
	}

	if req.ScheduledAt != nil {
		session.ScheduledAt = *req.ScheduledAt
	}
	if req.DurationMin > 0 {
		session.DurationMin = req.DurationMin
	}
	if req.Location != "" {
		session.Location = req.Location
	}
	if req.Status != "" {
		session.Status = domain.SessionStatus(req.Status)
	}
	if req.Intensity != "" {
		session.Intensity = domain.SessionIntensity(req.Intensity)
	}
	if req.Focus != nil {
		session.Focus = pq.StringArray(req.Focus)
	}
	if req.Notes != "" {
		session.Notes = req.Notes
	}

	if err := s.sessionRepo.Update(ctx, session); err != nil {
		return nil, err
	}
	return session, nil
}

// Delete deletes a session.
func (s *SessionService) Delete(ctx context.Context, id string) error {
	if _, err := s.sessionRepo.FindByID(ctx, id); err != nil {
		return err
	}
	return s.sessionRepo.Delete(ctx, id)
}

// AddBlock adds a training block to a session.
func (s *SessionService) AddBlock(ctx context.Context, sessionID string, req dto.CreateBlockRequest) (*domain.TrainingBlock, error) {
	if _, err := s.sessionRepo.FindByID(ctx, sessionID); err != nil {
		return nil, err
	}
	block := &domain.TrainingBlock{
		SessionID:   sessionID,
		Kind:        domain.BlockKind(req.Kind),
		OrderIndex:  req.OrderIndex,
		DurationMin: req.DurationMin,
		Notes:       req.Notes,
	}
	if err := s.sessionRepo.AddBlock(ctx, block); err != nil {
		return nil, err
	}
	return block, nil
}

// AddExerciseToBlock adds an exercise to a training block.
func (s *SessionService) AddExerciseToBlock(ctx context.Context, blockID string, req dto.AddExerciseToBlockRequest) (*domain.SessionExercise, error) {
	se := &domain.SessionExercise{
		BlockID:           blockID,
		ExerciseID:        req.ExerciseID,
		OrderIndex:        req.OrderIndex,
		DurationMin:       req.DurationMin,
		Sets:              req.Sets,
		Reps:              req.Reps,
		IntensityOverride: req.IntensityOverride,
	}
	if err := s.sessionRepo.AddExerciseToBlock(ctx, se); err != nil {
		return nil, err
	}
	return se, nil
}

// SaveBlocks replaces all blocks and exercises for a session atomically.
func (s *SessionService) SaveBlocks(ctx context.Context, sessionID string, req dto.SaveBlocksRequest) error {
	if _, err := s.sessionRepo.FindByID(ctx, sessionID); err != nil {
		return err
	}

	blocks := make([]domain.TrainingBlock, len(req.Blocks))
	for i, b := range req.Blocks {
		blocks[i] = domain.TrainingBlock{
			SessionID:   sessionID,
			Kind:        domain.BlockKind(b.Kind),
			OrderIndex:  b.OrderIndex,
			DurationMin: b.DurationMin,
			Notes:       b.Notes,
			Exercises:   make([]domain.SessionExercise, len(b.Exercises)),
		}
		for j, e := range b.Exercises {
			blocks[i].Exercises[j] = domain.SessionExercise{
				ExerciseID:        e.ExerciseID,
				OrderIndex:        e.OrderIndex,
				DurationMin:       e.DurationMin,
				Sets:              e.Sets,
				Reps:              e.Reps,
				IntensityOverride: e.IntensityOverride,
			}
		}
	}

	return s.sessionRepo.SaveBlocks(ctx, sessionID, blocks)
}

// MarkAttendance records attendance for a session.
func (s *SessionService) MarkAttendance(ctx context.Context, sessionID, markedByID string, req dto.MarkAttendanceRequest) error {
	for _, entry := range req.Records {
		record := &domain.AttendanceRecord{
			SessionID:  sessionID,
			PlayerID:   entry.PlayerID,
			Status:     domain.AttendanceStatus(entry.Status),
			Reason:     entry.Reason,
			MarkedByID: markedByID,
			MarkedAt:   time.Now(),
		}
		if err := s.attendRepo.Upsert(ctx, record); err != nil {
			return err
		}
	}
	return nil
}

// CompleteSession transitions a session to completed and notifies members.
func (s *SessionService) CompleteSession(ctx context.Context, sessionID string) (*domain.TrainingSession, error) {
	session, err := s.sessionRepo.FindByID(ctx, sessionID)
	if err != nil {
		return nil, err
	}

	session.Status = domain.SessionStatusCompleted
	if err := s.sessionRepo.Update(ctx, session); err != nil {
		return nil, err
	}

	members, _ := s.teamRepo.GetMembers(ctx, session.TeamID)
	var userIDs []string
	for _, m := range members {
		if m.Player.UserID != nil {
			userIDs = append(userIDs, *m.Player.UserID)
		}
	}
	if len(userIDs) > 0 {
		_ = s.notif.Notify(ctx, notifier.NotificationEvent{
			UserIDs: userIDs,
			Type:    domain.NotificationSessionUpdated,
			Title:   "Training Session Completed",
			Body:    "A training session has been marked as completed.",
		})
	}

	return session, nil
}

// GetWeeklyLoad returns the total training load for the past 7 days for a team.
func (s *SessionService) GetWeeklyLoad(ctx context.Context, teamID string) (float64, bool, error) {
	from := time.Now().AddDate(0, 0, -7)
	now := time.Now()
	sessions, _, err := s.sessionRepo.FindByTeam(ctx, teamID, &from, &now, 1, 100)
	if err != nil {
		return 0, false, err
	}

	intensityMultiplier := map[domain.SessionIntensity]float64{
		domain.SessionIntensityLow:    0.5,
		domain.SessionIntensityMedium: 1.0,
		domain.SessionIntensityHigh:   1.5,
	}

	var totalLoad float64
	for _, sess := range sessions {
		mult := intensityMultiplier[sess.Intensity]
		if mult == 0 {
			mult = 1.0
		}
		totalLoad += float64(sess.DurationMin) * mult
	}

	return totalLoad, totalLoad > weeklyLoadThreshold, nil
}
