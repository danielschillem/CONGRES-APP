package handlers

import (
	"net/http"
	"time"

	"congres-app/backend/internal/config"
	"congres-app/backend/internal/middleware"
	"congres-app/backend/internal/models"
	"congres-app/backend/pkg/utils"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type ProgramHandler struct {
	db  *gorm.DB
	cfg *config.Config
}

func NewProgramHandler(db *gorm.DB, cfg *config.Config) *ProgramHandler {
	return &ProgramHandler{db: db, cfg: cfg}
}

type CreateProgramSlotRequest struct {
	SoumissionID *string `json:"soumission_id"`
	Title        string  `json:"title" binding:"required"`
	Date         string  `json:"date" binding:"required"`
	StartTime    string  `json:"start_time" binding:"required"`
	EndTime      string  `json:"end_time" binding:"required"`
	Location     string  `json:"location"`
	SessionType  string  `json:"session_type"`
	Order        int     `json:"order"`
}

type UpdateProgramSlotRequest struct {
	SoumissionID *string `json:"soumission_id"`
	Title        *string `json:"title"`
	Date         *string `json:"date"`
	StartTime    *string `json:"start_time"`
	EndTime      *string `json:"end_time"`
	Location     *string `json:"location"`
	SessionType  *string `json:"session_type"`
	Order        *int    `json:"order"`
}

// AdminCreateSlot creates a new program slot.
func (h *ProgramHandler) AdminCreateSlot(c *gin.Context) {
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

	var req CreateProgramSlotRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.RespondError(c, http.StatusBadRequest, err.Error())
		return
	}

	// Validate time
	if _, err := time.Parse("15:04", req.StartTime); err != nil {
		utils.RespondError(c, http.StatusBadRequest, "start_time must be HH:MM format")
		return
	}
	if _, err := time.Parse("15:04", req.EndTime); err != nil {
		utils.RespondError(c, http.StatusBadRequest, "end_time must be HH:MM format")
		return
	}

	allowedTypes := map[string]bool{"plenary": true, "parallel": true, "poster": true, "workshop": true, "presentation": true}
	sessionType := req.SessionType
	if sessionType == "" || !allowedTypes[sessionType] {
		sessionType = "presentation"
	}

	var soumissionID *uuid.UUID
	if req.SoumissionID != nil && *req.SoumissionID != "" {
		parsed, err := uuid.Parse(*req.SoumissionID)
		if err != nil {
			utils.RespondError(c, http.StatusBadRequest, "Invalid soumission_id")
			return
		}
		soumissionID = &parsed
	}

	slot := models.ProgramSlot{
		CongressID:   congressID,
		SoumissionID: soumissionID,
		Title:        req.Title,
		Date:         req.Date,
		StartTime:    req.StartTime,
		EndTime:      req.EndTime,
		Location:     req.Location,
		SessionType:  sessionType,
		Order:        req.Order,
		CreatedBy:    userID,
	}

	if err := h.db.Create(&slot).Error; err != nil {
		utils.RespondError(c, http.StatusInternalServerError, "Failed to create program slot")
		return
	}

	utils.RespondSuccess(c, http.StatusCreated, slot)
}

// AdminListSlots lists all program slots for the admin's congress.
func (h *ProgramHandler) AdminListSlots(c *gin.Context) {
	congressIDStr, exists := c.Get(middleware.ContextCongressID)
	if !exists || congressIDStr == "" {
		utils.RespondError(c, http.StatusForbidden, "No congress associated with this account")
		return
	}
	congressID, _ := uuid.Parse(congressIDStr.(string))

	dateFilter := c.Query("date")
	sessionType := c.Query("session_type")

	query := h.db.Where("congress_id = ?", congressID).Preload("Soumission").Order("date asc, \"order\" asc, start_time asc")

	if dateFilter != "" {
		query = query.Where("date = ?", dateFilter)
	}
	if sessionType != "" {
		query = query.Where("session_type = ?", sessionType)
	}

	var slots []models.ProgramSlot
	if err := query.Find(&slots).Error; err != nil {
		utils.RespondError(c, http.StatusInternalServerError, "Failed to fetch program slots")
		return
	}

	utils.RespondSuccess(c, http.StatusOK, slots)
}

// AdminGetSlot gets a single program slot.
func (h *ProgramHandler) AdminGetSlot(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		utils.RespondError(c, http.StatusBadRequest, "Invalid slot ID")
		return
	}

	var slot models.ProgramSlot
	if err := h.db.Preload("Soumission").First(&slot, "id = ?", id).Error; err != nil {
		utils.RespondError(c, http.StatusNotFound, "Program slot not found")
		return
	}

	utils.RespondSuccess(c, http.StatusOK, slot)
}

