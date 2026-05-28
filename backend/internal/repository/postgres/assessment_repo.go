package postgres

import (
	"context"
	"errors"
	"time"

	"github.com/coachos/backend/internal/domain"
	"github.com/coachos/backend/internal/repository"
	"gorm.io/gorm"
)

type assessmentRepo struct {
	db *gorm.DB
}

// NewAssessmentRepository returns a GORM-backed AssessmentRepository.
func NewAssessmentRepository(db *gorm.DB) *assessmentRepo {
	return &assessmentRepo{db: db}
}

func (r *assessmentRepo) Create(ctx context.Context, assessment *domain.PlayerAssessment) error {
	return r.db.WithContext(ctx).Create(assessment).Error
}

func (r *assessmentRepo) FindByPlayer(ctx context.Context, playerID string, page, limit int) ([]domain.PlayerAssessment, int64, error) {
	var assessments []domain.PlayerAssessment
	var total int64

	q := r.db.WithContext(ctx).Model(&domain.PlayerAssessment{}).Where("player_id = ?", playerID)
	if err := q.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	offset := (page - 1) * limit
	err := q.Offset(offset).Limit(limit).Order("assessed_at DESC").Find(&assessments).Error
	return assessments, total, err
}

func (r *assessmentRepo) GetTeamSummary(ctx context.Context, teamID string) ([]repository.PlayerAssessmentSummary, error) {
	type row struct {
		PlayerID       string
		PlayerName     string
		LastAssessedAt *time.Time
		AvgTechnical   float64
		AvgPhysical    float64
		AvgTactical    float64
		AvgDiscipline  float64
		AvgTeamwork    float64
		Total          int
	}

	var rows []row
	err := r.db.WithContext(ctx).Raw(`
		SELECT
			p.id                                    AS player_id,
			p.first_name || ' ' || p.last_name      AS player_name,
			MAX(pa.assessed_at)                     AS last_assessed_at,
			COALESCE(AVG(pa.technical),0)           AS avg_technical,
			COALESCE(AVG(pa.physical),0)            AS avg_physical,
			COALESCE(AVG(pa.tactical),0)            AS avg_tactical,
			COALESCE(AVG(pa.discipline),0)          AS avg_discipline,
			COALESCE(AVG(pa.teamwork),0)            AS avg_teamwork,
			COUNT(pa.id)                            AS total
		FROM team_members tm
		JOIN players p ON p.id = tm.player_id AND p.deleted_at IS NULL
		LEFT JOIN player_assessments pa ON pa.player_id = p.id AND pa.deleted_at IS NULL
		WHERE tm.team_id = ?
		GROUP BY p.id, p.first_name, p.last_name
	`, teamID).Scan(&rows).Error
	if err != nil {
		return nil, err
	}

	summaries := make([]repository.PlayerAssessmentSummary, 0, len(rows))
	for _, row := range rows {
		s := repository.PlayerAssessmentSummary{
			PlayerID:      row.PlayerID,
			PlayerName:    row.PlayerName,
			AvgTechnical:  row.AvgTechnical,
			AvgPhysical:   row.AvgPhysical,
			AvgTactical:   row.AvgTactical,
			AvgDiscipline: row.AvgDiscipline,
			AvgTeamwork:   row.AvgTeamwork,
			Total:         row.Total,
		}
		if row.LastAssessedAt != nil {
			s.LastAssessedAt = *row.LastAssessedAt
		}
		summaries = append(summaries, s)
	}
	return summaries, nil
}

func (r *assessmentRepo) GetLatestByPlayer(ctx context.Context, playerID string) (*domain.PlayerAssessment, error) {
	var a domain.PlayerAssessment
	err := r.db.WithContext(ctx).
		Where("player_id = ?", playerID).
		Order("assessed_at DESC").
		First(&a).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, nil
	}
	return &a, err
}
