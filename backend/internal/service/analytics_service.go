package service

import (
	"context"
	"errors"
	"math"
	"sort"
	"time"

	"github.com/coachos/backend/internal/domain"
	"github.com/coachos/backend/internal/dto"
	pkgjwt "github.com/coachos/backend/internal/pkg/jwt"
	"github.com/coachos/backend/internal/repository"
)

// AnalyticsService handles analytics aggregation.
type AnalyticsService struct {
	sessionRepo    repository.TrainingSessionRepository
	teamRepo       repository.TeamRepository
	playerRepo     repository.PlayerRepository
	attendanceRepo repository.AttendanceRepository
	assessmentRepo repository.AssessmentRepository
	matchRepo      repository.MatchRepository
	goalRepo       repository.PlayerGoalRepository
	parentRepo     repository.ParentRepository
}

// NewAnalyticsService creates a new AnalyticsService.
func NewAnalyticsService(
	sessionRepo repository.TrainingSessionRepository,
	teamRepo repository.TeamRepository,
	playerRepo repository.PlayerRepository,
	attendanceRepo repository.AttendanceRepository,
	assessmentRepo repository.AssessmentRepository,
	matchRepo repository.MatchRepository,
	goalRepo repository.PlayerGoalRepository,
	parentRepo repository.ParentRepository,
) *AnalyticsService {
	return &AnalyticsService{
		sessionRepo:    sessionRepo,
		teamRepo:       teamRepo,
		playerRepo:     playerRepo,
		attendanceRepo: attendanceRepo,
		assessmentRepo: assessmentRepo,
		matchRepo:      matchRepo,
		goalRepo:       goalRepo,
		parentRepo:     parentRepo,
	}
}

// CoachDashboard returns today's coaching summary.
func (s *AnalyticsService) CoachDashboard(ctx context.Context, clubID string) (*dto.CoachDashboardResponse, error) {
	now := time.Now()
	startOfDay := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location())
	endOfDay := startOfDay.Add(24 * time.Hour)

	teams, _, _ := s.teamRepo.FindByClub(ctx, clubID, 1, 100)

	var todaysSessions []dto.SessionResponse
	var upcomingSessions []dto.SessionResponse
	absentToday := 0

	tomorrow := now.Add(24 * time.Hour)
	weekLater := now.Add(7 * 24 * time.Hour)

	for _, team := range teams {
		sessions, _, _ := s.sessionRepo.FindByTeam(ctx, team.ID, &startOfDay, &endOfDay, 1, 50)
		for _, sess := range sessions {
			todaysSessions = append(todaysSessions, mapSession(sess))
			attendance, _ := s.attendanceRepo.GetBySession(ctx, sess.ID)
			for _, rec := range attendance {
				if rec.Status == domain.AttendanceStatusAbsent {
					absentToday++
				}
			}
		}
		upcoming, _, _ := s.sessionRepo.FindByTeam(ctx, team.ID, &tomorrow, &weekLater, 1, 5)
		for _, sess := range upcoming {
			upcomingSessions = append(upcomingSessions, mapSession(sess))
		}
	}

	// Players at risk: attendance < 60%
	var playersAtRisk []dto.PlayerRiskItem
	for _, team := range teams {
		members, _ := s.teamRepo.GetMembers(ctx, team.ID)
		for _, m := range members {
			present, total, _ := s.attendanceRepo.GetPlayerAttendanceStats(ctx, m.PlayerID)
			var rate float64
			if total > 0 {
				rate = float64(present) / float64(total) * 100
			}
			if rate < 60 || (total == 0) {
				playersAtRisk = append(playersAtRisk, dto.PlayerRiskItem{
					PlayerID:       m.PlayerID,
					PlayerName:     m.Player.FirstName + " " + m.Player.LastName,
					AttendanceRate: rate,
					DevIndex:       m.Player.DevIndex,
					RiskReason:     "Low attendance rate",
				})
			}
		}
	}

	// Recent assessments
	var recentAssessments []dto.AssessmentResponse
	for _, team := range teams {
		summary, _ := s.assessmentRepo.GetTeamSummary(ctx, team.ID)
		for _, ps := range summary {
			if !ps.LastAssessedAt.IsZero() {
				recentAssessments = append(recentAssessments, dto.AssessmentResponse{
					PlayerID:   ps.PlayerID,
					AssessedAt: ps.LastAssessedAt,
					Technical:  int(ps.AvgTechnical),
					Physical:   int(ps.AvgPhysical),
					Tactical:   int(ps.AvgTactical),
					Discipline: int(ps.AvgDiscipline),
					Teamwork:   int(ps.AvgTeamwork),
				})
			}
			if len(recentAssessments) >= 5 {
				break
			}
		}
	}

	// Team stats
	var teamStats []dto.TeamStatItem
	for _, team := range teams {
		members, _ := s.teamRepo.GetMembers(ctx, team.ID)
		var totalDev float64
		for _, m := range members {
			totalDev += m.Player.DevIndex
		}
		var avgDev float64
		if len(members) > 0 {
			avgDev = totalDev / float64(len(members))
		}
		from := time.Now().AddDate(0, -3, 0)
		to := time.Now()
		var avgAtt float64
		if stats, err := s.attendanceRepo.GetTeamAttendanceStats(ctx, team.ID, from, to); err == nil {
			var present, total int
			for _, ps := range stats {
				present += ps.Present
				total += ps.Total
			}
			if total > 0 {
				avgAtt = float64(present) / float64(total) * 100
			}
		}
		teamStats = append(teamStats, dto.TeamStatItem{
			TeamID:        team.ID,
			TeamName:      team.Name,
			PlayerCount:   len(members),
			AvgDevIndex:   avgDev,
			AvgAttendance: avgAtt,
		})
	}

	return &dto.CoachDashboardResponse{
		TodaysSessions:    todaysSessions,
		AbsentToday:       absentToday,
		PlayersAtRisk:     playersAtRisk,
		UpcomingSessions:  upcomingSessions,
		RecentAssessments: recentAssessments,
		TeamStats:         teamStats,
	}, nil
}

