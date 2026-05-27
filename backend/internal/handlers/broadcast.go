package handlers

import (
	"fmt"
	"log"
	"net/http"
	"time"

	"congres-app/backend/internal/config"
	"congres-app/backend/internal/middleware"
	"congres-app/backend/internal/models"
	"congres-app/backend/internal/services"
	"congres-app/backend/pkg/utils"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type BroadcastHandler struct {
	db   *gorm.DB
	mail *services.MailService
	cfg  *config.Config
}

func NewBroadcastHandler(db *gorm.DB, mail *services.MailService, cfg *config.Config) *BroadcastHandler {
	return &BroadcastHandler{db: db, mail: mail, cfg: cfg}
}

type CreateBroadcastRequest struct {
	Subject    string `json:"subject" binding:"required,max=200"`
	Body       string `json:"body" binding:"required"`
	TargetType string `json:"target_type" binding:"required"`
}

// CreateBroadcast creates and optionally sends a broadcast message
func (h *BroadcastHandler) CreateBroadcast(c *gin.Context) {
	congressID, _, err := getCongressIDFromContext(c)
	if err != nil {
		utils.RespondError(c, http.StatusForbidden, err.Error())
		return
	}

	userIDStr, _ := c.Get(middleware.ContextUserID)
	userID, _ := uuid.Parse(userIDStr.(string))

	var req CreateBroadcastRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.RespondError(c, http.StatusBadRequest, err.Error())
		return
	}

	allowedTargets := map[string]bool{
		"all_inscrits":     true,
		"all_confirmed":    true,
		"all_submitters":   true,
		"all_reviewers":    true,
		"all_participants": true,
	}
	if !allowedTargets[req.TargetType] {
		utils.RespondError(c, http.StatusBadRequest,
			"target_type must be one of: all_inscrits, all_confirmed, all_submitters, all_reviewers, all_participants")
		return
	}

	msg := models.BroadcastMessage{
		CongressID: congressID,
		Subject:    req.Subject,
		Body:       req.Body,
		TargetType: req.TargetType,
		CreatedBy:  userID,
	}

	if err := h.db.Create(&msg).Error; err != nil {
		utils.RespondError(c, http.StatusInternalServerError, "Failed to create broadcast message")
		return
	}

	utils.RespondSuccess(c, http.StatusCreated, msg)
}

// SendBroadcast sends a broadcast message to its target audience
func (h *BroadcastHandler) SendBroadcast(c *gin.Context) {
	congressID, _, err := getCongressIDFromContext(c)
	if err != nil {
		utils.RespondError(c, http.StatusForbidden, err.Error())
		return
	}

	msgID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		utils.RespondError(c, http.StatusBadRequest, "Invalid message ID")
		return
	}

	var msg models.BroadcastMessage
	if err := h.db.Where("id = ? AND congress_id = ?", msgID, congressID).First(&msg).Error; err != nil {
		utils.RespondError(c, http.StatusNotFound, "Broadcast message not found")
		return
	}

	if msg.SentAt != nil {
		utils.RespondError(c, http.StatusBadRequest, "Message has already been sent")
		return
	}

	// Find target users
	userIDs, err := h.getTargetUserIDs(congressID, msg.TargetType)
	if err != nil {
		utils.RespondError(c, http.StatusInternalServerError, "Failed to determine target users")
		return
	}

	if len(userIDs) == 0 {
		utils.RespondError(c, http.StatusBadRequest, "No users match the target criteria")
		return
	}

	now := time.Now()
	sentCount := 0

	for _, uid := range userIDs {
		var user models.User
		if err := h.db.First(&user, "id = ?", uid).Error; err != nil {
			continue
		}

		// Create notification
		go createUserNotification(h.db, "broadcast", user.ID, &msg,
			msg.Subject+"\n\n"+msg.Body,
		)

		// Send email
		go func(u models.User) {
			defer func() {
				if r := recover(); r != nil {
					log.Printf("[PANIC] SendBroadcast mail: %v", r)
				}
			}()
			if u.Email != "" {
				h.mail.BroadcastMessage(u.Email, u.Prenom, u.Nom, msg.Subject, msg.Body, h.cfg.AppBaseURL+"/notifications")
			}
		}(user)

		// Create recipient record
		recipient := models.BroadcastRecipient{
			BroadcastMessageID: msg.ID,
			UserID:             uid,
			Email:              user.Email,
			SentViaEmail:       user.Email != "",
			SentViaNotif:       true,
			SentAt:             &now,
		}
		h.db.Create(&recipient)
		sentCount++
	}

	h.db.Model(&msg).Updates(map[string]interface{}{
		"sent_at":    now,
		"sent_count": sentCount,
	})

	utils.RespondSuccess(c, http.StatusOK, gin.H{
		"message":    fmt.Sprintf("Message sent to %d recipient(s)", sentCount),
		"sent_count": sentCount,
	})
}

