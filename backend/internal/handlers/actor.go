package handlers

import (
	"encoding/csv"
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
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

type ActorHandler struct {
	db  *gorm.DB
	cfg *config.Config
}

func NewActorHandler(db *gorm.DB, cfg *config.Config) *ActorHandler {
	return &ActorHandler{db: db, cfg: cfg}
}

type CreateActorRequest struct {
	Civilite  string `json:"civilite" binding:"required"`
	Nom       string `json:"nom" binding:"required"`
	Prenom    string `json:"prenom" binding:"required"`
	Sexe      string `json:"sexe" binding:"required"`
	Telephone string `json:"telephone" binding:"required"`
	Email     string `json:"email" binding:"required,email"`
	Password  string `json:"password" binding:"required,min=8"`
	Role      string `json:"role" binding:"required"` // reviewer, finance_manager, support
}

type CreateActorResponse struct {
	User   models.User `json:"user"`
	Email  string      `json:"email"`
}

// getCongressIDFromContext extracts the congress_id from the JWT claims.
// It works for congress_admin (who has congress_id) or super_admin (who may pass congress_id in query).
func getCongressIDFromContext(c *gin.Context) (uuid.UUID, string, error) {
	role, _ := c.Get(middleware.ContextRole)
	congressIDStr, hasCongressID := c.Get(middleware.ContextCongressID)

	if role == "super_admin" {
		// Super admin can specify congress_id in query param
		qCID := c.Query("congress_id")
		if qCID != "" {
			cid, err := uuid.Parse(qCID)
			if err != nil {
				return uuid.Nil, "", fmt.Errorf("invalid congress_id in query")
			}
			return cid, "super_admin", nil
		}
		return uuid.Nil, "super_admin", nil
	}

	if !hasCongressID || congressIDStr == "" {
		return uuid.Nil, "", fmt.Errorf("no congress associated with this account")
	}

	congressID, err := uuid.Parse(congressIDStr.(string))
	if err != nil {
		return uuid.Nil, "", fmt.Errorf("invalid congress ID in token")
	}

	return congressID, "congress_admin", nil
}

// @Summary     Créer un acteur (reviewer, finance_manager, support)
// @Description Permet à l'admin du congrès de créer des acteurs pour son congrès
// @Tags        congress-admin
// @Accept      json
// @Produce     json
// @Param       request body CreateActorRequest true "Informations de l'acteur"
// @Success     201 {object} utils.SuccessResponse{data=CreateActorResponse}
// @Failure     400 {object} utils.ErrorResponse
// @Failure     401 {object} utils.ErrorResponse
// @Failure     403 {object} utils.ErrorResponse
// @Security    BearerAuth
// @Router      /admin/congress/actors [post]
func (h *ActorHandler) CreateActor(c *gin.Context) {
	var req CreateActorRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.RespondError(c, http.StatusBadRequest, err.Error())
		return
	}

	allowedRoles := map[string]bool{"reviewer": true, "finance_manager": true, "support": true}
	if !allowedRoles[req.Role] {
		utils.RespondError(c, http.StatusBadRequest, "Role must be one of: reviewer, finance_manager, support")
		return
	}

	congressID, _, err := getCongressIDFromContext(c)
	if err != nil {
		utils.RespondError(c, http.StatusForbidden, err.Error())
		return
	}

	if congressID == uuid.Nil {
		utils.RespondError(c, http.StatusBadRequest, "congress_id is required")
		return
	}

	// Check if email already exists
	var existing models.User
	if err := h.db.Where("email = ?", req.Email).First(&existing).Error; err == nil {
		utils.RespondError(c, http.StatusConflict, "Email already registered")
		return
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		utils.RespondError(c, http.StatusInternalServerError, "Failed to hash password")
		return
	}

	actor := models.User{
		ID:         uuid.New(),
		Civilite:   req.Civilite,
		Nom:        req.Nom,
		Prenom:     req.Prenom,
		Sexe:       req.Sexe,
		Telephone:  req.Telephone,
		Email:      req.Email,
		Password:   string(hashedPassword),
		Role:       req.Role,
		CongressID: &congressID,
		Active:     true,
	}

	if err := h.db.Create(&actor).Error; err != nil {
		utils.RespondError(c, http.StatusInternalServerError, "Failed to create actor")
		return
	}

	utils.RespondSuccess(c, http.StatusCreated, CreateActorResponse{
		User:  actor,
		Email: actor.Email,
	})
}

// @Summary     Lister les acteurs d'un congrès
// @Description Retourne la liste des acteurs (reviewers, finance_manager, support) pour le congrès courant
// @Tags        congress-admin
// @Produce     json
// @Param       role query string false "Filtrer par rôle (reviewer, finance_manager, support)"
// @Success     200 {object} utils.SuccessResponse{data=[]models.User}
// @Failure     401 {object} utils.ErrorResponse
// @Failure     403 {object} utils.ErrorResponse
// @Security    BearerAuth
// @Router      /admin/congress/actors [get]
func (h *ActorHandler) ListActors(c *gin.Context) {
	congressID, _, err := getCongressIDFromContext(c)
	if err != nil {
		utils.RespondError(c, http.StatusForbidden, err.Error())
		return
	}

	if congressID == uuid.Nil {
		utils.RespondError(c, http.StatusBadRequest, "congress_id is required")
		return
	}

	roleFilter := c.Query("role")

	query := h.db.Model(&models.User{}).
		Where("congress_id = ? AND role IN ('reviewer', 'finance_manager', 'support')", congressID)

	if roleFilter != "" {
		allowedRoles := map[string]bool{"reviewer": true, "finance_manager": true, "support": true}
		if !allowedRoles[roleFilter] {
			utils.RespondError(c, http.StatusBadRequest, "Invalid role filter")
			return
		}
		query = query.Where("role = ?", roleFilter)
	}

	var actors []models.User
	if err := query.Order("created_at desc").Find(&actors).Error; err != nil {
		utils.RespondError(c, http.StatusInternalServerError, "Failed to fetch actors")
		return
	}

	utils.RespondSuccess(c, http.StatusOK, actors)
}

