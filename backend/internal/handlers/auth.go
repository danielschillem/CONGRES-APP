package handlers

import (
	"net/http"

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
	Password   string  `json:"password" binding:"required,min=6"`
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

func (h *AuthHandler) Register(c *gin.Context) {
	var req RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.RespondError(c, http.StatusBadRequest, err.Error())
		return
	}

	// Check email uniqueness
	var existing models.User
	if err := h.db.Where("email = ?", req.Email).First(&existing).Error; err == nil {
		utils.RespondError(c, http.StatusConflict, "Email already registered")
		return
	}

	// Check telephone uniqueness
	if err := h.db.Where("telephone = ?", req.Telephone).First(&existing).Error; err == nil {
		utils.RespondError(c, http.StatusConflict, "Telephone already registered")
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

	accessToken, err := utils.GenerateAccessToken(user.ID, user.Role, user.Email, h.cfg.JWTSecret)
	if err != nil {
		utils.RespondError(c, http.StatusInternalServerError, "Failed to generate access token")
		return
	}

	refreshToken, err := utils.GenerateRefreshToken(user.ID, user.Role, user.Email, h.cfg.JWTRefreshSecret)
	if err != nil {
		utils.RespondError(c, http.StatusInternalServerError, "Failed to generate refresh token")
		return
	}

	utils.RespondSuccess(c, http.StatusCreated, AuthResponse{
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		User:         user,
	})
}

func (h *AuthHandler) Login(c *gin.Context) {
	var req LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.RespondError(c, http.StatusBadRequest, err.Error())
		return
	}

	var user models.User
	if err := h.db.Where("email = ?", req.Email).First(&user).Error; err != nil {
		utils.RespondError(c, http.StatusUnauthorized, "Invalid email or password")
		return
	}

	if !utils.CheckPasswordHash(req.Password, user.Password) {
		utils.RespondError(c, http.StatusUnauthorized, "Invalid email or password")
		return
	}

	accessToken, err := utils.GenerateAccessToken(user.ID, user.Role, user.Email, h.cfg.JWTSecret)
	if err != nil {
		utils.RespondError(c, http.StatusInternalServerError, "Failed to generate access token")
		return
	}

	refreshToken, err := utils.GenerateRefreshToken(user.ID, user.Role, user.Email, h.cfg.JWTRefreshSecret)
	if err != nil {
		utils.RespondError(c, http.StatusInternalServerError, "Failed to generate refresh token")
		return
	}

	utils.RespondSuccess(c, http.StatusOK, AuthResponse{
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		User:         user,
	})
}

func (h *AuthHandler) Refresh(c *gin.Context) {
	var req RefreshRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.RespondError(c, http.StatusBadRequest, err.Error())
		return
	}

	claims, err := utils.ValidateRefreshToken(req.RefreshToken, h.cfg.JWTRefreshSecret)
	if err != nil {
		utils.RespondError(c, http.StatusUnauthorized, "Invalid or expired refresh token")
		return
	}

	userID, err := uuid.Parse(claims.UserID)
	if err != nil {
		utils.RespondError(c, http.StatusUnauthorized, "Invalid user ID in token")
		return
	}

	// Verify user still exists
	var user models.User
	if err := h.db.First(&user, "id = ?", userID).Error; err != nil {
		utils.RespondError(c, http.StatusUnauthorized, "User not found")
		return
	}

	// Rotate refresh token (revoke old, issue new)
	newRefreshToken, err := utils.RotateRefreshToken(req.RefreshToken, user.ID, user.Role, user.Email, h.cfg.JWTRefreshSecret)
	if err != nil {
		utils.RespondError(c, http.StatusInternalServerError, "Failed to rotate refresh token")
		return
	}

	accessToken, err := utils.GenerateAccessToken(user.ID, user.Role, user.Email, h.cfg.JWTSecret)
	if err != nil {
		utils.RespondError(c, http.StatusInternalServerError, "Failed to generate access token")
		return
	}

	utils.RespondSuccess(c, http.StatusOK, gin.H{
		"access_token":  accessToken,
		"refresh_token": newRefreshToken,
	})
}