// ListBroadcasts lists all broadcast messages
func (h *BroadcastHandler) ListBroadcasts(c *gin.Context) {
	congressID, _, err := getCongressIDFromContext(c)
	if err != nil {
		utils.RespondError(c, http.StatusForbidden, err.Error())
		return
	}

	var messages []models.BroadcastMessage
	if err := h.db.Where("congress_id = ?", congressID).Order("created_at desc").Find(&messages).Error; err != nil {
		utils.RespondError(c, http.StatusInternalServerError, "Failed to fetch broadcast messages")
		return
	}

	// Attach recipient counts
	type countResult struct {
		BroadcastMessageID uuid.UUID
		Total              int64
		ReadCount          int64
	}

	type enrichedMsg struct {
		models.BroadcastMessage
		RecipientCount int64 `json:"recipient_count"`
		ReadCount      int64 `json:"read_count"`
	}

	enriched := []enrichedMsg{}
	for _, m := range messages {
		var total, read int64
		h.db.Model(&models.BroadcastRecipient{}).Where("broadcast_message_id = ?", m.ID).Count(&total)
		h.db.Model(&models.BroadcastRecipient{}).Where("broadcast_message_id = ? AND read_at IS NOT NULL", m.ID).Count(&read)
		enriched = append(enriched, enrichedMsg{
			BroadcastMessage: m,
			RecipientCount:   total,
			ReadCount:        read,
		})
	}

	utils.RespondSuccess(c, http.StatusOK, enriched)
}

// GetBroadcast returns a single broadcast with recipient details
func (h *BroadcastHandler) GetBroadcast(c *gin.Context) {
	congressID, _, err := getCongressIDFromContext(c)
	if err != nil {
		utils.RespondError(c, http.StatusForbidden, err.Error())
		return
	}

	msgID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		utils.RespondError(c, http.StatusBadRequest, "Invalid message ID")
		return
	}

	var msg models.BroadcastMessage
	if err := h.db.Where("id = ? AND congress_id = ?", msgID, congressID).First(&msg).Error; err != nil {
		utils.RespondError(c, http.StatusNotFound, "Broadcast message not found")
		return
	}

	var recipients []models.BroadcastRecipient
	h.db.Where("broadcast_message_id = ?", msgID).Find(&recipients)

	utils.RespondSuccess(c, http.StatusOK, gin.H{
		"message":    msg,
		"recipients": recipients,
		"count":      len(recipients),
	})
}

// DeleteBroadcast deletes a broadcast message
func (h *BroadcastHandler) DeleteBroadcast(c *gin.Context) {
	congressID, _, err := getCongressIDFromContext(c)
	if err != nil {
		utils.RespondError(c, http.StatusForbidden, err.Error())
		return
	}

	msgID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		utils.RespondError(c, http.StatusBadRequest, "Invalid message ID")
		return
	}

	var msg models.BroadcastMessage
	if err := h.db.Where("id = ? AND congress_id = ?", msgID, congressID).First(&msg).Error; err != nil {
		utils.RespondError(c, http.StatusNotFound, "Broadcast message not found")
		return
	}

	// Delete recipients first
	h.db.Where("broadcast_message_id = ?", msg.ID).Delete(&models.BroadcastRecipient{})
	if err := h.db.Delete(&msg).Error; err != nil {
		utils.RespondError(c, http.StatusInternalServerError, "Failed to delete broadcast message")
		return
	}

	utils.RespondSuccess(c, http.StatusOK, gin.H{"message": "Broadcast message deleted"})
}

