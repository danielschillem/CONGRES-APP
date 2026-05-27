package handlers

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"

	"congres-app/backend/internal/config"
	"congres-app/backend/internal/middleware"
	"congres-app/backend/internal/models"
	"congres-app/backend/pkg/utils"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type ReviewerHandler struct {
	db  *gorm.DB
	cfg *config.Config
}

func NewReviewerHandler(db *gorm.DB, cfg *config.Config) *ReviewerHandler {
	return &ReviewerHandler{db: db, cfg: cfg}
}

type SubmitReviewRequest struct {
	Scores  []models.CriterionScoreInput `json:"scores" binding:"required,dive"`
	Comment string                       `json:"comment" binding:"required,max=2000"`
}

// ListMyAssignments lists all reviews assigned to the current reviewer.
func (h *ReviewerHandler) ListMyAssignments(c *gin.Context) {
	userIDStr, _ := c.Get(middleware.ContextUserID)
	userID, err := uuid.Parse(userIDStr.(string))
	if err != nil {
		utils.RespondError(c, http.StatusUnauthorized, "Invalid user ID")
		return
	}

	statusFilter := c.Query("status")

	query := h.db.Where("reviewer_id = ?", userID).
		Preload("Soumission").
		Preload("ReviewGrid")

	if statusFilter != "" {
		allowed := map[string]bool{"assigned": true, "in_progress": true, "completed": true}
		if !allowed[statusFilter] {
			utils.RespondError(c, http.StatusBadRequest, "Invalid status filter (assigned, in_progress, completed)")
			return
		}
		query = query.Where("status = ?", statusFilter)
	}

	var reviews []models.Review
	if err := query.Order("created_at desc").Find(&reviews).Error; err != nil {
		utils.RespondError(c, http.StatusInternalServerError, "Failed to fetch assignments")
		return
	}

	utils.RespondSuccess(c, http.StatusOK, reviews)
}

// StartReview marks a review as in_progress.
func (h *ReviewerHandler) StartReview(c *gin.Context) {
	userIDStr, _ := c.Get(middleware.ContextUserID)
	userID, _ := uuid.Parse(userIDStr.(string))

	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		utils.RespondError(c, http.StatusBadRequest, "Invalid review ID")
		return
	}

	var review models.Review
	if err := h.db.Where("id = ? AND reviewer_id = ?", id, userID).First(&review).Error; err != nil {
		utils.RespondError(c, http.StatusNotFound, "Review assignment not found")
		return
	}

	if review.Status != "assigned" {
		utils.RespondError(c, http.StatusBadRequest, "Review is not in assigned status")
		return
	}

	if err := h.db.Model(&review).Update("status", "in_progress").Error; err != nil {
		utils.RespondError(c, http.StatusInternalServerError, "Failed to start review")
		return
	}

	// Load the active grid if not set
	if review.ReviewGridID == nil {
		var activeGrid models.ReviewGrid
		if err := h.db.Where("is_active = ?", true).First(&activeGrid).Error; err == nil {
			h.db.Model(&review).Update("review_grid_id", activeGrid.ID)
		}
	}

	h.db.Preload("Soumission").Preload("ReviewGrid").First(&review, "id = ?", id)
	utils.RespondSuccess(c, http.StatusOK, review)
}

