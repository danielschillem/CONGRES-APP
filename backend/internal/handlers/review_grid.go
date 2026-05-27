package handlers

import (
	"net/http"

	"congres-app/backend/internal/models"
	"congres-app/backend/pkg/utils"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type ReviewGridHandler struct {
	db *gorm.DB
}

func NewReviewGridHandler(db *gorm.DB) *ReviewGridHandler {
	return &ReviewGridHandler{db: db}
}

type CreateGridRequest struct {
	Name     string `json:"name" binding:"required"`
	IsActive bool   `json:"is_active"`
}

type UpdateGridRequest struct {
	Name     *string `json:"name"`
	IsActive *bool   `json:"is_active"`
}

type CreateCriterionRequest struct {
	Name        string  `json:"name" binding:"required"`
	Description string  `json:"description"`
	MaxScore    int     `json:"max_score" binding:"required,min=1"`
	Weight      float64 `json:"weight" binding:"min=0"`
	SortOrder   int     `json:"sort_order"`
}

type UpdateCriterionRequest struct {
	Name        *string  `json:"name"`
	Description *string  `json:"description"`
	MaxScore    *int     `json:"max_score" binding:"min=1"`
	Weight      *float64 `json:"weight" binding:"min=0"`
	SortOrder   *int     `json:"sort_order"`
}

// ListGrids lists all review grids for the current congress
func (h *ReviewGridHandler) ListGrids(c *gin.Context) {
	congressID, _, err := getCongressIDFromContext(c)
	if err != nil {
		utils.RespondError(c, http.StatusForbidden, err.Error())
		return
	}

	var grids []models.ReviewGrid
	query := h.db.Where("congress_id = ?", congressID).Preload("Criteria", func(db *gorm.DB) *gorm.DB {
		return db.Order("sort_order asc")
	}).Order("created_at desc")

	if err := query.Find(&grids).Error; err != nil {
		utils.RespondError(c, http.StatusInternalServerError, "Failed to fetch review grids")
		return
	}

	utils.RespondSuccess(c, http.StatusOK, grids)
}

// CreateGrid creates a new review grid
func (h *ReviewGridHandler) CreateGrid(c *gin.Context) {
	congressID, _, err := getCongressIDFromContext(c)
	if err != nil {
		utils.RespondError(c, http.StatusForbidden, err.Error())
		return
	}

	var req CreateGridRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.RespondError(c, http.StatusBadRequest, err.Error())
		return
	}

	// If is_active, deactivate all other grids
	if req.IsActive {
		h.db.Model(&models.ReviewGrid{}).Where("congress_id = ?", congressID).Update("is_active", false)
	}

	grid := models.ReviewGrid{
		CongressID: congressID,
		Name:       req.Name,
		IsActive:   req.IsActive,
	}

	if err := h.db.Create(&grid).Error; err != nil {
		utils.RespondError(c, http.StatusInternalServerError, "Failed to create review grid")
		return
	}

	utils.RespondSuccess(c, http.StatusCreated, grid)
}

// UpdateGrid updates a review grid
func (h *ReviewGridHandler) UpdateGrid(c *gin.Context) {
	congressID, _, err := getCongressIDFromContext(c)
	if err != nil {
		utils.RespondError(c, http.StatusForbidden, err.Error())
		return
	}

	gridID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		utils.RespondError(c, http.StatusBadRequest, "Invalid grid ID")
		return
	}

	var grid models.ReviewGrid
	if err := h.db.Where("id = ? AND congress_id = ?", gridID, congressID).First(&grid).Error; err != nil {
		utils.RespondError(c, http.StatusNotFound, "Review grid not found")
		return
	}

	var req UpdateGridRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.RespondError(c, http.StatusBadRequest, err.Error())
		return
	}

	// If activating, deactivate all others
	if req.IsActive != nil && *req.IsActive && !grid.IsActive {
		h.db.Model(&models.ReviewGrid{}).Where("congress_id = ?", congressID).Update("is_active", false)
	}

	updates := map[string]interface{}{}
	if req.Name != nil {
		updates["name"] = *req.Name
	}
	if req.IsActive != nil {
		updates["is_active"] = *req.IsActive
	}

	if len(updates) > 0 {
		if err := h.db.Model(&grid).Updates(updates).Error; err != nil {
			utils.RespondError(c, http.StatusInternalServerError, "Failed to update review grid")
			return
		}
	}

	h.db.First(&grid, "id = ?", gridID)
	utils.RespondSuccess(c, http.StatusOK, grid)
}

// DeleteGrid deletes a review grid and its criteria
func (h *ReviewGridHandler) DeleteGrid(c *gin.Context) {
	congressID, _, err := getCongressIDFromContext(c)
	if err != nil {
		utils.RespondError(c, http.StatusForbidden, err.Error())
		return
	}

	gridID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		utils.RespondError(c, http.StatusBadRequest, "Invalid grid ID")
		return
	}

	var grid models.ReviewGrid
	if err := h.db.Where("id = ? AND congress_id = ?", gridID, congressID).First(&grid).Error; err != nil {
		utils.RespondError(c, http.StatusNotFound, "Review grid not found")
		return
	}

	// Delete associated criteria first
	h.db.Where("review_grid_id = ?", gridID).Delete(&models.ReviewCriterion{})
	if err := h.db.Delete(&grid).Error; err != nil {
		utils.RespondError(c, http.StatusInternalServerError, "Failed to delete review grid")
		return
	}

	utils.RespondSuccess(c, http.StatusOK, gin.H{"message": "Review grid deleted"})
}

