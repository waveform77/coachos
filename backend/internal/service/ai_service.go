package service

import (
	"context"
	"encoding/json"
	"time"

	"github.com/coachos/backend/internal/ai"
	"github.com/coachos/backend/internal/domain"
	"github.com/coachos/backend/internal/dto"
	"github.com/coachos/backend/internal/notifier"
	"github.com/coachos/backend/internal/repository"
	"gorm.io/datatypes"
)

// AIService wraps the AI provider and persists results.
type AIService struct {
	provider       ai.Provider
	aiRepo         repository.AIRepository
	playerRepo     repository.PlayerRepository
	assessmentRepo repository.AssessmentRepository
	attendanceRepo repository.AttendanceRepository
	goalRepo       repository.PlayerGoalRepository
	exerciseRepo   repository.ExerciseRepository
	notif          notifier.Notifier
}

// NewAIService creates a new AIService.
func NewAIService(
	provider ai.Provider,
	aiRepo repository.AIRepository,
	playerRepo repository.PlayerRepository,
	assessmentRepo repository.AssessmentRepository,
	attendanceRepo repository.AttendanceRepository,
	goalRepo repository.PlayerGoalRepository,
	exerciseRepo repository.ExerciseRepository,
	notif notifier.Notifier,
) *AIService {
	return &AIService{
		provider:       provider,
		aiRepo:         aiRepo,
		playerRepo:     playerRepo,
		assessmentRepo: assessmentRepo,
		attendanceRepo: attendanceRepo,
		goalRepo:       goalRepo,
		exerciseRepo:   exerciseRepo,
		notif:          notif,
	}
}

// GenerateTrainingPlan generates a training plan for a team.
func (s *AIService) GenerateTrainingPlan(ctx context.Context, coachID string, req dto.GenerateTrainingPlanRequest) (*dto.AIResponse, error) {
	aiReq := ai.TrainingPlanRequest{
		Goal:        req.Goal,
		DurationMin: req.Duration,
		FocusAreas:  req.FocusAreas,
	}

	resp, err := s.provider.GenerateTrainingPlan(ctx, aiReq)
	if err != nil {
		return nil, err
	}

	promptJSON, _ := json.Marshal(aiReq)
	responseJSON, _ := json.Marshal(resp)

	rec := &domain.AIRecommendation{
		TargetType:  domain.AITargetTeam,
		TargetID:    req.TeamID,
		Prompt:      datatypes.JSON(promptJSON),
		Response:    datatypes.JSON(responseJSON),
		CreatedByID: coachID,
	}
	_ = s.aiRepo.Save(ctx, rec)

	blocks := make([]dto.BlockSuggestion, 0, len(resp.Blocks))
	for _, b := range resp.Blocks {
		blocks = append(blocks, dto.BlockSuggestion{
			Kind:        b.Kind,
			DurationMin: b.DurationMin,
			Exercises:   b.Exercises,
			Notes:       b.Notes,
		})
	}

	return &dto.AIResponse{
		Plan: &dto.TrainingPlanSuggestion{
			Title:     resp.Title,
			Overview:  resp.Overview,
			Blocks:    blocks,
			TotalLoad: resp.TotalLoad,
			Tips:      resp.Tips,
		},
	}, nil
}

// RecommendExercises recommends exercises for a player based on weak skill.
func (s *AIService) RecommendExercises(ctx context.Context, coachID string, req dto.RecommendExercisesRequest) (*dto.AIResponse, error) {
	player, err := s.playerRepo.FindByID(ctx, req.PlayerID)
	if err != nil {
		return nil, err
	}

	exercises, _, _ := s.exerciseRepo.List(ctx, player.ClubID, repository.ExerciseFilter{
		Page: 1, Limit: 50, Global: true,
	})

	exerciseInfos := make([]ai.ExerciseInfo, 0, len(exercises))
	for _, e := range exercises {
		exerciseInfos = append(exerciseInfos, ai.ExerciseInfo{
			ID:       e.ID,
			Name:     e.Name,
			Category: string(e.Category),
			Tags:     e.Tags,
		})
	}

	aiReq := ai.RecommendExercisesRequest{
		PlayerName:         player.FirstName + " " + player.LastName,
		WeakSkill:          req.WeakSkill,
		AvailableExercises: exerciseInfos,
	}

	resp, err := s.provider.RecommendExercises(ctx, aiReq)
	if err != nil {
		return nil, err
	}

	promptJSON, _ := json.Marshal(aiReq)
	responseJSON, _ := json.Marshal(resp)
	rec := &domain.AIRecommendation{
		TargetType:  domain.AITargetPlayer,
		TargetID:    req.PlayerID,
		Prompt:      datatypes.JSON(promptJSON),
		Response:    datatypes.JSON(responseJSON),
		CreatedByID: coachID,
	}
	_ = s.aiRepo.Save(ctx, rec)

	items := make([]dto.AIRecommendationItem, 0, len(resp.Exercises))
	for _, e := range resp.Exercises {
		items = append(items, dto.AIRecommendationItem{
			ID:       e.ID,
			Name:     e.Name,
			Reason:   e.Reason,
			Priority: e.Priority,
		})
	}

	return &dto.AIResponse{Recommendations: items}, nil
}

