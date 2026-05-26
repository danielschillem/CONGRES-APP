package routes

import (
	"time"

	"congres-app/backend/internal/config"
	"congres-app/backend/internal/handlers"
	"congres-app/backend/internal/middleware"
	"congres-app/backend/internal/services"

	"github.com/gin-gonic/gin"
	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"
	"gorm.io/gorm"
)

func Setup(router *gin.Engine, db *gorm.DB, cfg *config.Config) {
	// Apply global middleware
	router.Use(middleware.CORS(cfg.CORSOrigins))
	router.Use(middleware.SecurityHeaders())

	// Swagger documentation
	router.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))

	// Initialize services
	mailService := services.NewMailService(cfg)

	// Initialize handlers
	authHandler := handlers.NewAuthHandler(db, cfg)
	profileHandler := handlers.NewProfileHandler(db)
	soumissionHandler := handlers.NewSoumissionHandler(db, cfg, mailService)
	adminHandler := handlers.NewAdminHandler(db, mailService, cfg)
	notificationHandler := handlers.NewNotificationHandler(db)
	inscriptionHandler := handlers.NewInscriptionHandler(db, cfg, mailService)
	webhookHandler := handlers.NewWebhookHandler(db, cfg, mailService)
	congressHandler := handlers.NewCongressHandler(db, cfg)
	actorHandler := handlers.NewActorHandler(db, cfg)

	api := router.Group("/api")

	// ─── Auth routes (public, rate-limited) ────────────────────────────
	auth := api.Group("/auth")
	auth.Use(middleware.RateLimit(10, 1*time.Minute))
	{
		auth.POST("/register", authHandler.Register)
		auth.POST("/login", authHandler.Login)
		auth.POST("/refresh", authHandler.Refresh)
		auth.POST("/logout", authHandler.Logout)
	}

	// ─── Webhooks (public) ──────────────────────────────────────────────
	api.POST("/webhooks/orange-money", webhookHandler.HandleOrangeMoneyNotification)

	// ─── Protected routes ──────────────────────────────────────────────
	protected := api.Group("")
	protected.Use(middleware.AuthRequired())
	{
		// Profile
		profile := protected.Group("/profile")
		{
			profile.GET("", profileHandler.GetProfile)
			profile.PATCH("", profileHandler.UpdateProfile)
			profile.PATCH("/password", profileHandler.ChangePassword)
			profile.DELETE("", profileHandler.DeleteProfile)
		}

		// User soumissions
		soumissions := protected.Group("/soumissions")
		{
			soumissions.GET("", soumissionHandler.ListUserSoumissions)
			soumissions.POST("", soumissionHandler.CreateSoumission)
			soumissions.GET("/:id", soumissionHandler.GetSoumission)
			soumissions.PATCH("/:id", soumissionHandler.UpdateSoumission)
			soumissions.DELETE("/:id", soumissionHandler.DeleteSoumission)
		}

		// Notifications
		notifications := protected.Group("/notifications")
		{
			notifications.GET("", notificationHandler.ListNotifications)
			notifications.GET("/unread-count", notificationHandler.GetUnreadCount)
			notifications.PATCH("/:id/read", notificationHandler.MarkAsRead)
			notifications.POST("/read-all", notificationHandler.MarkAllAsRead)
		}

		// Inscriptions
		inscriptions := protected.Group("/inscriptions")
		{
			inscriptions.POST("", inscriptionHandler.CreateInscription)
			inscriptions.GET("/me", inscriptionHandler.GetMyInscription)
			inscriptions.GET("/receipt", inscriptionHandler.DownloadReceipt)
			inscriptions.GET("/badge", inscriptionHandler.DownloadBadge)
			inscriptions.GET("/attestation", inscriptionHandler.DownloadAttestation)
		}

		// ─── Super Admin routes ────────────────────────────────────────
		super := protected.Group("/super")
		super.Use(middleware.SuperAdminRequired())
		{
			// Congress CRUD
			super.POST("/congresses", congressHandler.CreateCongress)
			super.GET("/congresses", congressHandler.ListCongresses)
			super.GET("/congresses/:id", congressHandler.GetCongress)
			super.PATCH("/congresses/:id", congressHandler.UpdateCongress)
			super.DELETE("/congresses/:id", congressHandler.DeleteCongress)

			// Actors overview (all congresses)
			super.GET("/actors", actorHandler.ListActorsForSuperAdmin)
		}

		// ─── Admin routes (super_admin + congress_admin) ───────────────
		admin := protected.Group("/admin")
		admin.Use(middleware.AdminRequired())
		{
			// Congress admin - my congress
			admin.GET("/congress/current", congressHandler.GetCurrentCongress)
			admin.PATCH("/congress/current", congressHandler.UpdateCurrentCongress)

			// Actor management
			admin.POST("/congress/actors", actorHandler.CreateActor)
			admin.GET("/congress/actors", actorHandler.ListActors)
			admin.DELETE("/congress/actors/:id", actorHandler.DeleteActor)

			// Badge generation
			admin.POST("/congress/badges", actorHandler.GenerateBadges)

			// Attestations toggle
			admin.POST("/congress/toggle-attestations", congressHandler.ToggleAttestations)

			// Legacy admin routes (soumissions, inscriptions, users, stats)
			adminSoumissions := admin.Group("/soumissions")
			{
				adminSoumissions.GET("", adminHandler.ListSoumissions)
				adminSoumissions.GET("/export/csv", adminHandler.ExportSoumissionsCSV)
				adminSoumissions.GET("/:id", adminHandler.GetSoumission)
				adminSoumissions.GET("/:id/download", adminHandler.DownloadSoumission)
				adminSoumissions.POST("/:id/approve", adminHandler.ApproveSoumission)
				adminSoumissions.POST("/:id/reject", adminHandler.RejectSoumission)
				adminSoumissions.DELETE("/:id", adminHandler.DeleteSoumission)
			}

			admin.GET("/inscriptions", adminHandler.ListInscriptions)
			admin.GET("/inscriptions/export/csv", adminHandler.ExportInscriptionsCSV)
			admin.PATCH("/inscriptions/:id/confirm-payment", adminHandler.ConfirmPayment)
			admin.GET("/stats", adminHandler.GetStats)
			admin.GET("/users", adminHandler.ListUsers)
			admin.PATCH("/users/:id/deactivate", adminHandler.DeactivateUser)
		}
	}
}
