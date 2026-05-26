package handlers

import (
	"fmt"
	"net/http"
	"os"
	"strconv"

	"congres-app/backend/internal/models"
	"congres-app/backend/pkg/utils"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type AdminHandler struct {
	db *gorm.DB
}

func NewAdminHandler(db *gorm.DB) *AdminHandler {
	return &AdminHandler{db: db}
}

type RejectRequest struct {
	Raison string `json:"raison" binding:"required"`
}

func (h *AdminHandler) ListSoumissions(c *gin.Context) {
	search := c.Query("search")
	submissionType := c.Query("type")
	statut := c.Query("statut")

	page, err := strconv.Atoi(c.DefaultQuery("page", "1"))
	if err != nil || page < 1 {
		page = 1
	}
	limit, err := strconv.Atoi(c.DefaultQuery("limit", "10"))
	if err != nil || limit < 1 {
		limit = 10
	}
	offset := (page - 1) * limit

	query := h.db.Model(&models.Soumission{}).Preload("User")

	if search != "" {
		like := "%" + search + "%"
		query = query.Where(
			"document_title ILIKE ? OR author_name ILIKE ? OR theme ILIKE ? OR topics ILIKE ?",
			like, like, like, like,
		)
	}
	if submissionType != "" {
		query = query.Where("submission_type = ?", submissionType)
	}
	if statut != "" {
		query = query.Where("statut = ?", statut)
	}

	var total int64
	if err := query.Count(&total).Error; err != nil {
		utils.RespondError(c, http.StatusInternalServerError, "Failed to count soumissions")
		return
	}

	var soumissions []models.Soumission
	if err := query.Order("created_at desc").Offset(offset).Limit(limit).Find(&soumissions).Error; err != nil {
		utils.RespondError(c, http.StatusInternalServerError, "Failed to fetch soumissions")
		return
	}

	utils.RespondPaginated(c, soumissions, total, page, limit)
}

func (h *AdminHandler) GetSoumission(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		utils.RespondError(c, http.StatusBadRequest, "Invalid soumission ID")
		return
	}

	var soumission models.Soumission
	if err := h.db.Preload("User").First(&soumission, "id = ?", id).Error; err != nil {
		utils.RespondError(c, http.StatusNotFound, "Soumission not found")
		return
	}

	utils.RespondSuccess(c, http.StatusOK, soumission)
}

func (h *AdminHandler) DownloadSoumission(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		utils.RespondError(c, http.StatusBadRequest, "Invalid soumission ID")
		return
	}

	var soumission models.Soumission
	if err := h.db.First(&soumission, "id = ?", id).Error; err != nil {
		utils.RespondError(c, http.StatusNotFound, "Soumission not found")
		return
	}

	if soumission.FilePath == "" {
		utils.RespondError(c, http.StatusNotFound, "File not found")
		return
	}

	if _, err := os.Stat(soumission.FilePath); os.IsNotExist(err) {
		utils.RespondError(c, http.StatusNotFound, "File does not exist on server")
		return
	}

	c.Header("Content-Disposition", fmt.Sprintf("attachment; filename=\"%s.pdf\"", soumission.DocumentTitle))
	c.Header("Content-Type", "application/pdf")
	c.File(soumission.FilePath)
}

func (h *AdminHandler) ApproveSoumission(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		utils.RespondError(c, http.StatusBadRequest, "Invalid soumission ID")
		return
	}

	var soumission models.Soumission
	if err := h.db.Preload("User").First(&soumission, "id = ?", id).Error; err != nil {
		utils.RespondError(c, http.StatusNotFound, "Soumission not found")
		return
	}

	statut := "Approuvée"
	soumission.Statut = statut
	soumission.RaisonRejet = nil

	if err := h.db.Save(&soumission).Error; err != nil {
		utils.RespondError(c, http.StatusInternalServerError, "Failed to approve soumission")
		return
	}

	// Notify the submitting user
	go createUserNotification(
		h.db,
		"soumission_approved",
		soumission.UserID,
		&soumission,
		fmt.Sprintf("Votre soumission \"%s\" a été approuvée.", soumission.DocumentTitle),
	)

	utils.RespondSuccess(c, http.StatusOK, soumission)
}