// AnalyzePlayer analyzes a player's performance.
func (s *AIService) AnalyzePlayer(ctx context.Context, coachID string, req dto.AnalyzePlayerRequest) (*dto.AIResponse, error) {
	player, err := s.playerRepo.FindByID(ctx, req.PlayerID)
	if err != nil {
		return nil, err
	}

	assessments, _, _ := s.assessmentRepo.FindByPlayer(ctx, req.PlayerID, 1, 20)
	present, total, _ := s.attendanceRepo.GetPlayerAttendanceStats(ctx, req.PlayerID)
	goals, _ := s.goalRepo.FindByPlayer(ctx, req.PlayerID)

	var attendanceRate float64
	if total > 0 {
		attendanceRate = float64(present) / float64(total) * 100
	}

	snapshots := make([]ai.AssessmentSnapshot, 0, len(assessments))
	for _, a := range assessments {
		avg := float64(a.Technical+a.Physical+a.Tactical+a.Discipline+a.Teamwork) / 5.0
		snapshots = append(snapshots, ai.AssessmentSnapshot{
			Date:       a.AssessedAt.Format(time.RFC3339),
			Technical:  a.Technical,
			Physical:   a.Physical,
			Tactical:   a.Tactical,
			Discipline: a.Discipline,
			Teamwork:   a.Teamwork,
			Average:    avg,
		})
	}

	achieved := 0
	for _, g := range goals {
		if g.Status == domain.GoalStatusAchieved {
			achieved++
		}
	}

	aiReq := ai.AnalyzePlayerRequest{
		PlayerName:     player.FirstName + " " + player.LastName,
		Assessments:    snapshots,
		AttendanceRate: attendanceRate,
		GoalsAchieved:  achieved,
		TotalGoals:     len(goals),
	}

	resp, err := s.provider.AnalyzePlayer(ctx, aiReq)
	if err != nil {
		return nil, err
	}

	promptJSON, _ := json.Marshal(aiReq)
	responseJSON, _ := json.Marshal(resp)
	rec := &domain.AIRecommendation{
		TargetType:  domain.AITargetPlayer,
		TargetID:    req.PlayerID,
		Prompt:      datatypes.JSON(promptJSON),
		Response:    datatypes.JSON(responseJSON),
		CreatedByID: coachID,
	}
	_ = s.aiRepo.Save(ctx, rec)

	return &dto.AIResponse{
		Analysis: &dto.AIPlayerAnalysis{
			Strengths:       resp.Strengths,
			Weaknesses:      resp.Weaknesses,
			Recommendations: resp.Recommendations,
			DevIndex:        resp.DevIndex,
			Summary:         resp.Summary,
		},
	}, nil
}

