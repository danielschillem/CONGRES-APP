package handlers

import (
	"crypto/rand"
	"encoding/json"
	"fmt"
	"math/big"
	"net/http"
	"strconv"
	"time"

	"congres-app/backend/internal/config"
	"congres-app/backend/internal/middleware"
	"congres-app/backend/internal/models"
	"congres-app/backend/pkg/utils"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/datatypes"
	"gorm.io/gorm"
)

type CongressHandler struct {
	db  *gorm.DB
	cfg *config.Config
}

func NewCongressHandler(db *gorm.DB, cfg *config.Config) *CongressHandler {
	return &CongressHandler{db: db, cfg: cfg}
}

type CreateCongressRequest struct {
	Title                   string         `json:"title" binding:"required"`
	Subtitle                string         `json:"subtitle"`
	Description             string         `json:"description"`
	Edition                 string         `json:"edition"`
	StartDate               string         `json:"start_date" binding:"required"`
	EndDate                 string         `json:"end_date" binding:"required"`
	Location                string         `json:"location" binding:"required"`
	City                    string         `json:"city"`
	Country                 string         `json:"country"`
	OrganisationalStructure map[string]interface{} `json:"organisational_structure"`
	Config                  map[string]interface{} `json:"config"`
	BadgeConfig             map[string]interface{} `json:"badge_config"`
}

type CreateCongressResponse struct {
	Congress      models.Congress `json:"congress"`
	AdminEmail    string          `json:"admin_email"`
	AdminPassword string          `json:"admin_password"`
}

type UpdateCongressRequest struct {
	Title                   *string                `json:"title"`
	Subtitle                *string                `json:"subtitle"`
	Description             *string                `json:"description"`
	Edition                 *string                `json:"edition"`
	StartDate               *string                `json:"start_date"`
	EndDate                 *string                `json:"end_date"`
	Location                *string                `json:"location"`
	City                    *string                `json:"city"`
	Country                 *string                `json:"country"`
	Status                  *string                `json:"status"`
	AttestationsAvailable   *bool                  `json:"attestations_available"`
	OrganisationalStructure *map[string]interface{} `json:"organisational_structure"`
	Config                  *map[string]interface{} `json:"config"`
	BadgeConfig             *map[string]interface{} `json:"badge_config"`
}

// generateRandomPassword creates a random alphanumeric password of given length.
func generateRandomPassword(length int) (string, error) {
	const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
	result := make([]byte, length)
	for i := range result {
		n, err := rand.Int(rand.Reader, big.NewInt(int64(len(charset))))
		if err != nil {
			return "", err
		}
		result[i] = charset[n.Int64()]
	}
	return string(result), nil
}

// parseDateHelper parses a date string in "2006-01-02" or RFC3339 format.
func parseDateHelper(dateStr string) (interface{}, error) {
	formats := []string{"2006-01-02", "2006-01-02T15:04:05Z07:00", time.RFC3339}
	for _, f := range formats {
		if t, err := time.Parse(f, dateStr); err == nil {
			return t, nil
		}
	}
	return nil, fmt.Errorf("cannot parse date: %s", dateStr)
}

