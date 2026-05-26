package handlers

import (
	"encoding/json"
	"fmt"
	"log"
	"mime/multipart"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	"congres-app/backend/internal/config"
	"congres-app/backend/internal/middleware"
	"congres-app/backend/internal/models"
	"congres-app/backend/internal/services"
	"congres-app/backend/pkg/utils"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/lib/pq"
	"gorm.io/datatypes"
	"gorm.io/gorm"
)

type SoumissionHandler struct {
	db   *gorm.DB
	cfg  *config.Config
	mail *services.MailService
}

func NewSoumissionHandler(db *gorm.DB, cfg *config.Config, mail *services.MailService) *SoumissionHandler {
	return &SoumissionHandler{db: db, cfg: cfg, mail: mail}
}

// createAdminNotification creates a notification for all admin users about a soumission event.
func createAdminNotification(db *gorm.DB, notifType string, soumission *models.Soumission, message string) {
	defer func() {
		if r := recover(); r != nil {
			log.Printf("[PANIC] createAdminNotification: %v", r)
		}
	}()
	var admins []models.User
	if err := db.Where("role = ?", "admin").Find(&admins).Error; err != nil {
		return
	}

	dataMap := map[string]interface{}{
		"message":          message,
		"soumission_id":    soumission.ID.String(),
		"soumission_title": soumission.DocumentTitle,
	}
	dataJSON, err := json.Marshal(dataMap)
	if err != nil {
		return
	}

	for _, admin := range admins {
		notif := models.Notification{
			ID:             uuid.New(),
			Type:           notifType,
			NotifiableID:   admin.ID,
			NotifiableType: "User",
			Data:           datatypes.JSON(dataJSON),
		}
		db.Create(&notif)
	}
}

// createUserNotification creates a notification for a specific user.
func createUserNotification(db *gorm.DB, notifType string, userID uuid.UUID, soumission *models.Soumission, message string) {
	dataMap := map[string]interface{}{
		"message":          message,
		"soumission_id":    soumission.ID.String(),
		"soumission_title": soumission.DocumentTitle,
	}
	dataJSON, err := json.Marshal(dataMap)
	if err != nil {
		return
	}

	notif := models.Notification{
		ID:             uuid.New(),
		Type:           notifType,
		NotifiableID:   userID,
		NotifiableType: "User",
		Data:           datatypes.JSON(dataJSON),
	}
	db.Create(&notif)
}

// @Summary     Lister les soumissions de l'utilisateur
// @Description Retourne la liste des soumissions de l'utilisateur connecté, triées par date de création
// @Tags        soumissions
// @Produce     json
// @Success     200 {object} utils.SuccessResponse{data=[]models.Soumission}
// @Failure     401 {object} utils.ErrorResponse
// @Security    BearerAuth
// @Router      /soumissions [get]
func (h *SoumissionHandler) ListUserSoumissions(c *gin.Context) {
	userIDStr, _ := c.Get(middleware.ContextUserID)
	userID, err := uuid.Parse(userIDStr.(string))
	if err != nil {
		utils.RespondError(c, http.StatusUnauthorized, "Invalid user ID")
		return
	}

	var soumissions []models.Soumission
	if err := h.db.Where("user_id = ?", userID).Order("created_at desc").Find(&soumissions).Error; err != nil {
		utils.RespondError(c, http.StatusInternalServerError, "Failed to fetch soumissions")
		return
	}

	utils.RespondSuccess(c, http.StatusOK, soumissions)
}

