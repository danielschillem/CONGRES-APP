package handlers

import (
	"fmt"
	"net/http"
	"strconv"
	"time"

	"congres-app/backend/internal/config"
	"congres-app/backend/internal/middleware"
	"congres-app/backend/internal/models"
	"congres-app/backend/pkg/utils"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type VirtualHandler struct {
	db  *gorm.DB
	cfg *config.Config
}

func NewVirtualHandler(db *gorm.DB, cfg *config.Config) *VirtualHandler {
	return &VirtualHandler{db: db, cfg: cfg}
}

type CreateSessionRequest struct {
	Title            string `json:"title" binding:"required"`
	Description      string `json:"description"`
	SessionType      string `json:"session_type" binding:"required"`
	StartTime        string `json:"start_time" binding:"required"`
	EndTime          string `json:"end_time" binding:"required"`
	Password         string `json:"password"`
	MaxParticipants  int    `json:"max_participants"`
	RecordingEnabled bool   `json:"recording_enabled"`
}

type UpdateSessionRequest struct {
	Title            *string `json:"title"`
	Description      *string `json:"description"`
	SessionType      *string `json:"session_type"`
	StartTime        *string `json:"start_time"`
	EndTime          *string `json:"end_time"`
	Password         *string `json:"password"`
	MaxParticipants  *int    `json:"max_participants"`
	RecordingEnabled *bool   `json:"recording_enabled"`
	Status           *string `json:"status"`
}

func parseTime(s string) (time.Time, error) {
	formats := []string{time.RFC3339, "2006-01-02T15:04:05", "2006-01-02 15:04:05", "2006-01-02"}
	for _, f := range formats {
		if t, err := time.Parse(f, s); err == nil {
			return t, nil
		}
	}
	return time.Time{}, fmt.Errorf("cannot parse time: %s", s)
}

// generateRoomName creates a unique room identifier for Jitsi.
func generateRoomName(congressID uuid.UUID, title string) string {
	shortID := congressID.String()[:8]
	return fmt.Sprintf("congres-%s-%s", shortID, title)
}

// ─── Admin endpoints ─────────────────────────────────────────────────

func (h *VirtualHandler) AdminCreateSession(c *gin.Context) {
	congressIDStr, exists := c.Get(middleware.ContextCongressID)
	if !exists || congressIDStr == "" {
		utils.RespondError(c, http.StatusForbidden, "No congress associated with this account")
		return
	}
	congressID, err := uuid.Parse(congressIDStr.(string))
	if err != nil {
		utils.RespondError(c, http.StatusForbidden, "Invalid congress ID")
		return
	}

	userIDStr, _ := c.Get(middleware.ContextUserID)
	userID, _ := uuid.Parse(userIDStr.(string))

	var req CreateSessionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.RespondError(c, http.StatusBadRequest, err.Error())
		return
	}

	startTime, err := parseTime(req.StartTime)
	if err != nil {
		utils.RespondError(c, http.StatusBadRequest, "Invalid start_time format")
		return
	}
	endTime, err := parseTime(req.EndTime)
	if err != nil {
		utils.RespondError(c, http.StatusBadRequest, "Invalid end_time format")
		return
	}

	if !endTime.After(startTime) {
		utils.RespondError(c, http.StatusBadRequest, "End time must be after start time")
		return
	}

	maxParticipants := req.MaxParticipants
	if maxParticipants <= 0 {
		maxParticipants = 50
	}

	sessionType := req.SessionType
	allowedTypes := map[string]bool{"plenary": true, "workshop": true, "presentation": true, "breakout": true}
	if !allowedTypes[sessionType] {
		sessionType = "presentation"
	}

	roomName := generateRoomName(congressID, req.Title)

	session := models.VirtualSession{
		CongressID:       congressID,
		Title:            req.Title,
		Description:      req.Description,
		SessionType:      sessionType,
		StartTime:        startTime,
		EndTime:          endTime,
		RoomName:         roomName,
		Password:         req.Password,
		MaxParticipants:  maxParticipants,
		Status:           "scheduled",
		RecordingEnabled: req.RecordingEnabled,
		CreatedBy:        userID,
	}

	if err := h.db.Create(&session).Error; err != nil {
		utils.RespondError(c, http.StatusInternalServerError, "Failed to create session")
		return
	}

	utils.RespondSuccess(c, http.StatusCreated, session)
}

func (h *VirtualHandler) AdminListSessions(c *gin.Context) {
	congressIDStr, exists := c.Get(middleware.ContextCongressID)
	var congressID uuid.UUID
	if exists && congressIDStr != "" {
		congressID, _ = uuid.Parse(congressIDStr.(string))
	}

	query := h.db.Model(&models.VirtualSession{}).Order("start_time asc")
	if congressID != uuid.Nil {
		query = query.Where("congress_id = ?", congressID)
	}

	var sessions []models.VirtualSession
	if err := query.Find(&sessions).Error; err != nil {
		utils.RespondError(c, http.StatusInternalServerError, "Failed to fetch sessions")
		return
	}

	utils.RespondSuccess(c, http.StatusOK, sessions)
}

