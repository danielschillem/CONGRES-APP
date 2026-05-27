package handlers

import (
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"log"
	"net/http"
	"time"

	"congres-app/backend/internal/config"
	"congres-app/backend/internal/models"
	"congres-app/backend/internal/services"
	"congres-app/backend/pkg/utils"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

type ReviewerInvitationHandler struct {
	db   *gorm.DB
	mail *services.MailService
	cfg  *config.Config
}

func NewReviewerInvitationHandler(db *gorm.DB, mail *services.MailService, cfg *config.Config) *ReviewerInvitationHandler {
	return &ReviewerInvitationHandler{db: db, mail: mail, cfg: cfg}
}

type InviteReviewerRequest struct {
	Email     string `json:"email" binding:"required,email"`
	Nom       string `json:"nom"`
	Prenom    string `json:"prenom"`
	Organisme string `json:"organisme"`
	Message   string `json:"message"`
}

type InviteReviewersBatchRequest struct {
	Invitations []InviteReviewerRequest `json:"invitations" binding:"required,min=1,dive"`
	Message     string                  `json:"message"`
}

func generateToken() string {
	b := make([]byte, 32)
	rand.Read(b)
	return hex.EncodeToString(b)
}

// InviteReviewer sends an invitation to a potential reviewer
func (h *ReviewerInvitationHandler) InviteReviewer(c *gin.Context) {
	congressID, _, err := getCongressIDFromContext(c)
	if err != nil {
		utils.RespondError(c, http.StatusForbidden, err.Error())
		return
	}

	var req InviteReviewerRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.RespondError(c, http.StatusBadRequest, err.Error())
		return
	}

	// Check if already invited
	var existing int64
	h.db.Model(&models.ReviewerInvitation{}).
		Where("email = ? AND congress_id = ? AND status IN ('pending','accepted')", req.Email, congressID).
		Count(&existing)
	if existing > 0 {
		utils.RespondError(c, http.StatusConflict, "This email has already been invited")
		return
	}

	// Check if already a reviewer for this congress
	var existingUser int64
	h.db.Model(&models.User{}).
		Where("email = ? AND congress_id = ? AND role = ?", req.Email, congressID, "reviewer").
		Count(&existingUser)
	if existingUser > 0 {
		utils.RespondError(c, http.StatusConflict, "This email is already a reviewer for this congress")
		return
	}

	token := generateToken()
	invitation := models.ReviewerInvitation{
		CongressID: congressID,
		Email:      req.Email,
		Nom:        req.Nom,
		Prenom:     req.Prenom,
		Organisme:  req.Organisme,
		Token:      token,
		Status:     "pending",
		InvitedAt:  time.Now(),
		ExpiresAt:  time.Now().Add(14 * 24 * time.Hour), // 14 days
		Message:    req.Message,
	}

	if err := h.db.Create(&invitation).Error; err != nil {
		utils.RespondError(c, http.StatusInternalServerError, "Failed to create invitation")
		return
	}

	// Send invitation email
	go func() {
		defer func() {
			if r := recover(); r != nil {
				log.Printf("[PANIC] InviteReviewer mail: %v", r)
			}
		}()

		var congress models.Congress
		if err := h.db.First(&congress, "id = ?", congressID).Error; err == nil {
			acceptURL := fmt.Sprintf("%s/reviewer/invitations/accept?token=%s", h.cfg.AppBaseURL, token)
			h.mail.ReviewerInvitation(req.Email, req.Prenom, req.Nom, congress.Title, acceptURL, req.Message)
		}
	}()

	utils.RespondSuccess(c, http.StatusCreated, invitation)
}

