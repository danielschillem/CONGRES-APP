package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/datatypes"
)

type Proceeding struct {
	ID          uuid.UUID      `json:"id" gorm:"type:uuid;default:gen_random_uuid();primaryKey"`
	CongressID  uuid.UUID      `json:"congress_id" gorm:"type:uuid;not null;index"`
	Congress    Congress       `json:"-" gorm:"foreignKey:CongressID"`
	Title       string         `json:"title" gorm:"not null"`
	Subtitle    string         `json:"subtitle"`
	Description string         `json:"description"`
	CoverImage  string         `json:"cover_image"`
	Metadata    datatypes.JSON `json:"metadata" gorm:"type:jsonb"` // ISBN, DOI, editors, etc.
	Status      string         `json:"status" gorm:"default:'draft'"` // draft, published, archived
	PublishedAt *time.Time     `json:"published_at"`
	CreatedBy   uuid.UUID      `json:"created_by" gorm:"type:uuid;not null"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
}

type ProceedingSubmission struct {
	ID            uuid.UUID  `json:"id" gorm:"type:uuid;default:gen_random_uuid();primaryKey"`
	ProceedingID  uuid.UUID  `json:"proceeding_id" gorm:"type:uuid;not null;index"`
	Proceeding    Proceeding `json:"-" gorm:"foreignKey:ProceedingID"`
	SoumissionID  uuid.UUID  `json:"soumission_id" gorm:"type:uuid;not null;index"`
	Soumission    Soumission `json:"soumission,omitempty" gorm:"foreignKey:SoumissionID"`
	Order         int        `json:"order" gorm:"default:0"`
	SectionTitle  string     `json:"section_title"`
	PageStart     int        `json:"page_start"`
	PageEnd       int        `json:"page_end"`
	CreatedAt     time.Time  `json:"created_at"`
}
