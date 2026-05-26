package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/datatypes"
)

type Congress struct {
	ID        uuid.UUID `json:"id" gorm:"type:uuid;default:gen_random_uuid();primaryKey"`
	Title     string    `json:"title" gorm:"not null"`
	Subtitle  string    `json:"subtitle"`
	Description string  `json:"description"`
	Edition   string    `json:"edition"`

	StartDate time.Time `json:"start_date" gorm:"not null"`
	EndDate   time.Time `json:"end_date" gorm:"not null"`

	Location string `json:"location" gorm:"not null"`
	City     string `json:"city"`
	Country  string `json:"country"`

	// Organizational structure as JSON (president, VP, committees, etc.)
	OrganisationalStructure datatypes.JSON `json:"organisational_structure" gorm:"type:jsonb"`

	// Full configuration as JSON (themes, submission types, pricing, deadlines, etc.)
	Config datatypes.JSON `json:"config" gorm:"type:jsonb"`

	// Badge configuration as JSON (template, fields, etc.)
	BadgeConfig datatypes.JSON `json:"badge_config" gorm:"type:jsonb"`

	// The congress admin user ID (auto-created)
	AdminID *uuid.UUID `json:"admin_id" gorm:"type:uuid"`

	// Whether attestations are available for download by participants
	AttestationsAvailable bool `json:"attestations_available" gorm:"default:false"`

	// Status: draft, active, completed, cancelled
	Status string `json:"status" gorm:"default:'draft'"`

	// Super admin who created this congress
	SuperAdminID uuid.UUID `json:"super_admin_id" gorm:"type:uuid;not null"`
	SuperAdmin   User      `json:"-" gorm:"foreignKey:SuperAdminID"`

	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}
