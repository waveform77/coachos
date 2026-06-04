package dto

import "time"

// CreateSessionRequest holds data to create a training session.
type CreateSessionRequest struct {
	TeamID      string    `json:"teamId"      validate:"required"`
	ScheduledAt time.Time `json:"scheduledAt" validate:"required"`
	DurationMin int       `json:"durationMin"`
	Location    string    `json:"location"`
	Intensity   string    `json:"intensity"   validate:"omitempty,oneof=low medium high"`
	Focus       []string  `json:"focus"`
	Notes       string    `json:"notes"`
}

// UpdateSessionRequest holds data to update a training session.
type UpdateSessionRequest struct {
	ScheduledAt *time.Time `json:"scheduledAt"`
	DurationMin int        `json:"durationMin"`
	Location    string     `json:"location"`
	Status      string     `json:"status"     validate:"omitempty,oneof=planned in_progress completed cancelled"`
	Intensity   string     `json:"intensity"  validate:"omitempty,oneof=low medium high"`
	Focus       []string   `json:"focus"`
	Notes       string     `json:"notes"`
}

// SessionResponse is the public representation of a training session.
type SessionResponse struct {
	ID          string    `json:"id"`
	TeamID      string    `json:"teamId"`
	CoachID     string    `json:"coachId"`
	ScheduledAt time.Time `json:"scheduledAt"`
	DurationMin int       `json:"durationMin,omitempty"`
	Location    string    `json:"location,omitempty"`
	Status      string    `json:"status"`
	Intensity   string    `json:"intensity"`
	Focus       []string  `json:"focus,omitempty"`
	Notes       string    `json:"notes,omitempty"`
	CreatedAt   time.Time `json:"createdAt"`
}

// SessionExerciseResponse is an exercise within a block.
type SessionExerciseResponse struct {
	ID                string           `json:"id"`
	ExerciseID        string           `json:"exerciseId"`
	Exercise          ExerciseResponse `json:"exercise"`
	OrderIndex        int              `json:"orderIndex"`
	DurationMin       int              `json:"durationMin,omitempty"`
	Sets              int              `json:"sets,omitempty"`
	Reps              int              `json:"reps,omitempty"`
	IntensityOverride string           `json:"intensityOverride,omitempty"`
}

// TrainingBlockResponse is a block within a session.
type TrainingBlockResponse struct {
	ID          string                    `json:"id"`
	Kind        string                    `json:"kind"`
	OrderIndex  int                       `json:"orderIndex"`
	DurationMin int                       `json:"durationMin,omitempty"`
	Notes       string                    `json:"notes,omitempty"`
	Exercises   []SessionExerciseResponse `json:"exercises"`
}

// SessionDetailResponse includes blocks and exercises.
type SessionDetailResponse struct {
	SessionResponse
	Blocks     []TrainingBlockResponse `json:"blocks"`
	Attendance []AttendanceResponse    `json:"attendance,omitempty"`
}

// CreateBlockRequest holds data to add a block to a session.
type CreateBlockRequest struct {
	Kind        string `json:"kind"       validate:"required,oneof=warmup main game cooldown"`
	OrderIndex  int    `json:"orderIndex"`
	DurationMin int    `json:"durationMin"`
	Notes       string `json:"notes"`
}

// AddExerciseToBlockRequest holds data to add an exercise to a block.
type AddExerciseToBlockRequest struct {
	ExerciseID        string `json:"exerciseId"        validate:"required"`
	OrderIndex        int    `json:"orderIndex"`
	DurationMin       int    `json:"durationMin"`
	Sets              int    `json:"sets"`
	Reps              int    `json:"reps"`
	IntensityOverride string `json:"intensityOverride"`
}

// MarkAttendanceRequest holds attendance records for a session.
type MarkAttendanceRequest struct {
	Records []AttendanceEntryRequest `json:"records" validate:"required,min=1"`
}

// AttendanceEntryRequest is a single attendance entry.
type AttendanceEntryRequest struct {
	PlayerID string `json:"playerId" validate:"required"`
	Status   string `json:"status"   validate:"required,oneof=present absent late excused injured"`
	Reason   string `json:"reason"`
}

// AttendanceResponse is the public representation of an attendance record.
type AttendanceResponse struct {
	ID        string    `json:"id"`
	SessionID string    `json:"sessionId"`
	PlayerID  string    `json:"playerId"`
	FirstName string    `json:"firstName"`
	LastName  string    `json:"lastName"`
	Status    string    `json:"status"`
	Reason    string    `json:"reason,omitempty"`
	MarkedAt  time.Time `json:"markedAt"`
}

// SaveBlockExerciseItem holds a single exercise inside a block for batch save.
type SaveBlockExerciseItem struct {
	ExerciseID        string `json:"exerciseId" validate:"required"`
	OrderIndex        int    `json:"orderIndex"`
	DurationMin       int    `json:"durationMin"`
	Sets              int    `json:"sets"`
	Reps              int    `json:"reps"`
	IntensityOverride string `json:"intensityOverride"`
}

// SaveBlockItem holds a single block for batch save.
type SaveBlockItem struct {
	Kind        string                  `json:"kind" validate:"required,oneof=warmup main game cooldown"`
	OrderIndex  int                     `json:"orderIndex"`
	DurationMin int                     `json:"durationMin"`
	Notes       string                  `json:"notes"`
	Exercises   []SaveBlockExerciseItem `json:"exercises"`
}

// SaveBlocksRequest holds the full block structure to replace existing blocks.
type SaveBlocksRequest struct {
	Blocks []SaveBlockItem `json:"blocks" validate:"required,dive"`
}
