package ai

import (
	"context"
	"fmt"
	"math"
	"strings"
)

// MockProvider implements Provider with rule-based logic (no external API calls).
type MockProvider struct{}

// NewMockProvider creates a new MockProvider.
func NewMockProvider() *MockProvider {
	return &MockProvider{}
}

func (m *MockProvider) GenerateTrainingPlan(_ context.Context, req TrainingPlanRequest) (*TrainingPlanResponse, error) {
	goal := strings.ToLower(req.Goal)

	var title, overview string
	var blocks []BlockSuggestion
	var tips []string

	switch {
	case strings.Contains(goal, "pressing") || strings.Contains(goal, "press"):
		title = "High-Pressing Training Plan"
		overview = "Focus on intensive pressing triggers, recovery shape, and coordinated team press."
		blocks = []BlockSuggestion{
			{Kind: "warmup", DurationMin: 10, Exercises: []string{"Dynamic stretching", "Activation runs"}, Notes: "Light intensity, prepare for high demands"},
			{Kind: "main", DurationMin: 25, Exercises: []string{"Press triggers drill", "4v4 pressing game", "Recovery shape"}, Notes: "Medium intensity, focus on coordination"},
			{Kind: "game", DurationMin: 20, Exercises: []string{"8v8 pressing match"}, Notes: "Apply pressing in game context"},
			{Kind: "cooldown", DurationMin: 10, Exercises: []string{"Static stretching", "Breathing exercises"}, Notes: "Recovery focus"},
		}
		tips = []string{"Use verbal cues for press triggers", "Reward successful press recoveries", "Film sessions for video analysis"}

	case strings.Contains(goal, "passing") || strings.Contains(goal, "possession"):
		title = "Possession & Passing Plan"
		overview = "Build short and long passing accuracy, support movement, and positional play."
		blocks = []BlockSuggestion{
			{Kind: "warmup", DurationMin: 10, Exercises: []string{"Rondos 4v1", "Passing patterns"}, Notes: "Ball retention focus"},
			{Kind: "main", DurationMin: 30, Exercises: []string{"Combination passing", "Third-man runs", "Transition drill"}, Notes: "Technical focus"},
			{Kind: "game", DurationMin: 20, Exercises: []string{"Possession game 7v7"}, Notes: "Possession rules applied"},
			{Kind: "cooldown", DurationMin: 5, Exercises: []string{"Light jogging", "Static stretch"}, Notes: ""},
		}
		tips = []string{"Reward quality passes, not just quantity", "Emphasize scanning before receiving"}

	case strings.Contains(goal, "endurance") || strings.Contains(goal, "fitness"):
		title = "Endurance & Conditioning Plan"
		overview = "Improve aerobic base, repeat-sprint ability, and recovery between efforts."
		blocks = []BlockSuggestion{
			{Kind: "warmup", DurationMin: 12, Exercises: []string{"Progressive runs", "Hip mobility"}, Notes: "Gradual heart rate increase"},
			{Kind: "main", DurationMin: 35, Exercises: []string{"Interval runs 6x200m", "Shuttle runs", "Aerobic circuits"}, Notes: "High load – monitor fatigue"},
			{Kind: "cooldown", DurationMin: 8, Exercises: []string{"Slow jog", "Deep stretch", "Breathing"}, Notes: "Critical for recovery"},
		}
		tips = []string{"Monitor heart rate zones", "Hydrate adequately", "Rest days are essential"}

	case strings.Contains(goal, "finishing") || strings.Contains(goal, "shooting"):
		title = "Finishing & Shooting Plan"
		overview = "Develop composure in front of goal, shooting technique, and decision-making in the box."
		blocks = []BlockSuggestion{
			{Kind: "warmup", DurationMin: 10, Exercises: []string{"Ball juggling", "Shooting warm-up"}, Notes: "Build touch and feel"},
			{Kind: "main", DurationMin: 30, Exercises: []string{"1v1 vs goalkeeper", "Crossing & finishing", "Combination shooting"}, Notes: "Repetition is key"},
			{Kind: "game", DurationMin: 20, Exercises: []string{"4-goal game", "Small-sided goals"}, Notes: "Many shooting opportunities"},
			{Kind: "cooldown", DurationMin: 5, Exercises: []string{"Light stretch"}, Notes: ""},
		}
		tips = []string{"Quality over quantity", "Visualize before shooting", "Vary angles and distances"}

	default:
		title = "General Training Plan"
		overview = "Balanced session covering technical skills, physical conditioning, and team play."
		blocks = []BlockSuggestion{
			{Kind: "warmup", DurationMin: 10, Exercises: []string{"Dynamic warm-up", "Activation"}, Notes: ""},
			{Kind: "main", DurationMin: 30, Exercises: []string{"Technical drills", "Tactical patterns"}, Notes: "Mixed focus"},
			{Kind: "game", DurationMin: 20, Exercises: []string{"Match play"}, Notes: "Apply learned skills"},
			{Kind: "cooldown", DurationMin: 5, Exercises: []string{"Cool-down stretch"}, Notes: ""},
		}
		tips = []string{"Keep players engaged", "Provide individual feedback"}
	}

	totalLoad := 0
	for _, b := range blocks {
		totalLoad += b.DurationMin
	}

	return &TrainingPlanResponse{
		Title:     title,
		Overview:  overview,
		Blocks:    blocks,
		TotalLoad: totalLoad,
		Tips:      tips,
	}, nil
}

