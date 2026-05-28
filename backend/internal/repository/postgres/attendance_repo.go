package postgres

import (
	"context"
	"time"

	"github.com/coachos/backend/internal/domain"
	"github.com/coachos/backend/internal/repository"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type attendanceRepo struct {
	db *gorm.DB
}

// NewAttendanceRepository returns a GORM-backed AttendanceRepository.
func NewAttendanceRepository(db *gorm.DB) *attendanceRepo {
	return &attendanceRepo{db: db}
}

func (r *attendanceRepo) Upsert(ctx context.Context, record *domain.AttendanceRecord) error {
	return r.db.WithContext(ctx).
		Clauses(clause.OnConflict{
			Columns:   []clause.Column{{Name: "session_id"}, {Name: "player_id"}},
			DoUpdates: clause.AssignmentColumns([]string{"status", "reason", "marked_by_id", "marked_at"}),
		}).
		Create(record).Error
}

func (r *attendanceRepo) GetBySession(ctx context.Context, sessionID string) ([]domain.AttendanceRecord, error) {
	var records []domain.AttendanceRecord
	err := r.db.WithContext(ctx).
		Preload("Player").
		Where("session_id = ?", sessionID).
		Find(&records).Error
	return records, err
}

func (r *attendanceRepo) GetByPlayer(ctx context.Context, playerID string, page, limit int) ([]domain.AttendanceRecord, int64, error) {
	var records []domain.AttendanceRecord
	var total int64

	q := r.db.WithContext(ctx).Model(&domain.AttendanceRecord{}).Where("player_id = ?", playerID)
	if err := q.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	offset := (page - 1) * limit
	err := q.Preload("Session").Preload("Player").Offset(offset).Limit(limit).Order("marked_at DESC").Find(&records).Error
	return records, total, err
}

func (r *attendanceRepo) GetPlayerAttendanceStats(ctx context.Context, playerID string) (present, total int, err error) {
	type result struct {
		Total   int
		Present int
	}
	var res result
	err = r.db.WithContext(ctx).
		Raw(`SELECT COUNT(*) as total,
			SUM(CASE WHEN status IN ('present','late') THEN 1 ELSE 0 END) as present
			FROM attendance_records
			WHERE player_id = ? AND deleted_at IS NULL`, playerID).
		Scan(&res).Error
	return res.Present, res.Total, err
}

func (r *attendanceRepo) GetTeamAttendanceStats(ctx context.Context, teamID string, from, to time.Time) ([]repository.PlayerAttendanceStat, error) {
	type row struct {
		PlayerID   string
		PlayerName string
		Present    int
		Total      int
	}

	var rows []row
	err := r.db.WithContext(ctx).Raw(`
		SELECT
			p.id                                                       AS player_id,
			p.first_name || ' ' || p.last_name                        AS player_name,
			SUM(CASE WHEN ar.status IN ('present','late') THEN 1 ELSE 0 END) AS present,
			COUNT(ar.id)                                               AS total
		FROM team_members tm
		JOIN players p ON p.id = tm.player_id AND p.deleted_at IS NULL
		LEFT JOIN training_sessions ts ON ts.team_id = tm.team_id
			AND ts.scheduled_at BETWEEN ? AND ?
			AND ts.deleted_at IS NULL
		LEFT JOIN attendance_records ar ON ar.session_id = ts.id
			AND ar.player_id = p.id
			AND ar.deleted_at IS NULL
		WHERE tm.team_id = ?
		GROUP BY p.id, p.first_name, p.last_name
	`, from, to, teamID).Scan(&rows).Error
	if err != nil {
		return nil, err
	}

	stats := make([]repository.PlayerAttendanceStat, 0, len(rows))
	for _, row := range rows {
		var rate float64
		if row.Total > 0 {
			rate = float64(row.Present) / float64(row.Total) * 100
		}
		stats = append(stats, repository.PlayerAttendanceStat{
			PlayerID:   row.PlayerID,
			PlayerName: row.PlayerName,
			Present:    row.Present,
			Total:      row.Total,
			Rate:       rate,
		})
	}
	return stats, nil
}

func (r *attendanceRepo) GetClubAttendanceStats(ctx context.Context, clubID string, from, to time.Time) ([]repository.PlayerAttendanceStat, error) {
	type row struct {
		PlayerID   string
		PlayerName string
		Present    int
		Total      int
	}

	var rows []row
	err := r.db.WithContext(ctx).Raw(`
		SELECT
			p.id                                                       AS player_id,
			p.first_name || ' ' || p.last_name                        AS player_name,
			SUM(CASE WHEN ar.status IN ('present','late') THEN 1 ELSE 0 END) AS present,
			COUNT(ar.id)                                               AS total
		FROM team_members tm
		JOIN teams t ON t.id = tm.team_id AND t.club_id = ? AND t.deleted_at IS NULL
		JOIN players p ON p.id = tm.player_id AND p.deleted_at IS NULL
		LEFT JOIN training_sessions ts ON ts.team_id = t.id
			AND ts.scheduled_at BETWEEN ? AND ?
			AND ts.deleted_at IS NULL
		LEFT JOIN attendance_records ar ON ar.session_id = ts.id
			AND ar.player_id = p.id
			AND ar.deleted_at IS NULL
		GROUP BY p.id, p.first_name, p.last_name
	`, clubID, from, to).Scan(&rows).Error
	if err != nil {
		return nil, err
	}

	stats := make([]repository.PlayerAttendanceStat, 0, len(rows))
	for _, row := range rows {
		var rate float64
		if row.Total > 0 {
			rate = float64(row.Present) / float64(row.Total) * 100
		}
		stats = append(stats, repository.PlayerAttendanceStat{
			PlayerID:   row.PlayerID,
			PlayerName: row.PlayerName,
			Present:    row.Present,
			Total:      row.Total,
			Rate:       rate,
		})
	}
	return stats, nil
}
