package routes

import (
	"congres-app/backend/internal/config"
	"congres-app/backend/internal/handlers"
	"congres-app/backend/internal/middleware"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

func Setup(router *gin.Engine, db *gorm.DB, cfg *config.Config) {
	// Apply CORS middleware globally
	router.Use(middleware.CORS())

	// Initialize handlers
	authHandler := handlers.NewAuthHandler(db, cfg)
	profileHandler := handlers.NewProfileHandler(db)
	soumissionHandler := handlers.NewSoumissionHandler(db, cfg)
	adminHandler := handlers.NewAdminHandler(db)
	notificationHandler := handlers.NewNotificationHandler(db)
	inscriptionHandler := handlers.NewInscriptionHandler(db, cfg)

	api := router.Group("/api")

	// ─── Auth routes (public) ──────────────────────────────────────────
	auth := api.Group("/auth")
	{
		auth.POST("/register", authHandler.Register)
		auth.POST("/login", authHandler.Login)
		auth.POST("/refresh", authHandler.Refresh)
	}

	// ─── Protected routes ──────────────────────────────────────────────
	protected := api.Group("")
	protected.Use(middleware.AuthRequired())
	{
		// Profile
		profile := protected.Group("/profile")
		{
			profile.GET("", profileHandler.GetProfile)
			profile.PATCH("", profileHandler.UpdateProfile)
			profile.DELETE("", profileHandler.DeleteProfile)
		}

		// User soumissions
		soumissions := protected.Group("/soumissions")
		{
			soumissions.GET("", soumissionHandler.ListUserSoumissions)
			soumissions.POST("", soumissionHandler.CreateSoumission)
			soumissions.GET("/:id", soumissionHandler.GetSoumission)
			soumissions.PATCH("/:id", soumissionHandler.UpdateSoumission)
		}

		// Notifications
		notifications := protected.Group("/notifications")
		{
			notifications.GET("", notificationHandler.ListNotifications)
			notifications.GET("/unread-count", notificationHandler.GetUnreadCount)
			notifications.PATCH("/:id/read", notificationHandler.MarkAsRead)
		}

		// Inscriptions
		inscriptions := protected.Group("/inscriptions")
		{
			inscriptions.POST("", inscriptionHandler.CreateInscription)
		}

		// Admin routes
		admin := protected.Group("/admin")
		admin.Use(middleware.AdminRequired())
		{
			// Soumissions management
			adminSoumissions := admin.Group("/soumissions")
			{
				adminSoumissions.GET("", adminHandler.ListSoumissions)
				adminSoumissions.GET("/:id", adminHandler.GetSoumission)
				adminSoumissions.GET("/:id/download", adminHandler.DownloadSoumission)
				adminSoumissions.POST("/:id/approve", adminHandler.ApproveSoumission)
				adminSoumissions.POST("/:id/reject", adminHandler.RejectSoumission)
				adminSoumissions.DELETE("/:id", adminHandler.DeleteSoumission)
			}

			// Stats and users
			admin.GET("/stats", adminHandler.GetStats)
			admin.GET("/users", adminHandler.ListUsers)
		}
	}
}