// @Summary     Créer un congrès
// @Description Crée un nouveau congrès et génère automatiquement un compte admin dédié
// @Tags        super-admin
// @Accept      json
// @Produce     json
// @Param       request body CreateCongressRequest true "Informations du congrès"
// @Success     201 {object} utils.SuccessResponse{data=CreateCongressResponse}
// @Failure     400 {object} utils.ErrorResponse
// @Failure     401 {object} utils.ErrorResponse
// @Failure     403 {object} utils.ErrorResponse
// @Security    BearerAuth
// @Router      /super/congresses [post]
func (h *CongressHandler) CreateCongress(c *gin.Context) {
	var req CreateCongressRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.RespondError(c, http.StatusBadRequest, err.Error())
		return
	}

	superAdminIDStr, _ := c.Get(middleware.ContextUserID)
	superAdminID, err := uuid.Parse(superAdminIDStr.(string))
	if err != nil {
		utils.RespondError(c, http.StatusUnauthorized, "Invalid user ID")
		return
	}

	startDate, err := parseDateHelper(req.StartDate)
	if err != nil {
		utils.RespondError(c, http.StatusBadRequest, "Invalid start_date format (use YYYY-MM-DD or RFC3339)")
		return
	}
	endDate, err := parseDateHelper(req.EndDate)
	if err != nil {
		utils.RespondError(c, http.StatusBadRequest, "Invalid end_date format (use YYYY-MM-DD or RFC3339)")
		return
	}

	orgStruct := datatypes.JSON([]byte("null"))
	if req.OrganisationalStructure != nil {
		data, _ := json.Marshal(req.OrganisationalStructure)
		orgStruct = datatypes.JSON(data)
	}

	cfgJSON := datatypes.JSON([]byte("null"))
	if req.Config != nil {
		data, _ := json.Marshal(req.Config)
		cfgJSON = datatypes.JSON(data)
	}

	badgeCfgJSON := datatypes.JSON([]byte("null"))
	if req.BadgeConfig != nil {
		data, _ := json.Marshal(req.BadgeConfig)
		badgeCfgJSON = datatypes.JSON(data)
	}

	adminPassword, err := generateRandomPassword(12)
	if err != nil {
		utils.RespondError(c, http.StatusInternalServerError, "Failed to generate admin password")
		return
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(adminPassword), bcrypt.DefaultCost)
	if err != nil {
		utils.RespondError(c, http.StatusInternalServerError, "Failed to hash password")
		return
	}

	congressID := uuid.New()
	adminEmail := fmt.Sprintf("admin-%s@congres.app", congressID.String()[:8])

	adminUser := models.User{
		ID:         uuid.New(),
		Civilite:   "M.",
		Nom:        req.Title,
		Prenom:     "Admin",
		Sexe:       "M",
		Telephone:  fmt.Sprintf("000%s", congressID.String()[:7]),
		Email:      adminEmail,
		Password:   string(hashedPassword),
		Role:       "congress_admin",
		CongressID: &congressID,
		Active:     true,
	}

	tx := h.db.Begin()

	congress := models.Congress{
		ID:                      congressID,
		Title:                   req.Title,
		Subtitle:                req.Subtitle,
		Description:             req.Description,
		Edition:                 req.Edition,
		StartDate:               startDate.(time.Time),
		EndDate:                 endDate.(time.Time),
		Location:                req.Location,
		City:                    req.City,
		Country:                 req.Country,
		OrganisationalStructure: orgStruct,
		Config:                  cfgJSON,
		BadgeConfig:             badgeCfgJSON,
		AdminID:                 &adminUser.ID,
		Status:                  "draft",
		SuperAdminID:            superAdminID,
	}

	if err := tx.Create(&congress).Error; err != nil {
		tx.Rollback()
		utils.RespondError(c, http.StatusInternalServerError, "Failed to create congress")
		return
	}

	if err := tx.Create(&adminUser).Error; err != nil {
		tx.Rollback()
		utils.RespondError(c, http.StatusInternalServerError, "Failed to create congress admin user")
		return
	}

	tx.Commit()

	utils.RespondSuccess(c, http.StatusCreated, CreateCongressResponse{
		Congress:      congress,
		AdminEmail:    adminEmail,
		AdminPassword: adminPassword,
	})
}

// @Summary     Lister les congrès
// @Description Retourne la liste paginée de tous les congrès
// @Tags        super-admin
// @Produce     json
// @Param       page  query int false "Numéro de page (défaut: 1)"
// @Param       limit query int false "Nombre d'éléments par page (défaut: 10)"
// @Success     200 {object} utils.PaginatedResponse{data=[]models.Congress}
// @Failure     401 {object} utils.ErrorResponse
// @Failure     403 {object} utils.ErrorResponse
// @Security    BearerAuth
// @Router      /super/congresses [get]
func (h *CongressHandler) ListCongresses(c *gin.Context) {
	page, err := strconv.Atoi(c.DefaultQuery("page", "1"))
	if err != nil || page < 1 {
		page = 1
	}
	limit, err := strconv.Atoi(c.DefaultQuery("limit", "10"))
	if err != nil || limit < 1 {
		limit = 10
	}
	offset := (page - 1) * limit

	query := h.db.Model(&models.Congress{}).Order("created_at desc")

	var total int64
	if err := query.Count(&total).Error; err != nil {
		utils.RespondError(c, http.StatusInternalServerError, "Failed to count congresses")
		return
	}

	var congresses []models.Congress
	if err := query.Offset(offset).Limit(limit).Find(&congresses).Error; err != nil {
		utils.RespondError(c, http.StatusInternalServerError, "Failed to fetch congresses")
		return
	}

	utils.RespondPaginated(c, congresses, total, page, limit)
}