func (h *AdminHandler) RejectSoumission(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		utils.RespondError(c, http.StatusBadRequest, "Invalid soumission ID")
		return
	}

	var req RejectRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.RespondError(c, http.StatusBadRequest, "raison is required")
		return
	}

	var soumission models.Soumission
	if err := h.db.Preload("User").First(&soumission, "id = ?", id).Error; err != nil {
		utils.RespondError(c, http.StatusNotFound, "Soumission not found")
		return
	}

	statut := "Rejetée"
	raison := req.Raison
	soumission.Statut = statut
	soumission.RaisonRejet = &raison

	if err := h.db.Save(&soumission).Error; err != nil {
		utils.RespondError(c, http.StatusInternalServerError, "Failed to reject soumission")
		return
	}

	// Notify the submitting user
	go createUserNotification(
		h.db,
		"soumission_rejected",
		soumission.UserID,
		&soumission,
		fmt.Sprintf("Votre soumission \"%s\" a été rejetée. Raison: %s", soumission.DocumentTitle, req.Raison),
	)

	utils.RespondSuccess(c, http.StatusOK, soumission)
}

func (h *AdminHandler) DeleteSoumission(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		utils.RespondError(c, http.StatusBadRequest, "Invalid soumission ID")
		return
	}

	var soumission models.Soumission
	if err := h.db.First(&soumission, "id = ?", id).Error; err != nil {
		utils.RespondError(c, http.StatusNotFound, "Soumission not found")
		return
	}

	// Remove file from disk
	if soumission.FilePath != "" {
		os.Remove(soumission.FilePath)
	}

	if err := h.db.Delete(&soumission).Error; err != nil {
		utils.RespondError(c, http.StatusInternalServerError, "Failed to delete soumission")
		return
	}

	utils.RespondSuccess(c, http.StatusOK, gin.H{"message": "Soumission deleted successfully"})
}

type StatsResponse struct {
	Total               int64 `json:"total"`
	TotalArticles       int64 `json:"total_articles"`
	TotalPosters        int64 `json:"total_posters"`
	TotalCommunications int64 `json:"total_communications"`
	EnAttente           int64 `json:"en_attente"`
	Approuvees          int64 `json:"approuvees"`
	Rejetees            int64 `json:"rejetees"`
}

func (h *AdminHandler) GetStats(c *gin.Context) {
	var stats StatsResponse

	h.db.Model(&models.Soumission{}).Count(&stats.Total)
	h.db.Model(&models.Soumission{}).Where("submission_type = ?", "Abstract").Count(&stats.TotalArticles)
	h.db.Model(&models.Soumission{}).Where("submission_type = ?", "Poster").Count(&stats.TotalPosters)
	h.db.Model(&models.Soumission{}).Where("submission_type = ?", "Communication").Count(&stats.TotalCommunications)
	h.db.Model(&models.Soumission{}).Where("statut = ?", "En attente").Count(&stats.EnAttente)
	h.db.Model(&models.Soumission{}).Where("statut = ?", "Approuvée").Count(&stats.Approuvees)
	h.db.Model(&models.Soumission{}).Where("statut = ?", "Rejetée").Count(&stats.Rejetees)

	utils.RespondSuccess(c, http.StatusOK, stats)
}

func (h *AdminHandler) ListUsers(c *gin.Context) {
	var users []models.User
	if err := h.db.Order("created_at desc").Find(&users).Error; err != nil {
		utils.RespondError(c, http.StatusInternalServerError, "Failed to fetch users")
		return
	}

	utils.RespondSuccess(c, http.StatusOK, users)
}