// TeamAnalytics returns team-level analytics.
func (s *AnalyticsService) TeamAnalytics(ctx context.Context, teamID string) (*dto.TeamAnalyticsResponse, error) {
	from := time.Now().AddDate(0, -3, 0)
	to := time.Now()

	teamStats, err := s.attendanceRepo.GetTeamAttendanceStats(ctx, teamID, from, to)
	if err != nil {
		return nil, err
	}

	var overallPresent, overallTotal int
	for _, ps := range teamStats {
		overallPresent += ps.Present
		overallTotal += ps.Total
	}

	var overallRate float64
	if overallTotal > 0 {
		overallRate = float64(overallPresent) / float64(overallTotal) * 100
	}

	attendancePoint := dto.AttendanceDataPoint{
		Date:           to,
		AttendanceRate: overallRate,
		Present:        overallPresent,
		Total:          overallTotal,
	}

	summary, _ := s.assessmentRepo.GetTeamSummary(ctx, teamID)
	var avgT, avgP, avgTac, avgD, avgTw float64
	if len(summary) > 0 {
		for _, ps := range summary {
			avgT += ps.AvgTechnical
			avgP += ps.AvgPhysical
			avgTac += ps.AvgTactical
			avgD += ps.AvgDiscipline
			avgTw += ps.AvgTeamwork
		}
		n := float64(len(summary))
		avgT /= n
		avgP /= n
		avgTac /= n
		avgD /= n
		avgTw /= n
	}

	weeklyLoad := s.buildWeeklyLoad(ctx, teamID)

	return &dto.TeamAnalyticsResponse{
		TeamID:             teamID,
		AttendanceOverTime: []dto.AttendanceDataPoint{attendancePoint},
		AvgAssessments: dto.AssessmentDataPoint{
			AssessedAt: time.Now(),
			Technical:  avgT,
			Physical:   avgP,
			Tactical:   avgTac,
			Discipline: avgD,
			Teamwork:   avgTw,
		},
		TrainingLoadByWeek: weeklyLoad,
	}, nil
}

