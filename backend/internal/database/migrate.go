package database

import (
	"embed"
	"fmt"
	"log"

	"congres-app/backend/internal/config"

	"github.com/golang-migrate/migrate/v4"
	_ "github.com/golang-migrate/migrate/v4/database/postgres"
	"github.com/golang-migrate/migrate/v4/source/iofs"
	"gorm.io/gorm"
)

//go:embed migrations/*.sql
var migrationsFS embed.FS

func RunMigrations(cfg *config.Config, db *gorm.DB) {
	source, err := iofs.New(migrationsFS, "migrations")
	if err != nil {
		log.Printf("[WARN] Failed to create migration source (golang-migrate): %v", err)
		log.Println("Falling back to GORM AutoMigrate...")
		AutoMigrate(db)
		return
	}

	dsn := fmt.Sprintf("postgres://%s:%s@%s:%s/%s?sslmode=disable",
		cfg.DBUser, cfg.DBPassword, cfg.DBHost, cfg.DBPort, cfg.DBName)

	m, err := migrate.NewWithSourceInstance("iofs", source, dsn)
	if err != nil {
		log.Printf("[WARN] Failed to create migrator: %v", err)
		log.Println("Falling back to GORM AutoMigrate...")
		AutoMigrate(db)
		return
	}

	if err := m.Up(); err != nil && err != migrate.ErrNoChange {
		log.Printf("[WARN] Migration up failed: %v", err)
		log.Println("Falling back to GORM AutoMigrate...")
		AutoMigrate(db)
		return
	}

	log.Println("Database migrations completed successfully")
	source.Close()

	// Also run AutoMigrate for any model changes not yet in SQL migrations
	AutoMigrate(db)
}
