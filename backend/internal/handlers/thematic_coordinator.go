package handlers

import (
	"encoding/json"
	"net/http"

	"congres-app/backend/internal/models"
	"congres-app/backend/pkg/utils"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type ThematicCoordinatorHandler struct {
	db *gorm.DB
}

func NewThematicCoordinatorHandler(db *gorm.DB) *ThematicCoordinatorHandler {
	return &ThematicCoordinatorHandler{db: db}
}

// SetCoordinator assigns a user as thematic coordinator for a theme
func (h *ThematicCoordinatorHandler) SetCoordinator(c *gin.Context) {
	congressID, _, err := getCongressIDFromContext(c)
	if err != nil {
		utils.RespondError(c, http.StatusForbidden, err.Error())
		return
	}

	var req struct {
		UserID string `json:"user_id" binding:"required"`
		Theme  string `json:"theme" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.RespondError(c, http.StatusBadRequest, err.Error())
		return
	}

	userID, err := uuid.Parse(req.UserID)
	if err != nil {
		utils.RespondError(c, http.StatusBadRequest, "Invalid user ID")
		return
	}

	// Verify user exists and is a reviewer or admin of this congress
	var user models.User
	if err := h.db.Where("id = ? AND congress_id = ?", userID, congressID).First(&user).Error; err != nil {
		utils.RespondError(c, http.StatusNotFound, "User not found in this congress")
		return
	}

	// Store coordinators in congress config JSON
	var congress models.Congress
	if err := h.db.First(&congress, "id = ?", congressID).Error; err != nil {
		utils.RespondError(c, http.StatusNotFound, "Congress not found")
		return
	}

	config := map[string]interface{}{}
	if congress.Config != nil {
		jsonBytes, _ := congress.Config.MarshalJSON()
		if err := json.Unmarshal(jsonBytes, &config); err != nil {
			config = map[string]interface{}{}
		}
	}

	// Get existing coordinators
	coordinators := []map[string]interface{}{}
	if existing, ok := config["thematic_coordinators"]; ok {
		if coordList, ok := existing.([]interface{}); ok {
			for _, c := range coordList {
				if cm, ok := c.(map[string]interface{}); ok {
					coordinators = append(coordinators, cm)
				}
			}
		}
	}

	// Remove existing coordinator for this theme
	updated := []map[string]interface{}{}
	for _, coord := range coordinators {
		if coord["theme"] != req.Theme {
			updated = append(updated, coord)
		}
	}

	// Add new coordinator
	updated = append(updated, map[string]interface{}{
		"user_id":    req.UserID,
		"theme":      req.Theme,
		"user_name":  user.Prenom + " " + user.Nom,
		"user_email": user.Email,
	})

	config["thematic_coordinators"] = updated

	// Save back
	jsonBytes, _ := json.Marshal(config)
	congress.Config = jsonBytes
	h.db.Model(&congress).Update("config", congress.Config)

	utils.RespondSuccess(c, http.StatusOK, gin.H{
		"message":       "Coordinator set successfully",
		"theme":         req.Theme,
		"coordinator":   user.Prenom + " " + user.Nom,
		"coordinators":  updated,
	})
}

// RemoveCoordinator removes a thematic coordinator for a theme
func (h *ThematicCoordinatorHandler) RemoveCoordinator(c *gin.Context) {
	congressID, _, err := getCongressIDFromContext(c)
	if err != nil {
		utils.RespondError(c, http.StatusForbidden, err.Error())
		return
	}

	theme := c.Query("theme")
	if theme == "" {
		utils.RespondError(c, http.StatusBadRequest, "theme query parameter is required")
		return
	}

	var congress models.Congress
	if err := h.db.First(&congress, "id = ?", congressID).Error; err != nil {
		utils.RespondError(c, http.StatusNotFound, "Congress not found")
		return
	}

	config := map[string]interface{}{}
	if congress.Config != nil {
		jsonBytes, _ := congress.Config.MarshalJSON()
		json.Unmarshal(jsonBytes, &config)
	}

	coordinators := []map[string]interface{}{}
	if existing, ok := config["thematic_coordinators"]; ok {
		if coordList, ok := existing.([]interface{}); ok {
			for _, c := range coordList {
				if cm, ok := c.(map[string]interface{}); ok {
					if cm["theme"] != theme {
						coordinators = append(coordinators, cm)
					}
				}
			}
		}
	}

	config["thematic_coordinators"] = coordinators
	jsonBytes, _ := json.Marshal(config)
	congress.Config = jsonBytes
	h.db.Model(&congress).Update("config", congress.Config)

	utils.RespondSuccess(c, http.StatusOK, gin.H{
		"message":       "Coordinator removed",
		"coordinators":  coordinators,
	})
}

// ListCoordinators lists all thematic coordinators for the congress
func (h *ThematicCoordinatorHandler) ListCoordinators(c *gin.Context) {
	congressID, _, err := getCongressIDFromContext(c)
	if err != nil {
		utils.RespondError(c, http.StatusForbidden, err.Error())
		return
	}

	var congress models.Congress
	if err := h.db.First(&congress, "id = ?", congressID).Error; err != nil {
		utils.RespondError(c, http.StatusNotFound, "Congress not found")
		return
	}

	result := []map[string]interface{}{}
	if congress.Config != nil {
		config := map[string]interface{}{}
		jsonBytes, _ := congress.Config.MarshalJSON()
		if err := json.Unmarshal(jsonBytes, &config); err == nil {
			if existing, ok := config["thematic_coordinators"]; ok {
				if coordList, ok := existing.([]interface{}); ok {
					for _, c := range coordList {
						if cm, ok := c.(map[string]interface{}); ok {
							result = append(result, cm)
						}
					}
				}
			}
		}
	}

	utils.RespondSuccess(c, http.StatusOK, result)
}
