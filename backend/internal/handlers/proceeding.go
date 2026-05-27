package handlers

import (
	"encoding/json"
	"net/http"
	"time"

	"congres-app/backend/internal/config"
	"congres-app/backend/internal/middleware"
	"congres-app/backend/internal/models"
	"congres-app/backend/pkg/utils"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/datatypes"
	"gorm.io/gorm"
)

type ProceedingHandler struct {
	db  *gorm.DB
	cfg *config.Config
}

func NewProceedingHandler(db *gorm.DB, cfg *config.Config) *ProceedingHandler {
	return &ProceedingHandler{db: db, cfg: cfg}
}

type CreateProceedingRequest struct {
	Title       string `json:"title" binding:"required"`
	Subtitle    string `json:"subtitle"`
	Description string `json:"description"`
	CoverImage  string `json:"cover_image"`
}

type UpdateProceedingRequest struct {
	Title       *string `json:"title"`
	Subtitle    *string `json:"subtitle"`
	Description *string `json:"description"`
	CoverImage  *string `json:"cover_image"`
	Status      *string `json:"status"`
	Metadata    *map[string]interface{} `json:"metadata"`
}

type AddSubmissionRequest struct {
	SoumissionID string `json:"soumission_id" binding:"required"`
	SectionTitle string `json:"section_title"`
	Order        int    `json:"order"`
	PageStart    int    `json:"page_start"`
	PageEnd      int    `json:"page_end"`
}

// AdminCreateProceeding creates a new proceedings volume.
func (h *ProceedingHandler) AdminCreateProceeding(c *gin.Context) {
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

	var req CreateProceedingRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.RespondError(c, http.StatusBadRequest, err.Error())
		return
	}

	proceeding := models.Proceeding{
		CongressID:  congressID,
		Title:       req.Title,
		Subtitle:    req.Subtitle,
		Description: req.Description,
		CoverImage:  req.CoverImage,
		Metadata:    datatypes.JSON(`{}`),
		Status:      "draft",
		CreatedBy:   userID,
	}

	if err := h.db.Create(&proceeding).Error; err != nil {
		utils.RespondError(c, http.StatusInternalServerError, "Failed to create proceeding")
		return
	}

	utils.RespondSuccess(c, http.StatusCreated, proceeding)
}

// AdminListProceedings lists all proceedings for the admin's congress.
func (h *ProceedingHandler) AdminListProceedings(c *gin.Context) {
	congressIDStr, exists := c.Get(middleware.ContextCongressID)
	if !exists || congressIDStr == "" {
		utils.RespondError(c, http.StatusForbidden, "No congress associated with this account")
		return
	}
	congressID, _ := uuid.Parse(congressIDStr.(string))

	var proceedings []models.Proceeding
	if err := h.db.Where("congress_id = ?", congressID).Order("created_at desc").Find(&proceedings).Error; err != nil {
		utils.RespondError(c, http.StatusInternalServerError, "Failed to fetch proceedings")
		return
	}

	utils.RespondSuccess(c, http.StatusOK, proceedings)
}

// AdminGetProceeding gets a single proceeding with its submissions.
func (h *ProceedingHandler) AdminGetProceeding(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		utils.RespondError(c, http.StatusBadRequest, "Invalid proceeding ID")
		return
	}

	var proceeding models.Proceeding
	if err := h.db.First(&proceeding, "id = ?", id).Error; err != nil {
		utils.RespondError(c, http.StatusNotFound, "Proceeding not found")
		return
	}

	var submissions []models.ProceedingSubmission
	h.db.Where("proceeding_id = ?", id).Preload("Soumission").Order("\"order\" asc").Find(&submissions)

	utils.RespondSuccess(c, http.StatusOK, gin.H{
		"proceeding":  proceeding,
		"submissions": submissions,
	})
}

// AdminUpdateProceeding updates a proceeding.
func (h *ProceedingHandler) AdminUpdateProceeding(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		utils.RespondError(c, http.StatusBadRequest, "Invalid proceeding ID")
		return
	}

	var proceeding models.Proceeding
	if err := h.db.First(&proceeding, "id = ?", id).Error; err != nil {
		utils.RespondError(c, http.StatusNotFound, "Proceeding not found")
		return
	}

	var req UpdateProceedingRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.RespondError(c, http.StatusBadRequest, err.Error())
		return
	}

	updates := map[string]interface{}{}
	if req.Title != nil {
		updates["title"] = *req.Title
	}
	if req.Subtitle != nil {
		updates["subtitle"] = *req.Subtitle
	}
	if req.Description != nil {
		updates["description"] = *req.Description
	}
	if req.CoverImage != nil {
		updates["cover_image"] = *req.CoverImage
	}
	if req.Status != nil {
		allowed := map[string]bool{"draft": true, "published": true, "archived": true}
		if !allowed[*req.Status] {
			utils.RespondError(c, http.StatusBadRequest, "Invalid status (draft, published, archived)")
			return
		}
		updates["status"] = *req.Status
		if *req.Status == "published" {
			now := time.Now()
			updates["published_at"] = &now
		}
	}
	if req.Metadata != nil {
		raw, err := json.Marshal(*req.Metadata)
		if err != nil {
			utils.RespondError(c, http.StatusBadRequest, "Invalid metadata")
			return
		}
		updates["metadata"] = datatypes.JSON(raw)
	}

	if len(updates) == 0 {
		utils.RespondError(c, http.StatusBadRequest, "No fields to update")
		return
	}

	if err := h.db.Model(&proceeding).Updates(updates).Error; err != nil {
		utils.RespondError(c, http.StatusInternalServerError, "Failed to update proceeding")
		return
	}

	h.db.First(&proceeding, "id = ?", id)
	utils.RespondSuccess(c, http.StatusOK, proceeding)
}

