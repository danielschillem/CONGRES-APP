package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/datatypes"
	"gorm.io/gorm"
)

type Review struct {
	ID           uuid.UUID      `json:"id" gorm:"type:uuid;default:gen_random_uuid();primaryKey"`
	SoumissionID uuid.UUID      `json:"soumission_id" gorm:"type:uuid;not null;index"`
	Soumission   Soumission     `json:"soumission,omitempty" gorm:"foreignKey:SoumissionID"`
	ReviewerID   uuid.UUID      `json:"reviewer_id" gorm:"type:uuid;not null;index"`
	Reviewer     User           `json:"reviewer,omitempty" gorm:"foreignKey:ReviewerID"`
	ReviewGridID *uuid.UUID     `json:"review_grid_id" gorm:"type:uuid;index"`
	Scores       datatypes.JSON `json:"scores" gorm:"type:jsonb"` // []CriterionScore
	OverallScore float64        `json:"overall_score" gorm:"default:0"`
	Comment      string         `json:"comment"`
	Status       string         `json:"status" gorm:"default:'assigned'"` // assigned, in_progress, completed
	CreatedAt    time.Time      `json:"created_at"`
	UpdatedAt    time.Time      `json:"updated_at"`
}

func (review *Review) BeforeCreate(tx *gorm.DB) error {
	if review.ID == uuid.Nil {
		review.ID = uuid.New()
	}
	return nil
}
