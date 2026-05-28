export type Role = 'admin' | 'coach' | 'player' | 'parent' | 'analyst'
export type AgeGroup = 'U7'|'U8'|'U9'|'U10'|'U11'|'U12'|'U13'|'U14'|'U15'|'U16'|'U17'|'U18'|'U19'|'U21'|'Senior'
export type Position = 'goalkeeper'|'defender'|'midfielder'|'forward'|'universal'
export type DominantFoot = 'left'|'right'|'both'
export type SessionStatus = 'planned'|'in_progress'|'completed'|'cancelled'
export type SessionIntensity = 'low'|'medium'|'high'
export type BlockKind = 'warmup'|'main'|'game'|'cooldown'
export type ExerciseCategory = 'technique'|'tactics'|'physical'|'coordination'|'goalkeeping'|'warmup'|'cooldown'
export type AttendanceStatus = 'present'|'absent'|'late'|'excused'|'injured'
export type MatchStatus = 'scheduled'|'in_progress'|'completed'|'cancelled'|'postponed'
export type MatchEventType = 'goal'|'assist'|'yellow_card'|'red_card'|'sub_in'|'sub_out'
export type LineupRole = 'starter'|'substitute'
export type GoalStatus = 'active'|'achieved'|'paused'|'cancelled'
export type NotificationType = 'session_created'|'session_updated'|'session_cancelled'|'attendance_marked'|'assessment_added'|'match_scheduled'|'match_result'|'report_ready'|'general'

export interface User {
  id: string; email: string; role: Role; clubId?: string;
  firstName: string; lastName: string; phone?: string;
  avatarURL?: string; isActive: boolean; lastLoginAt?: string; createdAt: string;
}
export interface Club { id: string; name: string; country?: string; city?: string; logoURL?: string; foundedAt?: string; }
export interface Team { id: string; clubId: string; name: string; ageGroup?: AgeGroup; season?: string; headCoachID?: string; headCoach?: User; }
/** Row shape returned inside GET /teams/:id (API uses camelCase clubId). */
export interface TeamMemberSummary {
  playerId: string
  firstName: string
  lastName: string
  devIndex: number
  jerseyNumber?: number
  position?: string
  isCaptain: boolean
}
export interface TeamWithMembers extends Team {
  members?: TeamMemberSummary[]
}
export interface TeamMember { teamID: string; playerID: string; player: Player; jerseyNumber?: number; position?: Position; isCaptain: boolean; joinedAt: string; }
export interface Player { id: string; userID?: string; clubId: string; firstName: string; lastName: string; birthDate?: string; heightCm?: number; weightKg?: number; dominantFoot?: DominantFoot; position?: Position; medicalNotes?: string; photoURL?: string; devIndex: number; potentialAbility?: number; }
export interface Parent { id: string; userID?: string; fullName: string; phone?: string; email?: string; relation?: string; }
export interface Exercise { id: string; clubId?: string; name: string; category: ExerciseCategory; difficulty: number; durationMin?: number; playersMin?: number; playersMax?: number; equipment?: string[]; description?: string; tags?: string[]; isGlobal: boolean; }
export interface TrainingSession { id: string; teamID: string; coachID: string; scheduledAt: string; durationMin?: number; location?: string; status: SessionStatus; intensity: SessionIntensity; focus?: string[]; notes?: string; blocks?: TrainingBlock[]; }
export interface TrainingBlock { id: string; sessionID: string; kind: BlockKind; orderIndex: number; durationMin?: number; notes?: string; exercises?: SessionExercise[]; }
export interface SessionExercise { id: string; blockID: string; exerciseID: string; exercise?: Exercise; orderIndex: number; durationMin?: number; sets?: number; reps?: number; }
export interface AttendanceRecord { id: string; sessionID: string; playerID: string; player?: Player; status: AttendanceStatus; reason?: string; markedAt: string; }
export interface PlayerAssessment { id: string; playerID: string; coachID: string; assessedAt: string; technical: number; physical: number; tactical: number; discipline: number; teamwork: number; notes?: string; }
export interface PlayerGoal { id: string; playerID: string; title: string; description?: string; targetMetric?: string; targetValue?: number; deadline?: string; status: GoalStatus; progressPct: number; }
export interface Match { id: string; teamID: string; opponent: string; kickoffAt: string; location?: string; isHome: boolean; status: MatchStatus; goalsFor: number; goalsAgainst: number; notes?: string; lineup?: MatchLineup[]; events?: MatchEvent[]; }
export interface MatchLineup { matchID: string; playerID: string; playerId?: string; player?: Player; role: LineupRole; position?: Position; minutesPlayed?: number; fieldX?: number; fieldY?: number; }
export interface MatchEvent { id: string; matchID: string; playerID?: string; player?: Player; minute: number; type: MatchEventType; notes?: string; }
export interface Notification { id: string; userID: string; type: NotificationType; title: string; body?: string; payload?: Record<string, unknown>; readAt?: string; createdAt: string; }

export interface PaginatedResponse<T> { data: T[]; meta: { page: number; limit: number; total: number; }; }
export interface ApiError { error: { code: string; message: string; details?: unknown; }; }

export interface CoachDashboard { todaysSessions: TrainingSession[]; absentToday: Player[]; playersAtRisk: PlayerRisk[]; upcomingSessions: TrainingSession[]; teamStats: TeamStat[]; }
export interface PlayerRisk { player: Player; attendanceRate: number; devIndexTrend: 'rising'|'stable'|'falling'; lastAssessmentDays: number; }
export interface TeamStat { teamID: string; teamName: string; playerCount: number; avgAttendance: number; avgDevIndex: number; }
export interface PlayerAnalytics { assessmentHistory: PlayerAssessment[]; attendanceHistory: AttendanceRecord[]; goalsProgress: PlayerGoal[]; devIndexHistory: Array<{date: string; value: number}>; }
export interface AttendanceStat { playerID: string; playerName: string; present: number; total: number; rate: number; }
export interface TrainingLoad { weekLabel: string; loadScore: number; sessionCount: number; avgIntensity: string; }