// @Summary     Détails d'un congrès
// @Description Retourne les détails d'un congrès par son ID
// @Tags        super-admin
// @Produce     json
// @Param       id path string true "ID du congrès"
// @Success     200 {object} utils.SuccessResponse{data=models.Congress}
// @Failure     400 {object} utils.ErrorResponse
// @Failure     401 {object} utils.ErrorResponse
// @Failure     403 {object} utils.ErrorResponse
// @Failure     404 {object} utils.ErrorResponse
// @Security    BearerAuth
// @Router      /super/congresses/{id} [get]
func (h *CongressHandler) GetCongress(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		utils.RespondError(c, http.StatusBadRequest, "Invalid congress ID")
		return
	}

	var congress models.Congress
	if err := h.db.First(&congress, "id = ?", id).Error; err != nil {
		utils.RespondError(c, http.StatusNotFound, "Congress not found")
		return
	}

	utils.RespondSuccess(c, http.StatusOK, congress)
}

// @Summary     Modifier un congrès
// @Description Met à jour les informations d'un congrès existant
// @Tags        super-admin
// @Accept      json
// @Produce     json
// @Param       id      path string             true "ID du congrès"
// @Param       request body UpdateCongressRequest true "Informations à mettre à jour"
// @Success     200 {object} utils.SuccessResponse{data=models.Congress}
// @Failure     400 {object} utils.ErrorResponse
// @Failure     401 {object} utils.ErrorResponse
// @Failure     403 {object} utils.ErrorResponse
// @Failure     404 {object} utils.ErrorResponse
// @Security    BearerAuth
// @Router      /super/congresses/{id} [patch]
func (h *CongressHandler) UpdateCongress(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		utils.RespondError(c, http.StatusBadRequest, "Invalid congress ID")
		return
	}

	var congress models.Congress
	if err := h.db.First(&congress, "id = ?", id).Error; err != nil {
		utils.RespondError(c, http.StatusNotFound, "Congress not found")
		return
	}

	var req UpdateCongressRequest
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
	if req.Edition != nil {
		updates["edition"] = *req.Edition
	}
	if req.StartDate != nil {
		t, err := parseDateHelper(*req.StartDate)
		if err != nil {
			utils.RespondError(c, http.StatusBadRequest, "Invalid start_date format")
			return
		}
		updates["start_date"] = t
	}
	if req.EndDate != nil {
		t, err := parseDateHelper(*req.EndDate)
		if err != nil {
			utils.RespondError(c, http.StatusBadRequest, "Invalid end_date format")
			return
		}
		updates["end_date"] = t
	}
	if req.Location != nil {
		updates["location"] = *req.Location
	}
	if req.City != nil {
		updates["city"] = *req.City
	}
	if req.Country != nil {
		updates["country"] = *req.Country
	}
	if req.Status != nil {
		allowed := map[string]bool{"draft": true, "active": true, "completed": true, "cancelled": true}
		if !allowed[*req.Status] {
			utils.RespondError(c, http.StatusBadRequest, "Invalid status (draft, active, completed, cancelled)")
			return
		}
		updates["status"] = *req.Status
	}
	if req.AttestationsAvailable != nil {
		updates["attestations_available"] = *req.AttestationsAvailable
	}
	if req.OrganisationalStructure != nil {
		data, _ := json.Marshal(req.OrganisationalStructure)
		updates["organisational_structure"] = datatypes.JSON(data)
	}
	if req.Config != nil {
		data, _ := json.Marshal(req.Config)
		updates["config"] = datatypes.JSON(data)
	}
	if req.BadgeConfig != nil {
		data, _ := json.Marshal(req.BadgeConfig)
		updates["badge_config"] = datatypes.JSON(data)
	}

	if len(updates) == 0 {
		utils.RespondError(c, http.StatusBadRequest, "No fields to update")
		return
	}

	if err := h.db.Model(&congress).Updates(updates).Error; err != nil {
		utils.RespondError(c, http.StatusInternalServerError, "Failed to update congress")
		return
	}

	h.db.First(&congress, "id = ?", id)
	utils.RespondSuccess(c, http.StatusOK, congress)
}

