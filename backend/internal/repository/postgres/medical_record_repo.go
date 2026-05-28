package postgres

import (
	"context"
	"errors"

	"github.com/coachos/backend/internal/domain"
	"github.com/coachos/backend/internal/repository"
	"gorm.io/gorm"
)

type medicalRecordRepo struct {
	db *gorm.DB
}

// NewMedicalRecordRepository returns a GORM-backed MedicalRecordRepository.
func NewMedicalRecordRepository(db *gorm.DB) repository.MedicalRecordRepository {
	return &medicalRecordRepo{db: db}
}

func (r *medicalRecordRepo) Create(ctx context.Context, record *domain.MedicalRecord) error {
	return r.db.WithContext(ctx).Create(record).Error
}

func (r *medicalRecordRepo) FindByID(ctx context.Context, id string) (*domain.MedicalRecord, error) {
	var record domain.MedicalRecord
	err := r.db.WithContext(ctx).First(&record, "id = ?", id).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, domain.NewNotFound("medical_record", id)
	}
	return &record, err
}

func (r *medicalRecordRepo) ListByPlayer(ctx context.Context, playerID string, page, limit int) ([]domain.MedicalRecord, int64, error) {
	var records []domain.MedicalRecord
	var total int64

	q := r.db.WithContext(ctx).Model(&domain.MedicalRecord{}).Where("player_id = ?", playerID)
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

	err := q.Order("created_at DESC").Offset(offset).Limit(limit).Find(&records).Error
	return records, total, err
}

func (r *medicalRecordRepo) Update(ctx context.Context, record *domain.MedicalRecord) error {
	return r.db.WithContext(ctx).Save(record).Error
}

func (r *medicalRecordRepo) Delete(ctx context.Context, id string) error {
	return r.db.WithContext(ctx).Delete(&domain.MedicalRecord{}, "id = ?", id).Error
}
