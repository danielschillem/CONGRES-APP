package handlers

import (
	"net/http"
	"time"

	"congres-app/backend/internal/middleware"
	"congres-app/backend/internal/models"
	"congres-app/backend/pkg/utils"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type NotificationHandler struct {
	db *gorm.DB
}

func NewNotificationHandler(db *gorm.DB) *NotificationHandler {
	return &NotificationHandler{db: db}
}

func (h *NotificationHandler) ListNotifications(c *gin.Context) {
	userIDStr, _ := c.Get(middleware.ContextUserID)
	userID, err := uuid.Parse(userIDStr.(string))
	if err != nil {
		utils.RespondError(c, http.StatusUnauthorized, "Invalid user ID")
		return
	}

	var notifications []models.Notification
	if err := h.db.Where("notifiable_id = ?", userID).Order("created_at desc").Find(&notifications).Error; err != nil {
		utils.RespondError(c, http.StatusInternalServerError, "Failed to fetch notifications")
		return
	}

	utils.RespondSuccess(c, http.StatusOK, notifications)
}

func (h *NotificationHandler) MarkAsRead(c *gin.Context) {
	userIDStr, _ := c.Get(middleware.ContextUserID)
	userID, err := uuid.Parse(userIDStr.(string))
	if err != nil {
		utils.RespondError(c, http.StatusUnauthorized, "Invalid user ID")
		return
	}

	notifID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		utils.RespondError(c, http.StatusBadRequest, "Invalid notification ID")
		return
	}

	var notif models.Notification
	if err := h.db.Where("id = ? AND notifiable_id = ?", notifID, userID).First(&notif).Error; err != nil {
		utils.RespondError(c, http.StatusNotFound, "Notification not found")
		return
	}

	now := time.Now()
	notif.ReadAt = &now

	if err := h.db.Save(&notif).Error; err != nil {
		utils.RespondError(c, http.StatusInternalServerError, "Failed to mark notification as read")
		return
	}

	utils.RespondSuccess(c, http.StatusOK, notif)
}

func (h *NotificationHandler) MarkAllAsRead(c *gin.Context) {
	userIDStr, _ := c.Get(middleware.ContextUserID)
	userID, err := uuid.Parse(userIDStr.(string))
	if err != nil {
		utils.RespondError(c, http.StatusUnauthorized, "Invalid user ID")
		return
	}

	now := time.Now()
	if err := h.db.Model(&models.Notification{}).
		Where("notifiable_id = ? AND read_at IS NULL", userID).
		Update("read_at", now).Error; err != nil {
		utils.RespondError(c, http.StatusInternalServerError, "Failed to mark all notifications as read")
		return
	}

	utils.RespondSuccess(c, http.StatusOK, gin.H{"message": "All notifications marked as read"})
}

func (h *NotificationHandler) GetUnreadCount(c *gin.Context) {
	userIDStr, _ := c.Get(middleware.ContextUserID)
	userID, err := uuid.Parse(userIDStr.(string))
	if err != nil {
		utils.RespondError(c, http.StatusUnauthorized, "Invalid user ID")
		return
	}

	var count int64
	if err := h.db.Model(&models.Notification{}).
		Where("notifiable_id = ? AND read_at IS NULL", userID).
		Count(&count).Error; err != nil {
		utils.RespondError(c, http.StatusInternalServerError, "Failed to count unread notifications")
		return
	}

	utils.RespondSuccess(c, http.StatusOK, gin.H{"count": count})
}