// @Summary     Créer une nouvelle soumission
// @Description Soumet un document (PDF) avec les métadonnées associées pour un congrès
// @Tags        soumissions
// @Accept      multipart/form-data
// @Produce     json
// @Param       submission_type formData string true "Type de soumission (Abstract, Poster, Communication)"
// @Param       theme formData string true "Thème"
// @Param       topics formData string true "Sujets"
// @Param       document_title formData string true "Titre du document"
// @Param       author_name formData string true "Nom de l'auteur"
// @Param       resume formData string true "Résumé"
// @Param       keywords formData string false "Mots-clés (JSON array ou séparés par des virgules)"
// @Param       file formData file true "Fichier PDF"
// @Success     201 {object} utils.SuccessResponse{data=models.Soumission}
// @Failure     400 {object} utils.ErrorResponse
// @Failure     401 {object} utils.ErrorResponse
// @Security    BearerAuth
// @Router      /soumissions [post]
func (h *SoumissionHandler) CreateSoumission(c *gin.Context) {
	userIDStr, _ := c.Get(middleware.ContextUserID)
	userID, err := uuid.Parse(userIDStr.(string))
	if err != nil {
		utils.RespondError(c, http.StatusUnauthorized, "Invalid user ID")
		return
	}

	submissionType := c.PostForm("submission_type")
	theme := c.PostForm("theme")
	topics := c.PostForm("topics")
	documentTitle := c.PostForm("document_title")
	authorName := c.PostForm("author_name")
	resume := c.PostForm("resume")
	keywordsStr := c.PostForm("keywords")

	if submissionType == "" || theme == "" || topics == "" || documentTitle == "" || authorName == "" || resume == "" {
		utils.RespondError(c, http.StatusBadRequest, "submission_type, theme, topics, document_title, author_name, and resume are required")
		return
	}

	// Validate submission type
	validTypes := map[string]bool{"Abstract": true, "Poster": true, "Communication": true}
	if !validTypes[submissionType] {
		utils.RespondError(c, http.StatusBadRequest, "submission_type must be one of: Abstract, Poster, Communication")
		return
	}

	// Handle file upload
	file, err := c.FormFile("file")
	if err != nil {
		utils.RespondError(c, http.StatusBadRequest, "PDF file is required")
		return
	}

	// Validate file size (max 50MB)
	const maxFileSize int64 = 50 << 20 // 50MB
	if file.Size > maxFileSize {
		utils.RespondError(c, http.StatusBadRequest, "File size exceeds 50MB limit")
		return
	}

	// Validate PDF file
	if err := validatePDFFile(file); err != nil {
		utils.RespondError(c, http.StatusBadRequest, err.Error())
		return
	}

	// Ensure upload directory exists
	uploadPath := h.cfg.UploadPath
	if err := os.MkdirAll(uploadPath, 0700); err != nil {
		utils.RespondError(c, http.StatusInternalServerError, "Failed to create upload directory")
		return
	}

	// Generate unique filename
	ext := filepath.Ext(file.Filename)
	uniqueFilename := fmt.Sprintf("%s_%s%s", uuid.New().String(), sanitizeFilename(file.Filename), ext)
	// Avoid double extension
	baseName := strings.TrimSuffix(file.Filename, ext)
	uniqueFilename = fmt.Sprintf("%s_%s%s", uuid.New().String(), sanitizeFilename(baseName), ext)
	filePath := filepath.Join(uploadPath, uniqueFilename)

	if err := c.SaveUploadedFile(file, filePath); err != nil {
		utils.RespondError(c, http.StatusInternalServerError, "Failed to save file")
		return
	}

	// Parse keywords
	var keywords pq.StringArray
	if keywordsStr != "" {
		// Try JSON array first
		if err := json.Unmarshal([]byte(keywordsStr), &keywords); err != nil {
			// Fallback: comma-separated
			parts := strings.Split(keywordsStr, ",")
			for _, p := range parts {
				trimmed := strings.TrimSpace(p)
				if trimmed != "" {
					keywords = append(keywords, trimmed)
				}
			}
		}
	}

	soumission := models.Soumission{
		ID:             uuid.New(),
		SubmissionType: submissionType,
		Theme:          theme,
		Topics:         topics,
		DocumentTitle:  documentTitle,
		AuthorName:     authorName,
		Resume:         resume,
		Keywords:       keywords,
		FilePath:       filePath,
		UserID:         userID,
		Statut:         "En attente",
	}

	if err := h.db.Create(&soumission).Error; err != nil {
		// Clean up uploaded file on DB failure
		os.Remove(filePath)
		utils.RespondError(c, http.StatusInternalServerError, "Failed to create soumission")
		return
	}

	// Notify admins
	go createAdminNotification(h.db, "soumission_created",
		&soumission,
		fmt.Sprintf("Nouvelle soumission: %s par %s", soumission.DocumentTitle, soumission.AuthorName),
	)

	go func() {
		defer func() {
			if r := recover(); r != nil {
				log.Printf("[PANIC] CreateSoumission mail: %v", r)
			}
		}()
		var admins []models.User
		if err := h.db.Where("role = ?", "admin").Find(&admins).Error; err == nil {
			for _, admin := range admins {
				if admin.Email != "" {
					h.mail.NouvelleSoumissionAdmin(
						admin.Email, admin.Prenom, admin.Nom,
						soumission.DocumentTitle, soumission.AuthorName,
						h.cfg.AppBaseURL+"/admin/soumissions/"+soumission.ID.String(),
					)
				}
			}
		}
	}()

	utils.RespondSuccess(c, http.StatusCreated, soumission)
}

