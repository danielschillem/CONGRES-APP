package handlers

import (
	"log"
	"net/http"
	"strings"
	"time"

	"congres-app/backend/internal/config"
	"congres-app/backend/internal/models"
	"congres-app/backend/pkg/utils"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type AuthHandler struct {
	db  *gorm.DB
	cfg *config.Config
}

func NewAuthHandler(db *gorm.DB, cfg *config.Config) *AuthHandler {
	return &AuthHandler{db: db, cfg: cfg}
}

type RegisterRequest struct {
	Civilite   string  `json:"civilite" binding:"required"`
	Nom        string  `json:"nom" binding:"required"`
	Prenom     string  `json:"prenom" binding:"required"`
	Sexe       string  `json:"sexe" binding:"required"`
	Telephone  string  `json:"telephone" binding:"required"`
	Adresse    *string `json:"adresse"`
	Profession *string `json:"profession"`
	Organisme  *string `json:"organisme"`
	Biographie *string `json:"biographie"`
	Email      string  `json:"email" binding:"required,email"`
	Password   string  `json:"password" binding:"required,min=8"`
}

type LoginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

type RefreshRequest struct {
	RefreshToken string `json:"refresh_token" binding:"required"`
}

type AuthResponse struct {
	AccessToken  string      `json:"access_token"`
	RefreshToken string      `json:"refresh_token"`
	User         models.User `json:"user"`
}

func (h *AuthHandler) persistRefreshToken(tokenString string, userID uuid.UUID) error {
	rt := models.RefreshToken{
		ID:        uuid.New(),
		UserID:    userID,
		Token:     tokenString,
		ExpiresAt: time.Now().Add(7 * 24 * time.Hour),
	}
	return h.db.Create(&rt).Error
}

// @Summary     Inscription d'un nouvel utilisateur
// @Description Crée un nouveau compte utilisateur avec les informations fournies et retourne les tokens d'accès
// @Tags        auth
// @Accept      json
// @Produce     json
// @Param       request body RegisterRequest true "Informations d'inscription"
// @Success     201 {object} utils.SuccessResponse{data=AuthResponse}
// @Failure     400 {object} utils.ErrorResponse
// @Failure     409 {object} utils.ErrorResponse
// @Router      /auth/register [post]
func (h *AuthHandler) Register(c *gin.Context) {
	var req RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.RespondError(c, http.StatusBadRequest, err.Error())
		return
	}
	req.Email = strings.ToLower(strings.TrimSpace(req.Email))

	var existing models.User
	if err := h.db.Where("email = ? OR telephone = ?", req.Email, req.Telephone).First(&existing).Error; err == nil {
		utils.RespondError(c, http.StatusConflict, "Email or telephone already registered")
		return
	}

	hashedPassword, err := utils.HashPassword(req.Password)
	if err != nil {
		utils.RespondError(c, http.StatusInternalServerError, "Failed to hash password")
		return
	}

	user := models.User{
		ID:         uuid.New(),
		Civilite:   req.Civilite,
		Nom:        req.Nom,
		Prenom:     req.Prenom,
		Sexe:       req.Sexe,
		Telephone:  req.Telephone,
		Adresse:    req.Adresse,
		Profession: req.Profession,
		Organisme:  req.Organisme,
		Biographie: req.Biographie,
		Email:      req.Email,
		Password:   hashedPassword,
		Role:       "user",
	}

	if err := h.db.Create(&user).Error; err != nil {
		utils.RespondError(c, http.StatusInternalServerError, "Failed to create user")
		return
	}

	congressID := ""
	if user.CongressID != nil {
		congressID = user.CongressID.String()
	}

	accessToken, err := utils.GenerateAccessToken(user.ID, user.Role, user.Email, congressID, h.cfg.JWTSecret)
	if err != nil {
		utils.RespondError(c, http.StatusInternalServerError, "Failed to generate access token")
		return
	}

	refreshToken, err := utils.GenerateRefreshToken(user.ID, user.Role, user.Email, congressID, h.cfg.JWTRefreshSecret)
	if err != nil {
		utils.RespondError(c, http.StatusInternalServerError, "Failed to generate refresh token")
		return
	}

	if err := h.persistRefreshToken(refreshToken, user.ID); err != nil {
		utils.RespondError(c, http.StatusInternalServerError, "Failed to persist refresh token")
		return
	}

	utils.RespondSuccess(c, http.StatusCreated, AuthResponse{
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		User:         user,
	})
}

