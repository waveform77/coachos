package ai

import "context"

// TrainingPlanRequest contains parameters for generating a training session plan.
type TrainingPlanRequest struct {
	Goal           string   `json:"goal"`
	TeamSize       int      `json:"teamSize"`
	DurationMin    int      `json:"durationMin"`
	FocusAreas     []string `json:"focusAreas"`
	RecentSessions []string `json:"recentSessions"`
}

// BlockSuggestion is a suggested block within a training plan.
type BlockSuggestion struct {
	Kind        string   `json:"kind"`
	DurationMin int      `json:"durationMin"`
	Exercises   []string `json:"exercises"`
	Notes       string   `json:"notes"`
}

// TrainingPlanResponse is the AI-generated training plan.
type TrainingPlanResponse struct {
	Title     string            `json:"title"`
	Overview  string            `json:"overview"`
	Blocks    []BlockSuggestion `json:"blocks"`
	TotalLoad int               `json:"totalLoad"`
	Tips      []string          `json:"tips"`
}

// ExerciseInfo is a summary of an exercise for AI context.
type ExerciseInfo struct {
	ID       string `json:"id"`
	Name     string `json:"name"`
	Category string `json:"category"`
	Tags     []string `json:"tags"`
}

// RecommendExercisesRequest holds the context for exercise recommendation.
type RecommendExercisesRequest struct {
	PlayerName         string         `json:"playerName"`
	WeakSkill          string         `json:"weakSkill"`
	CurrentLevel       int            `json:"currentLevel"`
	AvailableExercises []ExerciseInfo `json:"availableExercises"`
}

// ExerciseRecommendation is a single recommended exercise with a reason.
type ExerciseRecommendation struct {
	ID       string `json:"id"`
	Name     string `json:"name"`
	Reason   string `json:"reason"`
	Priority int    `json:"priority"`
}

// RecommendExercisesResponse holds recommended exercises.
type RecommendExercisesResponse struct {
	Exercises []ExerciseRecommendation `json:"exercises"`
}

// AssessmentSnapshot is a point-in-time assessment for AI analysis.
type AssessmentSnapshot struct {
	Date       string  `json:"date"`
	Technical  int     `json:"technical"`
	Physical   int     `json:"physical"`
	Tactical   int     `json:"tactical"`
	Discipline int     `json:"discipline"`
	Teamwork   int     `json:"teamwork"`
	Average    float64 `json:"average"`
}

// AnalyzePlayerRequest holds player context for analysis.
type AnalyzePlayerRequest struct {
	PlayerName     string               `json:"playerName"`
	Assessments    []AssessmentSnapshot `json:"assessments"`
	AttendanceRate float64              `json:"attendanceRate"`
	GoalsAchieved  int                  `json:"goalsAchieved"`
	TotalGoals     int                  `json:"totalGoals"`
}

// AnalyzePlayerResponse is the AI analysis of a player.
type AnalyzePlayerResponse struct {
	Strengths       []string `json:"strengths"`
	Weaknesses      []string `json:"weaknesses"`
	Recommendations []string `json:"recommendations"`
	DevIndex        float64  `json:"devIndex"`
	Summary         string   `json:"summary"`
}

// SummarizeProgressRequest holds context for progress summarization.
type SummarizeProgressRequest struct {
	PlayerName     string               `json:"playerName"`
	PeriodDays     int                  `json:"periodDays"`
	Assessments    []AssessmentSnapshot `json:"assessments"`
	AttendanceRate float64              `json:"attendanceRate"`
}

// SummarizeProgressResponse is the AI progress summary.
type SummarizeProgressResponse struct {
	Summary    string   `json:"summary"`
	Trend      string   `json:"trend"` // "improving", "stable", "declining"
	Highlights []string `json:"highlights"`
	Alerts     []string `json:"alerts"`
}

// Provider is the interface for AI functionality.
// Implementations: MockProvider, OpenAIProvider (future), AnthropicProvider (future).
type Provider interface {
	GenerateTrainingPlan(ctx context.Context, req TrainingPlanRequest) (*TrainingPlanResponse, error)
	RecommendExercises(ctx context.Context, req RecommendExercisesRequest) (*RecommendExercisesResponse, error)
	AnalyzePlayer(ctx context.Context, req AnalyzePlayerRequest) (*AnalyzePlayerResponse, error)
	SummarizeProgress(ctx context.Context, req SummarizeProgressRequest) (*SummarizeProgressResponse, error)
}
