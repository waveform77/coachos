package postgres

import (
	"context"
	"errors"

	"github.com/coachos/backend/internal/domain"
	"github.com/coachos/backend/internal/repository"
	"gorm.io/gorm"
)

type coachNoteRepo struct {
	db *gorm.DB
}

// NewCoachNoteRepository returns a GORM-backed CoachNoteRepository.
func NewCoachNoteRepository(db *gorm.DB) repository.CoachNoteRepository {
	return &coachNoteRepo{db: db}
}

func (r *coachNoteRepo) Create(ctx context.Context, note *domain.CoachNote) error {
	return r.db.WithContext(ctx).Create(note).Error
}

func (r *coachNoteRepo) FindByID(ctx context.Context, id string) (*domain.CoachNote, error) {
	var note domain.CoachNote
	err := r.db.WithContext(ctx).First(&note, "id = ?", id).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, domain.NewNotFound("coach_note", id)
	}
	return &note, err
}

func (r *coachNoteRepo) ListByPlayer(ctx context.Context, playerID string, page, limit int) ([]domain.CoachNote, int64, error) {
	var notes []domain.CoachNote
	var total int64

	q := r.db.WithContext(ctx).Model(&domain.CoachNote{}).Where("player_id = ?", playerID)
	if err := q.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	if page < 1 {
		page = 1
	}
	if limit < 1 {
		limit = 20
	}
	offset := (page - 1) * limit

	err := q.Order("created_at DESC").Offset(offset).Limit(limit).Find(&notes).Error
	return notes, total, err
}

func (r *coachNoteRepo) Update(ctx context.Context, note *domain.CoachNote) error {
	return r.db.WithContext(ctx).Save(note).Error
}

func (r *coachNoteRepo) Delete(ctx context.Context, id string) error {
	return r.db.WithContext(ctx).Delete(&domain.CoachNote{}, "id = ?", id).Error
}
