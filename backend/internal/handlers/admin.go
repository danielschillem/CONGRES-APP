package handlers

import (
	"encoding/csv"
	"fmt"
	"log"
	"net/http"
	"os"
	"strconv"
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

type AdminHandler struct {
	db   *gorm.DB
	mail *services.MailService
	cfg  *config.Config
}

func NewAdminHandler(db *gorm.DB, mail *services.MailService, cfg *config.Config) *AdminHandler {
	return &AdminHandler{db: db, mail: mail, cfg: cfg}
}

// resolveCongressFilter returns the congress_id that should scope admin queries.
// For congress_admin: forced from JWT (prevents cross-congress data access).
// For super_admin: optional query param (can filter or see all).
func resolveCongressFilter(c *gin.Context) string {
	role, _ := c.Get(middleware.ContextRole)
	if roleStr, ok := role.(string); ok && roleStr == "congress_admin" {
		cid, _ := c.Get(middleware.ContextCongressID)
		if s, ok := cid.(string); ok {
			return s
		}
	}
	return c.Query("congress_id")
}

type RejectRequest struct {
	Raison string `json:"raison" binding:"required,max=500"`
}

// @Summary     Lister toutes les soumissions (admin)
// @Description Retourne la liste paginée de toutes les soumissions avec filtres optionnels
// @Tags        admin
// @Produce     json
// @Param       search  query string false "Recherche par titre, auteur, thème ou sujet"
// @Param       type    query string false "Filtrer par type (Abstract, Poster, Communication)"
// @Param       statut  query string false "Filtrer par statut (En attente, Approuvée, Rejetée)"
// @Param       page    query int    false "Numéro de page (défaut: 1)"
// @Param       limit   query int    false "Nombre d'éléments par page (défaut: 10)"
// @Success     200 {object} utils.PaginatedResponse{data=[]models.Soumission}
// @Failure     401 {object} utils.ErrorResponse
// @Failure     403 {object} utils.ErrorResponse
// @Security    BearerAuth
// @Router      /admin/soumissions [get]
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

	congressFilter := resolveCongressFilter(c)
	query := h.db.Model(&models.Soumission{}).Preload("User")
	if congressFilter != "" {
		query = query.Joins("JOIN users ON users.id = soumissions.user_id").Where("users.congress_id = ?", congressFilter)
	}

	if search != "" {
		if len(search) > 100 {
			search = search[:100]
		}
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

// @Summary     Récupérer une soumission (admin)
// @Description Retourne les détails d'une soumission avec les informations de l'utilisateur
// @Tags        admin
// @Produce     json
// @Param       id path string true "ID de la soumission"
// @Success     200 {object} utils.SuccessResponse{data=models.Soumission}
// @Failure     400 {object} utils.ErrorResponse
// @Failure     401 {object} utils.ErrorResponse
// @Failure     403 {object} utils.ErrorResponse
// @Failure     404 {object} utils.ErrorResponse
// @Security    BearerAuth
// @Router      /admin/soumissions/{id} [get]
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

// @Summary     Télécharger le fichier d'une soumission
// @Description Télécharge le fichier PDF associé à une soumission
// @Tags        admin
// @Produce     application/pdf
// @Param       id path string true "ID de la soumission"
// @Success     200 {file} binary
// @Failure     400 {object} utils.ErrorResponse
// @Failure     401 {object} utils.ErrorResponse
// @Failure     403 {object} utils.ErrorResponse
// @Failure     404 {object} utils.ErrorResponse
// @Security    BearerAuth
// @Router      /admin/soumissions/{id}/download [get]
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

// @Summary     Approuver une soumission
// @Description Approuve une soumission et notifie l'utilisateur par email
// @Tags        admin
// @Produce     json
// @Param       id path string true "ID de la soumission"
// @Success     200 {object} utils.SuccessResponse{data=models.Soumission}
// @Failure     400 {object} utils.ErrorResponse
// @Failure     401 {object} utils.ErrorResponse
// @Failure     403 {object} utils.ErrorResponse
// @Failure     404 {object} utils.ErrorResponse
// @Security    BearerAuth
// @Router      /admin/soumissions/{id}/approve [post]
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

	if err := h.db.Model(&soumission).Select("Statut", "RaisonRejet").Updates(&soumission).Error; err != nil {
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
		defer func() {
			if r := recover(); r != nil {
				log.Printf("[PANIC] ApproveSoumission mail: %v", r)
			}
		}()
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

// @Summary     Rejeter une soumission
// @Description Rejette une soumission avec une raison et notifie l'utilisateur par email
// @Tags        admin
// @Accept      json
// @Produce     json
// @Param       id      path string       true "ID de la soumission"
// @Param       request body RejectRequest true "Raison du rejet"
// @Success     200 {object} utils.SuccessResponse{data=models.Soumission}
// @Failure     400 {object} utils.ErrorResponse
// @Failure     401 {object} utils.ErrorResponse
// @Failure     403 {object} utils.ErrorResponse
// @Failure     404 {object} utils.ErrorResponse
// @Security    BearerAuth
// @Router      /admin/soumissions/{id}/reject [post]
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

	if err := h.db.Model(&soumission).Select("Statut", "RaisonRejet").Updates(&soumission).Error; err != nil {
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
		defer func() {
			if r := recover(); r != nil {
				log.Printf("[PANIC] RejectSoumission mail: %v", r)
			}
		}()
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

// @Summary     Supprimer une soumission (admin)
// @Description Supprime une soumission et son fichier associé
// @Tags        admin
// @Produce     json
// @Param       id path string true "ID de la soumission"
// @Success     200 {object} utils.SuccessResponse{data=object{message=string}}
// @Failure     400 {object} utils.ErrorResponse
// @Failure     401 {object} utils.ErrorResponse
// @Failure     403 {object} utils.ErrorResponse
// @Failure     404 {object} utils.ErrorResponse
// @Security    BearerAuth
// @Router      /admin/soumissions/{id} [delete]
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

// @Summary     Obtenir les statistiques
// @Description Retourne les statistiques globales des soumissions et inscriptions
// @Tags        admin
// @Produce     json
// @Success     200 {object} utils.SuccessResponse{data=StatsResponse}
// @Failure     401 {object} utils.ErrorResponse
// @Failure     403 {object} utils.ErrorResponse
// @Security    BearerAuth
// @Router      /admin/stats [get]
func (h *AdminHandler) GetStats(c *gin.Context) {
	var stats StatsResponse

	congressFilter := resolveCongressFilter(c)

	soumScope := func(db *gorm.DB) *gorm.DB {
		if congressFilter != "" {
			return db.Joins("JOIN users ON users.id = soumissions.user_id").Where("users.congress_id = ?", congressFilter)
		}
		return db
	}
	inscScope := func(db *gorm.DB) *gorm.DB {
		if congressFilter != "" {
			return db.Where("congress_id = ?", congressFilter)
		}
		return db
	}

	h.db.Model(&models.Soumission{}).Scopes(soumScope).Count(&stats.Total)
	h.db.Model(&models.Soumission{}).Scopes(soumScope).Where("submission_type = ?", "Abstract").Count(&stats.TotalArticles)
	h.db.Model(&models.Soumission{}).Scopes(soumScope).Where("submission_type = ?", "Poster").Count(&stats.TotalPosters)
	h.db.Model(&models.Soumission{}).Scopes(soumScope).Where("submission_type = ?", "Communication").Count(&stats.TotalCommunications)
	h.db.Model(&models.Soumission{}).Scopes(soumScope).Where("statut = ?", "En attente").Count(&stats.EnAttente)
	h.db.Model(&models.Soumission{}).Scopes(soumScope).Where("statut = ?", "Approuvée").Count(&stats.Approuvees)
	h.db.Model(&models.Soumission{}).Scopes(soumScope).Where("statut = ?", "Rejetée").Count(&stats.Rejetees)

	h.db.Model(&models.Inscription{}).Scopes(inscScope).Count(&stats.TotalInscriptions)
	h.db.Model(&models.Inscription{}).Scopes(inscScope).Where("participation_type = ?", "Présentiel").Count(&stats.InscriptionsPresentiel)
	h.db.Model(&models.Inscription{}).Scopes(inscScope).Where("participation_type = ?", "En ligne").Count(&stats.InscriptionsEnLigne)
	h.db.Model(&models.Inscription{}).Scopes(inscScope).Where("participation_type = ?", "Virtuel").Count(&stats.InscriptionsVirtuel)
	h.db.Model(&models.Inscription{}).Scopes(inscScope).Where("payment_status = ?", "confirmed").Count(&stats.InscriptionsConfirmees)
	h.db.Model(&models.Inscription{}).Scopes(inscScope).Where("payment_status = ?", "pending").Count(&stats.InscriptionsEnAttente)

	utils.RespondSuccess(c, http.StatusOK, stats)
}

// @Summary     Lister les inscriptions (admin)
// @Description Retourne la liste paginée de toutes les inscriptions avec filtres optionnels
// @Tags        admin
// @Produce     json
// @Param       participation_type query string false "Filtrer par type de participation"
// @Param       pays               query string false "Filtrer par pays"
// @Param       payment_status     query string false "Filtrer par statut de paiement"
// @Param       page               query int    false "Numéro de page (défaut: 1)"
// @Param       limit              query int    false "Nombre d'éléments par page (défaut: 10)"
// @Success     200 {object} utils.PaginatedResponse{data=[]models.Inscription}
// @Failure     401 {object} utils.ErrorResponse
// @Failure     403 {object} utils.ErrorResponse
// @Security    BearerAuth
// @Router      /admin/inscriptions [get]
func (h *AdminHandler) ListInscriptions(c *gin.Context) {
	participationType := c.Query("participation_type")
	pays := c.Query("pays")
	paymentStatus := c.Query("payment_status")
	congressID := resolveCongressFilter(c)

	page, err := strconv.Atoi(c.DefaultQuery("page", "1"))
	if err != nil || page < 1 {
		page = 1
	}
	limit, err := strconv.Atoi(c.DefaultQuery("limit", "10"))
	if err != nil || limit < 1 {
		limit = 10
	}
	offset := (page - 1) * limit

	query := h.db.Model(&models.Inscription{}).Preload("Congress").Order("created_at desc")

	if participationType != "" {
		query = query.Where("participation_type = ?", participationType)
	}
	if pays != "" {
		query = query.Where("pays = ?", pays)
	}
	if paymentStatus != "" {
		query = query.Where("payment_status = ?", paymentStatus)
	}
	if congressID != "" {
		query = query.Where("congress_id = ?", congressID)
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

// @Summary     Exporter les soumissions en CSV
// @Description Exporte la liste des soumissions au format CSV avec filtres optionnels
// @Tags        admin
// @Produce     text/csv
// @Param       search  query string false "Recherche"
// @Param       type    query string false "Filtrer par type"
// @Param       statut  query string false "Filtrer par statut"
// @Success     200 {file} binary
// @Failure     401 {object} utils.ErrorResponse
// @Failure     403 {object} utils.ErrorResponse
// @Security    BearerAuth
// @Router      /admin/soumissions/export/csv [get]
func (h *AdminHandler) ExportSoumissionsCSV(c *gin.Context) {
	search := c.Query("search")
	submissionType := c.Query("type")
	statut := c.Query("statut")

	congressFilter := resolveCongressFilter(c)
	query := h.db.Model(&models.Soumission{}).Preload("User").Order("created_at desc")
	if congressFilter != "" {
		query = query.Joins("JOIN users ON users.id = soumissions.user_id").Where("users.congress_id = ?", congressFilter)
	}

	if search != "" {
		if len(search) > 100 {
			search = search[:100]
		}
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

	var soumissions []models.Soumission
	if err := query.Find(&soumissions).Error; err != nil {
		utils.RespondError(c, http.StatusInternalServerError, "Failed to export soumissions")
		return
	}

	c.Header("Content-Type", "text/csv; charset=utf-8")
	c.Header("Content-Disposition", fmt.Sprintf("attachment; filename=\"soumissions_%s.csv\"", time.Now().Format("2006-01-02")))

	// Write BOM for Excel compatibility
	c.Writer.Write([]byte{0xEF, 0xBB, 0xBF})

	writer := csv.NewWriter(c.Writer)
	defer writer.Flush()

	writer.Write([]string{
		"ID", "Auteur", "Email", "Type", "Thème", "Titre",
		"Statut", "Raison Rejet", "Créé le", "Mis à jour le",
	})

	for _, s := range soumissions {
		authorName := s.AuthorName
		authorEmail := ""
		if s.User.Email != "" {
			authorEmail = s.User.Email
		}
		raison := ""
		if s.RaisonRejet != nil {
			raison = *s.RaisonRejet
		}
		writer.Write([]string{
			s.ID.String(),
			authorName,
			authorEmail,
			s.SubmissionType,
			s.Theme,
			s.DocumentTitle,
			s.Statut,
			raison,
			s.CreatedAt.Format("2006-01-02 15:04:05"),
			s.UpdatedAt.Format("2006-01-02 15:04:05"),
		})
	}
}

// @Summary     Exporter les inscriptions en CSV
// @Description Exporte la liste des inscriptions au format CSV avec filtres optionnels
// @Tags        admin
// @Produce     text/csv
// @Param       participation_type query string false "Filtrer par type de participation"
// @Param       pays               query string false "Filtrer par pays"
// @Param       payment_status     query string false "Filtrer par statut de paiement"
// @Success     200 {file} binary
// @Failure     401 {object} utils.ErrorResponse
// @Failure     403 {object} utils.ErrorResponse
// @Security    BearerAuth
// @Router      /admin/inscriptions/export/csv [get]
func (h *AdminHandler) ExportInscriptionsCSV(c *gin.Context) {
	participationType := c.Query("participation_type")
	pays := c.Query("pays")
	paymentStatus := c.Query("payment_status")
	congressID := resolveCongressFilter(c)

	query := h.db.Model(&models.Inscription{}).Preload("Congress").Order("created_at desc")

	if participationType != "" {
		query = query.Where("participation_type = ?", participationType)
	}
	if pays != "" {
		query = query.Where("pays = ?", pays)
	}
	if paymentStatus != "" {
		query = query.Where("payment_status = ?", paymentStatus)
	}
	if congressID != "" {
		query = query.Where("congress_id = ?", congressID)
	}

	var inscriptions []models.Inscription
	if err := query.Find(&inscriptions).Error; err != nil {
		utils.RespondError(c, http.StatusInternalServerError, "Failed to export inscriptions")
		return
	}

	c.Header("Content-Type", "text/csv; charset=utf-8")
	c.Header("Content-Disposition", fmt.Sprintf("attachment; filename=\"inscriptions_%s.csv\"", time.Now().Format("2006-01-02")))

	// Write BOM for Excel compatibility
	c.Writer.Write([]byte{0xEF, 0xBB, 0xBF})

	writer := csv.NewWriter(c.Writer)
	defer writer.Flush()

	writer.Write([]string{
		"ID", "Nom", "Prénom", "Email", "Téléphone", "Organisme",
		"Pays", "Type Participation", "Montant (FCFA)", "Méthode Paiement",
		"N° Facture", "Transaction ID", "Statut Paiement", "Date inscription",
	})

	for _, s := range inscriptions {
		writer.Write([]string{
			strconv.FormatUint(uint64(s.ID), 10),
			s.Nom,
			s.Prenom,
			s.Email,
			s.Telephone,
			s.Organisme,
			s.Pays,
			s.ParticipationType,
			fmt.Sprintf("%.0f", s.Montant),
			s.MethodePaiement,
			s.NumeroFacture,
			s.TransactionID,
			s.PaymentStatus,
			s.CreatedAt.Format("2006-01-02 15:04:05"),
		})
	}
}

// ConfirmPayment manually sets an inscription's payment_status to "confirmed".
func (h *AdminHandler) ConfirmPayment(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 64)
	if err != nil {
		utils.RespondError(c, http.StatusBadRequest, "Invalid inscription ID")
		return
	}

	var inscription models.Inscription
	if err := h.db.First(&inscription, id).Error; err != nil {
		utils.RespondError(c, http.StatusNotFound, "Inscription not found")
		return
	}

	if err := h.db.Model(&inscription).Updates(map[string]interface{}{
		"payment_status": "confirmed",
		"transaction_id": fmt.Sprintf("MANUAL-%d", time.Now().UnixNano()),
	}).Error; err != nil {
		utils.RespondError(c, http.StatusInternalServerError, "Failed to confirm payment")
		return
	}

	go func() {
		defer func() {
			if r := recover(); r != nil {
				log.Printf("[PANIC] ConfirmPayment mail: %v", r)
			}
		}()
		var user models.User
		if err := h.db.First(&user, "id = ?", inscription.UserID).Error; err == nil && user.Email != "" {
			h.mail.InscriptionConfirmee(
				user.Email, user.Prenom, user.Nom,
				inscription.ParticipationType,
				inscription.NumeroFacture,
				fmt.Sprintf("%.0f", inscription.Montant),
			)
		}
	}()

	utils.RespondSuccess(c, http.StatusOK, gin.H{"message": "Payment confirmed"})
}

// @Summary     Lister les utilisateurs (admin)
// @Description Retourne la liste paginée de tous les utilisateurs avec recherche optionnelle
// @Tags        admin
// @Produce     json
// @Param       search query string false "Recherche par nom, prénom, email ou téléphone"
// @Param       page   query int    false "Numéro de page (défaut: 1)"
// @Param       limit  query int    false "Nombre d'éléments par page (défaut: 10)"
// @Success     200 {object} utils.PaginatedResponse{data=[]models.User}
// @Failure     401 {object} utils.ErrorResponse
// @Failure     403 {object} utils.ErrorResponse
// @Security    BearerAuth
// @Router      /admin/users [get]
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

	congressFilter := resolveCongressFilter(c)
	query := h.db.Model(&models.User{}).Order("created_at desc")
	if congressFilter != "" {
		query = query.Where("congress_id = ?", congressFilter)
	}

	if search != "" {
		if len(search) > 100 {
			search = search[:100]
		}
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

// @Summary     Activer/Désactiver un utilisateur
// @Description Bascule le statut actif d'un utilisateur (activation/désactivation)
// @Tags        admin
// @Produce     json
// @Param       id path string true "ID de l'utilisateur"
// @Success     200 {object} utils.SuccessResponse{data=object{message=string,user=models.User}}
// @Failure     400 {object} utils.ErrorResponse
// @Failure     401 {object} utils.ErrorResponse
// @Failure     403 {object} utils.ErrorResponse
// @Failure     404 {object} utils.ErrorResponse
// @Security    BearerAuth
// @Router      /admin/users/{id}/deactivate [patch]
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

	if user.Role == "super_admin" {
		utils.RespondError(c, http.StatusForbidden, "Cannot deactivate a super admin account")
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

type AssignReviewerRequest struct {
	ReviewerID string `json:"reviewer_id" binding:"required"`
}

// AssignReviewer assigns a reviewer to a submission.
func (h *AdminHandler) AssignReviewer(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		utils.RespondError(c, http.StatusBadRequest, "Invalid soumission ID")
		return
	}

	var req AssignReviewerRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.RespondError(c, http.StatusBadRequest, "reviewer_id is required")
		return
	}

	reviewerID, err := uuid.Parse(req.ReviewerID)
	if err != nil {
		utils.RespondError(c, http.StatusBadRequest, "Invalid reviewer_id")
		return
	}

	// Verify soumission exists
	var soumission models.Soumission
	if err := h.db.First(&soumission, "id = ?", id).Error; err != nil {
		utils.RespondError(c, http.StatusNotFound, "Soumission not found")
		return
	}

	// Verify reviewer exists and has reviewer role
	var reviewer models.User
	if err := h.db.Where("id = ? AND role = ?", reviewerID, "reviewer").First(&reviewer).Error; err != nil {
		utils.RespondError(c, http.StatusNotFound, "Reviewer not found")
		return
	}

	// Check if already assigned
	var existing int64
	h.db.Model(&models.Review{}).Where("soumission_id = ? AND reviewer_id = ?", id, reviewerID).Count(&existing)
	if existing > 0 {
		utils.RespondError(c, http.StatusConflict, "Reviewer already assigned to this soumission")
		return
	}

	review := models.Review{
		SoumissionID: id,
		ReviewerID:   reviewerID,
		Status:       "assigned",
	}

	if err := h.db.Create(&review).Error; err != nil {
		utils.RespondError(c, http.StatusInternalServerError, "Failed to assign reviewer")
		return
	}

	// Update soumission status to "En révision"
	if soumission.Statut == "En attente" {
		h.db.Model(&soumission).Update("statut", "En révision")
	}

	// Notify reviewer
	go createUserNotification(h.db, "review_assigned", reviewerID, &soumission,
		"Vous avez été assigné comme reviewer pour la soumission \""+soumission.DocumentTitle+"\".",
	)

	utils.RespondSuccess(c, http.StatusCreated, review)
}