// PlayerAnalytics returns player-level analytics.
// `requestedPlayerID` may be either players.id or the linked account users.id (player portal uses the latter).
func (s *AnalyticsService) PlayerAnalytics(ctx context.Context, requestedPlayerID string, claims *pkgjwt.Claims) (*dto.PlayerAnalyticsResponse, error) {
	player, err := s.playerRepo.FindByID(ctx, requestedPlayerID)
	if err != nil {
		if errors.Is(err, domain.ErrNotFound) {
			p2, err2 := s.playerRepo.FindByUserID(ctx, requestedPlayerID)
			if err2 == nil {
				player = p2
				err = nil
			} else {
				err = err2
			}
		}
		if err != nil {
			return nil, err
		}
	}

	if err := s.assertPlayerAnalyticsAccess(ctx, player, claims); err != nil {
		return nil, err
	}

	dbPlayerID := player.ID

	assessments, _, _ := s.assessmentRepo.FindByPlayer(ctx, dbPlayerID, 1, 50)
	timeline := make([]dto.AssessmentDataPoint, 0, len(assessments))
	devIndexHistory := make([]dto.DevIndexHistoryPoint, 0, len(assessments)+1)
	for _, a := range assessments {
		timeline = append(timeline, dto.AssessmentDataPoint{
			AssessedAt: a.AssessedAt,
			Technical:  float64(a.Technical),
			Physical:   float64(a.Physical),
			Tactical:   float64(a.Tactical),
			Discipline: float64(a.Discipline),
			Teamwork:   float64(a.Teamwork),
		})
		avgSkill := (float64(a.Technical+a.Physical+a.Tactical+a.Discipline+a.Teamwork) / 5.0) * 10.0
		devIndexHistory = append(devIndexHistory, dto.DevIndexHistoryPoint{
			Date:  a.AssessedAt,
			Value: math.Round(avgSkill*100) / 100,
		})
	}

	sort.Slice(devIndexHistory, func(i, j int) bool {
		return devIndexHistory[i].Date.Before(devIndexHistory[j].Date)
	})
	devIndexHistory = append(devIndexHistory, dto.DevIndexHistoryPoint{
		Date:  time.Now(),
		Value: player.DevIndex,
	})

	records, _, _ := s.attendanceRepo.GetByPlayer(ctx, dbPlayerID, 1, 100)
	attendanceRows := make([]dto.AttendanceResponse, 0, len(records))
	for _, r := range records {
		fn, ln := "", ""
		if r.Player.ID != "" {
			fn = r.Player.FirstName
			ln = r.Player.LastName
		}
		attendanceRows = append(attendanceRows, dto.AttendanceResponse{
			ID:        r.ID,
			SessionID: r.SessionID,
			PlayerID:  r.PlayerID,
			FirstName: fn,
			LastName:  ln,
			Status:    string(r.Status),
			Reason:    r.Reason,
			MarkedAt:  r.MarkedAt,
		})
	}

	goals, _ := s.goalRepo.FindByPlayer(ctx, dbPlayerID)
	goalItems := make([]dto.GoalProgressItem, 0, len(goals))
	for _, g := range goals {
		goalItems = append(goalItems, dto.GoalProgressItem{
			ID:           g.ID,
			PlayerID:     g.PlayerID,
			Title:        g.Title,
			Description:  g.Description,
			TargetMetric: g.TargetMetric,
			TargetValue:  g.TargetValue,
			Deadline:     g.Deadline,
			Status:       string(g.Status),
			ProgressPct:  g.ProgressPct,
		})
	}

	return &dto.PlayerAnalyticsResponse{
		PlayerID:           dbPlayerID,
		AssessmentTimeline: timeline,
		AttendanceHistory:  attendanceRows,
		GoalsProgress:      goalItems,
		DevIndex:           player.DevIndex,
		DevIndexHistory:    devIndexHistory,
	}, nil
}

func (s *AnalyticsService) assertPlayerAnalyticsAccess(ctx context.Context, player *domain.Player, claims *pkgjwt.Claims) error {
	if claims == nil {
		return nil
	}
	switch domain.Role(claims.Role) {
	case domain.RolePlayer:
		if player.UserID == nil || *player.UserID != claims.UserID {
			return domain.NewForbidden("you can only view your own analytics")
		}
	case domain.RoleCoach, domain.RoleAnalyst, domain.RoleAdmin:
		if claims.ClubID == "" {
			return domain.NewForbidden("no club context")
		}
		if player.ClubID != claims.ClubID {
			return domain.NewForbidden("player belongs to another club")
		}
	case domain.RoleParent:
		ok, err := s.parentRepo.IsParentLinkedToPlayer(ctx, claims.UserID, player.ID)
		if err != nil {
			return err
		}
		if !ok {
			return domain.NewForbidden("not linked to this player")
		}
	default:
		return domain.NewForbidden("access denied")
	}
	return nil
}