// ListCriteria lists all criteria for a grid
func (h *ReviewGridHandler) ListCriteria(c *gin.Context) {
	gridID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		utils.RespondError(c, http.StatusBadRequest, "Invalid grid ID")
		return
	}

	var criteria []models.ReviewCriterion
	if err := h.db.Where("review_grid_id = ?", gridID).Order("sort_order asc").Find(&criteria).Error; err != nil {
		utils.RespondError(c, http.StatusInternalServerError, "Failed to fetch criteria")
		return
	}

	utils.RespondSuccess(c, http.StatusOK, criteria)
}

// CreateCriterion adds a criterion to a grid
func (h *ReviewGridHandler) CreateCriterion(c *gin.Context) {
	congressID, _, err := getCongressIDFromContext(c)
	if err != nil {
		utils.RespondError(c, http.StatusForbidden, err.Error())
		return
	}

	gridID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		utils.RespondError(c, http.StatusBadRequest, "Invalid grid ID")
		return
	}

	var grid models.ReviewGrid
	if err := h.db.Where("id = ? AND congress_id = ?", gridID, congressID).First(&grid).Error; err != nil {
		utils.RespondError(c, http.StatusNotFound, "Review grid not found")
		return
	}

	var req CreateCriterionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.RespondError(c, http.StatusBadRequest, err.Error())
		return
	}

	if req.MaxScore < 1 {
		req.MaxScore = 10
	}
	if req.Weight <= 0 {
		req.Weight = 1.0
	}

	criterion := models.ReviewCriterion{
		ReviewGridID: gridID,
		Name:         req.Name,
		Description:  req.Description,
		MaxScore:     req.MaxScore,
		Weight:       req.Weight,
		SortOrder:    req.SortOrder,
	}

	if err := h.db.Create(&criterion).Error; err != nil {
		utils.RespondError(c, http.StatusInternalServerError, "Failed to create criterion")
		return
	}

	utils.RespondSuccess(c, http.StatusCreated, criterion)
}

// UpdateCriterion updates a criterion
func (h *ReviewGridHandler) UpdateCriterion(c *gin.Context) {
	criterionID, err := uuid.Parse(c.Param("criterionId"))
	if err != nil {
		utils.RespondError(c, http.StatusBadRequest, "Invalid criterion ID")
		return
	}

	var criterion models.ReviewCriterion
	if err := h.db.First(&criterion, "id = ?", criterionID).Error; err != nil {
		utils.RespondError(c, http.StatusNotFound, "Criterion not found")
		return
	}

	var req UpdateCriterionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.RespondError(c, http.StatusBadRequest, err.Error())
		return
	}

	updates := map[string]interface{}{}
	if req.Name != nil {
		updates["name"] = *req.Name
	}
	if req.Description != nil {
		updates["description"] = *req.Description
	}
	if req.MaxScore != nil {
		updates["max_score"] = *req.MaxScore
	}
	if req.Weight != nil {
		updates["weight"] = *req.Weight
	}
	if req.SortOrder != nil {
		updates["sort_order"] = *req.SortOrder
	}

	if len(updates) > 0 {
		if err := h.db.Model(&criterion).Updates(updates).Error; err != nil {
			utils.RespondError(c, http.StatusInternalServerError, "Failed to update criterion")
			return
		}
	}

	h.db.First(&criterion, "id = ?", criterionID)
	utils.RespondSuccess(c, http.StatusOK, criterion)
}

// DeleteCriterion removes a criterion
func (h *ReviewGridHandler) DeleteCriterion(c *gin.Context) {
	criterionID, err := uuid.Parse(c.Param("criterionId"))
	if err != nil {
		utils.RespondError(c, http.StatusBadRequest, "Invalid criterion ID")
		return
	}

	if err := h.db.Delete(&models.ReviewCriterion{}, "id = ?", criterionID).Error; err != nil {
		utils.RespondError(c, http.StatusInternalServerError, "Failed to delete criterion")
		return
	}

	utils.RespondSuccess(c, http.StatusOK, gin.H{"message": "Criterion deleted"})
}

// GetActiveGrid returns the active review grid for a congress (with criteria)
func (h *ReviewGridHandler) GetActiveGrid(c *gin.Context) {
	var grid models.ReviewGrid

	// Try from congress context
	congressID, _, err := getCongressIDFromContext(c)
	if err == nil && congressID != uuid.Nil {
		if err := h.db.Where("congress_id = ? AND is_active = ?", congressID, true).Preload("Criteria", func(db *gorm.DB) *gorm.DB {
			return db.Order("sort_order asc")
		}).First(&grid).Error; err == nil {
			utils.RespondSuccess(c, http.StatusOK, grid)
			return
		}
	}

	// Try from query param
	cID := c.Query("congress_id")
	if cID != "" {
		cid, err := uuid.Parse(cID)
		if err == nil {
			if err := h.db.Where("congress_id = ? AND is_active = ?", cid, true).Preload("Criteria", func(db *gorm.DB) *gorm.DB {
				return db.Order("sort_order asc")
			}).First(&grid).Error; err == nil {
				utils.RespondSuccess(c, http.StatusOK, grid)
				return
			}
		}
	}

	utils.RespondSuccess(c, http.StatusOK, nil)
}