// AdminUpdateSlot updates a program slot.
func (h *ProgramHandler) AdminUpdateSlot(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		utils.RespondError(c, http.StatusBadRequest, "Invalid slot ID")
		return
	}

	var slot models.ProgramSlot
	if err := h.db.First(&slot, "id = ?", id).Error; err != nil {
		utils.RespondError(c, http.StatusNotFound, "Program slot not found")
		return
	}

	var req UpdateProgramSlotRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.RespondError(c, http.StatusBadRequest, err.Error())
		return
	}

	updates := map[string]interface{}{}
	if req.Title != nil {
		updates["title"] = *req.Title
	}
	if req.Date != nil {
		updates["date"] = *req.Date
	}
	if req.StartTime != nil {
		if _, err := time.Parse("15:04", *req.StartTime); err != nil {
			utils.RespondError(c, http.StatusBadRequest, "start_time must be HH:MM format")
			return
		}
		updates["start_time"] = *req.StartTime
	}
	if req.EndTime != nil {
		if _, err := time.Parse("15:04", *req.EndTime); err != nil {
			utils.RespondError(c, http.StatusBadRequest, "end_time must be HH:MM format")
			return
		}
		updates["end_time"] = *req.EndTime
	}
	if req.Location != nil {
		updates["location"] = *req.Location
	}
	if req.SessionType != nil {
		allowedTypes := map[string]bool{"plenary": true, "parallel": true, "poster": true, "workshop": true, "presentation": true}
		if !allowedTypes[*req.SessionType] {
			utils.RespondError(c, http.StatusBadRequest, "Invalid session_type")
			return
		}
		updates["session_type"] = *req.SessionType
	}
	if req.Order != nil {
		updates["order"] = *req.Order
	}
	if req.SoumissionID != nil {
		if *req.SoumissionID == "" {
			updates["soumission_id"] = nil
		} else {
			parsed, err := uuid.Parse(*req.SoumissionID)
			if err != nil {
				utils.RespondError(c, http.StatusBadRequest, "Invalid soumission_id")
				return
			}
			updates["soumission_id"] = parsed
		}
	}

	if len(updates) == 0 {
		utils.RespondError(c, http.StatusBadRequest, "No fields to update")
		return
	}

	if err := h.db.Model(&slot).Updates(updates).Error; err != nil {
		utils.RespondError(c, http.StatusInternalServerError, "Failed to update program slot")
		return
	}

	h.db.Preload("Soumission").First(&slot, "id = ?", id)
	utils.RespondSuccess(c, http.StatusOK, slot)
}

// AdminDeleteSlot deletes a program slot.
func (h *ProgramHandler) AdminDeleteSlot(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		utils.RespondError(c, http.StatusBadRequest, "Invalid slot ID")
		return
	}

	if err := h.db.Delete(&models.ProgramSlot{}, "id = ?", id).Error; err != nil {
		utils.RespondError(c, http.StatusInternalServerError, "Failed to delete program slot")
		return
	}

	utils.RespondSuccess(c, http.StatusOK, gin.H{"message": "Program slot deleted"})
}

// ListAvailableSoumissions lists approved submissions available for scheduling.
func (h *ProgramHandler) ListAvailableSoumissions(c *gin.Context) {
	congressIDStr, exists := c.Get(middleware.ContextCongressID)
	congressID := uuid.Nil
	if exists && congressIDStr != "" {
		congressID, _ = uuid.Parse(congressIDStr.(string))
	}

	// Get approved soumissions
	var soumissions []models.Soumission
	query := h.db.Where("statut = ?", "Approuvée").Preload("User")

	if congressID != uuid.Nil {
		query = query.Where("user_id IN (?)",
			h.db.Table("inscriptions").Select("user_id").Where("congress_id = ?", congressID),
		)
	}

	if err := query.Order("created_at desc").Find(&soumissions).Error; err != nil {
		utils.RespondError(c, http.StatusInternalServerError, "Failed to fetch soumissions")
		return
	}

	utils.RespondSuccess(c, http.StatusOK, soumissions)
}

// PublicListProgram lists program slots for a congress (public).
func (h *ProgramHandler) PublicListProgram(c *gin.Context) {
	congressID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		utils.RespondError(c, http.StatusBadRequest, "Invalid congress ID")
		return
	}

	dateFilter := c.Query("date")

	query := h.db.Where("congress_id = ?", congressID).Preload("Soumission").Order("date asc, \"order\" asc, start_time asc")

	if dateFilter != "" {
		query = query.Where("date = ?", dateFilter)
	}

	var slots []models.ProgramSlot
	if err := query.Find(&slots).Error; err != nil {
		utils.RespondError(c, http.StatusInternalServerError, "Failed to fetch program")
		return
	}

	utils.RespondSuccess(c, http.StatusOK, slots)
}

// PublicListDates returns distinct program dates for a congress.
func (h *ProgramHandler) PublicListDates(c *gin.Context) {
	congressID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		utils.RespondError(c, http.StatusBadRequest, "Invalid congress ID")
		return
	}

	var dates []string
	h.db.Model(&models.ProgramSlot{}).
		Where("congress_id = ?", congressID).
		Distinct().
		Pluck("date", &dates)

	utils.RespondSuccess(c, http.StatusOK, dates)
}

// AdminListDates returns distinct program dates for the admin's congress.
func (h *ProgramHandler) AdminListDates(c *gin.Context) {
	congressIDStr, exists := c.Get(middleware.ContextCongressID)
	if !exists || congressIDStr == "" {
		utils.RespondError(c, http.StatusForbidden, "No congress associated with this account")
		return
	}
	congressID, _ := uuid.Parse(congressIDStr.(string))

	var dates []string
	h.db.Model(&models.ProgramSlot{}).
		Where("congress_id = ?", congressID).
		Distinct().
		Pluck("date", &dates)

	utils.RespondSuccess(c, http.StatusOK, dates)
}
