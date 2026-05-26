package handlers

import (
	"net/http"
	"strconv"
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

// @Summary     Lister les notifications
// @Description Retourne la liste paginée des notifications de l'utilisateur connecté
// @Tags        notifications
// @Produce     json
// @Param       page query int false "Numéro de page (défaut: 1)"
// @Param       limit query int false "Nombre d'éléments par page (défaut: 20)"
// @Success     200 {object} utils.PaginatedResponse{data=[]models.Notification}
// @Failure     401 {object} utils.ErrorResponse
// @Security    BearerAuth
// @Router      /notifications [get]
func (h *NotificationHandler) ListNotifications(c *gin.Context) {
	userIDStr, _ := c.Get(middleware.ContextUserID)
	userID, err := uuid.Parse(userIDStr.(string))
	if err != nil {
		utils.RespondError(c, http.StatusUnauthorized, "Invalid user ID")
		return
	}

	page, err := strconv.Atoi(c.DefaultQuery("page", "1"))
	if err != nil || page < 1 {
		page = 1
	}
	limit, err := strconv.Atoi(c.DefaultQuery("limit", "20"))
	if err != nil || limit < 1 {
		limit = 20
	}
	offset := (page - 1) * limit

	query := h.db.Model(&models.Notification{}).Where("notifiable_id = ?", userID)

	var total int64
	if err := query.Count(&total).Error; err != nil {
		utils.RespondError(c, http.StatusInternalServerError, "Failed to count notifications")
		return
	}

	var notifications []models.Notification
	if err := query.Order("created_at desc").Offset(offset).Limit(limit).Find(&notifications).Error; err != nil {
		utils.RespondError(c, http.StatusInternalServerError, "Failed to fetch notifications")
		return
	}

	utils.RespondPaginated(c, notifications, total, page, limit)
}

// @Summary     Marquer une notification comme lue
// @Description Marque une notification spécifique comme lue pour l'utilisateur connecté
// @Tags        notifications
// @Produce     json
// @Param       id path string true "ID de la notification"
// @Success     200 {object} utils.SuccessResponse{data=models.Notification}
// @Failure     400 {object} utils.ErrorResponse
// @Failure     401 {object} utils.ErrorResponse
// @Failure     404 {object} utils.ErrorResponse
// @Security    BearerAuth
// @Router      /notifications/{id}/read [patch]
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

// @Summary     Marquer toutes les notifications comme lues
// @Description Marque toutes les notifications non lues de l'utilisateur connecté comme lues
// @Tags        notifications
// @Produce     json
// @Success     200 {object} utils.SuccessResponse{data=object{message=string}}
// @Failure     401 {object} utils.ErrorResponse
// @Security    BearerAuth
// @Router      /notifications/read-all [post]
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

// @Summary     Nombre de notifications non lues
// @Description Retourne le nombre de notifications non lues de l'utilisateur connecté
// @Tags        notifications
// @Produce     json
// @Success     200 {object} utils.SuccessResponse{data=object{count=int}}
// @Failure     401 {object} utils.ErrorResponse
// @Security    BearerAuth
// @Router      /notifications/unread-count [get]
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
