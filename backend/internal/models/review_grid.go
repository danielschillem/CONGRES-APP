package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type ReviewGrid struct {
	ID         uuid.UUID         `json:"id" gorm:"type:uuid;default:gen_random_uuid();primaryKey"`
	CongressID uuid.UUID         `json:"congress_id" gorm:"type:uuid;not null;index"`
	Name       string            `json:"name" gorm:"not null"`
	IsActive   bool              `json:"is_active" gorm:"default:false"`
	Criteria   []ReviewCriterion `json:"criteria,omitempty" gorm:"foreignKey:ReviewGridID"`
	CreatedAt  time.Time         `json:"created_at"`
	UpdatedAt  time.Time         `json:"updated_at"`
}

type ReviewCriterion struct {
	ID           uuid.UUID `json:"id" gorm:"type:uuid;default:gen_random_uuid();primaryKey"`
	ReviewGridID uuid.UUID `json:"review_grid_id" gorm:"type:uuid;not null;index"`
	Name         string    `json:"name" gorm:"not null"`
	Description  string    `json:"description"`
	MaxScore     int       `json:"max_score" gorm:"not null;default:10"`
	Weight       float64   `json:"weight" gorm:"not null;default:1.0"`
	SortOrder    int       `json:"sort_order" gorm:"default:0"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

func (criterion *ReviewCriterion) BeforeCreate(tx *gorm.DB) error {
	if criterion.ID == uuid.Nil {
		criterion.ID = uuid.New()
	}
	return nil
}

// CriterionScore stores a score for one criterion within a review
type CriterionScore struct {
	CriterionID   string `json:"criterion_id"`
	CriterionName string `json:"criterion_name"`
	Score         int    `json:"score"`
	MaxScore      int    `json:"max_score"`
}

// CriterionScoreInput is used for submitting review scores
type CriterionScoreInput struct {
	CriterionID string `json:"criterion_id" binding:"required"`
	Score       int    `json:"score" binding:"required,min=0"`
}
