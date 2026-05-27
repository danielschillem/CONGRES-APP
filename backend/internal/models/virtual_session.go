package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type VirtualSession struct {
	ID               uuid.UUID      `json:"id" gorm:"type:uuid;default:gen_random_uuid();primaryKey"`
	CongressID       uuid.UUID      `json:"congress_id" gorm:"type:uuid;not null;index"`
	Congress         Congress       `json:"-" gorm:"foreignKey:CongressID"`
	Title            string         `json:"title" gorm:"not null"`
	Description      string         `json:"description"`
	SessionType      string         `json:"session_type" gorm:"not null;default:'presentation'"`
	StartTime        time.Time      `json:"start_time" gorm:"not null"`
	EndTime          time.Time      `json:"end_time" gorm:"not null"`
	RoomName         string         `json:"room_name" gorm:"uniqueIndex;not null"`
	Password         string         `json:"password"`
	MaxParticipants  int            `json:"max_participants" gorm:"default:50"`
	Status           string         `json:"status" gorm:"default:'scheduled'"`
	RecordingEnabled bool           `json:"recording_enabled" gorm:"default:false"`
	CreatedBy        uuid.UUID      `json:"created_by" gorm:"type:uuid;not null"`
	CreatedAt        time.Time      `json:"created_at"`
	UpdatedAt        time.Time      `json:"updated_at"`
	DeletedAt        gorm.DeletedAt `json:"-" gorm:"index"`
}
