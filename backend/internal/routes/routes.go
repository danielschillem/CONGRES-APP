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
	virtualHandler := handlers.NewVirtualHandler(db, cfg)
	reviewerHandler := handlers.NewReviewerHandler(db, cfg)
	programHandler := handlers.NewProgramHandler(db, cfg)
	proceedingHandler := handlers.NewProceedingHandler(db, cfg)
	reviewGridHandler := handlers.NewReviewGridHandler(db)
	reviewerInvitationHandler := handlers.NewReviewerInvitationHandler(db, mailService, cfg)
	broadcastHandler := handlers.NewBroadcastHandler(db, mailService, cfg)
	thematicCoordinatorHandler := handlers.NewThematicCoordinatorHandler(db)

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

	// ─── Congresses (public) ────────────────────────────────────────────
	api.GET("/congresses", congressHandler.ListActiveCongresses)
	api.GET("/congresses/:id", congressHandler.GetPublicCongress)

	// ─── Webhooks (public) ──────────────────────────────────────────────
	api.POST("/webhooks/orange-money", webhookHandler.HandleOrangeMoneyNotification)

	// ─── Reviewer invitation acceptance (public) ────────────────────────
	api.POST("/reviewer/invitations/accept", reviewerInvitationHandler.AcceptInvitation)

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
			inscriptions.GET("", inscriptionHandler.ListMyInscriptions)
			inscriptions.GET("/me", inscriptionHandler.GetMyInscription)
			inscriptions.GET("/receipt", inscriptionHandler.DownloadReceipt)
			inscriptions.GET("/badge", inscriptionHandler.DownloadBadge)
			inscriptions.GET("/attestation", inscriptionHandler.DownloadAttestation)
			inscriptions.GET("/:id", inscriptionHandler.GetInscription)
			inscriptions.GET("/:id/receipt", inscriptionHandler.DownloadInscriptionReceipt)
			inscriptions.GET("/:id/badge", inscriptionHandler.DownloadInscriptionBadge)
			inscriptions.GET("/:id/attestation", inscriptionHandler.DownloadInscriptionAttestation)
		}

		// ─── Super Admin routes ────────────────────────────────────────
		super := protected.Group("/super")
		super.Use(middleware.SuperAdminRequired())
		{
			super.POST("/congresses", congressHandler.CreateCongress)
			super.GET("/congresses", congressHandler.ListCongresses)
			super.GET("/congresses/:id", congressHandler.GetCongress)
			super.PATCH("/congresses/:id", congressHandler.UpdateCongress)
			super.DELETE("/congresses/:id", congressHandler.DeleteCongress)
			super.GET("/actors", actorHandler.ListActorsForSuperAdmin)
		}

		// ─── Admin routes (super_admin + congress_admin) ───────────────
		admin := protected.Group("/admin")
		admin.Use(middleware.AdminRequired())
		{
			admin.GET("/congress/current", congressHandler.GetCurrentCongress)
			admin.PATCH("/congress/current", congressHandler.UpdateCurrentCongress)
			admin.POST("/congress/actors", actorHandler.CreateActor)
			admin.GET("/congress/actors", actorHandler.ListActors)
			admin.DELETE("/congress/actors/:id", actorHandler.DeleteActor)
			admin.POST("/congress/badges", actorHandler.GenerateBadges)
			admin.POST("/congress/toggle-attestations", congressHandler.ToggleAttestations)

			// Reviewer assignment & reviews
			admin.POST("/soumissions/:id/assign-reviewer", adminHandler.AssignReviewer)
			admin.GET("/soumissions/:id/reviews", reviewerHandler.ListReviewsForSubmission)
			admin.GET("/soumissions/:id/review-stats", reviewerHandler.GetReviewStats)

			// Legacy admin routes
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

			// Program slots
			program := admin.Group("/program")
			{
				program.POST("/slots", programHandler.AdminCreateSlot)
				program.GET("/slots", programHandler.AdminListSlots)
				program.GET("/slots/:id", programHandler.AdminGetSlot)
				program.PATCH("/slots/:id", programHandler.AdminUpdateSlot)
				program.DELETE("/slots/:id", programHandler.AdminDeleteSlot)
				program.GET("/available-soumissions", programHandler.ListAvailableSoumissions)
				program.GET("/dates", programHandler.AdminListDates)
			}

			// Proceedings
			proceedings := admin.Group("/proceedings")
			{
				proceedings.POST("", proceedingHandler.AdminCreateProceeding)
				proceedings.GET("", proceedingHandler.AdminListProceedings)
				proceedings.GET("/:id", proceedingHandler.AdminGetProceeding)
				proceedings.PATCH("/:id", proceedingHandler.AdminUpdateProceeding)
				proceedings.DELETE("/:id", proceedingHandler.AdminDeleteProceeding)
				proceedings.POST("/:id/submissions", proceedingHandler.AdminAddSubmission)
				proceedings.DELETE("/:id/submissions/:soumissionId", proceedingHandler.AdminRemoveSubmission)
			}

			// Virtual sessions
			virtual := admin.Group("/virtual/sessions")
			{
				virtual.POST("", virtualHandler.AdminCreateSession)
				virtual.GET("", virtualHandler.AdminListSessions)
				virtual.GET("/:id", virtualHandler.AdminGetSession)
				virtual.PATCH("/:id", virtualHandler.AdminUpdateSession)
				virtual.DELETE("/:id", virtualHandler.AdminDeleteSession)
				virtual.POST("/:id/start", virtualHandler.AdminStartSession)
				virtual.POST("/:id/end", virtualHandler.AdminEndSession)
				virtual.GET("/:id/attendance", virtualHandler.AdminGetAttendance)
			}

			// ─── Review Grids ──────────────────────────────────────────
			admin.GET("/review-grids", reviewGridHandler.ListGrids)
			admin.POST("/review-grids", reviewGridHandler.CreateGrid)
			admin.PATCH("/review-grids/:id", reviewGridHandler.UpdateGrid)
			admin.DELETE("/review-grids/:id", reviewGridHandler.DeleteGrid)
			admin.GET("/review-grids/active", reviewGridHandler.GetActiveGrid)
			admin.GET("/review-grids/:id/criteria", reviewGridHandler.ListCriteria)
			admin.POST("/review-grids/:id/criteria", reviewGridHandler.CreateCriterion)
			admin.PATCH("/review-grids/:id/criteria/:criterionId", reviewGridHandler.UpdateCriterion)
			admin.DELETE("/review-grids/:id/criteria/:criterionId", reviewGridHandler.DeleteCriterion)

			// ─── Reviewer Invitations ──────────────────────────────────
			admin.GET("/reviewer-invitations", reviewerInvitationHandler.ListInvitations)
			admin.POST("/reviewer-invitations", reviewerInvitationHandler.InviteReviewer)
			admin.POST("/reviewer-invitations/batch", reviewerInvitationHandler.InviteReviewersBatch)
			admin.POST("/reviewer-invitations/:id/resend", reviewerInvitationHandler.ResendInvitation)
			admin.POST("/reviewer-invitations/:id/cancel", reviewerInvitationHandler.CancelInvitation)
			admin.POST("/reviewer-invitations/send-reminders", reviewerInvitationHandler.SendReminders)
			admin.GET("/reviewers/stats", reviewerInvitationHandler.ListReviewersWithStats)

			// ─── Thematic Coordinators ─────────────────────────────────
			admin.GET("/thematic-coordinators", thematicCoordinatorHandler.ListCoordinators)
			admin.POST("/thematic-coordinators", thematicCoordinatorHandler.SetCoordinator)
			admin.DELETE("/thematic-coordinators", thematicCoordinatorHandler.RemoveCoordinator)

			// ─── Broadcast Messages ────────────────────────────────────
			admin.GET("/broadcasts", broadcastHandler.ListBroadcasts)
			admin.POST("/broadcasts", broadcastHandler.CreateBroadcast)
			admin.POST("/broadcasts/create-and-send", broadcastHandler.CreateAndSendBroadcast)
			admin.POST("/broadcasts/:id/send", broadcastHandler.SendBroadcast)
			admin.GET("/broadcasts/:id", broadcastHandler.GetBroadcast)
			admin.DELETE("/broadcasts/:id", broadcastHandler.DeleteBroadcast)
			admin.GET("/broadcasts/stats", broadcastHandler.GetBroadcastStats)
			admin.GET("/broadcasts/targets", broadcastHandler.GetAvailableTargets)
		}

		// Virtual sessions (user-facing)
		virtualUser := protected.Group("/virtual")
		{
			virtualUser.GET("/sessions", virtualHandler.ListSessions)
			virtualUser.GET("/sessions/:id", virtualHandler.GetSession)
			virtualUser.POST("/sessions/:id/join", virtualHandler.JoinSession)
			virtualUser.POST("/sessions/:id/leave", virtualHandler.LeaveSession)
			virtualUser.GET("/my-sessions", virtualHandler.MyUpcomingSessions)
		}

		// Reviewer routes
		reviewer := protected.Group("/reviewer")
		reviewer.Use(middleware.ReviewerRequired())
		{
			reviewer.GET("/assignments", reviewerHandler.ListMyAssignments)
			reviewer.POST("/assignments/:id/start", reviewerHandler.StartReview)
			reviewer.POST("/assignments/:id/submit", reviewerHandler.SubmitReview)

			// Reviewer can get active review grid
			reviewer.GET("/review-grid/active", reviewGridHandler.GetActiveGrid)
		}

		// Public program routes (authenticated users)
		protected.GET("/congresses/:congressId/program", programHandler.PublicListProgram)
		protected.GET("/congresses/:congressId/program/dates", programHandler.PublicListDates)
		protected.GET("/congresses/:congressId/proceedings", proceedingHandler.PublicListProceedings)
		protected.GET("/proceedings/:id", proceedingHandler.PublicGetProceeding)
	}
}
