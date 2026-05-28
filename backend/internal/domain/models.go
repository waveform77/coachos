package domain

import (
	"time"

	"github.com/lib/pq"
	"gorm.io/datatypes"
	"gorm.io/gorm"

	"github.com/coachos/backend/internal/pkg/idgen"
)

// ── Enum Types ────────────────────────────────────────────────────────────────

type Role string

const (
	RoleAdmin   Role = "admin"
	RoleCoach   Role = "coach"
	RolePlayer  Role = "player"
	RoleParent  Role = "parent"
	RoleAnalyst Role = "analyst"
)

type AgeGroup string

const (
	AgeGroupU7     AgeGroup = "U7"
	AgeGroupU8     AgeGroup = "U8"
	AgeGroupU9     AgeGroup = "U9"
	AgeGroupU10    AgeGroup = "U10"
	AgeGroupU11    AgeGroup = "U11"
	AgeGroupU12    AgeGroup = "U12"
	AgeGroupU13    AgeGroup = "U13"
	AgeGroupU14    AgeGroup = "U14"
	AgeGroupU15    AgeGroup = "U15"
	AgeGroupU16    AgeGroup = "U16"
	AgeGroupU17    AgeGroup = "U17"
	AgeGroupU18    AgeGroup = "U18"
	AgeGroupU19    AgeGroup = "U19"
	AgeGroupU21    AgeGroup = "U21"
	AgeGroupSenior AgeGroup = "Senior"
)

type Position string

const (
	PositionGoalkeeper Position = "goalkeeper"
	PositionDefender   Position = "defender"
	PositionMidfielder Position = "midfielder"
	PositionForward    Position = "forward"
	PositionUniversal  Position = "universal"
)

type DominantFoot string

const (
	DominantFootLeft  DominantFoot = "left"
	DominantFootRight DominantFoot = "right"
	DominantFootBoth  DominantFoot = "both"
)

type SessionStatus string

const (
	SessionStatusPlanned    SessionStatus = "planned"
	SessionStatusInProgress SessionStatus = "in_progress"
	SessionStatusCompleted  SessionStatus = "completed"
	SessionStatusCancelled  SessionStatus = "cancelled"
)

type SessionIntensity string

const (
	SessionIntensityLow    SessionIntensity = "low"
	SessionIntensityMedium SessionIntensity = "medium"
	SessionIntensityHigh   SessionIntensity = "high"
)

type BlockKind string

const (
	BlockKindWarmup  BlockKind = "warmup"
	BlockKindMain    BlockKind = "main"
	BlockKindGame    BlockKind = "game"
	BlockKindCooldown BlockKind = "cooldown"
)

type ExerciseCategory string

const (
	ExerciseCategoryTechnique     ExerciseCategory = "technique"
	ExerciseCategoryTactics       ExerciseCategory = "tactics"
	ExerciseCategoryPhysical      ExerciseCategory = "physical"
	ExerciseCategoryCoordination  ExerciseCategory = "coordination"
	ExerciseCategoryGoalkeeping   ExerciseCategory = "goalkeeping"
	ExerciseCategoryWarmup        ExerciseCategory = "warmup"
	ExerciseCategoryCooldown      ExerciseCategory = "cooldown"
)

type AttendanceStatus string

const (
	AttendanceStatusPresent  AttendanceStatus = "present"
	AttendanceStatusAbsent   AttendanceStatus = "absent"
	AttendanceStatusLate     AttendanceStatus = "late"
	AttendanceStatusExcused  AttendanceStatus = "excused"
	AttendanceStatusInjured  AttendanceStatus = "injured"
)

type MatchStatus string

const (
	MatchStatusScheduled  MatchStatus = "scheduled"
	MatchStatusInProgress MatchStatus = "in_progress"
	MatchStatusCompleted  MatchStatus = "completed"
	MatchStatusCancelled  MatchStatus = "cancelled"
	MatchStatusPostponed  MatchStatus = "postponed"
)

type MatchEventType string

const (
	MatchEventGoal      MatchEventType = "goal"
	MatchEventAssist    MatchEventType = "assist"
	MatchEventYellow    MatchEventType = "yellow_card"
	MatchEventRed       MatchEventType = "red_card"
	MatchEventSubIn     MatchEventType = "sub_in"
	MatchEventSubOut    MatchEventType = "sub_out"
)

type LineupRole string

