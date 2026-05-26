package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/datatypes"
)

type Notification struct {
	ID             uuid.UUID      `json:"id" gorm:"type:uuid;default:gen_random_uuid();primaryKey"`
	Type           string         `json:"type" gorm:"not null"`
	NotifiableID   uuid.UUID      `json:"notifiable_id" gorm:"type:uuid;not null"`
	NotifiableType string         `json:"notifiable_type" gorm:"not null"`
	Data           datatypes.JSON `json:"data" gorm:"type:jsonb"`
	ReadAt         *time.Time     `json:"read_at"`
	CreatedAt      time.Time      `json:"created_at"`
	UpdatedAt      time.Time      `json:"updated_at"`
}