// InviteReviewersBatch sends multiple invitations at once
func (h *ReviewerInvitationHandler) InviteReviewersBatch(c *gin.Context) {
	congressID, _, err := getCongressIDFromContext(c)
	if err != nil {
		utils.RespondError(c, http.StatusForbidden, err.Error())
		return
	}

	var req InviteReviewersBatchRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.RespondError(c, http.StatusBadRequest, err.Error())
		return
	}

	type result struct {
		Email  string `json:"email"`
		Status string `json:"status"`
		Error  string `json:"error,omitempty"`
	}

	results := []result{}

	for _, inv := range req.Invitations {
		// Check existing
		var existing int64
		h.db.Model(&models.ReviewerInvitation{}).
			Where("email = ? AND congress_id = ? AND status IN ('pending','accepted')", inv.Email, congressID).
			Count(&existing)
		if existing > 0 {
			results = append(results, result{Email: inv.Email, Status: "skipped", Error: "Already invited"})
			continue
		}

		var existingUser int64
		h.db.Model(&models.User{}).
			Where("email = ? AND congress_id = ? AND role = ?", inv.Email, congressID, "reviewer").
			Count(&existingUser)
		if existingUser > 0 {
			results = append(results, result{Email: inv.Email, Status: "skipped", Error: "Already a reviewer"})
			continue
		}

		token := generateToken()
		invitation := models.ReviewerInvitation{
			CongressID: congressID,
			Email:      inv.Email,
			Nom:        inv.Nom,
			Prenom:     inv.Prenom,
			Organisme:  inv.Organisme,
			Token:      token,
			Status:     "pending",
			InvitedAt:  time.Now(),
			ExpiresAt:  time.Now().Add(14 * 24 * time.Hour),
			Message:    req.Message,
		}

		if err := h.db.Create(&invitation).Error; err != nil {
			results = append(results, result{Email: inv.Email, Status: "failed", Error: err.Error()})
			continue
		}

		// Send email async
		go func(email, prenom, nom, token string) {
			defer func() {
				if r := recover(); r != nil {
					log.Printf("[PANIC] InviteReviewersBatch mail: %v", r)
				}
			}()
			var congress models.Congress
			if err := h.db.First(&congress, "id = ?", congressID).Error; err == nil {
				acceptURL := fmt.Sprintf("%s/reviewer/invitations/accept?token=%s", h.cfg.AppBaseURL, token)
				h.mail.ReviewerInvitation(email, prenom, nom, congress.Title, acceptURL, req.Message)
			}
		}(inv.Email, inv.Prenom, inv.Nom, token)

		results = append(results, result{Email: inv.Email, Status: "invited"})
	}

	utils.RespondSuccess(c, http.StatusOK, gin.H{"results": results, "total": len(req.Invitations), "sent": len(results)})
}

// ListInvitations lists all reviewer invitations for the congress
func (h *ReviewerInvitationHandler) ListInvitations(c *gin.Context) {
	congressID, _, err := getCongressIDFromContext(c)
	if err != nil {
		utils.RespondError(c, http.StatusForbidden, err.Error())
		return
	}

	statusFilter := c.Query("status")
	query := h.db.Where("congress_id = ?", congressID).Order("created_at desc")

	if statusFilter != "" {
		query = query.Where("status = ?", statusFilter)
	}

	var invitations []models.ReviewerInvitation
	if err := query.Find(&invitations).Error; err != nil {
		utils.RespondError(c, http.StatusInternalServerError, "Failed to fetch invitations")
		return
	}

	utils.RespondSuccess(c, http.StatusOK, invitations)
}

// ResendInvitation resends the invitation email
func (h *ReviewerInvitationHandler) ResendInvitation(c *gin.Context) {
	congressID, _, err := getCongressIDFromContext(c)
	if err != nil {
		utils.RespondError(c, http.StatusForbidden, err.Error())
		return
	}

	invID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		utils.RespondError(c, http.StatusBadRequest, "Invalid invitation ID")
		return
	}

	var inv models.ReviewerInvitation
	if err := h.db.Where("id = ? AND congress_id = ?", invID, congressID).First(&inv).Error; err != nil {
		utils.RespondError(c, http.StatusNotFound, "Invitation not found")
		return
	}

	if inv.Status == "accepted" {
		utils.RespondError(c, http.StatusBadRequest, "Cannot resend invitation that has been accepted")
		return
	}

	// Generate new token
	newToken := generateToken()
	now := time.Now()
	h.db.Model(&inv).Updates(map[string]interface{}{
		"token":            newToken,
		"status":           "pending",
		"expires_at":       time.Now().Add(14 * 24 * time.Hour),
		"last_reminder_at": &now,
		"reminder_count":   inv.ReminderCount + 1,
	})

	// Send email
	go func() {
		defer func() {
			if r := recover(); r != nil {
				log.Printf("[PANIC] ResendInvitation mail: %v", r)
			}
		}()
		var congress models.Congress
		if err := h.db.First(&congress, "id = ?", congressID).Error; err == nil {
			acceptURL := fmt.Sprintf("%s/reviewer/invitations/accept?token=%s", h.cfg.AppBaseURL, newToken)
			h.mail.ReviewerInvitation(inv.Email, inv.Prenom, inv.Nom, congress.Title, acceptURL, inv.Message)
		}
	}()

	utils.RespondSuccess(c, http.StatusOK, gin.H{"message": "Invitation resent"})
}