// getTargetUserIDs returns user IDs based on target type
func (h *BroadcastHandler) getTargetUserIDs(congressID uuid.UUID, targetType string) ([]uuid.UUID, error) {
	var ids []uuid.UUID

	switch targetType {
	case "all_inscrits":
		// All users who have an inscription (regardless of payment)
		h.db.Model(&models.Inscription{}).
			Where("congress_id = ?", congressID).
			Distinct("user_id").
			Pluck("user_id", &ids)

	case "all_confirmed":
		// All users with confirmed payment
		h.db.Model(&models.Inscription{}).
			Where("congress_id = ? AND payment_status = ?", congressID, "confirmed").
			Distinct("user_id").
			Pluck("user_id", &ids)

	case "all_submitters":
		// All users who submitted something
		h.db.Model(&models.Soumission{}).
			Joins("JOIN inscriptions ON inscriptions.user_id = soumissions.user_id").
			Where("inscriptions.congress_id = ?", congressID).
			Distinct("soumissions.user_id").
			Pluck("soumissions.user_id", &ids)

	case "all_reviewers":
		// All users with reviewer role for this congress
		h.db.Model(&models.User{}).
			Where("congress_id = ? AND role = ?", congressID, "reviewer").
			Pluck("id", &ids)

	case "all_participants":
		// Union of all inscrits + submitters + reviewers
		idsMap := map[uuid.UUID]bool{}

		var inscritIDs []uuid.UUID
		h.db.Model(&models.Inscription{}).
			Where("congress_id = ?", congressID).
			Distinct("user_id").
			Pluck("user_id", &inscritIDs)
		for _, id := range inscritIDs {
			idsMap[id] = true
		}

		var submitterIDs []uuid.UUID
		h.db.Model(&models.Soumission{}).
			Joins("JOIN inscriptions ON inscriptions.user_id = soumissions.user_id").
			Where("inscriptions.congress_id = ?", congressID).
			Distinct("soumissions.user_id").
			Pluck("soumissions.user_id", &submitterIDs)
		for _, id := range submitterIDs {
			idsMap[id] = true
		}

		var reviewerIDs []uuid.UUID
		h.db.Model(&models.User{}).
			Where("congress_id = ? AND role = ?", congressID, "reviewer").
			Pluck("id", &reviewerIDs)
		for _, id := range reviewerIDs {
			idsMap[id] = true
		}

		for id := range idsMap {
			ids = append(ids, id)
		}
	}

	return ids, nil
}