// SubmitReview submits the final review with per-criterion scores and comment.
func (h *ReviewerHandler) SubmitReview(c *gin.Context) {
	userIDStr, _ := c.Get(middleware.ContextUserID)
	userID, _ := uuid.Parse(userIDStr.(string))

	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		utils.RespondError(c, http.StatusBadRequest, "Invalid review ID")
		return
	}

	var req SubmitReviewRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.RespondError(c, http.StatusBadRequest, "scores and comment are required")
		return
	}

	var review models.Review
	if err := h.db.Where("id = ? AND reviewer_id = ?", id, userID).
		Preload("Soumission").
		Preload("ReviewGrid").
		First(&review).Error; err != nil {
		utils.RespondError(c, http.StatusNotFound, "Review assignment not found")
		return
	}

	if review.Status == "completed" {
		utils.RespondError(c, http.StatusBadRequest, "Review already completed")
		return
	}

	// Build criterion scores with names
	var criterionScores []models.CriterionScore
	var overallScore float64
	var totalWeight float64

	// Load grid criteria if review grid is set
	var criteria []models.ReviewCriterion
	if review.ReviewGridID != nil {
		h.db.Where("review_grid_id = ?", review.ReviewGridID).Order("sort_order asc").Find(&criteria)
	}

	for _, input := range req.Scores {
		cID, err := uuid.Parse(input.CriterionID)
		cName := ""
		cMaxScore := 10
		cWeight := 1.0

		if err == nil {
			for _, cr := range criteria {
				if cr.ID == cID || cr.ID.String() == input.CriterionID {
					cName = cr.Name
					cMaxScore = cr.MaxScore
					cWeight = cr.Weight
					break
				}
			}
		}

		// Clamp score
		if input.Score < 0 {
			input.Score = 0
		}
		if input.Score > cMaxScore {
			input.Score = cMaxScore
		}

		criterionScores = append(criterionScores, models.CriterionScore{
			CriterionID:   input.CriterionID,
			CriterionName: cName,
			Score:         input.Score,
			MaxScore:      cMaxScore,
		})

		overallScore += float64(input.Score) * cWeight
		totalWeight += cWeight
	}

	if totalWeight > 0 {
		overallScore = overallScore / totalWeight
	}

	scoresJSON, _ := json.Marshal(criterionScores)

	review.Scores = scoresJSON
	review.OverallScore = overallScore
	review.Comment = req.Comment
	review.Status = "completed"

	if err := h.db.Model(&review).Select("Scores", "OverallScore", "Comment", "Status").Updates(&review).Error; err != nil {
		utils.RespondError(c, http.StatusInternalServerError, "Failed to submit review")
		return
	}

	// Notify admins about completed review
	go func() {
		defer func() {
			if r := recover(); r != nil {
				log.Printf("[PANIC] SubmitReview notification: %v", r)
			}
		}()
		var soumission models.Soumission
		if err := h.db.First(&soumission, "id = ?", review.SoumissionID).Error; err == nil {
			createAdminNotification(h.db, "review_completed",
				&soumission,
				fmt.Sprintf("Review terminé pour la soumission \"%s\" (score: %.1f/10)", soumission.DocumentTitle, overallScore),
			)
		}
	}()

	utils.RespondSuccess(c, http.StatusOK, review)
}

// GetReviewStats returns aggregate review stats for a submission.
func (h *ReviewerHandler) GetReviewStats(c *gin.Context) {
	soumissionID, err := uuid.Parse(c.Param("soumissionId"))
	if err != nil {
		utils.RespondError(c, http.StatusBadRequest, "Invalid soumission ID")
		return
	}

	type ReviewStats struct {
		TotalReviews   int64   `json:"total_reviews"`
		AverageScore   float64 `json:"average_score"`
		CompletedCount int64   `json:"completed_count"`
		PendingCount   int64   `json:"pending_count"`
	}

	var stats ReviewStats
	h.db.Model(&models.Review{}).Where("soumission_id = ?", soumissionID).Count(&stats.TotalReviews)
	h.db.Model(&models.Review{}).Where("soumission_id = ? AND status = 'completed'", soumissionID).Count(&stats.CompletedCount)
	h.db.Model(&models.Review{}).Where("soumission_id = ? AND status != 'completed'", soumissionID).Count(&stats.PendingCount)
	h.db.Model(&models.Review{}).Where("soumission_id = ? AND status = 'completed'", soumissionID).Select("COALESCE(AVG(overall_score), 0)").Scan(&stats.AverageScore)

	utils.RespondSuccess(c, http.StatusOK, stats)
}

// ListReviewsForSubmission lists all reviews for a specific submission (admin).
func (h *ReviewerHandler) ListReviewsForSubmission(c *gin.Context) {
	soumissionID, err := uuid.Parse(c.Param("soumissionId"))
	if err != nil {
		utils.RespondError(c, http.StatusBadRequest, "Invalid soumission ID")
		return
	}

	var reviews []models.Review
	if err := h.db.Where("soumission_id = ?", soumissionID).
		Preload("Reviewer").
		Preload("ReviewGrid").
		Order("created_at desc").
		Find(&reviews).Error; err != nil {
		utils.RespondError(c, http.StatusInternalServerError, "Failed to fetch reviews")
		return
	}

	utils.RespondSuccess(c, http.StatusOK, reviews)
}

// GetReviewDetail returns full review details including scores
func (h *ReviewerHandler) GetReviewDetail(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		utils.RespondError(c, http.StatusBadRequest, "Invalid review ID")
		return
	}

	var review models.Review
	if err := h.db.Preload("Soumission").Preload("Reviewer").Preload("ReviewGrid").First(&review, "id = ?", id).Error; err != nil {
		utils.RespondError(c, http.StatusNotFound, "Review not found")
		return
	}

	utils.RespondSuccess(c, http.StatusOK, review)
}