// AttendanceAnalytics returns attendance analytics for a team or whole club when teamID is empty and clubID is set.
func (s *AnalyticsService) AttendanceAnalytics(ctx context.Context, teamID, clubID string) (*dto.AttendanceAnalyticsResponse, error) {
	from := time.Now().AddDate(0, -3, 0)
	to := time.Now()

	var stats []repository.PlayerAttendanceStat
	var err error
	switch {
	case teamID != "":
		stats, err = s.attendanceRepo.GetTeamAttendanceStats(ctx, teamID, from, to)
	case clubID != "":
		stats, err = s.attendanceRepo.GetClubAttendanceStats(ctx, clubID, from, to)
	default:
		return nil, domain.NewBadRequest("teamId query parameter is required when user has no club")
	}
	if err != nil {
		return nil, err
	}

	var totalPresent, totalTotal int
	players := make([]dto.PlayerAttendanceStat, 0, len(stats))
	for _, st := range stats {
		totalPresent += st.Present
		totalTotal += st.Total
		players = append(players, dto.PlayerAttendanceStat{
			PlayerID:   st.PlayerID,
			PlayerName: st.PlayerName,
			Present:    st.Present,
			Total:      st.Total,
			Rate:       st.Rate,
		})
	}

	var overallRate float64
	if totalTotal > 0 {
		overallRate = float64(totalPresent) / float64(totalTotal) * 100
	}

	respTeamID := teamID
	if respTeamID == "" {
		respTeamID = clubID
	}
	return &dto.AttendanceAnalyticsResponse{
		TeamID:      respTeamID,
		OverallRate: overallRate,
		Players:     players,
	}, nil
}

// TrainingLoad returns weekly load analytics for a team or whole club when teamID is empty and clubID is set.
func (s *AnalyticsService) CalculatePlayerForm(ctx context.Context, playerID string) (*dto.PlayerFormResponse, error) {
	// Last 14 days window
	cutoff := time.Now().AddDate(0, 0, -14)

	// Get recent assessments
	assessments, _, err := s.assessmentRepo.FindByPlayer(ctx, playerID, 1, 50)
	if err != nil {
		return nil, err
	}
	var recentAssessments []domain.PlayerAssessment
	var totalScore float64
	for _, a := range assessments {
		if a.AssessedAt.After(cutoff) {
			recentAssessments = append(recentAssessments, a)
			avg := float64(a.Technical+a.Physical+a.Tactical+a.Discipline+a.Teamwork) / 5.0
			totalScore += avg
		}
	}
	var avgScore float64
	if len(recentAssessments) > 0 {
		avgScore = totalScore / float64(len(recentAssessments))
	}

	// Attendance in last 14 days
	present, total, err := s.attendanceRepo.GetPlayerAttendanceStats(ctx, playerID)
	if err != nil {
		present, total = 0, 0
	}
	var attendanceRate float64
	if total > 0 {
		attendanceRate = float64(present) / float64(total) * 100
	}

	// Matches in last 14 days (via match events presence)
	matchStats, _ := s.matchRepo.GetPlayerMatchStats(ctx, playerID)
	matchCount := 0
	if matchStats != nil {
		matchCount = matchStats.MatchesPlayed
	}

	// Determine form
	form := "stable"
	label := "playerForm.stable"
	trend := "➡️"

	if matchCount == 0 && len(recentAssessments) == 0 {
		form = "rusty"
		label = "playerForm.rusty"
		trend = "💤"
	} else if avgScore >= 8.0 && attendanceRate >= 95 && matchCount >= 2 {
		form = "excellent"
		label = "playerForm.excellent"
		trend = "🔥"
	} else if len(recentAssessments) >= 2 {
		// Compare latest with previous to detect trend
		latest := recentAssessments[0]
		prev := recentAssessments[len(recentAssessments)-1]
		latestAvg := float64(latest.Technical+latest.Physical+latest.Tactical+latest.Discipline+latest.Teamwork) / 5.0
		prevAvg := float64(prev.Technical+prev.Physical+prev.Tactical+prev.Discipline+prev.Teamwork) / 5.0
		if latestAvg > prevAvg+0.5 {
			form = "rising"
			label = "playerForm.rising"
			trend = "↗️"
		} else if latestAvg < prevAvg-0.5 {
			form = "falling"
			label = "playerForm.falling"
			trend = "↘️"
		}
	}

	return &dto.PlayerFormResponse{
		Form:       form,
		Label:      label,
		Trend:      trend,
		AvgScore:   math.Round(avgScore*10) / 10,
		Attendance: math.Round(attendanceRate*10) / 10,
		MatchCount: matchCount,
	}, nil
}