// CancelInvitation cancels a pending invitation
func (h *ReviewerInvitationHandler) CancelInvitation(c *gin.Context) {
	congressID, _, err := getCongressIDFromContext(c)
	if err != nil {
		utils.RespondError(c, http.StatusForbidden, err.Error())
		return
	}

	invID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		utils.RespondError(c, http.StatusBadRequest, "Invalid invitation ID")
		return
	}

	var inv models.ReviewerInvitation
	if err := h.db.Where("id = ? AND congress_id = ?", invID, congressID).First(&inv).Error; err != nil {
		utils.RespondError(c, http.StatusNotFound, "Invitation not found")
		return
	}

	if inv.Status == "accepted" {
		utils.RespondError(c, http.StatusBadRequest, "Cannot cancel an accepted invitation")
		return
	}

	h.db.Model(&inv).Update("status", "cancelled")

	utils.RespondSuccess(c, http.StatusOK, gin.H{"message": "Invitation cancelled"})
}

// AcceptInvitation is called by the reviewer to accept an invitation (public endpoint)
func (h *ReviewerInvitationHandler) AcceptInvitation(c *gin.Context) {
	token := c.Query("token")
	if token == "" {
		utils.RespondError(c, http.StatusBadRequest, "Token is required")
		return
	}

	var inv models.ReviewerInvitation
	if err := h.db.Where("token = ? AND status = ?", token, "pending").First(&inv).Error; err != nil {
		utils.RespondError(c, http.StatusNotFound, "Invalid or expired invitation")
		return
	}

	if time.Now().After(inv.ExpiresAt) {
		h.db.Model(&inv).Update("status", "expired")
		utils.RespondError(c, http.StatusGone, "Invitation has expired")
		return
	}

	// If user exists with this email, link them. Otherwise create account.
	var user models.User
	now := time.Now()
	if err := h.db.Where("email = ?", inv.Email).First(&user).Error; err != nil {
		// Generate temporary password for new user
		tempPass := generateToken()[:12]
		hashedPassword, _ := bcrypt.GenerateFromPassword([]byte(tempPass), bcrypt.DefaultCost)

		organisme := inv.Organisme
		user = models.User{
			ID:         uuid.New(),
			Email:      inv.Email,
			Nom:        inv.Nom,
			Prenom:     inv.Prenom,
			Organisme:  &organisme,
			Password:   string(hashedPassword),
			Role:       "reviewer",
			CongressID: &inv.CongressID,
			Active:     true,
		}
		if err := h.db.Create(&user).Error; err != nil {
			utils.RespondError(c, http.StatusInternalServerError, "Failed to create reviewer account")
			return
		}

		// Send welcome email with temp password
		go func() {
			defer func() {
				if r := recover(); r != nil {
					log.Printf("[PANIC] AcceptInvitation mail: %v", r)
				}
			}()
			h.mail.ReviewerWelcome(inv.Email, inv.Prenom, inv.Nom, tempPass, h.cfg.AppBaseURL+"/login")
		}()
	} else {
		// Existing user: update role and congress_id
		h.db.Model(&user).Updates(map[string]interface{}{
			"role":        "reviewer",
			"congress_id": inv.CongressID,
			"active":      true,
		})
	}

	// Update invitation
	h.db.Model(&inv).Updates(map[string]interface{}{
		"status":       "accepted",
		"reviewer_id":  user.ID,
		"responded_at": &now,
	})

	// Create in-app notification
	go createUserNotification(h.db, "invitation_accepted", user.ID, &inv,
		fmt.Sprintf("Bienvenue ! Vous êtes maintenant relecteur pour le congrès. Vous pouvez commencer à évaluer les soumissions."))

	utils.RespondSuccess(c, http.StatusOK, gin.H{
		"message": "Invitation accepted successfully",
		"email":   inv.Email,
	})
}