// CreateAndSendBroadcast creates and sends a broadcast in one step
func (h *BroadcastHandler) CreateAndSendBroadcast(c *gin.Context) {
	congressID, _, err := getCongressIDFromContext(c)
	if err != nil {
		utils.RespondError(c, http.StatusForbidden, err.Error())
		return
	}

	userIDStr, _ := c.Get(middleware.ContextUserID)
	userID, _ := uuid.Parse(userIDStr.(string))

	var req CreateBroadcastRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.RespondError(c, http.StatusBadRequest, err.Error())
		return
	}

	allowedTargets := map[string]bool{
		"all_inscrits":     true,
		"all_confirmed":    true,
		"all_submitters":   true,
		"all_reviewers":    true,
		"all_participants": true,
	}
	if !allowedTargets[req.TargetType] {
		utils.RespondError(c, http.StatusBadRequest,
			"target_type must be one of: all_inscrits, all_confirmed, all_submitters, all_reviewers, all_participants")
		return
	}

	now := time.Now()
	msg := models.BroadcastMessage{
		CongressID: congressID,
		Subject:    req.Subject,
		Body:       req.Body,
		TargetType: req.TargetType,
		CreatedBy:  userID,
	}

	if err := h.db.Create(&msg).Error; err != nil {
		utils.RespondError(c, http.StatusInternalServerError, "Failed to create broadcast message")
		return
	}

	// Find and send to target users
	userIDs, err := h.getTargetUserIDs(congressID, req.TargetType)
	if err != nil {
		utils.RespondError(c, http.StatusInternalServerError, "Failed to determine target users")
		return
	}

	sentCount := 0
	for _, uid := range userIDs {
		var user models.User
		if err := h.db.First(&user, "id = ?", uid).Error; err != nil {
			continue
		}

		go createUserNotification(h.db, "broadcast", user.ID, &msg,
			req.Subject+"\n\n"+req.Body,
		)

		go func(u models.User) {
			defer func() {
				if r := recover(); r != nil {
					log.Printf("[PANIC] CreateAndSendBroadcast mail: %v", r)
				}
			}()
			if u.Email != "" {
				h.mail.BroadcastMessage(u.Email, u.Prenom, u.Nom, req.Subject, req.Body, h.cfg.AppBaseURL+"/notifications")
			}
		}(user)

		recipient := models.BroadcastRecipient{
			BroadcastMessageID: msg.ID,
			UserID:             uid,
			Email:              user.Email,
			SentViaEmail:       user.Email != "",
			SentViaNotif:       true,
			SentAt:             &now,
		}
		h.db.Create(&recipient)
		sentCount++
	}

	h.db.Model(&msg).Updates(map[string]interface{}{
		"sent_at":    now,
		"sent_count": sentCount,
	})

	utils.RespondSuccess(c, http.StatusCreated, gin.H{
		"message":    msg,
		"sent_count": sentCount,
	})
}

// GetBroadcastStats returns aggregate stats about sent broadcasts
func (h *BroadcastHandler) GetBroadcastStats(c *gin.Context) {
	congressID, _, err := getCongressIDFromContext(c)
	if err != nil {
		utils.RespondError(c, http.StatusForbidden, err.Error())
		return
	}

	type stats struct {
		TotalSent     int64 `json:"total_sent"`
		TotalRead     int64 `json:"total_read"`
		TotalMessages int64 `json:"total_messages"`
	}

	var s stats
	h.db.Model(&models.BroadcastMessage{}).Where("congress_id = ?", congressID).Count(&s.TotalMessages)
	h.db.Model(&models.BroadcastRecipient{}).
		Joins("JOIN broadcast_messages ON broadcast_messages.id = broadcast_recipients.broadcast_message_id").
		Where("broadcast_messages.congress_id = ?", congressID).
		Count(&s.TotalSent)
	h.db.Model(&models.BroadcastRecipient{}).
		Joins("JOIN broadcast_messages ON broadcast_messages.id = broadcast_recipients.broadcast_message_id").
		Where("broadcast_messages.congress_id = ? AND broadcast_recipients.read_at IS NOT NULL", congressID).
		Count(&s.TotalRead)

	utils.RespondSuccess(c, http.StatusOK, s)
}

// GetAvailableTargets returns the list of available target types for broadcasting
func (h *BroadcastHandler) GetAvailableTargets(c *gin.Context) {
	congressID, _, err := getCongressIDFromContext(c)
	if err != nil {
		utils.RespondError(c, http.StatusForbidden, err.Error())
		return
	}

	type targetInfo struct {
		Key   string `json:"key"`
		Label string `json:"label"`
		Count int64  `json:"count"`
	}

	targets := []targetInfo{
		{Key: "all_inscrits", Label: "Tous les inscrits", Count: 0},
		{Key: "all_confirmed", Label: "Inscrits confirmés (payé)", Count: 0},
		{Key: "all_submitters", Label: "Soumissionnaires", Count: 0},
		{Key: "all_reviewers", Label: "Relecteurs", Count: 0},
		{Key: "all_participants", Label: "Tous les participants", Count: 0},
	}

	for i, t := range targets {
		ids, err := h.getTargetUserIDs(congressID, t.Key)
		if err == nil {
			targets[i].Count = int64(len(ids))
		}
	}

	utils.RespondSuccess(c, http.StatusOK, targets)
}
