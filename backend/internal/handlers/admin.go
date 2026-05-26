package handlers

import (
	"fmt"
	"net/http"
	"os"
	"strconv"

	"congres-app/backend/internal/config"
	"congres-app/backend/internal/models"
	"congres-app/backend/internal/services"
	"congres-app/backend/pkg/utils"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type AdminHandler struct {
	db   *gorm.DB
	mail *services.MailService
	cfg  *config.Config
}

func NewAdminHandler(db *gorm.DB, mail *services.MailService, cfg *config.Config) *AdminHandler {
	return &AdminHandler{db: db, mail: mail, cfg: cfg}
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

	go func() {
		user := soumission.User
		if user.Email == "" {
			var u models.User
			if err := h.db.First(&u, "id = ?", soumission.UserID).Error; err == nil {
				user = u
			}
		}
		if user.Email != "" {
			h.mail.SoumissionApprouvee(
				user.Email, user.Prenom, user.Nom,
				soumission.DocumentTitle,
				h.cfg.AppBaseURL+"/soumission/"+soumission.ID.String(),
			)
		}
	}()

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

	go func() {
		user := soumission.User
		if user.Email == "" {
			var u models.User
			if err := h.db.First(&u, "id = ?", soumission.UserID).Error; err == nil {
				user = u
			}
		}
		if user.Email != "" {
			h.mail.SoumissionRejetee(
				user.Email, user.Prenom, user.Nom,
				soumission.DocumentTitle, req.Raison,
				h.cfg.AppBaseURL+"/soumission/"+soumission.ID.String(),
			)
		}
	}()

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
	TotalInscriptions   int64 `json:"total_inscriptions"`
	InscriptionsPresentiel int64 `json:"inscriptions_presentiel"`
	InscriptionsEnLigne    int64 `json:"inscriptions_en_ligne"`
	InscriptionsVirtuel    int64 `json:"inscriptions_virtuel"`
	InscriptionsConfirmees int64 `json:"inscriptions_confirmees"`
	InscriptionsEnAttente  int64 `json:"inscriptions_en_attente"`
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

	h.db.Model(&models.Inscription{}).Count(&stats.TotalInscriptions)
	h.db.Model(&models.Inscription{}).Where("participation_type = ?", "Présentiel").Count(&stats.InscriptionsPresentiel)
	h.db.Model(&models.Inscription{}).Where("participation_type = ?", "En ligne").Count(&stats.InscriptionsEnLigne)
	h.db.Model(&models.Inscription{}).Where("participation_type = ?", "Virtuel").Count(&stats.InscriptionsVirtuel)
	h.db.Model(&models.Inscription{}).Where("payment_status = ?", "confirmed").Count(&stats.InscriptionsConfirmees)
	h.db.Model(&models.Inscription{}).Where("payment_status = ?", "pending").Count(&stats.InscriptionsEnAttente)

	utils.RespondSuccess(c, http.StatusOK, stats)
}

func (h *AdminHandler) ListInscriptions(c *gin.Context) {
	participationType := c.Query("participation_type")
	pays := c.Query("pays")
	paymentStatus := c.Query("payment_status")

	page, err := strconv.Atoi(c.DefaultQuery("page", "1"))
	if err != nil || page < 1 {
		page = 1
	}
	limit, err := strconv.Atoi(c.DefaultQuery("limit", "10"))
	if err != nil || limit < 1 {
		limit = 10
	}
	offset := (page - 1) * limit

	query := h.db.Model(&models.Inscription{}).Order("created_at desc")

	if participationType != "" {
		query = query.Where("participation_type = ?", participationType)
	}
	if pays != "" {
		query = query.Where("pays = ?", pays)
	}
	if paymentStatus != "" {
		query = query.Where("payment_status = ?", paymentStatus)
	}

	var total int64
	if err := query.Count(&total).Error; err != nil {
		utils.RespondError(c, http.StatusInternalServerError, "Failed to count inscriptions")
		return
	}

	var inscriptions []models.Inscription
	if err := query.Offset(offset).Limit(limit).Find(&inscriptions).Error; err != nil {
		utils.RespondError(c, http.StatusInternalServerError, "Failed to fetch inscriptions")
		return
	}

	utils.RespondPaginated(c, inscriptions, total, page, limit)
}

func (h *AdminHandler) ListUsers(c *gin.Context) {
	search := c.Query("search")

	page, err := strconv.Atoi(c.DefaultQuery("page", "1"))
	if err != nil || page < 1 {
		page = 1
	}
	limit, err := strconv.Atoi(c.DefaultQuery("limit", "10"))
	if err != nil || limit < 1 {
		limit = 10
	}
	offset := (page - 1) * limit

	query := h.db.Model(&models.User{}).Order("created_at desc")

	if search != "" {
		like := "%" + search + "%"
		query = query.Where(
			"nom ILIKE ? OR prenom ILIKE ? OR email ILIKE ? OR telephone ILIKE ?",
			like, like, like, like,
		)
	}

	var total int64
	if err := query.Count(&total).Error; err != nil {
		utils.RespondError(c, http.StatusInternalServerError, "Failed to count users")
		return
	}

	var users []models.User
	if err := query.Offset(offset).Limit(limit).Find(&users).Error; err != nil {
		utils.RespondError(c, http.StatusInternalServerError, "Failed to fetch users")
		return
	}

	utils.RespondPaginated(c, users, total, page, limit)
}

func (h *AdminHandler) DeactivateUser(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		utils.RespondError(c, http.StatusBadRequest, "Invalid user ID")
		return
	}

	var user models.User
	if err := h.db.First(&user, "id = ?", id).Error; err != nil {
		utils.RespondError(c, http.StatusNotFound, "User not found")
		return
	}

	if user.Role == "admin" {
		utils.RespondError(c, http.StatusForbidden, "Cannot deactivate an admin account")
		return
	}

	user.Active = !user.Active
	if err := h.db.Save(&user).Error; err != nil {
		utils.RespondError(c, http.StatusInternalServerError, "Failed to update user")
		return
	}

	status := "activé"
	if !user.Active {
		status = "désactivé"
	}
	utils.RespondSuccess(c, http.StatusOK, gin.H{"message": "Compte " + status + " avec succès", "user": user})
}