// SendReminders sends reminders to reviewers with pending reviews
func (h *ReviewerInvitationHandler) SendReminders(c *gin.Context) {
	congressID, _, err := getCongressIDFromContext(c)
	if err != nil {
		utils.RespondError(c, http.StatusForbidden, err.Error())
		return
	}

	// Find all reviewers with assigned/in_progress reviews that are overdue
	type ReviewDue struct {
		ReviewerID    uuid.UUID
		ReviewerName  string
		ReviewerEmail string
		PendingCount  int64
	}

	var results []ReviewDue
	h.db.Raw(`
		SELECT u.id as reviewer_id, u.prenom || ' ' || u.nom as reviewer_name, u.email as reviewer_email,
			COUNT(r.id) as pending_count
		FROM reviews r
		JOIN users u ON u.id = r.reviewer_id
		JOIN soumissions s ON s.id = r.soumission_id
		WHERE r.status IN ('assigned', 'in_progress')
		AND u.congress_id = ?
		GROUP BY u.id, u.prenom, u.nom, u.email
	`, congressID).Scan(&results)

	sent := 0
	for _, r := range results {
		if r.ReviewerEmail == "" {
			continue
		}
		go func(email, name string, count int64) {
			defer func() {
				if r := recover(); r != nil {
					log.Printf("[PANIC] SendReminders mail: %v", r)
				}
			}()
			h.mail.ReviewReminder(email, name, int(count), h.cfg.AppBaseURL+"/reviewer/dashboard")
		}(r.ReviewerEmail, r.ReviewerName, r.PendingCount)
		sent++
	}

	utils.RespondSuccess(c, http.StatusOK, gin.H{
		"message": fmt.Sprintf("Reminders sent to %d reviewer(s)", sent),
		"sent":    sent,
		"total":   len(results),
	})
}

// ListReviewersWithStats returns all reviewers with their review counts
func (h *ReviewerInvitationHandler) ListReviewersWithStats(c *gin.Context) {
	congressID, _, err := getCongressIDFromContext(c)
	if err != nil {
		utils.RespondError(c, http.StatusForbidden, err.Error())
		return
	}

	type ReviewerStat struct {
		models.User
		AssignedCount   int64 `json:"assigned_count"`
		InProgressCount int64 `json:"in_progress_count"`
		CompletedCount  int64 `json:"completed_count"`
		TotalCount      int64 `json:"total_count"`
	}

	var reviewers []models.User
	h.db.Where("congress_id = ? AND role = ?", congressID, "reviewer").Order("created_at desc").Find(&reviewers)

	stats := []ReviewerStat{}
	for _, r := range reviewers {
		var assigned, inProgress, completed int64
		h.db.Model(&models.Review{}).Where("reviewer_id = ? AND status = ?", r.ID, "assigned").Count(&assigned)
		h.db.Model(&models.Review{}).Where("reviewer_id = ? AND status = ?", r.ID, "in_progress").Count(&inProgress)
		h.db.Model(&models.Review{}).Where("reviewer_id = ? AND status = ?", r.ID, "completed").Count(&completed)

		stats = append(stats, ReviewerStat{
			User:            r,
			AssignedCount:   assigned,
			InProgressCount: inProgress,
			CompletedCount:  completed,
			TotalCount:      assigned + inProgress + completed,
		})
	}

	utils.RespondSuccess(c, http.StatusOK, stats)
}
