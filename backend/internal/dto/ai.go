package dto

// GenerateTrainingPlanRequest holds parameters for AI training plan generation.
type GenerateTrainingPlanRequest struct {
	TeamID     string   `json:"teamId"     validate:"required"`
	Goal       string   `json:"goal"       validate:"required"`
	Duration   int      `json:"duration"   validate:"required,min=30,max=180"`
	FocusAreas []string `json:"focusAreas"`
}

// RecommendExercisesRequest holds parameters for exercise recommendations.
type RecommendExercisesRequest struct {
	PlayerID  string `json:"playerId"  validate:"required"`
	WeakSkill string `json:"weakSkill" validate:"required,oneof=technical physical tactical discipline teamwork"`
}

// AnalyzePlayerRequest holds parameters to analyze a player.
type AnalyzePlayerRequest struct {
	PlayerID string `json:"playerId" validate:"required"`
}

// SummarizeProgressRequest holds parameters for progress summarization.
type SummarizeProgressRequest struct {
	PlayerID   string `json:"playerId"   validate:"required"`
	PeriodDays int    `json:"periodDays" validate:"required,min=7,max=365"`
}

// AIRecommendationItem is a single exercise recommendation.
type AIRecommendationItem struct {
	ID       string `json:"id,omitempty"`
	Name     string `json:"name"`
	Reason   string `json:"reason"`
	Priority int    `json:"priority"`
}

// BlockSuggestion is a suggested training block.
type BlockSuggestion struct {
	Kind        string   `json:"kind"`
	DurationMin int      `json:"durationMin"`
	Exercises   []string `json:"exercises"`
	Notes       string   `json:"notes"`
}

// TrainingPlanSuggestion is a suggested training plan.
type TrainingPlanSuggestion struct {
	Title     string            `json:"title"`
	Overview  string            `json:"overview"`
	Blocks    []BlockSuggestion `json:"blocks"`
	TotalLoad int               `json:"totalLoad"`
	Tips      []string          `json:"tips"`
}

// AIPlayerAnalysis holds the result of player analysis.
type AIPlayerAnalysis struct {
	Strengths       []string `json:"strengths"`
	Weaknesses      []string `json:"weaknesses"`
	Recommendations []string `json:"recommendations"`
	DevIndex        float64  `json:"devIndex"`
	Summary         string   `json:"summary"`
}

// AIProgressSummary holds the result of progress summarization.
type AIProgressSummary struct {
	Summary    string   `json:"summary"`
	Trend      string   `json:"trend"`
	Highlights []string `json:"highlights"`
	Alerts     []string `json:"alerts"`
}

// AIResponse is the generic AI endpoint response.
type AIResponse struct {
	Recommendations []AIRecommendationItem  `json:"recommendations,omitempty"`
	Plan            *TrainingPlanSuggestion `json:"plan,omitempty"`
	Analysis        *AIPlayerAnalysis       `json:"analysis,omitempty"`
	Progress        *AIProgressSummary      `json:"progress,omitempty"`
}
