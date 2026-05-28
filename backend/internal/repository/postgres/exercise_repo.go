package postgres

import (
	"context"
	"errors"

	"github.com/coachos/backend/internal/domain"
	"github.com/coachos/backend/internal/repository"
	"gorm.io/gorm"
)

type exerciseRepo struct {
	db *gorm.DB
}

// NewExerciseRepository returns a GORM-backed ExerciseRepository.
func NewExerciseRepository(db *gorm.DB) *exerciseRepo {
	return &exerciseRepo{db: db}
}

func (r *exerciseRepo) Create(ctx context.Context, exercise *domain.Exercise) error {
	return r.db.WithContext(ctx).Create(exercise).Error
}

func (r *exerciseRepo) FindByID(ctx context.Context, id string) (*domain.Exercise, error) {
	var exercise domain.Exercise
	err := r.db.WithContext(ctx).First(&exercise, "id = ?", id).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, domain.NewNotFound("exercise", id)
	}
	return &exercise, err
}

func (r *exerciseRepo) List(ctx context.Context, clubID string, filter repository.ExerciseFilter) ([]domain.Exercise, int64, error) {
	var exercises []domain.Exercise
	var total int64

	q := r.db.WithContext(ctx).Model(&domain.Exercise{})

	// Show global exercises and/or club-specific exercises
	if filter.Global {
		q = q.Where("is_global = true OR club_id = ?", clubID)
	} else if clubID != "" {
		q = q.Where("club_id = ? OR is_global = true", clubID)
	}

	if filter.Category != "" {
		q = q.Where("category = ?", filter.Category)
	}
	if filter.Difficulty > 0 {
		q = q.Where("difficulty = ?", filter.Difficulty)
	}
	if filter.Search != "" {
		q = q.Where("name ILIKE ?", "%"+filter.Search+"%")
	}
	if len(filter.Tags) > 0 {
		q = q.Where("tags && ?", "{"+joinTags(filter.Tags)+"}")
	}

	if err := q.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	page := filter.Page
	limit := filter.Limit
	if page < 1 {
		page = 1
	}
	if limit < 1 {
		limit = 20
	}
	offset := (page - 1) * limit

	err := q.Offset(offset).Limit(limit).Order("name ASC").Find(&exercises).Error
	return exercises, total, err
}

func (r *exerciseRepo) Update(ctx context.Context, exercise *domain.Exercise) error {
	return r.db.WithContext(ctx).Save(exercise).Error
}

func (r *exerciseRepo) Delete(ctx context.Context, id string) error {
	return r.db.WithContext(ctx).Delete(&domain.Exercise{}, "id = ?", id).Error
}

func joinTags(tags []string) string {
	result := ""
	for i, t := range tags {
		if i > 0 {
			result += ","
		}
		result += t
	}
	return result
}