const (
	LineupRoleStarter    LineupRole = "starter"
	LineupRoleSubstitute LineupRole = "substitute"
)

type GoalStatus string

const (
	GoalStatusActive    GoalStatus = "active"
	GoalStatusAchieved  GoalStatus = "achieved"
	GoalStatusPaused    GoalStatus = "paused"
	GoalStatusCancelled GoalStatus = "cancelled"
)

type NotificationType string

const (
	NotificationSessionCreated   NotificationType = "session_created"
	NotificationSessionUpdated   NotificationType = "session_updated"
	NotificationSessionCancelled NotificationType = "session_cancelled"
	NotificationAttendanceMarked NotificationType = "attendance_marked"
	NotificationAssessmentAdded  NotificationType = "assessment_added"
	NotificationMatchScheduled   NotificationType = "match_scheduled"
	NotificationMatchResult      NotificationType = "match_result"
	NotificationReportReady      NotificationType = "report_ready"
	NotificationGeneral          NotificationType = "general"
)

type ReportType string

const (
	ReportTypePlayer     ReportType = "player"
	ReportTypeTeam       ReportType = "team"
	ReportTypeAttendance ReportType = "attendance"
	ReportTypeProgress   ReportType = "progress"
)

type AITargetType string

const (
	AITargetPlayer  AITargetType = "player"
	AITargetTeam    AITargetType = "team"
	AITargetSession AITargetType = "session"
)

type LicenseLevel string

const (
	LicenseLevelNone       LicenseLevel = "none"
	LicenseLevelGrassroots LicenseLevel = "grassroots"
	LicenseLevelC          LicenseLevel = "c"
	LicenseLevelB          LicenseLevel = "b"
	LicenseLevelA          LicenseLevel = "a"
	LicenseLevelPro        LicenseLevel = "pro"
)

type Relation string

const (
	RelationMother   Relation = "mother"
	RelationFather   Relation = "father"
	RelationGuardian Relation = "guardian"
	RelationOther    Relation = "other"
)

// ── Base Model ────────────────────────────────────────────────────────────────

