package service

import (
	"context"
	"strings"

	"github.com/coachos/backend/internal/domain"
	"github.com/coachos/backend/internal/dto"
	"github.com/coachos/backend/internal/repository"
	"github.com/lib/pq"
)

// ExerciseService handles exercise business logic.
type ExerciseService struct {
	exerciseRepo repository.ExerciseRepository
}

// NewExerciseService creates a new ExerciseService.
func NewExerciseService(exerciseRepo repository.ExerciseRepository) *ExerciseService {
	return &ExerciseService{exerciseRepo: exerciseRepo}
}

// Create creates a new exercise.
func (s *ExerciseService) Create(ctx context.Context, clubID, createdByID string, req dto.CreateExerciseRequest) (*domain.Exercise, error) {
	var clubIDPtr *string
	if clubID != "" {
		clubIDPtr = &clubID
	}
	exercise := &domain.Exercise{
		ClubID:      clubIDPtr,
		Name:        req.Name,
		Category:    domain.ExerciseCategory(req.Category),
		Difficulty:  req.Difficulty,
		DurationMin: req.DurationMin,
		PlayersMin:  req.PlayersMin,
		PlayersMax:  req.PlayersMax,
		Equipment:   pq.StringArray(req.Equipment),
		Description: req.Description,
		DiagramURL:  req.DiagramURL,
		Tags:        pq.StringArray(req.Tags),
		CreatedByID: createdByID,
		IsGlobal:    req.IsGlobal,
	}
	if err := s.exerciseRepo.Create(ctx, exercise); err != nil {
		return nil, err
	}
	return exercise, nil
}

// FindByID returns an exercise by ID.
func (s *ExerciseService) FindByID(ctx context.Context, id string) (*domain.Exercise, error) {
	return s.exerciseRepo.FindByID(ctx, id)
}

// List returns exercises with optional filtering.
func (s *ExerciseService) List(ctx context.Context, clubID string, q dto.ExerciseFilterQuery) ([]domain.Exercise, int64, error) {
	page := q.Page
	if page < 1 {
		page = 1
	}
	limit := q.Limit
	if limit < 1 {
		limit = 20
	}

	var tags []string
	if q.Tags != "" {
		tags = strings.Split(q.Tags, ",")
	}

	filter := repository.ExerciseFilter{
		Category:   q.Category,
		Difficulty: q.Difficulty,
		Tags:       tags,
		Search:     q.Search,
		Global:     q.Global,
		Page:       page,
		Limit:      limit,
	}
	return s.exerciseRepo.List(ctx, clubID, filter)
}

// Update updates an exercise.
func (s *ExerciseService) Update(ctx context.Context, id string, req dto.UpdateExerciseRequest) (*domain.Exercise, error) {
	exercise, err := s.exerciseRepo.FindByID(ctx, id)
	if err != nil {
		return nil, err
	}

	if req.Name != "" {
		exercise.Name = req.Name
	}
	if req.Category != "" {
		exercise.Category = domain.ExerciseCategory(req.Category)
	}
	if req.Difficulty > 0 {
		exercise.Difficulty = req.Difficulty
	}
	if req.DurationMin > 0 {
		exercise.DurationMin = req.DurationMin
	}
	if req.Description != "" {
		exercise.Description = req.Description
	}
	if req.DiagramURL != "" {
		exercise.DiagramURL = req.DiagramURL
	}
	if req.Equipment != nil {
		exercise.Equipment = pq.StringArray(req.Equipment)
	}
	if req.Tags != nil {
		exercise.Tags = pq.StringArray(req.Tags)
	}
	exercise.IsGlobal = req.IsGlobal

	if err := s.exerciseRepo.Update(ctx, exercise); err != nil {
		return nil, err
	}
	return exercise, nil
}

// Delete deletes an exercise.
func (s *ExerciseService) Delete(ctx context.Context, id string) error {
	if _, err := s.exerciseRepo.FindByID(ctx, id); err != nil {
		return err
	}
	return s.exerciseRepo.Delete(ctx, id)
}
