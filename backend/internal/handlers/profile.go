package handlers

import (
	"net/http"

	"congres-app/backend/internal/middleware"
	"congres-app/backend/internal/models"
	"congres-app/backend/pkg/utils"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type ChangePasswordRequest struct {
	CurrentPassword string `json:"current_password" binding:"required"`
	NewPassword     string `json:"new_password" binding:"required,min=6"`
}

type ProfileHandler struct {
	db *gorm.DB
}

func NewProfileHandler(db *gorm.DB) *ProfileHandler {
	return &ProfileHandler{db: db}
}

type UpdateProfileRequest struct {
	Civilite   string  `json:"civilite"`
	Nom        string  `json:"nom"`
	Prenom     string  `json:"prenom"`
	Sexe       string  `json:"sexe"`
	Telephone  string  `json:"telephone"`
	Adresse    *string `json:"adresse"`
	Profession *string `json:"profession"`
	Organisme  *string `json:"organisme"`
	Biographie *string `json:"biographie"`
	Email      string  `json:"email"`
}

func (h *ProfileHandler) GetProfile(c *gin.Context) {
	userIDStr, _ := c.Get(middleware.ContextUserID)
	userID, err := uuid.Parse(userIDStr.(string))
	if err != nil {
		utils.RespondError(c, http.StatusUnauthorized, "Invalid user ID")
		return
	}

	var user models.User
	if err := h.db.First(&user, "id = ?", userID).Error; err != nil {
		utils.RespondError(c, http.StatusNotFound, "User not found")
		return
	}

	utils.RespondSuccess(c, http.StatusOK, user)
}

func (h *ProfileHandler) UpdateProfile(c *gin.Context) {
	userIDStr, _ := c.Get(middleware.ContextUserID)
	userID, err := uuid.Parse(userIDStr.(string))
	if err != nil {
		utils.RespondError(c, http.StatusUnauthorized, "Invalid user ID")
		return
	}

	var user models.User
	if err := h.db.First(&user, "id = ?", userID).Error; err != nil {
		utils.RespondError(c, http.StatusNotFound, "User not found")
		return
	}

	var req UpdateProfileRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.RespondError(c, http.StatusBadRequest, err.Error())
		return
	}

	// Check email uniqueness if changing
	if req.Email != "" && req.Email != user.Email {
		var existing models.User
		if err := h.db.Where("email = ? AND id != ?", req.Email, userID).First(&existing).Error; err == nil {
			utils.RespondError(c, http.StatusConflict, "Email already in use")
			return
		}
		user.Email = req.Email
	}

	// Check telephone uniqueness if changing
	if req.Telephone != "" && req.Telephone != user.Telephone {
		var existing models.User
		if err := h.db.Where("telephone = ? AND id != ?", req.Telephone, userID).First(&existing).Error; err == nil {
			utils.RespondError(c, http.StatusConflict, "Telephone already in use")
			return
		}
		user.Telephone = req.Telephone
	}

	if req.Civilite != "" {
		user.Civilite = req.Civilite
	}
	if req.Nom != "" {
		user.Nom = req.Nom
	}
	if req.Prenom != "" {
		user.Prenom = req.Prenom
	}
	if req.Sexe != "" {
		user.Sexe = req.Sexe
	}

	// Pointer fields can be set to nil or updated
	if req.Adresse != nil {
		user.Adresse = req.Adresse
	}
	if req.Profession != nil {
		user.Profession = req.Profession
	}
	if req.Organisme != nil {
		user.Organisme = req.Organisme
	}
	if req.Biographie != nil {
		user.Biographie = req.Biographie
	}

	if err := h.db.Save(&user).Error; err != nil {
		utils.RespondError(c, http.StatusInternalServerError, "Failed to update profile")
		return
	}

	utils.RespondSuccess(c, http.StatusOK, user)
}

func (h *ProfileHandler) ChangePassword(c *gin.Context) {
	userIDStr, _ := c.Get(middleware.ContextUserID)
	userID, err := uuid.Parse(userIDStr.(string))
	if err != nil {
		utils.RespondError(c, http.StatusUnauthorized, "Invalid user ID")
		return
	}

	var req ChangePasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.RespondError(c, http.StatusBadRequest, err.Error())
		return
	}

	var user models.User
	if err := h.db.First(&user, "id = ?", userID).Error; err != nil {
		utils.RespondError(c, http.StatusNotFound, "User not found")
		return
	}

	if !utils.CheckPasswordHash(req.CurrentPassword, user.Password) {
		utils.RespondError(c, http.StatusUnauthorized, "Current password is incorrect")
		return
	}

	hashed, err := utils.HashPassword(req.NewPassword)
	if err != nil {
		utils.RespondError(c, http.StatusInternalServerError, "Failed to hash password")
		return
	}

	user.Password = hashed
	if err := h.db.Save(&user).Error; err != nil {
		utils.RespondError(c, http.StatusInternalServerError, "Failed to update password")
		return
	}

	utils.RespondSuccess(c, http.StatusOK, gin.H{"message": "Password updated successfully"})
}

func (h *ProfileHandler) DeleteProfile(c *gin.Context) {
	userIDStr, _ := c.Get(middleware.ContextUserID)
	userID, err := uuid.Parse(userIDStr.(string))
	if err != nil {
		utils.RespondError(c, http.StatusUnauthorized, "Invalid user ID")
		return
	}

	var user models.User
	if err := h.db.First(&user, "id = ?", userID).Error; err != nil {
		utils.RespondError(c, http.StatusNotFound, "User not found")
		return
	}

	// Delete associated notifications
	h.db.Where("notifiable_id = ?", userID).Delete(&models.Notification{})

	// Delete associated soumissions
	h.db.Where("user_id = ?", userID).Delete(&models.Soumission{})

	// Delete user
	if err := h.db.Delete(&user).Error; err != nil {
		utils.RespondError(c, http.StatusInternalServerError, "Failed to delete account")
		return
	}

	utils.RespondSuccess(c, http.StatusOK, gin.H{"message": "Account deleted successfully"})
}
