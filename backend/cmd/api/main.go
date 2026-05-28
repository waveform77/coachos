package main

import (
	"context"
	"fmt"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/coachos/backend/internal/ai"
	"github.com/coachos/backend/internal/config"
	"github.com/coachos/backend/internal/database"
	"github.com/coachos/backend/internal/domain"
	"github.com/coachos/backend/internal/handler"
	"github.com/coachos/backend/internal/middleware"
	"github.com/coachos/backend/internal/notifier"
	pkglogger "github.com/coachos/backend/internal/pkg/logger"
	pgRepo "github.com/coachos/backend/internal/repository/postgres"
	"github.com/coachos/backend/internal/routes"
	"github.com/coachos/backend/internal/service"
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/limiter"
)

func main() {
	// 1. Load config
	cfg, err := config.Load()
	if err != nil {
		fmt.Fprintf(os.Stderr, "failed to load config: %v\n", err)
		os.Exit(1)
	}

	// 2. Init logger
	log := pkglogger.New(cfg.Log.Level, cfg.Log.Pretty)
	log.Info().Str("env", cfg.App.Env).Msg("starting CoachOS API")

	// 3. Connect DB
	db, err := database.Connect(cfg.DB, cfg.Log.Level)
	if err != nil {
		log.Fatal().Err(err).Msg("failed to connect to database")
	}
	log.Info().Msg("database connected")

	// 4. Run AutoMigrate
	if err := db.AutoMigrate(domain.AllModels()...); err != nil {
		log.Fatal().Err(err).Msg("failed to run migrations")
	}
	log.Info().Msg("database migrated")

	// 5. Init repositories
	userRepo := pgRepo.NewUserRepository(db)
	refreshTokenRepo := pgRepo.NewRefreshTokenRepository(db)
	clubRepo := pgRepo.NewClubRepository(db)
	teamRepo := pgRepo.NewTeamRepository(db)
	playerRepo := pgRepo.NewPlayerRepository(db)
	parentRepo := pgRepo.NewParentRepository(db)
	exerciseRepo := pgRepo.NewExerciseRepository(db)
	sessionRepo := pgRepo.NewSessionRepository(db)
	attendanceRepo := pgRepo.NewAttendanceRepository(db)
	assessmentRepo := pgRepo.NewAssessmentRepository(db)
	matchRepo := pgRepo.NewMatchRepository(db)
	notifRepo := pgRepo.NewNotificationRepository(db)
	aiRepo := pgRepo.NewAIRepository(db)
	goalRepo := pgRepo.NewGoalRepository(db)
	coachProfileRepo := pgRepo.NewCoachProfileRepository(db)
	coachNoteRepo := pgRepo.NewCoachNoteRepository(db)
	medicalRecordRepo := pgRepo.NewMedicalRecordRepository(db)

	// 6. Init notifier and AI provider
	inAppNotifier := notifier.NewInAppNotifier(db)
	var aiProvider ai.Provider
	switch cfg.AI.Provider {
	case "deepseek":
		if cfg.AI.DeepSeekAPIKey != "" {
			aiProvider = ai.NewDeepSeekProvider(cfg.AI.DeepSeekAPIKey)
		} else {
			log.Warn().Msg("DEEPSEEK_API_KEY not set, falling back to mock provider")
			aiProvider = ai.NewMockProvider()
		}
	default:
		aiProvider = ai.NewMockProvider()
	}

	// 7. Init services
	authSvc := service.NewAuthService(userRepo, refreshTokenRepo, coachProfileRepo, cfg.JWT)
	clubSvc := service.NewClubService(clubRepo, teamRepo, playerRepo, userRepo, sessionRepo, attendanceRepo)
	teamSvc := service.NewTeamService(teamRepo, sessionRepo)
	playerSvc := service.NewPlayerService(playerRepo, assessmentRepo, attendanceRepo, goalRepo)
	exerciseSvc := service.NewExerciseService(exerciseRepo)
	sessionSvc := service.NewSessionService(sessionRepo, teamRepo, inAppNotifier, attendanceRepo)
	assessmentSvc := service.NewAssessmentService(assessmentRepo, playerSvc)
	matchSvc := service.NewMatchService(matchRepo)
	analyticsSvc := service.NewAnalyticsService(sessionRepo, teamRepo, playerRepo, attendanceRepo, assessmentRepo, matchRepo, goalRepo, parentRepo)
	aiSvc := service.NewAIService(aiProvider, aiRepo, playerRepo, assessmentRepo, attendanceRepo, goalRepo, exerciseRepo, inAppNotifier)
	notifSvc := service.NewNotificationService(notifRepo)
	parentSvc := service.NewParentService(parentRepo, playerRepo, inAppNotifier)

	// 8. Init handlers
	healthH := handler.NewHealthHandler("1.0.0")
	authH := handler.NewAuthHandler(authSvc)
	clubH := handler.NewClubHandler(clubSvc)
	teamH := handler.NewTeamHandler(teamSvc)
	playerH := handler.NewPlayerHandler(playerSvc)
	exerciseH := handler.NewExerciseHandler(exerciseSvc)
	sessionH := handler.NewSessionHandler(sessionSvc)
	assessmentH := handler.NewAssessmentHandler(assessmentSvc)
	matchH := handler.NewMatchHandler(matchSvc, playerSvc)
	analyticsH := handler.NewAnalyticsHandler(analyticsSvc, sessionSvc)
	aiH := handler.NewAIHandler(aiSvc)
	notifH := handler.NewNotificationHandler(notifSvc)
	parentH := handler.NewParentHandler(parentRepo, playerRepo, parentSvc)
	coachNoteH := handler.NewCoachNoteHandler(coachNoteRepo)
	medicalRecordH := handler.NewMedicalRecordHandler(medicalRecordRepo)

	// 9. Create Fiber app
	app := fiber.New(fiber.Config{
		ErrorHandler: middleware.ErrorHandler,
		ReadTimeout:  30 * time.Second,
		WriteTimeout: 30 * time.Second,
	})

	// Global middleware
	app.Use(middleware.RecoverMiddleware(log))
	app.Use(middleware.RequestLogger(log))
	app.Use(middleware.CORSMiddleware(cfg.CORS.Origins))
	app.Use(limiter.New(limiter.Config{
		Max:        cfg.RateLimit.Max,
		Expiration: cfg.RateLimit.Expiration,
		KeyGenerator: func(c *fiber.Ctx) string {
			return c.IP()
		},
		LimitReached: func(c *fiber.Ctx) error {
			return c.Status(fiber.StatusTooManyRequests).JSON(fiber.Map{
				"error": fiber.Map{
					"code":    "RATE_LIMITED",
					"message": "too many requests",
				},
			})
		},
	}))

	// Static files for uploads
	app.Static("/uploads", "./uploads")

	// 10. Register routes
	routes.RegisterRoutes(
		app,
		cfg.JWT.Secret,
		db,
		healthH, authH, clubH, teamH, playerH,
		exerciseH, sessionH, assessmentH, matchH,
		analyticsH, parentH, aiH, notifH,
			coachNoteH,
			medicalRecordH,
	)

	// 11. Start server with graceful shutdown
	addr := fmt.Sprintf(":%d", cfg.App.Port)
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)

	go func() {
		log.Info().Str("addr", addr).Msg("server starting")
		if err := app.Listen(addr); err != nil {
			log.Error().Err(err).Msg("server error")
		}
	}()

	<-quit
	log.Info().Msg("shutting down server...")

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if err := app.ShutdownWithContext(ctx); err != nil {
		log.Error().Err(err).Msg("shutdown error")
	}
	log.Info().Msg("server stopped")
}