func (m *MockProvider) RecommendExercises(_ context.Context, req RecommendExercisesRequest) (*RecommendExercisesResponse, error) {
	skillToCategories := map[string][]string{
		"technical":  {"technique"},
		"physical":   {"physical"},
		"tactical":   {"tactics"},
		"discipline": {"tactics", "coordination"},
		"teamwork":   {"tactics", "coordination"},
	}

	targetCategories := skillToCategories[strings.ToLower(req.WeakSkill)]
	if len(targetCategories) == 0 {
		targetCategories = []string{"technique", "tactics"}
	}

	var recommendations []ExerciseRecommendation
	priority := 1
	for _, ex := range req.AvailableExercises {
		if priority > 3 {
			break
		}
		for _, cat := range targetCategories {
			if strings.EqualFold(ex.Category, cat) {
				recommendations = append(recommendations, ExerciseRecommendation{
					ID:       ex.ID,
					Name:     ex.Name,
					Reason:   fmt.Sprintf("Targets %s weakness through %s training", req.WeakSkill, cat),
					Priority: priority,
				})
				priority++
				break
			}
		}
	}

	if len(recommendations) == 0 && len(req.AvailableExercises) > 0 {
		for i, ex := range req.AvailableExercises {
			if i >= 3 {
				break
			}
			recommendations = append(recommendations, ExerciseRecommendation{
				ID:       ex.ID,
				Name:     ex.Name,
				Reason:   fmt.Sprintf("General improvement recommendation for %s", req.WeakSkill),
				Priority: i + 1,
			})
		}
	}

	return &RecommendExercisesResponse{Exercises: recommendations}, nil
}

