package ai

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"
)

const (
	deepseekBaseURL = "https://api.deepseek.com/v1"
	deepseekModel   = "deepseek-chat"
	defaultTimeout  = 30 * time.Second
)

// DeepSeekProvider implements Provider using DeepSeek API.
// DeepSeek offers very competitive pricing (~$0.14/M input tokens, ~$0.28/M output tokens).
type DeepSeekProvider struct {
	apiKey string
	client *http.Client
}

// NewDeepSeekProvider creates a new DeepSeekProvider.
func NewDeepSeekProvider(apiKey string) *DeepSeekProvider {
	return &DeepSeekProvider{
		apiKey: apiKey,
		client: &http.Client{Timeout: defaultTimeout},
	}
}

// deepSeekRequest is the request body for DeepSeek API.
type deepSeekRequest struct {
	Model       string              `json:"model"`
	Messages    []deepSeekMessage   `json:"messages"`
	Temperature float64             `json:"temperature"`
	MaxTokens   int                 `json:"max_tokens"`
}

type deepSeekMessage struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

// deepSeekResponse is the response from DeepSeek API.
type deepSeekResponse struct {
	Choices []struct {
		Message deepSeekMessage `json:"message"`
	} `json:"choices"`
	Error *struct {
		Message string `json:"message"`
	} `json:"error"`
}