// @Summary     Récupérer une soumission
// @Description Retourne les détails d'une soumission spécifique de l'utilisateur connecté
// @Tags        soumissions
// @Produce     json
// @Param       id path string true "ID de la soumission"
// @Success     200 {object} utils.SuccessResponse{data=models.Soumission}
// @Failure     400 {object} utils.ErrorResponse
// @Failure     401 {object} utils.ErrorResponse
// @Failure     404 {object} utils.ErrorResponse
// @Security    BearerAuth
// @Router      /soumissions/{id} [get]
func (h *SoumissionHandler) GetSoumission(c *gin.Context) {
	userIDStr, _ := c.Get(middleware.ContextUserID)
	userID, err := uuid.Parse(userIDStr.(string))
	if err != nil {
		utils.RespondError(c, http.StatusUnauthorized, "Invalid user ID")
		return
	}

	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		utils.RespondError(c, http.StatusBadRequest, "Invalid soumission ID")
		return
	}

	var soumission models.Soumission
	if err := h.db.Where("id = ? AND user_id = ?", id, userID).First(&soumission).Error; err != nil {
		utils.RespondError(c, http.StatusNotFound, "Soumission not found")
		return
	}

	utils.RespondSuccess(c, http.StatusOK, soumission)
}

// @Summary     Modifier une soumission
// @Description Met à jour les informations et/ou le fichier d'une soumission en attente
// @Tags        soumissions
// @Accept      multipart/form-data
// @Produce     json
// @Param       id path string true "ID de la soumission"
// @Param       submission_type formData string false "Type de soumission (Abstract, Poster, Communication)"
// @Param       theme formData string false "Thème"
// @Param       topics formData string false "Sujets"
// @Param       document_title formData string false "Titre du document"
// @Param       author_name formData string false "Nom de l'auteur"
// @Param       resume formData string false "Résumé"
// @Param       keywords formData string false "Mots-clés"
// @Param       file formData file false "Nouveau fichier PDF"
// @Success     200 {object} utils.SuccessResponse{data=models.Soumission}
// @Failure     400 {object} utils.ErrorResponse
// @Failure     401 {object} utils.ErrorResponse
// @Failure     403 {object} utils.ErrorResponse
// @Failure     404 {object} utils.ErrorResponse
// @Security    BearerAuth
// @Router      /soumissions/{id} [patch]
func (h *SoumissionHandler) UpdateSoumission(c *gin.Context) {
	userIDStr, _ := c.Get(middleware.ContextUserID)
	userID, err := uuid.Parse(userIDStr.(string))
	if err != nil {
		utils.RespondError(c, http.StatusUnauthorized, "Invalid user ID")
		return
	}

	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		utils.RespondError(c, http.StatusBadRequest, "Invalid soumission ID")
		return
	}

	var soumission models.Soumission
	if err := h.db.Where("id = ? AND user_id = ?", id, userID).First(&soumission).Error; err != nil {
		utils.RespondError(c, http.StatusNotFound, "Soumission not found")
		return
	}

	if soumission.Statut != "En attente" {
		utils.RespondError(c, http.StatusForbidden, "Only soumissions with status 'En attente' can be updated")
		return
	}

	// Update text fields if provided
	if v := c.PostForm("submission_type"); v != "" {
		validTypes := map[string]bool{"Abstract": true, "Poster": true, "Communication": true}
		if !validTypes[v] {
			utils.RespondError(c, http.StatusBadRequest, "submission_type must be one of: Abstract, Poster, Communication")
			return
		}
		soumission.SubmissionType = v
	}
	if v := c.PostForm("theme"); v != "" {
		soumission.Theme = v
	}
	if v := c.PostForm("topics"); v != "" {
		soumission.Topics = v
	}
	if v := c.PostForm("document_title"); v != "" {
		soumission.DocumentTitle = v
	}
	if v := c.PostForm("author_name"); v != "" {
		soumission.AuthorName = v
	}
	if v := c.PostForm("resume"); v != "" {
		soumission.Resume = v
	}
	if v := c.PostForm("keywords"); v != "" {
		var keywords pq.StringArray
		if err := json.Unmarshal([]byte(v), &keywords); err != nil {
			parts := strings.Split(v, ",")
			for _, p := range parts {
				trimmed := strings.TrimSpace(p)
				if trimmed != "" {
					keywords = append(keywords, trimmed)
				}
			}
		}
		soumission.Keywords = keywords
	}

	// Handle optional new file upload
	file, err := c.FormFile("file")
	if err == nil {
		const maxFileSize int64 = 50 << 20 // 50MB
		if file.Size > maxFileSize {
			utils.RespondError(c, http.StatusBadRequest, "File size exceeds 50MB limit")
			return
		}

		if !strings.HasSuffix(strings.ToLower(file.Filename), ".pdf") {
			utils.RespondError(c, http.StatusBadRequest, "Only PDF files are accepted")
			return
		}

		fileHeader := file.Header.Get("Content-Type")
		if fileHeader != "" && fileHeader != "application/pdf" {
			utils.RespondError(c, http.StatusBadRequest, "File content type is not PDF")
			return
		}

		openedFile, err := file.Open()
		if err != nil {
			utils.RespondError(c, http.StatusInternalServerError, "Failed to read file")
			return
		}
		magicBuf := make([]byte, 5)
		if _, err := openedFile.Read(magicBuf); err != nil || string(magicBuf) != "%PDF-" {
			openedFile.Close()
			utils.RespondError(c, http.StatusBadRequest, "File content is not a valid PDF")
			return
		}
		openedFile.Close()

		uploadPath := h.cfg.UploadPath
		if err := os.MkdirAll(uploadPath, 0700); err != nil {
			utils.RespondError(c, http.StatusInternalServerError, "Failed to create upload directory")
			return
		}

		ext := filepath.Ext(file.Filename)
		baseName := strings.TrimSuffix(file.Filename, ext)
		uniqueFilename := fmt.Sprintf("%s_%s%s", uuid.New().String(), sanitizeFilename(baseName), ext)
		newFilePath := filepath.Join(uploadPath, uniqueFilename)

		if err := c.SaveUploadedFile(file, newFilePath); err != nil {
			utils.RespondError(c, http.StatusInternalServerError, "Failed to save file")
			return
		}

		// Remove old file
		if soumission.FilePath != "" {
			os.Remove(soumission.FilePath)
		}
		soumission.FilePath = newFilePath
	}

	soumission.UpdatedAt = time.Now()
	if err := h.db.Save(&soumission).Error; err != nil {
		utils.RespondError(c, http.StatusInternalServerError, "Failed to update soumission")
		return
	}

	// Notify admins
	go createAdminNotification(h.db, "soumission_updated",
		&soumission,
		fmt.Sprintf("Soumission mise à jour: %s par %s", soumission.DocumentTitle, soumission.AuthorName),
	)

	go func() {
		defer func() {
			if r := recover(); r != nil {
				log.Printf("[PANIC] UpdateSoumission mail: %v", r)
			}
		}()
		var admins []models.User
		if err := h.db.Where("role = ?", "admin").Find(&admins).Error; err == nil {
			for _, admin := range admins {
				if admin.Email != "" {
					h.mail.SoumissionModifieeAdmin(
						admin.Email, admin.Prenom, admin.Nom,
						soumission.DocumentTitle, soumission.AuthorName,
						h.cfg.AppBaseURL+"/admin/soumissions/"+soumission.ID.String(),
					)
				}
			}
		}
	}()

	utils.RespondSuccess(c, http.StatusOK, soumission)
}