// @Summary     Activer/désactiver les attestations
// @Description Permet à l'admin du congrès de rendre les attestations disponibles aux participants
// @Tags        congress-admin
// @Produce     json
// @Success     200 {object} utils.SuccessResponse{data=object{attestations_available=bool}}
// @Failure     401 {object} utils.ErrorResponse
// @Failure     403 {object} utils.ErrorResponse
// @Failure     404 {object} utils.ErrorResponse
// @Security    BearerAuth
// @Router      /admin/congress/toggle-attestations [post]
func (h *CongressHandler) ToggleAttestations(c *gin.Context) {
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

	var congress models.Congress
	if err := h.db.First(&congress, "id = ?", congressID).Error; err != nil {
		utils.RespondError(c, http.StatusNotFound, "Congress not found")
		return
	}

	newVal := !congress.AttestationsAvailable
	if err := h.db.Model(&congress).Update("attestations_available", newVal).Error; err != nil {
		utils.RespondError(c, http.StatusInternalServerError, "Failed to toggle attestations")
		return
	}

	utils.RespondSuccess(c, http.StatusOK, gin.H{"attestations_available": newVal})
}

// @Summary     Lister les congrès actifs (public)
// @Description Retourne la liste des congrès dont le statut est "active"
// @Tags        public
// @Produce     json
// @Success     200 {object} utils.SuccessResponse{data=[]models.Congress}
// @Router      /congresses [get]
func (h *CongressHandler) ListActiveCongresses(c *gin.Context) {
	var congresses []models.Congress
	if err := h.db.Where("status = ?", "active").Order("start_date desc").Find(&congresses).Error; err != nil {
		utils.RespondError(c, http.StatusInternalServerError, "Failed to fetch congresses")
		return
	}
	utils.RespondSuccess(c, http.StatusOK, congresses)
}

// @Summary     Détails d'un congrès (public)
// @Description Retourne les détails d'un congrès actif par son ID
// @Tags        public
// @Produce     json
// @Param       id path string true "ID du congrès"
// @Success     200 {object} utils.SuccessResponse{data=models.Congress}
// @Failure     404 {object} utils.ErrorResponse
// @Router      /congresses/{id} [get]
func (h *CongressHandler) GetPublicCongress(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		utils.RespondError(c, http.StatusBadRequest, "Invalid congress ID")
		return
	}

	var congress models.Congress
	if err := h.db.Where("id = ? AND status = ?", id, "active").First(&congress).Error; err != nil {
		utils.RespondError(c, http.StatusNotFound, "Congress not found")
		return
	}

	utils.RespondSuccess(c, http.StatusOK, congress)
}

// @Summary     Supprimer un congrès
// @Description Supprime un congrès et son admin associé
// @Tags        super-admin
// @Produce     json
// @Param       id path string true "ID du congrès"
// @Success     200 {object} utils.SuccessResponse{data=object{message=string}}
// @Failure     400 {object} utils.ErrorResponse
// @Failure     401 {object} utils.ErrorResponse
// @Failure     403 {object} utils.ErrorResponse
// @Failure     404 {object} utils.ErrorResponse
// @Security    BearerAuth
// @Router      /super/congresses/{id} [delete]
func (h *CongressHandler) DeleteCongress(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		utils.RespondError(c, http.StatusBadRequest, "Invalid congress ID")
		return
	}

	var congress models.Congress
	if err := h.db.First(&congress, "id = ?", id).Error; err != nil {
		utils.RespondError(c, http.StatusNotFound, "Congress not found")
		return
	}

	tx := h.db.Begin()

	// Delete associated actors and admin
	if congress.AdminID != nil {
		tx.Where("congress_id = ?", id).Delete(&models.User{})
	}

	if err := tx.Delete(&congress).Error; err != nil {
		tx.Rollback()
		utils.RespondError(c, http.StatusInternalServerError, "Failed to delete congress")
		return
	}

	tx.Commit()

	utils.RespondSuccess(c, http.StatusOK, gin.H{"message": "Congress deleted successfully"})
}