// @Summary     Connexion utilisateur
// @Description Authentifie un utilisateur avec email et mot de passe et retourne les tokens d'accès
// @Tags        auth
// @Accept      json
// @Produce     json
// @Param       request body LoginRequest true "Identifiants de connexion"
// @Success     200 {object} utils.SuccessResponse{data=AuthResponse}
// @Failure     400 {object} utils.ErrorResponse
// @Failure     401 {object} utils.ErrorResponse
// @Router      /auth/login [post]
func (h *AuthHandler) Login(c *gin.Context) {
	var req LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.RespondError(c, http.StatusBadRequest, err.Error())
		return
	}
	req.Email = strings.ToLower(strings.TrimSpace(req.Email))

	var user models.User
	if err := h.db.Where("email = ? AND active = ?", req.Email, true).First(&user).Error; err != nil {
		utils.RespondError(c, http.StatusUnauthorized, "Invalid email or password")
		return
	}

	if !utils.CheckPasswordHash(req.Password, user.Password) {
		utils.RespondError(c, http.StatusUnauthorized, "Invalid email or password")
		return
	}

	congressID := ""
	if user.CongressID != nil {
		congressID = user.CongressID.String()
	}

	accessToken, err := utils.GenerateAccessToken(user.ID, user.Role, user.Email, congressID, h.cfg.JWTSecret)
	if err != nil {
		utils.RespondError(c, http.StatusInternalServerError, "Failed to generate access token")
		return
	}

	refreshToken, err := utils.GenerateRefreshToken(user.ID, user.Role, user.Email, congressID, h.cfg.JWTRefreshSecret)
	if err != nil {
		utils.RespondError(c, http.StatusInternalServerError, "Failed to generate refresh token")
		return
	}

	if err := h.persistRefreshToken(refreshToken, user.ID); err != nil {
		utils.RespondError(c, http.StatusInternalServerError, "Failed to persist refresh token")
		return
	}

	utils.RespondSuccess(c, http.StatusOK, AuthResponse{
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		User:         user,
	})
}

// @Summary     Rafraîchir le token d'accès
// @Description Génère un nouveau token d'accès à partir d'un refresh token valide
// @Tags        auth
// @Accept      json
// @Produce     json
// @Param       request body RefreshRequest true "Refresh token"
// @Success     200 {object} utils.SuccessResponse{data=object{access_token=string,refresh_token=string}}
// @Failure     400 {object} utils.ErrorResponse
// @Failure     401 {object} utils.ErrorResponse
// @Router      /auth/refresh [post]
func (h *AuthHandler) Refresh(c *gin.Context) {
	var req RefreshRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.RespondError(c, http.StatusBadRequest, err.Error())
		return
	}

	claims, err := utils.ValidateToken(req.RefreshToken, h.cfg.JWTRefreshSecret)
	if err != nil {
		utils.RespondError(c, http.StatusUnauthorized, "Invalid or expired refresh token")
		return
	}

	if claims.Type != "refresh" {
		utils.RespondError(c, http.StatusUnauthorized, "Token is not a refresh token")
		return
	}

	var stored models.RefreshToken
	if err := h.db.Where("token = ? AND revoked_at IS NULL", req.RefreshToken).First(&stored).Error; err != nil {
		utils.RespondError(c, http.StatusUnauthorized, "Refresh token not found or already revoked")
		return
	}

	userID, err := uuid.Parse(claims.UserID)
	if err != nil {
		utils.RespondError(c, http.StatusUnauthorized, "Invalid user ID in token")
		return
	}

	var user models.User
	if err := h.db.First(&user, "id = ?", userID).Error; err != nil {
		utils.RespondError(c, http.StatusUnauthorized, "User not found")
		return
	}

	now := time.Now()
	congressID := ""
	if user.CongressID != nil {
		congressID = user.CongressID.String()
	}

	newRefreshToken, err := utils.GenerateRefreshToken(user.ID, user.Role, user.Email, congressID, h.cfg.JWTRefreshSecret)
	if err != nil {
		utils.RespondError(c, http.StatusInternalServerError, "Failed to generate refresh token")
		return
	}

	tx := h.db.Begin()
	if err := tx.Model(&stored).Update("revoked_at", &now).Error; err != nil {
		tx.Rollback()
		utils.RespondError(c, http.StatusInternalServerError, "Failed to revoke old refresh token")
		return
	}
	if err := tx.Create(&models.RefreshToken{
		ID:        uuid.New(),
		UserID:    user.ID,
		Token:     newRefreshToken,
		ExpiresAt: time.Now().Add(7 * 24 * time.Hour),
	}).Error; err != nil {
		tx.Rollback()
		utils.RespondError(c, http.StatusInternalServerError, "Failed to persist new refresh token")
		return
	}
	tx.Commit()

	accessToken, err := utils.GenerateAccessToken(user.ID, user.Role, user.Email, congressID, h.cfg.JWTSecret)
	if err != nil {
		utils.RespondError(c, http.StatusInternalServerError, "Failed to generate access token")
		return
	}

	utils.RespondSuccess(c, http.StatusOK, gin.H{
		"access_token":  accessToken,
		"refresh_token": newRefreshToken,
	})
}

// @Summary     Déconnexion
// @Description Révoque le refresh token côté serveur
// @Tags        auth
// @Accept      json
// @Produce     json
// @Success     200 {object} utils.SuccessResponse{data=object{message=string}}
// @Router      /auth/logout [post]
func (h *AuthHandler) Logout(c *gin.Context) {
	var req struct {
		RefreshToken string `json:"refresh_token" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.RespondError(c, http.StatusBadRequest, "refresh_token is required")
		return
	}

	now := time.Now()
	if err := h.db.Model(&models.RefreshToken{}).
		Where("token = ? AND revoked_at IS NULL", req.RefreshToken).
		Update("revoked_at", &now).Error; err != nil {
		// Log but don't fail - best-effort revocation
		log.Printf("[Auth] Failed to revoke refresh token on logout: %v", err)
	}

	utils.RespondSuccess(c, http.StatusOK, gin.H{"message": "Logged out successfully"})
}
