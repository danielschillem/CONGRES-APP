// @title           Congrès API
// @version         1.0
// @description     API de gestion des congrès, soumissions et inscriptions
// @host            localhost:8080
// @BasePath        /api

// @securityDefinitions.apikey BearerAuth
// @in              header
// @name            Authorization
// @description     Bearer JWT token
package main

import (
	"log"
	"os"
	"strings"

	"congres-app/backend/internal/config"
	"congres-app/backend/internal/database"
	"congres-app/backend/internal/models"
	"congres-app/backend/internal/routes"
	"congres-app/backend/pkg/utils"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

func main() {
	// Load configuration
	cfg := config.Load()

	// Connect to database
	db := database.Connect(cfg)

	// Run migrations
	database.AutoMigrate(db)

	// Ensure upload directory exists
	if err := os.MkdirAll(cfg.UploadPath, 0700); err != nil {
		log.Fatalf("Failed to create upload directory: %v", err)
	}

	// Seed admin user
	seedAdmin(db, cfg)

	// Set Gin mode: default to release, override via GIN_MODE env var
	mode := os.Getenv("GIN_MODE")
	if mode == "" {
		mode = gin.ReleaseMode
	}
	gin.SetMode(mode)

	// Setup Gin router
	router := gin.New()
	router.Use(gin.Logger(), gin.Recovery())

	// Trust proxies - default to private ranges, configurable via TRUSTED_PROXIES
	trustedProxies := os.Getenv("TRUSTED_PROXIES")
	if trustedProxies == "" {
		trustedProxies = "10.0.0.0/8,172.16.0.0/12,192.168.0.0/16"
	}
	if err := router.SetTrustedProxies(strings.Split(trustedProxies, ",")); err != nil {
		log.Printf("Warning: invalid TRUSTED_PROXIES value %q: %v", trustedProxies, err)
	}

	// Increase max multipart memory to 50 MB for file uploads
	router.MaxMultipartMemory = 50 << 20

	// Register all routes
	routes.Setup(router, db, cfg)

	// Start server
	addr := ":" + cfg.Port
	log.Printf("Server starting on %s", addr)
	if err := router.Run(addr); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}

// seedAdmin creates the default admin user if one does not already exist.
// The admin password is read from the ADMIN_PASSWORD env var (default: "password123").
func seedAdmin(db *gorm.DB, cfg *config.Config) {
	const adminEmail = "admin@gestion.bf"
	adminPassword := os.Getenv("ADMIN_PASSWORD")
	if adminPassword == "" {
		adminPassword = "password123"
		log.Println("Warning: using default admin password, set ADMIN_PASSWORD env var")
	}

	hashedPassword, err := utils.HashPassword(adminPassword)
	if err != nil {
		log.Printf("Warning: failed to hash admin password: %v", err)
		return
	}

	var existing models.User
	err = db.Where("email = ?", adminEmail).First(&existing).Error
	if err == nil {
		if err := db.Model(&existing).Updates(map[string]interface{}{
			"password": hashedPassword,
			"role":     "super_admin",
			"active":   true,
		}).Error; err != nil {
			log.Printf("Warning: failed to update super admin user: %v", err)
			return
		}
		log.Printf("Super admin user ready: %s", adminEmail)
		return
	}

	if err != gorm.ErrRecordNotFound {
		log.Printf("Warning: could not check for super admin user: %v", err)
		return
	}

	admin := models.User{
		ID:        uuid.New(),
		Civilite:  "M.",
		Nom:       "Admin",
		Prenom:    "Système",
		Sexe:      "M",
		Telephone: "00000000",
		Email:     adminEmail,
		Password:  hashedPassword,
		Role:      "super_admin",
	}

	if err := db.Create(&admin).Error; err != nil {
		log.Printf("Warning: failed to create admin user: %v", err)
		return
	}

	log.Printf("Admin user created: %s", adminEmail)
}
