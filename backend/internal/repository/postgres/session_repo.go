package postgres

import (
	"context"
	"errors"
	"time"

	"github.com/coachos/backend/internal/domain"
	"gorm.io/gorm"
)

type sessionRepo struct {
	db *gorm.DB
}

// NewSessionRepository returns a GORM-backed TrainingSessionRepository.
func NewSessionRepository(db *gorm.DB) *sessionRepo {
	return &sessionRepo{db: db}
}

func (r *sessionRepo) Create(ctx context.Context, session *domain.TrainingSession) error {
	return r.db.WithContext(ctx).Create(session).Error
}

func (r *sessionRepo) FindByID(ctx context.Context, id string) (*domain.TrainingSession, error) {
	var session domain.TrainingSession
	err := r.db.WithContext(ctx).First(&session, "id = ?", id).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, domain.NewNotFound("session", id)
	}
	return &session, err
}

func (r *sessionRepo) FindByTeam(ctx context.Context, teamID string, from, to *time.Time, page, limit int) ([]domain.TrainingSession, int64, error) {
	var sessions []domain.TrainingSession
	var total int64

	q := r.db.WithContext(ctx).Model(&domain.TrainingSession{}).Where("team_id = ?", teamID)
	if from != nil {
		q = q.Where("scheduled_at >= ?", *from)
	}
	if to != nil {
		q = q.Where("scheduled_at <= ?", *to)
	}

	if err := q.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	offset := (page - 1) * limit
	err := q.Offset(offset).Limit(limit).Order("scheduled_at DESC").Find(&sessions).Error
	return sessions, total, err
}

func (r *sessionRepo) FindByClub(ctx context.Context, clubID string, from, to *time.Time, page, limit int) ([]domain.TrainingSession, int64, error) {
	var sessions []domain.TrainingSession
	var total int64

	q := r.db.WithContext(ctx).Model(&domain.TrainingSession{}).
		Where("team_id IN (SELECT id FROM teams WHERE club_id = ? AND deleted_at IS NULL)", clubID)
	if from != nil {
		q = q.Where("scheduled_at >= ?", *from)
	}
	if to != nil {
		q = q.Where("scheduled_at <= ?", *to)
	}

	if err := q.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	offset := (page - 1) * limit
	err := q.Offset(offset).Limit(limit).Order("scheduled_at DESC").Find(&sessions).Error
	return sessions, total, err
}

func (r *sessionRepo) Update(ctx context.Context, session *domain.TrainingSession) error {
	return r.db.WithContext(ctx).Save(session).Error
}

func (r *sessionRepo) Delete(ctx context.Context, id string) error {
	return r.db.WithContext(ctx).Delete(&domain.TrainingSession{}, "id = ?", id).Error
}

func (r *sessionRepo) AddBlock(ctx context.Context, block *domain.TrainingBlock) error {
	return r.db.WithContext(ctx).Create(block).Error
}

func (r *sessionRepo) UpdateBlock(ctx context.Context, block *domain.TrainingBlock) error {
	return r.db.WithContext(ctx).Save(block).Error
}

func (r *sessionRepo) GetBlocks(ctx context.Context, sessionID string) ([]domain.TrainingBlock, error) {
	var blocks []domain.TrainingBlock
	err := r.db.WithContext(ctx).
		Where("session_id = ?", sessionID).
		Order("order_index ASC").
		Find(&blocks).Error
	return blocks, err
}

func (r *sessionRepo) AddExerciseToBlock(ctx context.Context, se *domain.SessionExercise) error {
	return r.db.WithContext(ctx).Create(se).Error
}

func (r *sessionRepo) GetSessionDetail(ctx context.Context, id string) (*domain.TrainingSession, error) {
	var session domain.TrainingSession
	err := r.db.WithContext(ctx).
		Preload("Blocks", func(db *gorm.DB) *gorm.DB {
			return db.Order("order_index ASC")
		}).
		Preload("Blocks.Exercises", func(db *gorm.DB) *gorm.DB {
			return db.Order("order_index ASC")
		}).
		Preload("Blocks.Exercises.Exercise").
		Preload("Attendance").
		Preload("Attendance.Player").
		First(&session, "id = ?", id).Error

	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, domain.NewNotFound("session", id)
	}
	return &session, err
}

// SaveBlocks replaces all blocks (and their exercises) for a session atomically.
func (r *sessionRepo) SaveBlocks(ctx context.Context, sessionID string, blocks []domain.TrainingBlock) error {
	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		// 1. Find all block IDs for this session
		var blockIDs []string
		if err := tx.Model(&domain.TrainingBlock{}).
			Where("session_id = ?", sessionID).
			Pluck("id", &blockIDs).Error; err != nil {
			return err
		}

		// 2. Hard-delete all exercises for these blocks
		if len(blockIDs) > 0 {
			if err := tx.Unscoped().
				Where("block_id IN ?", blockIDs).
				Delete(&domain.SessionExercise{}).Error; err != nil {
				return err
			}
		}

		// 3. Hard-delete all blocks for this session
		if err := tx.Unscoped().
			Where("session_id = ?", sessionID).
			Delete(&domain.TrainingBlock{}).Error; err != nil {
			return err
		}

		// 4. Create new blocks and their exercises explicitly
		for i := range blocks {
			b := &blocks[i]
			b.SessionID = sessionID
			// Create block first
			if err := tx.Omit("Exercises").Create(b).Error; err != nil {
				return err
			}
			// Create exercises
			for j := range b.Exercises {
				b.Exercises[j].BlockID = b.ID
				if err := tx.Omit("Exercise").Create(&b.Exercises[j]).Error; err != nil {
					return err
				}
			}
		}

		return nil
	})
}
