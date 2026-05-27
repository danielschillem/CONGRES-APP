package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type ProgramSlot struct {
	ID           uuid.UUID      `json:"id" gorm:"type:uuid;default:gen_random_uuid();primaryKey"`
	CongressID   uuid.UUID      `json:"congress_id" gorm:"type:uuid;not null;index"`
	Congress     Congress       `json:"-" gorm:"foreignKey:CongressID"`
	SoumissionID *uuid.UUID     `json:"soumission_id" gorm:"type:uuid;index"`
	Soumission   *Soumission    `json:"soumission,omitempty" gorm:"foreignKey:SoumissionID"`
	Title        string         `json:"title" gorm:"not null"`
	Date         string         `json:"date" gorm:"not null"`
	StartTime    string         `json:"start_time" gorm:"not null"`
	EndTime      string         `json:"end_time" gorm:"not null"`
	Location     string         `json:"location"`
	SessionType  string         `json:"session_type" gorm:"default:'presentation'"` // plenary, parallel, poster, workshop
	Order        int            `json:"order" gorm:"default:0"`
	CreatedBy    uuid.UUID      `json:"created_by" gorm:"type:uuid;not null"`
	CreatedAt    time.Time      `json:"created_at"`
	UpdatedAt    time.Time      `json:"updated_at"`
	DeletedAt    gorm.DeletedAt `json:"-" gorm:"index"`
}