type BaseModel struct {
	ID        string         `gorm:"type:uuid;primaryKey" json:"id"`
	CreatedAt time.Time      `json:"createdAt"`
	UpdatedAt time.Time      `json:"updatedAt"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
}

func (b *BaseModel) BeforeCreate(_ *gorm.DB) error {
	if b.ID == "" {
		b.ID = idgen.New()
	}
	return nil
}

// ── Club ──────────────────────────────────────────────────────────────────────

type Club struct {
	BaseModel
	Name      string         `gorm:"not null" json:"name"`
	Country   string         `json:"country"`
	City      string         `json:"city"`
	LogoURL   string         `json:"logoURL"`
	FoundedAt *time.Time     `json:"foundedAt,omitempty"`
	Settings  datatypes.JSON `gorm:"type:jsonb;default:'{}'" json:"settings,omitempty"`
	Users     []User         `gorm:"foreignKey:ClubID" json:"-"`
	Teams     []Team         `gorm:"foreignKey:ClubID" json:"-"`
}

// ── User ──────────────────────────────────────────────────────────────────────

type User struct {
	BaseModel
	Email        string     `gorm:"uniqueIndex;not null" json:"email"`
	PasswordHash string     `gorm:"not null" json:"-"`
	Role         Role       `gorm:"type:varchar(20);not null;default:'player'" json:"role"`
	ClubID       *string    `gorm:"type:uuid" json:"clubID,omitempty"`
	Club         *Club      `json:"-"`
	FirstName    string     `gorm:"not null" json:"firstName"`
	LastName     string     `gorm:"not null" json:"lastName"`
	Phone        string     `json:"phone,omitempty"`
	AvatarURL    string     `json:"avatarURL,omitempty"`
	IsActive     bool       `gorm:"default:true" json:"isActive"`
	LastLoginAt  *time.Time `json:"lastLoginAt,omitempty"`
}

func (u *User) FullName() string {
	return u.FirstName + " " + u.LastName
}

// ── RefreshToken ──────────────────────────────────────────────────────────────

type RefreshToken struct {
	ID        string     `gorm:"type:uuid;primaryKey" json:"id"`
	UserID    string     `gorm:"type:uuid;not null;index" json:"userID"`
	User      User       `json:"-"`
	FamilyID  string     `gorm:"type:uuid;not null;index" json:"familyID"`
	TokenHash string     `gorm:"not null" json:"-"`
	ExpiresAt time.Time  `json:"expiresAt"`
	UsedAt    *time.Time `json:"usedAt,omitempty"`
	IP        string     `json:"ip,omitempty"`
	UserAgent string     `json:"userAgent,omitempty"`
	CreatedAt time.Time  `json:"createdAt"`
}

func (rt *RefreshToken) BeforeCreate(_ *gorm.DB) error {
	if rt.ID == "" {
		rt.ID = idgen.New()
	}
	return nil
}

func (rt *RefreshToken) IsExpired() bool {
	return time.Now().After(rt.ExpiresAt)
}

func (rt *RefreshToken) IsUsed() bool {
	return rt.UsedAt != nil
}

// ── CoachProfile ──────────────────────────────────────────────────────────────

type CoachProfile struct {
	BaseModel
	UserID         string       `gorm:"type:uuid;uniqueIndex;not null" json:"userID"`
	User           User         `json:"-"`
	LicenseLevel   LicenseLevel `gorm:"type:varchar(20)" json:"licenseLevel"`
	Specialization string       `json:"specialization"`
	Bio            string       `json:"bio"`
}

// ── Team ──────────────────────────────────────────────────────────────────────

type Team struct {
	BaseModel
	ClubID      string    `gorm:"type:uuid;not null;index" json:"clubID"`
	Club        Club      `json:"-"`
	Name        string    `gorm:"not null" json:"name"`
	AgeGroup    AgeGroup  `gorm:"type:varchar(10)" json:"ageGroup"`
	Season      string    `json:"season"`
	HeadCoachID *string   `gorm:"type:uuid" json:"headCoachID,omitempty"`
	HeadCoach   *User     `json:"headCoach,omitempty"`
	Members     []TeamMember `gorm:"foreignKey:TeamID" json:"members,omitempty"`
}

// ── TeamMember ────────────────────────────────────────────────────────────────

type TeamMember struct {
	TeamID       string   `gorm:"type:uuid;primaryKey" json:"teamID"`
	Team         Team     `json:"-"`
	PlayerID     string   `gorm:"type:uuid;primaryKey" json:"playerID"`
	Player       Player   `json:"player,omitempty"`
	JoinedAt     time.Time `json:"joinedAt"`
	JerseyNumber *int     `json:"jerseyNumber,omitempty"`
	Position     Position `gorm:"type:varchar(20)" json:"position"`
	IsCaptain    bool     `gorm:"default:false" json:"isCaptain"`
}

// ── Player ────────────────────────────────────────────────────────────────────

type Player struct {
	BaseModel
	UserID       *string      `gorm:"type:uuid" json:"userID,omitempty"`
	User         *User        `json:"-"`
	ClubID       string       `gorm:"type:uuid;not null;index" json:"clubID"`
	Club         Club         `json:"-"`
	FirstName    string       `gorm:"not null" json:"firstName"`
	LastName     string       `gorm:"not null" json:"lastName"`
	BirthDate    *time.Time   `json:"birthDate,omitempty"`
	HeightCm     *float32     `json:"heightCm,omitempty"`
	WeightKg     *float32     `json:"weightKg,omitempty"`
	DominantFoot DominantFoot `gorm:"type:varchar(10)" json:"dominantFoot"`
	Position     Position     `gorm:"type:varchar(20)" json:"position"`
	MedicalNotes string       `json:"medicalNotes,omitempty"`
	PhotoURL         string       `json:"photoURL,omitempty"`
	DevIndex         float64      `gorm:"type:numeric(5,2);default:0" json:"devIndex"`
	PotentialAbility int          `gorm:"type:int;default:0" json:"potentialAbility"`
	Goals            []PlayerGoal `gorm:"foreignKey:PlayerID" json:"-"`
}

func (p *Player) FullName() string {
	return p.FirstName + " " + p.LastName
}

// ── Parent ────────────────────────────────────────────────────────────────────

type Parent struct {
	BaseModel
	UserID   *string  `gorm:"type:uuid" json:"userID,omitempty"`
	User     *User    `json:"-"`
	FullName string   `gorm:"not null" json:"fullName"`
	Phone    string   `json:"phone,omitempty"`
	Email    string   `json:"email,omitempty"`
	Relation Relation `gorm:"type:varchar(20)" json:"relation"`
}

// ── PlayerParent ──────────────────────────────────────────────────────────────

type PlayerParent struct {
	PlayerID string `gorm:"type:uuid;primaryKey" json:"playerID"`
	Player   Player `json:"-"`
	ParentID string `gorm:"type:uuid;primaryKey" json:"parentID"`
	Parent   Parent `json:"-"`
}

// ── ParentInvitation ───────────────────────────────────────────────────────────
// Вариант A: Тренер отправляет приглашение родителю по email

type InvitationStatus string

const (
	InvitationStatusPending  InvitationStatus = "pending"
	InvitationStatusAccepted InvitationStatus = "accepted"
	InvitationStatusExpired  InvitationStatus = "expired"
)

type ParentInvitation struct {
	BaseModel
	PlayerID    string           `gorm:"type:uuid;not null;index" json:"playerID"`
	Player      Player           `json:"player,omitempty"`
	ClubID      string           `gorm:"type:uuid;not null;index" json:"clubID"`
	Email       string           `gorm:"not null" json:"email"`
	Token       string           `gorm:"uniqueIndex;not null" json:"token"` // уникальный токен для ссылки
	Status      InvitationStatus `gorm:"type:varchar(20);default:'pending'" json:"status"`
	CreatedBy   string           `gorm:"type:uuid;not null" json:"createdBy"` // тренер создавший
	Creator     User             `gorm:"foreignKey:CreatedBy" json:"creator,omitempty"`
	ExpiresAt   time.Time        `gorm:"not null" json:"expiresAt"`
	AcceptedAt  *time.Time       `json:"acceptedAt,omitempty"`
	AcceptedBy  *string          `gorm:"type:uuid" json:"acceptedBy,omitempty"` // parent user id
}

// ── PlayerLinkCode ─────────────────────────────────────────────────────────────
// Вариант C: Тренер генерирует код доступа для быстрого связывания

type PlayerLinkCode struct {
	BaseModel
	PlayerID  string     `gorm:"type:uuid;not null;index" json:"playerID"`
	Player    Player     `json:"player,omitempty"`
	ClubID    string     `gorm:"type:uuid;not null;index" json:"clubID"`
	Code      string     `gorm:"uniqueIndex;not null" json:"code"` // 6 цифр
	CreatedBy string     `gorm:"type:uuid;not null" json:"createdBy"`
	Creator   User       `gorm:"foreignKey:CreatedBy" json:"creator,omitempty"`
	ExpiresAt time.Time  `gorm:"not null" json:"expiresAt"`
	UsedAt    *time.Time `json:"usedAt,omitempty"`
	UsedBy    *string    `gorm:"type:uuid" json:"usedBy,omitempty"` // parent user id
}

// ── Exercise ──────────────────────────────────────────────────────────────────

type Exercise struct {
	BaseModel
	ClubID      *string          `gorm:"type:uuid" json:"clubID,omitempty"`
	Club        *Club            `json:"-"`
	Name        string           `gorm:"not null" json:"name"`
	Category    ExerciseCategory `gorm:"type:varchar(20);not null" json:"category"`
	Difficulty  int              `gorm:"check:difficulty >= 1 AND difficulty <= 5;default:1" json:"difficulty"`
	DurationMin int              `json:"durationMin"`
	PlayersMin  int              `json:"playersMin"`
	PlayersMax  int              `json:"playersMax"`
	Equipment   pq.StringArray   `gorm:"type:text[]" json:"equipment"`
	Description string           `json:"description"`
	DiagramURL  string           `json:"diagramURL,omitempty"`
	Tags        pq.StringArray   `gorm:"type:text[]" json:"tags"`
	CreatedByID string           `gorm:"type:uuid" json:"createdByID,omitempty"`
	CreatedBy   User             `json:"-"`
	IsGlobal    bool             `gorm:"default:false" json:"isGlobal"`
}

// ── TrainingSession ───────────────────────────────────────────────────────────

type TrainingSession struct {
	BaseModel
	TeamID      string           `gorm:"type:uuid;not null;index" json:"teamID"`
	Team        Team             `json:"team,omitempty"`
	CoachID     string           `gorm:"type:uuid;not null" json:"coachID"`
	Coach       User             `json:"-"`
	ScheduledAt time.Time        `gorm:"not null" json:"scheduledAt"`
	DurationMin int              `json:"durationMin"`
	Location    string           `json:"location"`
	Status      SessionStatus    `gorm:"type:varchar(20);default:'planned'" json:"status"`
	Intensity   SessionIntensity `gorm:"type:varchar(10);default:'medium'" json:"intensity"`
	Focus       pq.StringArray   `gorm:"type:text[]" json:"focus"`
	Notes       string           `json:"notes,omitempty"`
	Blocks      []TrainingBlock  `gorm:"foreignKey:SessionID" json:"blocks,omitempty"`
	Attendance  []AttendanceRecord `gorm:"foreignKey:SessionID" json:"-"`
}

// ── TrainingBlock ─────────────────────────────────────────────────────────────

type TrainingBlock struct {
	BaseModel
	SessionID   string            `gorm:"type:uuid;not null;index" json:"sessionID"`
	Session     TrainingSession   `json:"-"`
	Kind        BlockKind         `gorm:"type:varchar(20);not null" json:"kind"`
	OrderIndex  int               `gorm:"not null" json:"orderIndex"`
	DurationMin int               `json:"durationMin"`
	Notes       string            `json:"notes,omitempty"`
	Exercises   []SessionExercise `gorm:"foreignKey:BlockID" json:"exercises,omitempty"`
}

// ── SessionExercise ───────────────────────────────────────────────────────────

type SessionExercise struct {
	BaseModel
	BlockID           string   `gorm:"type:uuid;not null;index" json:"blockID"`
	Block             TrainingBlock `json:"-"`
	ExerciseID        string   `gorm:"type:uuid;not null" json:"exerciseID"`
	Exercise          Exercise `json:"exercise,omitempty"`
	OrderIndex        int      `json:"orderIndex"`
	DurationMin       int      `json:"durationMin"`
	Sets              int      `json:"sets"`
	Reps              int      `json:"reps"`
	IntensityOverride string   `json:"intensityOverride,omitempty"`
}

// ── AttendanceRecord ──────────────────────────────────────────────────────────

type AttendanceRecord struct {
	BaseModel
	SessionID  string           `gorm:"type:uuid;not null;index;uniqueIndex:idx_session_player" json:"sessionID"`
	Session    TrainingSession  `json:"-"`
	PlayerID   string           `gorm:"type:uuid;not null;index;uniqueIndex:idx_session_player" json:"playerID"`
	Player     Player           `json:"player,omitempty"`
	Status     AttendanceStatus `gorm:"type:varchar(20);not null;default:'present'" json:"status"`
	Reason     string           `json:"reason,omitempty"`
	MarkedByID string           `gorm:"type:uuid" json:"markedByID,omitempty"`
	MarkedBy   User             `json:"-"`
	MarkedAt   time.Time        `json:"markedAt"`
}

// ── PlayerAssessment ──────────────────────────────────────────────────────────

type PlayerAssessment struct {
	BaseModel
	PlayerID   string    `gorm:"type:uuid;not null;index" json:"playerID"`
	Player     Player    `json:"-"`
	CoachID    string    `gorm:"type:uuid;not null" json:"coachID"`
	Coach      User      `json:"-"`
	AssessedAt time.Time `gorm:"not null" json:"assessedAt"`
	Technical  int       `gorm:"check:technical >= 1 AND technical <= 10" json:"technical"`
	Physical   int       `gorm:"check:physical >= 1 AND physical <= 10" json:"physical"`
	Tactical   int       `gorm:"check:tactical >= 1 AND tactical <= 10" json:"tactical"`
	Discipline int       `gorm:"check:discipline >= 1 AND discipline <= 10" json:"discipline"`
	Teamwork   int       `gorm:"check:teamwork >= 1 AND teamwork <= 10" json:"teamwork"`
	Notes      string    `json:"notes,omitempty"`
}

func (a *PlayerAssessment) Average() float64 {
	return float64(a.Technical+a.Physical+a.Tactical+a.Discipline+a.Teamwork) / 5.0
}

// ── PlayerGoal ────────────────────────────────────────────────────────────────

type PlayerGoal struct {
	BaseModel
	PlayerID     string     `gorm:"type:uuid;not null;index" json:"playerID"`
	Player       Player     `json:"-"`
	Title        string     `gorm:"not null" json:"title"`
	Description  string     `json:"description,omitempty"`
	TargetMetric string     `json:"targetMetric,omitempty"`
	TargetValue  float64    `json:"targetValue"`
	Deadline     *time.Time `json:"deadline,omitempty"`
	Status       GoalStatus `gorm:"type:varchar(20);default:'active'" json:"status"`
	ProgressPct  float64    `gorm:"type:numeric(5,2);default:0" json:"progressPct"`
}

// ── Match ─────────────────────────────────────────────────────────────────────

type Match struct {
	BaseModel
	TeamID       string        `gorm:"type:uuid;not null;index" json:"teamID"`
	Team         Team          `json:"-"`
	Opponent     string        `gorm:"not null" json:"opponent"`
	KickoffAt    time.Time     `gorm:"not null" json:"kickoffAt"`
	Location     string        `json:"location,omitempty"`
	IsHome       bool          `gorm:"default:true" json:"isHome"`
	Status       MatchStatus   `gorm:"type:varchar(20);default:'scheduled'" json:"status"`
	GoalsFor     int           `gorm:"default:0;check:goals_for >= 0" json:"goalsFor"`
	GoalsAgainst int           `gorm:"default:0;check:goals_against >= 0" json:"goalsAgainst"`
	Notes        string        `json:"notes,omitempty"`
	Lineups      []MatchLineup `gorm:"foreignKey:MatchID" json:"lineups,omitempty"`
	Events       []MatchEvent  `gorm:"foreignKey:MatchID" json:"events,omitempty"`
}

// ── MatchLineup ───────────────────────────────────────────────────────────────

type MatchLineup struct {
	MatchID       string     `gorm:"type:uuid;primaryKey" json:"matchID"`
	Match         Match      `json:"-"`
	PlayerID      string     `gorm:"type:uuid;primaryKey" json:"playerID"`
	Player        Player     `json:"player,omitempty"`
	Role          LineupRole `gorm:"type:varchar(20);not null" json:"role"`
	Position      Position   `gorm:"type:varchar(20)" json:"position"`
	MinutesPlayed int        `json:"minutesPlayed"`
	FieldX        *float64   `json:"fieldX,omitempty"`
	FieldY        *float64   `json:"fieldY,omitempty"`
}

// ── MatchEvent ────────────────────────────────────────────────────────────────

type MatchEvent struct {
	ID        string         `gorm:"type:uuid;primaryKey" json:"id"`
	MatchID   string         `gorm:"type:uuid;not null;index" json:"matchID"`
	Match     Match          `json:"-"`
	PlayerID  *string        `gorm:"type:uuid" json:"playerID,omitempty"`
	Player    *Player        `json:"player,omitempty"`
	Minute    int            `json:"minute"`
	Type      MatchEventType `gorm:"type:varchar(20);not null" json:"type"`
	Notes     string         `json:"notes,omitempty"`
	CreatedAt time.Time      `json:"createdAt"`
}

func (me *MatchEvent) BeforeCreate(_ *gorm.DB) error {
	if me.ID == "" {
		me.ID = idgen.New()
	}
	return nil
}

// ── Notification ──────────────────────────────────────────────────────────────

type Notification struct {
	ID        string           `gorm:"type:uuid;primaryKey" json:"id"`
	UserID    string           `gorm:"type:uuid;not null;index" json:"userID"`
	User      User             `json:"-"`
	Type      NotificationType `gorm:"type:varchar(40);not null" json:"type"`
	Title     string           `gorm:"not null" json:"title"`
	Body      string           `json:"body,omitempty"`
	Payload   datatypes.JSON   `gorm:"type:jsonb;default:'{}'" json:"payload,omitempty"`
	ReadAt    *time.Time       `json:"readAt,omitempty"`
	CreatedAt time.Time        `json:"createdAt"`
}

func (n *Notification) BeforeCreate(_ *gorm.DB) error {
	if n.ID == "" {
		n.ID = idgen.New()
	}
	return nil
}

func (n *Notification) IsRead() bool {
	return n.ReadAt != nil
}

// ── Report ────────────────────────────────────────────────────────────────────

type Report struct {
	BaseModel
	ClubID        string         `gorm:"type:uuid;not null;index" json:"clubID"`
	Club          Club           `json:"-"`
	Type          ReportType     `gorm:"type:varchar(20);not null" json:"type"`
	ScopeID       string         `gorm:"type:uuid" json:"scopeID"`
	GeneratedByID string         `gorm:"type:uuid" json:"generatedByID"`
	GeneratedBy   User           `json:"-"`
	Params        datatypes.JSON `gorm:"type:jsonb;default:'{}'" json:"params,omitempty"`
	Snapshot      datatypes.JSON `gorm:"type:jsonb;default:'{}'" json:"snapshot,omitempty"`
}

// ── AIRecommendation ──────────────────────────────────────────────────────────

type AIRecommendation struct {
	BaseModel
	TargetType  AITargetType   `gorm:"type:varchar(20);not null" json:"targetType"`
	TargetID    string         `gorm:"type:uuid;not null;index" json:"targetID"`
	Prompt      datatypes.JSON `gorm:"type:jsonb;default:'{}'" json:"prompt,omitempty"`
	Response    datatypes.JSON `gorm:"type:jsonb;default:'{}'" json:"response"`
	CreatedByID string         `gorm:"type:uuid" json:"createdByID,omitempty"`
	CreatedBy   User           `json:"-"`
}

// ── AuditLog ──────────────────────────────────────────────────────────────────

type AuditLog struct {
	ID         string         `gorm:"type:uuid;primaryKey" json:"id"`
	ActorID    string         `gorm:"type:uuid;index" json:"actorID"`
	Action     string         `gorm:"not null" json:"action"`
	EntityType string         `gorm:"not null" json:"entityType"`
	EntityID   string         `gorm:"type:uuid" json:"entityID"`
	Before     datatypes.JSON `gorm:"type:jsonb" json:"before,omitempty"`
	After      datatypes.JSON `gorm:"type:jsonb" json:"after,omitempty"`
	IP         string         `json:"ip,omitempty"`
	UserAgent  string         `json:"userAgent,omitempty"`
	CreatedAt  time.Time      `json:"createdAt"`
}

func (al *AuditLog) BeforeCreate(_ *gorm.DB) error {
	if al.ID == "" {
		al.ID = idgen.New()
	}
	return nil
}

// ── CoachNote ─────────────────────────────────────────────────────────────────

type CoachNote struct {
	ID        string    `gorm:"type:uuid;primaryKey" json:"id"`
	PlayerID  string    `gorm:"type:uuid;not null;index" json:"playerId"`
	CoachID   string    `gorm:"type:uuid;not null;index" json:"coachId"`
	Category  string    `gorm:"type:varchar(20);not null" json:"category"` // technique, tactics, physical, behavior, medical
	Content   string    `gorm:"type:text;not null" json:"content"`
	IsPrivate bool      `gorm:"default:false" json:"isPrivate"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
}