func (h *VirtualHandler) AdminGetSession(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		utils.RespondError(c, http.StatusBadRequest, "Invalid session ID")
		return
	}

	var session models.VirtualSession
	if err := h.db.First(&session, "id = ?", id).Error; err != nil {
		utils.RespondError(c, http.StatusNotFound, "Session not found")
		return
	}

	utils.RespondSuccess(c, http.StatusOK, session)
}

func (h *VirtualHandler) AdminUpdateSession(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		utils.RespondError(c, http.StatusBadRequest, "Invalid session ID")
		return
	}

	var session models.VirtualSession
	if err := h.db.First(&session, "id = ?", id).Error; err != nil {
		utils.RespondError(c, http.StatusNotFound, "Session not found")
		return
	}

	var req UpdateSessionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.RespondError(c, http.StatusBadRequest, err.Error())
		return
	}

	updates := map[string]interface{}{}
	if req.Title != nil {
		updates["title"] = *req.Title
		updates["room_name"] = generateRoomName(session.CongressID, *req.Title)
	}
	if req.Description != nil {
		updates["description"] = *req.Description
	}
	if req.SessionType != nil {
		updates["session_type"] = *req.SessionType
	}
	if req.StartTime != nil {
		t, err := parseTime(*req.StartTime)
		if err != nil {
			utils.RespondError(c, http.StatusBadRequest, "Invalid start_time format")
			return
		}
		updates["start_time"] = t
	}
	if req.EndTime != nil {
		t, err := parseTime(*req.EndTime)
		if err != nil {
			utils.RespondError(c, http.StatusBadRequest, "Invalid end_time format")
			return
		}
		updates["end_time"] = t
	}
	if req.Password != nil {
		updates["password"] = *req.Password
	}
	if req.MaxParticipants != nil {
		updates["max_participants"] = *req.MaxParticipants
	}
	if req.RecordingEnabled != nil {
		updates["recording_enabled"] = *req.RecordingEnabled
	}
	if req.Status != nil {
		allowed := map[string]bool{"scheduled": true, "live": true, "ended": true, "cancelled": true}
		if !allowed[*req.Status] {
			utils.RespondError(c, http.StatusBadRequest, "Invalid status (scheduled, live, ended, cancelled)")
			return
		}
		updates["status"] = *req.Status
	}

	if len(updates) == 0 {
		utils.RespondError(c, http.StatusBadRequest, "No fields to update")
		return
	}

	if err := h.db.Model(&session).Updates(updates).Error; err != nil {
		utils.RespondError(c, http.StatusInternalServerError, "Failed to update session")
		return
	}

	h.db.First(&session, "id = ?", id)
	utils.RespondSuccess(c, http.StatusOK, session)
}

func (h *VirtualHandler) AdminDeleteSession(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		utils.RespondError(c, http.StatusBadRequest, "Invalid session ID")
		return
	}

	if err := h.db.Delete(&models.VirtualSession{}, "id = ?", id).Error; err != nil {
		utils.RespondError(c, http.StatusInternalServerError, "Failed to delete session")
		return
	}

	utils.RespondSuccess(c, http.StatusOK, gin.H{"message": "Session deleted"})
}

func (h *VirtualHandler) AdminStartSession(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		utils.RespondError(c, http.StatusBadRequest, "Invalid session ID")
		return
	}

	if err := h.db.Model(&models.VirtualSession{}).Where("id = ?", id).Update("status", "live").Error; err != nil {
		utils.RespondError(c, http.StatusInternalServerError, "Failed to start session")
		return
	}

	utils.RespondSuccess(c, http.StatusOK, gin.H{"message": "Session started", "status": "live"})
}

func (h *VirtualHandler) AdminEndSession(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		utils.RespondError(c, http.StatusBadRequest, "Invalid session ID")
		return
	}

	if err := h.db.Model(&models.VirtualSession{}).Where("id = ?", id).Update("status", "ended").Error; err != nil {
		utils.RespondError(c, http.StatusInternalServerError, "Failed to end session")
		return
	}

	utils.RespondSuccess(c, http.StatusOK, gin.H{"message": "Session ended", "status": "ended"})
}

func (h *VirtualHandler) AdminGetAttendance(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		utils.RespondError(c, http.StatusBadRequest, "Invalid session ID")
		return
	}

	var attendance []models.VirtualAttendance
	if err := h.db.Preload("User").Where("session_id = ?", id).Order("join_time desc").Find(&attendance).Error; err != nil {
		utils.RespondError(c, http.StatusInternalServerError, "Failed to fetch attendance")
		return
	}

	utils.RespondSuccess(c, http.StatusOK, attendance)
}

