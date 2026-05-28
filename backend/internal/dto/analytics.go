package dto

import "time"

// CoachDashboardResponse holds today's coaching summary.
type CoachDashboardResponse struct {
	TodaysSessions    []SessionResponse    `json:"todaysSessions"`
	AbsentToday       int                  `json:"absentToday"`
	PlayersAtRisk     []PlayerRiskItem     `json:"playersAtRisk"`
	UpcomingSessions  []SessionResponse    `json:"upcomingSessions"`
	RecentAssessments []AssessmentResponse `json:"recentAssessments"`
	TeamStats         []TeamStatItem       `json:"teamStats"`
}

// PlayerRiskItem identifies a player at risk.
type PlayerRiskItem struct {
	PlayerID       string  `json:"playerId"`
	PlayerName     string  `json:"playerName"`
	AttendanceRate float64 `json:"attendanceRate"`
	DevIndex       float64 `json:"devIndex"`
	RiskReason     string  `json:"riskReason"`
}

// TeamStatItem holds per-team summary stats.
type TeamStatItem struct {
	TeamID        string  `json:"teamId"`
	TeamName      string  `json:"teamName"`
	PlayerCount   int     `json:"playerCount"`
	AvgDevIndex   float64 `json:"avgDevIndex"`
	AvgAttendance float64 `json:"avgAttendance"`
}

// AttendanceDataPoint is a single data point in an attendance time series.
type AttendanceDataPoint struct {
	Date           time.Time `json:"date"`
	AttendanceRate float64   `json:"attendanceRate"`
	Present        int       `json:"present"`
	Total          int       `json:"total"`
}

// AssessmentDataPoint is a single data point in an assessment time series.
type AssessmentDataPoint struct {
	AssessedAt time.Time `json:"assessedAt"`
	Technical  float64   `json:"technical"`
	Physical   float64   `json:"physical"`
	Tactical   float64   `json:"tactical"`
	Discipline float64   `json:"discipline"`
	Teamwork   float64   `json:"teamwork"`
}

// WeeklyLoadPoint is training load for a specific week.
type WeeklyLoadPoint struct {
	WeekStart time.Time `json:"weekStart"`
	Load      float64   `json:"load"`
	Sessions  int       `json:"sessions"`
}

// TeamAnalyticsResponse holds team-level analytics.
type TeamAnalyticsResponse struct {
	TeamID             string                `json:"teamId"`
	AttendanceOverTime []AttendanceDataPoint `json:"attendanceOverTime"`
	AvgAssessments     AssessmentDataPoint   `json:"avgAssessments"`
	TrainingLoadByWeek []WeeklyLoadPoint     `json:"trainingLoadByWeek"`
}

// PlayerAnalyticsResponse holds player-level analytics.
type PlayerAnalyticsResponse struct {
	PlayerID           string                 `json:"playerId"`
	AssessmentTimeline []AssessmentDataPoint  `json:"assessmentTimeline"`
	AttendanceHistory  []AttendanceResponse   `json:"attendanceHistory"`
	GoalsProgress      []GoalProgressItem     `json:"goalsProgress"`
	DevIndex           float64                `json:"devIndex"`
	DevIndexHistory    []DevIndexHistoryPoint `json:"devIndexHistory"`
}

// GoalProgressItem mirrors frontend PlayerGoal for player analytics.
type GoalProgressItem struct {
	ID           string     `json:"id"`
	PlayerID     string     `json:"playerId"`
	Title        string     `json:"title"`
	Description  string     `json:"description,omitempty"`
	TargetMetric string     `json:"targetMetric,omitempty"`
	TargetValue  float64    `json:"targetValue,omitempty"`
	Deadline     *time.Time `json:"deadline,omitempty"`
	Status       string     `json:"status"`
	ProgressPct  float64    `json:"progressPct"`
}

// DevIndexHistoryPoint is one point on the player dev-index timeline chart.
type DevIndexHistoryPoint struct {
	Date  time.Time `json:"date"`
	Value float64   `json:"value"`
}

// PlayerAttendanceStat is per-player attendance stats.
type PlayerAttendanceStat struct {
	PlayerID   string  `json:"playerId"`
	PlayerName string  `json:"playerName"`
	Present    int     `json:"present"`
	Total      int     `json:"total"`
	Rate       float64 `json:"rate"`
}

// AttendanceAnalyticsResponse holds attendance analytics.
type AttendanceAnalyticsResponse struct {
	TeamID      string                 `json:"teamId"`
	OverallRate float64                `json:"overallRate"`
	Players     []PlayerAttendanceStat `json:"players"`
}

// TrainingLoadResponse holds training load analytics.
type TrainingLoadResponse struct {
	TeamID          string            `json:"teamId"`
	WeeklyLoad      []WeeklyLoadPoint `json:"weeklyLoad"`
	OverloadWarning bool              `json:"overloadWarning"`
	CurrentLoad     float64           `json:"currentLoad"`
	Threshold       float64           `json:"threshold"`
}

// PlayerFormResponse holds the computed form status for a player.
type PlayerFormResponse struct {
	Form        string `json:"form"`        // excellent, rising, stable, falling, rusty
	Label       string `json:"label"`       // human-readable label key
	Trend       string `json:"trend"`       // emoji arrow
	AvgScore    float64 `json:"avgScore"`   // average assessment (1-10)
	Attendance  float64 `json:"attendance"` // attendance rate %
	MatchCount  int     `json:"matchCount"` // matches in last 14 days
}