func (cn *CoachNote) BeforeCreate(_ *gorm.DB) error {
	if cn.ID == "" {
		cn.ID = idgen.New()
	}
	return nil
}

// ── AllModels returns a slice of all domain models for AutoMigrate ────────────

func AllModels() []interface{} {
	return []interface{}{
		&Club{},
		&User{},
		&RefreshToken{},
		&CoachProfile{},
		&Team{},
		&Player{},
		&TeamMember{},
		&Parent{},
		&PlayerParent{},
		&ParentInvitation{},
		&PlayerLinkCode{},
		&Exercise{},
		&TrainingSession{},
		&TrainingBlock{},
		&SessionExercise{},
		&AttendanceRecord{},
		&PlayerAssessment{},
		&PlayerGoal{},
		&Match{},
		&MatchLineup{},
		&MatchEvent{},
		&Notification{},
		&Report{},
		&AIRecommendation{},
		&AuditLog{},
		&CoachNote{},
		&MedicalRecord{},
	}
}

// ── MedicalRecord ─────────────────────────────────────────────────────────────

type MedicalRecord struct {
	ID          string    `gorm:"type:uuid;primaryKey" json:"id"`
	PlayerID    string    `gorm:"type:uuid;not null;index" json:"playerId"`
	Condition   string    `gorm:"type:varchar(20);not null" json:"condition"` // injury, illness, recovery, fit
	Description string    `gorm:"type:text;not null" json:"description"`
	StartDate   *string   `gorm:"type:date" json:"startDate"`
	EndDate     *string   `gorm:"type:date" json:"endDate"`
	Severity    string    `gorm:"type:varchar(20)" json:"severity"` // minor, moderate, severe
	Status      string    `gorm:"type:varchar(20);not null" json:"status"` // active, recovered
	CreatedAt   time.Time `json:"createdAt"`
	UpdatedAt   time.Time `json:"updatedAt"`
}

func (mr *MedicalRecord) BeforeCreate(_ *gorm.DB) error {
	if mr.ID == "" {
		mr.ID = idgen.New()
	}
	return nil
}