// ─── User endpoints ──────────────────────────────────────────────────

func (h *VirtualHandler) ListSessions(c *gin.Context) {
	congressIDStr := c.Query("congress_id")
	if congressIDStr == "" {
		utils.RespondError(c, http.StatusBadRequest, "congress_id query parameter is required")
		return
	}

	congressID, err := uuid.Parse(congressIDStr)
	if err != nil {
		utils.RespondError(c, http.StatusBadRequest, "Invalid congress ID")
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

	now := time.Now()
	query := h.db.Model(&models.VirtualSession{}).Where("congress_id = ? AND end_time > ?", congressID, now)

	var total int64
	if err := query.Count(&total).Error; err != nil {
		utils.RespondError(c, http.StatusInternalServerError, "Failed to count sessions")
		return
	}

	var sessions []models.VirtualSession
	if err := query.Order("start_time asc").Offset(offset).Limit(limit).Find(&sessions).Error; err != nil {
		utils.RespondError(c, http.StatusInternalServerError, "Failed to fetch sessions")
		return
	}

	utils.RespondPaginated(c, sessions, total, page, limit)
}

func (h *VirtualHandler) GetSession(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		utils.RespondError(c, http.StatusBadRequest, "Invalid session ID")
		return
	}

	var session models.VirtualSession
	if err := h.db.First(&session, "id = ?", id).Error; err != nil {
		utils.RespondError(c, http.StatusNotFound, "Session not found")
		return
	}

	utils.RespondSuccess(c, http.StatusOK, session)
}

func (h *VirtualHandler) JoinSession(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		utils.RespondError(c, http.StatusBadRequest, "Invalid session ID")
		return
	}

	userIDStr, _ := c.Get(middleware.ContextUserID)
	userID, _ := uuid.Parse(userIDStr.(string))

	var session models.VirtualSession
	if err := h.db.First(&session, "id = ?", id).Error; err != nil {
		utils.RespondError(c, http.StatusNotFound, "Session not found")
		return
	}

	if session.Status != "live" && session.Status != "scheduled" {
		utils.RespondError(c, http.StatusForbidden, "Session is not available")
		return
	}

	// Check if user already has an active attendance for this session
	var existing models.VirtualAttendance
	if err := h.db.Where("session_id = ? AND user_id = ? AND leave_time IS NULL", id, userID).
		First(&existing).Error; err == nil {
		utils.RespondSuccess(c, http.StatusOK, existing)
		return
	}

	attendance := models.VirtualAttendance{
		SessionID: id,
		UserID:    userID,
		JoinTime:  time.Now(),
	}

	if err := h.db.Create(&attendance).Error; err != nil {
		utils.RespondError(c, http.StatusInternalServerError, "Failed to record attendance")
		return
	}

	utils.RespondSuccess(c, http.StatusCreated, attendance)
}

func (h *VirtualHandler) LeaveSession(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		utils.RespondError(c, http.StatusBadRequest, "Invalid session ID")
		return
	}

	userIDStr, _ := c.Get(middleware.ContextUserID)
	userID, _ := uuid.Parse(userIDStr.(string))

	var attendance models.VirtualAttendance
	if err := h.db.Where("session_id = ? AND user_id = ? AND leave_time IS NULL", id, userID).
		First(&attendance).Error; err != nil {
		utils.RespondError(c, http.StatusNotFound, "No active attendance found")
		return
	}

	now := time.Now()
	duration := int(now.Sub(attendance.JoinTime).Seconds())
	attendance.LeaveTime = &now
	attendance.Duration = duration

	if err := h.db.Save(&attendance).Error; err != nil {
		utils.RespondError(c, http.StatusInternalServerError, "Failed to update attendance")
		return
	}

	utils.RespondSuccess(c, http.StatusOK, attendance)
}

func (h *VirtualHandler) MyUpcomingSessions(c *gin.Context) {
	userIDStr, _ := c.Get(middleware.ContextUserID)
	userID, _ := uuid.Parse(userIDStr.(string))

	// Get congresses the user is inscribed in
	var congressIDs []uuid.UUID
	h.db.Model(&models.Inscription{}).Where("user_id = ?", userID).
		Pluck("congress_id", &congressIDs)

	if len(congressIDs) == 0 {
		utils.RespondSuccess(c, http.StatusOK, []models.VirtualSession{})
		return
	}

	now := time.Now()
	var sessions []models.VirtualSession
	if err := h.db.Where("congress_id IN (?) AND end_time > ?", congressIDs, now).
		Preload("Congress").
		Order("start_time asc").Limit(10).Find(&sessions).Error; err != nil {
		utils.RespondError(c, http.StatusInternalServerError, "Failed to fetch sessions")
		return
	}

	utils.RespondSuccess(c, http.StatusOK, sessions)
}