// @Summary     Supprimer une soumission
// @Description Supprime une soumission de l'utilisateur connecté et son fichier associé
// @Tags        soumissions
// @Produce     json
// @Param       id path string true "ID de la soumission"
// @Success     200 {object} utils.SuccessResponse{data=object{message=string}}
// @Failure     400 {object} utils.ErrorResponse
// @Failure     401 {object} utils.ErrorResponse
// @Failure     404 {object} utils.ErrorResponse
// @Security    BearerAuth
// @Router      /soumissions/{id} [delete]
func (h *SoumissionHandler) DeleteSoumission(c *gin.Context) {
	userIDStr, _ := c.Get(middleware.ContextUserID)
	userID, err := uuid.Parse(userIDStr.(string))
	if err != nil {
		utils.RespondError(c, http.StatusUnauthorized, "Invalid user ID")
		return
	}

	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		utils.RespondError(c, http.StatusBadRequest, "Invalid soumission ID")
		return
	}

	var soumission models.Soumission
	if err := h.db.Where("id = ? AND user_id = ?", id, userID).First(&soumission).Error; err != nil {
		utils.RespondError(c, http.StatusNotFound, "Soumission not found")
		return
	}

	if soumission.FilePath != "" {
		os.Remove(soumission.FilePath)
	}

	if err := h.db.Delete(&soumission).Error; err != nil {
		utils.RespondError(c, http.StatusInternalServerError, "Failed to delete soumission")
		return
	}

	utils.RespondSuccess(c, http.StatusOK, gin.H{"message": "Soumission deleted successfully"})
}

// sanitizeFilename removes unsafe characters from filenames.
func sanitizeFilename(name string) string {
	var result []rune
	for _, r := range name {
		if (r >= 'a' && r <= 'z') || (r >= 'A' && r <= 'Z') || (r >= '0' && r <= '9') || r == '-' || r == '_' || r == '.' {
			result = append(result, r)
		} else {
			result = append(result, '_')
		}
	}
	return string(result)
}

func validatePDFFile(file *multipart.FileHeader) error {
	if !strings.HasSuffix(strings.ToLower(file.Filename), ".pdf") {
		return fmt.Errorf("Only PDF files are accepted")
	}
	fileHeader := file.Header.Get("Content-Type")
	if fileHeader != "" && fileHeader != "application/pdf" {
		return fmt.Errorf("File content type is not PDF")
	}
	openedFile, err := file.Open()
	if err != nil {
		return fmt.Errorf("Failed to read file")
	}
	defer openedFile.Close()
	magicBuf := make([]byte, 5)
	if _, err := openedFile.Read(magicBuf); err != nil || string(magicBuf) != "%PDF-" {
		return fmt.Errorf("File content is not a valid PDF")
	}
	return nil
}
