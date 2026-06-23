package routes

import (
	"github.com/coachos/backend/internal/domain"
	"github.com/coachos/backend/internal/handler"
	"github.com/coachos/backend/internal/middleware"
	"github.com/gofiber/fiber/v2"
	swagger "github.com/gofiber/swagger"
	"gorm.io/gorm"
)

// RegisterRoutes registers all application routes on the Fiber app.
func RegisterRoutes(
	app *fiber.App,
	jwtSecret string,
	db *gorm.DB,
	healthH *handler.HealthHandler,
	authH *handler.AuthHandler,
	clubH *handler.ClubHandler,
	teamH *handler.TeamHandler,
	playerH *handler.PlayerHandler,
	exerciseH *handler.ExerciseHandler,
	sessionH *handler.SessionHandler,
	assessmentH *handler.AssessmentHandler,
	matchH *handler.MatchHandler,
	analyticsH *handler.AnalyticsHandler,
	parentH *handler.ParentHandler,
	aiH *handler.AIHandler,
	notifH *handler.NotificationHandler,
	coachNoteH *handler.CoachNoteHandler,
	medicalRecordH *handler.MedicalRecordHandler,
) {
	// Health check
	app.Get("/health", healthH.Health)

	// Swagger UI
	app.Get("/swagger/*", swagger.HandlerDefault)

	auth := middleware.Auth(jwtSecret)
	adminOnly := middleware.RequireRole(domain.RoleAdmin)
	coachOrAdmin := middleware.RequireRole(domain.RoleAdmin, domain.RoleCoach)
	coachOnly := middleware.RequireRole(domain.RoleCoach)
	coachAdminAnalyst := middleware.RequireRole(domain.RoleAdmin, domain.RoleCoach, domain.RoleAnalyst)
	parentOnly := middleware.RequireRole(domain.RoleParent)

	v1 := app.Group("/api/v1")

	// Auth
	authGroup := v1.Group("/auth")
	authGroup.Post("/register", authH.Register)
	authGroup.Post("/login", authH.Login)
	authGroup.Post("/refresh", authH.Refresh)
	authGroup.Post("/logout", authH.Logout)
	authGroup.Get("/me", auth, authH.Me)

	// Users (register /me before / so it is never shadowed by a catch-all)
	users := v1.Group("/users", auth)
	users.Get("/me", authH.Me)
	users.Patch("/me", authH.UpdateMe)
	users.Get("/", adminOnly, authH.ListUsers)
	users.Post("/", adminOnly, authH.CreateUser)
	users.Get("/:id", adminOnly, authH.GetUser)
	users.Patch("/:id", adminOnly, authH.UpdateUser)

	// Clubs
	clubs := v1.Group("/clubs", auth)
	clubs.Post("/", adminOnly, clubH.CreateClub)
	clubs.Get("/:id", clubH.GetClub)
	clubs.Patch("/:id", adminOnly, clubH.UpdateClub)
	clubs.Get("/:id/dashboard", coachOrAdmin, clubH.GetClubDashboard)

	// Teams
	teams := v1.Group("/teams", auth)
	teams.Get("/", teamH.ListTeams)
	teams.Post("/", coachOrAdmin, teamH.CreateTeam)
	teams.Get("/:id", teamH.GetTeam)
	teams.Patch("/:id", coachOrAdmin, teamH.UpdateTeam)
	teams.Delete("/:id", adminOnly, teamH.DeleteTeam)
	teams.Post("/:id/members", coachOrAdmin, teamH.AddMember)
	teams.Delete("/:id/members/:playerID", coachOrAdmin, teamH.RemoveMember)
	teams.Get("/:id/dashboard", coachOrAdmin, teamH.GetTeamDashboard)
	teams.Get("/:id/assessments-summary", coachOrAdmin, assessmentH.GetTeamAssessmentSummary)

	// Players
	players := v1.Group("/players", auth)
	players.Get("/", playerH.ListPlayers)
	players.Post("/", coachOrAdmin, playerH.CreatePlayer)
	players.Get("/:id", playerH.GetPlayer)
	players.Patch("/:id", coachOrAdmin, playerH.UpdatePlayer)
	players.Delete("/:id", adminOnly, playerH.DeletePlayer)
	players.Post("/:id/photo", coachOrAdmin, playerH.UploadPlayerPhoto)
	players.Get("/:id/profile", playerH.GetPlayerProfile)
	players.Get("/:id/progress", playerH.GetPlayerProgress)
	players.Get("/:id/dev-index", playerH.GetPlayerDevIndex)
	players.Get("/:id/attendance", playerH.GetPlayerAttendance)
	players.Get("/:id/assessments", assessmentH.GetPlayerAssessments)

	// Exercises
	exercises := v1.Group("/exercises", auth)
	exercises.Get("/", exerciseH.ListExercises)
	exercises.Post("/", coachOrAdmin, exerciseH.CreateExercise)
	exercises.Get("/:id", exerciseH.GetExercise)
	exercises.Patch("/:id", coachOrAdmin, exerciseH.UpdateExercise)
	exercises.Delete("/:id", coachOrAdmin, exerciseH.DeleteExercise)

	// Sessions
	sessions := v1.Group("/sessions", auth)
	sessions.Get("/", sessionH.ListSessions)
	sessions.Post("/", coachOnly, sessionH.CreateSession)
	sessions.Get("/:id", sessionH.GetSession)
	sessions.Patch("/:id", coachOnly, sessionH.UpdateSession)
	sessions.Delete("/:id", coachOnly, sessionH.DeleteSession)
	sessions.Post("/:id/blocks", coachOnly, sessionH.AddBlock)
	sessions.Put("/:id/blocks", coachOnly, sessionH.SaveBlocks)
	sessions.Post("/:id/blocks/:blockID/exercises", coachOnly, sessionH.AddExerciseToBlock)
	sessions.Patch("/:id/attendance", coachOnly, sessionH.MarkAttendance)
	sessions.Post("/:id/complete", coachOnly, sessionH.CompleteSession)

	// Assessments
	v1.Post("/assessments", auth, coachOnly, assessmentH.CreateAssessment)

	// Me (player self-service)
	me := v1.Group("/me", auth)
	me.Get("/matches", matchH.GetMyMatches)
	me.Get("/reports", analyticsH.GetMyReports)
	me.Get("/ai/insights", aiH.GetMyInsights)
	me.Post("/ai/insights", aiH.GenerateMyInsights)

	// Matches
	matches := v1.Group("/matches", auth)
	matches.Get("/", matchH.ListMatches)
	matches.Post("/", coachOnly, matchH.CreateMatch)
	matches.Get("/:id", matchH.GetMatch)
	matches.Patch("/:id", coachOnly, matchH.UpdateMatch)
	matches.Delete("/:id", coachOnly, matchH.DeleteMatch)
	matches.Put("/:id/lineup", coachOnly, matchH.SetLineup)
	matches.Post("/:id/events", coachOnly, matchH.AddEvent)
	matches.Get("/:id/summary", matchH.GetSummary)

	// Parent portal
	parent := v1.Group("/parent", auth)
	parent.Get("/children", parentOnly, parentH.ListChildren)
	parent.Post("/accept-invitation", parentOnly, parentH.AcceptInvitation) // Вариант A: принять приглашение
	parent.Post("/use-link-code", middleware.RequireRole(domain.RoleParent, domain.RolePlayer), parentH.UseLinkCode) // Вариант C: использовать код

	// Coach parent linking management
	coachParent := v1.Group("/coach", auth, coachOrAdmin)
	coachParent.Post("/parent-invitations", parentH.CreateInvitation) // Вариант A: создать приглашение
	coachParent.Get("/parent-invitations", parentH.ListInvitations)  // Вариант A: список приглашений
	coachParent.Post("/link-codes", parentH.GenerateLinkCode)          // Вариант C: создать код
	coachParent.Get("/link-codes", parentH.ListLinkCodes)                // Вариант C: список кодов

	// Analytics
	analytics := v1.Group("/analytics", auth)
	analytics.Get("/coach-dashboard", coachOrAdmin, analyticsH.GetCoachDashboard)
	analytics.Get("/team/:id", coachAdminAnalyst, analyticsH.GetTeamAnalytics)
	analytics.Get("/player/:id", analyticsH.GetPlayerAnalytics)
	analytics.Get("/attendance", coachOrAdmin, analyticsH.GetAttendanceAnalytics)
	analytics.Get("/training-load", coachOnly, analyticsH.GetTrainingLoad)
	analytics.Get("/player/:id/match-stats", analyticsH.GetPlayerMatchStats)
	analytics.Get("/player/:id/form", analyticsH.GetPlayerForm)

	// AI
	aiGroup := v1.Group("/ai", auth, coachOnly)
	aiGroup.Post("/training-plan", aiH.GenerateTrainingPlan)
	aiGroup.Post("/recommend-exercises", aiH.RecommendExercises)
	aiGroup.Post("/analyze-player", aiH.AnalyzePlayer)
	aiGroup.Post("/summarize-progress", aiH.SummarizeProgress)

	// Notifications
	notifications := v1.Group("/notifications", auth)
	notifications.Get("/", notifH.GetNotifications)
	notifications.Patch("/read-all", notifH.MarkAllRead)
	notifications.Patch("/:id/read", notifH.MarkRead)

	// Coach notes
	coachNotes := v1.Group("/coach/notes", auth, coachOrAdmin)
	coachNotes.Post("/", coachNoteH.CreateCoachNote)
	coachNotes.Patch("/:id", coachNoteH.UpdateCoachNote)
	coachNotes.Delete("/:id", coachNoteH.DeleteCoachNote)

	// Medical records
	medicalRecords := v1.Group("/medical-records", auth, coachOrAdmin)
	medicalRecords.Post("/", medicalRecordH.CreateMedicalRecord)
	medicalRecords.Patch("/:id", medicalRecordH.UpdateMedicalRecord)
	medicalRecords.Delete("/:id", medicalRecordH.DeleteMedicalRecord)
	players.Get("/:id/medical-records", medicalRecordH.ListMedicalRecords)

	// Player notes (visible to coaches and parents)
	players.Get("/:id/notes", coachNoteH.ListCoachNotes)
}