// AdminDeleteProceeding deletes a proceeding.
func (h *ProceedingHandler) AdminDeleteProceeding(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		utils.RespondError(c, http.StatusBadRequest, "Invalid proceeding ID")
		return
	}

	tx := h.db.Begin()

	// Delete associated submissions
	tx.Where("proceeding_id = ?", id).Delete(&models.ProceedingSubmission{})
	// Delete proceeding
	if err := tx.Delete(&models.Proceeding{}, "id = ?", id).Error; err != nil {
		tx.Rollback()
		utils.RespondError(c, http.StatusInternalServerError, "Failed to delete proceeding")
		return
	}

	tx.Commit()
	utils.RespondSuccess(c, http.StatusOK, gin.H{"message": "Proceeding deleted"})
}

// AdminAddSubmission adds a submission to a proceeding.
func (h *ProceedingHandler) AdminAddSubmission(c *gin.Context) {
	proceedingID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		utils.RespondError(c, http.StatusBadRequest, "Invalid proceeding ID")
		return
	}

	var proceeding models.Proceeding
	if err := h.db.First(&proceeding, "id = ?", proceedingID).Error; err != nil {
		utils.RespondError(c, http.StatusNotFound, "Proceeding not found")
		return
	}

	var req AddSubmissionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.RespondError(c, http.StatusBadRequest, err.Error())
		return
	}

	soumissionID, err := uuid.Parse(req.SoumissionID)
	if err != nil {
		utils.RespondError(c, http.StatusBadRequest, "Invalid soumission_id")
		return
	}

	// Verify soumission exists and is approved
	var soumission models.Soumission
	if err := h.db.First(&soumission, "id = ?", soumissionID).Error; err != nil {
		utils.RespondError(c, http.StatusNotFound, "Soumission not found")
		return
	}
	if soumission.Statut != "Approuvée" {
		utils.RespondError(c, http.StatusBadRequest, "Only approved soumissions can be added to proceedings")
		return
	}

	// Check if already added
	var existing int64
	h.db.Model(&models.ProceedingSubmission{}).Where("proceeding_id = ? AND soumission_id = ?", proceedingID, soumissionID).Count(&existing)
	if existing > 0 {
		utils.RespondError(c, http.StatusConflict, "Soumission already in proceeding")
		return
	}

	entry := models.ProceedingSubmission{
		ProceedingID: proceedingID,
		SoumissionID: soumissionID,
		SectionTitle: req.SectionTitle,
		Order:        req.Order,
		PageStart:    req.PageStart,
		PageEnd:      req.PageEnd,
	}

	if err := h.db.Create(&entry).Error; err != nil {
		utils.RespondError(c, http.StatusInternalServerError, "Failed to add submission to proceeding")
		return
	}

	utils.RespondSuccess(c, http.StatusCreated, entry)
}

// AdminRemoveSubmission removes a submission from a proceeding.
func (h *ProceedingHandler) AdminRemoveSubmission(c *gin.Context) {
	proceedingID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		utils.RespondError(c, http.StatusBadRequest, "Invalid proceeding ID")
		return
	}

	soumissionID, err := uuid.Parse(c.Param("soumissionId"))
	if err != nil {
		utils.RespondError(c, http.StatusBadRequest, "Invalid soumission ID")
		return
	}

	if err := h.db.Where("proceeding_id = ? AND soumission_id = ?", proceedingID, soumissionID).Delete(&models.ProceedingSubmission{}).Error; err != nil {
		utils.RespondError(c, http.StatusInternalServerError, "Failed to remove submission")
		return
	}

	utils.RespondSuccess(c, http.StatusOK, gin.H{"message": "Submission removed from proceeding"})
}

// PublicListProceedings lists published proceedings for a congress.
func (h *ProceedingHandler) PublicListProceedings(c *gin.Context) {
	congressID, err := uuid.Parse(c.Param("congressId"))
	if err != nil {
		utils.RespondError(c, http.StatusBadRequest, "Invalid congress ID")
		return
	}

	var proceedings []models.Proceeding
	if err := h.db.Where("congress_id = ? AND status = 'published'", congressID).Order("created_at desc").Find(&proceedings).Error; err != nil {
		utils.RespondError(c, http.StatusInternalServerError, "Failed to fetch proceedings")
		return
	}

	utils.RespondSuccess(c, http.StatusOK, proceedings)
}

// PublicGetProceeding gets a published proceeding with submissions.
func (h *ProceedingHandler) PublicGetProceeding(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		utils.RespondError(c, http.StatusBadRequest, "Invalid proceeding ID")
		return
	}

	var proceeding models.Proceeding
	if err := h.db.Where("id = ? AND status = 'published'", id).First(&proceeding).Error; err != nil {
		utils.RespondError(c, http.StatusNotFound, "Proceeding not found")
		return
	}

	var submissions []models.ProceedingSubmission
	h.db.Where("proceeding_id = ?", id).Preload("Soumission").Order("\"order\" asc").Find(&submissions)

	utils.RespondSuccess(c, http.StatusOK, gin.H{
		"proceeding":  proceeding,
		"submissions": submissions,
	})
}