func (d *DeepSeekProvider) call(ctx context.Context, systemPrompt, userPrompt string) (string, error) {
	reqBody := deepSeekRequest{
		Model: deepseekModel,
		Messages: []deepSeekMessage{
			{Role: "system", Content: systemPrompt},
			{Role: "user", Content: userPrompt},
		},
		Temperature: 0.5,
		MaxTokens:   2000,
	}

	jsonBody, err := json.Marshal(reqBody)
	if err != nil {
		return "", fmt.Errorf("marshal request: %w", err)
	}

	req, err := http.NewRequestWithContext(ctx, "POST", deepseekBaseURL+"/chat/completions", bytes.NewReader(jsonBody))
	if err != nil {
		return "", fmt.Errorf("create request: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+d.apiKey)

	resp, err := d.client.Do(req)
	if err != nil {
		return "", fmt.Errorf("deepseek api call: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", fmt.Errorf("read response: %w", err)
	}

	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("deepseek api error (status %d): %s", resp.StatusCode, string(body))
	}

	var result deepSeekResponse
	if err := json.Unmarshal(body, &result); err != nil {
		return "", fmt.Errorf("unmarshal response: %w", err)
	}

	if result.Error != nil {
		return "", fmt.Errorf("deepseek api error: %s", result.Error.Message)
	}

	if len(result.Choices) == 0 {
		return "", fmt.Errorf("deepseek api returned no choices")
	}

	return result.Choices[0].Message.Content, nil
}

// GenerateTrainingPlan generates a training plan using DeepSeek.
func (d *DeepSeekProvider) GenerateTrainingPlan(ctx context.Context, req TrainingPlanRequest) (*TrainingPlanResponse, error) {
	systemPrompt := `You are a football coaching assistant. Generate a training session plan in JSON format.
Respond ONLY in Russian language with a valid JSON object matching this structure:
{
  "title": "string",
  "overview": "string",
  "blocks": [
    {"kind": "warmup|main|game|cooldown", "durationMin": number, "exercises": ["string"], "notes": "string"}
  ],
  "totalLoad": number,
  "tips": ["string"]
}
Keep blocks balanced: warmup 10-15min, main 25-35min, game 15-20min, cooldown 5-10min.`

	userPrompt := fmt.Sprintf("Goal: %s\nDuration: %d minutes\nFocus areas: %v\nTeam size: %d",
		req.Goal, req.DurationMin, req.FocusAreas, req.TeamSize)
	if len(req.RecentSessions) > 0 {
		userPrompt += fmt.Sprintf("\nRecent sessions: %v", req.RecentSessions)
	}

	content, err := d.call(ctx, systemPrompt, userPrompt)
	if err != nil {
		return nil, err
	}

	var resp TrainingPlanResponse
	if err := json.Unmarshal([]byte(content), &resp); err != nil {
		return nil, fmt.Errorf("parse training plan response: %w", err)
	}

	// Validate totalLoad
	calculatedLoad := 0
	for _, b := range resp.Blocks {
		calculatedLoad += b.DurationMin
	}
	if calculatedLoad > 0 {
		resp.TotalLoad = calculatedLoad
	}

	return &resp, nil
}

// RecommendExercises recommends exercises using DeepSeek.
func (d *DeepSeekProvider) RecommendExercises(ctx context.Context, req RecommendExercisesRequest) (*RecommendExercisesResponse, error) {
	systemPrompt := `You are a football coaching assistant. Recommend exercises to improve a specific skill weakness.
Respond ONLY in Russian language with a valid JSON object:
{
  "exercises": [
    {"id": "string", "name": "string", "reason": "string", "priority": number}
  ]
}
Provide 3-5 recommendations ordered by priority (1 = highest).`

	exerciseList := ""
	for _, ex := range req.AvailableExercises {
		exerciseList += fmt.Sprintf("- %s (ID: %s, Category: %s, Tags: %v)\n", ex.Name, ex.ID, ex.Category, ex.Tags)
	}

	userPrompt := fmt.Sprintf("Player: %s\nWeak skill: %s\nCurrent level: %d/10\n\nAvailable exercises:\n%s",
		req.PlayerName, req.WeakSkill, req.CurrentLevel, exerciseList)

	content, err := d.call(ctx, systemPrompt, userPrompt)
	if err != nil {
		return nil, err
	}

	var resp RecommendExercisesResponse
	if err := json.Unmarshal([]byte(content), &resp); err != nil {
		return nil, fmt.Errorf("parse exercises response: %w", err)
	}

	return &resp, nil
}

// AnalyzePlayer analyzes a player using DeepSeek.
func (d *DeepSeekProvider) AnalyzePlayer(ctx context.Context, req AnalyzePlayerRequest) (*AnalyzePlayerResponse, error) {
	systemPrompt := `You are a football coaching analyst. Analyze player performance data and provide insights.
Respond ONLY with a valid JSON object:
{
  "strengths": ["string"],
  "weaknesses": ["string"],
  "recommendations": ["string"],
  "devIndex": number,
  "summary": "string"
}
DevIndex should be 0-100 based on overall performance. Be specific and actionable. Respond in Russian language.`

	assessmentData := ""
	for _, a := range req.Assessments {
		assessmentData += fmt.Sprintf("- %s: Technical %d, Physical %d, Tactical %d, Discipline %d, Teamwork %d (Avg: %.1f)\n",
			a.Date, a.Technical, a.Physical, a.Tactical, a.Discipline, a.Teamwork, a.Average)
	}

	userPrompt := fmt.Sprintf("Player: %s\nAttendance rate: %.1f%%\nGoals achieved: %d/%d\n\nAssessment history:\n%s",
		req.PlayerName, req.AttendanceRate, req.GoalsAchieved, req.TotalGoals, assessmentData)

	content, err := d.call(ctx, systemPrompt, userPrompt)
	if err != nil {
		return nil, err
	}

	var resp AnalyzePlayerResponse
	if err := json.Unmarshal([]byte(content), &resp); err != nil {
		return nil, fmt.Errorf("parse analysis response: %w", err)
	}

	return &resp, nil
}

// SummarizeProgress summarizes player progress using DeepSeek.
func (d *DeepSeekProvider) SummarizeProgress(ctx context.Context, req SummarizeProgressRequest) (*SummarizeProgressResponse, error) {
	systemPrompt := `You are a football coaching analyst. Summarize player progress over a period.
Respond ONLY with a valid JSON object:
{
  "summary": "string",
  "trend": "improving|stable|declining",
  "highlights": ["string"],
  "alerts": ["string"]
}
Be objective, specific, and provide actionable insights. Respond in Russian language.`

	assessmentData := ""
	for _, a := range req.Assessments {
		assessmentData += fmt.Sprintf("- %s: Technical %d, Physical %d, Tactical %d, Discipline %d, Teamwork %d (Avg: %.1f)\n",
			a.Date, a.Technical, a.Physical, a.Tactical, a.Discipline, a.Teamwork, a.Average)
	}

	userPrompt := fmt.Sprintf("Player: %s\nPeriod: %d days\nAttendance rate: %.1f%%\n\nAssessment history:\n%s",
		req.PlayerName, req.PeriodDays, req.AttendanceRate, assessmentData)

	content, err := d.call(ctx, systemPrompt, userPrompt)
	if err != nil {
		return nil, err
	}

	var resp SummarizeProgressResponse
	if err := json.Unmarshal([]byte(content), &resp); err != nil {
		return nil, fmt.Errorf("parse progress response: %w", err)
	}

	return &resp, nil
}