// @Summary     Supprimer un acteur
// @Description Supprime un acteur (reviewer, finance_manager, support) du congrès
// @Tags        congress-admin
// @Produce     json
// @Param       id path string true "ID de l'acteur"
// @Success     200 {object} utils.SuccessResponse{data=object{message=string}}
// @Failure     400 {object} utils.ErrorResponse
// @Failure     401 {object} utils.ErrorResponse
// @Failure     403 {object} utils.ErrorResponse
// @Failure     404 {object} utils.ErrorResponse
// @Security    BearerAuth
// @Router      /admin/congress/actors/{id} [delete]
func (h *ActorHandler) DeleteActor(c *gin.Context) {
	actorID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		utils.RespondError(c, http.StatusBadRequest, "Invalid actor ID")
		return
	}

	congressID, _, err := getCongressIDFromContext(c)
	if err != nil {
		utils.RespondError(c, http.StatusForbidden, err.Error())
		return
	}

	var actor models.User
	if err := h.db.Where("id = ? AND congress_id = ?", actorID, congressID).First(&actor).Error; err != nil {
		utils.RespondError(c, http.StatusNotFound, "Actor not found")
		return
	}

	allowedRoles := map[string]bool{"reviewer": true, "finance_manager": true, "support": true}
	if !allowedRoles[actor.Role] {
		utils.RespondError(c, http.StatusForbidden, "Cannot delete this user")
		return
	}

	if err := h.db.Delete(&actor).Error; err != nil {
		utils.RespondError(c, http.StatusInternalServerError, "Failed to delete actor")
		return
	}

	utils.RespondSuccess(c, http.StatusOK, gin.H{"message": "Actor deleted successfully"})
}

// @Summary     Générer les badges
// @Description Génère un fichier CSV des badges pour les participants au congrès
// @Tags        congress-admin
// @Produce     text/csv
// @Success     200 {file} binary
// @Failure     401 {object} utils.ErrorResponse
// @Failure     403 {object} utils.ErrorResponse
// @Security    BearerAuth
// @Router      /admin/congress/badges [post]
func (h *ActorHandler) GenerateBadges(c *gin.Context) {
	congressID, _, err := getCongressIDFromContext(c)
	if err != nil {
		utils.RespondError(c, http.StatusForbidden, err.Error())
		return
	}

	if congressID == uuid.Nil {
		utils.RespondError(c, http.StatusBadRequest, "congress_id is required")
		return
	}

	var congress models.Congress
	if err := h.db.First(&congress, "id = ?", congressID).Error; err != nil {
		utils.RespondError(c, http.StatusNotFound, "Congress not found")
		return
	}

	// Get all confirmed inscriptions for this congress
	// (Inscriptions are linked to users, users may be linked to congress,
	//  but for now we get all users who registered for this congress context)
	var inscriptions []models.Inscription
	if err := h.db.Where("payment_status = ?", "confirmed").
		Order("nom asc, prenom asc").
		Find(&inscriptions).Error; err != nil {
		utils.RespondError(c, http.StatusInternalServerError, "Failed to fetch inscriptions")
		return
	}

	c.Header("Content-Type", "text/csv; charset=utf-8")
	c.Header("Content-Disposition", fmt.Sprintf("attachment; filename=\"badges_%s_%s.csv\"",
		congress.Title, time.Now().Format("2006-01-02")))

	c.Writer.Write([]byte{0xEF, 0xBB, 0xBF})

	writer := csv.NewWriter(c.Writer)
	defer writer.Flush()

	writer.Write([]string{
		"Nom", "Prénom", "Email", "Organisme", "Pays",
		"Type Participation", "N° Facture",
	})

	for _, ins := range inscriptions {
		writer.Write([]string{
			ins.Nom,
			ins.Prenom,
			ins.Email,
			ins.Organisme,
			ins.Pays,
			ins.ParticipationType,
			ins.NumeroFacture,
		})
	}
}

// ListActorsForSuperAdmin lists all actors across all congresses.
func (h *ActorHandler) ListActorsForSuperAdmin(c *gin.Context) {
	page, err := strconv.Atoi(c.DefaultQuery("page", "1"))
	if err != nil || page < 1 {
		page = 1
	}
	limit, err := strconv.Atoi(c.DefaultQuery("limit", "10"))
	if err != nil || limit < 1 {
		limit = 10
	}
	offset := (page - 1) * limit

	congressID := c.Query("congress_id")
	role := c.Query("role")

	query := h.db.Model(&models.User{}).
		Where("role IN ('congress_admin', 'reviewer', 'finance_manager', 'support')")

	if congressID != "" {
		cid, err := uuid.Parse(congressID)
		if err == nil {
			query = query.Where("congress_id = ?", cid)
		}
	}
	if role != "" {
		query = query.Where("role = ?", role)
	}

	var total int64
	if err := query.Count(&total).Error; err != nil {
		utils.RespondError(c, http.StatusInternalServerError, "Failed to count actors")
		return
	}

	var actors []models.User
	if err := query.Order("created_at desc").Offset(offset).Limit(limit).Find(&actors).Error; err != nil {
		utils.RespondError(c, http.StatusInternalServerError, "Failed to fetch actors")
		return
	}

	utils.RespondPaginated(c, actors, total, page, limit)
}