// GetMyInsights returns the latest saved AI analysis and progress summary for the current user.
func (s *AIService) GetMyInsights(ctx context.Context, userID string) (*dto.AIResponse, error) {
	player, err := s.playerRepo.FindByUserID(ctx, userID)
	if err != nil {
		return nil, err
	}

	recs, err := s.aiRepo.GetByTarget(ctx, domain.AITargetPlayer, player.ID)
	if err != nil {
		return nil, err
	}

	var result dto.AIResponse
	for _, rec := range recs {
		var analysis ai.AnalyzePlayerResponse
		if err := json.Unmarshal(rec.Response, &analysis); err == nil && len(analysis.Strengths) > 0 {
			result.Analysis = &dto.AIPlayerAnalysis{
				Strengths:       analysis.Strengths,
				Weaknesses:      analysis.Weaknesses,
				Recommendations: analysis.Recommendations,
				DevIndex:        analysis.DevIndex,
				Summary:         analysis.Summary,
			}
			continue
		}

		var progress ai.SummarizeProgressResponse
		if err := json.Unmarshal(rec.Response, &progress); err == nil && progress.Trend != "" {
			result.Progress = &dto.AIProgressSummary{
				Summary:    progress.Summary,
				Trend:      progress.Trend,
				Highlights: progress.Highlights,
				Alerts:     progress.Alerts,
			}
		}
	}

	if result.Analysis == nil && result.Progress == nil {
		return nil, domain.ErrNotFound
	}

	return &result, nil
}

// GenerateMyInsights generates fresh AI analysis and progress summary for the current user.
func (s *AIService) GenerateMyInsights(ctx context.Context, userID string) (*dto.AIResponse, error) {
	player, err := s.playerRepo.FindByUserID(ctx, userID)
	if err != nil {
		return nil, err
	}

	analysisResp, err := s.AnalyzePlayer(ctx, userID, dto.AnalyzePlayerRequest{PlayerID: player.ID})
	if err != nil {
		return nil, err
	}

	progressResp, err := s.SummarizeProgress(ctx, userID, dto.SummarizeProgressRequest{PlayerID: player.ID, PeriodDays: 30})
	if err != nil {
		return nil, err
	}

	return &dto.AIResponse{
		Analysis: analysisResp.Analysis,
		Progress: progressResp.Progress,
	}, nil
}

// SummarizeProgress summarizes a player's progress over a period.
func (s *AIService) SummarizeProgress(ctx context.Context, coachID string, req dto.SummarizeProgressRequest) (*dto.AIResponse, error) {
	player, err := s.playerRepo.FindByID(ctx, req.PlayerID)
	if err != nil {
		return nil, err
	}

	assessments, _, _ := s.assessmentRepo.FindByPlayer(ctx, req.PlayerID, 1, 20)
	present, total, _ := s.attendanceRepo.GetPlayerAttendanceStats(ctx, req.PlayerID)

	var attendanceRate float64
	if total > 0 {
		attendanceRate = float64(present) / float64(total) * 100
	}

	snapshots := make([]ai.AssessmentSnapshot, 0, len(assessments))
	for _, a := range assessments {
		avg := float64(a.Technical+a.Physical+a.Tactical+a.Discipline+a.Teamwork) / 5.0
		snapshots = append(snapshots, ai.AssessmentSnapshot{
			Date:       a.AssessedAt.Format(time.RFC3339),
			Technical:  a.Technical,
			Physical:   a.Physical,
			Tactical:   a.Tactical,
			Discipline: a.Discipline,
			Teamwork:   a.Teamwork,
			Average:    avg,
		})
	}

	aiReq := ai.SummarizeProgressRequest{
		PlayerName:     player.FirstName + " " + player.LastName,
		PeriodDays:     req.PeriodDays,
		Assessments:    snapshots,
		AttendanceRate: attendanceRate,
	}

	resp, err := s.provider.SummarizeProgress(ctx, aiReq)
	if err != nil {
		return nil, err
	}

	promptJSON, _ := json.Marshal(aiReq)
	responseJSON, _ := json.Marshal(resp)
	rec := &domain.AIRecommendation{
		TargetType:  domain.AITargetPlayer,
		TargetID:    req.PlayerID,
		Prompt:      datatypes.JSON(promptJSON),
		Response:    datatypes.JSON(responseJSON),
		CreatedByID: coachID,
	}
	_ = s.aiRepo.Save(ctx, rec)

	if coachID != "" {
		_ = s.notif.Notify(ctx, notifier.NotificationEvent{
			UserIDs: []string{coachID},
			Type:    domain.NotificationReportReady,
			Title:   "AI Progress Summary Ready",
			Body:    "A progress summary for " + player.FirstName + " " + player.LastName + " has been generated.",
		})
	}

	return &dto.AIResponse{
		Progress: &dto.AIProgressSummary{
			Summary:    resp.Summary,
			Trend:      resp.Trend,
			Highlights: resp.Highlights,
			Alerts:     resp.Alerts,
		},
	}, nil
}