func (s *AnalyticsService) GetPlayerMatchStats(ctx context.Context, playerID string) (*repository.PlayerMatchStats, error) {
	return s.matchRepo.GetPlayerMatchStats(ctx, playerID)
}

func (s *AnalyticsService) TrainingLoad(ctx context.Context, teamID, clubID string) (*dto.TrainingLoadResponse, error) {
	var weeklyLoad []dto.WeeklyLoadPoint
	switch {
	case teamID != "":
		weeklyLoad = s.buildWeeklyLoad(ctx, teamID)
	case clubID != "":
		weeklyLoad = s.buildWeeklyLoadForClub(ctx, clubID)
	default:
		return nil, domain.NewBadRequest("teamId query parameter is required when user has no club")
	}

	var currentLoad float64
	if len(weeklyLoad) > 0 {
		currentLoad = weeklyLoad[len(weeklyLoad)-1].Load
	}

	respTeamID := teamID
	if respTeamID == "" {
		respTeamID = clubID
	}
	return &dto.TrainingLoadResponse{
		TeamID:          respTeamID,
		WeeklyLoad:      weeklyLoad,
		OverloadWarning: currentLoad > weeklyLoadThreshold,
		CurrentLoad:     currentLoad,
		Threshold:       weeklyLoadThreshold,
	}, nil
}

func (s *AnalyticsService) buildWeeklyLoad(ctx context.Context, teamID string) []dto.WeeklyLoadPoint {
	intensityMultiplier := map[domain.SessionIntensity]float64{
		domain.SessionIntensityLow:    0.5,
		domain.SessionIntensityMedium: 1.0,
		domain.SessionIntensityHigh:   1.5,
	}

	var points []dto.WeeklyLoadPoint
	for i := 7; i >= 0; i-- {
		weekStart := time.Now().AddDate(0, 0, -i*7)
		weekEnd := weekStart.Add(7 * 24 * time.Hour)
		sessions, _, _ := s.sessionRepo.FindByTeam(ctx, teamID, &weekStart, &weekEnd, 1, 100)

		var load float64
		for _, sess := range sessions {
			mult := intensityMultiplier[sess.Intensity]
			if mult == 0 {
				mult = 1.0
			}
			load += float64(sess.DurationMin) * mult
		}
		points = append(points, dto.WeeklyLoadPoint{
			WeekStart: weekStart,
			Load:      load,
			Sessions:  len(sessions),
		})
	}
	return points
}

func (s *AnalyticsService) buildWeeklyLoadForClub(ctx context.Context, clubID string) []dto.WeeklyLoadPoint {
	intensityMultiplier := map[domain.SessionIntensity]float64{
		domain.SessionIntensityLow:    0.5,
		domain.SessionIntensityMedium: 1.0,
		domain.SessionIntensityHigh:   1.5,
	}

	var points []dto.WeeklyLoadPoint
	for i := 7; i >= 0; i-- {
		weekStart := time.Now().AddDate(0, 0, -i*7)
		weekEnd := weekStart.Add(7 * 24 * time.Hour)
		sessions, _, _ := s.sessionRepo.FindByClub(ctx, clubID, &weekStart, &weekEnd, 1, 100)

		var load float64
		for _, sess := range sessions {
			mult := intensityMultiplier[sess.Intensity]
			if mult == 0 {
				mult = 1.0
			}
			load += float64(sess.DurationMin) * mult
		}
		points = append(points, dto.WeeklyLoadPoint{
			WeekStart: weekStart,
			Load:      load,
			Sessions:  len(sessions),
		})
	}
	return points
}