func (m *MockProvider) AnalyzePlayer(_ context.Context, req AnalyzePlayerRequest) (*AnalyzePlayerResponse, error) {
	if len(req.Assessments) == 0 {
		return &AnalyzePlayerResponse{
			Summary: fmt.Sprintf("No assessment data available for %s.", req.PlayerName),
		}, nil
	}

	// Average all assessments
	var sumT, sumP, sumTac, sumD, sumTw float64
	for _, a := range req.Assessments {
		sumT += float64(a.Technical)
		sumP += float64(a.Physical)
		sumTac += float64(a.Tactical)
		sumD += float64(a.Discipline)
		sumTw += float64(a.Teamwork)
	}
	n := float64(len(req.Assessments))
	avgT := sumT / n
	avgP := sumP / n
	avgTac := sumTac / n
	avgD := sumD / n
	avgTw := sumTw / n

	threshold := 6.5
	var strengths, weaknesses, recommendations []string

	scores := map[string]float64{
		"technical":  avgT,
		"physical":   avgP,
		"tactical":   avgTac,
		"discipline": avgD,
		"teamwork":   avgTw,
	}

	for skill, score := range scores {
		if score >= threshold {
			strengths = append(strengths, fmt.Sprintf("%s (%.1f/10)", skill, score))
		} else {
			weaknesses = append(weaknesses, fmt.Sprintf("%s (%.1f/10)", skill, score))
			recommendations = append(recommendations, fmt.Sprintf("Increase %s training frequency", skill))
		}
	}

	if req.AttendanceRate < 60 {
		weaknesses = append(weaknesses, fmt.Sprintf("attendance (%.0f%%)", req.AttendanceRate))
		recommendations = append(recommendations, "Improve session attendance to maximise development")
	}

	// PDI 0–100: attendance%×0.20 + avgAssessment(1–10)×10×0.50 + goalsAchieved%×0.30
	avgAssessment := (avgT + avgP + avgTac + avgD + avgTw) / 5.0
	var goalAchievedPct float64
	if req.TotalGoals > 0 {
		goalAchievedPct = float64(req.GoalsAchieved) / float64(req.TotalGoals) * 100
	}
	devIndex := math.Round((req.AttendanceRate*0.20+avgAssessment*10*0.50+goalAchievedPct*0.30)*100) / 100

	summary := fmt.Sprintf(
		"%s shows %s in %d areas. Attendance rate: %.0f%%. Player Development Index: %.1f/100.",
		req.PlayerName,
		map[bool]string{true: "strength", false: "weakness"}[len(strengths) > len(weaknesses)],
		len(req.Assessments),
		req.AttendanceRate,
		devIndex,
	)

	return &AnalyzePlayerResponse{
		Strengths:       strengths,
		Weaknesses:      weaknesses,
		Recommendations: recommendations,
		DevIndex:        devIndex,
		Summary:         summary,
	}, nil
}

func (m *MockProvider) SummarizeProgress(_ context.Context, req SummarizeProgressRequest) (*SummarizeProgressResponse, error) {
	if len(req.Assessments) < 2 {
		return &SummarizeProgressResponse{
			Summary: fmt.Sprintf("Insufficient data to summarize %s's progress over %d days.", req.PlayerName, req.PeriodDays),
			Trend:   "stable",
		}, nil
	}

	first := req.Assessments[0]
	last := req.Assessments[len(req.Assessments)-1]

	avgFirst := float64(first.Technical+first.Physical+first.Tactical+first.Discipline+first.Teamwork) / 5.0
	avgLast := float64(last.Technical+last.Physical+last.Tactical+last.Discipline+last.Teamwork) / 5.0

	diff := avgLast - avgFirst
	var trend string
	switch {
	case diff > 0.5:
		trend = "improving"
	case diff < -0.5:
		trend = "declining"
	default:
		trend = "stable"
	}

	var highlights, alerts []string

	if diff > 0.5 {
		highlights = append(highlights, fmt.Sprintf("Overall score improved by %.1f points", diff))
	}
	if req.AttendanceRate >= 80 {
		highlights = append(highlights, fmt.Sprintf("Excellent attendance: %.0f%%", req.AttendanceRate))
	}
	if req.AttendanceRate < 60 {
		alerts = append(alerts, fmt.Sprintf("Low attendance rate: %.0f%% – at risk of development stagnation", req.AttendanceRate))
	}
	if diff < -0.5 {
		alerts = append(alerts, "Assessment scores have declined – consider an individual development plan")
	}

	summary := fmt.Sprintf(
		"Over the past %d days, %s's performance trend is %s. Average score moved from %.1f to %.1f. Attendance: %.0f%%.",
		req.PeriodDays, req.PlayerName, trend, avgFirst, avgLast, req.AttendanceRate,
	)

	return &SummarizeProgressResponse{
		Summary:    summary,
		Trend:      trend,
		Highlights: highlights,
		Alerts:     alerts,
	}, nil
}