// @Summary     Obtenir le congrès courant (admin congrès)
// @Description Retourne les détails du congrès associé à l'admin connecté
// @Tags        congress-admin
// @Produce     json
// @Success     200 {object} utils.SuccessResponse{data=models.Congress}
// @Failure     401 {object} utils.ErrorResponse
// @Failure     403 {object} utils.ErrorResponse
// @Failure     404 {object} utils.ErrorResponse
// @Security    BearerAuth
// @Router      /admin/congress/current [get]
func (h *CongressHandler) GetCurrentCongress(c *gin.Context) {
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

	var congress models.Congress
	if err := h.db.First(&congress, "id = ?", congressID).Error; err != nil {
		utils.RespondError(c, http.StatusNotFound, "Congress not found")
		return
	}

	utils.RespondSuccess(c, http.StatusOK, congress)
}

// @Summary     Mettre à jour le congrès courant (admin congrès)
// @Description Permet à l'admin du congrès de modifier la configuration
// @Tags        congress-admin
// @Accept      json
// @Produce     json
// @Param       request body UpdateCongressRequest true "Informations à mettre à jour"
// @Success     200 {object} utils.SuccessResponse{data=models.Congress}
// @Failure     400 {object} utils.ErrorResponse
// @Failure     401 {object} utils.ErrorResponse
// @Failure     403 {object} utils.ErrorResponse
// @Failure     404 {object} utils.ErrorResponse
// @Security    BearerAuth
// @Router      /admin/congress/current [patch]
func (h *CongressHandler) UpdateCurrentCongress(c *gin.Context) {
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

	var congress models.Congress
	if err := h.db.First(&congress, "id = ?", congressID).Error; err != nil {
		utils.RespondError(c, http.StatusNotFound, "Congress not found")
		return
	}

	var req UpdateCongressRequest
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
	if req.StartDate != nil {
		t, err := parseDateHelper(*req.StartDate)
		if err != nil {
			utils.RespondError(c, http.StatusBadRequest, "Invalid start_date format")
			return
		}
		updates["start_date"] = t
	}
	if req.EndDate != nil {
		t, err := parseDateHelper(*req.EndDate)
		if err != nil {
			utils.RespondError(c, http.StatusBadRequest, "Invalid end_date format")
			return
		}
		updates["end_date"] = t
	}
	if req.Location != nil {
		updates["location"] = *req.Location
	}
	if req.City != nil {
		updates["city"] = *req.City
	}
	if req.Country != nil {
		updates["country"] = *req.Country
	}
	if req.AttestationsAvailable != nil {
		updates["attestations_available"] = *req.AttestationsAvailable
	}
	if req.OrganisationalStructure != nil {
		data, _ := json.Marshal(req.OrganisationalStructure)
		updates["organisational_structure"] = datatypes.JSON(data)
	}
	if req.Config != nil {
		data, _ := json.Marshal(req.Config)
		updates["config"] = datatypes.JSON(data)
	}
	if req.BadgeConfig != nil {
		data, _ := json.Marshal(req.BadgeConfig)
		updates["badge_config"] = datatypes.JSON(data)
	}

	if len(updates) == 0 {
		utils.RespondError(c, http.StatusBadRequest, "No fields to update")
		return
	}

	if err := h.db.Model(&congress).Updates(updates).Error; err != nil {
		utils.RespondError(c, http.StatusInternalServerError, "Failed to update congress")
		return
	}

	h.db.First(&congress, "id = ?", congressID)
	utils.RespondSuccess(c, http.StatusOK, congress)
}
