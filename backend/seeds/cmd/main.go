package main

import (
	"fmt"
	"os"

	"github.com/coachos/backend/internal/config"
	"github.com/coachos/backend/internal/database"
	"github.com/coachos/backend/internal/domain"
	"github.com/coachos/backend/seeds"
)

func main() {
	cfg, err := config.Load()
	if err != nil {
		fmt.Fprintf(os.Stderr, "failed to load config: %v\n", err)
		os.Exit(1)
	}

	db, err := database.Connect(cfg.DB, cfg.Log.Level)
	if err != nil {
		fmt.Fprintf(os.Stderr, "failed to connect to database: %v\n", err)
		os.Exit(1)
	}

	if err := db.AutoMigrate(domain.AllModels()...); err != nil {
		fmt.Fprintf(os.Stderr, "failed to run migrations: %v\n", err)
		os.Exit(1)
	}
	fmt.Println("Database migrated successfully!")

	if err := seeds.Run(db); err != nil {
		fmt.Fprintf(os.Stderr, "seed failed: %v\n", err)
		os.Exit(1)
	}

	fmt.Println("Database seeded successfully!")
}
