package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	"congres-app/backend/internal/config"
	"congres-app/backend/internal/middleware"
	"congres-app/backend/internal/models"
	"congres-app/backend/pkg/utils"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/lib/pq"
	"gorm.io/datatypes"
	"gorm.io/gorm"
)

type SoumissionHandler struct {
	db  *gorm.DB
	cfg *config.Config
}

func NewSoumissionHandler(db *gorm.DB, cfg *config.Config) *SoumissionHandler {
	return &SoumissionHandler{db: db, cfg: cfg}
}

// createAdminNotification creates a notification for all admin users about a soumission event.
func createAdminNotification(db *gorm.DB, notifType string, soumission *models.Soumission, message string) {
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

	// Validate file extension
	if !strings.HasSuffix(strings.ToLower(file.Filename), ".pdf") {
		utils.RespondError(c, http.StatusBadRequest, "Only PDF files are accepted")
		return
	}

	// Ensure upload directory exists
	uploadPath := h.cfg.UploadPath
	if err := os.MkdirAll(uploadPath, 0755); err != nil {
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

	utils.RespondSuccess(c, http.StatusCreated, soumission)
}

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
		if !strings.HasSuffix(strings.ToLower(file.Filename), ".pdf") {
			utils.RespondError(c, http.StatusBadRequest, "Only PDF files are accepted")
			return
		}

		uploadPath := h.cfg.UploadPath
		if err := os.MkdirAll(uploadPath, 0755); err != nil {
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

	utils.RespondSuccess(c, http.StatusOK, soumission)
}

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
	var sb strings.Builder
	for _, r := range name {
		if (r >= 'a' && r <= 'z') || (r >= 'A' && r <= 'Z') || (r >= '0' && r <= '9') || r == '-' || r == '_' {
			sb.WriteRune(r)
		} else {
			sb.WriteRune('_')
		}
	}
	result := sb.String()
	if len(result) > 50 {
		result = result[:50]
	}
	return result
}
